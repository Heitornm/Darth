
"use client";

import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/ServiceCarousel';
import Link from 'next/link';
import { LogIn, Scissors, ChevronRight, Star, ClipboardList, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useUser, useFirestore, useFirebase } from '@/firebase';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { Calendar } from '@/components/ui/calendar';
import { ptBR } from 'date-fns/locale';
import { isSameDay, isBefore, startOfDay, format } from 'date-fns';

const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';
const WORK_START = 8;
const WORK_END = 21;
const TOTAL_MINUTES_PER_DAY = (WORK_END - WORK_START) * 60;

export default function Home() {
  const { user, isUserLoading, userProfile, appointments } = useFirebase();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calcula a ocupação de cada dia para colorir o calendário
  const availabilityData = useMemo(() => {
    if (!appointments) return {};
    
    const stats: Record<string, number> = {};
    appointments.forEach(apt => {
      if (apt.status === 'cancelado') return;
      const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
      const dayKey = format(date, 'yyyy-MM-dd');
      stats[dayKey] = (stats[dayKey] || 0) + (apt.durationMinutes || 30);
    });
    return stats;
  }, [appointments]);

  const isDayFull = (date: Date) => {
    const dayKey = format(date, 'yyyy-MM-dd');
    const occupied = availabilityData[dayKey] || 0;
    return occupied >= TOTAL_MINUTES_PER_DAY;
  };

  const barberImage = PlaceHolderImages.find(img => img.id === 'barber-profile');

  return (
    <div className="flex flex-col items-center min-h-[85vh] px-4 py-12 md:py-20">
      <div className="max-w-6xl w-full text-center space-y-16">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary tracking-tight">
            Bem-vindo à DarthBarber
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Explore nossos serviços e agende sua experiência com o lado mestre do visual.
          </p>
        </div>

        <div className="relative w-full py-4 overflow-hidden">
          <ServiceCarousel />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start text-left">
          {/* Coluna 1: Perfil e Call to Actions */}
          <div className="space-y-8 order-2 lg:order-1">
            <Card className="border-primary/20 bg-card/40 backdrop-blur-md shadow-2xl overflow-hidden group">
              <CardContent className="p-8 flex items-center gap-6">
                <Avatar className="h-24 w-24 border-2 border-primary/30">
                  <AvatarImage 
                    src={barberImage?.imageUrl} 
                    alt="Darth Barber" 
                    data-ai-hint={barberImage?.imageHint}
                    className="object-cover"
                  />
                  <AvatarFallback>DB</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-headline font-bold text-2xl text-primary">Darth Barber</h2>
                  <p className="text-muted-foreground text-sm italic">"Precision e estilo em cada corte."</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                      Mestre Barbeiro
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              {mounted && !isUserLoading ? (
                <>
                  {user ? (
                    userProfile?.role === 'barber' ? (
                      <Button asChild size="lg" className="h-16 text-xl font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3">
                        <Link href="/barber/appointments">
                          <ClipboardList className="w-6 h-6" />
                          Gerenciar Minha Agenda
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild size="lg" className="h-16 text-xl font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3">
                        <Link href="/client/appointments">
                          <Scissors className="w-6 h-6" />
                          Agendar Agora
                        </Link>
                      </Button>
                    )
                  ) : (
                    <Button asChild size="lg" className="h-16 text-xl font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3">
                      <Link href="/login">
                        <LogIn className="w-6 h-6" />
                        Entrar para Agendar
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="h-16 w-full bg-muted animate-pulse rounded-2xl"></div>
              )}
              
              <div className="p-6 bg-accent/5 rounded-2xl border border-accent/20">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-accent" />
                  <h3 className="font-headline font-bold text-accent uppercase tracking-wider text-sm">Horário de Atendimento</h3>
                </div>
                <p className="text-2xl font-headline font-bold">08:00 — 21:00</p>
                <p className="text-xs text-muted-foreground mt-1">Segunda a Sábado</p>
              </div>
            </div>
          </div>

          {/* Coluna 2: Calendário de Disponibilidade */}
          <div className="order-1 lg:order-2">
            <Card className="border-primary/20 bg-card/60 shadow-2xl">
              <CardHeader className="border-b border-primary/10 pb-4">
                <CardTitle className="font-headline text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    Disponibilidade
                  </div>
                  <div className="flex gap-3 text-[10px] font-bold uppercase tracking-tighter">
                    <span className="flex items-center gap-1 text-green-500"><div className="w-2 h-2 rounded-full bg-green-500" /> Vagas</span>
                    <span className="flex items-center gap-1 text-destructive"><div className="w-2 h-2 rounded-full bg-destructive" /> Lotado</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={ptBR}
                  className="w-full"
                  disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date())) || isDayFull(date)}
                  modifiers={{
                    full: (date) => isDayFull(date) && !isBefore(startOfDay(date), startOfDay(new Date())),
                    available: (date) => !isDayFull(date) && !isBefore(startOfDay(date), startOfDay(new Date()))
                  }}
                  modifiersClassNames={{
                    full: "bg-destructive/20 text-destructive font-bold cursor-not-allowed",
                    available: "bg-green-500/10 text-green-500 font-bold"
                  }}
                />
                <div className="mt-6 p-4 bg-muted/20 rounded-xl text-xs text-muted-foreground italic flex gap-2">
                  <Star className="w-4 h-4 text-primary shrink-0" />
                  Dias marcados em <span className="text-green-500 font-bold">Verde</span> possuem horários livres entre 08h e 21h. Dias em <span className="text-destructive font-bold">Vermelho</span> estão totalmente ocupados.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
