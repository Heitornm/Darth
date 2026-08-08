'use client';
//1
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function ClientAppointmentsPage() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { toast } = useToast();

  const status = searchParams.get('status');
  const orderNsu = searchParams.get('order_nsu');

  useEffect(() => {
    async function confirmPaymentOnReturn() {
      if (status === 'success' && orderNsu && db) {
        try {
          const appointmentRef = doc(db, 'appointments', orderNsu);
          await updateDoc(appointmentRef, {
            status: 'confirmado',
            paid: true,
            updatedAt: new Date()
          });

          toast({
            title: "Pagamento Confirmado! ✂️",
            description: "Seu horário foi reservado e confirmado com sucesso.",
          });
        } catch (error) {
          console.error("Erro ao atualizar status do agendamento no retorno:", error);
        }
      }
    }

    confirmPaymentOnReturn();
  }, [status, orderNsu, db, toast]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold font-headline mb-6">Minhas Reservas</h1>
      <p className="text-muted-foreground">Acompanhe seus agendamentos e histórico de cortes.</p>
    </div>
  );
}


