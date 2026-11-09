import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Rota de API: Criação de Novo Agendamento
 * Grava a reserva de horário no Firestore com status inicial 'aguardando_pagamento'.
 */
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

    // 1. Validação estrita de campos obrigatórios
    if (!serviceName || !price || !date || !time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes (serviceName, price, date, time).' },
        { status: 400 }
      );
    }

    // 2. Validação da instância do Firebase Admin
    if (!adminDb) {
      console.error('[NEW APPOINTMENT API ERROR] adminDb não inicializado no servidor.');
      return NextResponse.json(
        { error: 'Serviço do Firebase Admin temporariamente indisponível no servidor.' },
        { status: 503 }
      );
    }

    // 3. Montagem do objeto de agendamento
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
      status: 'aguardando_pagamento',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // 4. Gravação no Firestore (coleção 'appointments')
    const docRef = await adminDb.collection('appointments').add(newAppointment);

    console.log(`[NEW APPOINTMENT API] ✅ Agendamento criado com sucesso! ID: ${docRef.id}`);

    return NextResponse.json({
      success: true,
      appointmentId: docRef.id,
      message: 'Agendamento criado com sucesso. Redirecionando para o pagamento.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('[NEW APPOINTMENT API EXCEPTION]:', error);
    return NextResponse.json({
      error: 'Erro interno no servidor ao criar o agendamento.',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}