"use client";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase } from '@/firebase';
import { format, parseISO, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Scissors, User, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

// ✅ AJUSTADO: SERVICES + tipo ServiceItem
import { SERVICES } from '@/data/services';

// ✅ Definindo o tipo corretamente conforme o arquivo
type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration: number; // ✅ O campo se chama "duration", não "durationMinutes"
};

// ==================== TIPOS ====================
interface Barber {
  id: string;
  name: string;
}

// ==================== CONFIGURAÇÕES ====================
const HORARIOS_DISPONIVEIS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];

const BARBEIROS: Barber[] = [
  { id: 'barbeiro1', name: 'Heitor Martins' },
];

// ==================== COMPONENTE PRINCIPAL ====================
export default function NewAppointmentPage() {
  const { user, userProfile } = useFirebase();
  const router = useRouter();
  const [dataSelecionada, setDataSelecionada] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [horarioSelecionado, setHorarioSelecionado] = useState<string>('');
  const [servicoSelecionado, setServicoSelecionado] = useState<string>('');
  const [barbeiroSelecionado, setBarbeiroSelecionado] = useState<string>('barbeiro1');
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string>('');
  const [sucesso, setSucesso] = useState(false);
  const agora = new Date();

  // ✅ REGRA: Verifica se o horário JÁ PASSOU
  const horarioJaPassou = useMemo(() => {
    return (horario: string): boolean => {
      if (!dataSelecionada || !horario) return false;
      const dataHoraEscolhida = new Date(`${dataSelecionada}T${horario}:00`);
      return dataHoraEscolhida <= agora;
    };
  }, [dataSelecionada, agora]);

  // ✅ Desabilita datas anteriores a hoje
  const dataMinima = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

  // Carrega horários ocupados quando muda a data
  useEffect(() => {
    if (!dataSelecionada || !barbeiroSelecionado) return;
    const buscarHorarios = async () => {
      setCarregando(true);
      try {
        const res = await fetch(
          `/api/appointments/slots?date=${dataSelecionada}&barberId=${barbeiroSelecionado}`
        );
        if (res.ok) {
          const data = await res.json();
          setHorariosOcupados(data.occupiedSlots || []);
        }
      } catch (e) {
        console.warn('Não foi possível carregar horários ocupados');
      } finally {
        setCarregando(false);
      }
    };
    buscarHorarios();
  }, [dataSelecionada, barbeiroSelecionado]);

  // Envia o agendamento
  const agendar = async () => {
    setErro('');
    setSucesso(false);

    // Validações de segurança
    if (!dataSelecionada || !horarioSelecionado || !servicoSelecionado) {
      setErro('Preencha todos os campos.');
      return;
    }

    // ✅ Validação extra: Bloqueia envio de horário passado
    if (horarioJaPassou(horarioSelecionado)) {
      setErro('⚠️ Este horário já passou. Escolha um horário futuro.');
      return;
    }

    // ✅ PEGA DADOS DO ARQUIVO CENTRALIZADO
    const servico = SERVICES.find((s: ServiceItem) => s.id === servicoSelecionado);
    if (!servico) {
      setErro('Serviço não encontrado.');
      return;
    }

    setEnviando(true);
    try {
      const res = await fetch('/api/appointments/new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: user?.uid || userProfile?.uid,
          userName: userProfile?.name || user?.displayName || 'Cliente',
          userEmail: userProfile?.email || user?.email,
          serviceId: servico.id,
          serviceName: servico.name,
          price: servico.price,               // ✅ Preço do arquivo central!
          date: dataSelecionada,
          time: horarioSelecionado,
          durationMinutes: servico.duration,   // ✅ CAMPO CORRETO: "duration"
          barberId: barbeiroSelecionado,
        }),
      });
      const resposta = await res.json();
      if (res.ok && resposta.success) {
        setSucesso(true);
        setTimeout(() => {
          router.push(`/client/appointments/${resposta.appointmentId}`);
        }, 1500);
      } else {
        setErro(resposta.error || 'Erro ao criar agendamento.');
      }
    } catch (err) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setEnviando(false);
    }
  };

  const servico = SERVICES.find((s: ServiceItem) => s.id === servicoSelecionado);

  // ==================== RENDER ====================
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Calendar className="w-6 h-6" /> Agendar Horário
      </h1>

      {sucesso && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-green-800 font-medium">Agendamento criado! Redirecionando...</p>
        </div>
      )}

      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-red-800">{erro}</p>
        </div>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="w-5 h-5" /> Passo 1 — Escolha o Serviço
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={servicoSelecionado} onValueChange={setServicoSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o serviço desejado" />
            </SelectTrigger>
            <SelectContent>
              {SERVICES.map((s: ServiceItem) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name} — R$ {s.price.toFixed(2)} ({s.duration} min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" /> Passo 2 — Profissional
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={barbeiroSelecionado} onValueChange={setBarbeiroSelecionado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o barbeiro" />
            </SelectTrigger>
            <SelectContent>
              {BARBEIROS.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" /> Passo 3 — Data
          </CardTitle>
          <CardDescription>
            Hoje é {format(new Date(), "dd 'de' MMMM", { locale: ptBR })}
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> Passo 4 — Horário
          </CardTitle>
          <CardDescription>
            {isToday(parseISO(dataSelecionada)) ? (
              <span className="text-amber-600">⚠️ Hoje — horários já passados estão bloqueados</span>
            ) : (
              <span>Selecione o horário desejado</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {carregando ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Carregando horários...
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
                      ${estaSelecionado ? 'bg-primary text-white' : ''}
                      ${jaPassou ? 'border-gray-300 text-gray-400' : ''}
                      ${estaOcupado && !jaPassou ? 'border-red-200 bg-red-50 text-red-600' : ''}
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

      {servico && horarioSelecionado && (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle>Resumo do Agendamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Serviço:</strong> {servico.name}</p>
            <p><strong>Data:</strong> {format(parseISO(dataSelecionada), "dd/MM/yyyy")}</p>
            <p><strong>Horário:</strong> {horarioSelecionado}</p>
            <p><strong>Valor:</strong> R$ {servico.price.toFixed(2)}</p>
            <p><strong>Duração:</strong> {servico.duration} minutos</p>
          </CardContent>
        </Card>
      )}

      <Button
        size="lg"
        className="w-full text-lg"
        disabled={!servicoSelecionado || !horarioSelecionado || enviando}
        onClick={agendar}
      >
        {enviando ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>✅ Confirmar Agendamento</>
        )}
      </Button>
    </div>
  );
}