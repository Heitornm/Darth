import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// ID do Barbeiro Proprietário para recebimento de notificações no painel administrativo
const BARBER_OWNER_ID = process.env.NEXT_PUBLIC_BARBER_OWNER_ID || 'barbeiro1';

/**
 * Webhook de Recebimento de Notificações da InfinitePay
 * Executado quando um pagamento PIX/Cartão é concluído ou alterado.
 * Atualiza o status do agendamento no Firestore para 'aguardando_barbeiro' e envia notificação.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK INFINITEPAY RECEBIDO]:', JSON.stringify(body, null, 2));

    // Normalização dos dados recebidos (suporta múltiplos formatos de payload enviados pela InfinitePay)
    const eventData = body.data || body;
    const appointmentId =
      body.order_nsu ||
      eventData.order_nsu ||
      eventData.metadata?.appointmentId ||
      eventData.custom_id;

    // Avalia múltiplos sinalizadores de confirmação de pagamento
    const isPaid =
      body.paid === true ||
      eventData.paid === true ||
      eventData.status === 'approved' ||
      eventData.status === 'PAID' ||
      body.event === 'transaction.paid' ||
      (body.paid_amount && body.paid_amount > 0);

    // Se não encontrou o ID do agendamento no payload, encerra com aviso sem estourar erro
    if (!appointmentId) {
      console.warn('[WEBHOOK WARNING] Identificador order_nsu (appointmentId) não encontrado no payload.');
      return NextResponse.json({ message: 'Payload recebido, mas order_nsu ausente.' }, { status: 200 });
    }

    if (isPaid) {
      // Valida se a instância Admin do Firestore no lado do servidor está acessível
      if (!adminDb) {
        console.error('[WEBHOOK ERROR] Instância do Firebase Admin (adminDb) não inicializada.');
        return NextResponse.json({ error: 'Erro de infraestrutura no servidor' }, { status: 503 });
      }

      console.log(`[WEBHOOK SUCCESS] Processando confirmação de pagamento para o agendamento ID: ${appointmentId}`);

      const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
      const appointmentSnap = await appointmentRef.get();

      if (!appointmentSnap.exists) {
        console.warn(`[WEBHOOK WARNING] Agendamento ID ${appointmentId} não foi localizado no banco de dados.`);
        return NextResponse.json({ message: 'Agendamento não encontrado no sistema.' }, { status: 200 });
      }

      const appointmentData = appointmentSnap.data();

      // ATUALIZAÇÃO ATÔMICA: Atualiza o status para pago e em seguida aguardando confirmação do barbeiro
      await appointmentRef.update({
        status: 'aguardando_barbeiro',
        paid: true,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Pagamento confirmado e agendamento atualizado para 'aguardando_barbeiro': ${appointmentId}`);

      // Formatação dos dados do cliente e horário para exibir na notificação do barbeiro
      const clientName = appointmentData?.userName || appointmentData?.clientName || 'Cliente';
      const serviceName = appointmentData?.serviceName || 'Serviço';
      const timeStr = appointmentData?.time || '';

      let dateStr = '';
      if (appointmentData?.date && typeof appointmentData.date === 'string') {
        dateStr = appointmentData.date.split('-').reverse().join('/');
      }

      // Cria a notificação de pagamento recebido para o Barbeiro Proprietário
      await adminDb.collection('notifications').add({
        toId: BARBER_OWNER_ID,
        fromId: appointmentData?.clientId || appointmentData?.userId || 'system',
        title: '💰 Pagamento Confirmado!',
        message: `${clientName} pagou o agendamento de ${serviceName}${dateStr ? ` (${dateStr}${timeStr ? ` às ${timeStr}` : ''})` : ''}. Aguardando sua confirmação.`,
        type: 'payment_confirmed',
        appointmentId: appointmentId,
        read: false,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({
        success: true,
        message: 'Pagamento confirmado e notificação enviada ao barbeiro.'
      }, { status: 200 });
    }

    return NextResponse.json({ received: true, message: 'Evento recebido sem alteração de status.' }, { status: 200 });
  } catch (error: any) {
    console.error('[WEBHOOK EXCEPTION]:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do webhook.', details: error.message }, { status: 500 });
  }
}