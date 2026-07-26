import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[Webhook InfinitePay Recebido]:', body);

    // Mapeamento flexível de dados vindos da InfinitePay
    const appointmentId = body.order_nsu || body.metadata?.appointmentId || body.custom_id;
    const isPaid = body.paid || body.status === 'approved' || body.status === 'PAID';

    if (isPaid && appointmentId) {
      if (!adminDb) {
        console.error('[Webhook Error] Instância do Firebase Admin (adminDb) não inicializada.');
        return NextResponse.json({ error: 'Erro de infraestrutura interna' }, { status: 500 });
      }

      console.log(`[Webhook InfinitePay] Atualizando agendamento ${appointmentId} para confirmado.`);

      const appointmentRef = adminDb.collection('appointments').doc(appointmentId);

      await appointmentRef.update({
        status: 'confirmado',
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error: any) {
    console.error('Erro ao processar Webhook:', error);
    return NextResponse.json({ error: 'Erro no processamento do webhook' }, { status: 400 });
  }
}