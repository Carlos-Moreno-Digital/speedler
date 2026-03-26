import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { parseCsvContent, generateProductSlug } from '../src/lib/csv-import';
import { createSlug } from '../src/lib/utils';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@speedler.es' },
    update: {},
    create: {
      email: 'admin@speedler.es',
      passwordHash: adminPassword,
      name: 'Admin Speedler',
      role: 'ADMIN',
    },
  });
  console.log('Admin user created');

  // Read CSV
  const csvPath = path.join(process.cwd(), 'ProductosPropios.csv');
  const csvContent = fs.readFileSync(csvPath, 'latin1');
  const products = parseCsvContent(csvContent);
  console.log(`Parsed ${products.length} products from CSV`);

  // Extract unique categories and manufacturers
  const categoriesMap = new Map<number, string>();
  const manufacturersMap = new Map<number, string>();

  for (const p of products) {
    if (p.idCategoria && p.desCategoria) {
      categoriesMap.set(p.idCategoria, p.desCategoria);
    }
    if (p.idFabricante && p.desFabricante && p.desFabricante !== '[sin fabricante]') {
      manufacturersMap.set(p.idFabricante, p.desFabricante);
    }
  }

  // Seed categories
  const categoryIdMap = new Map<number, string>();
  for (const [externalId, name] of categoriesMap) {
    const slug = createSlug(name) || `cat-${externalId}`;
    const category = await prisma.category.upsert({
      where: { externalId },
      update: { name },
      create: {
        externalId,
        name,
        slug,
      },
    });
    categoryIdMap.set(externalId, category.id);
  }
  console.log(`Seeded ${categoriesMap.size} categories`);

  // Seed manufacturers
  const manufacturerIdMap = new Map<number, string>();
  for (const [externalId, name] of manufacturersMap) {
    const slug = createSlug(name) || `mfr-${externalId}`;
    const manufacturer = await prisma.manufacturer.upsert({
      where: { externalId },
      update: { name },
      create: {
        externalId,
        name,
        slug,
      },
    });
    manufacturerIdMap.set(externalId, manufacturer.id);
  }
  console.log(`Seeded ${manufacturersMap.size} manufacturers`);

  // Seed products
  const slugCounts = new Map<string, number>();
  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const sku = p.referencia;
    if (!sku) {
      skipped++;
      continue;
    }

    let slug = generateProductSlug(p.nombre, sku);
    const count = slugCounts.get(slug) || 0;
    if (count > 0) {
      slug = `${slug}-${count}`;
    }
    slugCounts.set(slug.replace(/-\d+$/, slug), count + 1);

    const costPrice = p.coste;
    // Default 25% markup
    const salePrice = Math.round(costPrice * 1.25 * 100) / 100;

    try {
      await prisma.product.upsert({
        where: { sku },
        update: {
          name: p.nombre,
          costPrice,
          salePrice,
          stock: p.stock,
          canonDigital: p.tasas,
          isOffer: p.oferta,
          image: p.fotografia || null,
          weight: p.peso,
        },
        create: {
          sku,
          partNumber: p.partNumber || null,
          ean: p.upcCode || null,
          name: p.nombre,
          slug,
          summary: p.resumen || null,
          description: p.descripcion || null,
          specs: p.especificacionesAmpliadas || null,
          generalInfo: p.infoGeneral || null,
          accessories: p.accesorios || null,
          weight: p.peso,
          costPrice,
          salePrice,
          canonDigital: p.tasas,
          isOffer: p.oferta,
          offerStart: p.fechaInicioOferta ? new Date(p.fechaInicioOferta) : null,
          offerEnd: p.fechaFinOferta ? new Date(p.fechaFinOferta) : null,
          stock: p.stock,
          image: p.fotografia || null,
          categoryId: categoryIdMap.get(p.idCategoria) || null,
          manufacturerId: manufacturerIdMap.get(p.idFabricante) || null,
          isActive: true,
        },
      });
      created++;
    } catch (error: any) {
      if (error.code === 'P2002') {
        // Unique constraint - try with modified slug
        slug = `${slug}-${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        try {
          await prisma.product.create({
            data: {
              sku,
              partNumber: p.partNumber || null,
              ean: p.upcCode || null,
              name: p.nombre,
              slug,
              summary: p.resumen || null,
              description: p.descripcion || null,
              specs: p.especificacionesAmpliadas || null,
              generalInfo: p.infoGeneral || null,
              accessories: p.accesorios || null,
              weight: p.peso,
              costPrice,
              salePrice,
              canonDigital: p.tasas,
              isOffer: p.oferta,
              stock: p.stock,
              image: p.fotografia || null,
              categoryId: categoryIdMap.get(p.idCategoria) || null,
              manufacturerId: manufacturerIdMap.get(p.idFabricante) || null,
              isActive: true,
            },
          });
          created++;
        } catch {
          skipped++;
        }
      } else {
        console.error(`Error seeding product ${sku}:`, error.message);
        skipped++;
      }
    }
  }

  console.log(`Products: ${created} created, ${skipped} skipped`);

  // Seed default global pricing rule (25% markup)
  await prisma.pricingRule.upsert({
    where: { id: 'default-global' },
    update: {},
    create: {
      id: 'default-global',
      name: 'Margen global 25%',
      type: 'PERCENTAGE',
      value: 25,
      appliesTo: 'GLOBAL',
      priority: 0,
      isActive: true,
    },
  });

  // Seed component types for PC configurator
  const componentTypes = [
    { name: 'Procesador', slug: 'cpu', sortOrder: 1, isRequired: true },
    { name: 'Placa Base', slug: 'motherboard', sortOrder: 2, isRequired: true },
    { name: 'Memoria RAM', slug: 'ram', sortOrder: 3, isRequired: true },
    { name: 'Tarjeta Gráfica', slug: 'gpu', sortOrder: 4, isRequired: false },
    { name: 'Almacenamiento', slug: 'storage', sortOrder: 5, isRequired: true },
    { name: 'Fuente de Alimentación', slug: 'psu', sortOrder: 6, isRequired: true },
    { name: 'Caja/Torre', slug: 'case', sortOrder: 7, isRequired: true },
    { name: 'Refrigeración', slug: 'cooler', sortOrder: 8, isRequired: false },
  ];

  for (const ct of componentTypes) {
    await prisma.componentType.upsert({
      where: { slug: ct.slug },
      update: { name: ct.name, sortOrder: ct.sortOrder },
      create: ct,
    });
  }
  console.log('Component types seeded');

  // Seed shipping rates
  await prisma.shippingRate.createMany({
    data: [
      { name: 'Envío estándar (hasta 5kg)', maxWeight: 5, cost: 4.95, provider: 'GLS' },
      { name: 'Envío estándar (5-15kg)', minWeight: 5, maxWeight: 15, cost: 6.95, provider: 'GLS' },
      { name: 'Envío estándar (15-30kg)', minWeight: 15, maxWeight: 30, cost: 9.95, provider: 'GLS' },
      { name: 'Envío gratuito (pedidos +100€)', minPrice: 100, cost: 0, provider: 'GLS' },
    ],
    skipDuplicates: true,
  });
  console.log('Shipping rates seeded');

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
