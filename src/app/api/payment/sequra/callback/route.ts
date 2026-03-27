import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOrderConfirmation } from '@/lib/email';
import crypto from 'crypto';

const SEQURA_API_KEY = process.env.SEQURA_API_KEY || '';

function verifySequraSignature(payload: string, signature: string): boolean {
  if (!SEQURA_API_KEY) return false;
  const expected = crypto
    .createHmac('sha256', SEQURA_API_KEY)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const data = JSON.parse(body);
    const { order_ref, sq_state, signature } = data;

    // Verify signature if provided
    if (signature && SEQURA_API_KEY) {
      const isValid = verifySequraSignature(
        JSON.stringify({ order_ref, sq_state }),
        signature
      );
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    }

    if (!order_ref) {
      return NextResponse.json({ error: 'Missing order reference' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { paymentReference: order_ref },
          { orderNumber: order_ref },
        ],
      },
      include: {
        user: true,
        items: { include: { product: true } },
        shippingAddress: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (sq_state === 'approved' || sq_state === 'confirmed') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentReference: order_ref,
        },
      });

      // Send confirmation email
      if (order.user && order.shippingAddress) {
        try {
          await sendOrderConfirmation({
            customerName: order.user.name,
            customerEmail: order.user.email,
            orderNumber: order.orderNumber,
            items: order.items.map((item) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: Number(item.unitPrice),
            })),
            subtotal: Number(order.subtotal),
            canonDigital: Number(order.canonDigitalTotal),
            iva: Number(order.ivaTotal),
            recargoEquivalencia: Number(order.recargoEquivalenciaTotal),
            shipping: Number(order.shippingCost),
            total: Number(order.total),
            shippingAddress: `${order.shippingAddress.street}, ${order.shippingAddress.postalCode} ${order.shippingAddress.city}, ${order.shippingAddress.province}`,
          });
        } catch (emailErr) {
          console.error('Failed to send order confirmation:', emailErr);
        }
      }
    } else if (sq_state === 'cancelled' || sq_state === 'rejected') {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentReference: `${sq_state}: ${order_ref}`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('SeQura callback error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
