import { NextResponse } from 'next/server';
import { db } from '@/firebase';
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
    console.error('Erro ao criar agendamento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}