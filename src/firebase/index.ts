
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache } from 'firebase/firestore'

// Robust initialization to prevent INTERNAL ASSERTION FAILED and other hydration/state issues
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);

    // Initialize Firestore with explicit settings to avoid some common "Unexpected state" issues in dev
    const firestore = initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache()
    });

    return {
      firebaseApp,
      auth: getAuth(firebaseApp),
      firestore
    };
  }

  const app = getApp();
  return {
    firebaseApp: app,
    auth: getAuth(app),
    firestore: getFirestore(app)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
