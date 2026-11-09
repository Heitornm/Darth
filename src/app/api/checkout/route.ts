import { NextResponse } from "next/server";

/**
 * Rota de API: Checkout InfinitePay
 * Responsável por receber os dados do agendamento, converter o valor e solicitar a geração 
 * do link de pagamento/PIX através da API de Links da InfinitePay.
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

    // Carrega variáveis de ambiente com fallbacks seguros
    const handle = process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE || "darthbarbers";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://darthbarbers.onrender.com";
    const apiKey = process.env.INFINITEPAY_API_KEY;

    // Converte o valor em Reais (BRL) para centavos (ex: R$ 35,00 -> 3500)
    const amountInCents = Math.round(Number(price) * 100);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    // Chamada oficial à API de links da InfinitePay
    const response = await fetch("https://api.checkout.infinitepay.io/links", {
      method: "POST",
      headers,
      body: JSON.stringify({
        handle: handle,
        redirect_url: `${baseUrl}/client/appointments?status=success&order_nsu=${appointmentId}`,
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

    // Se o link foi gerado com sucesso pela InfinitePay
    if (response.ok && (responseData.url || responseData.checkout_url)) {
      const checkoutUrl = responseData.url || responseData.checkout_url;
      console.log("[CHECKOUT API] ✅ Link gerado com sucesso:", checkoutUrl);

      return NextResponse.json({
        success: true,
        checkoutUrl,
      }, { status: 200 });
    }

    // Caso a API retorne erro ou ausência do link, utiliza fallback para a chave pública do barbeiro
    console.warn("[CHECKOUT API WARNING] Não foi possível gerar o link dinâmico. Redirecionando para fallback:", responseData);

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