"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { appointmentService } from '@/services/appointmentService';
import { Timestamp } from 'firebase/firestore';

interface CheckoutButtonProps {
  clientId: string;
  clientName: string;
  clientEmail: string | null | undefined;
  barberId: string;
  serviceId: string;
  serviceName: string;
  price: number;
  dataHoraSelection: Date; // A data e hora que o cliente escolheu no calendário
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
      // 1. Salva o agendamento no Firestore com status 'pendente'
      const appointmentId = await appointmentService.createAppointment({
        clientId,
        clientName,
        clientEmail: clientEmail || null,
        barberId,
        serviceId,
        serviceName,
        price,
        dataHora: Timestamp.fromDate(dataHoraSelection),
      });

      // 2. Chama a API do Next.js para gerar o link da InfinitePay passando o ID do agendamento
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceName,
          price,
          appointmentId,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Falha ao gerar o link de pagamento.');
      }

      // 3. Tudo certo! Redireciona o cliente para a página da InfinitePay
      toast({
        title: "Agendamento reservado!",
        description: "Redirecionando para o pagamento seguro...",
      });

      window.location.href = data.url;

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