
'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, limit, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Bell, Scissors } from 'lucide-react';

export function NotificationListener() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const lastProcessedTime = useRef<number>(Date.now());

  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'notifications'),
      where('toId', '==', user.uid),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, user]);

  const { data: notifications } = useCollection(notificationsQuery);

  useEffect(() => {
    if (notifications && notifications.length > 0) {
      notifications.forEach((notif) => {
        const createdAt = notif.createdAt instanceof Timestamp ? notif.createdAt.toMillis() : 0;
        
        // Apenas processar notificações novas criadas após o componente carregar
        if (createdAt > lastProcessedTime.current) {
          toast({
            title: "Novo Agendamento!",
            description: notif.message,
            action: (
              <div className="bg-primary p-2 rounded-full">
                <Scissors className="w-4 h-4 text-primary-foreground" />
              </div>
            ),
          });
          
          // Marcar como lida para não repetir
          if (db) {
            const notifRef = doc(db, 'notifications', notif.id);
            updateDoc(notifRef, { read: true });
          }
        }
      });
      
      // Atualizar o tempo da última processada para o tempo da mais recente do lote
      const newest = Math.max(...notifications.map(n => 
        n.createdAt instanceof Timestamp ? n.createdAt.toMillis() : 0
      ));
      if (newest > lastProcessedTime.current) {
        lastProcessedTime.current = newest;
      }
    }
  }, [notifications, toast, db]);

  return null;
}
