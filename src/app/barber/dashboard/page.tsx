"use client";
export const dynamic = 'force-dynamic';
import { useState, useEffect, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Scissors, 
  Users,
  AlertCircle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart,
  Pie,
  Cell
} from 'recharts';

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

// Cores fixas para gráfico de serviços
const COLORS = ['hsl(var(--primary))', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function BarberDashboardPage() {
  const { user, userProfile, appointments, isUserLoading, isAppointmentsLoading } = useFirebase();
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthorized = userProfile?.role === 'barber' || user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;

  if (!mounted || isUserLoading || isAppointmentsLoading) {
    return <div className="p-20 text-center animate-pulse text-primary font-headline">Calculando métricas...</div>;
  }
  
  if (!user || !isAuthorized) {
    return (
      <div className="container mx-auto p-20 text-center">
        <Card className="border-destructive/20 bg-destructive/5 max-w-md mx-auto">
          <CardContent className="pt-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-headline font-bold">Acesso Restrito</h2>
            <p className="text-muted-foreground">Painel exclusivo para o administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 📌 PERÍODO SELECIONADO: Dia / Semana / Mês
  const now = new Date();
  const range = useMemo(() => {
    switch (period) {
      case 'day':
        return { start: startOfDay(now), end: endOfDay(now) };
      case 'week':
        return {
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 })
        };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [period, now]);

  // ✅ FILTRA APENAS AGENDAMENTOS DO BARBEIRO LOGADO + DENTRO DO PERÍODO
  const filteredApts = useMemo(() => {
    return (appointments || []).filter(apt => {
      // Converte data de forma segura
      let aptDate: Date;
      if (apt.dataHora instanceof Timestamp) {
        aptDate = apt.dataHora.toDate();
      } else if (apt.dataHora?.seconds) {
        aptDate = new Date(apt.dataHora.seconds * 1000);
      } else if (apt.date && apt.time) {
        aptDate = new Date(`${apt.date}T${apt.time}`);
      } else {
        return false;
      }
      // Apenas agendamentos DESTE barbeiro
      const belongsToBarber = apt.barberId === user.uid || user.email === BARBER_EMAIL;
      const withinRange = aptDate >= range.start && aptDate <= range.end;
      return belongsToBarber && withinRange;
    });
  }, [appointments, range, user.uid]);

  // ✅ MÉTRICAS PRINCIPAIS
  const totalEarnings = filteredApts.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const totalMinutes = filteredApts.reduce((sum, apt) => sum + (apt.durationMinutes || 30), 0);
  const totalHours = totalMinutes / 60;
  const uniqueClients = new Set(filteredApts.map(a => a.clientId)).size;
  const completedServices = filteredApts.filter(a => a.status === 'concluido').length;
  const confirmedServices = filteredApts.filter(a => a.status === 'confirmado').length;

  // ✅ GRÁFICO: Atendimentos por dia
  const chartData = useMemo(() => {
    const grouped: any[] = [];
    filteredApts.forEach(apt => {
      const aptDate = apt.dataHora instanceof Timestamp 
        ? apt.dataHora.toDate() 
        : apt.date ? new Date(`${apt.date}T${apt.time}`) : null;
      if (!aptDate) return;
      const label = period === 'day' 
        ? format(aptDate, 'HH:mm', { locale: ptBR })
        : period === 'week'
          ? format(aptDate, 'EEE', { locale: ptBR })
          : format(aptDate, 'dd', { locale: ptBR });
      const existing = grouped.find(item => item.name === label);
      if (existing) existing.value += 1;
      else grouped.push({ name: label, value: 1 });
    });
    return grouped.sort((a, b) => a.name.localeCompare(b.name));
  }, [filteredApts, period]);

  // ✅ RANKING: Serviços mais feitos no período
  const serviceRanking = useMemo(() => {
    const counts: Record<string, { name: string; count: number; totalValue: number }> = {};
    filteredApts.forEach(apt => {
      const name = apt.serviceName || 'Não informado';
      if (!counts[name]) counts[name] = { name, count: 0, totalValue: 0 };
      counts[name].count += 1;
      counts[name].totalValue += apt.price || 0;
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [filteredApts]);

  // Gráfico de serviços
  const serviceChartData = serviceRanking.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length]
  }));

  const periodLabel = period === 'day' ? 'Hoje' : period === 'week' ? 'esta Semana' : 'este Mês';

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* CABEÇALHO COM TITULO E FILTRO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Meu Painel</h1>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <CalendarIcon className="w-4 h-4" />
            Resumo de {periodLabel} — {format(now, "dd 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="bg-card border border-border/50">
          <TabsList>
            <TabsTrigger value="day">Hoje</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* 📋 RESUMO RÁPIDO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPIItem icon={<DollarSign className="text-green-500" />} label="Receita Bruta" value={`R$ ${totalEarnings.toFixed(2)}`} color="bg-green-500/10" />
        <KPIItem icon={<Scissors className="text-blue-500" />} label="Atendimentos" value={filteredApts.length} color="bg-blue-500/10" />
        <KPIItem icon={<Clock className="text-orange-500" />} label="Horas em Cadeira" value={`${totalHours.toFixed(1)}h`} color="bg-orange-500/10" />
        <KPIItem icon={<Users className="text-purple-500" />} label="Clientes Únicos" value={uniqueClients} color="bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GRÁFICO DE ATENDIMENTOS */}
        <Card className="border-primary/20 bg-card/40 backdrop-blur-md shadow-xl lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Volume de Atendimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            {filteredApts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground italic">
                Nenhum agendamento registrado para o período.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* STATUS RÁPIDO */}
        <Card className="border-border bg-card/40">
          <CardHeader>
            <CardTitle className="font-headline text-lg">Status do Período</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-amber-500/10">
              <span className="text-sm">Aguardando</span>
              <span className="font-bold text-amber-500">{filteredApts.filter(a => a.status === 'pendente').length}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-emerald-500/10">
              <span className="text-sm">Confirmados</span>
              <span className="font-bold text-emerald-500">{confirmedServices}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-blue-500/10">
              <span className="text-sm">Concluídos</span>
              <span className="font-bold text-blue-500">{completedServices}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 📊 RANKING DE SERVIÇOS MAIS FEITOS */}
      <Card className="border-primary/20 bg-card/40 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" />
            Serviços Mais Realizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceRanking.length === 0 ? (
            <p className="text-center text-muted-foreground italic py-8">Nenhum serviço registrado no período.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Lista com ranking */}
              <div className="space-y-3">
                {serviceRanking.map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border/50">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-semibold">{service.name}</p>
                        <p className="text-xs text-muted-foreground">{service.count} atendimentos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-500">R$ {service.totalValue.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráfico Pizza */}
              <div className="h-[250px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={serviceChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                      labelLine={false}
                    >
                      {serviceChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPIItem({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
          <p className="text-xl font-headline font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}