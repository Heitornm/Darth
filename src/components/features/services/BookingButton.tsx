"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Scissors, ChevronRight } from 'lucide-react';
import { MouseEvent } from 'react';

interface BookingButtonProps {
  serviceId: string;
  className?: string;
}

export function BookingButton({ serviceId, className }: BookingButtonProps) {
  
  // 🌟 Impede que o clique "suba" para a div do carrossel
  const handleButtonClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Button 
      asChild 
      className={`w-full h-11 rounded-xl gap-2 font-headline group/btn ${className || ''}`}
      onClick={handleButtonClick}
    >
      <Link href={`/client/appointments/new?serviceId=${serviceId}`}>
        <Scissors className="w-4 h-4" />
        Agendar Agora
        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity" />
      </Link>
    </Button>
  );
}