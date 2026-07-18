'use client';

export const dynamic = 'force-dynamic';

import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/features/services/ServiceCarousel';
import Link from 'next/link';
import { Clock, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const barberImage = PlaceHolderImages.find(img => img.id === 'barber-profile');

  return (
    <div className="flex flex-col items-center min-h-[85vh] px-4 py-12 md:py-20">
      <div className="max-w-6xl w-full text-center space-y-16">
        
        {/* Título Principal */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary tracking-tight">
            DARTH BARBER
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Estilo, precisão e experience premium. Selecione um de nossos serviços abaixo para iniciar seu agendamento.
          </p>
        </div>

        {/* Carrossel de Serviços */}
        <div className="relative w-full py-4 overflow-hidden">
          <ServiceCarousel />
        </div>

        {/* Grande Gatilho de Agendamento Direto */}
        <div className="max-w-md mx-auto">
          <Button asChild size="lg" className="w-full h-16 text-xl font-headline bg-primary hover:bg-primary/90 rounded-2xl gap-3 shadow-xl shadow-primary/20">
            <Link href="/client/appointments/new">
              <Calendar className="w-6 h-6" />
              Agendar um Horário Agora
            </Link>
          </Button>
        </div>

        {/* Cartão de Informações e Expediente */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-12 border-t border-primary/10">
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
    </div>
  );
}