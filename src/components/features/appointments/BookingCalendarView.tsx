"use client";

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  FiCalendar as CalendarIcon, 
  FiClock as Clock, 
  FiLoader as Loader2, 
  FiCheckCircle as CheckCircle2, 
  FiAlertCircle as AlertCircle
} from 'react-icons/fi';
import { getBookedSlotsByDate, timeToMinutes, minutesToTime } from '@/services/appointmentService';

const AVAILABLE_HOURS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];

interface BookingCalendarViewProps {
  onSelectTimeSlot?: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  selectedServiceDuration?: number;
  barberId?: string;
}

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
  selectedTime: initialTime,
  selectedServiceDuration = 30,
  barberId = '2cAVs3U9ciV3NiqApJuOlYGEJS32'
}: BookingCalendarViewProps) {
  const [date, setDate] = useState<string>(() => 
    safeDate(initialDate || new Date().toISOString().split('T')[0])
  );
  const [time, setTime] = useState<string>(initialTime || '');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Busca agendamentos ativos e desconsidera os expirados (>10 min)
  const loadAgenda = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    try {
      const safeDateValue = safeDate(date);
      const booked = await getBookedSlotsByDate(safeDateValue, barberId);
      setBookedSlots(booked || []);
    } catch (error) {
      console.error("Erro ao carregar horários da agenda:", error);
      setBookedSlots([]);
    } finally {
      setLoading(false);
    }
  }, [date, barberId]);

  // Recarrega automaticamente a cada 30 segundos para liberar vagas cujos 10 min de pagamento expiraram
  useEffect(() => {
    loadAgenda();
    const interval = setInterval(() => {
      loadAgenda();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadAgenda]);

  /**
   * Verifica se o slot está bloqueado considerando a duração total do serviço selecionado
   */
  const isSlotBlockedForDuration = (slotTime: string): boolean => {
    const slotStartMins = timeToMinutes(slotTime);
    const slotEndMins = slotStartMins + selectedServiceDuration;

    for (let currentMins = slotStartMins; currentMins < slotEndMins; currentMins += 30) {
      const timeToCheck = minutesToTime(currentMins);
      if (bookedSlots.includes(timeToCheck)) {
        return true;
      }
    }
    return false;
  };

  const handleTimeClick = (selectedTimeSlot: string, isOcupado: boolean) => {
    if (isOcupado) return;
    setTime(selectedTimeSlot);
    if (onSelectTimeSlot) {
      onSelectTimeSlot(safeDate(date), selectedTimeSlot);
    }
  };

  const minDate = safeDate(new Date().toISOString().split('T')[0]);
  const totalSlots = AVAILABLE_HOURS.length;
  const bookedCount = AVAILABLE_HOURS.filter(h => isSlotBlockedForDuration(h)).length;
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
        {/* SELETOR DE DATA */}
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

        {/* GRADE DE HORÁRIOS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" /> 
              Horários Disponíveis ({selectedServiceDuration} min)
            </label>
            <div className="text-[11px] text-muted-foreground flex gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                {freeCount} vagos
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                {bookedCount} indisponíveis
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AVAILABLE_HOURS.map((hour) => {
              const isOcupado = isSlotBlockedForDuration(hour);
              const isSelected = time === hour;

              return (
                <button
                  key={hour}
                  type="button"
                  onClick={() => handleTimeClick(hour, isOcupado)}
                  className={`w-full text-left p-3 rounded-xl text-sm font-medium transition-all border ${
                    isOcupado
                      ? 'bg-amber-950/20 border-amber-800/40 text-amber-400/70 cursor-not-allowed opacity-75'
                      : isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                        : 'bg-card hover:border-primary/50 border-border/60 hover:text-primary cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-base">
                      <span className={isOcupado ? 'text-amber-500/80' : ''}>
                        {hour}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                    </div>

                    {isOcupado ? (
                      <div className="flex items-center gap-1 text-xs text-amber-400/90 font-medium">
                        <AlertCircle className="w-3.5 h-3.5" /> Indisponível
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-green-500 text-xs font-medium">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        Livre
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