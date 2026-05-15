import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  // 1. Remove aspas sobressalentes que o Render pode adicionar e conserta os escapes de quebra de linha (\n)
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (privateKey) {
    // Se a string veio envolta em aspas por conta da configuração do painel, remove as aspas das pontas
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    // Transforma a string \n digitada em quebra de linha real (formato PEM válido)
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth };