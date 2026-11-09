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
}

/**
 * Função auxiliar para validação rigorosa de strings de data (YYYY-MM-DD)
 */
function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Busca os horários ocupados para uma determinada data de forma segura no Firestore.
 * Inclui todos os status ativos para evitar agendamentos duplicados no mesmo horário.
 */
export async function getBookedSlotsByDate(dateStr: string): Promise<string[]> {
  // 1. Valida o formato da data antes da consulta
  if (!dateStr || !isValidDateString(dateStr)) {
    console.warn('⚠️ Data inválida informada em getBookedSlotsByDate:', dateStr);
    return [];
  }

  try {
    // 2. Consulta agendamentos ativos para a data selecionada
    const q = query(
      collection(db, 'appointments'),
      where('date', '==', dateStr),
      where('status', 'in', ['pending', 'confirmed', 'aguardando_pagamento', 'aguardando_barbeiro', 'solicitado'])
    );

    const querySnapshot = await getDocs(q);

    // 3. Extrai e valida a lista de horários ocupados (ex: ["09:00", "10:30"])
    const bookedTimes = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        return data?.time;
      })
      .filter((time): time is string => {
        if (typeof time !== 'string') return false;
        const trimmed = time.trim();
        return /^\d{2}:\d{2}$/.test(trimmed);
      });

    return bookedTimes;
  } catch (error: any) {
    console.error("Erro ao buscar horários ocupados:", error);

    // Exibe instrução amigável caso o índice composto ainda não esteja criado no Firebase Console
    if (error?.code === 'failed-precondition') {
      console.warn(
        "Atenção: O Firestore exige um índice composto para esta consulta. Acesse o console do Firebase para gerar o índice recomendado."
      );
    }
    return [];
  }
}

/**
 * Envia a solicitação para criar um novo agendamento apontando para a API Serverless `/api/appointments/new`
 */
export async function createNewAppointment(data: Omit<Appointment, 'id' | 'createdAt' | 'status'>) {
  // 1. Validação de pré-requisitos antes do disparo HTTP
  if (!isValidDateString(data.date)) {
    throw new Error('Formato de data inválido. Utilize o formato YYYY-MM-DD.');
  }
  if (!/^\d{2}:\d{2}$/.test(data.time)) {
    throw new Error('Formato de horário inválido. Utilize o formato HH:mm.');
  }

  // 2. Disparo para o endpoint correto de criação (/api/appointments/new)
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

/**
 * Exportação consolidada dos serviços de agendamento
 */
export const appointmentService = {
  getBookedSlotsByDate,
  createNewAppointment,
  createAppointment: createNewAppointment,
};