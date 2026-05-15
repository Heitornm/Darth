// 1. Exporta a inicialização do cliente (db, auth, app) de forma global
export * from '@/lib/firebase';

// 2. Exporta os hooks nativos do Firestore (as coleções e documentos)
export { default as useCollection } from './firestore/use-collection';
export { default as useDoc } from './firestore/use-doc';

// 3. Exporta EXPLICITAMENTE tudo o que está dentro do seu provider.tsx
export {
    FirebaseProvider,
    FirebaseContext,
    useFirebase,
    useAuth,
    useFirestore,
    useFirebaseApp,
    useMemoFirebase,
    useUser
} from './provider';

// 4. Exporta o Client Provider global
export { FirebaseClientProvider } from './client-provider';

// 5. Exporta listeners de erro e utilitários complementares
export * from './error-emitter';
export * from './errors';
export * from './non-blocking-login';
export * from './non-blocking-updates';