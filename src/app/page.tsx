"use client";

import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/ServiceCarousel';
import Link from 'next/link';
import { Calendar, ChevronRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-[85vh] px-4 py-12 md:py-20">
      <div className="max-w-6xl w-full text-center space-y-16">
        {/* Texto de Boas-Vindas Básico e Elegante */}
        <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-5xl md:text-7xl font-headline font-bold text-primary tracking-tight">
            DarthBarber
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
            Seja bem-vindo à experiência definitiva em estilo e precisão. 
            Escolha um de nossos serviços abaixo e transforme seu visual com quem entende do assunto.
          </p>
        </div>

        {/* Div do Carrossel */}
        <div className="relative w-full py-4 animate-in fade-in zoom-in-95 duration-1000 delay-300">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
          <ServiceCarousel />
        </div>

        {/* Botão de Direcionamento */}
        <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
          <Button asChild size="lg" className="h-16 px-12 text-xl font-headline bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 gap-3 group rounded-full">
            <Link href="/client/appointments">
              <Calendar className="w-6 h-6 group-hover:scale-110 transition-transform" />
              Agendar Agora
              <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-[0.2em] font-bold opacity-40">
            <span className="w-8 h-px bg-muted-foreground/30"></span>
            Disponibilidade em Tempo Real
            <span className="w-8 h-px bg-muted-foreground/30"></span>
          </div>
        </div>
      </div>
    </div>
  );
}