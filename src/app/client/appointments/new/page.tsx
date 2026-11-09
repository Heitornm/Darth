"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FiCalendar as Calendar,
  FiClock as Clock,
  FiScissors as Scissors,
  FiCheckCircle as CheckCircle,
  FiLoader as Loader2,
  FiAlertCircle as AlertCircle
} from 'react-icons/fi';
import { SERVICES } from '@/data/services';

// Tipagem para os itens da lista de serviços
type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration: number;
};

// Lista de horários operacionais padrão da barbearia
const HORARIOS_DISPONIVEIS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];

// Barbeiro Solo Padrão da Barbearia
const BARBEIRO_PADRAO_ID = 'barbeiro1';

// Tratamento seguro para garantir que a lista de serviços esteja sempre num formato iterável
const SERVICE_LIST: ServiceItem[] = (() => {
  const resolved = Array.isArray(SERVICES)
    ? SERVICES
    : typeof SERVICES === 'function'
      ? (SERVICES as () => ServiceItem[])()
      : [];
  return Array.isArray(resolved) ? resolved : [];
})();

/**
 * Página de Novo Agendamento (Fluxo do Cliente)
 * Permite selecionar o serviço, data e horário, gerando a reserva e integrando com o Checkout.
 */
export default function NewAppointmentPage() {
  const { user, userProfile } = useFirebase();
  const router = useRouter();

  // Estados dos formulários e controle de UI
  const [dataSelecionada, setDataSelecionada] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>('');
  const [servicoSelecionado, setServicoSelecionado] = useState<string>('');
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState(false);

  const agora = useMemo(() => new Date(), []);

  // Helper para identificar se um determinado horário do dia atual já passou
  const horarioJaPassou = useMemo(() => {
    return (horario: string): boolean => {
      if (!dataSelecionada || !horario) return false;
      const dataHoraEscolhida = new Date(`${dataSelecionada}T${horario}:00`);
      return dataHoraEscolhida <= agora;
    };
  }, [dataSelecionada, agora]);

  // Data mínima permitida para agendamento (hoje)
  const dataMinima = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Busca os horários ocupados na API sempre que a data selecionada mudar
  useEffect(() => {
    if (!dataSelecionada) return;
    const buscarHorarios = async () => {
      setCarregando(true);
      try {
        const res = await fetch(
          `/api/appointments/slots?date=${dataSelecionada}&barberId=${BARBEIRO_PADRAO_ID}`
        );
        if (res.ok) {
          const data = await res.json();
          setHorariosOcupados(data.occupiedSlots || []);
        }
      } catch (e) {
        console.warn('Não foi possível carregar os horários ocupados');
      } finally {
        setCarregando(false);
      }
    };
    buscarHorarios();
  }, [dataSelecionada]);

  // Função para criar o agendamento no Firestore e redirecionar para o Checkout da InfinitePay
  const agendar = async () => {
    setErro('');
    setSucesso(false);

    if (!dataSelecionada || !horarioSelecionado || !servicoSelecionado) {
      setErro('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (horarioJaPassou(horarioSelecionado)) {
      setErro('⚠️ Este horário já passou. Por favor, escolha um horário futuro.');
      return;
    }

    const servico = SERVICE_LIST.find((s: ServiceItem) => s.id === servicoSelecionado);
    if (!servico) {
      setErro('Serviço selecionado não foi encontrado.');
      return;
    }

    setEnviando(true);
    try {
      // 1. Cria o agendamento inicial no banco de dados
      const resAgendamento = await fetch('/api/appointments/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user?.uid || userProfile?.uid,
          userName: userProfile?.name || user?.displayName || 'Cliente',
          userEmail: userProfile?.email || user?.email,
          serviceId: servico.id,
          serviceName: servico.name,
          price: servico.price,
          date: dataSelecionada,
          time: horarioSelecionado,
          durationMinutes: servico.duration,
          barberId: BARBEIRO_PADRAO_ID,
        }),
      });

      const respostaAgendamento = await resAgendamento.json();
      if (!resAgendamento.ok || !respostaAgendamento.success) {
        setErro(respostaAgendamento.error || 'Ocorreu um erro ao criar o agendamento.');
        setEnviando(false);
        return;
      }

      const appointmentId = respostaAgendamento.appointmentId;
      setSucesso(true);

      // 2. Gera a sessão de pagamento via InfinitePay
      console.log("[CHECKOUT] Gerando link de pagamento...");
      const resCheckout = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId: appointmentId,
          price: servico.price,
          serviceName: servico.name,
        }),
      });

      const respostaCheckout = await resCheckout.json();

      if (resCheckout.ok && respostaCheckout.success && respostaCheckout.checkoutUrl) {
        console.log("[CHECKOUT] ✅ Link gerado com sucesso. Redirecionando...");
        setTimeout(() => {
          window.location.href = respostaCheckout.checkoutUrl;
        }, 1200);
      } else {
        console.warn("[CHECKOUT] Link direto não disponível. Redirecionando para detalhes do agendamento.");
        setTimeout(() => {
          router.push(`/client/appointments/${appointmentId}`);
        }, 1200);
      }

    } catch (err) {
      setErro('Erro de conexão. Por favor, tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const servico = SERVICE_LIST.find((s: ServiceItem) => s.id === servicoSelecionado);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 font-headline">
        <Calendar className="w-6 h-6 text-primary" /> Agendar Horário
      </h1>

      {/* Mensagem de Sucesso */}
      {sucesso && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-green-700 dark:text-green-400 font-medium">Agendamento criado! Redirecionando para a tela de pagamento...</p>
        </div>
      )}

      {/* Mensagem de Erro */}
      {erro && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-red-700 dark:text-red-400">{erro}</p>
        </div>
      )}

      {/* PASSO 1: SELEÇÃO DE SERVIÇO */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5 text-primary" /> Passo 1 — Escolha o Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o serviço desejado" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_LIST.map((s: ServiceItem) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — R$ {s.price.toFixed(2)} ({s.duration} min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* PASSO 2: SELEÇÃO DE DATA */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" /> Passo 2 — Escolha a Data
          </CardTitle>
          <CardDescription>
            Data atual: {format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            type="date"
            value={dataSelecionada}
            min={dataMinima}
            onChange={(e) => {
              setDataSelecionada(e.target.value);
              setHorarioSelecionado('');
            }}
          />
        </CardContent>
      </Card>

      {/* PASSO 3: SELEÇÃO DE HORÁRIO */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" /> Passo 3 — Escolha o Horário
          </CardTitle>
          <CardDescription>
            {dataSelecionada === format(new Date(), 'yyyy-MM-dd') ? (
              <span className="text-amber-600 font-medium">⚠️ Atenção: Horários que já passaram hoje estão bloqueados.</span>
            ) : (
              <span>Selecione um horário disponível para o dia escolhido:</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex items-center gap-2 text-muted-foreground justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" /> Carregando grade de horários...
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {HORARIOS_DISPONIVEIS.map(horario => {
                const estaOcupado = horariosOcupados.includes(horario);
                const jaPassou = horarioJaPassou(horario);
                const estaSelecionado = horarioSelecionado === horario;
                const desabilitado = estaOcupado || jaPassou;

                return (
                  <Button
                    key={horario}
                    variant={estaSelecionado ? 'default' : 'outline'}
                    size="sm"
                    disabled={desabilitado}
                    onClick={() => {
                      setHorarioSelecionado(horario);
                      setErro('');
                    }}
                    className={`
                      ${desabilitado ? 'opacity-40 cursor-not-allowed line-through' : ''}
                      ${estaSelecionado ? 'bg-primary text-primary-foreground font-bold' : ''}
                      ${jaPassou ? 'border-gray-300 text-gray-400' : ''}
                      ${estaOcupado && !jaPassou ? 'border-red-300 bg-red-50 text-red-600 dark:bg-red-950/40' : ''}
                    `}
                  >
                    {horario}
                    {jaPassou && ' ✗'}
                    {estaOcupado && !jaPassou && ' ⚠'}
                  </Button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RESUMO DO AGENDAMENTO */}
      {servico && horarioSelecionado && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg font-headline">Resumo da Reserva</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p><strong>Serviço:</strong> {servico.name}</p>
            <p><strong>Data:</strong> {format(parseISO(dataSelecionada), "dd/MM/yyyy")}</p>
            <p><strong>Horário:</strong> {horarioSelecionado}</p>
            <p><strong>Duração Estimada:</strong> {servico.duration} minutos</p>
            <p className="text-base text-primary font-bold mt-2">
              Total: R$ {servico.price.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* BOTÃO DE CONFIRMAÇÃO */}
      <Button
        size="lg"
        className="w-full text-lg py-6 font-semibold"
        disabled={!servicoSelecionado || !horarioSelecionado || enviando}
        onClick={agendar}
      >
        {enviando ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processando Agendamento...
          </>
        ) : (
          <>Confirmar & Ir para Pagamento</>
        )}
      </Button>
    </div>
  );
}