'use client';

import React, {
  DependencyList,
  createContext,
  useContext,
  ReactNode,
  useMemo,
  useState,
  useEffect,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/common/FirebaseErrorListener';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, isPermissionDenied } from '@/firebase/errors';
import { isBarberUid } from '@/lib/barbers';

/**
 * Quantos dias de histórico o barbeiro carrega no contexto.
 * Aumente se alguma tela do barbeiro precisar de um período maior.
 */
const BARBER_HISTORY_DAYS = 90;

/** Data "YYYY-MM-DD" (fuso de São Paulo) de N dias atrás. */
function cutoffDateString(daysBack: number): string {
  const ms = Date.now() - daysBack * 24 * 60 * 60 * 1000;
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
}

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  userProfile: any | null;
  appointments: any[] | null;
  isBarber: boolean;
  isUserLoading: boolean;
  isProfileLoading: boolean;
  isAppointmentsLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(true);
  const [appointments, setAppointments] = useState<any[] | null>(null);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);
  const [hasBarberClaim, setHasBarberClaim] = useState(false);

  const uid = userAuthState.user?.uid ?? null;

  // Mesma regra do firestore.rules: UID da lista OU custom claim "barber".
  // (Email e o campo "role" do perfil NÃO concedem privilégio.)
  const isBarber = isBarberUid(uid) || hasBarberClaim;

  // 1. Escuta mudanças no estado de autenticação (Login / Logout)
  useEffect(() => {
    if (!auth) {
      setUserAuthState({
        user: null,
        isUserLoading: false,
        userError: new Error('Serviço de autenticação indisponível.'),
      });
      setIsProfileLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser: User | null) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
        if (!firebaseUser) {
          setUserProfile(null);
          setIsProfileLoading(false);
        }
      },
      (error: Error) => {
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
        setIsProfileLoading(false);
      }
    );
    return () => unsubscribe();
  }, [auth]);

  // 2. Custom claim "barber" (opcional; definido via firebase-admin)
  useEffect(() => {
    const currentUser = userAuthState.user;
    if (!currentUser) {
      setHasBarberClaim(false);
      return undefined;
    }

    let cancelled = false;
    currentUser
      .getIdTokenResult()
      .then((result) => {
        if (!cancelled) setHasBarberClaim(result.claims.barber === true);
      })
      .catch(() => {
        if (!cancelled) setHasBarberClaim(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userAuthState.user]);

  // 3. Escuta o perfil do usuário em tempo real (depende só do UID)
  useEffect(() => {
    if (!uid || !firestore) {
      setUserProfile(null);
      setIsProfileLoading(false);
      return undefined;
    }

    setIsProfileLoading(true);

    const unsubscribe = onSnapshot(
      doc(firestore, 'users', uid),
      (snap) => {
        if (snap.exists()) {
          setUserProfile({ ...snap.data(), id: snap.id });
        } else {
          setUserProfile(null);
        }
        setIsProfileLoading(false);
      },
      (err) => {
        console.error('Erro ao carregar perfil do usuário:', err);
        if (isPermissionDenied(err)) {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({ operation: 'get', path: `users/${uid}` })
          );
        }
        setIsProfileLoading(false);
      }
    );

    return () => unsubscribe();
  }, [uid, firestore]);

  // 4. Escuta os agendamentos em tempo real.
  // Depende só de uid/isBarber: gravar o perfil (tema, foto) NÃO refaz a leitura.
  // Barbeiro: últimos BARBER_HISTORY_DAYS dias em diante. Cliente: só os seus.
  useEffect(() => {
    if (!firestore || !uid) {
      setAppointments(null);
      setIsAppointmentsLoading(false);
      return undefined;
    }

    setIsAppointmentsLoading(true);

    const appointmentsCollection = collection(firestore, 'appointments');
    const q = isBarber
      ? query(appointmentsCollection, where('date', '>=', cutoffDateString(BARBER_HISTORY_DAYS)))
      : query(appointmentsCollection, where('clientId', '==', uid));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const apts = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setAppointments(apts);
        setIsAppointmentsLoading(false);
      },
      (err) => {
        console.error('Erro ao escutar agendamentos do Firestore:', err);
        if (isPermissionDenied(err)) {
          errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({ operation: 'list', path: 'appointments' })
          );
        }
        setIsAppointmentsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firestore, uid, isBarber]);

  // Valor memoizado do contexto para evitar re-renderizações desnecessárias
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      userProfile,
      appointments,
      isBarber,
      isUserLoading: userAuthState.isUserLoading,
      isProfileLoading,
      isAppointmentsLoading,
      userError: userAuthState.userError,
    };
  }, [
    firebaseApp,
    firestore,
    auth,
    userAuthState,
    userProfile,
    isBarber,
    isProfileLoading,
    appointments,
    isAppointmentsLoading,
  ]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase deve ser utilizado dentro de um FirebaseProvider.');
  }
  return context;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useFirebaseApp = () => useFirebase().firebaseApp;

type MemoFirebase<T> = T & { __memo?: boolean };
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | MemoFirebase<T> {
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = () => {
  const { user, userProfile, isBarber, isUserLoading, isProfileLoading, userError } = useFirebase();
  return {
    user,
    userProfile,
    isBarber,
    isLoading: isUserLoading || isProfileLoading,
    userError,
  };
};