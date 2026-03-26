import prisma from './prisma';
import { parseCsvContent, generateProductSlug } from './csv-import';
import { createSlug } from './utils';
import { csvAdapterFetch } from './supplier-adapters/csv-adapter';
import { apiAdapterFetch } from './supplier-adapters/api-adapter';
import { ftpAdapterFetch } from './supplier-adapters/ftp-adapter';

export interface SyncResult {
  success: boolean;
  productsCreated: number;
  productsUpdated: number;
  productsDeactivated: number;
  errors: string[];
}

export async function runSupplierSync(supplierSyncId: string): Promise<SyncResult> {
  const supplierSync = await prisma.supplierSync.findUnique({
    where: { id: supplierSyncId },
  });

  if (!supplierSync || !supplierSync.isActive) {
    return {
      success: false,
      productsCreated: 0,
      productsUpdated: 0,
      productsDeactivated: 0,
      errors: ['Supplier sync not found or inactive'],
    };
  }

  // Create sync log
  const syncLog = await prisma.syncLog.create({
    data: {
      supplierSyncId: supplierSync.id,
      status: 'RUNNING',
    },
  });

  const result: SyncResult = {
    success: true,
    productsCreated: 0,
    productsUpdated: 0,
    productsDeactivated: 0,
    errors: [],
  };

  try {
    // Fetch data based on sync type
    let csvContent: string;

    switch (supplierSync.syncType) {
      case 'CSV_URL':
        csvContent = await csvAdapterFetch(
          supplierSync.endpoint,
          supplierSync.credentials || undefined
        );
        break;
      case 'API':
        csvContent = await apiAdapterFetch(
          supplierSync.endpoint,
          supplierSync.credentials || undefined,
          supplierSync.fieldMapping as Record<string, string>
        );
        break;
      case 'FTP':
        csvContent = await ftpAdapterFetch(
          supplierSync.endpoint,
          supplierSync.credentials || undefined
        );
        break;
      default:
        throw new Error(`Unknown sync type: ${supplierSync.syncType}`);
    }

    // Parse products
    const products = parseCsvContent(csvContent);

    if (products.length === 0) {
      result.errors.push('No products parsed from data source');
      result.success = false;
    } else {
      // Get existing products with details for stock aggregation
      const existingProducts = await prisma.product.findMany({
        select: {
          id: true,
          sku: true,
          partNumber: true,
          name: true,
          summary: true,
          description: true,
          image: true,
          stock: true,
        },
      });
      const existingSkuMap = new Map(existingProducts.map((p) => [p.sku, p]));
      // Also build a partNumber lookup for cross-matching
      const existingPartNumberMap = new Map<string, typeof existingProducts[0]>();
      for (const p of existingProducts) {
        if (p.partNumber) {
          existingPartNumberMap.set(p.partNumber, p);
        }
      }

      for (const p of products) {
        const sku = p.referencia;
        if (!sku) continue;

        // Upsert category
        let categoryId: string | null = null;
        if (p.idCategoria && p.desCategoria) {
          const slug = createSlug(p.desCategoria) || `cat-${p.idCategoria}`;
          const cat = await prisma.category.upsert({
            where: { externalId: p.idCategoria },
            update: { name: p.desCategoria },
            create: { externalId: p.idCategoria, name: p.desCategoria, slug },
          });
          categoryId = cat.id;
        }

        // Upsert manufacturer
        let manufacturerId: string | null = null;
        if (p.idFabricante && p.desFabricante && p.desFabricante !== '[sin fabricante]') {
          const slug = createSlug(p.desFabricante) || `mfr-${p.idFabricante}`;
          const mfr = await prisma.manufacturer.upsert({
            where: { externalId: p.idFabricante },
            update: { name: p.desFabricante },
            create: { externalId: p.idFabricante, name: p.desFabricante, slug },
          });
          manufacturerId = mfr.id;
        }

        const costPrice = p.coste;
        const salePrice = Math.round(costPrice * 1.25 * 100) / 100;
        const supplierStock = p.stock || 0;

        // Try to find existing product by SKU or partNumber
        const existingBySku = existingSkuMap.get(sku);
        const existingByPartNumber = p.partNumber
          ? existingPartNumberMap.get(p.partNumber)
          : undefined;
        const existingProduct = existingBySku || existingByPartNumber;

        if (existingProduct) {
          // Product exists (own or from another supplier) - aggregate stock
          // Only fill in fields that are currently null/empty
          const updateData: Record<string, any> = {
            stock: { increment: supplierStock },
            isActive: true,
          };

          // Only update name if current is null/empty
          if (!existingProduct.name) {
            updateData.name = p.nombre;
          }

          // Only update summary if current is null/empty
          if (!existingProduct.summary) {
            updateData.summary = p.resumen || undefined;
          }

          // Only update description if current is null/empty
          if (!existingProduct.description) {
            updateData.description = p.descripcion || undefined;
          }

          // Only update image if current is null/empty
          if (!existingProduct.image && p.fotografia) {
            updateData.image = p.fotografia;
          }

          // Update category/manufacturer if not already set
          if (categoryId) {
            updateData.categoryId = categoryId;
          }
          if (manufacturerId) {
            updateData.manufacturerId = manufacturerId;
          }

          await prisma.product.update({
            where: { id: existingProduct.id },
            data: updateData,
          });
          result.productsUpdated++;
        } else {
          // Product does not exist anywhere - create from supplier data
          const slug = generateProductSlug(p.nombre, sku);
          try {
            const newProduct = await prisma.product.create({
              data: {
                sku,
                partNumber: p.partNumber || null,
                name: p.nombre,
                slug: `${slug}-${Date.now()}`,
                summary: p.resumen || null,
                description: p.descripcion || null,
                costPrice,
                salePrice,
                canonDigital: p.tasas,
                stock: supplierStock,
                weight: p.peso,
                image: p.fotografia || null,
                categoryId,
                manufacturerId,
                isActive: true,
              },
            });
            // Add to maps so subsequent suppliers can aggregate
            existingSkuMap.set(sku, {
              id: newProduct.id,
              sku,
              partNumber: p.partNumber || null,
              name: p.nombre,
              summary: p.resumen || null,
              description: p.descripcion || null,
              image: p.fotografia || null,
              stock: supplierStock,
            });
            if (p.partNumber) {
              existingPartNumberMap.set(p.partNumber, existingSkuMap.get(sku)!);
            }
            result.productsCreated++;
          } catch (error: any) {
            result.errors.push(`Failed to create product ${sku}: ${error.message}`);
          }
        }
      }

      // Do NOT deactivate products missing from this supplier feed.
      // Products may belong to own stock or other suppliers.
    }

    // Update sync log
    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt: new Date(),
        status: result.success ? 'SUCCESS' : 'PARTIAL',
        productsCreated: result.productsCreated,
        productsUpdated: result.productsUpdated,
        productsDeactivated: result.productsDeactivated,
        errors: result.errors,
      },
    });

    // Update supplier sync
    await prisma.supplierSync.update({
      where: { id: supplierSync.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: result.success ? 'SUCCESS' : 'PARTIAL',
      },
    });
  } catch (error: any) {
    result.success = false;
    result.errors.push(error.message);

    await prisma.syncLog.update({
      where: { id: syncLog.id },
      data: {
        completedAt: new Date(),
        status: 'FAILED',
        errors: [error.message],
      },
    });

    await prisma.supplierSync.update({
      where: { id: supplierSync.id },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: 'FAILED',
      },
    });
  }

  return result;
}

export async function runAllActiveSupplierSyncs(): Promise<
  Record<string, SyncResult>
> {
  const activeSuppliers = await prisma.supplierSync.findMany({
    where: { isActive: true },
  });

  const results: Record<string, SyncResult> = {};

  for (const supplier of activeSuppliers) {
    const shouldSync =
      !supplier.lastSyncAt ||
      Date.now() - supplier.lastSyncAt.getTime() >=
        supplier.syncIntervalMinutes * 60 * 1000;

    if (shouldSync) {
      results[supplier.supplierName] = await runSupplierSync(supplier.id);
    }
  }

  return results;
}
