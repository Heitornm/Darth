import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Se não houver apiKey durante o build, injetamos uma string qualquer pro SDK não quebrar
const isMissingKeys = !firebaseConfig.apiKey;

const app = isMissingKeys 
  ? (getApps().length > 0 ? getApp() : initializeApp({ apiKey: "BUILD_PLACEHOLDER_KEY" }))
  : (getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));

const auth = getAuth(app);
const db = getFirestore(app);

// Mantemos as exportações exatamente como seus outros componentes esperam
export { app, auth, db };