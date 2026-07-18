"use client";

import Link from 'next/link';
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
  
  // 🌟 Impede que o clique suba para o carrossel E impede o scroll padrão para o topo
  const handleButtonClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();  // Mata o comportamento nativo do <a> que joga para o topo
    e.stopPropagation(); // Impede que o clique suba para o carrossel pai
    
    // Executa o redirecionamento de forma limpa pelo Next.js
    router.push(`/client/appointments/new?serviceId=${serviceId}`);
  };

  return (
    <Button 
      asChild 
      className={`w-full h-11 rounded-xl gap-2 font-headline group/btn ${className || ''}`}
    >
      {/* Passamos o onClick diretamente para o Link, capturando o evento do elemento <a> */}
      <Link 
        href={`/client/appointments/new?serviceId=${serviceId}`}
        onClick={handleButtonClick}
      >
        <Scissors className="w-4 h-4" />
        Agendar Agora
        <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity" />
      </Link>
    </Button>
  );
}