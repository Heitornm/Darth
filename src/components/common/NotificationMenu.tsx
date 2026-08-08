'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, Trash2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export function NotificationMenu() {
  const { user } = useUser();
  const db = useFirestore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
          const list: NotificationItem[] = [];
          let unread = 0;

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (!data.read) unread++;
            list.push({
              id: docSnap.id,
              title: data.title || 'Notificação',
              message: data.message || '',
              read: !!data.read,
              createdAt: data.createdAt,
            });
          });

          setNotifications(list);
          setUnreadCount(unread);
        },
        (err) => {
          console.warn('Aguardando criação do índice de notificações:', err.message);
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
    }
  }, [user, db]);

  const markAsRead = async (id: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
    }
  };

  const removeNotification = async (id: string) => {
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (err) {
      console.error('Erro ao remover notificação:', err);
    }
  };

  // Helper seguro para formatação de data
  const formatDateSafe = (dateVal: any): string => {
    if (!dateVal) return 'Recente';
    try {
      const d = dateVal instanceof Timestamp ? dateVal.toDate() : new Date(dateVal);
      if (isNaN(d.getTime())) return 'Recente';
      
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Recente';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full border border-border bg-card">
          <Bell className="w-4 h-4 text-primary" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-n8n-glow">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-card border-border">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h4 className="font-headline font-bold text-sm">Notificações</h4>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">{unreadCount} não lida(s)</span>
          )}
        </div>
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Nenhuma notificação por enquanto.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {notifications.map((item) => (
                <div 
                  key={item.id} 
                  className={`p-3.5 transition-colors flex items-start justify-between gap-2 ${
                    !item.read ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <p className="text-xs font-bold leading-tight">{item.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 pt-1">
                      {formatDateSafe(item.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!item.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                        onClick={() => markAsRead(item.id)}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => removeNotification(item.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}