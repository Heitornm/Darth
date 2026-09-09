import { NextResponse, type NextRequest } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const barberId = searchParams.get('barberId');

    if (!date || !barberId) {
      return NextResponse.json({ error: 'Parâmetros faltando' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ occupiedSlots: [] }, { status: 200 });
    }

    const snapshot = await adminDb
      .collection('appointments')
      .where('date', '==', date)
      .where('barberId', '==', barberId)
      .get();

    const occupiedSlots = snapshot.docs
      .filter(doc => {
        const status = doc.data().status;
        return status !== 'cancelado' && status !== 'canceled';
      })
      .map(doc => doc.data().time);

    // ✅ NOME EXATO que o frontend espera: occupiedSlots
    return NextResponse.json({ occupiedSlots }, { status: 200 });

  } catch (err) {
    console.error('Erro em /slots:', err);
    return NextResponse.json({ occupiedSlots: [] }, { status: 200 });
  }
}