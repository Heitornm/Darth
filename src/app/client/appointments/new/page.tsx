"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/firebase'; // Usa o hook nativo da sua estrutura do Firebase
import { SERVICES } from '@/data/services';
import { getBookedSlotsByDate, createNewAppointment } from '@/services/appointmentService';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Clock, Scissors, CheckCircle2, Loader2 } from 'lucide-react';

// Horários do expediente oficial (Terça a Sábado: 09:00 - 21:00)
const AVAILABLE_HOURS = [
  "09:00", "10:00", "11:00", "13:00", "14:00", 
  "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];

function BookingFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isUserLoading } = useUser();

  const serviceIdParam = searchParams.get('serviceId');
  
  const [selectedServiceId, setSelectedServiceId] = useState<string>(serviceIdParam || SERVICES[0].id);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const selectedService = SERVICES.find(s => s.id === selectedServiceId) || SERVICES[0];

  // 1. Redireciona para login se o usuário não estiver autenticado
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push(`/login?redirectTo=/client/appointments/new?serviceId=${selectedServiceId}`);
    }
  }, [user, isUserLoading, router, selectedServiceId]);

  // 2. Consulta a agenda do barbeiro na data selecionada
  useEffect(() => {
    async function loadAgenda() {
      if (!selectedDate) return;
      setLoadingAgenda(true);
      const booked = await getBookedSlotsByDate(selectedDate);
      setBookedTimes(booked);
      setLoadingAgenda(false);
    }
    loadAgenda();
  }, [selectedDate]);

  // 3. Executa o agendamento no Firestore
  const handleConfirm = async () => {
    if (!user || !selectedTime) return;

    setIsSubmitting(true);
    try {
      await createNewAppointment({
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Cliente',
        userEmail: user.email || '',
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        price: selectedService.price,
        date: selectedDate,
        time: selectedTime,
      });

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/client/appointments');
      }, 2500);
    } catch (err) {
      console.error("Erro ao realizar agendamento:", err);
      alert("Não foi possível confirmar seu agendamento. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm font-medium">Verificando autenticação...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="max-w-md mx-auto my-16 text-center space-y-4 p-8 bg-card border border-primary/20 rounded-3xl shadow-2xl">
        <CheckCircle2 className="w-16 h-16 text-primary mx-auto animate-bounce" />
        <h2 className="text-2xl font-headline font-bold text-foreground">Agendamento Realizado!</h2>
        <p className="text-muted-foreground text-sm">
          Seu serviço de <strong>{selectedService.name}</strong> foi reservado para o dia <strong>{selectedDate}</strong> às <strong>{selectedTime}</strong>.
        </p>
        <p className="text-xs text-primary/80 animate-pulse">Redirecionando para seus agendamentos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight">Novo Agendamento</h1>
        <p className="text-muted-foreground">Selecione o serviço e escolha um horário livre na agenda oficial.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Escolha do Serviço */}
        <Card className="border-primary/20 bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <Scissors className="w-5 h-5 text-primary" /> 1. Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {SERVICES.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedServiceId(service.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedServiceId === service.id
                    ? 'border-primary bg-primary/10 font-bold shadow-md'
                    : 'border-border/50 hover:border-primary/40'
                }`}
              >
                <div className="flex justify-between items-center text-sm">
                  <span>{service.name}</span>
                  <span className="text-accent font-semibold">R$ {service.price}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Escolha da Data e Agenda */}
        <Card className="border-primary/20 bg-card/50 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-headline flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> 2. Agenda do Barbeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Seletor de Data */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Data do Atendimento
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime('');
                }}
                className="w-full bg-background border border-border/80 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary"
              />
            </div>

            {/* Grid de Horários da Agenda */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-primary" /> Horários Disponíveis
                </label>
                {loadingAgenda && <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {AVAILABLE_HOURS.map((time) => {
                  const isBooked = bookedTimes.includes(time);
                  const isSelected = selectedTime === time;

                  return (
                    <button
                      key={time}
                      disabled={isBooked}
                      onClick={() => setSelectedTime(time)}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                        isBooked
                          ? 'bg-muted/40 text-muted-foreground border-transparent cursor-not-allowed line-through opacity-50'
                          : isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                          : 'bg-card hover:border-primary/50 border-border/60'
                      }`}
                    >
                      {time} {isBooked && '(Ocupado)'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Total e Confirmação */}
            <div className="pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Valor total:</p>
                <p className="text-2xl font-bold text-accent">R$ {selectedService.price},00</p>
              </div>

              <Button
                onClick={handleConfirm}
                disabled={!selectedTime || isSubmitting}
                className="w-full sm:w-auto px-8 h-12 rounded-xl font-headline font-bold text-base"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Agendando...
                  </>
                ) : (
                  'Confirmar Agendamento'
                )}
              </Button>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}

export default function NewAppointmentPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
      </div>
    }>
      <BookingFormContent />
    </Suspense>
  );
}