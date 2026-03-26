import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const componentTypes = await prisma.componentType.findMany({
      orderBy: { sortOrder: 'asc' },
      include: {
        compatibilityRules: true,
      },
    });

    // Map component types to categories
    const categoryMapping: Record<string, string[]> = {
      cpu: ['Procesadores'],
      motherboard: ['Placas Base'],
      ram: ['Memorias'],
      gpu: ['Tarjetas Gráficas / Edición de Video'],
      storage: ['Discos Duros Internos', 'Discos Duros Externos', 'SSD'],
      psu: ['Fuentes Alimentación'],
      case: ['Cajas CPU'],
      cooler: ['Ventiladores CPU', 'Ventiladores de caja'],
    };

    const result = await Promise.all(
      componentTypes.map(async (ct) => {
        const categoryNames = categoryMapping[ct.slug] || [];

        const products = await prisma.product.findMany({
          where: {
            isActive: true,
            stock: { gt: 0 },
            category: {
              name: { in: categoryNames.length > 0 ? categoryNames : ['__none__'] },
            },
          },
          include: { category: true, manufacturer: true },
          orderBy: { salePrice: 'asc' },
        });

        return {
          ...ct,
          products,
        };
      })
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
