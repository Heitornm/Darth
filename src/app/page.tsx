'use client';

export const dynamic = 'force-dynamic';

import { useRouter } from 'next/navigation';
import { ServiceCarousel } from '@/components/features/services/ServiceCarousel';
import { BookingCalendarView } from '@/components/features/appointments/BookingCalendarView';
import { Button } from '@/components/ui/button';
import { Clock, Scissors } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const router = useRouter();
  const barberImage = PlaceHolderImages.find(img => img.id === 'barber-profile');

  const handleTimeSlotSelect = (date: string, time: string) => {
    router.push(`/client/appointments/new?date=${date}&time=${time}`);
  };

  return (
    <div className="flex flex-col items-center min-h-[85vh] px-4 py-8 md:py-16 space-y-16 max-w-6xl mx-auto">
      
      {/* Cabeçalho */}
      <div className="text-center space-y-4 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary tracking-tight">
          DARTH BARBER
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium leading-relaxed">
          Estilo, precisão e experiência premium. Confira os horários livres abaixo e agende seu atendimento.
        </p>
      </div>

      {/* Carrossel de Serviços */}
      <div className="relative w-full overflow-hidden">
        <ServiceCarousel />
      </div>

      {/* Calendário da Barbearia (Aberto a Todos) */}
      <div className="w-full max-w-3xl space-y-4">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-headline font-bold text-foreground">Consulta de Agenda em Tempo Real</h2>
          <p className="text-sm text-muted-foreground">Selecione o dia e o horário desejado para iniciar seu agendamento</p>
        </div>
        
        <BookingCalendarView onSelectTimeSlot={handleTimeSlotSelect} />

        <div className="pt-2 text-center">
          <Button 
            onClick={() => router.push('/client/appointments/new')}
            size="lg" 
            className="h-14 px-8 text-lg font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3 shadow-xl shadow-primary/20"
          >
            <Scissors className="w-5 h-5" />
            Ver Todos os Serviços e Agendar
          </Button>
        </div>
      </div>

      {/* Cartão de Informações e Expediente */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12 border-t border-primary/10">
        <Card className="md:col-span-2 border-primary/20 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
          <CardContent className="p-6 flex items-center gap-6">
            <Avatar className="h-20 w-20 border-2 border-primary/30">
              <AvatarImage
                src={barberImage?.imageUrl}
                alt="Darth Barber"
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
  );
}