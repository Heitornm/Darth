import { db } from '@/firebase/config';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp 
} from 'firebase/firestore';

export interface Appointment {
  id?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string; // Formato: YYYY-MM-DD
  time: string; // Formato: HH:mm
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
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

// 2. Criar um novo agendamento
export async function createNewAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'status'>) {
  return await addDoc(collection(db, 'appointments'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

// 3. Objeto unificado para compatibilidade com import { appointmentService }
export const appointmentService = {
  getBookedSlotsByDate,
  createNewAppointment,
  createAppointment: createNewAppointment, // alias para evitar quebras
};