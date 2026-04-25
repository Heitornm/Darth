"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro para fins de monitoramento interno
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-destructive/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto bg-destructive/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="text-destructive w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-headline font-bold">Oops!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-xl font-medium">Não foi possível atender a solicitação.</p>
          <p className="text-muted-foreground text-sm">
            Ocorreu um erro inesperado ao processar sua ação. Nossa equipe já foi notificada.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            className="w-full gap-2" 
            onClick={() => reset()}
          >
            <RotateCcw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          <Button asChild className="w-full gap-2">
            <Link href="/">
              <Home className="w-4 h-4" />
              Tela Inicial
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
