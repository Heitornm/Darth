'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Scissors, AlertTriangle, DollarSign } from 'lucide-react'; // 👈 Removido o 'Bell'

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

        if (createdAt > lastProcessedTime.current) {
          let IconComponent = Scissors;
          let iconBg = 'bg-primary';

          if (notif.type === 'cancellation_request') {
            IconComponent = AlertTriangle;
            iconBg = 'bg-amber-500';
          } else if (notif.type === 'payment_confirmed') {
            IconComponent = DollarSign;
            iconBg = 'bg-emerald-500';
          }

          toast({
            title: notif.title || 'Novo Aviso!',
            description: notif.message,
            variant: notif.type === 'cancellation_request' ? 'destructive' : 'default',
            action: (
              <div className={`${iconBg} p-2 rounded-full text-white`}>
                <IconComponent className="w-4 h-4 text-primary-foreground" />
              </div>
            ),
          });

          try {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.6;
            audio.play().catch(() => {});
          } catch (e) {
            console.error('Erro ao reproduzir som do aviso:', e);
          }
        }
      });

      const newest = Math.max(
        ...notifications.map((n) =>
          n.createdAt instanceof Timestamp ? n.createdAt.toMillis() : 0
        )
      );
      if (newest > lastProcessedTime.current) {
        lastProcessedTime.current = newest;
      }
    }
  }, [notifications, toast]);

  return null;
}