"use client";

import { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FiClock as Clock,
  FiScissors as Scissors,
  FiCalendar as Calendar,
  FiXCircle as XCircle,
  FiAlertCircle as AlertCircle,
  FiUser as User,
  FiCheckCircle as CheckCircle,
  FiTrendingUp as TrendingUp,
  FiDollarSign as DollarSign
} from 'react-icons/fi';

// Identificadores para validação do Barbeiro Proprietário
const BARBER_UIDS = ['2cAVs3U9ciV3NiqApJuOlYGEJS32'];
const BARBER_EMAIL = ["heitormartins@gmail.com", "heitormartins@email.com", "darthbarbers@email.com"];
const BARBER_ID_ALIASES = ['barbeiro1', 'barbeiro_1', 'main'];

type PeriodMode = 'upcoming' | 'day' | 'week' | 'month';

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

// Status de agendamentos que necessitam da ação do barbeiro
const PENDING_STATUSES = [
  'aguardando_pagamento',
  'pagamento_confirmado',
  'aguardando_barbeiro',
  'pagamento_processando'
];

const startOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date: Date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfWeek = (date: Date, options: { weekStartsOn: number }) => {
  const result = startOfDay(date);
  const daysSinceStart = (result.getDay() - options.weekStartsOn + 7) % 7;
  result.setDate(result.getDate() - daysSinceStart);
  return result;
};

const endOfWeek = (date: Date, options: { weekStartsOn: number }) => {
  const result = startOfWeek(date, options);
  result.setDate(result.getDate() + 6);
  return endOfDay(result);
};

const startOfMonth = (date: Date) => {
  const result = startOfDay(date);
  result.setDate(1);
  return result;
};

const endOfMonth = (date: Date) => {
  const result = startOfMonth(date);
  result.setMonth(result.getMonth() + 1, 0);
  return endOfDay(result);
};

const isToday = (date: Date) => startOfDay(date).getTime() === startOfDay(new Date()).getTime();

/**
 * Dashboard Administrativa do Barbeiro Proprietário
 * Exibe métricas de faturamento, agendamentos pendentes de aprovação e lista de serviços por período.
 */
