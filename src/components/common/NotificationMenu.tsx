'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, orderBy, limit, doc, updateDoc, writeBatch, Timestamp } from 'firebase/firestore';
import { Bell, Check, Scissors, AlertTriangle, DollarSign, CheckCheck } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NotificationItem {
  id: string;
  title?: string;
  message: string;
  type?: 'new_appointment' | 'cancellation_request' | 'payment_confirmed';
  read: boolean;
  createdAt?: Timestamp;
}

export function NotificationMenu() {
  const { user } = useUser();
  const db = useFirestore();
  const [open, setOpen] = useState(false);

  // Consulta de notificações direcionadas ao usuário logado (máximo 15 mais recentes)
  const notificationsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'notifications'),
      where('toId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(15)
    );
  }, [db, user]);

  const { data: notifications } = useCollection<NotificationItem>(notificationsQuery);

  // Contador de não lidas
  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  // Marca uma notificação individual como lida
  const handleMarkAsRead = async (id: string) => {
    if (!db) return;
    try {
      const docRef = doc(db, 'notifications', id);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  // Marca todas as notificações visíveis como lidas de uma vez
  const handleMarkAllAsRead = async () => {
    if (!db || !notifications) return;
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter((n) => !n.read);

      unreadNotifications.forEach((n) => {
        const docRef = doc(db, 'notifications', n.id);
        batch.update(docRef, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  // Seleciona ícone e cor de fundo por tipo de aviso
  const getNotificationIcon = (type?: string) => {
    switch (type) {
      case 'cancellation_request':
        return (
          <div className="p-2 rounded-full bg-amber-500/10 text-amber-500 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        );
      case 'payment_confirmed':
        return (
          <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
            <Scissors className="w-4 h-4" />
          </div>
        );
    }
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-muted">
          <Bell className="w-5 h-5 text-foreground" />
          
          {unreadCount > 0 && (
            <>
              {/* Animação de pulso no contador */}
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-zinc-950 border border-background"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 sm:w-96 p-0 shadow-2xl border-border bg-card">
        {/* Cabeçalho do Popover */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] font-semibold">
                {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
              </Badge>
            )}
          </div>

          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground h-auto p-1"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Marcar todas
            </Button>
          )}
        </div>

        {/* Lista de Notificações */}
        <ScrollArea className="max-h-[380px] divide-y divide-border">
          {!notifications || notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Você não possui nenhuma notificação.
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-3.5 transition-colors ${
                  !notif.read ? 'bg-muted/40 hover:bg-muted/60' : 'hover:bg-muted/20 opacity-80'
                }`}
              >
                {getNotificationIcon(notif.type)}

                <div className="flex-1 space-y-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs font-semibold truncate ${!notif.read ? 'text-foreground font-bold' : 'text-muted-foreground'}`}>
                      {notif.title || 'Aviso'}
                    </p>
                    
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>

                  <p className="text-[10px] text-muted-foreground/70 pt-1">
                    {notif.createdAt instanceof Timestamp
                      ? new Date(notif.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Agora'}
                  </p>
                </div>

                {!notif.read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="h-6 w-6 rounded-full hover:bg-background shrink-0 text-muted-foreground hover:text-foreground"
                    title="Marcar como lida"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}