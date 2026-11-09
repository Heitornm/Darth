import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

const BARBER_UIDS = [
  '2cAVs3U9ciV3NiqApJuOlYGEJS32',
  'eUCAkXknM1N0mcC04hCIfF3HcMk1',
  'wWlt2ixyjwfLqDHDQFFNQgaYfCT2'
];

function timeToMinutes(timeStr: string): number {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Rota API para criação de um novo agendamento.
 * Valida sobreposição de horários (duração do serviço) e respeita a trava dos 10 minutos.
 * Método: POST /api/appointments/new
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[NEW APPOINTMENT API] Dados recebidos no servidor:', body);

    const {
      clientId,
      userName,
      userEmail,
      serviceId,
      serviceName,
      price,
      date,
      time,
      durationMinutes = 30,
      barberId = '2cAVs3U9ciV3NiqApJuOlYGEJS32',
      status: initialStatus
    } = body;

    // 1. Validação dos campos obrigatórios
    if (!serviceName || price === undefined || !date || !time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: serviceName, price, date e time são necessários.' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      console.error('[NEW APPOINTMENT API ERROR] Instância adminDb não inicializada.');
      return NextResponse.json(
        { error: 'Serviço do Firebase Admin indisponível no servidor.' },
        { status: 503 }
      );
    }

    // 2. Checagem de sobreposição de horários (Overlap Check) no banco de dados
    const newStartMins = timeToMinutes(time);
    const newDuration = Number(durationMinutes) || 30;
    const newEndMins = newStartMins + newDuration;

    const existingAppointmentsSnap = await adminDb
      .collection('appointments')
      .where('date', '==', date)
      .where('barberId', '==', barberId)
      .get();

    const nowMs = Date.now();
    const TEN_MINUTES_MS = 10 * 60 * 1000;

    let hasCollision = false;

    for (const docSnap of existingAppointmentsSnap.docs) {
      const aptData = docSnap.data();
      const status = aptData.status;

      // Ignora agendamentos cancelados
      if (status === 'cancelado' || status === 'canceled') continue;

      // Trava de 10 minutos para 'aguardando_pagamento'
      if (status === 'aguardando_pagamento') {
        let createdTimeMs = 0;
        if (aptData.createdAt && typeof aptData.createdAt.toDate === 'function') {
          createdTimeMs = aptData.createdAt.toDate().getTime();
        } else if (aptData.createdAt && typeof aptData.createdAt.seconds === 'number') {
          createdTimeMs = aptData.createdAt.seconds * 1000;
        }

        if (createdTimeMs > 0 && (nowMs - createdTimeMs) > TEN_MINUTES_MS) {
          // Reserva expirada -> não gera colisão
          continue;
        }
      }

      // Calcula intervalo do agendamento existente
      const existStartMins = timeToMinutes(aptData.time);
      const existDuration = Number(aptData.durationMinutes) || 30;
      const existEndMins = existStartMins + existDuration;

      // Validação de colisão de intervalos: Max(Início1, Início2) < Min(Fim1, Fim2)
      if (Math.max(newStartMins, existStartMins) < Math.min(newEndMins, existEndMins)) {
        hasCollision = true;
        break;
      }
    }

    if (hasCollision) {
      return NextResponse.json(
        { error: 'O horário selecionado ou o intervalo de duração do serviço já está reservado por outro cliente.' },
        { status: 409 }
      );
    }

    // 3. Configura status e expiração do documento
    const statusToSave = initialStatus || 'aguardando_barbeiro';
    const createdAt = Timestamp.now();
    const expiresAt = statusToSave === 'aguardando_pagamento' 
      ? Timestamp.fromMillis(Date.now() + TEN_MINUTES_MS)
      : null;

    const newAppointment = {
      clientId: clientId || 'anonimo',
      userName: userName || 'Cliente sem Nome',
      userEmail: userEmail || '',
      serviceId: serviceId || '',
      serviceName,
      price: Number(price),
      date,
      time,
      durationMinutes: newDuration,
      barberId,
      status: statusToSave,
      createdAt,
      expiresAt,
      updatedAt: Timestamp.now(),
    };

    // 4. Salva o agendamento no Firestore
    const docRef = await adminDb.collection('appointments').add(newAppointment);
    const appointmentId = docRef.id;

    // 5. Envia notificações para a equipe de barbeiros
    const batch = adminDb.batch();

    BARBER_UIDS.forEach((toUid) => {
      const notificationRef = adminDb.collection('notifications').doc();
      batch.set(notificationRef, {
        toId: toUid,
        title: '✂️ Novo Agendamento Solicitado',
        message: `${userName || 'Um cliente'} agendou ${serviceName} (${newDuration} min) para o dia ${date} às ${time}.`,
        appointmentId,
        read: false,
        createdAt: Timestamp.now(),
        type: 'new_appointment'
      });
    });

    await batch.commit();

    console.log(`[NEW APPOINTMENT API] ✅ Agendamento (ID: ${appointmentId}) criado com sucesso.`);

    return NextResponse.json({
      success: true,
      appointmentId,
      message: 'Agendamento e notificação registrados com sucesso.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('[NEW APPOINTMENT API EXCEPTION]:', error);
    return NextResponse.json({
      error: 'Erro interno no servidor ao criar o agendamento.',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}