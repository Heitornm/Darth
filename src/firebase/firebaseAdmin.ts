import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Inicialização segura do Firebase Admin SDK no ambiente Serverless da Vercel (Next.js / Turbopack).
 */
function getAdminApp() {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  // Opção A: Chave JSON completa via variável de ambiente privada na Vercel
  const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountVar) {
    try {
      const serviceAccount = typeof serviceAccountVar === 'string' 
        ? JSON.parse(serviceAccountVar) 
        : serviceAccountVar;

      return initializeApp({
        credential: cert(serviceAccount),
      });
    } catch (e) {
      console.error("❌ Erro ao parsear a variável FIREBASE_SERVICE_ACCOUNT_KEY:", e);
    }
  }

  // Opção B: Variáveis individuais de chave privada
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    : undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (privateKey && clientEmail && projectId) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  // Opção C: Fallback básico por ID do projeto
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const adminApp = getAdminApp();
const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };