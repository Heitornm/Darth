import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName } = body;

    if (!price || !serviceName || !appointmentId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes no payload (appointmentId, price, serviceName)." },
        { status: 400 }
      );
    }

    // Handle da InfinitePay (darthbarbers)
    const handle = process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE || "darthbarbers";
    const apiKey = process.env.INFINITEPAY_API_KEY;

    // Sanitização para garantir URL externa absoluta com HTTPS válido
    let envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "darthbarbers.vercel.app";
    const cleanDomain = envBaseUrl
      .replace(/[\[\]\(\)]/g, "")
      .trim()
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");

    const absoluteBaseUrl = `https://${cleanDomain}`;

    const amountInCents = Math.round(Number(price) * 100);
    const redirectUrl = `${absoluteBaseUrl}/client/appointments?status=success&order_nsu=${appointmentId}`;
    const webhookUrl = `${absoluteBaseUrl}/api/webhooks/infinitepay`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // 1. Tenta gerar o link dinâmico via API oficial da InfinitePay
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

    if (response.ok && (responseData.url || responseData.checkout_url)) {
      const checkoutUrl = responseData.url || responseData.checkout_url;
      console.log("[CHECKOUT API] ✅ Link dinâmico gerado:", checkoutUrl);

      return NextResponse.json({
        success: true,
        checkoutUrl,
      }, { status: 200 });
    }

    console.warn("[CHECKOUT API WARNING] Não foi possível gerar o link dinâmico. Redirecionando para fallback:", responseData);

    // 2. Fallback Seguro: Se a API falhar, redireciona para a rota relativa INTERNA da aplicação
    // (Sem prefixo https:// para evitar concatenação dupla no router.push do Next.js)
    const relativeInternalUrl = `/client/appointments?status=pending_payment&order_nsu=${appointmentId}`;
    
    return NextResponse.json({
      success: true,
      message: "Agendamento registrado. Redirecionando para suas reservas.",
      checkoutUrl: relativeInternalUrl,
    }, { status: 200 });

  } catch (error: any) {
    console.error("[CHECKOUT API EXCEPTION]:", error);
    return NextResponse.json(
      { error: "Erro interno no processamento do checkout.", details: error.message },
      { status: 500 }
    );
  }
}