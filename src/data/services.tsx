// src/data/services.tsx
export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
  description?: string;
};

export interface Barber {
  id: string;
  name: string;
}

export const SERVICES: ServiceItem[] = [
  { id: 'corte-classico', name: 'Corte Clássico', price: 1, duration: 30, description: 'Corte tradicional com acabamento.' },
  { id: 'barba', name: 'Barba', price: 1, duration: 20, description: 'Barba com navalha e acabamento.' },
  { id: 'corte-barba', name: 'Corte + Barba', price: 1, duration: 50, description: 'Combo completo para um visual renovado.' },
];

export const HORARIOS_DISPONIVEIS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00'
];

export const BARBEIROS: Barber[] = [
  { id: 'barbeiro1', name: 'Heitor Martins' },
];