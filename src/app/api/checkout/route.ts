import { NextResponse } from 'next/server';

interface OrderItem {
  description: string;
  quantity: number;
  price: number; // Preço original enviado do front (ex: 45.00)
}

export async function POST(request: Request) {
  try {
    const { items, orderId } = await request.json();

    if (!items || !orderId) {
      return NextResponse.json({ error: 'Dados insuficientes.' }, { status: 400 });
    }

    // A InfinitePay exige que o valor do item seja um inteiro em centavos (ex: R$ 45,00 vira 4500)
    const formattedItems = items.map((item: OrderItem) => ({
      description: item.description,
      quantity: item.quantity,
      price: Math.round(item.price * 100), 
    }));

    // Montagem do payload conforme especificações da InfinitePay
    const payload = {
      handle: process.env.NEXT_PUBLIC_INFINITEPAY_HANDLE,
      order_nsu: orderId, // Identificador único gerado no seu sistema
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/sucesso`,
      webhook_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/infinitepay`,
      items: formattedItems,
    };

    // Chamada oficial para a API de geração de links
    const response = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errorData || 'Erro ao gerar checkout' }, { status: response.status });
    }

    const data = await response.json();

    // Retorna a URL segura gerada para o frontend redirecionar
    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error('Erro na API de Checkout:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}