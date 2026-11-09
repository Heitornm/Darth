import { NextResponse } from "next/server";

/**
 * Rota de API: Checkout InfinitePay
 * Tenta gerar o link de pagamento dinâmico. Se falhar, redireciona o cliente
 * de forma segura para o painel de reservas dentro da própria barbearia.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName } = body;

    // 1. Validação dos campos obrigatórios
    if (!price || !serviceName || !appointmentId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes no payload (appointmentId, price, serviceName)." },
        { status: 400 }
      );
    }

    const handle = process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE || "darthbarbers";
    const apiKey = process.env.INFINITEPAY_API_KEY;

    // 2. Sanitização da URL base (garante HTTPS sem barra no final)
    let rawBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://darthbarbers.vercel.app").trim();
    if (!rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
      rawBaseUrl = `https://${rawBaseUrl}`;
    }
    const baseUrl = rawBaseUrl.replace(/\/$/, "");

    // 3. Converte o valor em Reais para centavos (ex: R$ 35,00 -> 3500)
    const amountInCents = Math.round(Number(price) * 100);

    const redirectUrl = `${baseUrl}/client/appointments?status=success&order_nsu=${appointmentId}`;
    const webhookUrl = `${baseUrl}/api/webhooks/infinitepay`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    console.log("[CHECKOUT API] Enviando requisição para a InfinitePay...", {
      handle,
      redirectUrl,
      webhookUrl,
      amountInCents
    });

    // 4. Chamada à API de links da InfinitePay
    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers,
      body: JSON.stringify({
        handle: handle,
        redirect_url: redirectUrl,
        webhook_url: webhookUrl,
        order_nsu: appointmentId,
        items: [
          {
            quantity: 1,
            price: amountInCents,
            description: `Darth Barber - ${serviceName}`,
          },
        ],
      }),
    });

    const responseData = await response.json();

    // 5. Sucesso: Link dinâmico gerado pela InfinitePay
    if (response.ok && (responseData.url || responseData.checkout_url)) {
      const checkoutUrl = responseData.url || responseData.checkout_url;
      console.log("[CHECKOUT API] ✅ Link dinâmico gerado com sucesso:", checkoutUrl);

      return NextResponse.json({
        success: true,
        checkoutUrl,
      }, { status: 200 });
    }

    // 6. Caso de erro da API: Redireciona para o próprio site da barbearia (evita 404 externo)
    console.warn("[CHECKOUT API WARNING] Não foi possível gerar o link dinâmico:", responseData);

    const safeInternalUrl = `${baseUrl}/client/appointments?status=pending_payment&order_nsu=${appointmentId}`;
    
    return NextResponse.json({
      success: true,
      message: "Agendamento registrado. Redirecionando para suas reservas.",
      checkoutUrl: safeInternalUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT API EXCEPTION]:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do checkout.", details: error.message },
      { status: 500 }
    );
  }
}