'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { ServiceCarousel, SERVICES } from '@/components/features/services/ServiceCarousel';
import CheckoutButton from '@/components/features/checkout/CheckoutButton';
import Link from 'next/link';
import { LogIn, Scissors, ClipboardList, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useFirebase } from '@/firebase';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { isBefore, startOfDay, format, setHours, setMinutes, getDay, addMinutes } from 'date-fns';

export default function Home() {
  const { user, isUserLoading, userProfile, appointments } = useFirebase();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);

  useEffect(() => {
    setMounted(true);
    // Se o dia atual for segunda (0), inicializa com o próximo dia (terça)
    if (new Date().getDay() === 1) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setSelectedDate(tomorrow);
    }
  }, []);

  // Reseta o horário se mudar de dia ou de serviço
  useEffect(() => {
    setSelectedTime(null);
  }, [selectedDate, selectedService]);

  // Define os horários de funcionamento com base no dia da semana escolhido
  const timeSlotsForSelectedDay = useMemo(() => {
    if (!selectedDate) return [];
    const dayOfWeek = getDay(selectedDate); // 0 = Domingo, 1 = Segunda, 2 = Terça...

    if (dayOfWeek === 1) return []; // Segunda-feira fechado

    const slots: string[] = [];
    const startHour = dayOfWeek === 0 ? 8 : 9;  // Domingo às 8h, Terça a Sábado às 9h
    const endHour = dayOfWeek === 0 ? 12 : 21; // Domingo até 12h, Terça a Sábado até 21h

    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return slots;
  }, [selectedDate]);

  // Processa agendamentos existentes para obter a ocupação em tempo real
  const availabilityData = useMemo(() => {
    const occupiedSlots = new Set<string>();
    if (!appointments) return occupiedSlots;

    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;

    appointments.forEach(apt => {
      if (apt.status === 'cancelado') return;

      // Se o agendamento estiver pendente e foi criado há mais de 10 minutos, ignoramos (libera o horário)
      if (apt.status === 'pendente' && apt.createdAt) {
        const creationTime = (apt.createdAt as any).toDate
          ? (apt.createdAt as any).toDate().getTime()
          : new Date(apt.createdAt).getTime();

        if (creationTime < tenMinutesAgo) return; // Não ocupa espaço na agenda
      }

      const date =
        apt.dataHora &&
          typeof apt.dataHora === 'object' &&
          'toDate' in apt.dataHora &&
          typeof (apt.dataHora as any).toDate === 'function'
          ? (apt.dataHora as any).toDate()
          : new Date(apt.dataHora);

      const dayKey = format(date, 'yyyy-MM-dd');
      const timeKey = format(date, 'HH:mm');
      occupiedSlots.add(`${dayKey}_${timeKey}`);

      const duration = apt.durationMinutes || 30;
      if (duration > 30) {
        const nextSlotDate = addMinutes(date, 30);
        const nextTimeKey = format(nextSlotDate, 'HH:mm');
        occupiedSlots.add(`${dayKey}_${nextTimeKey}`);
      }
    });

    return occupiedSlots;
  }, [appointments]);

  // Função auxiliar para verificar se um bloco específico está livre
  const isSlotOccupied = (timeStr: string) => {
    if (!selectedDate) return true;
    const dayStr = format(selectedDate, 'yyyy-MM-dd');
    return availabilityData.has(`${dayStr}_${timeStr}`);
  };

  // Regra de negócio: Se o procedimento levar mais de 30 min, precisa de 1 hora inteira livre (2 slots)
  const isTimeSlotDisabled = (time: string) => {
    if (isSlotOccupied(time)) return true;

    // Se houver um serviço selecionado e ele demorar mais que 30 minutos
    if (selectedService && selectedService.durationMinutes > 30) {
      const index = timeSlotsForSelectedDay.indexOf(time);
      // Se for o último horário do dia, não cabe um procedimento de 1 hora
      if (index === timeSlotsForSelectedDay.length - 1) return true;

      // Verifica se o próximo bloco de 30 minutos também está ocupado
      const nextTimeSlot = timeSlotsForSelectedDay[index + 1];
      if (!nextTimeSlot || isSlotOccupied(nextTimeSlot)) return true;
    }

    return false;
  };

  // Junta o dia e o horário selecionados
  const finalDateTimeSelection = useMemo(() => {
    if (!selectedDate || !selectedTime) return null;
    const [hours, minutes] = selectedTime.split(':').map(Number);
    let combined = setHours(selectedDate, hours);
    combined = setMinutes(combined, minutes);
    return combined;
  }, [selectedDate, selectedTime]);

  const barberImage = PlaceHolderImages.find(img => img.id === 'barber-profile');

  return (
    <div className="flex flex-col items-center min-h-[85vh] px-4 py-12 md:py-20">
      <div className="max-w-6xl w-full text-center space-y-16">

        {/* Topo / Título */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary tracking-tight">
            DARTH
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Garanta sua experiência com nossos especialistas.
          </p>
        </div>

        {/* Carrossel de Serviços */}
        <div className="relative w-full py-4 overflow-hidden">
          <ServiceCarousel
            onSelectService={(srv) => setSelectedService(srv)}
            selectedServiceId={selectedService?.id}
          />
        </div>

        {/* Seção Central Principal: Calendário à Esquerda, Horários à Direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">

          {/* Calendário (Esquerda - Ocupa 5 colunas em telas grandes) */}
          <div className="lg:col-span-5 w-full flex justify-center">
            <Card className="border-primary/20 bg-card/60 shadow-2xl w-full max-w-[400px]">
              <CardHeader className="border-b border-primary/10 pb-4">
                <CardTitle className="font-headline text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                  Selecione a Data
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex justify-center">
                <div className="w-full block-calendar-wrapper">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(d: Date | undefined) => {
                      if (d && !isBefore(startOfDay(d), startOfDay(new Date())) && getDay(d) !== 1) {
                        setSelectedDate(d);
                      }
                    }}
                    locale={ptBR}
                    className="rounded-md border border-primary/5 shadow-inner w-full"
                    disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || getDay(date) === 1}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listagem de Horários e Fluxo de Agendamento (Direita - Ocupa 7 colunas) */}
          <div className="lg:col-span-7 space-y-6 w-full">
            <Card className="border-primary/20 bg-card/60 shadow-2xl">
              <CardHeader className="border-b border-primary/10 pb-4">
                <CardTitle className="font-headline text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Horários para {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : ''}
                  </div>
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
                  <p className="text-muted-foreground text-center py-4">Estabelecimento fechado às segundas-feiras.</p>
                )}
              </CardContent>
            </Card>

            {/* Botão de Ação / Validação do Pedido */}
            <div className="w-full">
              {mounted && !isUserLoading ? (
                <>
                  {!selectedService || !selectedTime ? (
                    <Button disabled size="lg" className="w-full h-16 text-xl font-headline rounded-2xl gap-3 bg-muted text-muted-foreground">
                      <Scissors className="w-6 h-6" />
                      {!selectedService ? "1º Selecione um Serviço no Carrossel" : "2º Escolha um Horário Disponível"}
                    </Button>
                  ) : user ? (
                    userProfile?.role === 'barber' ? (
                      <Button asChild size="lg" className="w-full h-16 text-xl font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3">
                        <Link href="/barber/appointments">
                          <ClipboardList className="w-6 h-6" />
                          Minha Agenda
                        </Link>
                      </Button>
                    ) : (
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
                    )
                  ) : (
                    <Button asChild size="lg" className="w-full h-16 text-xl font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3">
                      <Link href={`/login?redirect=/&date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}&time=${selectedTime}&serviceId=${selectedService.id}`}>
                        <LogIn className="w-6 h-6" />
                        Entrar para Agendar
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

        {/* Rodapé de Informações: Div do Barbeiro e Quadro de Horários */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-8 border-t border-primary/10">

          {/* Cartão de Identidade do Barbeiro */}
          <Card className="md:col-span-2 border-primary/20 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden group">
            <CardContent className="p-6 flex items-center gap-6">
              <Avatar className="h-20 w-20 border-2 border-primary/30">
                <AvatarImage
                  src={barberImage?.imageUrl}
                  alt="Darth Barber"
                  data-ai-hint={barberImage?.imageHint}
                  className="object-cover"
                />
                <AvatarFallback>DB</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-headline font-bold text-xl text-primary">Darth Barber</h2>
                <p className="text-muted-foreground text-sm italic">Especialista em visagismo, cortes clássicos e barba completa sob medida.</p>
              </div>
            </CardContent>
          </Card>

          {/* Quadro Geral de Funcionamento Comercial */}
          <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20 flex flex-col justify-center">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-accent" />
              <h3 className="font-headline font-bold text-accent uppercase tracking-wider text-xs">Expediente Oficial</h3>
            </div>
            <p className="text-sm font-semibold">Terça a Sábado: <span className="text-primary font-bold">09:00 — 21:00</span></p>
            <p className="text-sm font-semibold mt-1">Domingos: <span className="text-primary font-bold">08:00 — 12:00</span></p>
            <p className="text-[11px] text-muted-foreground mt-2">Segunda-feira: Fechado para manutenção institucional.</p>
          </div>

        </div>

      </div>
    </div>
  );
}