import { NextRequest, NextResponse } from 'next/server';
import { createSequraOrder } from '@/lib/sequra';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
        shippingAddress: true,
      },
    });

    if (!order || !order.shippingAddress) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const result = await createSequraOrder({
      orderId: order.orderNumber,
      amount: Number(order.total),
      currency: 'EUR',
      customer: {
        email: order.user.email,
        name: order.user.name,
        phone: order.user.phone || undefined,
        nif: order.user.nif || undefined,
      },
      shippingAddress: {
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
      },
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      callbackUrl: `${baseUrl}/api/payment/sequra/callback`,
      successUrl: `${baseUrl}/cuenta/pedidos?success=${order.orderNumber}`,
      cancelUrl: `${baseUrl}/checkout?error=payment_cancelled`,
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: 'SEQURA',
        paymentReference: result.orderId,
      },
    });

    return NextResponse.json({ formUrl: result.formUrl });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error con Sequra' },
      { status: 500 }
    );
  }
}
