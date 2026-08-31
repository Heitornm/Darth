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

// ✅ Função auxiliar segura para validar datas
function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}


/**
 * Busca os horários ocupados para uma determinada data de forma segura
 */
export async function getBookedSlotsByDate(dateStr: string): Promise<string[]> {
  // ✅ Valida a entrada antes de qualquer coisa
  if (!dateStr || !isValidDateString(dateStr)) {
    console.warn('⚠️ Data inválida recebida em getBookedSlotsByDate:', dateStr);
    return [];
  }

  try {
    const q = query(
      collection(db, 'appointments'),
      where('date', '==', dateStr),
      where('status', 'in', ['pending', 'confirmed'])
    );

    const querySnapshot = await getDocs(q);
    
    // ✅ Garante que só retornamos valores válidos
    const bookedTimes = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return data?.time;
      })
      .filter((time): time is string => {
        if (typeof time !== 'string') return false;
        const trimmed = time.trim();
        return /^\d{2}:\d{2}$/.test(trimmed); // Valida formato HH:mm
      });

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
  // ✅ Valida dados antes de enviar
  if (!isValidDateString(data.date)) {
    throw new Error('Formato de data inválido. Use YYYY-MM-DD.');
  }
  if (!/^\d{2}:\d{2}$/.test(data.time)) {
    throw new Error('Formato de horário inválido. Use HH:mm.');
  }

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