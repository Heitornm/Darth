// src/data/services.tsx

export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration: number; // Em minutos
  imageUrl?: string;
  description?: string;
};

export interface Barber {
  id: string;
  name: string;
}

export const SERVICES: ServiceItem[] = [
  { 
    id: 'corte-classico',
    name: 'Corte Clássico', 
    price: 1, 
    duration: 30, 
    imageUrl: '/images/corteClassico.png',
    description: 'Corte tradicional com acabamento fino na tesoura ou máquina.' 
  },
  { 
    id: 'barba', 
    name: 'Barba', 
    price: 1,
    duration: 30, 
    imageUrl: '/images/barbaCompleta.png',
    description: 'Barba feita com navalha e acabamento de toalha quente.' 
  },
  { 
    id: 'corte-barba-express', 
    name: 'Corte + Barba Express', 
    price: 1, 
    duration: 40, 
    imageUrl: '/images/comboImperial.png',
    description: 'Combo ágil para um visual renovado no dia a dia.' 
  },
  { 
    id: 'corte-barba-premium',
    name: 'Corte + Barba Premium', 
    price: 1,
    duration: 60, 
    imageUrl: '/images/cortePremium.png', // Ajustado de './images' para '/images'
    description: 'Combo completo para um visual renovado, com relaxamento e toalha quente.'
  }
];

export const HORARIOS_DISPONIVEIS: string[] = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];

export const BARBEIROS: Barber[] = [
  { id: 'barbeiro1', name: 'Heitor Martins' }
];