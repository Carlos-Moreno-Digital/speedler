import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const CATEGORY_MAP: Record<string, string[]> = {
  procesador: ['Procesadores'],
  'placa-base': ['Placas Base'],
  'memoria-ram': ['Memorias'],
  'tarjeta-grafica': ['Tarjetas Gráficas / Edición de Video'],
  almacenamiento: ['Discos Duros Internos', 'Discos Duros Externos', 'SSD'],
  'fuente-alimentacion': ['Fuentes Alimentación'],
  'caja-torre': ['Cajas CPU'],
  refrigeracion: ['Ventiladores CPU', 'Ventiladores de caja'],
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type) {
      return NextResponse.json(
        { error: 'Query param "type" is required' },
        { status: 400 }
      );
    }

    // Look up category names from the slug mapping
    let categoryNames = CATEGORY_MAP[type];

    // If no mapping found, try matching the category slug directly
    if (!categoryNames) {
      const matchedCategories = await prisma.category.findMany({
        where: { slug: type },
        select: { name: true },
      });

      if (matchedCategories.length > 0) {
        categoryNames = matchedCategories.map((c) => c.name);
      }
    }

    if (!categoryNames || categoryNames.length === 0) {
      return NextResponse.json([]);
    }

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 },
        category: {
          name: { in: categoryNames },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        salePrice: true,
        canonDigital: true,
        stock: true,
        socketType: true,
        ramType: true,
        formFactor: true,
        wattage: true,
        storageInterface: true,
        manufacturer: {
          select: { name: true },
        },
        category: {
          select: { name: true, slug: true },
        },
      },
      orderBy: { salePrice: 'asc' },
    });

    // Convert Decimal fields to numbers for JSON serialization
    const serialized = products.map((p) => ({
      ...p,
      salePrice: Number(p.salePrice),
      canonDigital: Number(p.canonDigital),
    }));

    return NextResponse.json(serialized);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
