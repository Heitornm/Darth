"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/firebase";
import { useUser } from "@/firebase";

export interface NotificationItem {
  id: string;
  toId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export function NotificationListener() {
  const { user } = useUser();
  const [, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    // Se o usuário não estiver logado, cancela a busca para não dar erro de permissão
    if (!user) {
      setNotifications([]);
      return;
    }

    // A QUERY PRECISA CONTER O 'where("toId", "==", user.uid)' PARA BATER COM A REGRA DO FIRESTORE
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
        console.error("Erro ao buscar notificações:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  return null; // ou renderize o menu de notificações aqui
}