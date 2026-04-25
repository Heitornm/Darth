
"use client";

import React, { useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock, Scissors, CreditCard } from 'lucide-react';
import Link from 'next/link';

const SERVICES = [
  { 
    id: 'srv-1', 
    name: 'Corte Clássico', 
    price: 50, 
    durationMinutes: 30, 
    desc: 'Corte tradicional feito com tesoura e máquina, acabamento impecável.',
    image: 'https://picsum.photos/seed/haircut1/600/400'
  },
  { 
    id: 'srv-2', 
    name: 'Barba Completa', 
    price: 40, 
    durationMinutes: 30, 
    desc: 'Design de barba com toalha quente e produtos premium para hidratação.',
    image: 'https://picsum.photos/seed/beard1/600/400'
  },
  { 
    id: 'srv-3', 
    name: 'Combo (Corte + Barba)', 
    price: 80, 
    durationMinutes: 60, 
    desc: 'O pacote completo para quem busca renovar o visual por inteiro.',
    image: 'https://picsum.photos/seed/combo1/600/400'
  },
  { 
    id: 'srv-4', 
    name: 'Corte Premium', 
    price: 70, 
    durationMinutes: 45, 
    desc: 'Corte estilizado com técnicas modernas e lavagem inclusa.',
    image: 'https://picsum.photos/seed/haircut2/600/400'
  },
];

export function ServiceCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })
  ]);

  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);

  return (
    <div className="w-full py-10">
      <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="flex">
          {SERVICES.map((service) => (
            <div 
              key={service.id} 
              className="flex-[0_0_80%] sm:flex-[0_0_50%] md:flex-[0_0_33%] min-w-0 pl-4"
              onClick={() => setSelectedService(service)}
            >
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 h-full group">
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={service.image} 
                    alt={service.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 space-y-2">
                  <h3 className="text-xl font-headline font-bold">{service.name}</h3>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-primary" />
                      {service.durationMinutes} min
                    </span>
                    <span className="font-bold text-accent">R$ {service.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="sm:max-w-[500px] border-primary/20">
          {selectedService && (
            <>
              <DialogHeader>
                <div className="w-full aspect-video rounded-lg overflow-hidden mb-4 border border-border">
                  <img src={selectedService.image} alt={selectedService.name} className="w-full h-full object-cover" />
                </div>
                <DialogTitle className="text-2xl font-headline font-bold text-primary">
                  {selectedService.name}
                </DialogTitle>
                <DialogDescription className="text-base pt-2">
                  {selectedService.desc}
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Duração</p>
                    <p className="font-bold">{selectedService.durationMinutes} minutos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <CreditCard className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Investimento</p>
                    <p className="font-bold text-accent">R$ {selectedService.price},00</p>
                  </div>
                </div>
              </div>

              <DialogFooter className="sm:justify-start pt-4">
                <Button asChild className="w-full h-12 text-lg font-headline">
                  <Link href="/client/appointments" className="flex items-center gap-2">
                    <Scissors className="w-5 h-5" />
                    Agendar este serviço
                  </Link>
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
