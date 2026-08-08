import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    // Proteção para o ambiente de build
    if (!adminDb) {
      console.warn("⚠️ Firebase Admin não está inicializado. Ignorando durante o build.");
      return NextResponse.json({ error: 'Serviço temporariamente indisponível' }, { status: 503 });
    }

    const db = adminDb;

    const body = await request.json();
    const { 
      clientId, 
      userName, 
      userEmail, 
      serviceId, 
      serviceName, 
      price, 
      date, // Formato "YYYY-MM-DD"
      time, // Formato "HH:mm"
      durationMinutes = 30,
      barberId = 'barbeiro1'
    } = body;

    // 1. Validação de campos obrigatórios
    if (!clientId || !date || !time || !serviceId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    // Cria os objetos de data/hora para comparação precisa
    const appointmentDate = new Date(`${date}T${time}:00`);
    const appointmentTimestamp = Timestamp.fromDate(appointmentDate);

    let createdAppointmentId = '';

    // 2. Transação Atômica: Garante que NINGUÉM ocupe o horário ao mesmo tempo
    await adminDb.runTransaction(async (transaction) => {
      const appointmentsRef = db.collection('appointments');

      // Busca agendamentos para a mesma data simples ou por campo dataHora
      const snapshot = await transaction.get(
        appointmentsRef
          .where('date', '==', date)
          .where('barberId', '==', barberId)
      );

      const now = new Date();
      const TEN_MINUTES_MS = 10 * 60 * 1000;

      // Verifica se existe algum agendamento conflitante no mesmo horário
      const hasConflict = snapshot.docs.some(doc => {
        const data = doc.data();
        const status = data.status;

        // Ignora cancelados
        if (status === 'cancelado' || status === 'canceled') {
          return false;
        }

        // Se for pendente, checa se caducou (mais de 10 min atrás)
        if (status === 'pending' || status === 'pendente') {
          const createdAt = data.createdAt?.toDate 
            ? data.createdAt.toDate() 
            : new Date(data.createdAt || Date.now());

          if (now.getTime() - createdAt.getTime() > TEN_MINUTES_MS) {
            return false; // Expirou, horário está livre!
          }
        }

        // Se bater exatamente no mesmo horário do barbeiro
        return data.time === time;
      });

      if (hasConflict) {
        throw new Error('SLOT_OCCUPIED');
      }

      // 3. Gravação segura dentro da transação
      const newDocRef = appointmentsRef.doc();
      createdAppointmentId = newDocRef.id;

      transaction.set(newDocRef, {
        clientId,
        userName,
        userEmail,
        serviceId,
        serviceName,
        price: Number(price),
        date,
        time,
        dataHora: appointmentTimestamp, // Mantém compatibilidade com o frontend
        durationMinutes: Number(durationMinutes),
        barberId,
        status: 'pending',
        createdAt: Timestamp.fromDate(now),
      });
    });

    return NextResponse.json(
      { success: true, appointmentId: createdAppointmentId }, 
      { status: 201 }
    );

  } catch (error: any) {
    if (error.message === 'SLOT_OCCUPIED') {
      return NextResponse.json(
        { error: 'Este horário acabou de ser preenchido por outro cliente. Por favor, escolha outro horário.' }, 
        { status: 409 }
      );
    }

    console.error('Erro na API de Agendamentos:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o agendamento.' }, { status: 500 });
  }
}