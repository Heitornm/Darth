"use client";

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, Home, RotateCcw, ShieldAlert } from 'lucide-react';
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
    // Log do erro para monitoramento interno (sem console.error direto para o usuário)
    console.debug('Application error handled by boundary:', error);
  }, [error]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      <Card className="max-w-md w-full border-destructive/20 bg-card/60 backdrop-blur-xl shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto bg-destructive/10 w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border border-destructive/20">
            <ShieldAlert className="text-destructive w-10 h-10 animate-pulse" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold tracking-tight">Oops!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6 pt-2">
          <div className="space-y-2">
            <p className="text-xl font-bold text-foreground/90">Não foi possível atender a solicitação.</p>
            <p className="text-muted-foreground text-sm leading-relaxed px-4">
              Ocorreu uma instabilidade momentânea ou erro de permissão. 
              Não se preocupe, seus dados estão seguros e você pode tentar novamente.
            </p>
          </div>
          
          <div className="p-3 bg-muted/30 rounded-lg text-[10px] font-mono text-muted-foreground break-all opacity-50">
            Digest ID: {error.digest || "Sistema Estável"}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pb-8 px-8">
          <Button 
            variant="default" 
            className="w-full h-12 gap-2 font-bold shadow-lg shadow-primary/20"
            onClick={() => reset()}
          >
            <RotateCcw className="w-4 h-4" />
            Tentar Novamente
          </Button>
          <Button asChild variant="outline" className="w-full h-12 gap-2 border-primary/20 hover:bg-primary/5">
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