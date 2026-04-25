
"use client";

import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/ServiceCarousel';
import Link from 'next/link';
import { Calendar } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-20 bg-gradient-to-b from-background to-card/20">
      <div className="max-w-4xl w-full text-center space-y-12">
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-headline font-bold text-primary tracking-tight">
            Bem-vindo ao DarthBarber
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Excelência em cortes e cuidados masculinos. Escolha seu serviço e agende sua experiência de estilo com precisão.
          </p>
        </div>

        <div className="animate-in fade-in duration-1000 delay-300">
          <ServiceCarousel />
        </div>

        <div className="pt-8 animate-in fade-in zoom-in-95 duration-500 delay-700">
          <Button asChild size="lg" className="h-16 px-10 text-xl font-headline bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 gap-3 group">
            <Link href="/client/appointments">
              <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Agendar Agora
            </Link>
          </Button>
          <p className="mt-4 text-sm text-muted-foreground uppercase tracking-widest font-bold opacity-50">
            Confirmado instantaneamente
          </p>
        </div>
      </div>
    </div>
  );
}
