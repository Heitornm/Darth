"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { SERVICES } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const service = SERVICES.find((s) => s.id === serviceId) || SERVICES[0];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleConfirmAppointment = async () => {
    if (!user) {
      setErrorMessage("Você precisa estar conectado para realizar um agendamento.");
      return;
    }

    if (!selectedDate || !selectedTime) {
      setErrorMessage("Por favor, escolha uma data e um horário.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      // 1. Salva o agendamento no Firestore
      const appointmentData = {
        userId: user.uid,
        clientId: user.uid,
        userName: user.displayName || user.email || "Cliente",
        userEmail: user.email,
        serviceId: service.id,
        serviceName: service.name,
        price: service.price,
        date: selectedDate,
        time: selectedTime,
        status: "pending_payment", // Mantém como pendente até a confirmação do webhook
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "appointments"), appointmentData);

      // 2. Chamada para a API de Checkout de Pagamento (Mercado Pago / Stripe)
      const paymentResponse = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          appointmentId: docRef.id,
          serviceName: service.name,
          price: service.price,
          userEmail: user.email,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (paymentResponse.ok && paymentData.init_point) {
        // Redireciona para o gateway de pagamento externo (Ex: Mercado Pago)
        window.location.href = paymentData.init_point;
      } else if (paymentResponse.ok && paymentData.url) {
        // Redireciona para Stripe ou outro gateway se retornar 'url'
        window.location.href = paymentData.url;
      } else {
        // Se a API de pagamento falhar, redireciona para a confirmação interna
        console.warn("API de pagamento não retornou URL. Redirecionando para tela de sucesso local.");
        router.push(`/client/checkout/sucesso?appointmentId=${docRef.id}`);
      }
    } catch (err: any) {
      console.error("Erro ao processar agendamento e pagamento:", err);
      setErrorMessage("Ocorreu um erro ao conectar com o meio de pagamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container mx-auto max-w-xl p-8 text-center text-muted-foreground">
        Carregando informações do checkout...
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Confirmar e Pagar</h1>

      {/* Resumo do Serviço */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo do Serviço</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-semibold">{service.name}</span>
            <span className="font-bold text-primary">
              R$ {Number(service.price).toFixed(2)}
            </span>
          </div>
          {service.description && (
            <p className="text-xs text-muted-foreground">{service.description}</p>
          )}
        </CardContent>
      </Card>

      {/* Seleção de Data e Hora */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Escolha Data e Horário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Data</label>
            <input
              type="date"
              className="w-full p-2 border rounded-md bg-background text-foreground"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Horário</label>
            <select
              className="w-full p-2 border rounded-md bg-background text-foreground"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
            >
              <option value="">Selecione um horário</option>
              <option value="09:00">09:00</option>
              <option value="10:00">10:00</option>
              <option value="11:00">11:00</option>
              <option value="14:00">14:00</option>
              <option value="15:00">15:00</option>
              <option value="16:00">16:00</option>
              <option value="17:00">17:00</option>
              <option value="18:00">18:00</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {errorMessage && (
        <div className="p-3 text-sm text-red-500 bg-red-500/10 rounded-md border border-red-500/20">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button
          className="w-full"
          onClick={handleConfirmAppointment}
          disabled={isSubmitting || !selectedDate || !selectedTime}
        >
          {isSubmitting ? "Gerando Pagamento..." : "Ir para Pagamento"}
        </Button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-xl p-8 text-center text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}