'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);

  // Confirmação automática de pagamento
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
          console.error("Erro ao atualizar status:", error);
        }
      }
    }
    confirmPaymentOnReturn();
  }, [status, orderNsu, db, toast]);

  // Carrega agendamentos do cliente
  useEffect(() => {
    if (!db || !user) return;

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setAppointments(list);
    });

    return () => unsubscribe();
  }, [db, user]);

  // ✅ Formatação SEGURA da data — evita "Invalid time value"
  const formatDateSafe = (apt: any) => {
    try {
      // Se vier como objeto Timestamp do Firestore
      if (apt.dataHora) {
        const dateObj = apt.dataHora?.toDate ? apt.dataHora.toDate() : new Date(apt.dataHora);
        if (isValid(dateObj)) {
          return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        }
      }

      // Se vier separado em date + time (formato YYYY-MM-DD e HH:mm)
      if (apt.date && apt.time) {
        const dateStr = `${apt.date}T${apt.time}`;
        const dateObj = parseISO(dateStr);
        if (isValid(dateObj)) {
          return format(dateObj, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
        }
        // Fallback seguro se falhar o parse
        return `${apt.date} às ${apt.time}`;
      }

      return 'Data indisponível';
    } catch {
      return `${apt.date || 'Data'} às ${apt.time || 'Horário'}`;
    }
  };

  // Retorna badge colorido conforme status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Confirmado</Badge>;
      case 'concluido':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Concluído</Badge>;
      case 'solicitado_cancelamento':
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Cancelamento Solicitado</Badge>;
      case 'pendente':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Aguardando Pagamento</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="text-zinc-500 border-zinc-700">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold font-headline mb-2">Minhas Reservas</h1>
      <p className="text-muted-foreground mb-8">Acompanhe seus agendamentos futuros e histórico de atendimentos.</p>

      <div className="space-y-4">
        {appointments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum agendamento encontrado. Que tal <strong>agendar seu primeiro horário</strong>?
          </div>
        ) : (
          appointments.map((apt) => (
            <Card key={apt.id} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{apt.serviceName}</span>
                  {getStatusBadge(apt.status)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>📅 {formatDateSafe(apt)}</p>
                {apt.price && (
                  <p>
                    💰 Valor: <span className="font-bold text-emerald-500">R$ {Number(apt.price).toFixed(2)}</span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function ClientAppointmentsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
          Carregando agendamentos...
        </div>
      }
    >
      <AppointmentsContent />
    </Suspense>
  );
}