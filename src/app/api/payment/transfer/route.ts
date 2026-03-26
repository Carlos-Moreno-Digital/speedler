import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethod: 'TRANSFER',
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      message: 'Pedido registrado. Realiza la transferencia con los siguientes datos:',
      bankDetails: {
        beneficiary: 'Speedler S.L.',
        iban: 'ES00 0000 0000 0000 0000 0000',
        bic: 'XXXXESXX',
        concept: `Pedido ${order.orderNumber}`,
        amount: Number(order.total),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
