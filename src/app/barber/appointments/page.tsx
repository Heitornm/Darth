"use client";

import { useState, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { format, parseISO } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  FiCalendar as Calendar, 
  FiClock as Clock, 
  FiScissors as Scissors, 
  FiUser as User, 
  FiCheckCircle as CheckCircle, 
  FiXCircle as XCircle, 
  FiLoader as Loader2
} from 'react-icons/fi';

const BARBER_UIDS = ['2cAVs3U9ciV3NiqApJuOlYGEJS32'];
const BARBER_EMAIL = ["heitormartins@gmail.com", "heitormartins@email.com", "darthbarbers@email.com"];

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
}

/**
 * Página de Gestão de Solicitacões de Agendamentos (Painel do Barbeiro)
 * Permite aprovar, concluir ou cancelar reservas de horários dos clientes.
 */
export default function BarberAppointmentsPage() {
  const { user, appointments, isAppointmentsLoading } = useFirebase();
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  // Validação de acesso do barbeiro
  const isBarber = useMemo(() => {
    if (!user) return false;
    return BARBER_UIDS.includes(user.uid) || BARBER_EMAIL.some(e => user.email?.toLowerCase() === e.toLowerCase());
  }, [user]);

  // Ordena os agendamentos por data e horário (mais recentes/próximos primeiro)
  const sortedAppointments = useMemo(() => {
    return [...(appointments || [])].sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      } catch { return 0; }
    });
  }, [appointments]);

  // Executa a confirmação manual do agendamento
  const handleConfirm = async (appointmentId: string) => {
    if (!confirm("Deseja confirmar este agendamento?")) return;
    setProcessandoId(appointmentId);
    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId })
      });
      if (res.ok) {
        alert("✅ Agendamento confirmado com sucesso!");
      } else {
        alert("Erro ao confirmar agendamento.");
      }
    } catch {
      alert("Erro de conexão.");
    } finally {
      setProcessandoId(null);
    }
  };

  if (isAppointmentsLoading) {
    return <div className="p-20 text-center animate-pulse text-primary font-headline">Carregando agendamentos...</div>;
  }

  if (!user || !isBarber) {
    return (
      <div className="container mx-auto p-20 text-center max-w-lg">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-headline mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta área é restrita ao barbeiro proprietário.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
          <Calendar className="w-7 h-7" /> Gestão de Agendamentos
        </h1>
        <p className="text-muted-foreground">
          Acompanhe e confirme todas as reservas efetuadas pelos clientes.
        </p>
      </div>

      <div className="space-y-4">
        {sortedAppointments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-border/60">
            Nenhum agendamento cadastrado no sistema.
          </Card>
        ) : (
          sortedAppointments.map((apt: Appointment) => (
            <Card key={apt.id} className="border-border/60 bg-card/60">
              <CardContent className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                      Status: {apt.status || 'Pendente'}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    {apt.userName || 'Cliente sem nome'}
                  </h3>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Scissors className="w-4 h-4 text-primary" />
                      {apt.serviceName || 'Serviço'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-primary" />
                      {apt.date ? format(parseISO(apt.date), 'dd/MM/yyyy') : 'Data n/i'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary" />
                      às {apt.time || 'Horário n/i'}
                    </span>
                    <span className="font-bold text-green-500 text-base">
                      R$ {(apt.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* AÇÕES DE GESTÃO DO BARBEIRO */}
                {apt.status !== 'confirmado' && apt.status !== 'concluido' && (
                  <Button
                    onClick={() => handleConfirm(apt.id!)}
                    disabled={processandoId === apt.id}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-5 rounded-xl w-full md:w-auto"
                  >
                    {processandoId === apt.id ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirmar Agendamento
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}