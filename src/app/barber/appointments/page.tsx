'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  DollarSign, 
  Scissors 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

interface Appointment {
  id: string;
  userId: string;
  clientName?: string;
  clientEmail?: string;
  serviceName: string;
  date: string; // Formato YYYY-MM-DD
  time: string;
  price: number;
  status: 'pendente' | 'confirmado' | 'solicitado_cancelamento' | 'concluido' | 'cancelado';
  createdAt?: Timestamp;
}

export default function BarberAppointmentsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Verificação de Autorização (Somente Barbeiro Mestre)
  const isBarber = user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;

  useEffect(() => {
    if (!isUserLoading && !isBarber) {
      router.push('/');
    }
  }, [isUserLoading, isBarber, router]);

  // Listener Real-time dos Agendamentos da Data Selecionada
  useEffect(() => {
    if (!db || !isBarber) return;

    setLoading(true);
    const appointmentsRef = collection(db, 'appointments');
    const q = query(appointmentsRef, where('date', '==', selectedDate));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedList: Appointment[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Appointment[];

        // Ordena por horário (ex: 09:00, 10:00, 14:30)
        fetchedList.sort((a, b) => a.time.localeCompare(b.time));

        setAppointments(fetchedList);
        setLoading(false);
      },
      (error) => {
        console.error('[ERRO BUSCA AGENDA BARBEIRO]:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, selectedDate, isBarber]);

  // Atualização Genérica de Status
  const handleUpdateStatus = async (
    appointment: Appointment, 
    newStatus: 'confirmado' | 'concluido' | 'cancelado',
    customMessage?: string
  ) => {
    if (!db || !user) return;

    try {
      setProcessingId(appointment.id);

      // 1. Atualiza agendamento no Firestore
      const appRef = doc(db, 'appointments', appointment.id);
      await updateDoc(appRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // 2. Notifica o cliente sobre a mudança de status
      const formattedDate = appointment.date.split('-').reverse().join('/');
      let notifTitle = 'Atualização no Agendamento';
      let notifMessage = customMessage || `Seu agendamento para ${appointment.serviceName} em ${formattedDate} às ${appointment.time} foi atualizado para: ${newStatus}.`;

      if (newStatus === 'cancelado') {
        notifTitle = '❌ Agendamento Cancelado';
        notifMessage = `Seu agendamento para ${appointment.serviceName} em ${formattedDate} às ${appointment.time} foi cancelado.`;
      } else if (newStatus === 'concluido') {
        notifTitle = '✂️ Serviço Concluído!';
        notifMessage = `Obrigado pela visita! Seu atendimento de ${appointment.serviceName} foi finalizado.`;
      } else if (newStatus === 'confirmado') {
        notifTitle = '✅ Agendamento Confirmado!';
        notifMessage = `Seu agendamento de ${appointment.serviceName} em ${formattedDate} às ${appointment.time} está confirmado.`;
      }

      await addDoc(collection(db, 'notifications'), {
        toId: appointment.userId,
        fromId: user.uid,
        title: notifTitle,
        message: notifMessage,
        type: newStatus === 'cancelado' ? 'cancellation_request' : 'new_appointment',
        appointmentId: appointment.id,
        read: false,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Status Atualizado!",
        description: `Agendamento marcado como ${newStatus}.`,
      });

    } catch (error) {
      console.error('[ERRO ATUALIZAR STATUS]:', error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Não foi possível alterar o status do agendamento.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Rejeitar Solicitação de Cancelamento (Manter como Confirmado)
  const handleRejectCancellation = async (appointment: Appointment) => {
    await handleUpdateStatus(
      appointment, 
      'confirmado', 
      `Sua solicitação de cancelamento para ${appointment.serviceName} foi analisada e recusada pelo barbeiro. O horário permanece reservado.`
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Confirmado</Badge>;
      case 'pendente':
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Aguardando Pagamento</Badge>;
      case 'solicitado_cancelamento':
        return <Badge className="bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse">Solicitou Cancelamento</Badge>;
      case 'concluido':
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Concluído</Badge>;
      case 'cancelado':
        return <Badge variant="outline" className="text-zinc-500 border-zinc-700">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Carregando agenda do barbeiro...</p>
      </div>
    );
  }

  return (
    <main className="container mx-auto p-4 md:p-8 max-w-5xl space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Scissors className="w-6 h-6 text-primary" /> Agenda da Barbearia
          </h1>
          <p className="text-xs text-muted-foreground">Gerencie horários, confirme pagamentos e responda cancelamentos.</p>
        </div>

        {/* Seletor de Data */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <CalendarIcon className="w-4 h-4 text-primary shrink-0" />
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto bg-card border-border"
          />
        </div>
      </div>

      {/* Resumo da Data */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Total do Dia</span>
            <span className="text-2xl font-bold text-foreground mt-1">{appointments.length}</span>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Confirmados</span>
            <span className="text-2xl font-bold text-emerald-500 mt-1">
              {appointments.filter(a => a.status === 'confirmado').length}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Pedidos Cancelamento</span>
            <span className="text-2xl font-bold text-rose-400 mt-1">
              {appointments.filter(a => a.status === 'solicitado_cancelamento').length}
            </span>
          </CardContent>
        </Card>
        <Card className="bg-card/40 border-border">
          <CardContent className="p-4 flex flex-col justify-between">
            <span className="text-xs text-muted-foreground font-medium">Concluídos</span>
            <span className="text-2xl font-bold text-blue-400 mt-1">
              {appointments.filter(a => a.status === 'concluido').length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Agendamentos */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-lg">Horários em {selectedDate.split('-').reverse().join('/')}</CardTitle>
          <CardDescription>Agendamentos ordenados por horário de chegada.</CardDescription>
        </CardHeader>

        <CardContent className="p-4 divide-y divide-border">
          {appointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Nenhum agendamento registrado para esta data.</p>
            </div>
          ) : (
            appointments.map((app) => (
              <div 
                key={app.id} 
                className={`py-4 flex flex-col md:flex-row justify-between md:items-center gap-4 transition-colors ${
                  app.status === 'solicitado_cancelamento' ? 'bg-rose-500/5 p-3 rounded-xl border border-rose-500/20' : ''
                }`}
              >
                {/* Informações do Agendamento */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg text-primary flex items-center gap-1">
                      <Clock className="w-4 h-4" /> {app.time}
                    </span>
                    <h3 className="font-semibold text-foreground text-md">{app.serviceName}</h3>
                    {getStatusBadge(app.status)}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                    <span className="flex items-center gap-1 text-foreground font-medium">
                      <User className="w-3.5 h-3.5 text-muted-foreground" /> 
                      {app.clientName || app.clientEmail || `Cliente #${app.userId.substring(0, 5)}`}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500 font-bold">
                      <DollarSign className="w-3.5 h-3.5" /> R$ {Number(app.price).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Painel de Ações do Barbeiro */}
                <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
                  {/* Trata Solicitação de Cancelamento */}
                  {app.status === 'solicitado_cancelamento' && (
                    <>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={processingId === app.id}
                        onClick={() => handleUpdateStatus(app, 'cancelado')}
                        className="gap-1 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aceitar Cancelamento
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={processingId === app.id}
                        onClick={() => handleRejectCancellation(app)}
                        className="gap-1 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Manter Reserva
                      </Button>
                    </>
                  )}

                  {/* Confirmação Manual para Presencial / Pendente */}
                  {app.status === 'pendente' && (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={processingId === app.id}
                      onClick={() => handleUpdateStatus(app, 'confirmado')}
                      className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Pagamento
                    </Button>
                  )}

                  {/* Conclusão de Serviço */}
                  {app.status === 'confirmado' && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processingId === app.id}
                      onClick={() => handleUpdateStatus(app, 'concluido')}
                      className="gap-1 text-xs border-blue-500/40 text-blue-400 hover:bg-blue-500/10"
                    >
                      <Scissors className="w-3.5 h-3.5" /> Concluir Atendimento
                    </Button>
                  )}

                  {/* Cancelamento Direto pelo Barbeiro */}
                  {app.status !== 'cancelado' && app.status !== 'concluido' && app.status !== 'solicitado_cancelamento' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={processingId === app.id}
                      onClick={() => handleUpdateStatus(app, 'cancelado')}
                      className="text-xs text-muted-foreground hover:text-rose-400"
                    >
                      Cancelamento Forçado
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