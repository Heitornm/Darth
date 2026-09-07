import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("[AGENDAMENTO] Dados recebidos:", body);

    const agendamento = {
      ...body,
      createdAt: serverTimestamp(),
      status: 'pagamento_aprovado'
    };

    const docRef = await addDoc(collection(db, 'appointments'), agendamento);
    console.log("[AGENDAMENTO] ✅ CRIADO! ID:", docRef.id, "Status: pagamento_aprovado");

    return NextResponse.json({
      success: true,
      appointmentId: docRef.id
    });
  } catch (error: any) {
    console.error("[AGENDAMENTO] ❌ ERRO:", error.message);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erro ao salvar agendamento'
      },
      { status: 500 }
    );
  }
}