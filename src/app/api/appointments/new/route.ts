import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// IDs e emails dos barbeiros que devem receber notificações de novos agendamentos
const BARBER_UIDS = [
  '2cAVs3U9ciV3NiqApJuOlYGEJS32',
  'eUCAkXknM1N0mcC04hCIfF3HcMk1'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[NEW APPOINTMENT API] Dados recebidos:', body);

    const {
      clientId,
      userName,
      userEmail,
      serviceId,
      serviceName,
      price,
      date,
      time,
      durationMinutes,
      barberId = 'barbeiro1',
    } = body;

    if (!serviceName || !price || !date || !time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (serviceName, price, date, time).' },
        { status: 400 }
      );
    }

    if (!adminDb) {
      console.error('[NEW APPOINTMENT API ERROR] adminDb não inicializado.');
      return NextResponse.json(
        { error: 'Serviço do Firebase Admin indisponível no servidor.' },
        { status: 503 }
      );
    }

    // 1. Criar o documento de agendamento no Firestore
    const newAppointment = {
      clientId: clientId || 'anonimo',
      userName: userName || 'Cliente sem Nome',
      userEmail: userEmail || '',
      serviceId: serviceId || '',
      serviceName,
      price: Number(price),
      date,
      time,
      durationMinutes: durationMinutes || 30,
      barberId,
      status: 'aguardando_pagamento', // Será atualizado para 'aguardando_barbeiro' pelo Webhook ou aprovação
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await adminDb.collection('appointments').add(newAppointment);
    const appointmentId = docRef.id;

    // 2. Disparar notificações no Firestore para os barbeiros da equipe
    const batch = adminDb.batch();

    BARBER_UIDS.forEach((toUid) => {
      const notificationRef = adminDb.collection('notifications').doc();
      batch.set(notificationRef, {
        toId: toUid,
        title: '✂️ Novo Agendamento Solicitado',
        message: `${userName} agendou ${serviceName} para o dia ${date} às ${time}.`,
        appointmentId: appointmentId,
        read: false,
        createdAt: Timestamp.now(),
        type: 'new_appointment'
      });
    });

    await batch.commit();

    console.log(`[NEW APPOINTMENT API] ✅ Agendamento e notificações criados com sucesso! ID: ${appointmentId}`);

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