"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useFirebase } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FiCalendar as Calendar, 
  FiClock as Clock, 
  FiPlus as Plus, 
  FiLoader as Loader2,
  FiCheckCircle as CheckCircle,
  FiXCircle as XCircle,
  FiAlertCircle as AlertCircle,
  FiScissors as Scissors,
  FiSlash as Ban
} from 'react-icons/fi';

interface Appointment {
  id: string;
  serviceName: string;
  price: number;
  date: string;
  time: string;
  status: 'aguardando_pagamento' | 'aguardando_barbeiro' | 'confirmado' | 'cancelado' | 'concluido' | 'solicitado_cancelamento';
  createdAt?: any;
}

/**
 * Página de Gestão de Agendamentos do Cliente.
 * Exibe próximos agendamentos agrupados por data e permite solicitar o cancelamento da reserva.
 */
export default function ClientAppointmentsPage() {
  const { user } = useFirebase();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    // Busca todos os agendamentos pertencentes ao cliente logado ordenados pela data de criação
    const q = query(
      collection(db, 'appointments'),
      where('clientId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs: Appointment[] = [];
        snapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() } as Appointment);
        });
        setAppointments(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Erro ao carregar agendamentos do cliente:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Data atual no formato YYYY-MM-DD para comparação
  const hojeStr = new Date().toISOString().split('T')[0];

  // Separação entre próximos agendamentos ativos e o histórico passado/cancelado
  const proximosAgendamentos = useMemo(() => {
    return appointments.filter((apt) => {
      if (apt.status === 'cancelado' || apt.status === 'concluido') return false;
      return apt.date >= hojeStr;
    });
  }, [appointments, hojeStr]);

  const historicoAgendamentos = useMemo(() => {
    return appointments.filter((apt) => {
      if (apt.status === 'cancelado' || apt.status === 'concluido') return true;
      return apt.date < hojeStr;
    });
  }, [appointments, hojeStr]);

  /**
   * REQUISITO 1: Agrupa os próximos agendamentos por data em ordem cronológica crescente
   */
  const agendamentosAgrupadosPorData = useMemo(() => {
    const ordenados = [...proximosAgendamentos].sort((a, b) => {
      try {
        const timeA = new Date(`${a.date}T${a.time}:00`).getTime();
        const timeB = new Date(`${b.date}T${b.time}:00`).getTime();
        return timeA - timeB;
      } catch {
        return 0;
      }
    });

    const grupos: { [key: string]: Appointment[] } = {};
    ordenados.forEach((apt) => {
      if (!grupos[apt.date]) {
        grupos[apt.date] = [];
      }
      grupos[apt.date].push(apt);
    });

    return grupos;
  }, [proximosAgendamentos]);

  /**
   * REQUISITO 2: Envia a solicitação de cancelamento do cliente para a API
   */
  const handleRequestCancel = async (appointmentId: string) => {
    if (!confirm("Deseja solicitar o cancelamento deste agendamento? O barbeiro será notificado.")) return;
    setProcessandoId(appointmentId);

    try {
      const res = await fetch('/api/barber/confirm-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, action: 'request_cancel' })
      });

      if (res.ok) {
        alert("✅ Solicitação de cancelamento enviada com sucesso ao barbeiro.");
      } else {
        const errData = await res.json();
        alert(`Erro: ${errData.error || 'Não foi possível solicitar o cancelamento.'}`);
      }
    } catch (error) {
      console.error('Erro ao solicitar cancelamento:', error);
      alert("Erro de conexão com o servidor ao solicitar cancelamento.");
    } finally {
      setProcessandoId(null);
    }
  };

  /**
   * Renderiza a tag estilizada para cada status
   */
  const renderStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'confirmado':
        return (
          <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Confirmado
          </Badge>
        );
      case 'aguardando_barbeiro':
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Aguardando Barbeiro
          </Badge>
        );
      case 'aguardando_pagamento':
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Aguardando Pagamento
          </Badge>
        );
      case 'solicitado_cancelamento':
        return (
          <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 flex items-center gap-1">
            <Ban className="w-3.5 h-3.5" /> Cancelamento Solicitado
          </Badge>
        );
      case 'cancelado':
        return (
          <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelado
          </Badge>
        );
      case 'concluido':
        return (
          <Badge variant="outline" className="text-muted-foreground flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Concluído
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * Formata a data por extenso com dia da semana (ex: Segunda-feira, 16/11/2026)
   */
  const formatarDataExtenso = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      const diaSemana = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
      const diaSemanaFormatado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);
      return `${diaSemanaFormatado}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <Calendar className="w-8 h-8 text-primary" /> Meus Agendamentos
          </h1>
          <p className="text-muted-foreground text-sm">
            Gerencie seus horários agendados e acompanhe o histórico da barbearia.
          </p>
        </div>
        <Link href="/client/appointments/new">
          <Button className="flex items-center gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Novo Agendamento
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-primary" /> Carregando seus agendamentos...
        </div>
      ) : (
        <Tabs defaultValue="proximos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="proximos" className="relative">
              Próximos Agendamentos
              {proximosAgendamentos.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5">
                  {proximosAgendamentos.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="historico">Histórico & Cancelados</TabsTrigger>
          </TabsList>

          {/* ABA 1: PRÓXIMOS AGENDAMENTOS (DIVIDIDOS POR DATA) */}
          <TabsContent value="proximos">
            {proximosAgendamentos.length === 0 ? (
              <Card className="text-center py-12 border-dashed">
                <CardContent className="space-y-4">
                  <Scissors className="w-12 h-12 text-muted-foreground mx-auto opacity-50" />
                  <div>
                    <h3 className="text-lg font-semibold">Nenhum agendamento futuro encontrado</h3>
                    <p className="text-sm text-muted-foreground">
                      Você não possui horários agendados para os próximos dias.
                    </p>
                  </div>
                  <Link href="/client/appointments/new" className="inline-block">
                    <Button variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" /> Agendar Agora
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* DIVISÃO VISUAL POR DATA NA LISTA DE AGENDAMENTOS */}
                {Object.keys(agendamentosAgrupadosPorData).map((dateKey) => (
                  <div key={dateKey} className="space-y-3">
                    {/* DIVISOR DE DATA DESTAQUE */}
                    <div className="flex items-center gap-3 pt-2">
                      <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-1.5 rounded-lg text-sm font-bold">
                        <Calendar className="w-4 h-4" />
                        <span>{formatarDataExtenso(dateKey)}</span>
                      </div>
                      <div className="flex-1 h-[1px] bg-border/60"></div>
                    </div>

                    {/* GRADE DE AGENDAMENTOS PARA A DATA ESPECÍFICA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {agendamentosAgrupadosPorData[dateKey].map((apt) => (
                        <Card key={apt.id} className="border-primary/20 hover:border-primary/50 transition-all shadow-sm flex flex-col justify-between">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Scissors className="w-4 h-4 text-primary shrink-0" /> {apt.serviceName}
                              </CardTitle>
                              {renderStatusBadge(apt.status)}
                            </div>
                            <CardDescription className="text-xs">
                              ID: {apt.id}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-foreground font-medium">
                                <Clock className="w-4 h-4 text-primary shrink-0" />
                                <span>Horário: <strong>{apt.time}</strong></span>
                              </div>
                              <div className="flex justify-between items-center text-base font-bold text-primary pt-1">
                                <span>Valor:</span>
                                <span>R$ {Number(apt.price).toFixed(2)}</span>
                              </div>
                            </div>

                            {/* REQUISITO 2: BOTÃO DE SOLICITAÇÃO DE CANCELAMENTO PELO CLIENTE */}
                            {apt.status !== 'cancelado' && apt.status !== 'concluido' && apt.status !== 'solicitado_cancelamento' && (
                              <div className="pt-2 border-t">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRequestCancel(apt.id)}
                                  disabled={processandoId === apt.id}
                                  className="w-full border-red-500/40 text-red-500 hover:bg-red-500/10 hover:text-red-600 font-semibold flex items-center justify-center gap-1.5"
                                >
                                  {processandoId === apt.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Ban className="w-4 h-4" />
                                      Solicitar Cancelamento
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ABA 2: HISTÓRICO E CANCELADOS */}
          <TabsContent value="historico">
            {historicoAgendamentos.length === 0 ? (
              <Card className="text-center py-12 border-dashed">
                <CardContent>
                  <p className="text-sm text-muted-foreground">Seu histórico de agendamentos passados está vazio.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-90">
                {historicoAgendamentos.map((apt) => (
                  <Card key={apt.id} className="bg-card/50">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold">{apt.serviceName}</CardTitle>
                        {renderStatusBadge(apt.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p>Data: {formatarDataExtenso(apt.date)} às {apt.time}</p>
                      <p className="font-semibold text-foreground">R$ {Number(apt.price).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}