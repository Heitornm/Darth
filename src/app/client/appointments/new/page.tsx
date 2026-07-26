"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { auth } from "@/firebase/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { SERVICES, ServiceItem } from "@/data/services";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function NewAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedId = searchParams.get("serviceId");

  const carouselRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const serviceList = SERVICES ?? [];
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(() => {
    return serviceList.find((s) => s.id === preSelectedId) || null;
  });
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

  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const { scrollLeft, clientWidth } = carouselRef.current;
      const scrollAmount = clientWidth * 0.75;
      carouselRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleProceedToCheckout = () => {
    if (!selectedService || !user) return;
    setIsLoading(true);
    router.push(`/client/checkout?serviceId=${selectedService.id}`);
  };

  if (!mounted || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl p-8 text-center text-muted-foreground">
        Carregando informações do agendamento...
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Agendar Novo Serviço</h1>
        <p className="text-sm text-muted-foreground">
          Selecione o serviço no carrossel abaixo para prosseguir.
        </p>
      </div>

      {/* Carrossel Dinâmico de Serviços */}
      {serviceList.length > 0 ? (
        <div className="relative group">
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border rounded-full p-2 shadow-md transition-all"
            aria-label="Anterior"
          >
            ←
          </button>

          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto scrollbar-none scroll-smooth p-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {serviceList.map((service) => {
              const isSelected = selectedService?.id === service.id;
              const imgSrc =
                service.image ||
                service.imageUrl ||
                "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800";

              return (
                <Card
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`min-w-[240px] max-w-[280px] flex-shrink-0 cursor-pointer transition-all border-2 overflow-hidden ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="relative h-36 w-full bg-muted">
                    <Image
                      src={imgSrc}
                      alt={service.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 280px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-start gap-1">
                      <h3 className="font-semibold text-base line-clamp-1">{service.name}</h3>
                      <span className="font-bold text-primary text-sm whitespace-nowrap">
                        R$ {Number(service.price).toFixed(2)}
                      </span>
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {service.description}
                      </p>
                    )}
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

          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background border rounded-full p-2 shadow-md transition-all"
            aria-label="Próximo"
          >
            →
          </button>
        </div>
      ) : (
        <p className="text-muted-foreground">Nenhum serviço disponível no momento.</p>
      )}

      <div className="flex justify-end pt-4">
        <Button
          onClick={handleProceedToCheckout}
          disabled={!selectedService || isLoading}
          size="lg"
        >
          {isLoading
            ? "Processando..."
            : selectedService
            ? `Avançar com ${selectedService.name}`
            : "Selecione um serviço"}
        </Button>
      </div>
    </div>
  );
}

// Exportação principal com Suspense Boundary para passar no build SSG
export default function NewAppointmentPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl p-8 text-center text-muted-foreground">
          Carregando...
        </div>
      }
    >
      <NewAppointmentContent />
    </Suspense>
  );
}