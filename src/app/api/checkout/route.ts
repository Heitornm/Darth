import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName, userId } = body;

    if (!price || !serviceName || !appointmentId) {
      return NextResponse.json(
        { 
          error: "Campos obrigatórios ausentes no payload do checkout.",
          received: { price, serviceName, appointmentId, userId }
        },
        { status: 400 }
      );
    }

    // Integração com gateway de pagamento enviando appointmentId como referência da ordem
    const checkoutUrl = `/client/appointments?status=success&id=${appointmentId}`;

    return NextResponse.json({
      success: true,
      message: "Sessão de checkout gerada com sucesso.",
      checkoutUrl
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT API ERROR]:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do checkout.", details: error.message },
      { status: 500 }
    );
  }
}