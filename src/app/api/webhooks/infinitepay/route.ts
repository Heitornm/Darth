import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

// UIDs reais dos Barbeiros Master/Proprietários cadastrados no Firebase Auth
const BARBER_UIDS = [
  process.env.NEXT_PUBLIC_BARBER_OWNER_ID,
  '2cAVs3U9ciV3NiqApJuOlYGEJS32',
  'eUCAkXknM1N0mcC04hCIfF3HcMk1'
].filter(Boolean) as string[];

/**
 * Webhook de Recebimento de Notificações da InfinitePay
 * Executado quando um pagamento PIX/Cartão é concluído ou alterado.
 * Atualiza o status do agendamento no Firestore para 'aguardando_barbeiro' e envia notificação.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK INFINITEPAY RECEBIDO]:', JSON.stringify(body, null, 2));

    // Normalização dos dados recebidos
    const eventData = body.data || body;
    const appointmentId =
      body.order_nsu ||
      eventData.order_nsu ||
      eventData.metadata?.appointmentId ||
      eventData.custom_id;

    // Avalia múltiplos sinalizadores de confirmação de pagamento da InfinitePay
    const isPaid =
      body.paid === true ||
      eventData.paid === true ||
      eventData.status === 'approved' ||
      eventData.status === 'PAID' ||
      body.event === 'transaction.paid' ||
      (body.paid_amount && body.paid_amount > 0);

    if (!appointmentId) {
      console.warn('[WEBHOOK WARNING] Identificador order_nsu (appointmentId) não encontrado no payload.');
      return NextResponse.json({ message: 'Payload recebido, mas order_nsu ausente.' }, { status: 200 });
    }

    if (isPaid) {
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

      // 1. Atualização do Status para 'aguardando_barbeiro'
      await appointmentRef.update({
        status: 'aguardando_barbeiro',
        paid: true,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      console.log(`✅ Pagamento confirmado e agendamento atualizado para 'aguardando_barbeiro': ${appointmentId}`);

      // 2. Formatação das informações para o texto da notificação
      const clientName = appointmentData?.userName || appointmentData?.clientName || 'Cliente';
      const serviceName = appointmentData?.serviceName || 'Serviço';
      const timeStr = appointmentData?.time || '';

      let dateStr = '';
      if (appointmentData?.date && typeof appointmentData.date === 'string') {
        dateStr = appointmentData.date.split('-').reverse().join('/');
      }

      const batch = adminDb.batch();

      // 3. Notifica TODOS os barbeiros administradores com o UID real
      BARBER_UIDS.forEach((barberUid) => {
        const notifRef = adminDb.collection('notifications').doc();
        batch.set(notifRef, {
          toId: barberUid,
          fromId: appointmentData?.clientId || 'system',
          title: '💰 Pagamento Confirmado!',
          message: `${clientName} pagou o agendamento de ${serviceName}${dateStr ? ` (${dateStr}${timeStr ? ` às ${timeStr}` : ''})` : ''}. Aguardando sua confirmação.`,
          type: 'payment_confirmed',
          appointmentId: appointmentId,
          read: false,
          createdAt: Timestamp.now(),
        });
      });

      // 4. Notifica também o próprio cliente sobre o recebimento do pagamento
      if (appointmentData?.clientId) {
        const clientNotifRef = adminDb.collection('notifications').doc();
        batch.set(clientNotifRef, {
          toId: appointmentData.clientId,
          fromId: 'system',
          title: '✅ Pagamento Recebido',
          message: `Seu pagamento para ${serviceName} em ${dateStr} às ${timeStr} foi confirmado! O barbeiro irá revisar o horário.`,
          type: 'payment_received_client',
          appointmentId: appointmentId,
          read: false,
          createdAt: Timestamp.now(),
        });
      }

      await batch.commit();

      return NextResponse.json({
        success: true,
        message: 'Pagamento confirmado e notificações enviadas ao barbeiro e cliente.'
      }, { status: 200 });
    }

    return NextResponse.json({ received: true, message: 'Evento recebido sem alteração de status.' }, { status: 200 });
  } catch (error: any) {
    console.error('[WEBHOOK EXCEPTION]:', error);
    return NextResponse.json({ error: 'Erro interno no processamento do webhook.', details: error.message }, { status: 500 });
  }
}