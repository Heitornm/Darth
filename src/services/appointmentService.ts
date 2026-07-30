import { db } from '@/firebase/firebase';
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

/**
 * Busca os horários ocupados para uma determinada data
 */
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
      const data = doc.data();
      if (data.time) {
        bookedTimes.push(data.time);
      }
    });

    return bookedTimes;
  } catch (error) {
    console.error("Erro ao buscar horários ocupados:", error);
    return [];
  }
}

/**
 * Cria um novo agendamento via API Route
 */
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

export const appointmentService = {
  getBookedSlotsByDate,
  createNewAppointment,
  createAppointment: createNewAppointment,
};