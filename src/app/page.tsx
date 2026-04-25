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
    setMounted(false);
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
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

        <div className="flex flex-col items-center gap-10">
          {mounted && !isUserLoading ? (
            <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
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

              {/* Card de Apresentação do Barbeiro */}
              <Card className="max-w-xs w-full border-primary/20 bg-card/40 backdrop-blur-sm shadow-xl hover:border-primary/40 transition-all duration-300">
                <CardContent className="p-4 flex items-center gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage 
                      src={barberImage?.imageUrl} 
                      alt="Darth Barber" 
                      data-ai-hint={barberImage?.imageHint}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">DB</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="flex items-center gap-1">
                      <p className="font-headline font-bold text-foreground">Darth Barber</p>
                      <Star className="w-3 h-3 text-accent fill-accent" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Mestre em Visagismo e Barboterapia</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-8">
              <div className="h-16 w-64 bg-muted animate-pulse rounded-full"></div>
              <div className="h-20 w-64 bg-muted animate-pulse rounded-xl"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}