import * as admin from 'firebase-admin';

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;

// Só inicializa se a variável de ambiente estiver presente
const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (rawKey && !admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(rawKey);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    adminAuth = admin.auth();
    adminDb = admin.firestore();
  } catch (error) {
    console.error('Erro ao ler a Service Account do Firebase:', error);
  }
} else if (admin.apps.length) {
  adminAuth = admin.auth();
  adminDb = admin.firestore();
}

export { adminAuth, adminDb };