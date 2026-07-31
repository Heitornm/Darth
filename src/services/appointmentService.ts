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
 * Busca os horários ocupados para uma determinada data de forma segura
 */
export async function getBookedSlotsByDate(dateStr: string): Promise<string[]> {
  if (!dateStr) return [];

  try {
    const q = query(
      collection(db, 'appointments'),
      where('date', '==', dateStr),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const querySnapshot = await getDocs(q);
    
    // Converte os documentos em lista de horários utilizando map e filter
    const bookedTimes = querySnapshot.docs
      .map((doc) => doc.data()?.time)
      .filter((time): time is string => typeof time === 'string' && time.trim() !== '');

    return bookedTimes;
  } catch (error: any) {
    console.error("Erro ao buscar horários ocupados:", error);

    // Se o erro for de índice ausente no Firestore, exibe instrução no console sem travar a UI
    if (error?.code === 'failed-precondition') {
      console.warn(
        "Atenção: O Firestore exige um índice composto para esta consulta. Verifique o link de criação de índice no Console do Firebase."
      );
    }
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