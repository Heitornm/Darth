"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { ServiceSelector } from "@/components/features/services/ServiceSelector";
import { SERVICES, ServiceItem } from "@/data/services";
import { Button } from "@/components/ui/button";

export default function NewAppointmentPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (!currentUser) {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router, mounted]);

  const handleProceedToCheckout = () => {
    if (!selectedService || !user) return;
    
    setIsLoading(true);
    router.push(`/client/checkout?serviceId=${selectedService.id}`);
  };

  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-8 text-center">
        Carregando dados da sessão...
      </div>
    );
  }

  const safeServices = SERVICES || [];

  return (
    <div className="container mx-auto max-w-4xl p-4 space-y-6">
      <h1 className="text-2xl font-bold">Agendar Novo Serviço</h1>
      
      {safeServices.length > 0 ? (
        <ServiceSelector 
          services={safeServices} 
          onSelect={(service: ServiceItem) => setSelectedService(service)}
          selectedServiceId={selectedService?.id}
        />
      ) : (
        <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
      )}

      <div className="flex justify-end pt-4">
        <Button 
          onClick={handleProceedToCheckout} 
          disabled={!selectedService || isLoading}
        >
          {isLoading ? "Processando..." : "Avançar para o Pagamento"}
        </Button>
      </div>
    </div>
  );
}