// src/app/api/appointments/new/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/firebase/firebase'; // ✅ Caminho correto da árvore!
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const agendamento = {
      ...body,
      createdAt: serverTimestamp(),
      status: 'confirmado'
    };

    const docRef = await addDoc(collection(db, 'appointments'), agendamento);

    return NextResponse.json({
      success: true,
      appointmentId: docRef.id
    });
  } catch (error) {
    console.error('❌ Erro ao criar agendamento:', error);
    // Retorna detalhes do erro para ajudar na depuração
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro interno do servidor' 
      },
      { status: 500 }
    );
  }
}