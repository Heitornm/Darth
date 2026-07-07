'use client';

import { type ReactNode } from 'react';
import { FirebaseProvider } from './provider'; // ✅ Correção: Importação relativa limpa para quebrar o loop circular
import { app, auth, db } from '@/lib/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  return (
    <FirebaseProvider
      firebaseApp={app}
      auth={auth}
      firestore={db}
    >
      {children}
    </FirebaseProvider>
  );
}