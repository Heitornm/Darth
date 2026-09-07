"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, DollarSign, Clock, Scissors,
  Calendar, CheckCircle2, Sparkles, ArrowRight, XCircle
} from 'lucide-react';
import {
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend
} from 'recharts';

// ==================== CONSTANTES ====================
const BARBER_EMAIL = ["heitornmartins@gmail.com", "darthbarbers@gmail.com"];
const MASTER_BARBER_ID = ['2cAVs3U9ciV3NiqApJuOlYGEJS32', 'dGlesKYTwHT80Z7NBL2eWNZunqN2'];
const COLORS = [
  'hsl(var(--primary))', '#22c55e', '#f59e0b', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'
];

type PeriodMode = 'day' | 'week' | 'month';

interface Appointment {
  id?: string;
  barberId?: string;
  clientId?: string;
  userId?: string;
  dataHora?: Timestamp | { seconds: number };
  date?: string;
  time?: string;
  status?: string;
  price?: number;
  durationMinutes?: number;
  serviceName?: string;
  userName?: string;
}

interface KPIProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color: string;
}

// ==================== COMPONENTE PRINCIPAL ====================
export default function BarberDashboardPage() {
  const { user, userProfile, appointments, isUserLoading, isAppointmentsLoading } = useFirebase();
  const [periodMode, setPeriodMode] = useState<PeriodMode>('day');
  const [referenceDate, setReferenceDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [mounted, setMounted] = useState(false);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeAppointments = appointments || [];
  const isBarberEmail = user?.email ? BARBER_EMAIL.includes(user.email) : false;
  const isMasterBarber = user?.uid ? MASTER_BARBER_ID.includes(user.uid) : false;
  const isAuthorized = userProfile?.role === 'barber' || isBarberEmail || isMasterBarber;

  const changePeriod = useCallback((direction: number) => {
    const base = new Date(`${referenceDate}T00:00:00`);
    const newDate = new Date(base);
    if (periodMode === 'day') {
      newDate.setDate(base.getDate() + direction);
    } else if (periodMode === 'week') {
      newDate.setDate(base.getDate() + (7 * direction));
    } else {
      newDate.setMonth(base.getMonth() + direction);
    }
    setReferenceDate(format(newDate, 'yyyy-MM-dd'));
  }, [periodMode, referenceDate]);

  const range = useMemo(() => {
    const base = new Date(`${referenceDate}T00:00:00`);
    switch (periodMode) {
      case 'day': return { start: startOfDay(base), end: endOfDay(base) };
      case 'week': return { start: startOfWeek(base, { weekStartsOn: 1 }), end: endOfWeek(base, { weekStartsOn: 1 }) };
      case 'month': return { start: startOfMonth(base), end: endOfMonth(base) };
    }
  }, [periodMode, referenceDate]);

  const periodLabel = useMemo(() => {
    if (periodMode === 'day') return format(range.start, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    if (periodMode === 'week') return `${format(range.start, 'dd/MM')} a ${format(range.end, 'dd/MM/yyyy')}`;
    return format(range.start, "MMMM 'de' yyyy", { locale: ptBR });
  }, [range, periodMode]);

  const parseAppointmentDate = useCallback((apt: Appointment): Date | null => {
    if (apt.dataHora instanceof Timestamp) return apt.dataHora.toDate();
    if (apt.dataHora?.seconds) return new Date(apt.dataHora.seconds * 1000);
    if (apt.date && apt.time) return new Date(`${apt.date}T${apt.time}`);
    return null;
  }, []);

  const filteredApts = useMemo(() => {
    return safeAppointments.filter((apt) => {
      const aptDate = parseAppointmentDate(apt);
      if (!aptDate || isNaN(aptDate.getTime())) return false;
      const belongsToBarber = apt.barberId === user?.uid || isBarberEmail;
      const withinRange = aptDate >= range.start && aptDate <= range.end;
      return belongsToBarber && withinRange;
    });
  }, [safeAppointments, range, user?.uid, isBarberEmail, parseAppointmentDate]);

  // ==================== MÉTRICAS — NOVOS STATUS ====================
  const aguardandoPagamento = filteredApts.filter(a => a.status === 'aguardando_pagamento').length;
  const pagamentoConfirmado = filteredApts.filter(a => a.status === 'pagamento_confirmado').length;
  const aguardandoBarbeiro = filteredApts.filter(a => a.status === 'aguardando_barbeiro').length;
  const confirmados = filteredApts.filter(a => a.status === 'confirmado').length;
  const concluidos = filteredApts.filter(a => a.status === 'concluido').length;
  const cancelados = filteredApts.filter(a => a.status === 'cancelado' || a.status === 'canceled').length;
  const totalAppointments = filteredApts.length;

  const totalEarnings = filteredApts
    .filter(a => a.status === 'concluido')
    .reduce((sum, apt) => sum + (apt.price || 0), 0);
  const totalScheduledValue = filteredApts.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const cancellationRate = totalAppointments > 0 ? (cancelados / totalAppointments) * 100 : 0;

  const chartData = useMemo(() => {
    const grouped: Record<string, { label: string; count: number; revenue: number }> = {};
    filteredApts.forEach((apt) => {
      const aptDate = parseAppointmentDate(apt);
      if (!aptDate || isNaN(aptDate.getTime())) return;
      const label = periodMode === 'day'
        ? format(aptDate, 'HH:mm', { locale: ptBR })
        : periodMode === 'week'
          ? format(aptDate, 'EEE', { locale: ptBR })
          : format(aptDate, 'dd', { locale: ptBR });
      if (!grouped[label]) grouped[label] = { label, count: 0, revenue: 0 };
      grouped[label].count += 1;
      grouped[label].revenue += apt.status === 'concluido' ? (apt.price || 0) : 0;
    });
    return Object.values(grouped).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredApts, periodMode, parseAppointmentDate]);

  const serviceRanking = useMemo(() => {
    const counts: Record<string, {
      name: string; count: number; totalValue: number; avgValue: number;
    }> = {};
    filteredApts.filter(a => a.status === 'concluido').forEach((apt) => {
      const name = apt.serviceName || 'Não informado';
      if (!counts[name]) counts[name] = { name, count: 0, totalValue: 0, avgValue: 0 };
      counts[name].count += 1;
      counts[name].totalValue += apt.price || 0;
    });
    return Object.values(counts)
      .map(s => ({ ...s, avgValue: s.count > 0 ? s.totalValue / s.count : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredApts]);

  const statusData = [
    { name: 'Aguardando Pagamento', value: aguardandoPagamento, fill: '#f59e0b' },
    { name: 'Pagamento Confirmado', value: pagamentoConfirmado, fill: '#3b82f6' },
    { name: 'Aguardando Barbeiro', value: aguardandoBarbeiro, fill: '#8b5cf6' },
    { name: 'Agendados', value: confirmados, fill: '#22c55e' },
    { name: 'Concluídos', value: concluidos, fill: '#10b981' },
  ].filter(d => d.value > 0);

  const prevRange = useMemo(() => {
    const base = new Date(`${referenceDate}T00:00:00`);
    if (periodMode === 'day') {
      const prev = subMonths(base, 1);
      return { start: startOfDay(prev), end: endOfDay(prev) };
    } else if (periodMode === 'week') {
      const prev = new Date(base);
      prev.setDate(base.getDate() - 7);
      return { start: startOfWeek(prev, { weekStartsOn: 1 }), end: endOfWeek(prev, { weekStartsOn: 1 }) };
    } else {
      const prev = new Date(base);
      prev.setMonth(base.getMonth() - 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
  }, [periodMode, referenceDate]);

  const prevEarnings = useMemo(() => {
    return safeAppointments.filter((apt) => {
      const aptDate = parseAppointmentDate(apt);
      if (!aptDate || isNaN(aptDate.getTime())) return false;
      const belongsToBarber = apt.barberId === user?.uid || isBarberEmail;
      const withinRange = aptDate >= prevRange.start && aptDate <= prevRange.end;
      return belongsToBarber && withinRange && apt.status === 'concluido';
    }).reduce((sum, apt) => sum + (apt.price || 0), 0);
  }, [safeAppointments, prevRange, user?.uid, isBarberEmail, parseAppointmentDate]);

  const earningsChange = prevEarnings > 0
    ? ((totalEarnings - prevEarnings) / prevEarnings) * 100
    : 0;

  // ✅ FUNÇÃO: Confirmar Agendamento
  const confirmarAgendamento = async (appointmentId: string) => {
    if (!confirm("Confirma este agendamento? Ele será marcado como Agendado oficialmente.")) return;
    
    setConfirmandoId(appointmentId);
    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      
      if (res.ok) {
        alert("✅ Agendamento confirmado! O cliente será notificado.");
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error || 'Tente novamente'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro de conexão. Tente novamente.");
    } finally {
      setConfirmandoId(null);
    }
  };

  // Lista de aguardando confirmação
  const aguardandoConfirmacao = filteredApts.filter(a => a.status === 'aguardando_barbeiro');

  // ==================== TELAS DE CARREGAMENTO / ACESSO ====================
  if (!mounted || isUserLoading || isAppointmentsLoading) {
    return <div className="p-20 text-center animate-pulse text-primary font-headline">Calculando métricas...</div>;
  }

  if (!user || !isAuthorized) {
    return (
      <div className="container mx-auto p-20 text-center">
        <Card className="border-destructive/20 bg-destructive/5 max-w-md mx-auto">
          <CardContent className="pt-6 space-y-4">
            <XCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-headline font-bold">Acesso Restrito</h2>
            <p className="text-muted-foreground">Painel exclusivo para o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ==================== RENDER PRINCIPAL ====================
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* CABEÇALHO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Painel de Gestão</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <Calendar className="w-4 h-4" /> {periodLabel}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Tabs value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
            <TabsList className="bg-card border border-border/50">
              <TabsTrigger value="day">Dia</TabsTrigger>
              <TabsTrigger value="week">Semana</TabsTrigger>
              <TabsTrigger value="month">Mês</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={() => changePeriod(-1)}>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </Button>
            <Input
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
              className="w-auto h-9"
            />
            <Button size="sm" variant="ghost" onClick={() => changePeriod(1)}>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 📈 KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KPIItem icon={<DollarSign className="text-emerald-500" />} label="Receita" value={`R$ ${totalEarnings.toFixed(2)}`} sub={`Agendado: R$ ${totalScheduledValue.toFixed(2)}`} color="bg-emerald-500/10" />
        <KPIItem icon={<Clock className="text-orange-500" />} label="Aguardando Pag." value={`${aguardandoPagamento}`} sub="pagamento pendente" color="bg-orange-500/10" />
        <KPIItem icon={<CheckCircle2 className="text-blue-500" />} label="Pag. Confirmado" value={`${pagamentoConfirmado}`} sub="aguardando barbeiro" color="bg-blue-500/10" />
        <KPIItem icon={<Sparkles className="text-violet-500" />} label="Aguardando Você" value={`${aguardandoBarbeiro}`} sub="precisa confirmar" color="bg-violet-500/10" />
        <KPIItem icon={<Scissors className="text-green-500" />} label="Agendados" value={`${confirmados}`} sub="confirmados" color="bg-green-500/10" />
        <KPIItem icon={<XCircle className="text-rose-500" />} label="Cancelados" value={`${cancelados}`} sub={`${cancellationRate.toFixed(0)}%`} color="bg-rose-500/10" />
      </div>

      {periodMode !== 'day' && (
        <Card className="border-primary/20 bg-card/40">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Comparado ao período anterior</p>
            <div className="flex items-center gap-2 flex-wrap">
              {earningsChange >= 0 ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-rose-500" />}
              <span className={`font-bold text-lg ${earningsChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {earningsChange >= 0 ? '+' : ''}{earningsChange.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">{earningsChange >= 0 ? 'aumento' : 'queda'} na receita</span>
              <span className="text-sm text-muted-foreground ml-auto">Anterior: R$ {prevEarnings.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ✅ CARD: AGUARDANDO CONFIRMAÇÃO DO BARBEIRO */}
      {aguardandoConfirmacao.length > 0 && (
        <Card className="border-violet-300 bg-violet-50/50 dark:bg-violet-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" />
              Aguardando Sua Confirmação ({aguardandoConfirmacao.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {aguardandoConfirmacao.map(apt => (
              <div key={apt.id} className="flex items-center justify-between p-3 bg-card rounded-lg border border-violet-200">
                <div>
                  <p className="font-semibold">{apt.serviceName}</p>
                  <p className="text-sm text-muted-foreground">
                    {apt.date?.split('-').reverse().join('/')} às {apt.time}
                    {apt.userName && ` • ${apt.userName}`}
                  </p>
                </div>
                <Button 
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => confirmarAgendamento(apt.id!)}
                  disabled={confirmandoId === apt.id}
                >
                  {confirmandoId === apt.id ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                      Confirmando...
                    </>
                  ) : (
                    <>✅ Confirmar</>
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-primary/20 bg-card/40 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Volume e Faturamento
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">Sem dados para o período.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsBarChart data={chartData}>
                  <XAxis dataKey="label" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Legend />
                  <Bar dataKey="count" name="Atendimentos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="revenue" name="R$ Concluído" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/40">
          <CardHeader><CardTitle className="font-headline text-lg">Status</CardTitle></CardHeader>
          <CardContent className="h-[320px]">
            {statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RANKING DE SERVIÇOS */}
      <Card className="border-primary/20 bg-card/40">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" /> Ranking de Serviços Prestados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceRanking.length === 0 ? (
            <p className="text-center text-muted-foreground italic py-8">Nenhum serviço concluído neste período.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {serviceRanking.map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{index + 1}</span>
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.count} atendimentos • Ticket médio: R$ {service.avgValue.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="text-right"><p className="font-bold text-emerald-500">R$ {service.totalValue.toFixed(2)}</p></div>
                  </div>
                ))}
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie data={serviceRanking.map((s, i) => ({ ...s, fill: COLORS[i % COLORS.length] }))} cx="50%" cy="50%" outerRadius={110} innerRadius={60} dataKey="count" label={({ name, count }) => `${name}: ${count}`}>
                      {serviceRanking.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==================== COMPONENTE KPI ====================
function KPIItem({ icon, label, value, sub, color }: KPIProps) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-3 flex items-start gap-3">
        <div className={`p-2 rounded-lg ${color} shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
          <p className="text-lg font-headline font-bold truncate">{value}</p>
          {sub && <p className="text-[10px] text-muted-foreground truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}