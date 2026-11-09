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

    // 🔴 ALTERE AQUI: insira a sua nova tag/handle da InfinitePay no fallback
    const handle = process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE || "SUA_NOVA_TAG_AQUI";
    const apiKey = process.env.INFINITEPAY_API_KEY;

    // 🔍 Sanitização estrita para EVITAR duplicar "https://"
    let envBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://darthbarbers.vercel.app";
    envBaseUrl = envBaseUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const baseUrl = `${envBaseUrl}`;

    const amountInCents = Math.round(Number(price) * 100);
    const redirectUrl = `${baseUrl}/client/appointments?status=success&order_nsu=${appointmentId}`;
    const webhookUrl = `${baseUrl}/api/webhooks/infinitepay`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Chamada à API da InfinitePay
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

    console.warn("[CHECKOUT API WARNING] Falha na API InfinitePay, usando redirecionamento interno:", responseData);

    // Redirecionamento interno seguro em caso de indisponibilidade do link dinâmico
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