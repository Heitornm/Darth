"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, User, Calendar as CalendarIcon, AlertCircle, TrendingUp, Scissors, Home } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import Link from 'next/link';

const MASTER_BARBER_ID = 'darth-barber-main';
const BARBER_EMAIL = "darthbarber@darth.com.br";

export default function BarberDashboardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user || user.email !== BARBER_EMAIL) return null;
    
    // Simplificamos a query para evitar problemas de índice enquanto as regras são aplicadas
    return query(
      collection(db, "appointments"),
      where("barberId", "==", MASTER_BARBER_ID)
    );
  }, [db, user]);

  const { data: appointments, isLoading, error } = useCollection(appointmentsQuery);

  const [currentDate, setCurrentDate] = useState<string>("");
  useEffect(() => {
    setCurrentDate(format(new Date(), "PPPP", { locale: ptBR }));
  }, []);

  if (!mounted) return null;

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Tratamento de erro local para evitar crash da página
  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center">
        <Card className="max-w-md w-full border-destructive/20 text-center">
          <CardHeader>
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-2" />
            <CardTitle>Não foi possível carregar a agenda</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Ocorreu um problema ao acessar os dados dos agendamentos.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full gap-2">
              <Link href="/">
                <Home className="w-4 h-4" />
                Voltar para Início
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (!user || user.email !== BARBER_EMAIL) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mb-4 opacity-50" />
            <h3 className="text-xl font-headline font-bold mb-2">Acesso Administrativo</h3>
            <p className="text-muted-foreground max-w-md">
              Esta área é reservada para o Barbeiro Mestre ({BARBER_EMAIL}).
            </p>
            <Button asChild className="mt-6" variant="outline">
              <Link href="/">Voltar para Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-primary">Agenda do Mestre</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            {currentDate}
          </p>
        </div>
        <Card className="bg-primary/10 border-primary/20 px-4 py-2 flex items-center gap-3">
           <TrendingUp className="text-primary w-5 h-5" />
           <div>
             <p className="text-[10px] uppercase font-bold text-muted-foreground">Agendamentos</p>
             <p className="text-lg font-bold">{appointments?.length || 0}</p>
           </div>
        </Card>
      </div>

      {!appointments || appointments.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Scissors className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-headline font-semibold mb-2">Nenhum agendamento encontrado</h3>
            <p className="text-muted-foreground">Sua agenda está livre por enquanto.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.sort((a, b) => {
            const dateA = a.dataHora instanceof Timestamp ? a.dataHora.toMillis() : new Date(a.dataHora).getTime();
            const dateB = b.dataHora instanceof Timestamp ? b.dataHora.toMillis() : new Date(b.dataHora).getTime();
            return dateA - dateB;
          }).map((apt) => {
            const date = apt.dataHora instanceof Timestamp ? apt.dataHora.toDate() : new Date(apt.dataHora);
            return (
              <Card key={apt.id} className="hover:border-primary/50 transition-colors group overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row items-stretch">
                    <div className="sm:w-32 bg-muted/30 p-4 flex sm:flex-col items-center justify-center gap-1 border-b sm:border-b-0 sm:border-r">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-xl font-headline font-bold text-primary">
                        {format(date, 'HH:mm')}
                      </span>
                    </div>

                    <div className="flex-1 p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <h3 className="text-lg font-bold font-headline">{apt.clientName}</h3>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="border-primary/50 text-primary">
                              {apt.serviceName}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {apt.durationMinutes} min
                            </span>
                          </div>
                        </div>
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                          {apt.status?.toUpperCase() || 'CONFIRMADO'}
                        </Badge>
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
  );
}
