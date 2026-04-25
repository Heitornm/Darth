
"use client";

import { useState, useEffect } from 'react';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp, orderBy, doc, getDoc } from 'firebase/firestore';
import { Clock, User, Scissors, CalendarDays, Calendar as CalendarIcon, CheckCircle2, AlertCircle } from 'lucide-react';

const MASTER_BARBER_ID = 'darth-barber-main';

export default function BarberAppointmentsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [mounted, setMounted] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && db && mounted) {
      getDoc(doc(db, 'users', user.uid)).then(d => {
        if (d.exists()) setUserRole(d.data().role);
      });
    }
  }, [user, db, mounted]);
  
  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user || !mounted) return null;
    
    // Permitir se for barbeiro ou se tiver o email do master
    const isAuthorized = userRole === 'barber' || user.email === "darthbarber@darth.com.br";
    if (!isAuthorized) return null;

    return query(
      collection(db, "appointments"), 
      where("barberId", "==", MASTER_BARBER_ID),
      orderBy("dataHora", "asc")
    );
  }, [db, user, userRole, mounted]);

  const { data: allAppointments, isLoading, error } = useCollection(appointmentsQuery);

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

  const isAuthorized = userRole === 'barber' || user?.email === "darthbarber@darth.com.br";

  if (!isAuthorized) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md">
        <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar a agenda de barbeiros. Por favor, entre com uma conta de barbeiro.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <header className="mb-10">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Agendamentos</h1>
        <p className="text-muted-foreground">Gerencie sua agenda de atendimentos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <Card className="border-primary/20 sticky top-24 overflow-hidden">
            <CardHeader className="bg-primary/5">
              <CardTitle className="font-headline flex items-center gap-2 text-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Calendário
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                  hasApt: "bg-green-500/20 text-green-500 font-bold border-green-500/50 border"
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

          {isLoading ? (
            <div className="py-20 text-center animate-pulse">Carregando horários...</div>
          ) : error ? (
            <div className="p-10 text-center text-destructive">
               Erro ao carregar agendamentos. Verifique suas permissões.
            </div>
          ) : !appointmentsForSelectedDate || appointmentsForSelectedDate.length === 0 ? (
            <Card className="border-dashed border-2 py-24 text-center">
              <CardContent className="space-y-4">
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
                  <Card key={apt.id} className="border-l-4 border-l-primary overflow-hidden">
                    <CardContent className="p-0 flex items-stretch">
                      <div className="bg-primary/10 p-6 flex flex-col items-center justify-center min-w-[100px]">
                        <Clock className="w-5 h-5 text-primary mb-1" />
                        <span className="text-xl font-bold text-primary">{format(date, 'HH:mm')}</span>
                      </div>
                      <div className="p-6 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <h4 className="font-bold text-lg">{apt.clientName}</h4>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="secondary"><Scissors className="w-3 h-3 mr-1" />{apt.serviceName}</Badge>
                            <Badge variant="outline">{apt.durationMinutes} min</Badge>
                          </div>
                          {apt.aiSummary && (
                            <p className="text-xs text-muted-foreground italic mt-2 border-l-2 pl-2 border-primary/20">
                              "{apt.aiSummary}"
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-green-500 font-bold text-xs uppercase">
                          <CheckCircle2 className="w-4 h-4" /> Confirmado
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
