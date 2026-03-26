import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseCsvContent, generateProductSlug } from '@/lib/csv-import';
import { calculateSalePrice } from '@/lib/pricing';
import { createSlug } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const csvContent = await request.text();

    if (!csvContent || csvContent.trim() === '') {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      );
    }

    const csvProducts = parseCsvContent(csvContent);

    if (csvProducts.length === 0) {
      return NextResponse.json(
        { error: 'No valid products found in CSV' },
        { status: 400 }
      );
    }

    let created = 0;
    let updated = 0;
    const errors: { sku: string; error: string }[] = [];

    for (const csvProduct of csvProducts) {
      try {
        if (!csvProduct.referencia) {
          errors.push({ sku: '', error: 'Missing SKU (referencia)' });
          continue;
        }

        // Upsert category if present
        let categoryId: string | null = null;
        if (csvProduct.idCategoria && csvProduct.desCategoria) {
          const category = await prisma.category.upsert({
            where: { externalId: csvProduct.idCategoria },
            update: { name: csvProduct.desCategoria },
            create: {
              externalId: csvProduct.idCategoria,
              name: csvProduct.desCategoria,
              slug: createSlug(csvProduct.desCategoria),
            },
          });
          categoryId = category.id;
        }

        // Upsert manufacturer if present
        let manufacturerId: string | null = null;
        if (csvProduct.idFabricante && csvProduct.desFabricante) {
          const manufacturer = await prisma.manufacturer.upsert({
            where: { externalId: csvProduct.idFabricante },
            update: { name: csvProduct.desFabricante },
            create: {
              externalId: csvProduct.idFabricante,
              name: csvProduct.desFabricante,
              slug: createSlug(csvProduct.desFabricante),
            },
          });
          manufacturerId = manufacturer.id;
        }

        const salePrice = await calculateSalePrice(
          csvProduct.coste,
          undefined,
          categoryId ?? undefined,
          manufacturerId ?? undefined
        );

        const slug = generateProductSlug(csvProduct.nombre, csvProduct.referencia);

        const existingProduct = await prisma.product.findUnique({
          where: { sku: csvProduct.referencia },
        });

        const productData = {
          name: csvProduct.nombre,
          slug,
          partNumber: csvProduct.partNumber || null,
          ean: csvProduct.upcCode || null,
          weight: csvProduct.peso,
          costPrice: csvProduct.coste,
          salePrice,
          canonDigital: csvProduct.tasas,
          isOffer: csvProduct.oferta,
          offerStart: csvProduct.fechaInicioOferta
            ? new Date(csvProduct.fechaInicioOferta)
            : null,
          offerEnd: csvProduct.fechaFinOferta
            ? new Date(csvProduct.fechaFinOferta)
            : null,
          summary: csvProduct.resumen || null,
          description: csvProduct.descripcion || null,
          generalInfo: csvProduct.infoGeneral || null,
          specs: csvProduct.especificacionesAmpliadas || null,
          accessories: csvProduct.accesorios || null,
          stock: csvProduct.stock,
          stockUpdatedAt: csvProduct.fechaStock
            ? new Date(csvProduct.fechaStock)
            : new Date(),
          image: csvProduct.fotografia || null,
          categoryId,
          manufacturerId,
          isActive: true,
        };

        if (existingProduct) {
          await prisma.product.update({
            where: { sku: csvProduct.referencia },
            data: productData,
          });
          updated++;
        } else {
          await prisma.product.create({
            data: {
              sku: csvProduct.referencia,
              ...productData,
            },
          });
          created++;
        }
      } catch (productError) {
        const message = productError instanceof Error
          ? productError.message
          : 'Unknown error';
        errors.push({ sku: csvProduct.referencia, error: message });
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      summary: {
        total: csvProducts.length,
        created,
        updated,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error importing products:', error);
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    );
  }
}
