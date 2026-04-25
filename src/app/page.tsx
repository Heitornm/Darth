
"use client";

import { Button } from '@/components/ui/button';
import { ServiceCarousel } from '@/components/ServiceCarousel';
import Link from 'next/link';
import { LogIn, Scissors, ChevronRight } from 'lucide-react';
import { useUser } from '@/firebase';

export default function Home() {
  const { user, isUserLoading } = useUser();

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

        <div className="flex flex-col items-center gap-6">
          {!isUserLoading && (
            <Button asChild size="lg" className="h-16 px-12 text-xl font-headline bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20 gap-3 group rounded-full">
              {user ? (
                <Link href="/client/appointments">
                  <Scissors className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Agendar Agora
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link href="/login">
                  <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Entrar
                  <ChevronRight className="w-5 h-5 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
