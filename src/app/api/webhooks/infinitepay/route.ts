import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK INFINITEPAY RECEBIDO]:', JSON.stringify(body, null, 2));

    // Extrai o order_nsu de todas as variações conhecidas do payload da InfinitePay
    const eventData = body.data || body;
    const appointmentId = 
      body.order_nsu || 
      eventData.order_nsu || 
      eventData.metadata?.appointmentId || 
      eventData.custom_id;

    // A InfinitePay envia paid: true ou invoice_slug / status / paid_amount
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
        console.error('[WEBHOOK ERROR] Instância do Firebase Admin (adminDb) não inicializada no servidor.');
        return NextResponse.json({ error: 'Erro de infraestrutura interna' }, { status: 503 });
      }

      console.log(`[WEBHOOK SUCCESS] Atualizando agendamento ID: ${appointmentId} para status "confirmado".`);

      const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
      const appointmentSnap = await appointmentRef.get();

      if (!appointmentSnap.exists) {
        console.warn(`[WEBHOOK WARNING] Agendamento ID ${appointmentId} não foi localizado no banco.`);
        return NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 200 });
      }

      const appointmentData = appointmentSnap.data();

      // 1. Atualiza o status do agendamento para "confirmado"
      await appointmentRef.update({
        status: 'confirmado',
        paid: true,
        paidAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      // 2. Formata informações para a notificação
      const clientName = appointmentData?.userName || appointmentData?.clientName || 'Cliente';
      const serviceName = appointmentData?.serviceName || 'Serviço';
      const timeStr = appointmentData?.time || '';
      
      let dateStr = '';
      if (appointmentData?.date && typeof appointmentData.date === 'string') {
        dateStr = appointmentData.date.split('-').reverse().join('/');
      }

      // 3. Notifica o Master Barber
      await adminDb.collection('notifications').add({
        toId: MASTER_BARBER_ID,
        fromId: appointmentData?.clientId || appointmentData?.userId || 'system',
        title: '💰 Pagamento Confirmado!',
        message: `${clientName} pagou o agendamento de ${serviceName}${dateStr ? ` (${dateStr}${timeStr ? ` às ${timeStr}` : ''})` : ''}.`,
        type: 'payment_confirmed',
        appointmentId: appointmentId,
        read: false,
        createdAt: Timestamp.now(),
      });

      return NextResponse.json({ success: true, message: 'Agendamento confirmado com sucesso!' }, { status: 200 });
    }

    return NextResponse.json({ received: true, message: 'Evento recebido sem alteração de status.' }, { status: 200 });

  } catch (error: any) {
    console.error('[WEBHOOK EXCEPTION]:', error);
    return NextResponse.json({ error: 'Erro interno no webhook.', details: error.message }, { status: 500 });
  }
}