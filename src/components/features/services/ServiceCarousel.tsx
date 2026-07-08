"use client";

import Image from 'next/image';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useRouter } from 'next/navigation';
import { Clock } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export const SERVICES = [
  {
    id: 'srv-1',
    name: 'Corte Clássico',
    price: 1,
    durationMinutes: 30,
    desc: 'O corte que nunca sai de moda. Executado com precisão cirúrgica usando tesoura e máquina, focado na estrutura do seu rosto.',
    image: PlaceHolderImages.find(img => img.id === 'srv-corte-classico')?.imageUrl || 'https://picsum.photos/seed/srv1/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-corte-classico')?.imageHint || 'classic haircut'
  },
  {
    id: 'srv-2',
    name: 'Barba Completa',
    price: 1,
    durationMinutes: 30,
    desc: 'Tratamento completo para sua barra. Inclui design personalizado, toalha quente e óleos premium.',
    image: PlaceHolderImages.find(img => img.id === 'srv-barba-completa')?.imageUrl || 'https://picsum.photos/seed/srv2/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-barba-completa')?.imageHint || 'beard grooming'
  },
  {
    id: 'srv-3',
    name: 'Combo Imperial',
    price: 1,
    durationMinutes: 60,
    desc: 'Nossa experiência completa. O alinhamento perfeito entre cabelo e barba.',
    image: PlaceHolderImages.find(img => img.id === 'srv-combo-imperial')?.imageUrl || 'https://picsum.photos/seed/srv3/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-combo-imperial')?.imageHint || 'barber combo'
  },
  {
    id: 'srv-4',
    name: 'Corte Premium',
    price: 1,
    durationMinutes: 45,
    desc: 'Para quem busca exclusividade. Lavagem premium e técnicas avançadas de visagismo.',
    image: PlaceHolderImages.find(img => img.id === 'srv-corte-premium')?.imageUrl || 'https://picsum.photos/seed/srv4/600/400',
    hint: PlaceHolderImages.find(img => img.id === 'srv-corte-premium')?.imageHint || 'luxury haircut'
  },
];

interface ServiceCarouselProps {
  onSelectService?: (service: typeof SERVICES[0]) => void;
  selectedServiceId?: string;
}

export function ServiceCarousel({ onSelectService, selectedServiceId }: ServiceCarouselProps) {
  const router = useRouter();
  const [emblaRef] = useEmblaCarousel(
    { loop: true, align: 'start' },
    [Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true })]
  );

  const handleServiceClick = (service: typeof SERVICES[0]) => {
    if (onSelectService) {
      // Se a função de callback foi passada (está na tela de agendamento), atualiza o estado local
      onSelectService(service);
    } else {
      // Se foi clicado a partir da Home, redireciona direto
      router.push(`/client/appointments/new?serviceId=${service.id}`);
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
                onClick={() => handleServiceClick(service)}
              >
                <div className={`bg-card border rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 h-full group flex flex-col cursor-pointer ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border/50 hover:border-primary/50'}`}>
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
                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                      <span className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 bg-muted rounded-md">
                        <Clock className="w-3 h-3 text-primary" />
                        {service.durationMinutes} min
                      </span>
                      <span className="font-bold text-accent text-lg">R$ {service.price},00</span>
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