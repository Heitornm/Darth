"use client";

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Service {
  id: string;
  name: string;
  price: number;
  durationMinutes?: number;
}

interface ServiceSelectorProps {
  services: Service[];
  selectedServiceIds: string[];
  onToggleService: (service: Service) => void;
}

export function ServiceSelector({
  services,
  selectedServiceIds,
  onToggleService,
}: ServiceSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">
        Selecione um ou mais serviços:
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1">
        {services.map((service) => {
          const isSelected = selectedServiceIds.includes(service.id);

          return (
            <div
              key={service.id}
              onClick={() => onToggleService(service)}
              className={cn(
                "relative flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all select-none",
                isSelected
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border hover:border-primary/50 bg-card"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/40 bg-background"
                  )}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">
                    {service.name}
                  </p>
                  {service.durationMinutes && (
                    <p className="text-xs text-muted-foreground">
                      {service.durationMinutes} min
                    </p>
                  )}
                </div>
              </div>

              <span className="font-semibold text-sm text-primary">
                R$ {service.price.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}