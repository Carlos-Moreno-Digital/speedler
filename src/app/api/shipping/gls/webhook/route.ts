import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendShippingNotification } from '@/lib/email';
import { getGlsTrackingUrl } from '@/lib/gls';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { trackingNumber, status, event } = data;

    if (!trackingNumber) {
      return NextResponse.json({ error: 'Missing tracking number' }, { status: 400 });
    }

    // Find order by tracking code
    const order = await prisma.order.findFirst({
      where: { shippingTrackingCode: trackingNumber },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Update order status based on shipping event
    const statusMap: Record<string, string> = {
      DELIVERED: 'DELIVERED',
      IN_TRANSIT: 'SHIPPED',
      OUT_FOR_DELIVERY: 'SHIPPED',
      PICKED_UP: 'SHIPPED',
      RETURNED: 'CANCELLED',
    };

    const newStatus = statusMap[status];
    if (newStatus && newStatus !== order.status) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus as any },
      });
    }

    // Send delivery notification
    if (status === 'DELIVERED' && order.user) {
      try {
        await sendShippingNotification(
          order.user.email,
          order.user.name,
          order.orderNumber,
          trackingNumber,
          getGlsTrackingUrl(trackingNumber)
        );
      } catch (emailErr) {
        console.error('Failed to send delivery notification:', emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('GLS webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
