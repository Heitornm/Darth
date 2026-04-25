"use client";

import { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Clock, User, Scissors, CalendarDays, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'darth-barber-main';

export default function BarberAppointmentsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const allAppointmentsQuery = useMemoFirebase(() => {
    if (!db || !user || user.email !== BARBER_EMAIL) return null;
    return query(collection(db, "appointments"), where("barberId", "==", MASTER_BARBER_ID));
  }, [db, user]);

  const { data: allAppointments } = useCollection(allAppointmentsQuery);

  const appointmentsForSelectedDate = allAppointments?.filter(apt => {
    if (!selectedDate) return false;
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return isSameDay(date, selectedDate);
  }).sort((a, b) => {
    const dateA = a.dataHora instanceof Timestamp ? a.dataHora.toMillis() : new Date(a.dataHora).getTime();
    const dateB = b.dataHora instanceof Timestamp ? b.dataHora.toMillis() : new Date(b.dataHora).getTime();
    return dateA - dateB;
  });

  const datesWithAppointments = allAppointments?.map(apt => {
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return date;
  }) || [];

  if (!mounted || isUserLoading) return <div className="p-20 text-center animate-pulse">Carregando agenda...</div>;

  if (!user || user.email !== BARBER_EMAIL) {
    return (
      <div className="container mx-auto p-20 text-center">
        <Card className="border-destructive/50">
          <CardContent className="p-10 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-headline font-bold">Acesso Restrito</h2>
            <p className="text-muted-foreground">Esta área é exclusiva para o barbeiro mestre.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Agenda de Atendimento</h1>
        <p className="text-muted-foreground">Gerencie seus horários e visualize seus compromissos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna do Calendário */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-primary/20 shadow-xl bg-card/50 backdrop-blur-sm sticky top-24">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Selecione uma Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="w-full"
                modifiers={{
                  hasApt: (date) => datesWithAppointments.some(d => isSameDay(d, date))
                }}
                modifiersClassNames={{
                  hasApt: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-green-500 after:rounded-full font-bold text-green-500"
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna dos Agendamentos */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/30 p-4 rounded-xl border border-border/50">
            <div>
              <h2 className="text-2xl font-headline font-bold">
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {selectedDate ? format(selectedDate, "EEEE", { locale: ptBR }) : ''}
              </p>
            </div>
            <Badge variant="secondary" className="px-4 py-1 text-sm bg-primary/10 text-primary border-primary/20">
              {appointmentsForSelectedDate?.length || 0} agendamentos
            </Badge>
          </div>

          {!appointmentsForSelectedDate || appointmentsForSelectedDate.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/10 py-24">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="bg-muted p-4 rounded-full">
                  <CalendarDays className="w-12 h-12 text-muted-foreground/40" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-lg font-bold">Nenhum compromisso</h3>
                  <p className="text-muted-foreground text-sm">Não existem agendamentos registrados para esta data.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointmentsForSelectedDate.map(apt => {
                const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
                return (
                  <Card key={apt.id} className="hover:border-primary/50 transition-all group overflow-hidden border-l-4 border-l-primary">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                        <div className="bg-primary/5 p-6 flex flex-col items-center justify-center min-w-[120px] border-r border-border/50">
                          <Clock className="w-5 h-5 text-primary mb-2" />
                          <span className="text-2xl font-bold text-primary">{format(date, 'HH:mm')}</span>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                              <h4 className="font-bold text-xl group-hover:text-primary transition-colors">
                                {apt.clientName}
                              </h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-md">
                                <Scissors className="w-3.5 h-3.5" />
                                {apt.serviceName}
                              </span>
                              <span className="flex items-center gap-1.5 px-2 py-0.5 bg-muted rounded-md">
                                <Clock className="w-3.5 h-3.5" />
                                {apt.durationMinutes} min
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                              CONFIRMADO
                            </Badge>
                            <span className="text-xs text-muted-foreground italic">
                              Agendado em {apt.createdAt instanceof Timestamp ? format(apt.createdAt.toDate(), 'dd/MM HH:mm') : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
