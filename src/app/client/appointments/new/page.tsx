'use client';

export const dynamic = 'force-dynamic';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Scissors } from 'lucide-react';
import { format, addMinutes, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const SERVICES = [
  { id: 'srv-1', name: 'Corte Clássico', price: 50, durationMinutes: 30 },
  { id: 'srv-2', name: 'Barba Completa', price: 40, durationMinutes: 30 },
  { id: 'srv-3', name: 'Combo (Corte + Barba)', price: 80, durationMinutes: 60 },
  { id: 'srv-4', name: 'Corte Premium', price: 70, durationMinutes: 45 },
];

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'
];

const WORK_START = 8;
const WORK_END = 21;
const TOTAL_MINUTES_PER_DAY = (WORK_END - WORK_START) * 60;

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, appointments } = useFirebase();

  const urlServiceId = searchParams.get('serviceId');

  const [date, setDate] = useState<Date>();
  const [serviceId, setServiceId] = useState<string>("");
  const [time, setTime] = useState<string>("");

  // Se o serviço vier especificado na URL, pré-seleciona no formulário
  useEffect(() => {
    if (urlServiceId) {
      setServiceId(urlServiceId);
    }
  }, [urlServiceId]);

  const selectedService = SERVICES.find(s => s.id === serviceId);

  const availabilityData = useMemo(() => {
    if (!appointments) return {};
    const stats: Record<string, number> = {};
    appointments.forEach(apt => {
      if (apt.status === 'cancelado' || apt.status === 'canceled') return;
      const aptDate = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
      const dayKey = format(aptDate, 'yyyy-MM-dd');
      stats[dayKey] = (stats[dayKey] || 0) + (apt.durationMinutes || 30);
    });
    return stats;
  }, [appointments]);

  const isDayFull = (d: Date) => {
    const dayKey = format(d, 'yyyy-MM-dd');
    const occupied = availabilityData[dayKey] || 0;
    return occupied >= TOTAL_MINUTES_PER_DAY;
  };

  const isTimeSlotAvailable = (timeSlot: string) => {
    if (!date || !selectedService || !appointments) return true;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, selectedService.durationMinutes);

    if (isBefore(slotStart, new Date())) return false;

    const now = new Date();

    return !appointments.filter(a => {
      if (a.status === 'cancelado' || a.status === 'canceled') return false;

      // Trava de 10 minutos para agendamentos pendentes de pagamento
      if (a.status === 'pendente' || a.status === 'pending') {
        const createdAt = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || Date.now());
        const expiresAt = new Date(createdAt.getTime() + 10 * 60 * 1000);
        if (isAfter(now, expiresAt)) {
          return false; // Expirou: libera o horário na agenda
        }
      }
      return true;
    }).some(apt => {
      const aptStart = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
      const aptEnd = addMinutes(aptStart, apt.durationMinutes || 30);
      return isBefore(slotStart, aptEnd) && isAfter(slotEnd, aptStart);
    });
  };

  const handleBooking = () => {
    if (!user) {
      toast({ title: "Login necessário", description: "Faça login para continuar com o agendamento." });
      router.push('/login');
      return;
    }

    if (!date || !serviceId || !time) {
      toast({ title: "Campos obrigatórios", description: "Por favor, selecione serviço, data e horário.", variant: "destructive" });
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    router.push(`/client/checkout?serviceId=${serviceId}&date=${dateStr}&time=${time}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Agende seu Estilo</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5">
              <CardTitle className="font-headline flex items-center gap-3 text-primary">
                <Scissors className="w-5 h-5" /> Reserva de Horário
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label>1. Serviço</Label>
                <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setTime(""); }}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Escolha um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(srv => (
                      <SelectItem key={srv.id} value={srv.id}>{srv.name} — R$ {srv.price.toFixed(2)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label>2. Dia</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-12 justify-start", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                        {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Escolha a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => {
                          if (d) {
                            if (isDayFull(d)) {
                              toast({ title: "Dia lotado", description: "Infelizmente não há horários disponíveis.", variant: "destructive" });
                              return;
                            }
                            setDate(d);
                            setTime("");
                          }
                        }}
                        locale={ptBR}
                        disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date())) || isDayFull(d)}
                        modifiers={{
                          full: (d) => isDayFull(d) && !isBefore(startOfDay(d), startOfDay(new Date())),
                        }}
                        modifiersStyles={{
                          full: {
                            backgroundColor: '#ef4444',
                            color: 'white',
                            fontWeight: 'bold',
                            opacity: 1
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-3">
                  <Label>3. Hora</Label>
                  <Select value={time} onValueChange={setTime} disabled={!date || !serviceId}>
                    <SelectTrigger className="w-full h-12">
                      <Clock className="w-4 h-4 mr-3 text-primary" />
                      <SelectValue placeholder="Escolha a hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => {
                        const available = isTimeSlotAvailable(slot);
                        return <SelectItem key={slot} value={slot} disabled={!available}>{slot} {!available && "(Ocupado)"}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="w-full h-14 text-xl font-headline"
                onClick={handleBooking}
                disabled={!date || !serviceId || !time}
              >
                Prosseguir para o Pagamento
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ClientAppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Carregando formulário de agendamento...
      </div>
    }>
      <NewAppointmentContent />
    </Suspense>
  );
}