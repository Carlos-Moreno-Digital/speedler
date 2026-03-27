import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });

    return NextResponse.json(addresses);
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

    const userId = (session.user as { id: string }).id;
    const body = await request.json();

    // If this is the first address or marked as default, unset other defaults
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        street: body.street,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        country: body.country || 'ES',
        isDefault: body.isDefault || false,
        isBilling: body.isBilling || false,
      },
    });

    return NextResponse.json(address, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const body = await request.json();

    const existing = await prisma.address.findUnique({
      where: { id: body.id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
    }

    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: body.id } },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: body.id },
      data: {
        street: body.street,
        city: body.city,
        province: body.province,
        postalCode: body.postalCode,
        country: body.country,
        isDefault: body.isDefault,
        isBilling: body.isBilling,
      },
    });

    return NextResponse.json(address);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const userId = (session.user as { id: string }).id;
    const { id } = await request.json();

    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: 'Dirección no encontrada' }, { status: 404 });
    }

    await prisma.address.delete({ where: { id } });

    return NextResponse.json({ message: 'Dirección eliminada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
