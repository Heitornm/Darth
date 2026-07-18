'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/features/services/ServiceCarousel';
import { SERVICES } from '@/data/services';
import CheckoutButton from '@/components/features/checkout/CheckoutButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useFirebase } from '@/firebase';
import { ptBR } from 'date-fns/locale';
import { isBefore, startOfDay, format, setHours, setMinutes, getDay, addMinutes } from 'date-fns';
import { Clock, Scissors, LogIn, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 🚀 COMPONENTE SKELETON: Imita perfeitamente a estrutura visual da página real
function AppointmentSkeleton() {
  return (
    <div className="max-w-5xl w-full space-y-8 animate-pulse">
      {/* Botão de Voltar e Título */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 bg-muted rounded-xl"></div>
        <div className="h-8 w-52 bg-muted rounded-xl"></div>
      </div>

      {/* Passo 1 Skeleton: Carrossel */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="bg-muted w-6 h-6 rounded-full"></div>
          <div className="h-5 w-48 bg-muted rounded-md"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="h-28 bg-muted rounded-2xl"></div>
          <div className="h-28 bg-muted rounded-2xl hidden sm:block"></div>
          <div className="h-28 bg-muted rounded-2xl hidden sm:block"></div>
          <div className="h-28 bg-muted rounded-2xl hidden sm:block"></div>
        </div>
      </div>

      {/* Passo 2 e 3 Skeletons: Lado a Lado */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
        {/* Calendário (Esquerda) */}
        <div className="md:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-muted w-6 h-6 rounded-full"></div>
            <div className="h-5 w-32 bg-muted rounded-md"></div>
          </div>
          <div className="h-[310px] w-full bg-muted rounded-2xl"></div>
        </div>

        {/* Horários (Direita) */}
        <div className="md:col-span-7 space-y-4">
          <div className="flex items-center gap-2">
            <div className="bg-muted w-6 h-6 rounded-full"></div>
            <div className="h-5 w-52 bg-muted rounded-md"></div>
          </div>
          <div className="border border-muted/40 rounded-2xl p-6 space-y-6">
            <div className="h-6 w-36 bg-muted rounded-md mb-2"></div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-11 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
          {/* Botão de Checkout */}
          <div className="h-16 w-full bg-muted rounded-2xl pt-2"></div>
        </div>
      </div>
    </div>
  );
}

// Componente que consome os parâmetros da URL e gerencia o fluxo
function AppointmentFormContent() {
  const { user, isUserLoading, userProfile, appointments } = useFirebase();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    const srvId = searchParams.get('serviceId');
    if (srvId) {
      const foundService = SERVICES.find(s => s.id === srvId);
      if (foundService) setSelectedService(foundService);
    }
    
    if (new Date().getDay() === 1) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
    }
  }, [searchParams]);

  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate, selectedService]);

  const timeSlotsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = getDay(selectedDate);
    
    if (dayOfWeek === 1) return [];

    const slots: string[] = [];
    const startHour = dayOfWeek === 0 ? 8 : 9;  
    const endHour = dayOfWeek === 0 ? 12 : 21; 

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, [selectedDate]);

  const availabilityData = useMemo(() => {
    const occupiedSlots = new Set<string>();
    if (!appointments) return occupiedSlots;

    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    appointments.forEach(apt => {
      if (apt.status === 'cancelado') return;

      if (apt.status === 'pendente' && apt.createdAt) {
        const creationTime = (apt.createdAt as any).toDate 
          ? (apt.createdAt as any).toDate().getTime() 
          : new Date(apt.createdAt).getTime();
        
        if (creationTime < tenMinutesAgo) return; 
      }

      const date = apt.dataHora && typeof apt.dataHora === 'object' && 'toDate' in apt.dataHora
        ? (apt.dataHora as any).toDate()
        : new Date(apt.dataHora);
      
      const dayKey = format(date, 'yyyy-MM-dd');
      const timeKey = format(date, 'HH:mm');
      occupiedSlots.add(`${dayKey}_${timeKey}`);

      if ((apt.durationMinutes || 30) > 30) {
        const nextSlotDate = addMinutes(date, 30);
        occupiedSlots.add(`${dayKey}_${format(nextSlotDate, 'HH:mm')}`);
      }
    });
    
    return occupiedSlots;
  }, [appointments]);

  const isTimeSlotDisabled = (time: string) => {
    const dayStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';
    if (availabilityData.has(`${dayStr}_${time}`)) return true;

    if (selectedService && selectedService.durationMinutes > 30) {
      const index = timeSlotsForSelectedDay.indexOf(time);
      if (index === timeSlotsForSelectedDay.length - 1) return true;
      
      const nextTimeSlot = timeSlotsForSelectedDay[index + 1];
      if (!nextTimeSlot || availabilityData.has(`${dayStr}_${nextTimeSlot}`)) return true;
    }
    return false;
  };

  const finalDateTimeSelection = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    return setMinutes(setHours(selectedDate, hours), minutes);
  }, [selectedDate, selectedTime]);

  if (!mounted) return null;

  // 🚀 CARREGAMENTO INTELIGENTE: Entrega o Skeleton enquanto o Firebase valida o login/dados
  if (isUserLoading) {
    return <AppointmentSkeleton />;
  }

  return (
    <div className="max-w-5xl w-full space-y-8">
      {/* Cabeçalho Voltar */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.push('/')} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para o Início
        </Button>
        <h1 className="text-2xl font-headline font-bold text-primary">Agendar um Horário</h1>
      </div>

      {/* PASSO 1: Escolha do Serviço */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground font-semibold">
          <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">1</div>
          <h2>Escolha o Serviço desejado:</h2>
        </div>
        <ServiceCarousel 
          onSelectService={(srv) => setSelectedService(srv)} 
          selectedServiceId={selectedService?.id}
        />
      </div>

      {/* PASSO 2 e 3: Calendário e Horários lado a lado */}
      <div className={`grid grid-cols-1 md:grid-cols-12 gap-8 pt-4 transition-all duration-300 ${
        !selectedService ? 'opacity-40 pointer-events-none select-none' : ''
      }`}>
        
        {/* Calendário (Esquerda) */}
        <div className="md:col-span-5">
          <div className="flex items-center gap-2 text-muted-foreground font-semibold mb-4">
            <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">2</div>
            <h2>Selecione o Dia:</h2>
          </div>
          <Card className="border-primary/20 bg-card/60 shadow-xl">
            <CardContent className="p-4 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && getDay(d) !== 1 && !isBefore(startOfDay(d), startOfDay(new Date())) && setSelectedDate(d)}
                locale={ptBR}
                className="w-full"
                disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || getDay(date) === 1}
              />
            </CardContent>
          </Card>
        </div>

        {/* Horários (Direita) */}
        <div className="md:col-span-7 space-y-6">
          <div className="flex items-center gap-2 text-muted-foreground font-semibold mb-4">
            <div className="bg-primary/20 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs">3</div>
            <h2>Escolha um Horário Disponível:</h2>
          </div>
          <Card className="border-primary/20 bg-card/60 shadow-xl">
            <CardHeader className="border-b border-primary/10 pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {timeSlotsForSelectedDay.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {timeSlotsForSelectedDay.map((time) => {
                    const isDisabled = isTimeSlotDisabled(time);
                    return (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={isDisabled}
                        onClick={() => setSelectedTime(time)}
                        className={`h-11 font-medium transition-all ${isDisabled ? 'opacity-25 cursor-not-allowed bg-muted' : ''}`}
                      >
                        {time}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">Fechado nesta data.</p>
              )}
            </CardContent>
          </Card>

          {/* Ação de Finalização do Checkout */}
          <div className="pt-4">
            {!isUserLoading ? (
              <>
                {!selectedService || !selectedTime ? (
                  <Button disabled className="w-full h-16 text-lg font-headline rounded-2xl gap-3 bg-muted text-muted-foreground">
                    <Scissors className="w-5 h-5" />
                    {!selectedService ? "Selecione o Serviço no Passo 1" : "Selecione o Horário no Passo 3"}
                  </Button>
                ) : user ? (
                  <CheckoutButton 
                    clientId={user.uid}
                    clientName={user.displayName || userProfile?.name || 'Cliente'}
                    clientEmail={user.email}
                    barberId="eUCAkXknM1N0mcC04hCIfF3HcMk1"
                    serviceId={selectedService.id}
                    serviceName={selectedService.name}
                    price={selectedService.price}
                    dataHoraSelection={finalDateTimeSelection || new Date()}
                  />
                ) : (
                  <Button asChild className="w-full h-16 text-lg font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3">
                    <Link href={`/login?redirect=/client/appointments/new&serviceId=${selectedService.id}`}>
                      <LogIn className="w-5 h-5" />
                      Entrar para Concluir Agendamento
                    </Link>
                  </Button>
                )}
              </>
            ) : (
              <div className="h-16 w-full bg-muted animate-pulse rounded-2xl"></div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Componente principal envelopado com o Suspense Boundary para o Next.js
export default function NewAppointmentPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-8 md:py-12 flex flex-col items-center">
      {/* 🚀 Passamos o mesmo Skeleton como fallback do Suspense, matando o loading estático no build */}
      <Suspense fallback={<AppointmentSkeleton />}>
        <AppointmentFormContent />
      </Suspense>
    </div>
  );
}