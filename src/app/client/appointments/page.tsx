
"use client";

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Scissors, CheckCircle2, Star } from 'lucide-react';
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

  // Calcula ocupação por dia para o calendário
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
      toast({ title: "Campos obrigatórios", description: "Por favor, preencha todos os campos.", variant: "destructive" });
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
        const notificationData = {
          toId: MASTER_BARBER_ID,
          fromName: user.displayName || 'Cliente',
          type: 'new_appointment',
          message: `Novo agendamento: ${selectedService?.name} em ${format(appointmentDate, "dd/MM 'às' HH:mm")}`,
          read: false,
          createdAt: Timestamp.now()
        };
        addDoc(collection(firestore, "notifications"), notificationData).catch(() => {});
        toast({ title: "Sucesso!", description: "Seu agendamento foi realizado e aguarda confirmação." });
        router.push('/client/my-appointments');
      })
      .catch(async (err) => {
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
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary">Agende seu Estilo</h1>
        <p className="text-muted-foreground text-lg">Confira a disponibilidade e reserve seu momento.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/20 bg-card shadow-xl">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
              <CardTitle className="font-headline flex items-center gap-3 text-primary">
                <Scissors className="w-5 h-5" />
                Configuração do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="space-y-3">
                <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">1. Qual o serviço?</Label>
                <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setTime(""); }}>
                  <SelectTrigger className="w-full h-12">
                    <SelectValue placeholder="Escolha um serviço mestre" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(srv => (
                      <SelectItem key={srv.id} value={srv.id}>
                        {srv.name} — R$ {srv.price} ({srv.durationMinutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">2. Qual o dia?</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full h-12 justify-start text-left font-normal border-primary/20 hover:bg-primary/5", !date && "text-muted-foreground")}>
                        <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                        {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Escolha a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(d) => { 
                          if (d && !isDayFull(d)) {
                            setDate(d); 
                            setTime(""); 
                          }
                        }}
                        locale={ptBR}
                        disabled={(d) => isBefore(startOfDay(d), startOfDay(new Date())) || isDayFull(d)}
                        modifiers={{
                          full: (d) => isDayFull(d) && !isBefore(startOfDay(d), startOfDay(new Date())),
                          available: (d) => !isDayFull(d) && !isBefore(startOfDay(d), startOfDay(new Date()))
                        }}
                        modifiersClassNames={{
                          full: "!bg-destructive !text-destructive-foreground !opacity-100 font-bold cursor-not-allowed",
                          available: "bg-green-500/10 text-green-500 font-bold"
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex gap-4 mt-2">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 uppercase"><div className="w-2 h-2 rounded-full bg-green-500" /> Disponível</span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-destructive uppercase"><div className="w-2 h-2 rounded-full bg-destructive" /> Lotado</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">3. Qual o horário?</Label>
                  <Select value={time} onValueChange={setTime} disabled={!date || !serviceId}>
                    <SelectTrigger className="w-full h-12">
                      <Clock className="w-4 h-4 mr-3 text-primary" />
                      <SelectValue placeholder="Escolha a hora" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {TIME_SLOTS.map(slot => {
                        const available = isTimeSlotAvailable(slot);
                        return (
                          <SelectItem key={slot} value={slot} disabled={!available}>
                            {slot} {!available && "(Ocupado)"}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full h-14 text-xl font-headline bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                onClick={handleBooking}
                disabled={loading || !date || !serviceId || !time}
              >
                {loading ? "Processando seu lugar..." : user ? "Confirmar Reserva Mestre" : "Faça Login para Agendar"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-muted bg-muted/20 border-dashed">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Resumo da Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm">
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Serviço</span>
                <span className="font-bold">{selectedService?.name || '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Investimento</span>
                <span className="font-bold text-accent">{selectedService ? `R$ ${selectedService.price}` : '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border/50 pb-3">
                <span className="text-muted-foreground uppercase text-[10px] font-bold tracking-wider">Agenda</span>
                <span className="font-bold">
                  {date && time ? `${format(date, "dd/MM/yy")} às ${time}` : '---'}
                </span>
              </div>
              
              <div className="p-4 bg-primary/10 rounded-xl flex items-start gap-3 text-primary text-xs leading-relaxed italic">
                <Star className="w-4 h-4 shrink-0 fill-primary" />
                <p>Nossos mestres garantem a precisão. Datas em vermelho indicam que o barbeiro atingiu o limite de atendimentos no expediente das 08h às 21h.</p>
              </div>

              <div className="pt-2 flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Qualidade DarthBarber
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
