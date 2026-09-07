"use client";
import { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isToday } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Clock, Scissors, Calendar, XCircle,
  AlertCircle, User
} from 'lucide-react';

// ==================== CONFIGURAÇÕES ====================
// ✅ COLOQUE SEU UID REAL DO FIREBASE ABAIXO
const BARBER_UIDS = ['2cAVs3U9ciV3NiqApJuOlYGEJS32'];
const BARBER_EMAIL = ["heitormartins@email.com", "darthbarbers@email.com"];
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

// ✅ STATUS QUE PRECISAM DE AÇÃO
const PENDING_STATUSES = [
  'aguardando_pagamento',
  'pagamento_confirmado',
  'aguardando_barbeiro',
  'pagamento_processando'
];

// ==================== COMPONENTE PRINCIPAL ====================
export default function BarberDashboardPage() {
  const { user, appointments, isAppointmentsLoading } = useFirebase();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('upcoming');
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

  // ✅ Verifica se pertence ao barbeiro
  const belongsToMe = useMemo(() => {
    return (apt?: Appointment): boolean => {
      if (!apt) return false;
      const aptBarberId = apt.barberId || '';
      if (user && aptBarberId === user.uid) return true;
      if (BARBER_ID_ALIASES.includes(aptBarberId)) return true;
      return false;
    };
  }, [user]);

  // ✅ TODOS os meus agendamentos
  const myAppointments = useMemo(() => {
    return (appointments || []).filter(belongsToMe);
  }, [appointments, belongsToMe]);

  // ✅ ⭐ PENDÊNCIAS — APARECEM SEMPRE, SEM FILTRO DE DATA
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

  // ✅ FILTRO PRÓXIMOS vs PERÍODO
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

  // ✅ LISTA FILTRADA — ordenada por horário
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

  // ✅ Métricas
  const metrics = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'concluido');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
    const canceled = filteredAppointments.filter(a => a.status === 'cancelado').length;
    const cancellationRate = filteredAppointments.length > 0
      ? Math.round((canceled / filteredAppointments.length) * 100)
      : 0;
    return { completedCount: completed.length, totalRevenue, canceled, cancellationRate, totalCount: filteredAppointments.length };
  }, [filteredAppointments]);

  // ✅ Confirma agendamento
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
        alert(`Erro: ${result.error || 'Tente novamente'}`);
      }
    } catch {
      alert('Erro de conexão. Tente novamente.');
    } finally {
      setConfirmingId(null);
    }
  };

  // ✅ Traduz status
  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'aguardando_pagamento': return '⏳ Aguardando Pagamento';
      case 'pagamento_confirmado': return '✅ Pago — Aguardando Confirmação';
      case 'aguardando_barbeiro': return '🔔 Aguardando Sua Confirmação';
      case 'confirmado': return '✅ Confirmado';
      case 'concluido': return '✅ Concluído';
      case 'cancelado': return '❌ Cancelado';
      default: return status || 'Desconhecido';
    }
  };

  const getStatusBadgeClass = (status?: string) => {
    switch (status) {
      case 'pagamento_confirmado':
      case 'aguardando_barbeiro':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 font-bold';
      case 'aguardando_pagamento':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'confirmado':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'concluido':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200';
      case 'cancelado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // ✅ Formata data
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

  // ==================== CARREGAMENTO / ACESSO ====================
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
          <p className="text-muted-foreground">
            {periodMode === 'upcoming' ? '📅 Próximos agendamentos por horário' : 'Serviços filtrados por período'}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Tabs value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
            <TabsList>
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
              className="w-auto"
            />
          )}
        </div>
      </div>

      {/* ⚠️ AVISO URGENTE — PENDÊNCIAS */}
      {pendingConfirmation.length > 0 && (
        <div className="p-4 bg-red-50 border-2 border-red-400 rounded-lg shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-8 h-8 text-red-600 shrink-0" />
            <div>
              <h2 className="text-lg font-bold text-red-800">
                ⚠️ {pendingConfirmation.length} AGENDAMENTO(S) PENDENTE(S) DE CONFIRMAÇÃO
              </h2>
              <p className="text-red-600">Pagamento confirmado — confirme o quanto antes para notificar o cliente!</p>
            </div>
          </div>
        </div>
      )}

      {/* ⭐ CARD DE PENDÊNCIAS — SEMPRE VISÍVEL */}
      {pendingConfirmation.length > 0 && (
        <Card className="border-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
              <div className="relative">
                <AlertCircle className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingConfirmation.length}
                </span>
              </div>
              Aguardando Sua Confirmação
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Estes agendamentos já foram pagos — clique em Confirmar para oficializar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingConfirmation.map(apt => (
                <div key={apt.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-800 shadow-sm">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(apt.status)}`}>
                        {getStatusLabel(apt.status)}
                      </span>
                    </div>
                    <p className="font-semibold text-lg flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {apt.userName || 'Cliente sem nome'}
                    </p>
                    <p className="text-sm text-muted-foreground flex gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatAppointmentDate(apt.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        às {apt.time || 'Horário não informado'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors className="w-4 h-4" />
                        {apt.serviceName || 'Serviço'}
                      </span>
                      <span className="font-bold text-green-600 text-lg">
                        Valor: R$ {(apt.price || 0).toFixed(2)}
                      </span>
                    </p>
                  </div>
                  <Button
                    onClick={() => confirmAppointment(apt.id!)}
                    disabled={confirmingId === apt.id}
                    className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap text-base px-6"
                    size="lg"
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
      )}

      {/* 📋 LISTA DE SERVIÇOS — FILTRÁVEL POR PERÍODO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            {periodMode === 'upcoming' ? 'Próximos Agendamentos' : 'Agendamentos do Período'}
            <span className="text-sm font-normal text-muted-foreground">({filteredAppointments.length})</span>
          </CardTitle>
          <CardDescription>
            {periodMode === 'upcoming' 
              ? 'Ordenados por horário — do mais próximo ao mais distante'
              : `Visualizando: ${periodMode === 'day' ? 'Dia' : periodMode === 'week' ? 'Semana' : 'Mês'} selecionado`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAppointments.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">Nenhum agendamento encontrado neste período.</p>
          ) : (
            <div className="space-y-2">
              {filteredAppointments.map(apt => (
                <div key={apt.id} className="flex flex-wrap items-center gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(apt.status)}`}>
                    {getStatusLabel(apt.status)}
                  </span>
                  <span className="font-medium">{apt.userName || 'Cliente'}</span>
                  <span className="text-muted-foreground">{apt.serviceName}</span>
                  <span className="text-sm flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatAppointmentDate(apt.date)}
                  </span>
                  <span className="text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    às {apt.time}
                  </span>
                  <span className="font-bold text-green-600 ml-auto">R$ {(apt.price || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Faturamento</p>
            <p className="text-2xl font-bold text-green-600">R$ {metrics.totalRevenue.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Atendimentos Concluídos</p>
            <p className="text-2xl font-bold">{metrics.completedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Taxa de Cancelamento</p>
            <p className="text-2xl font-bold">{metrics.cancellationRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Pendentes</p>
            <p className="text-2xl font-bold text-amber-600">{pendingConfirmation.length}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}