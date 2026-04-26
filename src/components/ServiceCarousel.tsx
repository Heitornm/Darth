
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
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
import { Clock, Scissors, CreditCard, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const SERVICES = [
  { 
    id: 'srv-1', 
    name: 'Corte Clássico', 
    price: 50, 
    durationMinutes: 30, 
    desc: 'O corte que nunca sai de moda. Executado com precisão cirúrgica usando tesoura e máquina, focado na estrutura do seu rosto.',
    image: PlaceHolderImages.find(img => img.id === 'srv-corte-classico')?.imageUrl || 'https://picsum.photos/seed/srv1/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-corte-classico')?.imageHint || 'classic haircut'
  },
  { 
    id: 'srv-2', 
    name: 'Barba Completa', 
    price: 40, 
    durationMinutes: 30, 
    desc: 'Tratamento completo para sua barba. Inclui design personalizado, toalha quente e óleos premium.',
    image: PlaceHolderImages.find(img => img.id === 'srv-barba-completa')?.imageUrl || 'https://picsum.photos/seed/srv2/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-barba-completa')?.imageHint || 'beard grooming'
  },
  { 
    id: 'srv-3', 
    name: 'Combo Imperial', 
    price: 80, 
    durationMinutes: 60, 
    desc: 'Nossa experiência completa. O alinhamento perfeito entre cabelo e barba.',
    image: PlaceHolderImages.find(img => img.id === 'srv-combo-imperial')?.imageUrl || 'https://picsum.photos/seed/srv3/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-combo-imperial')?.imageHint || 'barber combo'
  },
  { 
    id: 'srv-4', 
    name: 'Corte Premium', 
    price: 70, 
    durationMinutes: 45, 
    desc: 'Para quem busca exclusividade. Lavagem premium e técnicas avançadas de visagismo.',
    image: PlaceHolderImages.find(img => img.id === 'srv-corte-premium')?.imageUrl || 'https://picsum.photos/seed/srv4/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-corte-premium')?.imageHint || 'luxury haircut'
  },
];

export function ServiceCarousel() {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start' }, 
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const [selectedService, setSelectedService] = useState<typeof SERVICES[0] | null>(null);

  return (
    <div className="w-full">
      <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="flex -ml-4">
          {[...SERVICES, ...SERVICES].map((service, index) => (
            <div 
              key={`${service.id}-${index}`} 
              className="flex-[0_0_85%] sm:flex-[0_0_45%] md:flex-[0_0_30%] min-w-0 pl-4"
              onClick={() => setSelectedService(service)}
            >
              <div className="bg-card border border-border/50 rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full group flex flex-col">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <Image 
                    src={service.image} 
                    alt={service.name} 
                    width={600}
                    height={400}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    data-ai-hint={service.hint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                    <span className="text-white text-sm font-bold flex items-center gap-2">
                      Ver detalhes <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-headline font-bold mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{service.desc}</p>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-border/50">
                    <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-muted rounded-md">
                      <Clock className="w-3 h-3 text-primary" />
                      {service.durationMinutes} min
                    </span>
                    <span className="font-bold text-accent text-lg">R$ {service.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="sm:max-w-[550px] border-primary/20 bg-card overflow-hidden p-0 gap-0">
          {selectedService && (
            <>
              <div className="w-full aspect-video overflow-hidden relative">
                <Image 
                  src={selectedService.image} 
                  alt={selectedService.name} 
                  fill
                  className="object-cover" 
                />
              </div>
              <div className="p-8 space-y-6">
                <DialogHeader>
                  <DialogTitle className="text-3xl font-headline font-bold text-primary flex items-center justify-between">
                    {selectedService.name}
                    <span className="text-accent text-2xl">R$ {selectedService.price},00</span>
                  </DialogTitle>
                  <DialogDescription className="text-base text-foreground/80 leading-relaxed pt-2">
                    {selectedService.desc}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid grid-cols-2 gap-6 py-6 border-y border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Duração Estimada</p>
                      <p className="font-bold text-lg">{selectedService.durationMinutes} minutos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/10 rounded-xl">
                      <CreditCard className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Investimento</p>
                      <p className="font-bold text-lg">Pagamento no Local</p>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button asChild className="w-full h-14 text-lg font-headline rounded-xl shadow-lg shadow-primary/20">
                    <Link href="/client/appointments" className="flex items-center gap-2">
                      <Scissors className="w-5 h-5" />
                      Reservar este serviço
                    </Link>
                  </Button>
                </DialogFooter>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
