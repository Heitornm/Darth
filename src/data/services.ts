export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  duration?: number | string;
  image?: string;
  imageUrl?: string;
}

export const SERVICES: ServiceItem[] = [
  {
    id: "corte",
    name: "Corte de Cabelo",
    price: 1.0,
    description: "Corte moderno ou tradicional ajustado ao seu estilo.",
    duration: 30,
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "barba",
    name: "Barba Completa",
    price: 1.0,
    description: "Modelagem de barba com toalha quente e finalização.",
    duration: 30,
    image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "combo",
    name: "Combo Cabelo + Barba",
    price: 1.0,
    description: "Serviço completo de corte e barba com desconto especial.",
    duration: 60,
    image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=800",
  },
];