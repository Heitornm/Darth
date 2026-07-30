'use client';

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, limit, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Scissors, AlertTriangle, DollarSign } from 'lucide-react';

export function NotificationListener() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const lastProcessedTime = useRef<number>(Date.now());

  const notificationsQuery = useMemoFirebase(() => {
    // Bloqueia a execução se a sessão ainda estiver carregando ou sem UID
    if (!db || !user?.uid || isUserLoading) return null;

    return query(
      collection(db, 'notifications'),
      where('toId', '==', user.uid),
      limit(10)
    );
  }, [db, user?.uid, isUserLoading]);

  const { data: rawNotifications } = useCollection(notificationsQuery);

  useEffect(() => {
    if (!rawNotifications || rawNotifications.length === 0) return;

    // Filtra notificações não lidas
    const unreadNotifications = rawNotifications.filter((n) => n.read === false);

    unreadNotifications.forEach((notif) => {
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

    // Processamento do timestamp mais recente via reduce
    const newestTimestamp = rawNotifications.reduce((latest, notif) => {
      const notifTime = notif.createdAt instanceof Timestamp ? notif.createdAt.toMillis() : 0;
      return notifTime > latest ? notifTime : latest;
    }, lastProcessedTime.current);

    lastProcessedTime.current = newestTimestamp;
  }, [rawNotifications, toast]);

  return null;
}