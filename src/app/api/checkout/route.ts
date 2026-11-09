import { NextResponse } from "next/server";

/**
 * Rota de API: Checkout InfinitePay
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName } = body;

    // Validação dos campos obrigatórios
    if (!price || !serviceName || !appointmentId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes no payload (appointmentId, price, serviceName)." },
        { status: 400 }
      );
    }

    const handle = process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE || "darthbarbers";
    const apiKey = process.env.INFINITEPAY_API_KEY;

    // 🔍 Sanitização estrita do baseUrl para garantir um URL com HTTPS válido
    let rawBaseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "https://darthbarbers.vercel.app").trim();
    if (!rawBaseUrl.startsWith("http://") && !rawBaseUrl.startsWith("https://")) {
      rawBaseUrl = `https://${rawBaseUrl}`;
    }
    // Remove barra final no final da base URL se houver
    const baseUrl = rawBaseUrl.replace(/\/$/, "");

    // Converte o valor em Reais (BRL) para centavos (ex: R$ 35,00 -> 3500)
    const amountInCents = Math.round(Number(price) * 100);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const redirectUrl = `${baseUrl}/client/appointments?status=success&order_nsu=${appointmentId}`;
    const webhookUrl = `${baseUrl}/api/webhooks/infinitepay`;

    console.log("[CHECKOUT API] URLs configuradas:", { redirectUrl, webhookUrl });

    // Chamada oficial à API de links da InfinitePay
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

    // Se o link foi gerado com sucesso pela InfinitePay
    if (response.ok && (responseData.url || responseData.checkout_url)) {
      const checkoutUrl = responseData.url || responseData.checkout_url;
      console.log("[CHECKOUT API] ✅ Link gerado com sucesso:", checkoutUrl);

      return NextResponse.json({
        success: true,
        checkoutUrl,
      }, { status: 200 });
    }

    // Se a API recusar, loga o erro e usa o fallback
    console.warn("[CHECKOUT API WARNING] Erro ao gerar link dinâmico da InfinitePay:", responseData);

    const fallbackUrl = `https://infinitepay.io/pay/${handle}`;
    return NextResponse.json({
      success: true,
      message: "Redirecionando para o link de pagamento padrão.",
      checkoutUrl: fallbackUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT API EXCEPTION]:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do checkout.", details: error.message },
      { status: 500 }
    );
  }
}