"use client";

import { useState, useMemo } from 'react';
import { useFirebase } from '@/firebase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FiCalendar as Calendar,
  FiClock as Clock,
  FiScissors as Scissors,
  FiUser as User,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiAlertCircle as AlertCircle,
  FiLoader as Loader2,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiMail as Mail,
  FiInfo as Info
} from 'react-icons/fi';

const BARBER_UIDS = [
  '2cAVs3U9ciV3NiqApJuOlYGEJS32',
  'eUCAkXknM1N0mcC04hCIfF3HcMk1',
  'wWlt2ixyjwfLqDHDQFFNQgaYfCT2'
];

const BARBER_EMAILS = [
  'heitormartins@gmail.com',
  'heitormartins@email.com',
  'darthbarbers@email.com',
  'darthbarber@gmail.com.br'
];

interface Appointment {
  id?: string;
  barberId?: string;
  clientId?: string;
  userName?: string;
  userEmail?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  status?: string;
  price?: number;
  durationMinutes?: number;
  createdAt?: any;
}

/**
 * Página de Gestão de Solicitações de Agendamentos (Painel do Barbeiro)
 * Permite visualizar os agendamentos separados por data e realizar confirmações/cancelamentos.
 */
export default function BarberAppointmentsPage() {
  const { user, appointments, isAppointmentsLoading } = useFirebase();
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [cardExpandidoId, setCardExpandidoId] = useState<string | null>(null);

  const agora = useMemo(() => new Date(), []);

  const isBarber = useMemo(() => {
    if (!user) return false;
    const userEmailLower = user.email?.toLowerCase() || '';
    const matchUid = BARBER_UIDS.includes(user.uid);
    const matchEmail = BARBER_EMAILS.some(e => e.toLowerCase() === userEmailLower);
    return matchUid || matchEmail;
  }, [user]);

  const isAgendamentoVencido = (dateStr?: string, timeStr?: string): boolean => {
    if (!dateStr || !timeStr) return false;
    try {
      const horaLimpa = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      const dataHoraAgendamento = new Date(`${dateStr}T${horaLimpa}`);
      return dataHoraAgendamento < agora;
    } catch {
      return false;
    }
  };

  const formatarStatus = (status?: string): { texto: string; classe: string } => {
    switch (status) {
      case 'confirmado':
      case 'confirmed':
        return { texto: 'Confirmado', classe: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'concluido':
      case 'completed':
        return { texto: 'Concluído', classe: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'cancelado':
      case 'cancelled':
        return { texto: 'Cancelado', classe: 'bg-red-500/20 text-red-400 border-red-500/30' };
      case 'solicitado_cancelamento':
        return { texto: 'Cancelamento Solicitado', classe: 'bg-orange-500/20 text-orange-400 border-orange-500/30 font-bold animate-pulse' };
      case 'aguardando_pagamento':
        return { texto: 'Aguardando Pagamento', classe: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'aguardando_barbeiro':
      case 'pending':
      case 'solicitado':
      default:
        return { texto: 'Pendente de Aprovação', classe: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
  };

  const sortedAppointments = useMemo(() => {
    return [...(appointments || [])].sort((a, b) => {
      try {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      } catch {
        return 0;
      }
    });
  }, [appointments]);

  const agendamentosPorData = useMemo(() => {
    const grupos: { [key: string]: Appointment[] } = {};
    sortedAppointments.forEach((apt) => {
      const dataKey = apt.date || 'sem_data';
      if (!grupos[dataKey]) {
        grupos[dataKey] = [];
      }
      grupos[dataKey].push(apt);
    });
    return grupos;
  }, [sortedAppointments]);

  const toggleExpandirCard = (id?: string) => {
    if (!id) return;
    setCardExpandidoId(prev => (prev === id ? null : id));
  };

  const handleConfirm = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    if (!confirm("Deseja confirmar este agendamento? O cliente será notificado.")) return;
    
    setProcessandoId(appointmentId);
    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action: 'approve' })
      });

      if (res.ok) {
        alert("✅ Agendamento confirmado com sucesso!");
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || 'Não foi possível confirmar o agendamento.'}`);
      }
    } catch (error) {
      console.error('Erro na requisição de confirmação:', error);
      alert("Erro de conexão com o servidor ao tentar confirmar.");
    } finally {
      setProcessandoId(null);
    }
  };

  const handleCancel = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja cancelar esta solicitação de agendamento? O horário será liberado imediatamente.")) return;

    setProcessandoId(appointmentId);
    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action: 'cancel' })
      });

      if (res.ok) {
        alert("❌ Agendamento cancelado. A agenda foi liberada para novos clientes.");
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || 'Não foi possível cancelar o agendamento.'}`);
      }
    } catch (error) {
      console.error('Erro na requisição de cancelamento:', error);
      alert("Erro de conexão com o servidor ao tentar cancelar.");
    } finally {
      setProcessandoId(null);
    }
  };

  const formatarDataCabecalho = (dateKey: string) => {
    if (dateKey === 'sem_data') return 'Data Não Informada';
    try {
      return format(parseISO(dateKey), "EEEE, dd/MM/yyyy", { locale: ptBR });
    } catch {
      return dateKey;
    }
  };

  if (isAppointmentsLoading) {
    return (
      <div className="p-20 text-center animate-pulse text-primary font-headline flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" /> Carregando solicitações de agendamento...
      </div>
    );
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
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
          <Calendar className="w-7 h-7" /> Gestão de Solicitações
        </h1>
        <p className="text-muted-foreground">
          Clique sobre qualquer agendamento para visualizar os detalhes completos e realizar ações de confirmação ou cancelamento.
        </p>
      </div>

      <div className="space-y-8">
        {sortedAppointments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-border/60">
            Nenhum agendamento registrado no banco de dados até o momento.
          </Card>
        ) : (
          Object.keys(agendamentosPorData).map((dateKey) => (
            <div key={dateKey} className="space-y-3">
              {/* CABEÇALHO DIVISOR DE DATA */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 rounded-lg text-sm font-bold">
                  <Calendar className="w-4 h-4" />
                  <span>{formatarDataCabecalho(dateKey)}</span>
                </div>
                <div className="flex-1 h-[1px] bg-border/60"></div>
              </div>

              {/* LISTA DE CARDS PARA A DATA */}
              <div className="space-y-4">
                {agendamentosPorData[dateKey].map((apt: Appointment) => {
                  const isFinalizado = apt.status === 'cancelado' || apt.status === 'cancelled' || apt.status === 'concluido' || apt.status === 'completed';
                  const isSolicitouCancelamento = apt.status === 'solicitado_cancelamento';
                  const vencido = isAgendamentoVencido(apt.date, apt.time) && !isFinalizado;
                  const isExpanded = cardExpandidoId === apt.id;
                  const statusInfo = formatarStatus(apt.status);

                  return (
                    <Card
                      key={apt.id || Math.random().toString()}
                      onClick={() => toggleExpandirCard(apt.id)}
                      className={`border-border/60 transition-all cursor-pointer hover:border-primary/50 select-none ${
                        isSolicitouCancelamento ? 'bg-orange-950/20 border-orange-500/40' :
                        vencido ? 'bg-red-950/10 border-red-500/30' : 'bg-card/70'
                      }`}
                    >
                      <CardContent className="p-5 space-y-4">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {vencido ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> Solicitação Vencida
                                </span>
                              ) : (
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.classe}`}>
                                  Status: {statusInfo.texto}
                                </span>
                              )}
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
                                <Clock className="w-4 h-4 text-primary" />
                                às {apt.time || 'Horário n/i'}
                              </span>
                              <span className="font-bold text-green-500 text-base">
                                R$ {(apt.price || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* BOTÕES DE AÇÃO */}
                          <div className="flex items-center gap-2 w-full md:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                            {isSolicitouCancelamento ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={(e) => handleCancel(e, apt.id!)}
                                disabled={processandoId === apt.id}
                                className="font-semibold bg-red-600 hover:bg-red-700"
                              >
                                {processandoId === apt.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Aprovar Cancelamento
                                  </>
                                )}
                              </Button>
                            ) : !isFinalizado && (
                              <>
                                <Button
                                  onClick={(e) => handleConfirm(e, apt.id!)}
                                  disabled={processandoId === apt.id}
                                  className="bg-green-600 hover:bg-green-700 text-white font-semibold"
                                  size="sm"
                                >
                                  {processandoId === apt.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Confirmar
                                    </>
                                  )}
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleCancel(e, apt.id!)}
                                  disabled={processandoId === apt.id}
                                  className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}

                            <div className="ml-2 text-muted-foreground">
                              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>

                        {/* PAINEL EXPANSÍVEL */}
                        {isExpanded && (
                          <div className="pt-4 border-t border-border/50 space-y-4 bg-accent/20 p-4 rounded-lg">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Info className="w-4 h-4 text-primary shrink-0" />
                                <span><strong>ID do Agendamento:</strong> {apt.id || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-primary shrink-0" />
                                <span><strong>E-mail do Cliente:</strong> {apt.userEmail || 'Não informado'}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                                <span><strong>Duração Estimada:</strong> {apt.durationMinutes || 30} minutos</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-primary shrink-0" />
                                <span><strong>ID do Barbeiro:</strong> {apt.barberId || 'Não especificado'}</span>
                              </div>
                            </div>

                            {!isFinalizado && (
                              <div className="pt-3 border-t border-border/40 flex justify-end">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={(e) => handleCancel(e, apt.id!)}
                                  disabled={processandoId === apt.id}
                                  className="w-full sm:w-auto font-semibold flex items-center justify-center gap-1.5"
                                >
                                  {processandoId === apt.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <XCircle className="w-4 h-4" />
                                      Cancelar Este Agendamento (Liberar Horário)
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}