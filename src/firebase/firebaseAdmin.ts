import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/**
 * Inicialização segura do Firebase Admin SDK no ambiente Node.js Serverless (Vercel).
 */
function getAdminApp(): App {
  // Se já existe uma instância iniciada, reutiliza-a
  const apps = getApps();
  if (apps.length > 0) {
    return apps[0]!;
  }

  // Opção A: Chave JSON completa via variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY
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

  // Opção C: Tenta Application Default Credentials
  try {
    return initializeApp();
  } catch (err) {
    console.error("⚠️ [Firebase Admin] Falha ao inicializar com credenciais padrão. Verifique as variáveis no painel da Vercel.");
    return initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

const adminApp = getAdminApp();
const adminDb = getFirestore(adminApp);
const adminAuth = getAuth(adminApp);

export { adminApp, adminDb, adminAuth };