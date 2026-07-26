"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ServiceSelector, Service } from "@/components/features/services/ServiceSelector";
import { Calendar, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

const MOCK_SERVICES: Service[] = [
  { id: "1", name: "Corte de Cabelo", price: 45.0, durationMinutes: 30 },
  { id: "2", name: "Barba Completa", price: 35.0, durationMinutes: 25 },
  { id: "3", name: "Pezinho & Sobrancelha", price: 20.0, durationMinutes: 15 },
  { id: "4", name: "Tratamento Capilar / Hidratação", price: 60.0, durationMinutes: 40 },
];

export default function NewAppointmentPage() {
  const [selectedServices, setSelectedServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const toggleService = (service: Service) => {
    setSelectedServices((prev) =>
      prev.some((s) => s.id === service.id)
        ? prev.filter((s) => s.id !== service.id)
        : [...prev, service]
    );
  };

  const totalPrice = selectedServices.reduce((acc, curr) => acc + curr.price, 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Simulação do checkout
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: selectedServices,
          date: selectedDate,
          time: selectedTime,
          totalAmount: totalPrice,
        }),
      });

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-background/50">
      {/* Container Principal Animado */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-lg bg-card border border-border/80 rounded-2xl shadow-xl p-6 space-y-6"
      >
        <div className="space-y-1 text-center sm:text-left">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Novo Agendamento
          </h1>
          <p className="text-sm text-muted-foreground">
            Escolha os serviços e escolha o melhor horário para você.
          </p>
        </div>

        {/* Troca de passos com AnimatePresence */}
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <ServiceSelector
                services={MOCK_SERVICES}
                selectedServiceIds={selectedServices.map((s) => s.id)}
                onToggleService={toggleService}
              />

              <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Valor total</p>
                  <p className="text-xl font-bold text-primary">
                    R$ {totalPrice.toFixed(2)}
                  </p>
                </div>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={selectedServices.length === 0}
                  onClick={() => setStep(2)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Avançar
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="space-y-4">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Data e Horário
                </label>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />

                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full p-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>

                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  disabled={!selectedDate || !selectedTime || loading}
                  onClick={handleCheckout}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-medium shadow-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Ir para o Pagamento"
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}