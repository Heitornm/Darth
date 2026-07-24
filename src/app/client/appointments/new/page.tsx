'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Scissors } from 'lucide-react';
import { format, addMinutes, isAfter, isBefore, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import CheckoutButton from '@/components/features/checkout/CheckoutButton';

interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
}

function ServiceSelector({
  services,
  selectedServiceIds,
  onToggleService,
}: {
  services: Service[];
  selectedServiceIds: string[];
  onToggleService: (service: Service) => void;
}) {
  return (
    <div className="grid gap-3">
      {services.map((service) => {
        const selected = selectedServiceIds.includes(service.id);

        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onToggleService(service)}
            className={`w-full rounded-lg border px-4 py-4 text-left transition ${
              selected
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:border-primary'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {service.durationMinutes ?? 30} minutos
                </p>
              </div>
              <span className="font-semibold">
                {service.price.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

const SERVICES: Service[] = [
  { id: 'srv-1', name: 'Corte Clássico', price: 1, durationMinutes: 30 },
  { id: 'srv-2', name: 'Barba Completa', price: 1, durationMinutes: 30 },
  { id: 'srv-3', name: 'Combo (Corte + Barba)', price: 1, durationMinutes: 60 },
  { id: 'srv-4', name: 'Corte Premium', price: 1, durationMinutes: 45 },
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
  const { user, appointments } = useFirebase();

  const [date, setDate] = useState<Date>();
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [time, setTime] = useState<string>("");

  const handleToggleService = (service: Service) => {
    setSelectedServices((prev) => {
      const exists = prev.some((s) => s.id === service.id);
      if (exists) {
        return prev.filter((s) => s.id !== service.id);
      } else {
        return [...prev, service];
      }
    });
    setTime("");
  };

  const totalPrice = selectedServices.reduce((acc, curr) => acc + curr.price, 0);
  const totalDuration = selectedServices.reduce((acc, curr) => acc + (curr.durationMinutes || 30), 0);
  const combinedServiceIds = selectedServices.map((s) => s.id).join(',');
  const combinedServiceNames = selectedServices.map((s) => s.name).join(' + ');

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
    return occupied >= TOTAL_MINUTES_PER_DAY;
  };

  const isTimeSlotAvailable = (timeSlot: string) => {
    if (!date || selectedServices.length === 0 || !appointments) return true;

    const [hours, minutes] = timeSlot.split(':').map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = addMinutes(slotStart, totalDuration);

    if (isBefore(slotStart, new Date())) return false;

    return !appointments.filter(a => a.status !== 'cancelado').some(apt => {
      const aptStart = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
      const aptEnd = addMinutes(aptStart, apt.durationMinutes || 30);
      return isBefore(slotStart, aptEnd) && isAfter(slotEnd, aptStart);
    });
  };

  const fullSelectedDate = useMemo(() => {
    if (!date || !time) return null;
    const [hours, minutes] = time.split(':').map(Number);
    const targetDate = new Date(date);
    targetDate.setHours(hours, minutes, 0, 0);
    return targetDate;
  }, [date, time]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-headline font-bold text-primary">Agende seu Estilo</h1>
      </div>

      <Card className="border-primary/20 max-w-2xl mx-auto">
        <CardHeader className="bg-primary/5">
          <CardTitle className="font-headline flex items-center gap-3 text-primary text-xl">
            <Scissors className="w-5 h-5" /> Reserva de Serviço
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="space-y-2">
            <Label className="text-base font-semibold">1. Serviços</Label>
            <ServiceSelector
              services={SERVICES}
              selectedServiceIds={selectedServices.map((s) => s.id)}
              onToggleService={handleToggleService}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-base font-semibold">2. Dia</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full h-11 justify-start", !date && "text-muted-foreground")}>
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
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">3. Hora</Label>
              <Select value={time} onValueChange={setTime} disabled={!date || selectedServices.length === 0}>
                <SelectTrigger className="w-full h-11">
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

          {!user ? (
            <Button className="w-full h-12 text-lg font-headline" onClick={() => router.push('/login')}>
              Faça Login para Agendar
            </Button>
          ) : (!date || selectedServices.length === 0 || !time || !fullSelectedDate) ? (
            <Button className="w-full h-12 text-lg font-headline" disabled>
              Selecione os Campos Acima
            </Button>
          ) : (
            <CheckoutButton
              clientId={user.uid}
              clientName={user.displayName || user.email || 'Cliente'}
              clientEmail={user.email || ''}
              barberId={MASTER_BARBER_ID}
              serviceId={combinedServiceIds}
              serviceName={combinedServiceNames}
              price={totalPrice}
              dataHoraSelection={fullSelectedDate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}