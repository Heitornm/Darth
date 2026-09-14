'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Scissors } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-6">
      <div className="p-4 bg-primary/10 rounded-full animate-bounce">
        <Scissors className="w-12 h-12 text-primary" />
      </div>
      <h1 className="text-4xl font-headline font-bold text-primary md:text-5xl">
        404 — Página Não Encontrada
      </h1>
      <p className="text-muted-foreground max-w-md mx-auto">
        O horário ou a página que você tentou acessar não existe ou mudou de lugar.
      </p>
      <Button asChild size="lg" className="font-headline">
        <Link href="/">Voltar para a Home</Link>
      </Button>
    </div>
  );
}