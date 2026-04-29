'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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
import { collection, Timestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

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

const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';
const WORK_START = 8;
const WORK_END = 21;
const TOTAL_MINUTES_PER_DAY = (WORK_END - WORK_START) * 60;

export default function ClientAppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, appointments, firestore } = useFirebase();

  const [date, setDate] = useState<Date>();
  const [serviceId, setServiceId] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const selectedService = SERVICES.find(s => s.id === serviceId);

  const availabilityData = useMemo(() => {
    if (!appointments) return {};
    const stats: Record<string, number> = {};
    appointments.forEach(apt => {
      if (apt.status === 'cancelado') return;
      const aptDate = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
      const dayKey = format(aptDate, 'yyyy-MM-dd');
      stats[dayKey] = (stats[dayKey] || 0) + (apt.durationMinutes || 30);
    });
    return stats;
  }, [appointments]);

  const isDayFull = (d: Date) => {
    const dayKey = format(d, 'yyyy-MM-dd');
    const occupied = availabilityData[dayKey] || 0;
    // Se occupied for maior ou igual ao total disponível, o dia está cheio
    return occupied >= TOTAL_MINUTES_PER_DAY;
  };

  const isTimeSlotAvailable = (timeSlot: string) => {
    if (!date || !selectedService || !appointments) return true;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, selectedService.durationMinutes);

    if (isBefore(slotStart, new Date())) return false;

    return !appointments.filter(a => a.status !== 'cancelado').some(apt => {
      const aptStart = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
      const aptEnd = addMinutes(aptStart, apt.durationMinutes || 30);
      return isBefore(slotStart, aptEnd) && isAfter(slotEnd, aptStart);
    });
  };

  const handleBooking = () => {
    if (!user || !firestore) {
      toast({ title: "Login necessário", description: "Faça login para agendar." });
      router.push('/login');
      return;
    }

    if (!date || !serviceId || !time) {
      toast({ title: "Campos obrigatórios", description: "Preencha tudo.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const appointmentData = {
      clientId: user.uid,
      clientEmail: user.email,
      clientName: user.displayName || user.email,
      barberId: MASTER_BARBER_ID,
      serviceId,
      serviceName: selectedService?.name,
      durationMinutes: selectedService?.durationMinutes,
      price: selectedService?.price,
      dataHora: Timestamp.fromDate(appointmentDate),
      status: 'pendente',
      createdAt: Timestamp.now(),
    };

    addDoc(collection(firestore, "appointments"), appointmentData)
      .then(() => {
        toast({ title: "Sucesso!", description: "Seu agendamento foi realizado." });
        router.push('/client/my-appointments');
      })
      .catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: 'appointments',
          operation: 'create',
          requestResourceData: appointmentData,
        } satisfies SecurityRuleContext));
      })
      .finally(() => setLoading(false));
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
                <Scissors className="w-5 h-5" /> Reserva
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
                      <SelectItem key={srv.id} value={srv.id}>{srv.name} — R$ {srv.price}</SelectItem>
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
                              toast({ title: "Dia lotado", description: "Infelizmente não há horários.", variant: "destructive" });
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
                disabled={loading || !date || !serviceId || !time}
              >
                Confirmar Reserva
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}