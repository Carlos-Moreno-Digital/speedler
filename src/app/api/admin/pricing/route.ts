import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { applyPricingRule } from '@/lib/pricing';

export async function GET() {
  try {
    const rules = await prisma.pricingRule.findMany({
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(rules);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const rule = await prisma.pricingRule.create({
      data: {
        name: body.name,
        type: body.type,
        value: body.value,
        appliesTo: body.appliesTo,
        targetId: body.targetId || null,
        priority: body.priority || 0,
        isActive: body.isActive ?? true,
      },
    });

    // Recalculate affected product prices
    if (body.recalculate !== false) {
      await recalculatePrices(rule.appliesTo, rule.targetId, rule.type, Number(rule.value));
    }

    return NextResponse.json(rule, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const rule = await prisma.pricingRule.update({
      where: { id: body.id },
      data: {
        name: body.name,
        type: body.type,
        value: body.value,
        appliesTo: body.appliesTo,
        targetId: body.targetId,
        priority: body.priority,
        isActive: body.isActive,
      },
    });

    if (body.recalculate !== false) {
      await recalculatePrices(rule.appliesTo, rule.targetId, rule.type, Number(rule.value));
    }

    return NextResponse.json(rule);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    await prisma.pricingRule.delete({ where: { id } });
    return NextResponse.json({ message: 'Regla eliminada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function recalculatePrices(
  appliesTo: string,
  targetId: string | null,
  type: string,
  value: number
) {
  const where: Record<string, any> = {};

  if (appliesTo === 'PRODUCT' && targetId) {
    where.id = targetId;
  } else if (appliesTo === 'CATEGORY' && targetId) {
    where.categoryId = targetId;
  } else if (appliesTo === 'MANUFACTURER' && targetId) {
    where.manufacturerId = targetId;
  }

  const products = await prisma.product.findMany({
    where,
    select: { id: true, costPrice: true },
  });

  for (const product of products) {
    const newPrice = applyPricingRule(
      Number(product.costPrice),
      type as 'PERCENTAGE' | 'FIXED',
      value
    );

    await prisma.product.update({
      where: { id: product.id },
      data: { salePrice: newPrice },
    });
  }
}
