import { NextRequest, NextResponse } from 'next/server';
import { createGlsShipment, getGlsTracking, getGlsTrackingUrl } from '@/lib/gls';
import { sendShippingNotification } from '@/lib/email';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        shippingAddress: true,
        items: { include: { product: true } },
      },
    });

    if (!order || !order.shippingAddress) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    const totalWeight = order.items.reduce(
      (sum, item) => sum + Number(item.product.weight) * item.quantity,
      0
    );

    const shipment = await createGlsShipment({
      orderId: order.orderNumber,
      recipient: {
        name: order.user.name,
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        postalCode: order.shippingAddress.postalCode,
        country: order.shippingAddress.country,
        phone: order.user.phone || '',
        email: order.user.email,
      },
      packages: [{ weight: Math.max(totalWeight, 0.5) }],
    });

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SHIPPED',
        shippingTrackingCode: shipment.trackingNumber,
      },
    });

    // Send notification
    await sendShippingNotification(
      order.user.email,
      order.user.name,
      order.orderNumber,
      shipment.trackingNumber,
      getGlsTrackingUrl(shipment.trackingNumber)
    );

    return NextResponse.json({
      trackingNumber: shipment.trackingNumber,
      trackingUrl: getGlsTrackingUrl(shipment.trackingNumber),
      labelUrl: shipment.labelUrl,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const trackingNumber = request.nextUrl.searchParams.get('tracking');

  if (!trackingNumber) {
    return NextResponse.json({ error: 'Tracking number required' }, { status: 400 });
  }

  try {
    const tracking = await getGlsTracking(trackingNumber);
    return NextResponse.json(tracking);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
