import { db } from '@/firebase/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';

/**
 * Interface principal representando a estrutura de um Agendamento
 */
export interface Appointment {
  id?: string;
  clientId: string;
  userName: string;
  userEmail?: string;
  serviceId: string;
  serviceName: string;
  price: number;
  date: string; // Formato padrão: YYYY-MM-DD
  time: string; // Formato padrão: HH:mm
  durationMinutes?: number;
  barberId?: string;
  status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'aguardando_pagamento' | 'aguardando_barbeiro';
  createdAt?: any;
  expiresAt?: any;
}

/**
 * Converte horário no formato "HH:mm" em minutos a partir da meia-noite (ex: "09:30" => 570)
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos a partir da meia-noite em uma string no formato "HH:mm" (ex: 570 => "09:30")
 */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Verifica se a reserva temporária de 10 minutos para pagamento expirou
 */
export function isHoldExpired(createdAt: any, maxMinutes = 10): boolean {
  if (!createdAt) return false;
  let createdTimeMs = 0;

  if (typeof createdAt.toDate === 'function') {
    createdTimeMs = createdAt.toDate().getTime();
  } else if (typeof createdAt === 'object' && 'seconds' in createdAt) {
    createdTimeMs = createdAt.seconds * 1000;
  } else if (createdAt instanceof Date) {
    createdTimeMs = createdAt.getTime();
  } else if (typeof createdAt === 'number') {
    createdTimeMs = createdAt;
  } else {
    createdTimeMs = new Date(createdAt).getTime();
  }

  if (isNaN(createdTimeMs)) return false;
  const nowMs = Date.now();
  return (nowMs - createdTimeMs) > (maxMinutes * 60 * 1000);
}

/**
 * Função auxiliar para validação de formato de data (YYYY-MM-DD)
 */
function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Busca os horários ocupados para uma determinada data e barbeiro no Firestore.
 * Considera a duração de cada serviço (durationMinutes) e ignora reservas temporárias com mais de 10 minutos.
 */
export async function getBookedSlotsByDate(dateStr: string, barberId?: string): Promise<string[]> {
  if (!dateStr || !isValidDateString(dateStr)) {
    console.warn('⚠️ Data inválida informada em getBookedSlotsByDate:', dateStr);
    return [];
  }

  try {
    let q;
    if (barberId) {
      q = query(
        collection(db, 'appointments'),
        where('date', '==', dateStr),
        where('barberId', '==', barberId)
      );
    } else {
      q = query(
        collection(db, 'appointments'),
        where('date', '==', dateStr)
      );
    }

    const querySnapshot = await getDocs(q);
    const occupiedSlotsSet = new Set<string>();

    querySnapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const status = data?.status;

      // 1. Ignora agendamentos cancelados
      if (status === 'cancelado' || status === 'cancelled' || status === 'canceled') {
        return;
      }

      // 2. Trava dos 10 minutos: Se for 'aguardando_pagamento' e tiver expirado, ignora o bloqueio
      if (status === 'aguardando_pagamento' && isHoldExpired(data?.createdAt, 10)) {
        return;
      }

      const startTime = data?.time;
      if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return;

      const duration = Number(data?.durationMinutes) || 30;
      const startMins = timeToMinutes(startTime);
      const endMins = startMins + duration;

      // 3. Mapeia todos os blocos de 30 minutos ocupados pela duração do serviço
      for (let currentMins = startMins; currentMins < endMins; currentMins += 30) {
        occupiedSlotsSet.add(minutesToTime(currentMins));
      }
    });

    return Array.from(occupiedSlotsSet);
  } catch (error: any) {
    console.error("Erro ao buscar horários ocupados:", error);
    return [];
  }
}

/**
 * Envia a solicitação de novo agendamento para a API Route
 */
export async function createNewAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'status'> & { status?: string }) {
  if (!isValidDateString(data.date)) {
    throw new Error('Formato de data inválido. Utilize o formato YYYY-MM-DD.');
  }
  if (!/^\d{2}:\d{2}$/.test(data.time)) {
    throw new Error('Formato de horário inválido. Utilize o formato HH:mm.');
  }

  const response = await fetch('/api/appointments/new', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Falha ao processar o agendamento no servidor.');
  }

  return result;
}

export const appointmentService = {
  getBookedSlotsByDate,
  createNewAppointment,
  createAppointment: createNewAppointment,
  timeToMinutes,
  minutesToTime,
  isHoldExpired,
};