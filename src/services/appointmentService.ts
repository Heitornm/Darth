import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

export interface Appointment {
  id?: string;
  clientId: string;
  userName: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string; // Formato: YYYY-MM-DD
  time: string; // Formato: HH:mm
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  createdAt?: any;
}

// 1. Buscar os horários ocupados para uma determinada data
export async function getBookedSlotsByDate(dateStr: string): Promise<string[]> {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('date', '==', dateStr),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const querySnapshot = await getDocs(q);
    const bookedTimes: string[] = [];
    querySnapshot.forEach((doc) => {
      bookedTimes.push(doc.data().time);
    });

    return bookedTimes;
  } catch (error) {
    console.error("Erro ao buscar horários ocupados:", error);
    return [];
  }
}

// 2. Criar um novo agendamento via API Route (Proteção contra duplicação/concorrência)
export async function createNewAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'status'>) {
  const response = await fetch('/api/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Falha ao processar o agendamento.');
  }

  return result;
}

// 3. Objeto unificado para compatibilidade
export const appointmentService = {
  getBookedSlotsByDate,
  createNewAppointment,
  createAppointment: createNewAppointment,
};