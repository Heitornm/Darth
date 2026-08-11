'use client';

import { useEffect, Suspense, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

function AppointmentsContent() {
  const searchParams = useSearchParams();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'all' | '30d' | '90d'>('all');

  // ======================================
  // ✅ ATUALIZAÇÃO DE STATUS APÓS PAGAMENTO
  // ======================================
  const status = searchParams.get('status');
  const orderNsu = searchParams.get('order_nsu');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    async function confirmPaymentOnReturn() {
      if (!db || !user) return;

      const paymentRef = orderNsu || sessionId;
      if ((status === 'success' || status === 'paid') && paymentRef) {
        try {
          const appointmentRef = doc(db, 'appointments', paymentRef);
          await updateDoc(appointmentRef, {
            status: 'confirmado',
            paid: true,
            paidAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });

          toast({
            title: "✅ Pagamento Confirmado!",
            description: "Seu horário foi reservado com sucesso.",
            variant: "default",
          });
        } catch (err) {
          console.error("Erro ao confirmar:", err);
          toast({
            title: "Atenção",
            description: "Pagamento recebido, atualizando status...",
            variant: "default",
          });
        }
      }
    }
    confirmPaymentOnReturn();
  }, [status, orderNsu, sessionId, db, user, toast]);

  // ======================================
  // ✅ CARREGA AGENDAMENTOS + ORDENAÇÃO
  // ======================================
  useEffect(() => {
    if (!db || !user) return;

    const q = query(
      collection(db, 'appointments'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
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

  // ======================================
  // ✅ FILTRO POR PERÍODO + LIMITE DE 5
  // ======================================
  const filteredAppointments = useMemo(() => {
    let list = [...appointments];

    const now = Date.now();
    if (filterPeriod === '30d') {
      const cutoff = now - 30 * 24 * 60 * 60 * 1000;
      list = list.filter(apt => getTimeFromApt(apt) >= cutoff);
    } else if (filterPeriod === '90d') {
      const cutoff = now - 90 * 24 * 60 * 60 * 1000;
      list = list.filter(apt => getTimeFromApt(apt) >= cutoff);
    }

    if (!showAll) {
      return list.slice(0, 5);
    }
    return list;
  }, [appointments, filterPeriod, showAll]);

  function getTimeFromApt(apt: any): number {
    try {
      if (apt.createdAt?.toDate) return apt.createdAt.toDate().getTime();
      if (apt.dataHora?.toDate) return apt.dataHora.toDate().getTime();
      if (apt.date && apt.time) {
        const d = new Date(`${apt.date}T${apt.time}`);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      }
      return 0;
    } catch { return 0; }
  }

  // ======================================
  // ✅ FORMATAÇÃO DE DATA 100% SEGURA
  // ======================================
  const formatDateSafe = (apt: any) => {
    try {
      let dateObj: Date | null = null;

      if (apt.dataHora?.toDate) dateObj = apt.dataHora.toDate();
      else if (apt.date && apt.time) {
        let dateStr = apt.date.includes('-')
          ? `${apt.date}T${apt.time}`
          : `${apt.date.replace(/\//g, '-').split('-').reverse().join('-')}T${apt.time}`;
        dateObj = new Date(dateStr);
      } else if (apt.createdAt?.toDate) {
        dateObj = apt.createdAt.toDate();
      }

      if (!dateObj || isNaN(dateObj.getTime())) {
        return apt.date && apt.time ? `${apt.date} às ${apt.time}` : apt.date || 'Data indisponível';
      }

      const dia = String(dateObj.getDate()).padStart(2, '0');
      const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
      const ano = dateObj.getFullYear();
      const hora = String(dateObj.getHours()).padStart(2, '0');
      const min = String(dateObj.getMinutes()).padStart(2, '0');

      return `${dia}/${mes}/${ano} às ${hora}:${min}`;
    } catch {
      return apt.date && apt.time ? `${apt.date} às ${apt.time}` : apt.date || 'Data indisponível';
    }
  };

  // ======================================
  // ✅ BADGE DE STATUS
  // ======================================
  const getStatusBadge = (status?: string, paid?: boolean) => {
    if (paid && status !== 'confirmado' && status !== 'concluido') {
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">✅ Pago - Confirmado</Badge>;
    }
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Confirmado</Badge>;
      case 'concluido':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Concluído</Badge>;
      case 'solicitado_cancelamento':
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20">Cancelamento Solicitado</Badge>;
      case 'pendente':
      case 'aguardando_pagamento':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">⏳ Aguardando Pagamento</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="text-zinc-500 border-zinc-700">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status || 'Desconhecido'}</Badge>;
    }
  };

  // ======================================
  // ✅ RENDER — SEM ÍCONES
  // ======================================
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold font-headline mb-2">Minhas Reservas</h1>
      <p className="text-muted-foreground mb-6">Acompanhe seus agendamentos e histórico.</p>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6 items-center">
        <span className="text-sm text-muted-foreground font-medium">Filtrar:</span>
        <Button
          variant={filterPeriod === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPeriod('all')}
        >
          Todos
        </Button>
        <Button
          variant={filterPeriod === '30d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPeriod('30d')}
        >
          Últimos 30 dias
        </Button>
        <Button
          variant={filterPeriod === '90d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilterPeriod('90d')}
        >
          Últimos 90 dias
        </Button>
      </div>

      {/* Lista com rolagem */}
      <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
        {filteredAppointments.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum agendamento encontrado. Que tal <strong>agendar seu primeiro horário</strong>?
          </div>
        ) : (
          filteredAppointments.map((apt) => (
            <Card key={apt.id} className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span>{apt.serviceName || 'Serviço'}</span>
                  {getStatusBadge(apt.status, apt.paid)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                <p>Data: {formatDateSafe(apt)}</p>
                {apt.price && (
                  <p>Valor: <span className="font-bold text-emerald-500">R$ {Number(apt.price).toFixed(2)}</span></p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Botão Ver Mais / Ver Menos */}
      {appointments.length > 5 && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Ver Menos' : `Ver Todos (${appointments.length})`}
          </Button>
        </div>
      )}
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