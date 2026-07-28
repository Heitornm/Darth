import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("[CHECKOUT API] Payload recebido:", body);

    const { appointmentId, price, serviceName, email, clientName } = body;

    // 1. Validação dos campos obrigatórios
    if (!price || !serviceName || !appointmentId) {
      return NextResponse.json(
        { error: "Campos obrigatórios ausentes no payload." },
        { status: 400 }
      );
    }

    const handle = process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE || "darthbarbers";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://darthbarbers.onrender.com";

    // 2. Converte o preço para centavos (ex: R$ 35,00 = 3500)
    const amountInCents = Math.round(Number(price) * 100);

    // 3. Chamada à API Oficial de Checkout da InfinitePay
    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        handle: handle,
        redirect_url: `${baseUrl}/client/appointments?status=success`,
        webhook_url: `${baseUrl}/api/webhooks/infinitepay`,
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
      console.log("[CHECKOUT API] Link de checkout gerado com sucesso:", checkoutUrl);

      return NextResponse.json({
        success: true,
        checkoutUrl,
      }, { status: 200 });
    }

    console.error("[CHECKOUT API ERROR] Falha na API da InfinitePay:", responseData);

    // 4. Fallback para a página pública do handle se a API não retornar a URL
    const fallbackUrl = `https://infinitepay.io/pay/${handle}`;
    return NextResponse.json({
      success: true,
      message: "Redirecionando para o perfil do estabelecimento.",
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