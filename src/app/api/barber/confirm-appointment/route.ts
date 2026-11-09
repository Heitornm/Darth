import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Rota de API: Processamento de Confirmações e Cancelamentos (Barbeiro & Cliente)
 * Atualiza os status no Firestore e notifica os envolvidos.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, action = 'approve' } = body;

    // 1. Validação do ID do agendamento
    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento ausente no payload.' }, { status: 400 });
    }

    // 2. Validação da conexão com o Firebase Admin
    if (!adminDb) {
      console.error('[CONFIRM API ERROR] Instância adminDb indisponível.');
      return NextResponse.json({
        error: 'Instância do Firebase Admin indisponível no servidor.'
      }, { status: 503 });
    }

    const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      return NextResponse.json({ error: 'Agendamento não encontrado no banco de dados.' }, { status: 404 });
    }

    const appointmentData = appointmentSnap.data() || {};
    const clientName = appointmentData.userName || appointmentData.clientName || 'Cliente';
    const serviceName = appointmentData.serviceName || 'Serviço';
    const timeStr = appointmentData.time || '';

    let dateStr = '';
    if (appointmentData.date && typeof appointmentData.date === 'string') {
      dateStr = appointmentData.date.split('-').reverse().join('/');
    }

    // 3. AÇÃO: SOLICITAÇÃO DE CANCELAMENTO ENVIADA PELO CLIENTE
    if (action === 'request_cancel') {
      await appointmentRef.update({
        status: 'solicitado_cancelamento',
        updatedAt: Timestamp.now()
      });

      // Notifica o barbeiro sobre a solicitação do cliente
      if (appointmentData.barberId) {
        try {
          await adminDb.collection('notifications').add({
            toId: appointmentData.barberId,
            fromId: appointmentData.clientId || 'system',
            title: '⚠️ Solicitação de Cancelamento',
            message: `O cliente ${clientName} solicitou o cancelamento do agendamento de ${serviceName} do dia ${dateStr} às ${timeStr}.`,
            type: 'cancellation_request',
            appointmentId: appointmentId,
            read: false,
            createdAt: Timestamp.now()
          });
        } catch (nErr) {
          console.warn('[CONFIRM API WARNING] Falha ao enviar notificação ao barbeiro:', nErr);
        }
      }

      console.log(`⚠️ Solicitação de cancelamento gravada para o agendamento ${appointmentId}.`);
      return NextResponse.json({ success: true, message: 'Solicitação de cancelamento registrada com sucesso.' }, { status: 200 });
    }

    // 4. AÇÃO: CANCELAMENTO DEFINITIVO (EFETUADO PELO BARBEIRO OU APROVAÇÃO DE CANCELAMENTO)
    // REQUISITO 4: O status 'cancelado' faz as rotas /slots e getBookedSlotsByDate liberarem a agenda imediatamente
    if (action === 'cancel' || action === 'approve_cancel') {
      await appointmentRef.update({
        status: 'cancelado',
        canceledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      if (appointmentData.clientId) {
        try {
          await adminDb.collection('notifications').add({
            toId: appointmentData.clientId,
            fromId: 'system',
            title: '❌ Agendamento Cancelado',
            message: `Olá ${clientName}, o agendamento de ${serviceName} para ${dateStr}${timeStr ? ` às ${timeStr}` : ''} foi cancelado e a vaga foi liberada na agenda.`,
            type: 'appointment_canceled',
            appointmentId: appointmentId,
            read: false,
            createdAt: Timestamp.now()
          });
        } catch (nErr) {
          console.warn('[CONFIRM API WARNING] Falha ao salvar notificação:', nErr);
        }
      }

      console.log(`❌ Agendamento ${appointmentId} alterado para cancelado (agenda liberada).`);
      return NextResponse.json({ success: true, message: 'Agendamento cancelado com sucesso e agenda liberada.' }, { status: 200 });
    }

    // 5. AÇÃO: CONFIRMAÇÃO DE AGENDAMENTO PELO BARBEIRO
    await appointmentRef.update({
      status: 'confirmado',
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

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
      } catch (nErr) {
        console.warn('[CONFIRM API WARNING] Falha ao salvar notificação:', nErr);
      }
    }

    console.log(`✅ Agendamento ${appointmentId} confirmado pelo barbeiro.`);
    return NextResponse.json({ success: true, message: 'Agendamento confirmado com sucesso!' }, { status: 200 });

  } catch (error: any) {
    console.error('[CONFIRM API EXCEPTION]:', error);
    return NextResponse.json({
      error: 'Erro no servidor ao processar agendamento.',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}