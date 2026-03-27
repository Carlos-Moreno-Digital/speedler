import prisma from './prisma';

export const FREE_SHIPPING_THRESHOLD = 100;
export const DEFAULT_SHIPPING_COST = 5.99;

export async function calculateShippingCost(subtotal: number, weight?: number): Promise<number> {
  // Check for free shipping threshold
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }

  // Try to find a matching rate from the database
  try {
    const conditions: any[] = [];

    if (weight !== undefined) {
      conditions.push({
        minWeight: { lte: weight },
        maxWeight: { gte: weight },
      });
    }

    conditions.push({
      minPrice: { lte: subtotal },
      maxPrice: { gte: subtotal },
    });

    conditions.push({
      minPrice: { lte: subtotal },
      maxPrice: null,
    });

    const rate = await prisma.shippingRate.findFirst({
      where: {
        isActive: true,
        OR: conditions,
      },
      orderBy: { cost: 'asc' },
    });

    if (rate) {
      return Number(rate.cost);
    }
  } catch {
    // Fall through to default
  }

  return DEFAULT_SHIPPING_COST;
}

export function getShippingEstimate(subtotal: number): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    return 0;
  }
  return DEFAULT_SHIPPING_COST;
}
