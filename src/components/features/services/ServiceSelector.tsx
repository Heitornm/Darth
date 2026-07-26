"use client";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {services.map((service) => {
        const isSelected = service.id === selectedServiceId;
        // Cast para permitir a leitura de campos opcionais se existirem no objeto em runtime
        const item = service as ServiceItem & { description?: string; duration?: number | string };

        return (
          <Card
            key={service.id}
            className={`cursor-pointer transition-all border-2 ${
              isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onClick={() => onSelect(service)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{service.name}</h3>
                <span className="font-bold text-primary">
                  R$ {Number(service.price).toFixed(2)}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
              {item.duration && (
                <p className="text-xs text-muted-foreground">
                  Duração: {item.duration} min
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}