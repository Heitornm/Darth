"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, Loader2, CheckCircle2, User, Scissors } from 'lucide-react';
import { getBookedSlotsByDate } from '@/services/appointmentService';

const AVAILABLE_HOURS = [
  "09:00", "10:00", "11:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

interface AppointmentInfo {
  time: string;
  clientName?: string;
  serviceName?: string;
  status?: string;
}

interface BookingCalendarViewProps {
  onSelectTimeSlot?: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

// ✅ Função auxiliar segura para criar datas
function safeDate(value?: string | Date | number | null): string {
  if (!value) {
    return new Date().toISOString().split('T')[0];
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    console.warn('⚠️ Data inválida detectada:', value);
    return new Date().toISOString().split('T')[0];
  }
  return date.toISOString().split('T')[0];
}

export function BookingCalendarView({
  onSelectTimeSlot,
  selectedDate: initialDate,
  selectedTime: initialTime
}: BookingCalendarViewProps) {
  const [date, setDate] = useState<string>(() => 
    safeDate(initialDate || new Date().toISOString().split('T')[0])
  );
  const [time, setTime] = useState<string>(initialTime || '');
  const [bookedAppointments, setBookedAppointments] = useState<AppointmentInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadAgenda() {
      if (!date) return;
      setLoading(true);
      try {
        const safeDateValue = safeDate(date);
        const booked = await getBookedSlotsByDate(safeDateValue);
        
        // ✅ Conversão SEGURA — aceita tanto lista de horários quanto objetos
        if (booked && booked.length > 0) {
          // Verifica se é formato antigo (string[]) ou novo (objeto[])
          if (typeof booked[0] === 'string') {
            // Formato antigo: só horários
            setBookedAppointments(
              (booked as string[]).map(hour => ({
                time: hour,
                status: 'Agendado'
              }))
            );
          } else {
            // Novo formato: objetos completos
            setBookedAppointments(booked as unknown as AppointmentInfo[]);
          }
        } else {
          setBookedAppointments([]);
        }
      } catch (error) {
        console.error("Erro ao carregar horários:", error);
        setBookedAppointments([]);
      } finally {
        setLoading(false);
      }
    }
    loadAgenda();
  }, [date]);

  const handleTimeClick = (selectedTimeSlot: string, isOcupado: boolean) => {
    if (isOcupado) return;
    setTime(selectedTimeSlot);
    if (onSelectTimeSlot) {
      onSelectTimeSlot(safeDate(date), selectedTimeSlot);
    }
  };

  const getAppointmentInfo = (hour: string): AppointmentInfo | undefined => {
    return bookedAppointments.find(apt => apt.time === hour);
  };

  const minDate = safeDate(new Date().toISOString().split('T')[0]);
  const totalSlots = AVAILABLE_HOURS.length;
  const bookedCount = bookedAppointments.length;
  const freeCount = totalSlots - bookedCount;

  return (
    <Card className="border-primary/20 bg-card/60 backdrop-blur-md shadow-xl w-full">
      <CardHeader>
        <CardTitle className="text-xl font-headline font-bold text-primary flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" /> Agenda da Barbearia
          </span>
          {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
            Selecione o Dia
          </label>
          <input
            type="date"
            min={minDate}
            value={date}
            onChange={(e) => {
              const newDate = e.target.value;
              setDate(safeDate(newDate));
              setTime('');
            }}
            className="w-full bg-background border border-border/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" /> 
              Todos os Horários
            </label>
            <div className="text-[11px] text-muted-foreground flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {freeCount} vagos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {bookedCount} ocupados
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {AVAILABLE_HOURS.map((hour) => {
              const appointment = getAppointmentInfo(hour);
              const isOcupado = !!appointment;
              const isSelected = time === hour;

              return (
                <button
                  key={hour}
                  onClick={() => handleTimeClick(hour, isOcupado)}
                  className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all border ${
                    isOcupado
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200 cursor-default'
                      : isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                        : 'bg-card hover:border-primary/50 border-border/60 hover:text-primary cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Horário */}
                    <div className="flex items-center gap-2 font-bold text-base">
                      <span className={`${isOcupado ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                        {hour}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                    </div>

                    {/* Informações do Agendamento (se ocupado) */}
                    {isOcupado ? (
                      <div className="flex-1 text-xs space-y-1 ml-2">
                        {appointment?.clientName && (
                          <div className="flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-70" />
                            <span className="font-medium">{appointment.clientName}</span>
                          </div>
                        )}
                        {appointment?.serviceName && (
                          <div className="flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 opacity-70" />
                            <span>{appointment.serviceName}</span>
                          </div>
                        )}
                        {appointment?.status && (
                          <div className="opacity-80">
                            {appointment.status}
                          </div>
                        )}
                        {!appointment?.clientName && !appointment?.serviceName && (
                          <span className="italic opacity-60">Horário Ocupado</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex items-center gap-2 text-green-600 dark:text-green-400 text-xs font-medium ml-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        Horário Livre — Clique para agendar
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}