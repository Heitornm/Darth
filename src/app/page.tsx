
"use client";

import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/ServiceCarousel';
import Link from 'next/link';
import { LogIn, Scissors, ChevronRight, Star } from 'lucide-react';
import { useUser } from '@/firebase';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

        <div className="flex flex-col items-center gap-12">
          {mounted && !isUserLoading ? (
            <div className="flex flex-col items-center gap-16 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              {user ? (
                <Button asChild size="lg" className="h-16 px-12 text-xl font-headline bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 gap-3 group rounded-full">
                  <Link href="/client/appointments">
                    <Scissors className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Agendar Agora
                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              ) : (
                <Button asChild size="lg" className="h-16 px-12 text-xl font-headline bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 gap-3 group rounded-full">
                  <Link href="/login">
                    <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    Entrar para Agendar
                    <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              )}

              {/* Card de Apresentação do Barbeiro em Destaque */}
              <div className="w-full flex justify-center pt-8">
                <Card className="max-w-[420px] w-full border-primary/20 bg-card/40 backdrop-blur-md shadow-2xl hover:border-primary/40 transition-all duration-500 transform hover:-translate-y-2 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                  <CardContent className="p-12 flex flex-col items-center gap-8 text-center relative z-10">
                    <div className="relative">
                      <Avatar className="h-48 w-48 border-4 border-primary/30 shadow-[0_0_30px_rgba(var(--primary),0.2)] group-hover:border-primary/60 transition-colors duration-500">
                        <AvatarImage 
                          src={barberImage?.imageUrl} 
                          alt="Darth Barber" 
                          data-ai-hint={barberImage?.imageHint}
                          className="object-cover scale-105 transition-transform duration-500"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">DB</AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-2 -right-2 bg-accent p-2 rounded-full shadow-lg border-2 border-background">
                        <Star className="w-5 h-5 text-accent-foreground fill-accent-foreground" />
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h2 className="font-headline font-bold text-3xl text-foreground tracking-tight group-hover:text-primary transition-colors">
                        Darth Barber
                      </h2>
                      <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold uppercase tracking-[0.2em] px-5 py-1.5 bg-primary/10 text-primary rounded-full border border-primary/20">
                          Barbeiro Profissional
                        </span>
                        <p className="text-sm text-muted-foreground italic max-w-[200px] leading-relaxed">
                          "Dominando a arte do corte com a precisão de um mestre."
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              <div className="h-16 w-64 bg-muted animate-pulse rounded-full"></div>
              <div className="h-64 w-80 bg-muted animate-pulse rounded-3xl"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
