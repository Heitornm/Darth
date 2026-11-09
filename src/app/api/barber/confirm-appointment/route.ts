import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Rota de API: Confirmação e Cancelamento de Agendamentos pelo Barbeiro
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { appointmentId, action = 'approve' } = body;

    // 1. Validação básica de entrada
    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento ausente no payload.' }, { status: 400 });
    }

    // 2. Validação da conexão com o Firestore Admin
    if (!adminDb) {
      console.error('[CONFIRM API ERROR] Instância adminDb indisponível.');
      return NextResponse.json({
        error: 'Instância do Firebase Admin indisponível no servidor. Verifique as credenciais no painel da Vercel.'
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

    // 3. AÇÃO: CANCELAMENTO DE SOLICITAÇÃO
    if (action === 'cancel') {
      await appointmentRef.update({
        status: 'cancelado',
        canceledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // Gravação opcional de notificação ao cliente
      if (appointmentData.clientId) {
        try {
          await adminDb.collection('notifications').add({
            toId: appointmentData.clientId,
            fromId: 'system',
            title: '❌ Agendamento Cancelado',
            message: `Olá ${clientName}, o agendamento de ${serviceName} para ${dateStr}${timeStr ? ` às ${timeStr}` : ''} foi cancelado pelo barbeiro.`,
            type: 'appointment_canceled',
            appointmentId: appointmentId,
            read: false,
            createdAt: Timestamp.now()
          });
        } catch (nErr) {
          console.warn('[CONFIRM API WARNING] Falha ao salvar notificação:', nErr);
        }
      }

      console.log(`❌ Agendamento ${appointmentId} cancelado.`);
      return NextResponse.json({ success: true, message: 'Solicitação cancelada com sucesso.' }, { status: 200 });
    }

    // 4. AÇÃO: CONFIRMAÇÃO DE AGENDAMENTO
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

    console.log(`✅ Agendamento ${appointmentId} confirmado.`);
    return NextResponse.json({ success: true, message: 'Agendamento confirmado com sucesso!' }, { status: 200 });

  } catch (error: any) {
    console.error('[CONFIRM API EXCEPTION]:', error);
    // Devolve o detalhe exato do erro no payload JSON para fácil diagnóstico
    return NextResponse.json({
      error: 'Erro no servidor ao processar agendamento.',
      details: error?.message || String(error)
    }, { status: 500 });
  }
}