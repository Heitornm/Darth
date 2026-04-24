"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, Clock, User, Calendar as CalendarIcon, AlertCircle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';

const MASTER_BARBER_ID = 'darth-barber-main';
const BARBER_EMAIL = "darthbarber@darth.com.br";

export default function BarberDashboardPage() {
  const router = useRouter();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== BARBER_EMAIL)) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const appointmentsQuery = useMemoFirebase(() => {
    if (!db || !user || user.email !== BARBER_EMAIL) return null;
    
    const today = new Date();
    today.setHours(0,0,0,0);
    
    return query(
      collection(db, "appointments"),
      where("barberId", "==", MASTER_BARBER_ID),
      where("dataHora", ">=", Timestamp.fromDate(today)),
      orderBy("dataHora", "asc")
    );
  }, [db, user]);

  const { data: appointments, isLoading, error } = useCollection(appointmentsQuery);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
            {format(new Date(), "PPPP", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-primary/10 border-primary/20 px-4 py-2 flex items-center gap-3">
             <TrendingUp className="text-primary w-5 h-5" />
             <div>
               <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Hoje</p>
               <p className="text-lg font-bold">{appointments?.length || 0}</p>
             </div>
          </Card>
        </div>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/10 mb-6">
          <CardContent className="py-4 text-destructive flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            <p>Erro ao carregar agenda. Verifique suas permissões.</p>
          </CardContent>
        </Card>
      )}

      {!appointments || appointments.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-headline font-semibold mb-2">Sem agendamentos hoje</h3>
            <p className="text-muted-foreground">Aproveite para afiar suas tesouras!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const date = apt.dataHora.toDate();
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

                    <div className="flex-1 p-6 space-y-4">
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
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20">
                          {apt.status.toUpperCase()}
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