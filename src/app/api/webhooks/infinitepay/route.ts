import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Captura os dados da notificação de pagamento do gateway (order_nsu representa o appointmentId)
    const { order_nsu, paid } = body;

    if (paid && order_nsu) {
      if (!adminDb) {
        console.error('[Webhook Error] Instância do Firebase Admin (adminDb) não inicializada.');
        return NextResponse.json({ error: 'Erro de infraestrutura interna' }, { status: 500 });
      }

      console.log(`[Webhook InfinitePay] Atualizando agendamento ${order_nsu} para confirmado.`);
      
      const appointmentRef = adminDb.collection('appointments').doc(order_nsu);
      
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