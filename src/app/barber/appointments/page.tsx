'use client';
import { useState, useEffect, useMemo } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  DollarSign, 
  Scissors,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BookingCalendarView } from '@/components/features/appointments/BookingCalendarView';

const BARBER_EMAIL = "heitornmartins@gmail.com";
const MASTER_BARBER_ID = '2cAVs3U9ciV3NiqApJuOlYGEJS32';

interface Appointment {
  id: string;
  barberId: string;
  clientId: string;
  userId: string;
  clientName?: string;
  clientEmail?: string;
  serviceName: string;
  date: string;
  time: string;
  dataHora?: Timestamp;
  price: number;
  durationMinutes?: number;
  status: 'pendente' | 'confirmado' | 'solicitado_cancelamento' | 'concluido' | 'cancelado';
  createdAt?: Timestamp;
}

type FilterTab = 'todas' | 'pendente' | 'confirmado' | 'solicitado_cancelamento' | 'concluido';
type PeriodMode = 'day' | 'week' | 'month';

export default function BarberAppointmentsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState<string>(format(today, 'yyyy-MM-dd'));
  const [periodMode, setPeriodMode] = useState<PeriodMode>('day');
  const [filterTab, setFilterTab] = useState<FilterTab>('todas');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isBarber = user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;
  const barberId = isBarber ? user?.uid : null;

  // Calcula intervalo de datas conforme período
  const dateRange = useMemo(() => {
    const baseDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : today;
    switch (periodMode) {
      case 'day':
        return { start: startOfDay(baseDate), end: endOfDay(baseDate) };
      case 'week':
        return { start: startOfWeek(baseDate, { weekStartsOn: 1 }), end: endOfWeek(baseDate, { weekStartsOn: 1 }) };
      case 'month':
        return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
    }
  }, [periodMode, selectedDate]);

  const periodLabel = useMemo(() => {
    if (periodMode === 'day') return format(dateRange.start, "dd 'de' MMMM", { locale: ptBR });
    if (periodMode === 'week') {
      return `${format(dateRange.start, 'dd/MM')} a ${format(dateRange.end, 'dd/MM')}`;
    }
    return format(dateRange.start, "MMMM 'de' yyyy", { locale: ptBR });
  }, [dateRange, periodMode]);

  // Navegar período
  const changePeriod = (direction: number) => {
    const current = selectedDate ? new Date(selectedDate + 'T00:00:00') : today;
    let newDate = new Date(current);
    if (periodMode === 'day') newDate.setDate(current.getDate() + direction);
    else if (periodMode === 'week') newDate.setDate(current.getDate() + (7 * direction));
    else newDate.setMonth(current.getMonth() + direction);
    setSelectedDate(format(newDate, 'yyyy-MM-dd'));
  };

  // Autorização
  useEffect(() => {
    if (!isUserLoading && !isBarber) {
      router.push('/');
    }
  }, [isUserLoading, isBarber, router]);

  // Busca agendamentos do barbeiro
  useEffect(() => {
    if (!db || !isBarber || !barberId) return;
    setLoading(true);
    const appointmentsRef = collection(db, 'appointments');
    const q = query(
      appointmentsRef,
      where('barberId', '==', barberId),
      orderBy('dataHora', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Appointment[];
      setAppointments(fetchedList);
      setLoading(false);
    }, (error) => {
      console.error('[ERRO BUSCA AGENDA]:', error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db, barberId, isBarber]);

  // Filtra por período e status
  const filteredAppointments = useMemo(() => {
    let list = [...appointments].filter(apt => {
      let aptDate: Date | null = null;
      if (apt.dataHora) {
        aptDate = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date((apt.dataHora as any)?.seconds * 1000);
      } else if (apt.date) {
        aptDate = new Date(`${apt.date}T${apt.time || '00:00'}`);
      }
      if (!aptDate || isNaN(aptDate.getTime())) return false;
      return aptDate >= dateRange.start && aptDate <= dateRange.end;
    });
    if (filterTab !== 'todas') {
      list = list.filter(apt => apt.status === filterTab);
    }
    return list.sort((a, b) => {
      const getTime = (apt: Appointment) => {
        if (apt.dataHora) {
          return apt.dataHora instanceof Timestamp ? apt.dataHora.toDate().getTime() : (apt.dataHora as any)?.seconds * 1000;
        }
        return new Date(`${apt.date}T${apt.time}`).getTime();
      };
      return getTime(a) - getTime(b);
    });
  }, [appointments, dateRange, filterTab]);

  // Atualiza status
  const handleUpdateStatus = async (
    appointment: Appointment, 
    newStatus: 'confirmado' | 'concluido' | 'cancelado',
    customMessage?: string
  ) => {
    if (!db || !user) return;
    try {
      setProcessingId(appointment.id);
      const appRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appRef, { status: newStatus, updatedAt: serverTimestamp() });

      const formattedDate = appointment.date 
        ? appointment.date.split('-').reverse().join('/') 
        : format(
            appointment.dataHora instanceof Timestamp ? appointment.dataHora.toDate() : new Date((appointment.dataHora as any)?.seconds * 1000),
            'dd/MM'
          );
      const time = appointment.time || '--:--';
      let notifTitle = 'Atualização no Agendamento';
      let notifMessage = customMessage || `Seu agendamento para ${appointment.serviceName} em ${formattedDate} às ${time} foi atualizado.`;
      if (newStatus === 'cancelado') {
        notifTitle = '❌ Agendamento Cancelado';
        notifMessage = `Seu agendamento de ${appointment.serviceName} em ${formattedDate} às ${time} foi cancelado pelo barbeiro.`;
      } else if (newStatus === 'concluido') {
        notifTitle = '✂️ Serviço Concluído!';
        notifMessage = `Obrigado pela visita! Seu atendimento de ${appointment.serviceName} foi finalizado.`;
      } else if (newStatus === 'confirmado') {
        notifTitle = '✅ Agendamento Confirmado!';
        notifMessage = `Sua solicitação de ${appointment.serviceName} em ${formattedDate} às ${time} foi CONFIRMADA!`;
      }
      await addDoc(collection(db, 'notifications'), {
        toId: appointment.clientId || appointment.userId,
        fromId: user.uid,
        title: notifTitle,
        message: notifMessage,
        type: newStatus === 'cancelado' ? 'cancellation_request' : 'new_appointment',
        appointmentId: appointment.id,
        read: false,
        createdAt: serverTimestamp(),
      });
      toast({ title: "Status Atualizado!", description: `Agendamento marcado como ${newStatus}.` });
    } catch (error) {
      console.error('[ERRO ATUALIZAR STATUS]:', error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível alterar o status." });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectCancellation = async (appointment: Appointment) => {
    await handleUpdateStatus(appointment, 'confirmado', `Sua solicitação de cancelamento foi analisada e recusada. O horário permanece reservado.`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Confirmado</Badge>;
      case 'pendente': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Aguardando</Badge>;
      case 'solicitado_cancelamento': return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse">Solicita Cancelamento</Badge>;
      case 'concluido': return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Concluído</Badge>;
      case 'cancelado': return <Badge variant="outline" className="text-zinc-500 border-zinc-700">Cancelado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isUserLoading || loading) {
    return <div className="min-h-[80vh] flex items-center justify-center"><p className="text-muted-foreground animate-pulse">Carregando agenda...</p></div>;
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-6xl space-y-6">
      {/* CABEÇALHO E NAVEGAÇÃO DE PERÍODO */}
      <div className="flex flex-col gap-4 border-b pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-primary" /> Agenda do Barbeiro
            </h1>
            <p className="text-sm text-muted-foreground">Visualize e gerencie os horários</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => changePeriod(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Input 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto bg-card border-border"
            />
            <Button size="sm" variant="ghost" onClick={() => changePeriod(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
        <Tabs value={periodMode} onValueChange={(v) => setPeriodMode(v as PeriodMode)}>
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="day">Hoje / Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="text-sm font-medium text-primary">Período: {periodLabel}</p>
      </div>

      {/* 📊 RESUMO RÁPIDO */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-card/40 border-border"><CardContent className="p-3"><span className="text-xs text-muted-foreground">Total</span><p className="text-xl font-bold mt-1">{filteredAppointments.length}</p></CardContent></Card>
        <Card className="bg-card/40 border-border"><CardContent className="p-3"><span className="text-xs text-muted-foreground">Pendentes</span><p className="text-xl font-bold text-amber-500 mt-1">{filteredAppointments.filter(a => a.status === 'pendente').length}</p></CardContent></Card>
        <Card className="bg-card/40 border-border"><CardContent className="p-3"><span className="text-xs text-muted-foreground">Confirmados</span><p className="text-xl font-bold text-emerald-500 mt-1">{filteredAppointments.filter(a => a.status === 'confirmado').length}</p></CardContent></Card>
        <Card className="bg-card/40 border-border"><CardContent className="p-3"><span className="text-xs text-muted-foreground">Cancelamento</span><p className="text-xl font-bold text-rose-400 mt-1">{filteredAppointments.filter(a => a.status === 'solicitado_cancelamento').length}</p></CardContent></Card>
        <Card className="bg-card/40 border-border"><CardContent className="p-3"><span className="text-xs text-muted-foreground">Concluídos</span><p className="text-xl font-bold text-blue-400 mt-1">{filteredAppointments.filter(a => a.status === 'concluido').length}</p></CardContent></Card>
      </div>

      {/* 📅 CALENDÁRIO DE HORÁRIOS LIVRES */}
      <Card className="border-primary/20 bg-card/40">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Horários Livres e Ocupacionais
          </CardTitle>
          <CardDescription>Visualização dos horários disponíveis — mesma visão do cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <BookingCalendarView selectedDate={selectedDate} />
        </CardContent>
      </Card>

      {/* 🔽 FILTRO DE STATUS */}
      <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="pendente">Pendentes</TabsTrigger>
          <TabsTrigger value="confirmado">Confirmadas</TabsTrigger>
          <TabsTrigger value="solicitado_cancelamento">Cancelamento</TabsTrigger>
          <TabsTrigger value="concluido">Concluídas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 📋 LISTA DE AGENDAMENTOS */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Agendamentos — {periodLabel}</CardTitle>
          <CardDescription>{filteredAppointments.length} agendamento(s) encontrado(s)</CardDescription>
        </CardHeader>
        <CardContent className="p-4 divide-y divide-border">
          {filteredAppointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum agendamento para este período.</p>
            </div>
          ) : (
            filteredAppointments.map((app) => (
              <div key={app.id} className={`py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 ${app.status === 'solicitado_cancelamento' ? 'bg-rose-500/5 p-3 rounded-xl border border-rose-500/20' : ''}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-bold text-lg text-primary flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {app.time || '--:--'}
                    </span>
                    <h3 className="font-semibold text-foreground">{app.serviceName}</h3>
                    {getStatusBadge(app.status)}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 text-foreground font-medium">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> 
                      {app.clientName || app.clientEmail || `Cliente #${(app.clientId || app.userId)?.substring(0, 6)}`}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500 font-bold">
                      <DollarSign className="w-3.5 h-3.5" /> R$ {Number(app.price).toFixed(2)}
                    </span>
                    {app.durationMinutes && <span className="flex items-center gap-1 text-orange-400"><Clock className="w-3.5 h-3.5" /> {app.durationMinutes} min</span>}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                  {app.status === 'solicitado_cancelamento' && (
                    <>
                      <Button size="sm" variant="destructive" disabled={processingId === app.id} onClick={() => handleUpdateStatus(app, 'cancelado')} className="gap-1 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aceitar
                      </Button>
                      <Button size="sm" variant="outline" disabled={processingId === app.id} onClick={() => handleRejectCancellation(app)} className="gap-1 text-xs border-amber-500/40 text-amber-400">
                        <XCircle className="w-3.5 h-3.5" /> Manter
                      </Button>
                    </>
                  )}
                  {app.status === 'pendente' && (
                    <Button size="sm" variant="default" disabled={processingId === app.id} onClick={() => handleUpdateStatus(app, 'confirmado')} className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar
                    </Button>
                  )}
                  {app.status === 'confirmado' && (
                    <Button size="sm" variant="outline" disabled={processingId === app.id} onClick={() => handleUpdateStatus(app, 'concluido')} className="gap-1 text-xs border-blue-500/40 text-blue-400">
                      <Scissors className="w-3.5 h-3.5" /> Concluir
                    </Button>
                  )}
                  {app.status !== 'cancelado' && app.status !== 'concluido' && app.status !== 'solicitado_cancelamento' && (
                    <Button size="sm" variant="ghost" disabled={processingId === app.id} onClick={() => handleUpdateStatus(app, 'cancelado')} className="text-xs text-muted-foreground hover:text-rose-400">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </main>
  );
}