"use client";
import { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Clock, Scissors, Calendar, CheckCircle2, XCircle,
  AlertCircle
} from 'lucide-react';

// ==================== CONSTANTES ====================
// ✅ COLOQUE SEU UID REAL DO FIREBASE ABAIXO
const BARBER_UIDS = ['2cAVs3U9ciV3NiqApJuOlYGEJS32'];
const BARBER_EMAIL = ["heitormartins@email.com", "darthbarbers@email.com"];
const BARBER_ID_ALIASES = ['barbeiro1', 'barbeiro_1', 'main'];

type PeriodMode = 'day' | 'week' | 'month';

interface Appointment {
  id?: string;
  barberId?: string;
  clientId?: string;
  userName?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  status?: string;
  price?: number;
  durationMinutes?: number;
  createdAt?: Timestamp | { seconds: number };
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function BarberDashboardPage() {
  const { user, appointments, isAppointmentsLoading } = useFirebase();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('day');
  const [referenceDate, setReferenceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [mounted, setMounted] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // ✅ Verifica se é o barbeiro
  const isBarber = useMemo(() => {
    if (!user) return false;
    const isUid = BARBER_UIDS.includes(user.uid);
    const isEmail = BARBER_EMAIL.some(email => user.email?.toLowerCase() === email.toLowerCase());
    return isUid || isEmail;
  }, [user]);

  // ✅ Verifica se o agendamento pertence ao barbeiro
  const belongsToMe = (apt?: Appointment): boolean => {
    if (!apt) return false;
    const aptBarberId = apt.barberId || '';
    if (user && aptBarberId === user.uid) return true;
    if (BARBER_ID_ALIASES.includes(aptBarberId)) return true;
    return false;
  };

  // ✅ Intervalo de data
  const periodRange = useMemo(() => {
    const baseDate = new Date(`${referenceDate}T00:00:00`);
    switch (periodMode) {
      case 'day': return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
      case 'week': return { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) };
      case 'month': return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    }
  }, [periodMode, referenceDate]);

  // ✅ Meus agendamentos
  const myAppointments = useMemo(() => {
    return (appointments || []).filter(belongsToMe);
  }, [appointments, user]);

  // ✅ Agendamentos dentro do período
  const filteredInPeriod = useMemo(() => {
    return myAppointments.filter(apt => {
      if (!apt.date) return false;
      const aptDate = new Date(`${apt.date}T00:00:00`);
      return aptDate >= periodRange.start && aptDate <= periodRange.end;
    });
  }, [myAppointments, periodRange]);

  // ✅ ⭐ PENDENTES — BUSCA EM TODOS, NÃO SÓ NO PERÍODO
  const pendingConfirmation = useMemo(() => {
    return myAppointments.filter(apt =>
      apt.status === 'aguardando_barbeiro' ||
      apt.status === 'pagamento_confirmado' ||
      apt.status === 'pagamento_processando'
    ).sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });
  }, [myAppointments]);

  // ✅ Métricas
  const metrics = useMemo(() => {
    const completed = filteredInPeriod.filter(a => a.status === 'concluido');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
    const canceled = filteredInPeriod.filter(a => a.status === 'cancelado').length;
    const cancellationRate = filteredInPeriod.length > 0
      ? Math.round((canceled / filteredInPeriod.length) * 100)
      : 0;
    return { completedCount: completed.length, totalRevenue, canceled, cancellationRate, totalCount: filteredInPeriod.length };
  }, [filteredInPeriod]);

  // ✅ Comparativo com período anterior
  const prevPeriodRevenue = useMemo(() => {
    const base = new Date(`${referenceDate}T00:00:00`);
    let prevStart, prevEnd;
    if (periodMode === 'day') {
      const d = subMonths(base, 1);
      prevStart = startOfDay(d); prevEnd = endOfDay(d);
    } else if (periodMode === 'week') {
      prevStart = startOfWeek(subMonths(base, 1), { weekStartsOn: 1 });
      prevEnd = endOfWeek(subMonths(base, 1), { weekStartsOn: 1 });
    } else {
      prevStart = startOfMonth(subMonths(base, 1));
      prevEnd = endOfMonth(subMonths(base, 1));
    }
    const prevCompleted = myAppointments.filter(a => {
      if (!a.date) return false;
      const d = new Date(`${a.date}T00:00:00`);
      return a.status === 'concluido' && d >= prevStart && d <= prevEnd;
    });
    return prevCompleted.reduce((sum, a) => sum + (a.price || 0), 0);
  }, [myAppointments, periodMode, referenceDate]);

  const revenueChange = prevPeriodRevenue > 0
    ? Math.round(((metrics.totalRevenue - prevPeriodRevenue) / prevPeriodRevenue) * 100)
    : (metrics.totalRevenue > 0 ? 100 : 0);

  // ✅ Confirma agendamento
  const confirmAppointment = async (appointmentId: string) => {
    setConfirmingId(appointmentId);
    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Agendamento confirmado! Notificação enviada ao cliente.');
      } else {
        alert(`Erro: ${result.error || 'Tente novamente'}`);
      }
    } catch {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setConfirmingId(null);
    }
  };

  // ==================== TELA DE CARREGAMENTO / ACESSO ====================
  if (!mounted || isAppointmentsLoading) {
    return <div className="p-20 text-center animate-pulse text-xl">Carregando painel...</div>;
  }

  if (!user || !isBarber) {
    return (
      <div className="container mx-auto p-20 text-center">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta área é exclusiva para o barbeiro.</p>
      </div>
    );
  }

  // ==================== RENDER PRINCIPAL ====================
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel do Barbeiro</h1>
          <p className="text-muted-foreground">Gerencie seus agendamentos e acompanhe o faturamento</p>
        </div>
        <div className="flex gap-2 items-center">
          <Tabs value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
            <TabsList>
              <TabsTrigger value="day">Hoje</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input
            type="date"
            value={referenceDate}
            onChange={(e) => setReferenceDate(e.target.value)}
            className="w-auto"
          />
        </div>
      </div>

      {/* ⭐ NOTIFICAÇÃO PENDENTE — DESTAQUE NO TOPO */}
      {pendingConfirmation.length > 0 ? (
        <Card className="border-amber-400 bg-amber-50 dark:bg-amber-950/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <div className="relative">
                <AlertCircle className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingConfirmation.length}
                </span>
              </div>
              Agendamentos Aguardando Confirmação
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Pagamento confirmado — clique para aceitar e notificar o cliente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConfirmation.map(apt => (
                <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">
                      {apt.userName || 'Cliente sem nome'}
                    </p>
                    <p className="text-sm text-muted-foreground flex gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> {apt.date ? format(new Date(apt.date + 'T00:00:00'), "dd/MM") : 'Sem data'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" /> {apt.time || 'Sem horário'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors className="w-4 h-4" /> {apt.serviceName || 'Serviço'}
                      </span>
                      <span className="font-bold text-green-600">R$ {(apt.price || 0).toFixed(2)}</span>
                    </p>
                  </div>
                  <Button
                    onClick={() => confirmAppointment(apt.id!)}
                    disabled={confirmingId === apt.id}
                    className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                  >
                    {confirmingId === apt.id ? (
                      <>⏳ Confirmando...</>
                    ) : (
                      <>✅ Confirmar Agendamento</>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="py-4 flex items-center gap-3 text-green-700 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Nenhum agendamento pendente de confirmação — tudo em ordem ✅</span>
          </CardContent>
        </Card>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Faturamento</p>
            <p className="text-2xl font-bold text-green-600">R$ {metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange)}% vs. período anterior
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Atendimentos Concluídos</p>
            <p className="text-2xl font-bold">{metrics.completedCount}</p>
            <p className="text-xs text-muted-foreground">de {metrics.totalCount} agendamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Taxa de Cancelamento</p>
            <p className="text-2xl font-bold">{metrics.cancellationRate}%</p>
            <p className="text-xs text-muted-foreground">{metrics.canceled} cancelados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{pendingConfirmation.length}</p>
            <p className="text-xs text-muted-foreground">aguardando confirmação</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}