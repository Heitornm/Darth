import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

export async function POST(request: Request) {
  try {
    const { appointmentId } = await request.json();
    
    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento ausente.' }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Banco de dados não disponível.' }, { status: 503 });
    }

    const appointmentRef = adminDb.collection('appointments').doc(appointmentId);
    const appointmentSnap = await appointmentRef.get();

    if (!appointmentSnap.exists) {
      return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 });
    }

    // ✅ CORREÇÃO: Usamos .data() com garantia de definição
    const appointmentData = appointmentSnap.data()!; // O "!" avisa o TypeScript que existe
    const statusAtual = appointmentData.status;

    // ✅ SÓ pode confirmar se estiver "aguardando_barbeiro"
    if (statusAtual !== 'aguardando_barbeiro') {
      return NextResponse.json(
        { 
          error: `Só é possível confirmar agendamentos que estão "Aguardando Confirmação". Status atual: ${statusAtual}` 
        }, 
        { status: 400 }
      );
    }

    // ✅ Atualiza status para CONFIRMADO
    await appointmentRef.update({
      status: 'confirmado',
      confirmedAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // 📋 Formata data para notificação
    const clientName = appointmentData.userName || appointmentData.clientName || 'Cliente';
    const serviceName = appointmentData.serviceName || 'Serviço';
    const timeStr = appointmentData.time || '';
    let dateStr = '';
    if (appointmentData.date && typeof appointmentData.date === 'string') {
      dateStr = appointmentData.date.split('-').reverse().join('/');
    }

    // 🔔 Notifica o cliente que o agendamento foi confirmado
    await adminDb.collection('notifications').add({
      toId: appointmentData.clientId,
      fromId: 'system',
      title: '✅ Agendamento Confirmado!',
      message: `Olá ${clientName}! Seu agendamento de ${serviceName} para ${dateStr}${timeStr ? ` às ${timeStr}` : ''} foi confirmado pelo barbeiro. Esperamos por você! ✂️`,
      type: 'appointment_confirmed',
      appointmentId: appointmentId,
      read: false,
      createdAt: Timestamp.now()
    });

    console.log(`✅ Agendamento ${appointmentId} confirmado com sucesso!`);

    return NextResponse.json({ 
      success: true, 
      message: 'Agendamento confirmado com sucesso! Notificação enviada ao cliente.' 
    }, { status: 200 });

  } catch (error: any) {
    console.error('[ERRO AO CONFIRMAR AGENDAMENTO]:', error);
    return NextResponse.json({ 
      error: 'Erro interno ao confirmar.', 
      details: error.message 
    }, { status: 500 });
  }
}