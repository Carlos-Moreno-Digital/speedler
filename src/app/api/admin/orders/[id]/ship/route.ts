import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { createGlsShipment, getGlsTrackingUrl } from '@/lib/gls';
import { sendShippingNotification } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        user: true,
        shippingAddress: true,
        items: { include: { product: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
    }

    if (!order.shippingAddress) {
      return NextResponse.json({ error: 'Pedido sin dirección de envío' }, { status: 400 });
    }

    // Calculate total weight
    const totalWeight = order.items.reduce((sum, item) => {
      return sum + Number(item.product.weight) * item.quantity;
    }, 0);

    // Create GLS shipment
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
      reference: order.orderNumber,
    });

    // Update order
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'SHIPPED',
        shippingTrackingCode: shipment.trackingNumber,
      },
    });

    // Send shipping notification
    try {
      await sendShippingNotification(
        order.user.email,
        order.user.name,
        order.orderNumber,
        shipment.trackingNumber,
        getGlsTrackingUrl(shipment.trackingNumber)
      );
    } catch (emailErr) {
      console.error('Failed to send shipping notification:', emailErr);
    }

    return NextResponse.json({
      message: 'Envío creado correctamente',
      trackingNumber: shipment.trackingNumber,
      labelUrl: shipment.labelUrl,
      trackingUrl: getGlsTrackingUrl(shipment.trackingNumber),
    });
  } catch (error: any) {
    console.error('Ship order error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
