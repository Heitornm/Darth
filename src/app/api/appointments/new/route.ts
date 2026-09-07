import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    console.log("[AGENDAMENTO] Iniciando...");

    // ✅ Verifica se adminDb está disponível
    if (!adminDb) {
      throw new Error("Banco de dados não inicializado. Verifique as variáveis de ambiente.");
    }

    const body = await request.json();
    console.log("[AGENDAMENTO] Dados recebidos:", body);

    const agendamento = {
      ...body,
      createdAt: Timestamp.now(),
      status: 'pagamento_aprovado'
    };

    const docRef = await adminDb.collection('appointments').add(agendamento);
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