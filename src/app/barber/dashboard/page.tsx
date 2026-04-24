"use client";

import { useEffect, useState } from 'react';
import { Scissors, Clock, User, Calendar as CalendarIcon, Check, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { appointmentService, Appointment } from '@/services/appointmentService';

// In a real app, this would come from auth context
const MOCK_LOGGED_BARBER = {
  id: 'barber-1',
  name: 'Mestre Darth'
};

export default function BarberDashboardPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const unsubscribe = appointmentService.subscribeToBarberAppointments(
      MOCK_LOGGED_BARBER.id,
      today,
      (data) => {
        setAppointments(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-primary">Agenda do Dia</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {format(new Date(), "PPPP", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Barbeiro</p>
            <p className="font-medium">{MOCK_LOGGED_BARBER.name}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : appointments.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-headline font-semibold mb-2">Sem agendamentos hoje</h3>
            <p className="text-muted-foreground">Parece que sua agenda está livre por enquanto.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const date = apt.dataHora instanceof Date ? apt.dataHora : apt.dataHora.toDate();
            return (
              <Card key={apt.id} className="hover:border-primary/50 transition-colors group overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch">
                    {/* Time Section */}
                    <div className="sm:w-32 bg-muted/30 p-4 flex sm:flex-col items-center justify-center gap-2 border-b sm:border-b-0 sm:border-r">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-xl font-headline font-bold text-primary">
                        {format(date, 'HH:mm')}
                      </span>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-6 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-lg font-bold font-headline">{apt.clientName}</h3>
                          </div>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                            {apt.status === 'pendente' ? 'Pendente' : 'Confirmado'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-green-500/50 text-green-500 hover:bg-green-500/10">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-red-500/50 text-red-500 hover:bg-red-500/10">
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {apt.styleSummary && (
                        <div className="bg-accent/5 p-4 rounded-lg border border-accent/20">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="bg-accent p-1 rounded">
                              <Scissors className="w-3 h-3 text-accent-foreground" />
                            </div>
                            <p className="text-xs font-bold uppercase tracking-widest text-accent">Instruções de Estilo</p>
                          </div>
                          <p className="text-sm italic leading-relaxed text-accent/90">
                            "{apt.styleSummary}"
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
