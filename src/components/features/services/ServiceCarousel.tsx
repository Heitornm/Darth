"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiClock as Clock, FiScissors as Scissors } from "react-icons/fi";
import { ServiceItem } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ServiceCarouselProps {
  services: ServiceItem[];
}

export function ServiceCarousel({ services }: ServiceCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [cardsPerPage, setCardsPerPage] = useState(1);

  const serviceList: ServiceItem[] = Array.isArray(services) ? services : [];

  // Detecta dinamicamente quantos cards cabem na tela
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setCardsPerPage(3); // Desktop: 3 cards
      } else if (window.innerWidth >= 768) {
        setCardsPerPage(2); // Tablet: 2 cards
      } else {
        setCardsPerPage(1); // Mobile: 1 card
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // O limite de navegacao e o total de servicos menos os visiveis no momento
  const maxIndex = Math.max(0, serviceList.length - cardsPerPage);

  // Transição automática respeitando o limite maxIndex
  useEffect(() => {
    if (serviceList.length <= cardsPerPage || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        if (prevIndex >= maxIndex) {
          return 0; // Se chegou ao final perfeito, reseta para o inicio
        }
        return prevIndex + 1;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [serviceList.length, cardsPerPage, maxIndex, isHovered]);

  if (!serviceList || serviceList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum serviço disponível no momento.
      </div>
    );
  }

  // O cálculo de deslocamento se ajusta exatamente pela porcentagem de cada card visível
  const translatePercent = currentIndex * (100 / cardsPerPage);

  return (
    <div 
      className="relative w-full overflow-hidden p-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Container flex com transição suave */}
      <div
        className="flex transition-transform duration-500 ease-in-out gap-6"
        style={{
          transform: `translateX(-${translatePercent}%)`,
        }}
      >
        {serviceList.map((service) => {
          const imageUrl = service.imageUrl || "/images/darthBarber.png";
          const durationDisplay = service.duration || (service as any).durationMinutes || "30";

          return (
            <div
              key={service.id}
              className="w-full flex-shrink-0 md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
            >
              <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all border-2">
                <div className="relative w-full h-48 bg-muted">
                  <Image
                    src={imageUrl}
                    alt={service.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.srcset = "/images/darthBarber.png";
                    }}
                  />
                </div>

                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex justify-between items-start">
                    <span>{service.name}</span>
                    <span className="text-primary font-bold ml-2">
                      R$ {Number(service.price).toFixed(2)}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description || service.name}
                  </p>

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{durationDisplay} min</span>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button asChild className="w-full gap-2">
                    <Link href={`/client/appointments/new?serviceId=${service.id}`}>
                      <Scissors className="w-4 h-4" />
                      Agendar este serviço
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          );
        })}
      </div>

      {/* Indicadores Visuais de Posição (Exibe apenas as posições reais possíveis) */}
      {maxIndex > 0 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: maxIndex + 1 }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
              }`}
              aria-label={`Ir para a página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}