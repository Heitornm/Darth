import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Inicialização segura do Firebase Admin SDK no ambiente Serverless da Vercel.
 * Carrega a credencial via JSON (FIREBASE_SERVICE_ACCOUNT_KEY) ou variáveis individuais.
 */
function getAdminApp() {
  if (getApps().length > 0) {
    return getApp();
  }

  // 1. Tenta carregar a Service Account completa do JSON via variável de ambiente
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

  // 2. Tenta carregar variáveis de chave privada individuais
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

  // 3. Fallback seguro: Inicialização sem credencial administrativa (apenas leitura pública)
  console.warn("⚠️ [Firebase Admin] Nenhuma credencial de Service Account encontrada. Configure FIREBASE_SERVICE_ACCOUNT_KEY na Vercel.");
  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'darthbarber-default',
  });
}

const adminApp = getAdminApp();
const adminDb = getFirestore(adminApp);

export { adminApp, adminDb };