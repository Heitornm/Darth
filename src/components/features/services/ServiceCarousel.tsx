"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock, Scissors } from "lucide-react";
import { ServiceItem } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ServiceCarouselProps {
  services: ServiceItem[];
}

export function ServiceCarousel({ services }: ServiceCarouselProps) {
  if (!services || services.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhum serviço disponível no momento.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => {
        const imageUrl = service.image || "/images/placeholder-service.jpg";
        const durationDisplay = service.duration || (service as any).durationMinutes || "30";

        return (
          <Card key={service.id} className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative w-full h-48 bg-muted">
              <Image
                src={imageUrl}
                alt={service.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
        );
      })}
    </div>
  );
}