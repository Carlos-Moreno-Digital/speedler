/**
 * Comprehensive Payments, Canon Digital & Recargo de Equivalencia Setup Script
 *
 * Sets up ALL payment methods, canon digital display, recargo de equivalencia,
 * and shipping configuration for the Speedler EverShop store.
 *
 * Usage:
 *   docker cp setup-payments-taxes.cjs speedler-app-1:/app/setup-payments-taxes.cjs
 *   docker exec -it speedler-app-1 node setup-payments-taxes.cjs
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

function uuid() {
  return crypto.randomUUID();
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CANON_DIGITAL_CATEGORIES = [
  { patterns: ['Disco%Duro%', 'HDD%', 'SSD%'],                         amount: 6.45, label: 'Discos duros / HDD / SSD' },
  { patterns: ['Memoria%', 'RAM%'],                                     amount: 0.24, label: 'Memorias / RAM' },
  { patterns: ['Ordenador%', 'PC%', 'Sobremesa%'],                      amount: 5.45, label: 'Ordenadores / PC / Sobremesa' },
  { patterns: ['Portatil%', 'Notebook%', 'Laptop%'],                    amount: 5.45, label: 'Portatiles / Notebooks / Laptops' },
  { patterns: ['Tablet%', 'iPad%'],                                     amount: 3.15, label: 'Tablets / iPads' },
  { patterns: ['Smartphone%', 'Movil%', 'Telefono%'],                   amount: 1.10, label: 'Smartphones / Moviles / Telefonos' },
  { patterns: ['Impresora%', 'Printer%'],                               amount: 7.50, label: 'Impresoras / Printers' },
  { patterns: ['CD%', 'DVD%', 'Blu%'],                                  amount: 0.08, label: 'CD / DVD / Blu-ray' },
  { patterns: ['USB%', 'Pendrive%', 'Flash%'],                          amount: 0.24, label: 'USB / Pendrives / Flash' },
];

const RECARGO_RATES = [
  { iva_rate: 21.00, recargo_rate: 5.20 },
  { iva_rate: 10.00, recargo_rate: 1.40 },
  { iva_rate:  4.00, recargo_rate: 0.50 },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function tableExists(client, tableName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     )`,
    [tableName]
  );
  return res.rows[0].exists;
}

async function columnExists(client, tableName, columnName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     )`,
    [tableName, columnName]
  );
  return res.rows[0].exists;
}

async function getTableColumns(client, tableName) {
  const res = await client.query(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1
     ORDER BY ordinal_position`,
    [tableName]
  );
  return res.rows;
}

function hr(title) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(70));
}

// ---------------------------------------------------------------------------
// 1. Payment Methods Setup
// ---------------------------------------------------------------------------

async function setupPaymentMethods(client) {
  hr('1. PAYMENT METHODS SETUP');

  // Check for payment-related tables
  const paymentTables = ['payment_method', 'payment_provider', 'setting'];
  for (const t of paymentTables) {
    const exists = await tableExists(client, t);
    console.log(`  Table "${t}" exists: ${exists}`);
  }

  const hasSetting = await tableExists(client, 'setting');
  if (!hasSetting) {
    console.log('\n  [WARN] "setting" table not found. Cannot configure payment settings.');
    console.log('         Run the EverShop migration first.');
    return;
  }

  // Show current setting table schema
  const settingCols = await getTableColumns(client, 'setting');
  console.log('\n  Setting table columns:', settingCols.map(c => c.column_name).join(', '));

  // -- COD (Cash on Delivery) as "Transferencia bancaria" --
  console.log('\n  Configuring COD (Transferencia bancaria)...');

  const codSettings = [
    ['codPaymentStatus', '1'],
    ['codDisplayName', 'Transferencia bancaria'],
  ];

  for (const [name, value] of codSettings) {
    // Check if setting has is_json column
    const hasIsJson = await columnExists(client, 'setting', 'is_json');
    if (hasIsJson) {
      await client.query(
        `INSERT INTO setting (uuid, name, value, is_json)
         VALUES (gen_random_uuid(), $1, $2, false)
         ON CONFLICT (name) DO UPDATE SET value = $2`,
        [name, value]
      );
    } else {
      // Try without is_json
      await client.query(
        `INSERT INTO setting (uuid, name, value)
         VALUES (gen_random_uuid(), $1, $2)
         ON CONFLICT (name) DO UPDATE SET value = $2`,
        [name, value]
      );
    }
    console.log(`    ${name} = '${value}'`);
  }

  console.log('\n  COD payment enabled as "Transferencia bancaria".');

  // -- Redsys and Sequra documentation --
  console.log('\n  --- Redsys (Tarjeta de credito/debito) ---');
  console.log('  Redsys requires extension activation. Settings needed in evershop.config.js:');
  console.log('    system.redsys.status = true');
  console.log('    system.redsys.merchantCode = "<your-merchant-code>"');
  console.log('    system.redsys.terminal = "1"');
  console.log('    system.redsys.secretKey = "<your-secret-key>"');
  console.log('    system.redsys.environment = "production" | "test"');
  console.log('  The extension registers itself via extensions/redsys/bootstrap.js');

  console.log('\n  --- SeQura (Pago aplazado) ---');
  console.log('  SeQura requires extension activation. Settings needed in evershop.config.js:');
  console.log('    system.sequra.status = true');
  console.log('    system.sequra.merchantRef = "<your-merchant-ref>"');
  console.log('    system.sequra.apiKey = "<your-api-key>"');
  console.log('    system.sequra.environment = "production" | "sandbox"');
  console.log('  The extension registers itself via extensions/sequra/bootstrap.js');

  // Verify settings were saved
  const savedSettings = await client.query(
    `SELECT name, value FROM setting WHERE name IN ('codPaymentStatus', 'codDisplayName')`
  );
  console.log('\n  Saved payment settings:');
  for (const row of savedSettings.rows) {
    console.log(`    ${row.name} = '${row.value}'`);
  }
}

// ---------------------------------------------------------------------------
// 2. Canon Digital Enhancement
// ---------------------------------------------------------------------------

async function setupCanonDigital(client) {
  hr('2. CANON DIGITAL SETUP');

  // 2a. Ensure canon_digital table exists
  console.log('  Ensuring canon_digital table exists...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS canon_digital (
      canon_id SERIAL PRIMARY KEY,
      category_pattern VARCHAR(255) NOT NULL,
      amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      description VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  console.log('  canon_digital table ready.');

  // 2b. Ensure canon_digital_amount column on product table
  const hasProduct = await tableExists(client, 'product');
  if (!hasProduct) {
    console.log('  [WARN] "product" table not found. Skipping product column addition.');
    return;
  }

  console.log('  Ensuring canon_digital_amount column on product table...');
  await client.query(`
    ALTER TABLE product
    ADD COLUMN IF NOT EXISTS canon_digital_amount DECIMAL(10,2) DEFAULT 0
  `);
  console.log('  canon_digital_amount column ready on product table.');

  // 2c. Populate canon_digital reference table
  console.log('  Populating canon_digital reference rates...');
  // Clear and re-insert for idempotency
  await client.query('DELETE FROM canon_digital');

  let insertedCount = 0;
  for (const cat of CANON_DIGITAL_CATEGORIES) {
    for (const pattern of cat.patterns) {
      await client.query(
        `INSERT INTO canon_digital (category_pattern, amount, description)
         VALUES ($1, $2, $3)`,
        [pattern, cat.amount, cat.label]
      );
      insertedCount++;
    }
  }
  console.log(`  Inserted ${insertedCount} canon digital pattern rules.`);

  // 2d. Check if category_description table exists for joining
  const hasCatDesc = await tableExists(client, 'category_description');
  const hasCategory = await tableExists(client, 'category');

  if (!hasCatDesc || !hasCategory) {
    console.log('  [WARN] category_description or category table not found.');
    console.log('         Cannot auto-update products. Manual assignment needed.');
    return;
  }

  // Check the join column name in category_description
  const catDescCols = await getTableColumns(client, 'category_description');
  const catDescColNames = catDescCols.map(c => c.column_name);
  console.log('  category_description columns:', catDescColNames.join(', '));

  // Determine the FK column for category_id in category_description
  let catFkCol = null;
  const possibleFkCols = [
    'category_description_category_id',
    'category_id',
  ];
  for (const col of possibleFkCols) {
    if (catDescColNames.includes(col)) {
      catFkCol = col;
      break;
    }
  }

  if (!catFkCol) {
    console.log('  [WARN] Could not find category FK column in category_description.');
    console.log(`         Available columns: ${catDescColNames.join(', ')}`);
    return;
  }
  console.log(`  Using FK column: category_description.${catFkCol}`);

  // Check how products link to categories
  const productCols = await getTableColumns(client, 'product');
  const productColNames = productCols.map(c => c.column_name);
  const hasCategoryId = productColNames.includes('category_id');

  if (!hasCategoryId) {
    console.log('  [WARN] product table does not have category_id column.');
    console.log('         Checking for product_category junction table...');

    const hasJunction = await tableExists(client, 'product_category');
    if (!hasJunction) {
      console.log('  [WARN] No product_category junction table found either.');
      console.log('         Cannot link products to categories for auto-update.');
      return;
    }

    // Use junction table
    console.log('  Found product_category junction table. Using it for matching.');
    const junctionCols = await getTableColumns(client, 'product_category');
    console.log('  product_category columns:', junctionCols.map(c => c.column_name).join(', '));
  }

  // 2e. Update ALL products with canon digital amounts based on category names
  console.log('\n  Updating product canon digital amounts by category...\n');

  // First reset all to 0
  await client.query('UPDATE product SET canon_digital_amount = 0');

  const summary = [];
  let totalUpdated = 0;

  for (const cat of CANON_DIGITAL_CATEGORIES) {
    // Build OR conditions for all patterns in this category
    const conditions = cat.patterns
      .map((_, i) => `LOWER(cdesc.name) LIKE LOWER($${i + 1})`)
      .join(' OR ');

    let updateQuery;
    if (hasCategoryId) {
      updateQuery = `
        UPDATE product p
        SET canon_digital_amount = ${cat.amount}
        FROM category c
        JOIN category_description cdesc
          ON cdesc.${catFkCol} = c.category_id
        WHERE p.category_id = c.category_id
          AND (${conditions})
      `;
    } else {
      // Junction table path
      updateQuery = `
        UPDATE product p
        SET canon_digital_amount = ${cat.amount}
        FROM product_category pc
        JOIN category c ON c.category_id = pc.category_id
        JOIN category_description cdesc
          ON cdesc.${catFkCol} = c.category_id
        WHERE p.product_id = pc.product_id
          AND (${conditions})
      `;
    }

    const result = await client.query(updateQuery, cat.patterns);
    const count = result.rowCount;
    totalUpdated += count;
    summary.push({ label: cat.label, amount: cat.amount, count });
    console.log(`    ${cat.label.padEnd(40)} ${cat.amount.toFixed(2)} EUR  -> ${count} product(s)`);
  }

  console.log(`\n  Total products updated with canon digital: ${totalUpdated}`);

  // Show breakdown table
  console.log('\n  --- Canon Digital Summary ---');
  console.log('  ' + 'Category'.padEnd(42) + 'Amount'.padStart(8) + '  Products'.padStart(10));
  console.log('  ' + '-'.repeat(62));
  for (const row of summary) {
    console.log(
      '  ' +
      row.label.padEnd(42) +
      (row.amount.toFixed(2) + ' EUR').padStart(8) +
      row.count.toString().padStart(10)
    );
  }
}

// ---------------------------------------------------------------------------
// 3. Recargo de Equivalencia
// ---------------------------------------------------------------------------

async function setupRecargoEquivalencia(client) {
  hr('3. RECARGO DE EQUIVALENCIA SETUP');

  // 3a. Ensure recargo_equivalencia table exists
  console.log('  Ensuring recargo_equivalencia table exists...');
  await client.query(`
    CREATE TABLE IF NOT EXISTS recargo_equivalencia (
      recargo_id SERIAL PRIMARY KEY,
      iva_rate DECIMAL(5,2) NOT NULL UNIQUE,
      recargo_rate DECIMAL(5,2) NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
  console.log('  recargo_equivalencia table ready.');

  // 3b. Insert/update the 3 standard Spanish rates
  console.log('  Inserting standard Spanish recargo de equivalencia rates...');

  for (const rate of RECARGO_RATES) {
    await client.query(
      `INSERT INTO recargo_equivalencia (iva_rate, recargo_rate, description)
       VALUES ($1, $2, $3)
       ON CONFLICT (iva_rate) DO UPDATE SET recargo_rate = $2, description = $3`,
      [
        rate.iva_rate,
        rate.recargo_rate,
        `IVA ${rate.iva_rate}% -> Recargo ${rate.recargo_rate}%`
      ]
    );
    console.log(`    IVA ${rate.iva_rate.toFixed(0).padStart(2)}% -> Recargo ${rate.recargo_rate.toFixed(1)}%`);
  }

  console.log('\n  Recargo de equivalencia is for backend calculation.');
  console.log('  Customers flagged with recargo will have it applied automatically.');
  console.log('  The application logic lives in src/lib/recargo-equivalencia.ts');

  // Verify
  const saved = await client.query('SELECT * FROM recargo_equivalencia ORDER BY iva_rate DESC');
  console.log('\n  Saved rates:');
  for (const row of saved.rows) {
    console.log(`    IVA ${parseFloat(row.iva_rate).toFixed(0)}% -> Recargo ${parseFloat(row.recargo_rate).toFixed(1)}%`);
  }
}

// ---------------------------------------------------------------------------
// 4. Shipping Configuration
// ---------------------------------------------------------------------------

async function setupShipping(client) {
  hr('4. SHIPPING CONFIGURATION');

  const hasShippingZone = await tableExists(client, 'shipping_zone');
  const hasShippingZoneMethod = await tableExists(client, 'shipping_zone_method');

  console.log(`  shipping_zone table exists:        ${hasShippingZone}`);
  console.log(`  shipping_zone_method table exists:  ${hasShippingZoneMethod}`);

  if (!hasShippingZone) {
    console.log('\n  Creating shipping_zone table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS shipping_zone (
        shipping_zone_id SERIAL PRIMARY KEY,
        uuid VARCHAR(36) NOT NULL DEFAULT gen_random_uuid()::text,
        name VARCHAR(255) NOT NULL,
        country VARCHAR(2) NOT NULL,
        province VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    console.log('  shipping_zone table created.');
  }

  // Check if Spain zone exists
  const existing = await client.query(
    `SELECT shipping_zone_id, name FROM shipping_zone WHERE country = 'ES' LIMIT 1`
  );

  let spainZoneId;
  if (existing.rows.length > 0) {
    spainZoneId = existing.rows[0].shipping_zone_id;
    console.log(`\n  Spain shipping zone already exists (id: ${spainZoneId}, name: "${existing.rows[0].name}").`);
  } else {
    const hasUuid = await columnExists(client, 'shipping_zone', 'uuid');
    let ins;
    if (hasUuid) {
      ins = await client.query(
        `INSERT INTO shipping_zone (uuid, name, country)
         VALUES ($1, $2, $3) RETURNING shipping_zone_id`,
        [uuid(), 'Espana - Peninsula', 'ES']
      );
    } else {
      ins = await client.query(
        `INSERT INTO shipping_zone (name, country)
         VALUES ($1, $2) RETURNING shipping_zone_id`,
        ['Espana - Peninsula', 'ES']
      );
    }
    spainZoneId = ins.rows[0].shipping_zone_id;
    console.log(`\n  Created Spain shipping zone (id: ${spainZoneId}).`);
  }

  // Check shipping methods
  if (hasShippingZoneMethod) {
    const methods = await client.query(
      `SELECT name, cost FROM shipping_zone_method WHERE zone_id = $1 ORDER BY name`,
      [spainZoneId]
    );
    if (methods.rows.length > 0) {
      console.log(`\n  Existing shipping methods for Spain zone (${methods.rows.length}):`);
      for (const m of methods.rows) {
        console.log(`    - ${m.name}: ${parseFloat(m.cost).toFixed(2)} EUR`);
      }
    } else {
      console.log('\n  No shipping methods configured for Spain zone.');
      console.log('  Run setup-shipping-gls.cjs for GLS shipping rates.');
    }
  } else {
    console.log('\n  shipping_zone_method table not found.');
    console.log('  Run setup-shipping-gls.cjs to create shipping methods and GLS rates.');
  }

  console.log('\n  Shipping configuration summary:');
  console.log('    [OK]     Spain (ES) shipping zone exists');
  console.log('    [CHECK]  Run setup-shipping-gls.cjs for GLS weight-based rates');
  console.log('    [MANUAL] Canary Islands / Baleares zones need manual setup in admin');
  console.log('    [MANUAL] International shipping zones need manual setup in admin');
}

// ---------------------------------------------------------------------------
// 5. Summary
// ---------------------------------------------------------------------------

async function printSummary(client) {
  hr('COMPREHENSIVE SETUP SUMMARY');

  // Payment settings
  const paymentSettings = await client.query(
    `SELECT name, value FROM setting WHERE name LIKE 'cod%' ORDER BY name`
  );
  console.log('\n  Payment Methods:');
  console.log('    COD / Transferencia bancaria:');
  for (const row of paymentSettings.rows) {
    console.log(`      ${row.name} = '${row.value}'`);
  }
  if (paymentSettings.rows.length === 0) {
    console.log('      [WARN] No COD settings found in setting table.');
  }
  console.log('    Redsys (tarjeta): Requires extension config in evershop.config.js');
  console.log('    SeQura (aplazado): Requires extension config in evershop.config.js');

  // Canon digital
  const canonCount = await client.query('SELECT COUNT(*) AS cnt FROM canon_digital');
  const productsWithCanon = await client.query(
    `SELECT COUNT(*) AS cnt FROM product WHERE canon_digital_amount > 0`
  ).catch(() => ({ rows: [{ cnt: 0 }] }));
  console.log('\n  Canon Digital:');
  console.log(`    Pattern rules defined: ${canonCount.rows[0].cnt}`);
  console.log(`    Products with canon > 0: ${productsWithCanon.rows[0].cnt}`);

  // Recargo
  const recargoCount = await client.query('SELECT COUNT(*) AS cnt FROM recargo_equivalencia');
  console.log('\n  Recargo de Equivalencia:');
  console.log(`    Rates configured: ${recargoCount.rows[0].cnt}`);

  // Shipping
  const zoneCount = await client.query(
    `SELECT COUNT(*) AS cnt FROM shipping_zone WHERE country = 'ES'`
  ).catch(() => ({ rows: [{ cnt: 0 }] }));
  console.log('\n  Shipping:');
  console.log(`    Spain zones: ${zoneCount.rows[0].cnt}`);

  // Products overview
  const productCount = await client.query('SELECT COUNT(*) AS cnt FROM product').catch(() => ({ rows: [{ cnt: 0 }] }));
  console.log('\n  Store Overview:');
  console.log(`    Total products: ${productCount.rows[0].cnt}`);

  console.log('\n  --- What was configured ---');
  console.log('    [OK] COD payment enabled as "Transferencia bancaria"');
  console.log('    [OK] Canon digital table & product amounts updated');
  console.log('    [OK] Recargo de equivalencia rates (21%->5.2%, 10%->1.4%, 4%->0.5%)');
  console.log('    [OK] Spain shipping zone ensured');

  console.log('\n  --- What needs manual setup in admin ---');
  console.log('    [ ] Redsys: Add merchant credentials to evershop.config.js');
  console.log('    [ ] SeQura: Add API key and merchant ref to evershop.config.js');
  console.log('    [ ] GLS shipping rates (run setup-shipping-gls.cjs)');
  console.log('    [ ] Additional shipping zones (Canarias, Baleares, international)');
  console.log('    [ ] Verify canon digital amounts match current BOE rates');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Speedler EverShop - Comprehensive Payments & Taxes Setup');
    console.log('=========================================================');
    console.log(`Started at: ${new Date().toISOString()}`);

    await setupPaymentMethods(client);
    await setupCanonDigital(client);
    await setupRecargoEquivalencia(client);
    await setupShipping(client);
    await printSummary(client);

    await client.query('COMMIT');
    console.log('\nAll changes committed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nError during setup - all changes rolled back:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
