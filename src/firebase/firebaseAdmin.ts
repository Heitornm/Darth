import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

try {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (rawKey) {
    if (!getApps().length) {
      // Trata possíveis quebras de linha que invalidam o JSON.parse em variáveis de ambiente
      const formattedKey = rawKey.replace(/\\n/g, '\n');
      const serviceAccount = typeof formattedKey === 'string' ? JSON.parse(formattedKey) : formattedKey;

      const app = initializeApp({
        credential: cert(serviceAccount),
      });

      adminAuth = getAuth(app);
      adminDb = getFirestore(app);
    } else {
      const app = getApp();
      adminAuth = getAuth(app);
      adminDb = getFirestore(app);
    }
  } else {
    console.warn('⚠️ [Firebase Admin] Variável FIREBASE_SERVICE_ACCOUNT não encontrada.');
  }
} catch (error) {
  console.error('⚠️ [Firebase Admin] Falha ao inicializar o Firebase Admin SDK:', error);
}

export { adminAuth, adminDb };