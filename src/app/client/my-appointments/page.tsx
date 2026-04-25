"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, Scissors } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const BARBER_EMAIL = "darthbarber@darth.com.br";

export default function MyAppointmentsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const myAppointmentsQuery = useMemoFirebase(() => {
    if (!db || !user || !isClient) return null;
    
    const appointmentsRef = collection(db, "appointments");
    
    // Se for o barbeiro mestre, ele pode listar tudo para fins de gerenciamento
    if (user.email === BARBER_EMAIL) {
      return query(appointmentsRef, orderBy("dataHora", "desc"));
    }

    // SE FOR CLIENTE: O filtro 'where' pelo clientId é OBRIGATÓRIO para bater com a regra de segurança
    return query(
      appointmentsRef,
      where("clientId", "==", user.uid),
      orderBy("dataHora", "desc")
    );
  }, [db, user, isClient]);

  const { data: appointments, isLoading } = useCollection(myAppointmentsQuery);

  if (!isClient || isUserLoading || isLoading) return <div className="p-20 text-center animate-pulse text-primary font-headline">Sincronizando suas reservas...</div>;

  if (!user) {
    return (
      <div className="container mx-auto p-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Acesso restrito</h2>
        <Button asChild><Link href="/login">Fazer Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <header className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary mb-2">Meus Agendamentos</h1>
        <p className="text-muted-foreground">Confira o histórico e status das suas reservas.</p>
      </header>

      {!appointments || appointments.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/10 py-20 text-center">
          <CardContent className="space-y-4">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto">
              <CalendarDays className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold">Nenhum agendamento encontrado</h3>
            <p className="text-muted-foreground">Você ainda não realizou nenhum agendamento na DarthBarber.</p>
            <Button asChild className="mt-4">
              <Link href="/client/appointments">Agendar Agora</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map(apt => {
            const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
            const isPast = date < new Date();
            
            return (
              <Card key={apt.id} className={`overflow-hidden border-l-4 ${isPast ? 'border-l-muted' : 'border-l-primary'}`}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={isPast ? "secondary" : "default"} className="uppercase text-[10px]">
                          {isPast ? "Finalizado" : apt.status}
                        </Badge>
                        <span className="text-sm font-bold text-primary">
                          {format(date, "dd 'de' MMMM", { locale: ptBR })}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-headline font-bold">{apt.serviceName}</h3>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {format(date, 'HH:mm')} ({apt.durationMinutes} min)
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Scissors className="w-4 h-4" />
                          Darth Barber
                        </span>
                      </div>
                    </div>
                    
                    {!isPast && (
                      <div className="flex flex-col items-end gap-2 text-right">
                        <p className="text-xs text-muted-foreground italic">Compareça com 5 min de antecedência</p>
                        <Badge variant="outline" className="border-accent text-accent">CONFIRMADO</Badge>
                      </div>
                    )}
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