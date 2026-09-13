"use client";
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FaCut, FaChevronRight } from 'react-icons/fa';
import { MouseEvent } from 'react';

interface BookingButtonProps {
  serviceId: string;
  className?: string;
}

export function BookingButton({ serviceId, className }: BookingButtonProps) {
  const router = useRouter();
  
  const handleButtonClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/client/appointments/new?serviceId=${serviceId}`);
  };

  return (
    <Button 
      type="button"
      className={`w-full h-11 rounded-xl gap-2 font-headline group/btn ${className || ''}`}
      onClick={handleButtonClick}
    >
      <FaCut className="w-4 h-4" />
      Agendar Agora
      <FaChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover/btn:opacity-100 transition-opacity" />
    </Button>
  );
}