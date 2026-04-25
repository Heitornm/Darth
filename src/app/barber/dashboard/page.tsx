
"use client";

import { useState } from 'react';
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
  Calendar as CalendarIcon,
  Users,
  CheckCircle2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'darth-barber-main';

export default function BarberDashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user || user.email !== BARBER_EMAIL) return null;
    return query(collection(db, "appointments"), where("barberId", "==", MASTER_BARBER_ID));
  }, [db, user]);

  const { data: allAppointments, isLoading } = useCollection(appointmentsQuery);

  if (isUserLoading || isLoading) return <div className="p-20 text-center animate-pulse">Analisando dados...</div>;
  if (!user || user.email !== BARBER_EMAIL) return <div className="p-20 text-center text-destructive">Acesso Negado</div>;

  const now = new Date();
  const range = period === 'week' 
    ? { start: startOfWeek(now, { locale: ptBR }), end: endOfWeek(now, { locale: ptBR }) }
    : { start: startOfMonth(now), end: endOfMonth(now) };

  const filteredApts = allAppointments?.filter(apt => {
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return isWithinInterval(date, range);
  }) || [];

  const totalEarnings = filteredApts.reduce((sum, apt) => sum + (apt.price || 50), 0);
  const totalHours = filteredApts.reduce((sum, apt) => sum + (apt.durationMinutes || 30), 0) / 60;
  const uniqueClients = new Set(filteredApts.map(a => a.clientId)).size;

  // Mock data para o gráfico baseado nos agendamentos reais
  const chartData = filteredApts.reduce((acc: any[], apt) => {
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    const label = format(date, period === 'week' ? 'EEE' : 'dd', { locale: ptBR });
    const existing = acc.find(item => item.name === label);
    if (existing) {
      existing.value += 1;
      existing.money += (apt.price || 50);
    } else {
      acc.push({ name: label, value: 1, money: (apt.price || 50) });
    }
    return acc;
  }, []).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary">Meu Painel</h1>
          <p className="text-muted-foreground">Acompanhamento de performance e indicadores.</p>
        </div>
        
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="bg-card p-1 rounded-lg border">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIItem 
          icon={<DollarSign className="text-green-500" />} 
          label="Faturamento" 
          value={`R$ ${totalEarnings}`} 
          color="bg-green-500/10" 
        />
        <KPIItem 
          icon={<Scissors className="text-blue-500" />} 
          label="Serviços" 
          value={filteredApts.length} 
          color="bg-blue-500/10" 
        />
        <KPIItem 
          icon={<Clock className="text-orange-500" />} 
          label="Horas Trabalhadas" 
          value={`${totalHours.toFixed(1)}h`} 
          color="bg-orange-500/10" 
        />
        <KPIItem 
          icon={<Users className="text-purple-500" />} 
          label="Clientes Únicos" 
          value={uniqueClients} 
          color="bg-purple-500/10" 
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-primary/20 bg-card/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Volume de Agendamentos
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="hsl(var(--primary))" fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/30">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Resumo de Serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {['Corte Clássico', 'Barba', 'Combo', 'Corte Premium'].map(service => {
                const count = filteredApts.filter(a => a.serviceName === service || a.serviceName?.includes(service)).length;
                const percentage = filteredApts.length > 0 ? (count / filteredApts.length) * 100 : 0;
                return (
                  <div key={service} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{service}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPIItem({ icon, label, value, color }: { icon: any, label: string, value: any, color: string }) {
  return (
    <Card className="border-primary/10 hover:border-primary/30 transition-colors">
      <CardContent className="p-6 flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-headline font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
