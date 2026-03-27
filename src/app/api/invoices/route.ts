import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateInvoiceNumber } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const user = session.user as { id: string; role: string };
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (orderId) {
      const invoice = await prisma.invoice.findUnique({
        where: { orderId },
        include: {
          order: {
            include: {
              user: true,
              items: { include: { product: true } },
              shippingAddress: true,
              billingAddress: true,
            },
          },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
      }

      if (user.role !== 'ADMIN' && invoice.order.userId !== user.id) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
      }

      return NextResponse.json(invoice);
    }

    // List invoices
    const where = user.role === 'ADMIN' ? {} : { order: { userId: user.id } };
    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            createdAt: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: { include: { product: true } },
        shippingAddress: true,
        billingAddress: true,
        invoice: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (order.invoice) {
      return NextResponse.json(order.invoice);
    }

    const invoice = await prisma.invoice.create({
      data: {
        orderId: order.id,
        invoiceNumber: generateInvoiceNumber(),
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
