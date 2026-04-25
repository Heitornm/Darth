
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Scissors, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useFirestore, useUser } from '@/firebase';
import { collection, Timestamp, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

const SERVICES = [
  { id: 'srv-1', name: 'Corte Clássico', price: 50, durationMinutes: 30 },
  { id: 'srv-2', name: 'Barba Completa', price: 40, durationMinutes: 30 },
  { id: 'srv-3', name: 'Combo (Corte + Barba)', price: 80, durationMinutes: 60 },
  { id: 'srv-4', name: 'Corte Premium', price: 70, durationMinutes: 45 },
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
  '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', 
  '16:00', '16:30', '17:00', '17:30', '18:00'
];

const MASTER_BARBER_ID = 'darth-barber-main'; 

export default function ClientAppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  
  const [date, setDate] = useState<Date>();
  const [serviceId, setServiceId] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Removida a query de listagem ampla para evitar erros de permissão.
  // Em uma aplicação real, a disponibilidade seria verificada via Cloud Function ou coleção pública.

  const selectedService = SERVICES.find(s => s.id === serviceId);

  const handleBooking = async () => {
    if (!user) {
      toast({ title: "Login necessário", description: "Faça login para agendar." });
      router.push('/login');
      return;
    }

    if (!date || !serviceId || !time) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const [hours, minutes] = time.split(':').map(Number);
    const appointmentDate = new Date(date);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const appointmentData = {
      clientId: user.uid,
      clientName: user.displayName || user.email,
      barberId: MASTER_BARBER_ID,
      serviceId,
      serviceName: selectedService?.name,
      durationMinutes: selectedService?.durationMinutes,
      price: selectedService?.price,
      dataHora: Timestamp.fromDate(appointmentDate),
      status: 'pendente',
      createdAt: Timestamp.now(),
    };

    addDoc(collection(db, "appointments"), appointmentData)
      .then(() => {
        toast({
          title: "Sucesso!",
          description: "Seu agendamento foi realizado com sucesso.",
        });
        router.push('/client/my-appointments');
      })
      .catch(async (err) => {
        const error = new FirestorePermissionError({
          path: 'appointments',
          operation: 'create',
          requestResourceData: appointmentData,
        });
        errorEmitter.emit('permission-error', error);
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-4xl font-headline font-bold text-primary">Reserve seu Serviço</h1>
        <p className="text-muted-foreground">Escolha o serviço e o melhor momento para o seu visual.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-primary/20 bg-card">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <Scissors className="w-5 h-5 text-primary" />
                Selecione o Serviço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Serviço</Label>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Escolha um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICES.map(srv => (
                      <SelectItem key={srv.id} value={srv.id}>
                        {srv.name} - R$ {srv.price} ({srv.durationMinutes}min)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                        {date ? format(date, "P", { locale: ptBR }) : "Escolha a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        locale={ptBR}
                        disabled={{ before: new Date() }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Select value={time} onValueChange={setTime} disabled={!date || !serviceId}>
                    <SelectTrigger className="w-full">
                      <Clock className="w-4 h-4 mr-2 text-primary" />
                      <SelectValue placeholder="Hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                className="w-full h-12 text-lg font-headline bg-primary hover:bg-primary/90"
                onClick={handleBooking}
                disabled={loading || !user}
              >
                {loading ? "Processando..." : user ? "Confirmar Agendamento" : "Faça Login para Agendar"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-muted bg-muted/20 h-full">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Resumo do Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-medium">{selectedService?.name || '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Duração:</span>
                <span className="font-medium">{selectedService ? `${selectedService.durationMinutes} min` : '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Preço:</span>
                <span className="font-medium text-accent">{selectedService ? `R$ ${selectedService.price}` : '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Data e Hora:</span>
                <span className="font-medium">{date && time ? `${format(date, "P", { locale: ptBR })} às ${time}` : '---'}</span>
              </div>
              <div className="pt-4 flex items-start gap-2 text-muted-foreground italic">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <p>Nossos agendamentos garantem a qualidade e o estilo que você merece.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
