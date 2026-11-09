import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Rota de API: Confirmação e Cancelamento de Agendamentos pelo Barbeiro
 * Recebe o ID do agendamento e a ação ('approve' ou 'cancel'), 
 * atualiza o documento no Firestore e notifica o cliente.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, action = 'approve' } = body;

    // Validação da presença do ID do agendamento
    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento ausente.' }, { status: 400 });
    }

    // Validação do serviço do Firebase Admin no servidor
    if (!adminDb) {
      return NextResponse.json({ error: 'Banco de dados do servidor não disponível.' }, { status: 503 });
    }

    const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      return NextResponse.json({ error: 'Agendamento não localizado no banco de dados.' }, { status: 404 });
    }

    const appointmentData = appointmentSnap.data()!;
    const clientName = appointmentData.userName || appointmentData.clientName || 'Cliente';
    const serviceName = appointmentData.serviceName || 'Serviço';
    const timeStr = appointmentData.time || '';

    let dateStr = '';
    if (appointmentData.date && typeof appointmentData.date === 'string') {
      dateStr = appointmentData.date.split('-').reverse().join('/');
    }

    // TRATAMENTO DA AÇÃO: CANCELAMENTO
    if (action === 'cancel') {
      await appointmentRef.update({
        status: 'cancelado',
        canceledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Notifica o cliente sobre o cancelamento
      if (appointmentData.clientId) {
        await adminDb.collection('notifications').add({
          toId: appointmentData.clientId,
          fromId: 'system',
          title: '❌ Agendamento Cancelado',
          message: `Olá ${clientName}, o agendamento do serviço ${serviceName} para ${dateStr}${timeStr ? ` às ${timeStr}` : ''} foi cancelado pelo barbeiro.`,
          type: 'appointment_canceled',
          appointmentId: appointmentId,
          read: false,
          createdAt: Timestamp.now()
        });
      }

      console.log(`❌ Agendamento ${appointmentId} cancelado pelo barbeiro.`);

      return NextResponse.json({
        success: true,
        message: 'Solicitação cancelada com sucesso.'
      }, { status: 200 });
    }

    // TRATAMENTO DA AÇÃO: CONFIRMAÇÃO / APROVAÇÃO
    await appointmentRef.update({
      status: 'confirmado',
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Notifica o cliente sobre a confirmação do horário
    if (appointmentData.clientId) {
      await adminDb.collection('notifications').add({
        toId: appointmentData.clientId,
        fromId: 'system',
        title: '✅ Agendamento Confirmado!',
        message: `Olá ${clientName}! Seu agendamento de ${serviceName} para ${dateStr}${timeStr ? ` às ${timeStr}` : ''} foi confirmado pelo barbeiro. Esperamos por você! ✂️`,
        type: 'appointment_confirmed',
        appointmentId: appointmentId,
        read: false,
        createdAt: Timestamp.now()
      });
    }

    console.log(`✅ Agendamento ${appointmentId} confirmado com sucesso!`);

    return NextResponse.json({
      success: true,
      message: 'Agendamento confirmado com sucesso! Notificação enviada ao cliente.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[ERRO AO PROCESSAR AGENDAMENTO]:', error);
    return NextResponse.json({
      error: 'Erro interno no servidor ao processar o agendamento.',
      details: error.message
    }, { status: 500 });
  }
}