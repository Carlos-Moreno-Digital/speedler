import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface ComponentSelection {
  componentTypeSlug: string;
  productId: string;
}

export async function POST(request: NextRequest) {
  try {
    const { components } = (await request.json()) as {
      components: ComponentSelection[];
    };

    const issues: string[] = [];

    // Get product details for selected components
    const productIds = components.map((c) => c.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const selectionMap = new Map(
      components.map((c) => [c.componentTypeSlug, productMap.get(c.productId)])
    );

    const cpu = selectionMap.get('cpu');
    const motherboard = selectionMap.get('motherboard');
    const ram = selectionMap.get('ram');
    const gpu = selectionMap.get('gpu');
    const psu = selectionMap.get('psu');
    const pcCase = selectionMap.get('case');
    const storage = selectionMap.get('storage');

    // CPU + Motherboard socket compatibility
    if (cpu && motherboard) {
      if (cpu.socketType && motherboard.socketType) {
        if (cpu.socketType !== motherboard.socketType) {
          issues.push(
            `Incompatibilidad de socket: El procesador (${cpu.socketType}) no es compatible con la placa base (${motherboard.socketType})`
          );
        }
      }
    }

    // Motherboard + RAM type compatibility
    if (motherboard && ram) {
      if (motherboard.ramType && ram.ramType) {
        if (motherboard.ramType !== ram.ramType) {
          issues.push(
            `Incompatibilidad de memoria: La placa base soporta ${motherboard.ramType} pero la RAM seleccionada es ${ram.ramType}`
          );
        }
      }
    }

    // Motherboard + Case form factor
    if (motherboard && pcCase) {
      if (motherboard.formFactor && pcCase.formFactor) {
        const caseFormFactors = pcCase.formFactor.split(',').map((f) => f.trim());
        if (!caseFormFactors.includes(motherboard.formFactor)) {
          issues.push(
            `Incompatibilidad de formato: La placa base (${motherboard.formFactor}) no cabe en la caja (${pcCase.formFactor})`
          );
        }
      }
    }

    // PSU wattage check
    if (psu) {
      let estimatedWattage = 100; // Base
      if (cpu?.wattage) estimatedWattage += cpu.wattage;
      if (gpu?.wattage) estimatedWattage += gpu.wattage;
      if (ram) estimatedWattage += 10;
      if (storage) estimatedWattage += 10;

      if (psu.wattage && psu.wattage < estimatedWattage) {
        issues.push(
          `La fuente de alimentación (${psu.wattage}W) podría ser insuficiente. Consumo estimado: ${estimatedWattage}W. Se recomienda al menos ${Math.ceil(estimatedWattage * 1.2)}W`
        );
      }
    }

    // Stock check
    for (const component of components) {
      const product = productMap.get(component.productId);
      if (product && product.stock <= 0) {
        issues.push(`${product.name} está agotado`);
      }
    }

    // Calculate total
    const totalPrice = components.reduce((sum, c) => {
      const product = productMap.get(c.productId);
      return sum + (product ? Number(product.salePrice) : 0);
    }, 0);

    const totalCanonDigital = components.reduce((sum, c) => {
      const product = productMap.get(c.productId);
      return sum + (product ? Number(product.canonDigital) : 0);
    }, 0);

    return NextResponse.json({
      valid: issues.length === 0,
      issues,
      totalPrice: Math.round(totalPrice * 100) / 100,
      totalCanonDigital: Math.round(totalCanonDigital * 100) / 100,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
