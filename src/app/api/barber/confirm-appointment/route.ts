import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Rota de API: Confirmação e Cancelamento de Agendamentos pelo Barbeiro
 * Atualiza o status do agendamento no Firestore e envia notificação de forma segura.
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
      console.error('[CONFIRM API ERROR] Instância do adminDb não inicializada no servidor.');
      return NextResponse.json({ 
        error: 'Serviço do Firebase Admin indisponível no servidor. Verifique as variáveis de ambiente na Vercel.' 
      }, { status: 503 });
    }

    const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      return NextResponse.json({ error: 'Agendamento não localizado no banco de dados.' }, { status: 404 });
    }

    const appointmentData = appointmentSnap.data() || {};
    const clientName = appointmentData.userName || appointmentData.clientName || 'Cliente';
    const serviceName = appointmentData.serviceName || 'Serviço';
    const timeStr = appointmentData.time || '';
    
    let dateStr = '';
    if (appointmentData.date && typeof appointmentData.date === 'string') {
      dateStr = appointmentData.date.split('-').reverse().join('/');
    }

    // AÇÃO: CANCELAMENTO
    if (action === 'cancel') {
      await appointmentRef.update({
        status: 'cancelado',
        canceledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Tenta enviar notificação se houver ID de cliente válido
      if (appointmentData.clientId) {
        try {
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
        } catch (notifErr) {
          console.warn('[CONFIRM API WARNING] Não foi possível enviar notificação de cancelamento:', notifErr);
        }
      }

      console.log(`❌ Agendamento ${appointmentId} cancelado pelo barbeiro.`);

      return NextResponse.json({ 
        success: true, 
        message: 'Solicitação cancelada com sucesso.' 
      }, { status: 200 });
    }

    // AÇÃO: CONFIRMAÇÃO / APROVAÇÃO
    await appointmentRef.update({
      status: 'confirmado',
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Tenta enviar notificação se houver ID de cliente válido
    if (appointmentData.clientId) {
      try {
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
      } catch (notifErr) {
        console.warn('[CONFIRM API WARNING] Não foi possível enviar notificação de confirmação:', notifErr);
      }
    }

    console.log(`✅ Agendamento ${appointmentId} confirmado com sucesso!`);

    return NextResponse.json({ 
      success: true, 
      message: 'Agendamento confirmado com sucesso!' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[CONFIRM API EXCEPTION]:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar o agendamento no servidor.', 
      details: error?.message || String(error)
    }, { status: 500 });
  }
}