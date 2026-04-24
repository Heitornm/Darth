"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Scissors, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { StyleAssistant } from '@/components/StyleAssistant';
import { appointmentService } from '@/services/appointmentService';
import { useToast } from '@/hooks/use-toast';

const BARBERS = [
  { id: 'barber-1', name: 'Mestre Darth' },
  { id: 'barber-2', name: 'Luke Stylist' },
  { id: 'barber-3', name: 'General Fade' },
];

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'
];

export default function ClientAppointmentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [date, setDate] = useState<Date>();
  const [barberId, setBarberId] = useState<string>("");
  const [time, setTime] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [styleSummary, setStyleSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBooking = async () => {
    if (!date || !barberId || !time || !clientName) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos do agendamento.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const appointmentDate = new Date(date);
      appointmentDate.setHours(hours, minutes, 0, 0);

      await appointmentService.saveAppointment({
        clientId: 'temp-client-id', // Mocked for simplicity
        clientName,
        barberId,
        dataHora: appointmentDate,
        status: 'pendente',
        styleSummary,
      });

      toast({
        title: "Sucesso!",
        description: "Seu agendamento foi realizado com sucesso.",
      });
      router.push('/');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível realizar o agendamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-4xl font-headline font-bold text-primary">Reserve seu Horário</h1>
        <p className="text-muted-foreground">Escolha o profissional e o melhor momento para o seu estilo.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Form Column */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-card">
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-primary" />
                Detalhes do Agendamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Seu Nome</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    placeholder="Como devemos te chamar?" 
                    className="pl-10"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Barbeiro</Label>
                <Select value={barberId} onValueChange={setBarberId}>
                  <SelectTrigger className="w-full">
                    <Scissors className="w-4 h-4 mr-2 text-primary" />
                    <SelectValue placeholder="Selecione um profissional" />
                  </SelectTrigger>
                  <SelectContent>
                    {BARBERS.map(barber => (
                      <SelectItem key={barber.id} value={barber.id}>
                        {barber.name}
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
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>Horário</Label>
                  <Select value={time} onValueChange={setTime}>
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
                className="w-full h-12 text-lg font-headline bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                onClick={handleBooking}
                disabled={loading}
              >
                {loading ? "Processando..." : "Confirmar Agendamento"}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* AI Column */}
        <div className="space-y-6">
          <StyleAssistant onSummaryGenerated={setStyleSummary} />
          
          <Card className="border-muted bg-muted/20">
            <CardHeader>
              <CardTitle className="font-headline text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Barbeiro:</span>
                <span className="font-medium">{BARBERS.find(b => b.id === barberId)?.name || '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-medium">{date ? format(date, "PPP", { locale: ptBR }) : '---'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-medium">{time || '---'}</span>
              </div>
              {styleSummary && (
                <div className="pt-2">
                  <p className="text-muted-foreground mb-1 font-bold">Instruções AI:</p>
                  <p className="italic text-accent bg-accent/5 p-2 rounded border border-accent/10">{styleSummary}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
