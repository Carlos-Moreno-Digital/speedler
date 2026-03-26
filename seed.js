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
    const nombre = (cols[10] || '').trim();
    const referencia = (cols[2] || '').trim();
    if (!referencia) continue;
    products.push({
      idCategoria: parseInt(cols[0]) || 0,
      idFabricante: parseInt(cols[1]) || 0,
      referencia,
      partNumber: (cols[3] || '').trim(),
      upcCode: (cols[4] || '').trim(),
      peso: parseFloat((cols[5] || '0').replace(',', '.')) || 0,
      fotografia: (cols[6] || '').trim(),
      oferta: cols[7] === '1',
      fechaInicioOferta: (cols[8] || '').trim(),
      fechaFinOferta: (cols[9] || '').trim(),
      nombre: nombre || referencia,
      resumen: (cols[11] || '').trim(),
      descripcion: (cols[12] || '').trim(),
      infoGeneral: (cols[13] || '').trim(),
      especificaciones: (cols[14] || '').trim(),
      accesorios: (cols[15] || '').trim(),
      stock: parseInt(cols[16]) || 0,
      tasas: parseFloat((cols[18] || '0').replace(',', '.')) || 0,
      coste: coste,
      desCategoria: (cols[20] || '').trim(),
      desFabricante: (cols[21] || '').trim(),
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

  // Read CSV - try latin1 first, fallback to utf8
  const csvPath = path.join(process.cwd(), 'ProductosPropios.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('ProductosPropios.csv not found!');
    process.exit(1);
  }
  let content = fs.readFileSync(csvPath, 'latin1');
  let products = parseCsv(content);
  // Verify names parsed - if all empty, try utf8
  const namedCount = products.filter(p => p.nombre && p.nombre !== p.referencia).length;
  if (namedCount === 0 && products.length > 0) {
    console.log('latin1 parsing produced no names, trying utf8...');
    content = fs.readFileSync(csvPath, 'utf8');
    products = parseCsv(content);
  }
  console.log(`Parsed ${products.length} products from CSV`);
  if (products.length > 0) {
    console.log(`Sample product: "${products[0].nombre}" (${products[0].referencia})`);
  }

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
    const imageUrl = null; // Supplier image paths (e.g. /01901349.JPG) don't resolve to hosted URLs

    try {
      await prisma.product.upsert({
        where: { sku: p.referencia },
        update: { name: p.nombre || undefined, costPrice: p.coste, salePrice, stock: p.stock, canonDigital: p.tasas, image: imageUrl },
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

  // Supplier sync providers
  const suppliers = [
    {
      supplierName: 'DMI',
      syncType: 'CSV_URL',
      endpoint: 'https://www.dmi.es/catalogo.aspx?u=CT033377&p=FGAAIOXG',
      syncIntervalMinutes: 360,
      fieldMapping: {
        separator: ';',
        sku: 'ARTICULO',
        name: 'DENOMINA',
        partNumber: 'PARTNUMBER',
        ean: 'EAN',
        image: 'IMAGEN',
        costPrice: 'COMPRA',
        stock: 'STOCK',
        category: 'SUBCATEGORIADEPRODUCTO',
        manufacturer: 'MARCA',
        weight: 'PESO',
        canonDigital: 'PRECIOCANO',
        description: 'SHORTDESC',
        specs: 'LONGDESC',
      },
    },
    {
      supplierName: 'Globomatik',
      syncType: 'CSV_URL',
      endpoint: 'http://multimedia.globomatik.net/csv/import.php?username=2131&password=62300314&mode=all&type=default',
      syncIntervalMinutes: 360,
      fieldMapping: {
        separator: ';',
        sku: 'codigo',
        name: 'Descripcion',
        partNumber: 'Part Number',
        ean: 'EAN',
        image: 'Imagen HD',
        costPrice: 'Precio',
        stock: 'Stock',
        category: 'Familia',
        manufacturer: 'Marca',
        weight: 'Peso',
        canonDigital: 'Canon',
        description: 'Descripcion Resumen',
        specs: 'Descripcion Larga',
      },
    },
    {
      supplierName: 'Desyman',
      syncType: 'CSV_URL',
      endpoint: 'https://desyman.com/module/ma_desyman/download_rate_customer?token=a8467dfc86e382a04251c0e90506e561&format=CSV',
      syncIntervalMinutes: 360,
      fieldMapping: {
        separator: ';',
        sku: 'codigo',
        name: 'descripcion',
        partNumber: 'pn',
        ean: 'ean',
        image: 'foto',
        costPrice: 'precio',
        stock: 'stock',
        category: 'familia',
        manufacturer: 'marca',
        weight: 'peso',
        canonDigital: 'canon',
        description: 'caracteristicas',
      },
    },
    {
      supplierName: 'AS Europa',
      syncType: 'CSV_URL',
      endpoint: 'https://www.aseuropa.com/descarga-tarifa?tipo=csv&user=008364&code=6e62641e25c1d254e7502d817478819a',
      syncIntervalMinutes: 360,
      fieldMapping: {
        separator: ';',
        sku: 'COD_INTERNO',
        name: 'NOMBRE',
        partNumber: 'REF_FABRICANTE',
        ean: 'EAN',
        image: 'FOTO',
        costPrice: 'PRECIO',
        stock: 'STOCK',
        category: 'FAMILIA',
        manufacturer: 'FABRICANTE',
        weight: 'PESO',
        canonDigital: 'CANON',
        description: 'INFO_CORTA',
        specs: 'ESPECIFICACIONES_TECNICAS',
      },
    },
    {
      supplierName: 'Infortisa',
      syncType: 'CSV_URL',
      endpoint: 'https://apiv2.infortisa.com/api/Tarifa/GetFileV5EXT?user=1E5608A7-3910-4803-B350-D5E8A2B48F0E',
      syncIntervalMinutes: 360,
      fieldMapping: {
        separator: ';',
        sku: 'CODIGOINTERNO',
        name: 'TITULO',
        partNumber: 'REFFABRICANTE',
        ean: 'EAN/UPC',
        image: 'IMAGEN',
        costPrice: 'PRECIOSINCANON',
        stock: 'STOCKCENTRAL',
        category: 'TITULOSUBFAMILIA',
        manufacturer: 'NOMFABRICANTE',
        weight: 'PESO',
        canonDigital: 'CANONLPI',
        description: 'DESCRIPTION',
      },
    },
    {
      supplierName: 'Supercomp',
      syncType: 'FTP',
      endpoint: 'ftp.supercompdigital.info',
      credentials: JSON.stringify({ user: 'cli10085', password: 'scmay9339', port: 21, filePattern: 'catalogo_*.txt' }),
      syncIntervalMinutes: 360,
      fieldMapping: {
        separator: ';',
        sku: 'ID',
        name: 'NOMBREARTICULO',
        partNumber: 'CODIGOFABRICANTE',
        ean: 'EAN',
        image: 'IMAGEN',
        costPrice: 'PRECIO',
        stock: 'STOCK',
        category: 'FAMILIA',
        manufacturer: 'MARCA',
        weight: 'PESO',
        canonDigital: 'CANON',
        description: 'DESCRIPCION',
        specs: 'CARACTERISTICASHTML',
      },
    },
    {
      supplierName: 'Compuspain',
      syncType: 'CSV_URL',
      endpoint: 'https://www.compuspain.eu/download/__cp_VSW/Services/outProductosTarifaDatos/?uID=C009513&uLG=WC009513&uPW=W760_7636&urVal=csv&uFR=1',
      syncIntervalMinutes: 360,
      fieldMapping: {
        separator: ';',
        sku: 'ARTCODIGO',
        name: 'ARTNOMBRE',
        partNumber: 'ARTPARTNUMBER',
        ean: 'ARTEAN',
        image: null,
        costPrice: 'ARTPRECIOUNIDAD',
        stock: 'ARTSTOCKDISPONIBLE',
        category: 'ARTFAMILIANOMBRE',
        manufacturer: 'FABRICANTE',
        weight: 'ARTPESO',
        canonDigital: 'ARTRECURSOIMPORTE',
      },
    },
  ];

  for (const s of suppliers) {
    await prisma.supplierSync.upsert({
      where: { supplierName: s.supplierName },
      update: {
        syncType: s.syncType,
        endpoint: s.endpoint,
        credentials: s.credentials || null,
        syncIntervalMinutes: s.syncIntervalMinutes,
        fieldMapping: s.fieldMapping,
        isActive: true,
      },
      create: {
        supplierName: s.supplierName,
        syncType: s.syncType,
        endpoint: s.endpoint,
        credentials: s.credentials || null,
        syncIntervalMinutes: s.syncIntervalMinutes,
        fieldMapping: s.fieldMapping,
        isActive: true,
      },
    });
  }
  console.log(`Seeded ${suppliers.length} supplier sync providers`);

  console.log('Seed completed!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
