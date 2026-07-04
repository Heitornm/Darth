import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT;
const apps = getApps();

if (rawKey && !apps.length) {
  try {
    const serviceAccount = JSON.parse(rawKey);

    const app = initializeApp({
      credential: cert(serviceAccount),
    });

    adminAuth = getAuth(app);
    adminDb = getFirestore(app);
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
} else if (apps.length) {
  // Se o app já foi inicializado, pegamos a instância existente através dos métodos getAuth/getFirestore
  adminAuth = getAuth();
  adminDb = getFirestore();
}

export { adminAuth, adminDb };