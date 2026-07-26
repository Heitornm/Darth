"use client";

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  Clock, 
  Scissors, 
  AlertCircle, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Hourglass 
} from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Appointment {
  id: string;
  serviceName: string;
  price: number;
  status: 'pendente' | 'pending' | 'confirmado' | 'confirmed' | 'cancelado' | 'canceled' | 'concluido' | 'completed';
  createdAt?: any;
  date?: string;
  time?: string;
}

function AppointmentsContent() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isUserLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    async function fetchAppointments() {
      if (!db || !user) return;

      try {
        setLoading(true);
        const q = query(
          collection(db, "appointments"),
          where("userId", "==", user.uid)
        );

        const querySnapshot = await getDocs(q);
        const docs: Appointment[] = [];

        querySnapshot.forEach((docSnap) => {
          docs.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as Appointment);
        });

        // Ordena por data de criação mais recente
        docs.sort((a, b) => {
          const dateA = a.createdAt?.seconds || 0;
          const dateB = b.createdAt?.seconds || 0;
          return dateB - dateA;
        });

        setAppointments(docs);
      } catch (err: any) {
        console.error("Erro ao buscar agendamentos:", err);
        setError("Não foi possível carregar seus agendamentos.");
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [user, isUserLoading, db, router]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
      case 'confirmed':
        return (
          <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
          </Badge>
        );
      case 'concluido':
      case 'completed':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
          </Badge>
        );
      case 'cancelado':
      case 'canceled':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3.5 h-3.5" /> Cancelado
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20 gap-1">
            <Hourglass className="w-3.5 h-3.5" /> Aguardando Pagamento (10 min)
          </Badge>
        );
    }
  };

  if (isUserLoading || loading) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl space-y-4">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse" />
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
        <div className="h-32 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-md text-center">
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
            <CardTitle>Erro de Carregamento</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-headline">Minhas Reservas</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus horários e histórico de serviços</p>
        </div>
        <Button asChild className="rounded-xl gap-2 font-semibold">
          <Link href="/client/appointments/new">
            <Plus className="w-4 h-4" /> Novo Agendamento
          </Link>
        </Button>
      </div>

      {appointments.length === 0 ? (
        <Card className="text-center py-12 bg-card/50 border-dashed">
          <CardContent className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-lg">Nenhum agendamento encontrado</h3>
              <p className="text-sm text-muted-foreground">Você ainda não possui reservas ativas.</p>
            </div>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/client/appointments/new">Agendar um Serviço</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {appointments.map((app) => (
            <Card key={app.id} className="overflow-hidden border-primary/10 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-lg text-foreground">{app.serviceName || "Serviço Barbearia"}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-primary" />
                      <span>{app.date ? `${app.date.split('-').reverse().join('/')} às ${app.time}` : "Aguardando confirmação"}</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      R$ {Number(app.price || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  {getStatusBadge(app.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-12 text-center text-muted-foreground">
        Carregando suas reservas...
      </div>
    }>
      <AppointmentsContent />
    </Suspense>
  );
}