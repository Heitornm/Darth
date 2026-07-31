"use client";

import { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Bell, CheckCheck, Check } from "lucide-react";
import { db } from "@/firebase/firebase";
import { useUser } from "@/firebase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface NotificationItem {
  id: string;
  toId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export function NotificationMenu() {
  const { user } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Escuta as notificações destinadas ao usuário logado em tempo real
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    // A query atende estritamente à regra do Firestore (where toId == user.uid)
    const q = query(
      collection(db, "notifications"),
      where("toId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: NotificationItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as NotificationItem[];

        setNotifications(list);
      },
      (error) => {
        console.error("Erro ao escutar notificações:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Quantidade de notificações não lidas
  const unreadCount = notifications.filter((item) => !item.read).length;

  // Marcar uma única notificação como lida
  const markAsRead = async (notificationId: string) => {
    try {
      const notifRef = doc(db, "notifications", notificationId);
      await updateDoc(notifRef, {
        read: true,
      });
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
    }
  };

  // Marcar TODAS as notificações como lidas em lote (Batch write)
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((item) => !item.read);
    if (unreadNotifications.length === 0) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);

      unreadNotifications.forEach((item) => {
        const notifRef = doc(db, "notifications", item.id);
        batch.update(notifRef, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Erro ao marcar todas notificações como lidas:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96">
        <div className="flex items-center justify-between border-b p-3">
          <span className="font-semibold text-sm">Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              onClick={markAllAsRead}
              disabled={loading}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Marcar lidas
            </Button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Nenhuma notificação por aqui.
            </div>
          ) : (
            notifications.map((item) => (
              <DropdownMenuItem
                key={item.id}
                className={`flex flex-col items-start gap-1 p-3 cursor-pointer transition-colors ${
                  !item.read ? "bg-muted/40 font-medium" : "opacity-75"
                }`}
                onClick={() => !item.read && markAsRead(item.id)}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {item.title}
                  </span>
                  {!item.read ? (
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                  ) : (
                    <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.message}
                </p>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}