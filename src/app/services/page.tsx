"use client";

import { SERVICES, ServiceItem } from "@/data/services";
import { ServiceSelector } from "@/components/features/services/ServiceSelector";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function ServicesPage() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);

  // Proteção contra undefined/null durante o SSG/Prerender no Render
  const serviceList = SERVICES ?? [];

  const handleSelectService = (service: ServiceItem) => {
    setSelectedService(service);
  };

  const handleContinue = () => {
    if (selectedService) {
      router.push(`/client/appointments/new?serviceId=${selectedService.id}`);
    }
  };

  return (
    <div className="container mx-auto max-w-4xl p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Nossos Serviços</h1>
        <p className="text-muted-foreground">
          Escolha o serviço desejado para realizar seu agendamento
        </p>
      </div>

      {serviceList.length > 0 ? (
        <ServiceSelector
          services={serviceList}
          onSelect={handleSelectService}
          selectedServiceId={selectedService?.id}
        />
      ) : (
        <div className="text-center p-8 border rounded-lg">
          <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
        </div>
      )}

      {selectedService && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleContinue} size="lg">
            Agendar {selectedService.name}
          </Button>
        </div>
      )}
    </div>
  );
}