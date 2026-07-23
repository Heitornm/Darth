"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useUser } from '@/firebase';
import { SERVICES } from '@/data/services';
import { createNewAppointment } from '@/services/appointmentService';
import { BookingCalendarView } from '@/components/features/appointments/BookingCalendarView';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Scissors, Clock, CheckCircle2, Loader2, ArrowRight, ShoppingBag } from 'lucide-react';

function BookingFlowContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();

  const initialServiceId = searchParams.get('serviceId');
  const initialDate = searchParams.get('date');
  const initialTime = searchParams.get('time');

  // Estado dos serviços selecionados (Suporta Seleção Múltipla)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(() => {
    if (initialServiceId) return [initialServiceId];
    return [SERVICES[0]?.id || 'srv-1'];
  });

  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>(initialTime || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Restaura seleções salvas na sessão caso o usuário tenha ido fazer login
  useEffect(() => {
    const savedBooking = sessionStorage.getItem('darth_pending_booking');
    if (savedBooking) {
      try {
        const parsed = JSON.parse(savedBooking);
        if (parsed.selectedServiceIds) setSelectedServiceIds(parsed.selectedServiceIds);
        if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
        if (parsed.selectedTime) setSelectedTime(parsed.selectedTime);
        sessionStorage.removeItem('darth_pending_booking');
      } catch (e) {
        console.error("Erro ao restaurar agendamento:", e);
      }
    }
  }, []);

  // Alterna a seleção do card de serviço
  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      if (prev.includes(serviceId)) {
        if (prev.length === 1) return prev; // Mantém ao menos 1 selecionado
        return prev.filter((id) => id !== serviceId);
      }
      return [...prev, serviceId];
    });
  };

  // Cálculo dos totais acumulados
  const selectedServices = SERVICES.filter((s) => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((acc, curr) => acc + curr.price, 0);
  const totalDuration = selectedServices.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  const serviceNamesCombined = selectedServices.map((s) => s.name).join(' + ');

  const handleTimeSlotSelect = (date: string, time: string) => {
    setSelectedDate(date);
    setSelectedTime(time);
  };

  const handleFinalizeBooking = async () => {
    if (!selectedTime) {
      alert("Por favor, selecione um horário no calendário para prosseguir.");
      return;
    }

    // Se o usuário não estiver logado, salva as escolhas e envia para login
    if (!user) {
      sessionStorage.setItem(
        'darth_pending_booking',
        JSON.stringify({ selectedServiceIds, selectedDate, selectedTime })
      );
      router.push('/login?redirectTo=/client/appointments/new');
      return;
    }

    // Processa o agendamento no Firestore
    setIsSubmitting(true);
    try {
      await createNewAppointment({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Cliente',
        userEmail: user.email || '',
        serviceId: selectedServiceIds.join(','),
        serviceName: serviceNamesCombined,
        price: totalPrice,
        date: selectedDate,
        time: selectedTime,
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/client/appointments');
      }, 2000);
    } catch (err) {
      console.error("Erro ao realizar agendamento:", err);
      alert("Erro ao confirmar agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4 p-8 bg-card border border-primary/20 rounded-3xl shadow-2xl">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto animate-bounce" />
        <h2 className="text-2xl font-headline font-bold text-foreground">Agendamento Confirmado!</h2>
        <p className="text-muted-foreground text-sm">
          Seu atendimento (<strong>{serviceNamesCombined}</strong>) foi agendado para o dia <strong>{selectedDate}</strong> às <strong>{selectedTime}</strong>.
        </p>
        <p className="text-xs text-primary animate-pulse">Redirecionando para seu painel...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-12">
      <header className="text-center space-y-2">
        <h1 className="text-4xl md:text-5xl font-headline font-bold text-primary tracking-tight">
          Monte seu Atendimento
        </h1>
        <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
          Selecione um ou mais serviços em nossos cards e escolha o melhor horário na agenda do barbeiro.
        </p>
      </header>

      {/* Etapa 1: Seleção de Serviços em Cards */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
            <Scissors className="w-6 h-6 text-primary" /> 1. Escolha os Serviços
          </h2>
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-bold">
            {selectedServiceIds.length} selecionado(s)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SERVICES.map((service) => {
            const isSelected = selectedServiceIds.includes(service.id);

            return (
              <Card
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`cursor-pointer overflow-hidden transition-all duration-300 border ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/30 bg-primary/5 shadow-xl'
                    : 'border-border/60 bg-card/60 hover:border-primary/40'
                }`}
              >
                <div className="grid sm:grid-cols-5 h-full">
                  <div className="sm:col-span-2 relative h-48 sm:h-auto">
                    <Image
                      src={service.image}
                      alt={service.name}
                      width={400}
                      height={300}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-background/90 p-1.5 rounded-lg border border-border shadow-md">
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleService(service.id)} />
                    </div>
                  </div>

                  <div className="sm:col-span-3 p-5 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-headline font-bold text-lg text-foreground">{service.name}</h3>
                        <span className="text-accent font-bold text-base">R$ {service.price}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {service.desc}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border/40 text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground font-medium">
                        <Clock className="w-3.5 h-3.5 text-primary" /> {service.durationMinutes} min
                      </span>
                      <span className={`font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                        {isSelected ? '✓ Selecionado' : '+ Adicionar'}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Etapa 2: Seleção de Data e Horário */}
      <section className="space-y-4 pt-6 border-t border-border/60">
        <h2 className="text-2xl font-headline font-bold flex items-center gap-2">
          <Clock className="w-6 h-6 text-primary" /> 2. Escolha o Horário na Agenda
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <BookingCalendarView
              onSelectTimeSlot={handleTimeSlotSelect}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
            />
          </div>

          {/* Resumo do Pedido / Finalização */}
          <Card className="border-primary/30 bg-card/80 backdrop-blur-md shadow-2xl sticky top-24">
            <CardHeader className="border-b border-border/50 pb-4">
              <CardTitle className="text-lg font-headline font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" /> Resumo do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Serviços Incluídos:
                </p>
                <div className="space-y-2">
                  {selectedServices.map((s) => (
                    <div key={s.id} className="flex justify-between items-center text-sm font-medium">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground">R$ {s.price}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/50 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Duração Estimada:</span>
                  <strong className="text-foreground">{totalDuration} minutos</strong>
                </div>
                <div className="flex justify-between">
                  <span>Data do Atendimento:</span>
                  <strong className="text-foreground">{selectedDate}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Horário Selecionado:</span>
                  <strong className="text-primary font-bold">{selectedTime || 'Pendente'}</strong>
                </div>
              </div>

              <div className="pt-4 border-t border-border/50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-semibold text-muted-foreground">Total:</span>
                  <span className="text-3xl font-headline font-bold text-accent">R$ {totalPrice},00</span>
                </div>

                <Button
                  onClick={handleFinalizeBooking}
                  disabled={isSubmitting || !selectedTime}
                  className="w-full h-13 rounded-xl font-headline font-bold text-base gap-2 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Processando...
                    </>
                  ) : !user ? (
                    <>
                      Entrar e Finalizar <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Confirmar Agendamento <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <BookingFlowContent />
    </Suspense>
  );
}