import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName, email, clientName, userId } = body;

    if (!price || !serviceName || !appointmentId) {
      return NextResponse.json(
        { 
          error: "Campos obrigatórios ausentes no payload do checkout.",
          received: { price, serviceName, appointmentId, userId }
        },
        { status: 400 }
      );
    }

    // Chamada oficial ao Gateway InfinitePay para criar a Link de Pagamento / Checkout
    const response = await fetch("https://api.infinitepay.io/v2/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.INFINITEPAY_API_KEY}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(price) * 100), // Valor em centavos (ex: 1.00 -> 100)
        description: `Darth Barber - ${serviceName}`,
        order_nsu: appointmentId, // Vincula o ID do agendamento ao webhook
        customer: {
          name: clientName || "Cliente",
          email: email || "cliente@darthbarber.com",
        },
        metadata: {
          appointmentId: appointmentId,
          userId: userId,
        },
        redirect_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://darthbarbers.onrender.com'}/client/appointments?status=success`,
      }),
    });

    const gatewayData = await response.json();

    if (!response.ok) {
      console.error("[INFINITEPAY ERROR]", gatewayData);
      throw new Error(gatewayData.message || "Erro ao gerar cobrança no gateway.");
    }

    // Pega a URL do Checkout gerada pelo gateway (checkout_url, url ou init_point)
    const checkoutUrl = gatewayData.checkout_url || gatewayData.url || gatewayData.init_point;

    return NextResponse.json({
      success: true,
      message: "Sessão de checkout gerada com sucesso.",
      checkoutUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT API ERROR]:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do checkout.", details: error.message },
      { status: 500 }
    );
  }
}