export default function BarberDashboardPage() {
  const { user, appointments, isAppointmentsLoading } = useFirebase();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('upcoming');
  const [referenceDate, setReferenceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [mounted, setMounted] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Valida se o usuário logado possui permissões de Barbeiro
  const isBarber = useMemo(() => {
    if (!user) return false;
    const isUid = BARBER_UIDS.includes(user.uid);
    const isEmail = BARBER_EMAIL.some(email => user.email?.toLowerCase() === email.toLowerCase());
    return isUid || isEmail;
  }, [user]);

  // Filtra agendamentos vinculados ao barbeiro solo
  const belongsToMe = useMemo(() => {
    return (apt?: Appointment): boolean => {
      if (!apt) return false;
      const aptBarberId = apt.barberId || '';
      if (user && aptBarberId === user.uid) return true;
      if (BARBER_ID_ALIASES.includes(aptBarberId)) return true;
      return false;
    };
  }, [user]);

  const myAppointments = useMemo(() => {
    return (appointments || []).filter(belongsToMe);
  }, [appointments, belongsToMe]);

  // Agendamentos pendentes de confirmação (sempre exibidos em destaque)
  const pendingConfirmation = useMemo(() => {
    return myAppointments.filter(apt =>
      PENDING_STATUSES.includes(apt.status || '')
    ).sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      } catch { return 0; }
    });
  }, [myAppointments]);

  // Define o intervalo de datas conforme a aba selecionada (Hoje, Semana, Mês ou Próximos)
  const periodRange = useMemo(() => {
    const baseDate = new Date(`${referenceDate}T00:00:00`);
    switch (periodMode) {
      case 'upcoming':
        return { start: startOfDay(new Date()), end: new Date('2100-12-31') };
      case 'day':
        return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
      case 'week':
        return { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    }
  }, [periodMode, referenceDate]);

  // Agendamentos filtrados pelo período selecionado
  const filteredAppointments = useMemo(() => {
    return myAppointments.filter(apt => {
      if (!apt.date) return false;
      try {
        const aptDate = new Date(`${apt.date}T00:00:00`);
        return aptDate >= periodRange.start && aptDate <= periodRange.end;
      } catch { return false; }
    }).sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      } catch { return 0; }
    });
  }, [myAppointments, periodRange]);

  // Cálculo das métricas de desempenho e faturamento
  const metrics = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'concluido' || a.status === 'confirmado');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
    const canceled = filteredAppointments.filter(a => a.status === 'cancelado').length;
    const cancellationRate = filteredAppointments.length > 0
      ? Math.round((canceled / filteredAppointments.length) * 100)
      : 0;
    return { completedCount: completed.length, totalRevenue, canceled, cancellationRate, totalCount: filteredAppointments.length };
  }, [filteredAppointments]);

  // Função para confirmar um agendamento pendente
  const confirmAppointment = async (appointmentId: string) => {
    if (!confirm("Confirmar este agendamento? O cliente será notificado.")) return;
    setConfirmingId(appointmentId);
    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      const result = await res.json();
      if (res.ok) {
        alert('✅ Agendamento CONFIRMADO! Notificação enviada ao cliente.');
      } else {
        alert(`Erro: ${result.error || 'Não foi possível confirmar o agendamento'}`);
      }
    } catch {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setConfirmingId(null);
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'aguardando_pagamento': return '⏳ Aguardando Pagamento';
      case 'pagamento_confirmado': return '✅ Pago — Aguardando Confirmação';
      case 'aguardando_barbeiro': return '🔔 Aguardando Sua Confirmação';
      case 'confirmado': return '✅ Confirmado';
      case 'concluido': return '✅ Concluído';
      case 'cancelado': return '❌ Cancelado';
      default: return status || 'Pendente';
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'pagamento_confirmado':
      case 'aguardando_barbeiro':
        return 'bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold';
      case 'aguardando_pagamento':
        return 'bg-blue-500/20 text-blue-400 border border-blue-500/30';
      case 'confirmado':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'concluido':
        return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
      case 'cancelado':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatAppointmentDate = (dateStr?: string) => {
    if (!dateStr) return 'Data não informada';
    try {
      if (dateStr.includes('-')) {
        const d = parseISO(dateStr);
        if (isToday(d)) return 'Hoje';
        return format(d, "dd/MM/yyyy");
      }
      return dateStr;
    } catch { return dateStr; }
  };

  if (!mounted || isAppointmentsLoading) {
    return <div className="p-20 text-center animate-pulse text-xl text-primary font-headline">Carregando painel administrativo...</div>;
  }

  if (!user || !isBarber) {
    return (
      <div className="container mx-auto p-20 text-center max-w-lg">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-headline mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta área é de acesso exclusivo do barbeiro proprietário.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
      {/* CABEÇALHO DO PAINEL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
            <TrendingUp className="w-7 h-7" /> Painel do Barbeiro
          </h1>
          <p className="text-muted-foreground">
            {periodMode === 'upcoming' ? '📅 Próximos atendimentos organizados por horário' : 'Gestão de atendimentos e desempenho por período'}
          </p>
        </div>
        
        {/* FILTROS DE PERÍODO */}
        <div className="flex gap-2 items-center flex-wrap">
          <Tabs value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="upcoming">📅 Próximos</TabsTrigger>
              <TabsTrigger value="day">Hoje</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          {periodMode !== 'upcoming' && (
            <Input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="w-auto bg-card border-border"
            />
          )}
        </div>
      </div>

      {/* METRICAS FINANCEIRAS E DE ATENDIMENTO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/60 bg-card/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Faturamento (Período)</p>
              <p className="text-2xl font-bold text-green-500 mt-1">R$ {metrics.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-500/10 text-green-500 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/60 bg-card/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Atendimentos Realizados</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.completedCount}</p>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Scissors className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Pendentes de Aprovação</p>
              <p className="text-2xl font-bold text-amber-500 mt-1">{pendingConfirmation.length}</p>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground font-semibold uppercase">Taxa de Cancelamento</p>
              <p className="text-2xl font-bold text-foreground mt-1">{metrics.cancellationRate}%</p>
            </div>
            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BLOCO DE ALERTAS - AGENDAMENTOS PENDENTES DE CONFIRMAÇÃO */}
      {pendingConfirmation.length > 0 && (
        <Card className="border-2 border-amber-500/50 bg-amber-500/10 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-500 font-headline">
              <AlertCircle className="w-6 h-6" />
              Agendamentos Aguardando Sua Confirmação ({pendingConfirmation.length})
            </CardTitle>
            <CardDescription className="text-amber-600 dark:text-amber-400">
              Pagamentos já confirmados pelo sistema — clique em Confirmar para notificar o cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConfirmation.map(apt => (
                <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-card rounded-xl border border-amber-500/30">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                    <p className="font-bold text-lg flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      {apt.userName || 'Cliente'}
                    </p>
                    <div className="text-sm text-muted-foreground flex gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-primary" />
                        {formatAppointmentDate(apt.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        às {apt.time || 'Horário n/i'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors className="w-4 h-4 text-primary" />
                        {apt.serviceName}
                      </span>
                      <span className="font-bold text-green-500">
                        R$ {(apt.price || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => confirmAppointment(apt.id!)}
                    disabled={confirmingId === apt.id}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-5 rounded-xl"
                  >
                    {confirmingId === apt.id ? (
                      <>⏳ Confirmando...</>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirmar Agendamento
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* LISTAGEM DOS AGENDAMENTOS DO PERÍODO */}
      <Card className="border-border/60 bg-card/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline">
            <Calendar className="w-5 h-5 text-primary" />
            {periodMode === 'upcoming' ? 'Próximos Agendamentos Confirmados' : 'Agendamentos do Período'}
            <span className="text-sm font-normal text-muted-foreground">({filteredAppointments.length})</span>
          </CardTitle>
          <CardDescription>
            {periodMode === 'upcoming' 
              ? 'Organizados em ordem cronológica'
              : `Exibindo agendamentos para o filtro selecionado`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum agendamento encontrado para este período.</p>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map(apt => (
                <div key={apt.id} className="flex flex-wrap items-center gap-4 p-4 bg-card rounded-xl border border-border/60 hover:border-primary/40 transition-colors">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                  
                  <span className="font-bold">{apt.userName || 'Cliente'}</span>
                  <span className="text-muted-foreground">{apt.serviceName}</span>
                  
                  <span className="text-sm flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    {formatAppointmentDate(apt.date)}
                  </span>
                  
                  <span className="text-sm flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    às {apt.time}
                  </span>
                  
                  <span className="font-bold text-green-500 ml-auto text-base">
                    R$ {(apt.price || 0).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}