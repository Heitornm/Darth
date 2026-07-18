"use client";

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Clock } from 'lucide-react';
import { SERVICES } from '@/data/services';
import { BookingButton } from './BookingButton';
import { MouseEvent } from 'react';

interface ServiceCarouselProps {
  onSelectService?: (service: typeof SERVICES[0]) => void;
  selectedServiceId?: string;
}

export function ServiceCarousel({ onSelectService, selectedServiceId }: ServiceCarouselProps) {
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const handleCardClick = (service: typeof SERVICES[0]) => {
    // Só dispara se a função de seleção existir (dentro da tela de novo agendamento)
    if (onSelectService) {
      onSelectService(service);
    }
  };

  return (
    <div className="w-full">
      <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
        <div className="flex -ml-4">
          {[...SERVICES, ...SERVICES].map((service, index) => {
            const isSelected = selectedServiceId === service.id;
            
            return (
              <div
                key={`${service.id}-${index}`}
                className="flex-[0_0_85%] sm:flex-[0_0_45%] md:flex-[0_0_30%] min-w-0 pl-4"
                onClick={() => handleCardClick(service)}
              >
                <div className={`bg-card border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full group flex flex-col ${onSelectService ? 'cursor-pointer' : ''} ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/50'}`}>
                  
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <Image
                      src={service.image}
                      alt={service.name}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      data-ai-hint={service.hint}
                    />
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                    <div className="text-left">
                      <h3 className={`text-xl font-headline font-bold mb-2 transition-colors ${isSelected ? 'text-primary' : 'group-hover:text-primary'}`}>{service.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{service.desc}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-muted rounded-md">
                          <Clock className="w-3 h-3 text-primary" />
                          {service.durationMinutes} min
                        </span>
                        <span className="font-bold text-accent text-lg">R$ {service.price},00</span>
                      </div>

                      {/* 🚀 O BookingButton agora é importado perfeitamente isolando seu evento de clique do Embla */}
                      {!onSelectService && (
                        <BookingButton serviceId={service.id} className="h-9 text-xs" />
                      )}
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}