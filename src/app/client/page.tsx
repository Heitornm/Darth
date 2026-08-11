'use client';

import Link from 'next/link';
import { Calendar, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUser } from '@/firebase';
import { BookingCalendarView } from '@/components/BookingCalendarView';

export default function ClientHomePage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl space-y-10">
      {/* Saudação personalizada */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-headline font-bold text-primary">
          Olá, {user?.displayName || 'Cliente'}! ✂️
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tudo pronto para cuidar do seu visual? Agende seu horário com facilidade, acompanhe seus atendimentos e garanta o melhor atendimento.
        </p>
      </div>

      {/* Acesso Rápido */}
      <div className="grid md:grid-cols-2 gap-6">
        <Button asChild size="lg" className="h-20 text-lg gap-3">
          <Link href="/client/appointments/new">
            <Calendar className="w-6 h-6" /> Agendar Novo Horário
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-20 text-lg gap-3">
          <Link href="/client/appointments">
            <ListChecks className="w-6 h-6" /> Meus Agendamentos / Histórico
          </Link>
        </Button>
      </div>

      {/* Calendário de horários visível na página inicial */}
      <Card className="p-6 border-primary/20 bg-card/40">
        <h2 className="text-2xl font-headline font-bold mb-4 text-center">Ver Dias e Horários Disponíveis</h2>
        <BookingCalendarView />
      </Card>
    </div>
  );
}