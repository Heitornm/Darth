"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckoutButtonProps {
  clientId: string;
  clientName: string;
  clientEmail: string | null | undefined;
  barberId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  dataHoraSelection: Date;
}

export default function CheckoutButton({
  clientId,
  clientName,
  clientEmail,
  barberId,
  serviceId,
  serviceName,
  price,
  dataHoraSelection,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleBookingAndPayment = async () => {
    setIsLoading(true);

    try {
      // 1. Extrai 'date' (YYYY-MM-DD) e 'time' (HH:mm) para atender o contrato da API
      const date = dataHoraSelection.toISOString().split('T')[0];
      const time = dataHoraSelection.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      // 2. Salva o agendamento via API (Server-side com Firebase Admin)
      const appointmentRes = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          userName: clientName,
          userEmail: clientEmail || '',
          serviceId,
          serviceName,
          price,
          date,
          time,
          barberId,
        }),
      });

      const appointmentData = await appointmentRes.json();

      if (!appointmentRes.ok) {
        throw new Error(appointmentData.error || 'Falha ao criar agendamento.');
      }

      // 3. Chama a API de checkout passando o ID do agendamento gerado
      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: appointmentData.appointmentId,
          items: [
            {
              description: `Agendamento: ${serviceName}`,
              quantity: 1,
              price: price,
            },
          ],
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || 'Falha ao gerar o link de pagamento.');
      }

      // 4. Sucesso: Redireciona para o gateway
      toast({
        title: "Agendamento reservado!",
        description: "Redirecionando para o pagamento seguro...",
      });

      window.location.href = checkoutData.url;

    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro no agendamento",
        description: error.message || "Não foi possível iniciar o checkout.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleBookingAndPayment}
      disabled={isLoading}
      className="w-full h-12 text-lg font-headline gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processando...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          Confirmar e Pagar (R$ {price.toFixed(2)})
        </>
      )}
    </Button>
  );
}