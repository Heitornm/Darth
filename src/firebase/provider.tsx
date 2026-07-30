'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/common/FirebaseErrorListener';

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
  isUserLoading: boolean;
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
  const [appointments, setAppointments] = useState<any[] | null>(null);
  const [isAppointmentsLoading, setIsAppointmentsLoading] = useState(false);

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null });
      },
      (error) => {
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!userAuthState.user || !firestore) {
      setUserProfile(null);
      return;
    }

    const unsubscribe = onSnapshot(doc(firestore, 'users', userAuthState.user.uid), (snap) => {
      if (snap.exists()) {
        setUserProfile({ ...snap.data(), id: snap.id });
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, [userAuthState.user, firestore]);

  useEffect(() => {
    // Garante a execução da query somente quando o usuário estiver autenticado
    if (!firestore || !userAuthState.user) {
      setAppointments(null);
      setIsAppointmentsLoading(false);
      return;
    }

    setIsAppointmentsLoading(true);
    
    const q = query(
      collection(firestore, 'appointments'), 
      where('clientId', '==', userAuthState.user.uid)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const apts = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setAppointments(apts);
      setIsAppointmentsLoading(false);
    }, (err) => {
      console.error("Erro ao buscar agendamentos do usuário:", err);
      setIsAppointmentsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, userAuthState.user]);

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
      isUserLoading: userAuthState.isUserLoading,
      isAppointmentsLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState, userProfile, appointments, isAppointmentsLoading]);

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
export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  if (typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  return memoized;
}

export const useUser = () => {
  const { user, userProfile, isUserLoading, userError } = useFirebase();
  return { user, userProfile, isUserLoading, userError };
};