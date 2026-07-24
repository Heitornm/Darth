'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2, Calendar, ExternalLink, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function SucessoContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Parâmetros enviados pela InfinitePay na URL
  const transactionId = searchParams.get('transaction_id');
  const receiptUrl = searchParams.get('receipt_url');

  return (
    <Card className="w-full max-w-md border-primary/20 shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
          <CheckCircle2 className="h-10 w-10" />
        </div>
        <CardTitle className="text-2xl font-bold font-headline text-foreground">
          Pagamento Confirmado!
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Seu agendamento foi realizado e o pagamento processado com sucesso.
        </p>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {transactionId && (
          <div className="p-3 bg-muted/50 rounded-lg flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground font-medium">ID da Transação:</span>
            <span className="font-mono text-foreground break-all">{transactionId}</span>
          </div>
        )}

        {receiptUrl && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5"
            onClick={() => window.open(receiptUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Visualizar Comprovante Pix
          </Button>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-2 pt-2">
        <Button
          className="w-full gap-2 font-semibold"
          onClick={() => router.push('/client/appointments')}
        >
          <Calendar className="w-4 h-4" />
          Ver Minhas Reservas
        </Button>

        <Button
          variant="ghost"
          className="w-full text-xs text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/')}
        >
          Voltar ao Início <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function CheckoutSucessoPage() {
  return (
    <main className="min-h-[calc(100vh-4rem)] w-full flex items-center justify-center p-4 bg-background">
      <Suspense fallback={
        <div className="text-center text-muted-foreground animate-pulse">
          Carregando confirmação...
        </div>
      }>
        <SucessoContent />
      </Suspense>
    </main>
  );
}