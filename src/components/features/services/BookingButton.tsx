"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Scissors, ChevronRight } from 'lucide-react';
import { MouseEvent } from 'react';

interface BookingButtonProps {
  serviceId: string;
  className?: string;
}

export function BookingButton({ serviceId, className }: BookingButtonProps) {
  const router = useRouter();

  const handleButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    // 1. Impede o comportamento padrão de link/âncora do HTML
    e.preventDefault();
    
    // 2. Impede que o clique suba para o carrossel/card pai
    e.stopPropagation();

    // 3. Executa a navegação limpa pelo roteador do Next.js
    router.push(`/client/appointments/new?serviceId=${serviceId}`);
  };

  return (
    <Button 
      className={`w-full h-11 rounded-xl gap-2 font-headline group/btn ${className || ''}`}
      onClick={handleButtonClick}
    >
      <Scissors className="w-4 h-4" />
      Agendar Agora
      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity" />
    </Button>
  );
}