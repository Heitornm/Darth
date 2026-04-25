
"use client";

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { query, collection, where, Timestamp } from 'firebase/firestore';
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
  AlertCircle,
  PieChart as PieChartIcon
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
const MASTER_BARBER_ID = 'darth-barber-main';

export default function BarberDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user || user.email !== BARBER_EMAIL) return null;
    return query(collection(db, "appointments"), where("barberId", "==", MASTER_BARBER_ID));
  }, [db, user]);

  const { data: allAppointments, isLoading, error } = useCollection(appointmentsQuery);

  if (!isClient || isUserLoading || isLoading) return <div className="p-20 text-center animate-pulse text-primary font-headline font-bold">Consolidando dados financeiros...</div>;
  
  if (!user || user.email !== BARBER_EMAIL) {
    return (
      <div className="container mx-auto p-20 text-center">
        <Card className="border-destructive/20 bg-destructive/5 max-w-md mx-auto">
          <CardContent className="pt-6 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-headline font-bold">Painel Restrito</h2>
            <p className="text-muted-foreground">Apenas o administrador master pode visualizar estes dados.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const range = period === 'week' 
    ? { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) }
    : { start: startOfMonth(now), end: endOfMonth(now) };

  const filteredApts = allAppointments?.filter(apt => {
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
      existing.money += (apt.price || 0);
    } else {
      acc.push({ name: label, value: 1, money: (apt.price || 0) });
    }
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Meu Painel</h1>
          <p className="text-muted-foreground">Monitoramento em tempo real de performance e receita.</p>
        </div>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="bg-card p-1 rounded-xl border border-border/50">
          <TabsList className="grid w-[240px] grid-cols-2">
            <TabsTrigger value="week" className="rounded-lg">Semana</TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIItem 
          icon={<DollarSign className="text-green-500 w-6 h-6" />} 
          label="Receita Bruta" 
          value={`R$ ${totalEarnings}`} 
          color="bg-green-500/10" 
        />
        <KPIItem 
          icon={<Scissors className="text-blue-500 w-6 h-6" />} 
          label="Serviços Feitos" 
          value={filteredApts.length} 
          color="bg-blue-500/10" 
        />
        <KPIItem 
          icon={<Clock className="text-orange-500 w-6 h-6" />} 
          label="Horas em Cadeira" 
          value={`${totalHours.toFixed(1)}h`} 
          color="bg-orange-500/10" 
        />
        <KPIItem 
          icon={<Users className="text-purple-500 w-6 h-6" />} 
          label="Clientes Atendidos" 
          value={uniqueClients} 
          color="bg-purple-500/10" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-primary/20 bg-card/40 backdrop-blur-md shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Volume de Atendimentos no Período
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-10">
            {filteredApts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground italic text-center">
                Sem dados suficientes para gerar gráfico. Adicione agendamentos no período selecionado.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)', radius: 8}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="url(#barGradient)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/40 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/50 pb-6">
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-accent" />
              Mix de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-8">
            <div className="space-y-6">
              {['Corte Clássico', 'Barba', 'Combo', 'Corte Premium'].map(service => {
                const count = filteredApts.filter(a => a.serviceName?.includes(service)).length;
                const percentage = filteredApts.length > 0 ? (count / filteredApts.length) * 100 : 0;
                return (
                  <div key={service} className="space-y-2">
                    <div className="flex justify-between items-end text-sm">
                      <div className="space-y-0.5">
                        <span className="text-foreground font-medium">{service}</span>
                        <p className="text-[10px] text-muted-foreground uppercase">{count} execuções</p>
                      </div>
                      <span className="font-bold text-primary">{percentage.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-1000" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-muted/30 rounded-xl border border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Mantenha o foco nos combos para aumentar seu ticket médio.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPIItem({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  return (
    <Card className="border-primary/10 hover:border-primary/30 transition-all group hover:-translate-y-1">
      <CardContent className="p-6 flex items-center gap-5">
        <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
          <p className="text-3xl font-headline font-bold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
