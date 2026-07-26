import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Log para depuração de desenvolvimento
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName, userId } = body;

    // Validação de presença dos campos obrigatórios
    if (!price || !serviceName) {
      return NextResponse.json(
        { 
          error: "Campos obrigatórios ausentes no payload do checkout.",
          received: { price, serviceName, appointmentId, userId }
        },
        { status: 400 }
      );
    }

    // Lógica da criação de sessão ou cobrança
    return NextResponse.json({
      success: true,
      message: "Sessão de checkout gerada com sucesso.",
      checkoutUrl: `/client/checkout/sucesso?id=${appointmentId || 'draft'}`
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT API ERROR]:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do checkout.", details: error.message },
      { status: 500 }
    );
  }
}