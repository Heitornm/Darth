"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { SERVICES, ServiceItem } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ServicesPage() {
  const router = useRouter();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Garantia absoluta contra o erro de 'undefined.map()' durante o build no Render
  const serviceList = SERVICES ?? [];

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollAmount = clientWidth * 0.8;
      carouselRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleContinue = () => {
    if (selectedService) {
      router.push(`/client/appointments/new?serviceId=${selectedService.id}`);
    }
  };

  return (
    <div className="container mx-auto max-w-5xl p-6 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Nossos Serviços</h1>
        <p className="text-muted-foreground">
          Navegue pelas opções abaixo e selecione o serviço desejado
        </p>
      </div>

      {serviceList.length > 0 ? (
        <div className="relative group">
          {/* Botão para rolar Carrossel à esquerda */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border rounded-full p-2 shadow-md transition-all"
            aria-label="Anterior"
          >
            ←
          </button>

          {/* Container do Carrossel */}
          <div
            ref={carouselRef}
            className="flex gap-6 overflow-x-auto scrollbar-none scroll-smooth p-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {serviceList.map((service) => {
              const isSelected = selectedService?.id === service.id;
              const imageUrl =
                service.imageUrl ||
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800";

              return (
                <Card
                  key={service.id}
                  onClick={() => handleSelectService(service)}
                  className={`min-w-[280px] max-w-[320px] flex-shrink-0 cursor-pointer transition-all border-2 overflow-hidden ${
                    isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="relative h-48 w-full bg-muted">
                    <Image
                      src={imageUrl}
                      alt={service.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 320px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                      <span className="font-bold text-primary">
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
                    {service.duration && (
                      <p className="text-xs text-muted-foreground pt-1">
                        ⏱ {service.duration} min
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Botão para rolar Carrossel à direita */}
          <button
            onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border rounded-full p-2 shadow-md transition-all"
            aria-label="Próximo"
          >
            →
          </button>
        </div>
      ) : (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
        </div>
      )}

      <div className="flex justify-end pt-4">
        <Button onClick={handleContinue} size="lg" disabled={!selectedService}>
          {selectedService ? `Agendar ${selectedService.name}` : "Selecione um serviço"}
        </Button>
      </div>
    </div>
  );
}