import { NextRequest, NextResponse } from 'next/server';
import { createRedsysPayment } from '@/lib/redsys';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const amountInCents = Math.round(Number(order.total) * 100);

    const payment = createRedsysPayment({
      orderId: order.orderNumber,
      amount: amountInCents,
      description: `Pedido ${order.orderNumber} - Speedler`,
      callbackUrl: `${baseUrl}/api/payment/redsys/callback`,
      successUrl: `${baseUrl}/cuenta/pedidos?success=${order.orderNumber}`,
      errorUrl: `${baseUrl}/checkout?error=payment_failed`,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { paymentMethod: 'REDSYS' },
    });

    return NextResponse.json(payment);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error al procesar el pago' },
      { status: 500 }
    );
  }
}
