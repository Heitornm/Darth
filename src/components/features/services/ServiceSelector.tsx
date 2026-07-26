"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="space-y-3">
      <label className="text-sm font-semibold text-foreground tracking-wide flex items-center justify-between">
        <span>Selecione os serviços desejados</span>
        <span className="text-xs text-muted-foreground font-normal">
          {selectedServiceIds.length} selecionado(s)
        </span>
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1 pr-2 scrollbar-thin">
        {services.map((service, index) => {
          const isSelected = selectedServiceIds.includes(service.id);

          return (
            <motion.div
              key={service.id}
              onClick={() => onToggleService(service)}
              // Animação de entrada em cascata (stagger)
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.04,
                duration: 0.25,
                ease: "easeOut",
              }}
              // Feedback micro-interativo
              whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "relative flex items-center justify-between p-3.5 border rounded-xl cursor-pointer transition-colors select-none",
                isSelected
                  ? "border-primary bg-primary/10 shadow-md shadow-primary/5 ring-1 ring-primary/30"
                  : "border-border/70 hover:border-primary/50 bg-card hover:bg-accent/40"
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shadow-inner",
                    isSelected
                      ? "bg-primary border-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-background"
                  )}
                >
                  <AnimatePresence mode="wait">
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 45 }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 25,
                        }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <p className="font-medium text-sm text-foreground">
                    {service.name}
                  </p>
                  {service.durationMinutes && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3" />
                      {service.durationMinutes} min
                    </span>
                  )}
                </div>
              </div>

              <span className="font-semibold text-sm text-primary">
                R$ {service.price.toFixed(2)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}