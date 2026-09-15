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

  const serviceList: ServiceItem[] = Array.isArray(services) ? services : [];

  // Transição automática a cada 2,5 segundos (2500ms) com pausa no Hover
  useEffect(() => {
    if (serviceList.length <= 1 || isHovered) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % serviceList.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [serviceList.length, isHovered]);

  if (!serviceList || serviceList.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum serviço disponível no momento.
      </div>
    );
  }

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
          transform: `translateX(-${currentIndex * 100}%)`,
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

      {/* Indicadores Visuais de Posição (Bolinhas) */}
      <div className="flex justify-center gap-2 mt-6">
        {serviceList.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              currentIndex === index ? "w-6 bg-primary" : "w-2 bg-muted-foreground/30"
            }`}
            aria-label={`Ir para o item ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}