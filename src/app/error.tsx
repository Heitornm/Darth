"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { ShieldAlert, Home, RotateCcw } from 'lucide-react';
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
    console.debug('Aplicação capturou um erro:', error);
  }, [error]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <Card className="max-w-md w-full border-destructive/20 bg-card/60 backdrop-blur-xl shadow-2xl relative z-10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-destructive/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border border-destructive/20">
            <ShieldAlert className="text-destructive w-10 h-10 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold tracking-tight">Oops!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-2">
          <p className="text-lg font-bold">Não foi possível atender a solicitação.</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ocorreu uma instabilidade ou problema de permissão. 
            Tente recarregar ou volte para a página inicial.
          </p>
          {error.digest && (
            <div className="p-2 bg-muted/30 rounded text-[10px] font-mono opacity-50">
              ID: {error.digest}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8 px-8">
          <Button 
            className="w-full h-12 gap-2 font-bold shadow-lg shadow-primary/20"
            onClick={() => reset()}
          >
            <RotateCcw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          <Button asChild variant="outline" className="w-full h-12 gap-2 border-primary/20">
            <Link href="/">
              <Home className="w-4 h-4" />
              Voltar para Tela Inicial
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}