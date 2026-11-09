import { NextResponse } from 'next/server';
import { adminDb } from '@/firebase/firebaseAdmin';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Lista dos UIDs de barbeiros autorizados na plataforma.
 * Garante que notificações e atribuições de agendamentos cheguem aos destinatários corretos.
 */
const BARBER_UIDS = [
  '2cAVs3U9ciV3NiqApJuOlYGEJS32',
  'eUCAkXknM1N0mcC04hCIfF3HcMk1',
  'wWlt2ixyjwfLqDHDQFFNQgaYfCT2'
];

/**
 * Rota API para criação de um novo agendamento.
 * Método: POST /api/appointments/new
 */
export async function POST(request: Request) {
  try {
    // 1. Decodifica o corpo da requisição JSON
    const body = await request.json();
    console.log('[NEW APPOINTMENT API] Dados recebidos no servidor:', body);

    const {
      clientId,
      userName,
      userEmail,
      serviceId,
      serviceName,
      price,
      date,
      time,
      durationMinutes,
      // Define o UID padrão do barbeiro principal caso não seja enviado pelo cliente
      barberId = '2cAVs3U9ciV3NiqApJuOlYGEJS32',
    } = body;

    // 2. Validação dos campos obrigatórios para integridade do banco de dados
    if (!serviceName || price === undefined || !date || !time) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: serviceName, price, date e time são necessários.' },
        { status: 400 }
      );
    }

    // 3. Verifica se a instância do Firebase Admin SDK está online
    if (!adminDb) {
      console.error('[NEW APPOINTMENT API ERROR] Instância adminDb não foi inicializada no servidor.');
      return NextResponse.json(
        { error: 'Serviço do Firebase Admin indisponível no servidor.' },
        { status: 503 }
      );
    }

    // 4. Estrutura o objeto de agendamento que será armazenado na coleção 'appointments'
    const newAppointment = {
      clientId: clientId || 'anonimo',
      userName: userName || 'Cliente sem Nome',
      userEmail: userEmail || '',
      serviceId: serviceId || '',
      serviceName,
      price: Number(price),
      date,
      time,
      durationMinutes: Number(durationMinutes) || 30,
      barberId,
      // Status inicial padronizado para aguardar a aprovação do barbeiro ou fluxo de pagamento
      status: 'aguardando_barbeiro',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // 5. Salva o agendamento no Firestore
    const docRef = await adminDb.collection('appointments').add(newAppointment);
    const appointmentId = docRef.id;

    // 6. Cria em lote (batch) notificações individuais no Firestore para todos os barbeiros
    const batch = adminDb.batch();

    BARBER_UIDS.forEach((toUid) => {
      const notificationRef = adminDb.collection('notifications').doc();
      batch.set(notificationRef, {
        toId: toUid,
        title: '✂️ Novo Agendamento Solicitado',
        message: `${userName || 'Um cliente'} agendou ${serviceName} para o dia ${date} às ${time}.`,
        appointmentId: appointmentId,
        read: false,
        createdAt: Timestamp.now(),
        type: 'new_appointment'
      });
    });

    // Executa a gravação em lote no Firestore
    await batch.commit();

    console.log(`[NEW APPOINTMENT API] ✅ Agendamento (ID: ${appointmentId}) e notificações registrados com sucesso.`);

    // 7. Retorna resposta HTTP 200 com os dados do agendamento criado
    return NextResponse.json({
      success: true,
      appointmentId,
      message: 'Agendamento e notificação registrados com sucesso.',
    }, { status: 200 });

  } catch (error: any) {
    console.error('[NEW APPOINTMENT API EXCEPTION]: Exceção não tratada:', error);
    return NextResponse.json({
      error: 'Erro interno no servidor ao criar o agendamento.',
      details: error?.message || String(error),
    }, { status: 500 });
  }
}