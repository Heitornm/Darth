
"use client";

import { useState, useEffect } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { Clock, User, Scissors, CalendarDays, AlertCircle } from 'lucide-react';

const BARBER_EMAIL = "darthbarber@darth.com.br";
const MASTER_BARBER_ID = 'darth-barber-main';

export default function BarberAppointmentsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  // Consulta de todos os agendamentos para destacar no calendário
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

  if (isUserLoading) return <div className="p-20 text-center animate-pulse">Carregando...</div>;

  if (!user || user.email !== BARBER_EMAIL) {
    return <div className="p-20 text-center text-destructive font-bold">Acesso Restrito</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="md:w-1/3 space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                Navegação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                className="rounded-md border-none"
                modifiers={{
                  hasApt: (date) => datesWithAppointments.some(d => isSameDay(d, date))
                }}
                modifiersClassNames={{
                  hasApt: "bg-green-500/20 text-green-500 font-bold border border-green-500/30"
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-headline font-bold text-primary">
              Agenda: {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : '---'}
            </h2>
            <Badge variant="outline" className="border-primary/50 text-primary">
              {appointmentsForSelectedDate?.length || 0} agendamentos
            </Badge>
          </div>

          {!appointmentsForSelectedDate || appointmentsForSelectedDate.length === 0 ? (
            <Card className="border-dashed bg-muted/20 py-20">
              <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-muted-foreground opacity-30" />
                <p className="text-muted-foreground">Nenhum agendamento para este dia.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointmentsForSelectedDate.map(apt => {
                const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
                return (
                  <Card key={apt.id} className="hover:border-primary/50 transition-all group">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-lg flex flex-col items-center justify-center min-w-[80px]">
                        <Clock className="w-4 h-4 text-primary mb-1" />
                        <span className="text-lg font-bold text-primary">{format(date, 'HH:mm')}</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <h4 className="font-bold text-lg">{apt.clientName}</h4>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Scissors className="w-3 h-3" />
                            {apt.serviceName}
                          </span>
                          <span>•</span>
                          <span>{apt.durationMinutes} min</span>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                        CONFIRMADO
                      </Badge>
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
