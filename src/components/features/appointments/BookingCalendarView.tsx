"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, Loader2, CheckCircle2 } from 'lucide-react';
import { getBookedSlotsByDate } from '@/services/appointmentService';

const AVAILABLE_HOURS = [
  "09:00", "10:00", "11:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

interface BookingCalendarViewProps {
  onSelectTimeSlot?: (date: string, time: string) => void;
  selectedDate?: string;
  selectedTime?: string;
}

export function BookingCalendarView({
  onSelectTimeSlot,
  selectedDate: initialDate,
  selectedTime: initialTime
}: BookingCalendarViewProps) {
  const [date, setDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [time, setTime] = useState<string>(initialTime || '');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    async function loadAgenda() {
      if (!date) return;
      setLoading(true);
      try {
        const booked = await getBookedSlotsByDate(date);
        setBookedTimes(booked);
      } catch (error) {
        console.error("Erro ao carregar horários:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAgenda();
  }, [date]);

  const handleTimeClick = (selectedTimeSlot: string) => {
    setTime(selectedTimeSlot);
    if (onSelectTimeSlot) {
      onSelectTimeSlot(date, selectedTimeSlot);
    }
  };

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
            min={new Date().toISOString().split('T')[0]}
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setTime('');
            }}
            className="w-full bg-background border border-border/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary font-medium"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-primary" /> Horários Disponíveis
            </label>
            <span className="text-[11px] text-muted-foreground">
              {AVAILABLE_HOURS.length - bookedTimes.length} horários vagos
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {AVAILABLE_HOURS.map((hour) => {
              const isBooked = bookedTimes.includes(hour);
              const isSelected = time === hour;

              return (
                <button
                  key={hour}
                  disabled={isBooked}
                  onClick={() => handleTimeClick(hour)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                    isBooked
                      ? 'bg-muted/30 text-muted-foreground/50 border-transparent cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105'
                      : 'bg-card hover:border-primary/50 border-border/60 hover:text-primary'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {hour} {isBooked && '(Ocupado)'}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}