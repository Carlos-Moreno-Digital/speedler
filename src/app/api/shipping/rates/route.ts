import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const rates = await prisma.shippingRate.findMany({
      where: { isActive: true },
      orderBy: [{ cost: 'asc' }],
    });

    return NextResponse.json(rates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { subtotal, weight } = await request.json();

    if (subtotal >= 100) {
      return NextResponse.json({ cost: 0, freeShipping: true });
    }

    const conditions: any[] = [];

    if (weight !== undefined) {
      conditions.push({
        minWeight: { lte: weight },
        maxWeight: { gte: weight },
      });
    }

    if (subtotal !== undefined) {
      conditions.push(
        {
          minPrice: { lte: subtotal },
          maxPrice: { gte: subtotal },
        },
        {
          minPrice: { lte: subtotal },
          maxPrice: null,
        }
      );
    }

    const rate = await prisma.shippingRate.findFirst({
      where: {
        isActive: true,
        OR: conditions.length > 0 ? conditions : undefined,
      },
      orderBy: { cost: 'asc' },
    });

    return NextResponse.json({
      cost: rate ? Number(rate.cost) : 5.99,
      freeShipping: false,
      rateName: rate?.name || 'Envío estándar',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
