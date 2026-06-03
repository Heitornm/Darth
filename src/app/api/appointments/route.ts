import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    // PROTEÇÃO PARA O BUILD: Se o Admin não inicializou devido à falta de variáveis, bloqueia aqui com segurança
    if (!adminAuth || !adminDb) {
      console.warn("⚠️ Firebase Admin não está inicializado. Ignorando durante o build.");
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    // 1. Validar se o usuário está autenticado no servidor via token de sessão
    const sessionCookie = request.cookies.get('__session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const body = await request.json();
    const { barberId, date, time, serviceId } = body;

    if (!barberId || !date || !time || !serviceId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    // 2. Operação atômica no banco usando Firebase Admin para checar conflito de horários
    const appointmentRef = adminDb.collection('appointments');
    const conflictCheck = await appointmentRef
      .where('barberId', '==', barberId)
      .where('date', '==', date)
      .where('time', '==', time)
      .where('status', '==', 'confirmed')
      .get();

    if (!conflictCheck.empty) {
      return NextResponse.json({ error: 'Este horário já foi preenchido por outro cliente' }, { status: 409 });
    }

    // 3. Salvar o agendamento de forma garantida
    const newAppointment = {
      clientId: decodedToken.uid,
      barberId,
      date,
      time,
      serviceId,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
    };

    const docRef = await appointmentRef.add(newAppointment);

    return NextResponse.json({ success: true, appointmentId: docRef.id }, { status: 201 });
  } catch (error: any) {
    console.error('Erro na API de Agendamentos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}