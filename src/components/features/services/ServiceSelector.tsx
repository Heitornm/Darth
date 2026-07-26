"use client";

import Image from "next/image";
import { ServiceItem } from "@/data/services";
import { Card, CardContent } from "@/components/ui/card";

export interface ServiceSelectorProps {
  services: ServiceItem[];
  onSelect: (service: ServiceItem) => void;
  selectedServiceId?: string;
}

export function ServiceSelector({
  services,
  onSelect,
  selectedServiceId,
}: ServiceSelectorProps) {
  const safeServices = services ?? [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {safeServices.map((service) => {
        const isSelected = service.id === selectedServiceId;
        const imgSrc =
          service.image ||
          service.imageUrl ||
          "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800";

        return (
          <Card
            key={service.id}
            className={`cursor-pointer transition-all border-2 overflow-hidden flex flex-row ${
              isSelected
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-border hover:border-primary/50"
            }`}
            onClick={() => onSelect(service)}
          >
            {/* Pequena imagem de miniatura no card */}
            <div className="relative w-28 h-auto flex-shrink-0 bg-muted">
              <Image
                src={imgSrc}
                alt={service.name}
                fill
                sizes="112px"
                className="object-cover"
                unoptimized
              />
            </div>

            <CardContent className="p-4 space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-semibold text-base line-clamp-1">{service.name}</h3>
                  <span className="font-bold text-primary text-sm whitespace-nowrap">
                    R$ {Number(service.price).toFixed(2)}
                  </span>
                </div>
                {service.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                    {service.description}
                  </p>
                )}
              </div>
              {service.duration && (
                <p className="text-[11px] text-muted-foreground pt-1">
                  ⏱ {service.duration} min
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}