// 1. Inicialização do Cliente vinda da lib (Garante a exportação de app, auth e db)
import { app, auth, db } from '@/lib/firebase';
export { app, auth, db };

// 2. Elementos Core do Contexto (Hooks e Provider)
import { 
  FirebaseProvider, 
  FirebaseContext, 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useFirebaseApp, 
  useMemoFirebase, 
  useUser 
} from './provider';

export { 
  FirebaseProvider, 
  FirebaseContext, 
  useFirebase, 
  useAuth, 
  useFirestore, 
  useFirebaseApp, 
  useMemoFirebase, 
  useUser 
};

// 3. Client Provider Global
import { FirebaseClientProvider } from './client-provider';
export { FirebaseClientProvider };

// 4. Hooks de Coleção do Firestore
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
export { useCollection, useDoc };

// 5. Utilitários e Listeners Complementares (Se usarem 'db' ou 'useFirestore', agora o index já foi inicializado acima)
export * from './error-emitter';
export * from './errors';
export * from './non-blocking-login';
export * from './non-blocking-updates';