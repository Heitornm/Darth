"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.debug('Aplicação capturou um erro:', error);
  }, [error]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--muted)/20%,transparent)] pointer-events-none" />
      
      <Card className="w-full max-w-md relative z-10 shadow-lg border-muted/50">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-4">
            <FiAlertTriangle size={48} className="text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold">Ops! Algo deu errado</CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-3">
          <p className="text-muted-foreground">
            Ocorreu um erro inesperado na aplicação.
          </p>
          {error.message && (
            <p className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error.message}
            </p>
          )}
          {error.digest && (
            <p className="text-xs text-muted-foreground">
              Código do erro: <code className="bg-muted px-1 rounded">{error.digest}</code>
            </p>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            onClick={reset}
            className="w-full sm:w-auto gap-2"
          >
            <FiRefreshCw size={16} />
            Tentar novamente
          </Button>
          
          <Button
            variant="secondary"
            className="w-full sm:w-auto gap-2"
            asChild
          >
            <Link href="/">
              <FiHome size={16} />
              Voltar ao início
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}