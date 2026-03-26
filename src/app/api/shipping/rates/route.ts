import { NextRequest, NextResponse } from 'next/server';
import { calculateShippingCost } from '@/lib/gls';

export async function POST(request: NextRequest) {
  try {
    const { totalWeight, orderTotal } = await request.json();

    const cost = calculateShippingCost(totalWeight || 1, orderTotal || 0);

    return NextResponse.json({
      cost,
      provider: 'GLS',
      estimatedDays: cost === 0 ? '1-2 días laborables' : '2-3 días laborables',
      freeShippingThreshold: 100,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
