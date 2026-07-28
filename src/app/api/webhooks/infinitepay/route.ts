import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';

const MASTER_BARBER_ID = 'eUCAkXknM1N0mcC04hCIfF3HcMk1';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK INFINITEPAY RECEBIDO]:', JSON.stringify(body, null, 2));

    // Extracts payload data safely from direct properties or nested data
    const eventData = body.data || body;
    const appointmentId = eventData.order_nsu || eventData.metadata?.appointmentId || eventData.custom_id;
    
    // Validates payment approval status
    const isPaid = 
      eventData.paid === true || 
      eventData.status === 'approved' || 
      eventData.status === 'PAID' || 
      body.event === 'transaction.paid';

    if (!appointmentId) {
      console.warn('[WEBHOOK WARNING] Identificador order_nsu (appointmentId) não encontrado no payload.');
      return NextResponse.json({ message: 'Payload recebido, mas order_nsu ausente.' }, { status: 200 });
    }

    if (isPaid) {
      if (!adminDb) {
        console.error('[WEBHOOK ERROR] Instância do Firebase Admin (adminDb) não inicializada no servidor.');
        return NextResponse.json({ error: 'Erro de infraestrutura interna' }, { status: 500 });
      }

      console.log(`[WEBHOOK SUCCESS] Atualizando agendamento ID: ${appointmentId} para status "confirmado".`);

      const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
      const appointmentSnap = await appointmentRef.get();

      if (!appointmentSnap.exists) {
        console.warn(`[WEBHOOK WARNING] Agendamento ID ${appointmentId} não foi localizado no banco.`);
        return NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 200 });
      }

      const appointmentData = appointmentSnap.data();

      // 1. Atualiza o agendamento no Firestore
      await appointmentRef.update({
        status: 'confirmado',
        paidAt: new Date(),
        updatedAt: new Date()
      });

      // 2. Dispara a notificação de Pagamento Confirmado para o Master Barber
      const clientName = appointmentData?.clientName || 'Cliente';
      const serviceName = appointmentData?.serviceName || 'Serviço';
      const timeStr = appointmentData?.time || '';
      const dateStr = appointmentData?.date ? appointmentData.date.split('-').reverse().join('/') : '';

      await adminDb.collection('notifications').add({
        toId: MASTER_BARBER_ID,
        fromId: appointmentData?.userId || 'system',
        title: '💰 Pagamento Confirmado!',
        message: `${clientName} pagou o agendamento de ${serviceName} (${dateStr} às ${timeStr}).`,
        type: 'payment_confirmed',
        appointmentId: appointmentId,
        read: false,
        createdAt: new Date(),
      });

      return NextResponse.json({ success: true, message: 'Agendamento confirmado e barbeiro notificado.' }, { status: 200 });
    }

    return NextResponse.json({ received: true, message: 'Evento processado sem alteração de status.' }, { status: 200 });

  } catch (error: any) {
    console.error('[WEBHOOK EXCEPTION]:', error);
    return NextResponse.json({ error: 'Erro interno ao processar o webhook.', details: error.message }, { status: 500 });
  }
}