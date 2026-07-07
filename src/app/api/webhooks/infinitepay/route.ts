import { NextResponse } from 'next/server';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // A API deles retorna order_nsu (que definimos como o ID do documento do Firestore) e se foi pago
    const { order_nsu, paid } = body;

    if (paid && order_nsu) {
      console.log(`[Webhook InfinitePay] Atualizando agendamento ${order_nsu} para confirmado.`);
      
      // Localiza o documento na coleção "appointments" com o ID correspondente
      const appointmentRef = doc(db, "appointments", order_nsu);
      
      // Atualiza o status para 'confirmado'
      await updateDoc(appointmentRef, {
        status: 'confirmado'
      });
    }

    // Retorna status 200 obrigatório exigido pela InfinitePay
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Erro ao processar Webhook da InfinitePay:', error);
    return NextResponse.json({ error: 'Erro no processamento do webhook' }, { status: 400 });
  }
}