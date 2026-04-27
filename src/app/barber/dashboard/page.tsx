
"use client";

import { useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Scissors, 
  Users,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
} from 'recharts';

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

export default function BarberDashboardPage() {
  const { user, userProfile, appointments, isUserLoading, isAppointmentsLoading } = useFirebase();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthorized = userProfile?.role === 'barber' || user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;

  if (!mounted || isUserLoading || isAppointmentsLoading) return <div className="p-20 text-center animate-pulse text-primary font-headline">Calculando métricas...</div>;
  
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

  const now = new Date();
  const range = period === 'week' 
    ? { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) }
    : { start: startOfMonth(now), end: endOfMonth(now) };

  const filteredApts = appointments?.filter(apt => {
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return isWithinInterval(date, range);
  }) || [];

  const totalEarnings = filteredApts.reduce((sum, apt) => sum + (apt.price || 0), 0);
  const totalMinutes = filteredApts.reduce((sum, apt) => sum + (apt.durationMinutes || 30), 0);
  const totalHours = totalMinutes / 60;
  const uniqueClients = new Set(filteredApts.map(a => a.clientId)).size;

  const chartData = filteredApts.reduce((acc: any[], apt) => {
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    const label = format(date, period === 'week' ? 'EEE' : 'dd', { locale: ptBR });
    const existing = acc.find(item => item.name === label);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: label, value: 1 });
    }
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Meu Painel</h1>
          <p className="text-muted-foreground">Visão geral da sua performance.</p>
        </div>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="bg-card border border-border/50">
          <TabsList>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem icon={<DollarSign className="text-green-500" />} label="Receita Bruta" value={`R$ ${totalEarnings}`} color="bg-green-500/10" />
        <KPIItem icon={<Scissors className="text-blue-500" />} label="Serviços" value={filteredApts.length} color="bg-blue-500/10" />
        <KPIItem icon={<Clock className="text-orange-500" />} label="Horas em Cadeira" value={`${totalHours.toFixed(1)}h`} color="bg-orange-500/10" />
        <KPIItem icon={<Users className="text-purple-500" />} label="Clientes" value={uniqueClients} color="bg-purple-500/10" />
      </div>

      <Card className="border-primary/20 bg-card/40 backdrop-blur-md shadow-xl">
        <CardHeader>
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Volume de Atendimentos
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {filteredApts.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground italic">
              Nenhum dado para o período selecionado.
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
    </div>
  );
}

function KPIItem({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  return (
    <Card className="border-primary/10">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase">{label}</p>
          <p className="text-2xl font-headline font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
