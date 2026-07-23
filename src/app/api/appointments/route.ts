import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // Proteção para o ambiente de build
    if (!adminDb) {
      console.warn("⚠️ Firebase Admin não está inicializado. Ignorando durante o build.");
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const body = await request.json();
    const { 
      clientId, 
      userName, 
      userEmail, 
      serviceId, 
      serviceName, 
      price, 
      date, 
      time, 
      barberId = 'barbeiro1' // ID padrão caso não venha selecionado
    } = body;

    // 1. Validação simples de campos obrigatórios
    if (!clientId || !date || !time || !serviceId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // 2. Checagem atômica de conflito de horários no servidor
    const appointmentsRef = adminDb.collection('appointments');
    const conflictCheck = await appointmentsRef
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    if (!conflictCheck.empty) {
      return NextResponse.json(
        { error: 'Este horário acabou de ser preenchido por outro cliente. Por favor, escolha outro horário.' }, 
        { status: 409 }
      );
    }

    // 3. Gravação segura no Firestore via Server
    const newAppointment = {
      clientId,
      userName,
      userEmail,
      serviceId,
      serviceName,
      price,
      date,
      time,
      barberId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const docRef = await appointmentsRef.add(newAppointment);

    return NextResponse.json({ success: true, appointmentId: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error('Erro na API de Agendamentos:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o agendamento.' }, { status: 500 });
  }
}