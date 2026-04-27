
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

  // Filtra agendamentos para a data selecionada
  const appointmentsForSelectedDate = appointments?.filter(apt => {
    if (!selectedDate) return false;
    const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
    return isSameDay(date, selectedDate);
  }).sort((a, b) => {
    const dateA = a.dataHora instanceof Timestamp ? a.dataHora.toMillis() : new Date(a.dataHora).getTime();
    const dateB = b.dataHora instanceof Timestamp ? b.dataHora.toMillis() : new Date(b.dataHora).getTime();
    return dateA - dateB;
  });

  // Mapeia datas que possuem agendamentos para destacar no calendário
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
      <header className="mb-8 text-center lg:text-left">
        <h1 className="text-3xl md:text-4xl font-headline font-bold text-primary mb-2">Agendamentos</h1>
        <p className="text-muted-foreground">Gerencie sua agenda de atendimentos em tempo real.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Coluna do Calendário */}
        <div className="lg:col-span-4 flex flex-col items-center lg:items-start">
          <Card className="border-primary/20 w-full max-w-sm lg:max-w-none lg:sticky lg:top-24 overflow-hidden shadow-xl">
            <CardHeader className="bg-primary/5 py-4 border-b border-primary/10">
              <CardTitle className="font-headline flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                <CalendarIcon className="w-4 h-4" />
                Seletor de Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex justify-center">
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
                  hasApt: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:bg-primary after:rounded-full font-bold"
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Coluna da Lista de Agendamentos */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-row justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div>
              <h2 className="text-xl md:text-2xl font-headline font-bold uppercase">
                {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione um dia'}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">
                {selectedDate ? format(selectedDate, "EEEE", { locale: ptBR }) : ''}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-headline font-bold text-primary">{appointmentsForSelectedDate?.length || 0}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Serviços</p>
            </div>
          </div>

          {isAppointmentsLoading ? (
            <div className="py-20 text-center animate-pulse">Carregando horários...</div>
          ) : !appointmentsForSelectedDate || appointmentsForSelectedDate.length === 0 ? (
            <Card className="border-dashed border-2 py-24 text-center bg-muted/5">
              <CardContent className="space-y-4 pt-6">
                <CalendarDays className="w-12 h-12 text-muted-foreground/20 mx-auto" />
                <h3 className="text-lg font-bold">Nenhum agendamento</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Sua agenda está livre para este dia. Aproveite para descansar ou organizar seus materiais!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {appointmentsForSelectedDate.map(apt => {
                const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
                return (
                  <Card key={apt.id} className="border-l-4 border-l-primary overflow-hidden hover:shadow-md transition-all">
                    <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                      <div className="bg-primary/5 p-4 md:p-6 flex flex-row md:flex-col items-center justify-center min-w-[100px] border-b md:border-b-0 md:border-r border-primary/10 gap-2 md:gap-0">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-xl font-black text-primary">{format(date, 'HH:mm')}</span>
                      </div>
                      <div className="p-5 md:p-6 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="space-y-2 w-full sm:w-auto">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary shrink-0" />
                            <h4 className="font-bold text-lg leading-tight">{apt.clientName}</h4>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="bg-secondary/50 text-[10px]"><Scissors className="w-3 h-3 mr-1" />{apt.serviceName}</Badge>
                            <Badge variant="outline" className="border-primary/20 text-[10px]">{apt.durationMinutes} min</Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          {apt.status === 'pendente' ? (
                            <div className="flex gap-2 w-full sm:w-auto">
                              <Button 
                                size="sm" 
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 h-9 px-4 gap-2 font-bold"
                                onClick={() => handleStatusUpdate(apt.id, 'confirmado')}
                              >
                                <CheckCircle2 className="w-4 h-4" /> <span className="sm:hidden lg:inline">Confirmar</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="flex-1 sm:flex-none h-9 px-4 gap-2 font-bold"
                                onClick={() => handleStatusUpdate(apt.id, 'cancelado')}
                              >
                                <XCircle className="w-4 h-4" /> <span className="sm:hidden lg:inline">Cancelar</span>
                              </Button>
                            </div>
                          ) : (
                            <div className={cn(
                              "flex items-center gap-2 font-bold text-xs uppercase px-4 py-2 rounded-full border shadow-sm w-full sm:w-auto justify-center",
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
