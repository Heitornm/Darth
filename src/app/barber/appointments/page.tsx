"use client";

import { useState, useEffect } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy } from 'firebase/firestore';
import { Clock, User, Scissors, CalendarDays, AlertCircle, Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

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
    return query(
      collection(db, "appointments"), 
      where("barberId", "==", MASTER_BARBER_ID),
      orderBy("dataHora", "asc")
    );
  }, [db, user]);

  const { data: allAppointments, isLoading: isAptsLoading } = useCollection(allAppointmentsQuery);

  const appointmentsForSelectedDate = allAppointments?.filter(apt => {
    if (!selectedDate) return false;
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return isSameDay(date, selectedDate);
  });

  const datesWithAppointments = allAppointments?.map(apt => {
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return startOfDay(date);
  }) || [];

  if (!mounted || isUserLoading) return <div className="p-20 text-center animate-pulse">Sincronizando agenda...</div>;

  if (!user || user.email !== BARBER_EMAIL) {
    return (
      <div className="container mx-auto p-20 text-center">
        <Card className="border-destructive/30 max-w-md mx-auto">
          <CardContent className="p-10 space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-2xl font-headline font-bold">Acesso Negado</h2>
            <p className="text-muted-foreground">Esta agenda é exclusiva para o administrador DarthBarber.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-headline font-bold text-primary mb-2">Agendamentos</h1>
          <p className="text-muted-foreground">Seu cronograma completo de atendimentos.</p>
        </div>
        <Badge variant="outline" className="text-xs py-1 px-3 border-primary/30 text-primary">
          Modo Administrador
        </Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-primary/20 shadow-2xl bg-card/40 backdrop-blur-md sticky top-24">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2 text-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="w-full flex justify-center"
                modifiers={{
                  hasApt: (date) => datesWithAppointments.some(d => isSameDay(d, date))
                }}
                modifiersClassNames={{
                  hasApt: "bg-green-500/20 text-green-500 font-bold hover:bg-green-500/40"
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/40 p-5 rounded-2xl border border-border/50">
            <div>
              <h2 className="text-2xl font-headline font-bold uppercase tracking-tight">
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedDate ? format(selectedDate, "EEEE", { locale: ptBR }) : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase font-bold">Total</p>
              <p className="text-3xl font-headline font-bold text-primary">{appointmentsForSelectedDate?.length || 0}</p>
            </div>
          </div>

          {isAptsLoading ? (
            <div className="py-20 text-center animate-pulse text-muted-foreground">Carregando horários...</div>
          ) : !appointmentsForSelectedDate || appointmentsForSelectedDate.length === 0 ? (
            <Card className="border-dashed border-2 bg-muted/10 py-24 text-center">
              <CardContent className="space-y-4">
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-xl font-bold">Agenda livre</h3>
                <p className="text-muted-foreground text-sm">Nenhum agendamento para este dia.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointmentsForSelectedDate.map(apt => {
                const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
                return (
                  <Card key={apt.id} className="hover:border-primary/40 transition-all border-l-4 border-l-primary bg-card/60">
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center">
                        <div className="bg-primary/10 p-6 flex flex-col items-center justify-center min-w-[120px]">
                          <Clock className="w-5 h-5 text-primary mb-1" />
                          <span className="text-2xl font-bold text-primary">{format(date, 'HH:mm')}</span>
                        </div>
                        
                        <div className="p-6 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <User className="w-5 h-5 text-primary" />
                              <h4 className="font-bold text-xl">{apt.clientName}</h4>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="secondary" className="bg-muted/80">
                                <Scissors className="w-3.5 h-3.5 mr-1" />
                                {apt.serviceName}
                              </Badge>
                              <Badge variant="secondary" className="bg-muted/80">
                                {apt.durationMinutes} min
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-green-500 font-bold uppercase text-xs">
                            <CheckCircle2 className="w-4 h-4" />
                            Confirmado
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