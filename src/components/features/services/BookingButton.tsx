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
  
  // 🚀 INTERCEPÇÃO CONFIÁVEL: Remove links nativos e repassa ao roteador do Next.js
  const handleButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();  // Impede qualquer scroll ou comportamento padrão de âncora
    e.stopPropagation(); // Trava a bolha do clique para não disparar eventos no Carrossel/Embla

    // Navega diretamente pelo roteador client-side do Next.js
    router.push(`/client/appointments/new?serviceId=${serviceId}`);
  };

  return (
    <Button 
      type="button"
      className={`w-full h-11 rounded-xl gap-2 font-headline group/btn ${className || ''}`}
      onClick={handleButtonClick}
    >
      <Scissors className="w-4 h-4" />
      Agendar Agora
      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity" />
    </Button>
  );
}