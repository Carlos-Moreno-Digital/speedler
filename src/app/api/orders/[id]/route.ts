import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const currentUser = session.user as { id: string; role: string };
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
                sku: true,
                partNumber: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            nif: true,
            isRecargoEquivalencia: true,
          },
        },
        shippingAddress: true,
        billingAddress: true,
        invoice: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Regular users can only view their own orders
    if (currentUser.role !== 'ADMIN' && order.userId !== currentUser.id) {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const currentUser = session.user as { id: string; role: string };

    // Only admins can update orders
    if (currentUser.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Acceso denegado' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, shippingTrackingCode, paymentReference, notes } = body;

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const validStatuses = [
      'PENDING',
      'CONFIRMED',
      'PAID',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ];

    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // If cancelling, restore stock
    if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      const orderItems = await prisma.orderItem.findMany({
        where: { orderId: id },
      });

      await prisma.$transaction(async (tx) => {
        for (const item of orderItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.order.update({
          where: { id },
          data: {
            status: 'CANCELLED',
            ...(shippingTrackingCode !== undefined && { shippingTrackingCode }),
            ...(paymentReference !== undefined && { paymentReference }),
            ...(notes !== undefined && { notes }),
          },
        });
      });

      const updatedOrder = await prisma.order.findUnique({
        where: { id },
        include: {
          items: { include: { product: true } },
        },
      });

      return NextResponse.json(updatedOrder);
    }

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (shippingTrackingCode !== undefined) updateData.shippingTrackingCode = shippingTrackingCode;
    if (paymentReference !== undefined) updateData.paymentReference = paymentReference;
    if (notes !== undefined) updateData.notes = notes;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
