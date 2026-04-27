
"use client";

import { useState, useEffect } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useFirebase, updateDocumentNonBlocking } from '@/firebase';
import { Timestamp, doc } from 'firebase/firestore';
import { Clock, User, Scissors, CalendarDays, Calendar as CalendarIcon, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';
const BARBER_EMAIL = "darthbarber@darth.com.br";

export default function BarberAppointmentsPage() {
  const { user, userProfile, appointments, isUserLoading, isAppointmentsLoading, firestore } = useFirebase();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isAuthorized = userProfile?.role === 'barber' || user?.email === BARBER_EMAIL || user?.uid === MASTER_BARBER_ID;

  const appointmentsForSelectedDate = appointments?.filter(apt => {
    if (!selectedDate) return false;
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return isSameDay(date, selectedDate);
  }).sort((a, b) => {
    const dateA = a.dataHora instanceof Timestamp ? a.dataHora.toMillis() : new Date(a.dataHora).getTime();
    const dateB = b.dataHora instanceof Timestamp ? b.dataHora.toMillis() : new Date(b.dataHora).getTime();
    return dateA - dateB;
  });

  const datesWithAppointments = appointments?.map(apt => {
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return startOfDay(date);
  }) || [];

  const handleStatusUpdate = (appointmentId: string, newStatus: 'confirmado' | 'cancelado') => {
    if (!firestore) return;
    const docRef = doc(firestore, 'appointments', appointmentId);
    updateDocumentNonBlocking(docRef, { status: newStatus });
  };

  if (!mounted || isUserLoading) return <div className="p-20 text-center animate-pulse">Sincronizando agenda...</div>;

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md">
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar a agenda de barbeiros.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10 text-center lg:text-left">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Agendamentos</h1>
        <p className="text-muted-foreground">Gerencie sua agenda de atendimentos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="border-primary/20 sticky top-24 overflow-hidden mx-auto max-w-fit lg:max-w-none">
            <CardHeader className="bg-primary/5 py-3 border-b border-primary/10">
              <CardTitle className="font-headline flex items-center gap-2 text-sm uppercase tracking-tighter">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Seletor de Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                locale={ptBR}
                modifiers={{
                  hasApt: (date) => datesWithAppointments.some(d => isSameDay(d, date))
                }}
                modifiersClassNames={{
                  hasApt: "bg-green-500/10 text-green-500 font-bold ring-1 ring-inset ring-green-500/30 rounded-full"
                }}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="flex justify-between items-center bg-muted/40 p-5 rounded-2xl border">
            <div>
              <h2 className="text-2xl font-headline font-bold uppercase">
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedDate ? format(selectedDate, "EEEE", { locale: ptBR }) : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-headline font-bold text-primary">{appointmentsForSelectedDate?.length || 0}</p>
              <p className="text-xs text-muted-foreground uppercase font-bold">Serviços</p>
            </div>
          </div>

          {isAppointmentsLoading ? (
            <div className="py-20 text-center animate-pulse">Carregando horários...</div>
          ) : !appointmentsForSelectedDate || appointmentsForSelectedDate.length === 0 ? (
            <Card className="border-dashed border-2 py-24 text-center">
              <CardContent className="space-y-4 pt-6">
                <CalendarDays className="w-10 h-10 text-muted-foreground/30 mx-auto" />
                <h3 className="text-xl font-bold">Nenhum agendamento</h3>
                <p className="text-muted-foreground text-sm">Sua agenda está livre para este dia.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointmentsForSelectedDate.map(apt => {
                const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
                return (
                  <Card key={apt.id} className="border-l-4 border-l-primary overflow-hidden hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-0 flex items-stretch">
                      <div className="bg-primary/5 p-6 flex flex-col items-center justify-center min-w-[100px] border-r border-primary/10">
                        <Clock className="w-5 h-5 text-primary mb-1" />
                        <span className="text-xl font-bold text-primary">{format(date, 'HH:mm')}</span>
                      </div>
                      <div className="p-6 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <h4 className="font-bold text-lg">{apt.clientName}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-secondary/50"><Scissors className="w-3 h-3 mr-1" />{apt.serviceName}</Badge>
                            <Badge variant="outline" className="border-primary/20">{apt.durationMinutes} min</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {apt.status === 'pendente' ? (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 h-8 gap-1"
                                onClick={() => handleStatusUpdate(apt.id, 'confirmado')}
                              >
                                <CheckCircle2 className="w-4 h-4" /> Confirmar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 gap-1"
                                onClick={() => handleStatusUpdate(apt.id, 'cancelado')}
                              >
                                <XCircle className="w-4 h-4" /> Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className={cn(
                              "flex items-center gap-2 font-bold text-xs uppercase px-3 py-1.5 rounded-full border",
                              apt.status === 'confirmado' ? "text-green-500 bg-green-500/5 border-green-500/20" : "text-destructive bg-destructive/5 border-destructive/20"
                            )}>
                              {apt.status === 'confirmado' ? (
                                <><CheckCircle2 className="w-4 h-4" /> Confirmado</>
                              ) : (
                                <><XCircle className="w-4 h-4" /> Cancelado</>
                              )}
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
      </div>
    </div>
  );
}
