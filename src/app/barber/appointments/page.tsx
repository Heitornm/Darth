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
  FiAlertCircle as AlertCircle,
  FiLoader as Loader2,
  FiChevronDown as ChevronDown,
  FiChevronUp as ChevronUp,
  FiMail as Mail,
  FiInfo as Info
} from 'react-icons/fi';

/**
 * Lista de UIDs e E-mails com permissão de Barbeiro/Master
 */
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

/**
 * Interface dos dados de agendamento na interface
 */
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
 * Permite visualizar, aprovar e cancelar solicitações recebidas dos clientes.
 */
export default function BarberAppointmentsPage() {
  const { user, appointments, isAppointmentsLoading } = useFirebase();
  const [processandoId, setProcessandoId] = useState<string | null>(null);
  const [cardExpandidoId, setCardExpandidoId] = useState<string | null>(null);

  const agora = useMemo(() => new Date(), []);

  /**
   * Valida se o usuário logado possui privilégios de barbeiro
   */
  const isBarber = useMemo(() => {
    if (!user) return false;
    const userEmailLower = user.email?.toLowerCase() || '';
    const matchUid = BARBER_UIDS.includes(user.uid);
    const matchEmail = BARBER_EMAILS.some(e => e.toLowerCase() === userEmailLower);
    return matchUid || matchEmail;
  }, [user]);

  /**
   * Verifica se a data e horário do agendamento já passaram em relação ao momento atual
   */
  const isAgendamentoVencido = (dateStr?: string, timeStr?: string): boolean => {
    if (!dateStr || !timeStr) return false;
    try {
      const dataHoraAgendamento = new Date(`${dateStr}T${timeStr}:00`);
      return dataHoraAgendamento < agora;
    } catch {
      return false;
    }
  };

  /**
   * Formata a exibição amigável do status do agendamento
   */
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
      case 'aguardando_pagamento':
        return { texto: 'Aguardando Pagamento', classe: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'aguardando_barbeiro':
      case 'pending':
      case 'solicitado':
      default:
        return { texto: 'Pendente de Aprovação', classe: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    }
  };

  /**
   * Ordena a lista de agendamentos por data e horário (os mais recentes primeiro)
   */
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

  /**
   * Expande ou recolhe as informações detalhadas do card selecionado
   */
  const toggleExpandirCard = (id?: string) => {
    if (!id) return;
    setCardExpandidoId(prev => (prev === id ? null : id));
  };

  /**
   * Envia a requisição para confirmar o agendamento do cliente
   */
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

  /**
   * Envia a requisição para cancelar a solicitação de agendamento
   */
  const handleCancel = async (e: React.MouseEvent, appointmentId: string) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja cancelar esta solicitação de agendamento?")) return;

    setProcessandoId(appointmentId);
    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action: 'cancel' })
      });

      if (res.ok) {
        alert("❌ Solicitação cancelada com sucesso.");
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

  // 1. Estado de carregamento dos dados
  if (isAppointmentsLoading) {
    return (
      <div className="p-20 text-center animate-pulse text-primary font-headline flex items-center justify-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin" /> Carregando solicitações de agendamento...
      </div>
    );
  }

  // 2. Bloqueio de acesso para usuários não autenticados ou sem perfil de barbeiro
  if (!user || !isBarber) {
    return (
      <div className="container mx-auto p-20 text-center max-w-lg">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-headline mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground">Esta área é de acesso exclusivo do barbeiro proprietário.</p>
      </div>
    );
  }

  // 3. Renderização principal da página do barbeiro
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-2">
          <Calendar className="w-7 h-7" /> Gestão de Solicitações
        </h1>
        <p className="text-muted-foreground">
          Clique sobre qualquer agendamento para visualizar os detalhes completos e gerenciar o status.
        </p>
      </div>

      <div className="space-y-4">
        {sortedAppointments.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground border-border/60">
            Nenhum agendamento registrado no banco de dados até o momento.
          </Card>
        ) : (
          sortedAppointments.map((apt: Appointment) => {
            const isFinalizado = apt.status === 'confirmado' || apt.status === 'confirmed' || apt.status === 'concluido' || apt.status === 'completed' || apt.status === 'cancelado' || apt.status === 'cancelled';
            const vencido = isAgendamentoVencido(apt.date, apt.time) && !isFinalizado;
            const isExpanded = cardExpandidoId === apt.id;
            const statusInfo = formatarStatus(apt.status);

            return (
              <Card
                key={apt.id}
                onClick={() => toggleExpandirCard(apt.id)}
                className={`border-border/60 transition-all cursor-pointer hover:border-primary/50 select-none ${
                  vencido ? 'bg-red-950/10 border-red-500/30' : 'bg-card/70'
                }`}
              >
                <CardContent className="p-5 space-y-4">
                  {/* CABEÇALHO DO CARD - VISÃO GERAL DA SOLICITAÇÃO */}
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
                          <Calendar className="w-4 h-4 text-primary" />
                          {apt.date ? format(parseISO(apt.date), 'dd/MM/yyyy') : 'Data não informada'}
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

                    {/* BOTÕES DE AÇÃO DO BARBEIRO */}
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                      {vencido ? (
                        <>
                          <Button
                            variant="secondary"
                            disabled
                            size="sm"
                            className="bg-muted/50 text-muted-foreground opacity-70"
                          >
                            ⚠️ Horário Vencido
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => handleCancel(e, apt.id!)}
                            disabled={processandoId === apt.id}
                            className="font-semibold"
                          >
                            {processandoId === apt.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <XCircle className="w-4 h-4 mr-1" />
                                Cancelar Solicitação
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <>
                          {!isFinalizado && (
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
                        </>
                      )}

                      {/* INDICADOR PARA RECOLHER / EXPANDIR DETALHES */}
                      <div className="ml-2 text-muted-foreground">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* PAINEL EXPANSÍVEL COM DETALHES DO CLIENTE E RESERVA */}
                  {isExpanded && (
                    <div className="pt-4 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground bg-accent/20 p-4 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-primary shrink-0" />
                        <span><strong>ID do Agendamento:</strong> {apt.id}</span>
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
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}