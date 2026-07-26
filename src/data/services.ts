export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration?: number | string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: "corte",
    name: "Corte de Cabelo",
    price: 1.0,
    description: "Corte moderno ou tradicional ajustado ao seu estilo.",
    duration: 30,
  },
  {
    id: "barba",
    name: "Barba Completa",
    price: 1.0,
    description: "Modelagem de barba com toalha quente e finalização.",
    duration: 30,
  },
  {
    id: "combo",
    name: "Combo Cabelo + Barba",
    price: 1.0,
    description: "Serviço completo de corte e barba com desconto.",
    duration: 60,
  },
];