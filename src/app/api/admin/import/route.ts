import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateOrderNumber } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (type === 'users') {
      return await importUsers(data);
    } else if (type === 'orders') {
      return await importOrders(data);
    } else {
      return NextResponse.json({ error: 'Tipo no válido. Use "users" o "orders"' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function importUsers(users: any[]) {
  if (!Array.isArray(users)) {
    return NextResponse.json({ error: 'Data must be an array of users' }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const user of users) {
    try {
      if (!user.email || !user.name) {
        errors.push(`Skipping user: missing email or name`);
        skipped++;
        continue;
      }

      const existing = await prisma.user.findUnique({
        where: { email: user.email.toLowerCase() },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Generate a random password for imported users - they'll need to reset
      const tempPassword = await bcrypt.hash(
        Math.random().toString(36).slice(-12),
        10
      );

      await prisma.user.create({
        data: {
          email: user.email.toLowerCase(),
          name: user.name,
          passwordHash: tempPassword,
          phone: user.phone || null,
          nif: user.nif || null,
          role: 'CUSTOMER',
          isRecargoEquivalencia: user.isRecargoEquivalencia || false,
        },
      });

      // Import addresses if provided
      if (user.addresses && Array.isArray(user.addresses)) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });
        if (dbUser) {
          for (const addr of user.addresses) {
            await prisma.address.create({
              data: {
                userId: dbUser.id,
                street: addr.street || '',
                city: addr.city || '',
                province: addr.province || '',
                postalCode: addr.postalCode || '',
                country: addr.country || 'ES',
                isDefault: addr.isDefault || false,
                isBilling: addr.isBilling || false,
              },
            });
          }
        }
      }

      created++;
    } catch (err: any) {
      errors.push(`Error importing ${user.email}: ${err.message}`);
    }
  }

  return NextResponse.json({
    message: `Importación completada: ${created} creados, ${skipped} omitidos`,
    created,
    skipped,
    errors,
  });
}

async function importOrders(orders: any[]) {
  if (!Array.isArray(orders)) {
    return NextResponse.json({ error: 'Data must be an array of orders' }, { status: 400 });
  }

  let created = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const order of orders) {
    try {
      if (!order.userEmail) {
        errors.push('Skipping order: missing userEmail');
        skipped++;
        continue;
      }

      const user = await prisma.user.findUnique({
        where: { email: order.userEmail.toLowerCase() },
      });

      if (!user) {
        errors.push(`User not found: ${order.userEmail}`);
        skipped++;
        continue;
      }

      await prisma.order.create({
        data: {
          orderNumber: order.orderNumber || generateOrderNumber(),
          userId: user.id,
          status: order.status || 'DELIVERED',
          subtotal: order.subtotal || 0,
          canonDigitalTotal: order.canonDigitalTotal || 0,
          ivaTotal: order.ivaTotal || 0,
          recargoEquivalenciaTotal: order.recargoEquivalenciaTotal || 0,
          shippingCost: order.shippingCost || 0,
          total: order.total || 0,
          paymentMethod: order.paymentMethod || null,
          paymentReference: order.paymentReference || null,
          notes: order.notes || null,
          createdAt: order.date ? new Date(order.date) : new Date(),
          items: {
            create: (order.items || []).map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity || 1,
              unitPrice: item.unitPrice || 0,
              canonDigital: item.canonDigital || 0,
              totalPrice: item.totalPrice || (item.unitPrice || 0) * (item.quantity || 1),
            })),
          },
        },
      });

      created++;
    } catch (err: any) {
      errors.push(`Error importing order: ${err.message}`);
    }
  }

  return NextResponse.json({
    message: `Importación completada: ${created} pedidos creados, ${skipped} omitidos`,
    created,
    skipped,
    errors,
  });
}
