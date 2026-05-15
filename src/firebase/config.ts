// 1. Exporta a inicialização do cliente (db, auth, app)
export * from '@/lib/firebase';

// 2. Exporta os hooks personalizados do Firestore
export { default as useCollection } from './firestore/use-collection';
export { default as useDoc } from './firestore/use-doc';

// 3. Exporta os Providers e listeners de login/erros
export * from './provider';
export { FirebaseClientProvider } from './client-provider';
export * from './error-emitter';
export * from './errors';
export * from './non-blocking-login';
export * from './non-blocking-updates';

// 4. Se dentro do seu arquivo 'provider.tsx' ou outro existirem os hooks 
// 'useUser', 'useFirestore' e 'useMemoFirebase', eles já serão exportados pelo '*' acima.