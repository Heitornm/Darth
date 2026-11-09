import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Converte horário no formato "HH:mm" em minutos
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Converte minutos em string "HH:mm"
 */
function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Rota GET para consultar os horários ocupados de um barbeiro em uma data específica.
 * Aplica a regra de expiração de 10 minutos para 'aguardando_pagamento' e cancela automaticamente no banco.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const barberId = searchParams.get('barberId');

    if (!date || !barberId) {
      return NextResponse.json({ error: 'Parâmetros obrigatórios ausentes (date, barberId).' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ occupiedSlots: [] }, { status: 200 });
    }

    const snapshot = await adminDb
      .collection('appointments')
      .where('date', '==', date)
      .where('barberId', '==', barberId)
      .get();

    const occupiedSlotsSet = new Set<string>();
    const nowMs = Date.now();
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    const updateBatch = adminDb.batch();
    let hasUpdates = false;

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const status = data.status;

      // 1. Ignora agendamentos cancelados
      if (status === 'cancelado' || status === 'canceled') {
        return;
      }

      // 2. Regra dos 10 minutos para agendamentos aguardando pagamento
      if (status === 'aguardando_pagamento') {
        let createdAtMs = 0;
        if (data.createdAt && typeof data.createdAt.toDate === 'function') {
          createdAtMs = data.createdAt.toDate().getTime();
        } else if (data.createdAt && typeof data.createdAt.seconds === 'number') {
          createdAtMs = data.createdAt.seconds * 1000;
        }

        // Se o pagamento não ocorreu em 10 minutos, cancela a reserva no Firestore e libera a agenda
        if (createdAtMs > 0 && (nowMs - createdAtMs) > TEN_MINUTES_MS) {
          updateBatch.update(docSnap.ref, {
            status: 'cancelado',
            cancellationReason: 'Tempo de pagamento expirado (10 min)',
            updatedAt: Timestamp.now()
          });
          hasUpdates = true;
          return;
        }
      }

      // 3. Mapeia os blocos ocupados conforme a duração do serviço
      const startTime = data.time;
      if (!startTime || !/^\d{2}:\d{2}$/.test(startTime)) return;

      const duration = Number(data.durationMinutes) || 30;
      const startMins = timeToMinutes(startTime);
      const endMins = startMins + duration;

      for (let currentMins = startMins; currentMins < endMins; currentMins += 30) {
        occupiedSlotsSet.add(minutesToTime(currentMins));
      }
    });

    // Atualiza em lote os agendamentos expirados no Firestore
    if (hasUpdates) {
      updateBatch.commit().catch(err => console.error("Erro ao atualizar agendamentos expirados em lote:", err));
    }

    return NextResponse.json({ occupiedSlots: Array.from(occupiedSlotsSet) }, { status: 200 });

  } catch (err) {
    console.error('Erro em /api/appointments/slots:', err);
    return NextResponse.json({ occupiedSlots: [] }, { status: 200 });
  }
}