const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

function parseCsv(content) {
  const lines = content.split('\n').filter(l => l.trim());
  const products = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(';');
    if (cols.length < 22) continue;
    const coste = parseFloat((cols[19] || '0').replace(',', '.')) || 0;
    if (coste <= 0) continue;
    products.push({
      idCategoria: parseInt(cols[0]) || 0,
      idFabricante: parseInt(cols[1]) || 0,
      referencia: cols[2] || '',
      partNumber: cols[3] || '',
      upcCode: cols[4] || '',
      peso: parseFloat((cols[5] || '0').replace(',', '.')) || 0,
      fotografia: cols[6] || '',
      oferta: cols[7] === '1',
      fechaInicioOferta: cols[8] || '',
      fechaFinOferta: cols[9] || '',
      nombre: cols[10] || '',
      resumen: cols[11] || '',
      descripcion: cols[12] || '',
      infoGeneral: cols[13] || '',
      especificaciones: cols[14] || '',
      accesorios: cols[15] || '',
      stock: parseInt(cols[16]) || 0,
      tasas: parseFloat((cols[18] || '0').replace(',', '.')) || 0,
      coste: coste,
      desCategoria: cols[20] || '',
      desFabricante: cols[21] || '',
    });
  }
  return products;
}

async function main() {
  console.log('Starting seed...');

  // Admin user (simple hash - change password later)
  const bcrypt = (() => {
    try { return require('bcryptjs'); } catch { return null; }
  })();

  if (bcrypt) {
    const hash = await bcrypt.hash('admin123', 12);
    await prisma.user.upsert({
      where: { email: 'admin@speedler.es' },
      update: {},
      create: { email: 'admin@speedler.es', passwordHash: hash, name: 'Admin Speedler', role: 'ADMIN' },
    });
    console.log('Admin user created (admin@speedler.es / admin123)');
  } else {
    console.log('bcryptjs not found, skipping admin user');
  }

  // Read CSV
  const csvPath = path.join(process.cwd(), 'ProductosPropios.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('ProductosPropios.csv not found!');
    process.exit(1);
  }
  const content = fs.readFileSync(csvPath, 'latin1');
  const products = parseCsv(content);
  console.log(`Parsed ${products.length} products from CSV`);

  // Categories
  const catMap = new Map();
  const catIdMap = new Map();
  for (const p of products) {
    if (p.idCategoria && p.desCategoria) catMap.set(p.idCategoria, p.desCategoria);
  }
  for (const [extId, name] of catMap) {
    const slug = createSlug(name) || `cat-${extId}`;
    const cat = await prisma.category.upsert({
      where: { externalId: extId },
      update: { name },
      create: { externalId: extId, name, slug },
    });
    catIdMap.set(extId, cat.id);
  }
  console.log(`Seeded ${catMap.size} categories`);

  // Manufacturers
  const mfrMap = new Map();
  const mfrIdMap = new Map();
  for (const p of products) {
    if (p.idFabricante && p.desFabricante && p.desFabricante !== '[sin fabricante]') {
      mfrMap.set(p.idFabricante, p.desFabricante);
    }
  }
  for (const [extId, name] of mfrMap) {
    const slug = createSlug(name) || `mfr-${extId}`;
    const mfr = await prisma.manufacturer.upsert({
      where: { externalId: extId },
      update: { name },
      create: { externalId: extId, name, slug },
    });
    mfrIdMap.set(extId, mfr.id);
  }
  console.log(`Seeded ${mfrMap.size} manufacturers`);

  // Products
  let created = 0, skipped = 0;
  const usedSlugs = new Set();

  for (const p of products) {
    if (!p.referencia) { skipped++; continue; }

    let slug = createSlug(p.nombre || p.referencia);
    if (!slug) slug = `product-${p.referencia}`;
    while (usedSlugs.has(slug)) {
      slug = `${slug}-${p.referencia.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    }
    usedSlugs.add(slug);

    const salePrice = Math.round(p.coste * 1.25 * 100) / 100;
    const imageUrl = p.fotografia ? p.fotografia : null;

    try {
      await prisma.product.upsert({
        where: { sku: p.referencia },
        update: { name: p.nombre, costPrice: p.coste, salePrice, stock: p.stock, canonDigital: p.tasas, image: imageUrl },
        create: {
          sku: p.referencia,
          partNumber: p.partNumber || null,
          ean: p.upcCode || null,
          name: p.nombre || p.referencia,
          slug,
          summary: p.resumen || null,
          description: p.descripcion || null,
          specs: p.especificaciones || null,
          generalInfo: p.infoGeneral || null,
          accessories: p.accesorios || null,
          weight: p.peso,
          costPrice: p.coste,
          salePrice,
          canonDigital: p.tasas,
          isOffer: p.oferta,
          stock: p.stock,
          image: imageUrl,
          categoryId: catIdMap.get(p.idCategoria) || null,
          manufacturerId: mfrIdMap.get(p.idFabricante) || null,
          isActive: true,
        },
      });
      created++;
    } catch (e) {
      skipped++;
    }
  }
  console.log(`Products: ${created} created, ${skipped} skipped`);

  // Component types
  const types = [
    { name: 'Procesador', slug: 'cpu', sortOrder: 1, isRequired: true },
    { name: 'Placa Base', slug: 'motherboard', sortOrder: 2, isRequired: true },
    { name: 'Memoria RAM', slug: 'ram', sortOrder: 3, isRequired: true },
    { name: 'Tarjeta Grafica', slug: 'gpu', sortOrder: 4, isRequired: false },
    { name: 'Almacenamiento', slug: 'storage', sortOrder: 5, isRequired: true },
    { name: 'Fuente de Alimentacion', slug: 'psu', sortOrder: 6, isRequired: true },
    { name: 'Caja/Torre', slug: 'case', sortOrder: 7, isRequired: true },
    { name: 'Refrigeracion', slug: 'cooler', sortOrder: 8, isRequired: false },
  ];
  for (const ct of types) {
    await prisma.componentType.upsert({ where: { slug: ct.slug }, update: {}, create: ct });
  }
  console.log('Component types seeded');

  // Shipping rates
  await prisma.shippingRate.createMany({
    data: [
      { name: 'Envio estandar (hasta 5kg)', maxWeight: 5, cost: 4.95, provider: 'GLS' },
      { name: 'Envio estandar (5-15kg)', minWeight: 5, maxWeight: 15, cost: 6.95, provider: 'GLS' },
      { name: 'Envio estandar (15-30kg)', minWeight: 15, maxWeight: 30, cost: 9.95, provider: 'GLS' },
      { name: 'Envio gratuito (pedidos +100)', minPrice: 100, cost: 0, provider: 'GLS' },
    ],
    skipDuplicates: true,
  });
  console.log('Shipping rates seeded');

  // Pricing rule
  await prisma.pricingRule.upsert({
    where: { id: 'default-global' },
    update: {},
    create: { id: 'default-global', name: 'Margen global 25%', type: 'PERCENTAGE', value: 25, appliesTo: 'GLOBAL', priority: 0, isActive: true },
  });

  console.log('Seed completed!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
