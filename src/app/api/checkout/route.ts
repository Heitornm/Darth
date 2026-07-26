import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName, email, clientName, userId } = body;

    // 1. Validação dos campos obrigatórios
    if (!price || !serviceName || !appointmentId) {
      console.warn("[CHECKOUT API WARNING] Campos obrigatórios ausentes:", { price, serviceName, appointmentId });
      return NextResponse.json(
        { 
          error: "Campos obrigatórios ausentes no payload do checkout.",
          received: { price, serviceName, appointmentId, userId }
        },
        { status: 400 }
      );
    }

    // 2. Variáveis de ambiente
    const handle = process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE || "darthbarbers";
    const apiKey = process.env.INFINITEPAY_API_KEY;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://darthbarbers.onrender.com";

    // 3. Integração via API Oficial v2 (se a API Key estiver configurada no Render)
    if (apiKey) {
      try {
        const response = await fetch("https://api.infinitepay.io/v2/transactions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            amount: Math.round(Number(price) * 100), // Em centavos para a API oficial
            description: `Darth Barber - ${serviceName}`,
            order_nsu: appointmentId,
            customer: {
              name: clientName || "Cliente",
              email: email || "cliente@darthbarber.com",
            },
            metadata: {
              appointmentId,
              userId,
            },
            redirect_url: `${baseUrl}/client/appointments?status=success`,
          }),
        });

        if (response.ok) {
          const gatewayData = await response.json();
          const checkoutUrl = gatewayData.checkout_url || gatewayData.url || gatewayData.init_point;

          if (checkoutUrl) {
            return NextResponse.json({
              success: true,
              message: "Checkout gerado via API InfinitePay.",
              checkoutUrl,
            }, { status: 200 });
          }
        } else {
          const errText = await response.text();
          console.error("[INFINITEPAY API ERROR]:", response.status, errText);
        }
      } catch (apiErr) {
        console.error("[INFINITEPAY API FETCH EXCEPTION]:", apiErr);
      }
    }

    // 4. Checkout Direto via Handle (com formatação em Reais ou Link Limpo)
    // Converte o valor para float formatado (ex: R$ 35.00)
    const formattedPrice = Number(price).toFixed(2);
    
    // Formato de link público da InfinitePay com valor e referência do agendamento
    const fallbackCheckoutUrl = `https://infinitepay.io/pay/${handle}/${formattedPrice}?order_nsu=${appointmentId}`;

    console.log("[CHECKOUT API] Redirecionando para:", fallbackCheckoutUrl);

    return NextResponse.json({
      success: true,
      message: "Sessão de checkout gerada com sucesso.",
      checkoutUrl: fallbackCheckoutUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT API EXCEPTION]:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do checkout.", details: error.message },
      { status: 500 }
    );
  }
}