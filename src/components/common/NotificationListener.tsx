'use client';

import { useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function NotificationListener() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  useEffect(() => {
    if (!user || !db) return;

    try {
      const q = query(
        collection(db, 'notifications'),
        where('toId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const data = change.doc.data();

              // Evita disparar alerta para notificações antigas não lidas no carregamento inicial
              const createdAt = data.createdAt instanceof Timestamp 
                ? data.createdAt.toDate() 
                : new Date(data.createdAt || Date.now());

              const isRecent = (Date.now() - createdAt.getTime()) < 30000; // Criada nos últimos 30 segundos

              if (isRecent && !data.read) {
                toast({
                  title: data.title || 'Nova Notificação',
                  description: data.message || '',
                });
              }
            }
          });
        },
        (error) => {
          // Trata silenciosamente enquanto o índice do Firebase está em criação
          console.warn('Escuta de notificações aguardando índice do Firestore:', error.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Erro na inicialização do listener de notificações:', err);
    }
  }, [user, db, toast]);

  return null;
}