/**
 * Supplier Sync Script for EverShop
 * Downloads product data from 7 configured suppliers and updates the EverShop database.
 *
 * Usage: node run-supplier-sync.cjs
 * Run inside the EverShop Docker container where `pg` is available.
 *
 * Uses only Node.js built-in modules (no npm packages except pg which is already available).
 */

const { Client } = require('pg');
const https = require('https');
const http = require('http');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const DB_CONFIG = {
  host: 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
};

// ---------------------------------------------------------------------------
// Supplier definitions (mirrors seed-suppliers.js)
// ---------------------------------------------------------------------------
const suppliers = [
  {
    supplierName: 'DMI',
    syncType: 'CSV_URL',
    endpoint: 'https://www.dmi.es/catalogo.aspx?u=CT033377&p=FGAAIOXG',
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
      manufacturer: 'MARCA'
    }
  },
  {
    supplierName: 'Globomatik',
    syncType: 'CSV_URL',
    endpoint: 'http://multimedia.globomatik.net/csv/import.php?username=2131&password=62300314&mode=all&type=default',
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
      manufacturer: 'Marca'
    }
  },
  {
    supplierName: 'Desyman',
    syncType: 'CSV_URL',
    endpoint: 'https://desyman.com/module/ma_desyman/download_rate_customer?token=a8467dfc86e382a04251c0e90506e561&format=CSV',
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
      manufacturer: 'marca'
    }
  },
  {
    supplierName: 'AS Europa',
    syncType: 'CSV_URL',
    endpoint: 'https://www.aseuropa.com/descarga-tarifa?tipo=csv&user=008364&code=6e62641e25c1d254e7502d817478819a',
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
      manufacturer: 'FABRICANTE'
    }
  },
  {
    supplierName: 'Infortisa',
    syncType: 'CSV_URL',
    endpoint: 'https://apiv2.infortisa.com/api/Tarifa/GetFileV5EXT?user=1E5608A7-3910-4803-B350-D5E8A2B48F0E',
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
      manufacturer: 'NOMFABRICANTE'
    }
  },
  {
    supplierName: 'Compuspain',
    syncType: 'CSV_URL',
    endpoint: 'https://www.compuspain.eu/download/__cp_VSW/Services/outProductosTarifaDatos/?uID=C009513&uLG=WC009513&uPW=W760_7636&urVal=csv&uFR=1',
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
      manufacturer: 'FABRICANTE'
    }
  },
  {
    supplierName: 'Supercomp',
    syncType: 'FTP',
    endpoint: 'ftp.supercompdigital.info',
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
      manufacturer: 'MARCA'
    }
  }
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Download CSV from a URL, following redirects. Uses only Node.js built-in modules. */
function downloadCsv(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 30000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadCsv(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} from ${url}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/** Parse a decimal string that may use European formatting ("1.234,56") */
function parseDecimal(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return 0;
  const cleaned = str.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Parse integer, default 0 */
function parseIntSafe(str) {
  if (!str || typeof str !== 'string' || str.trim() === '') return 0;
  const n = parseInt(str.trim(), 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Parse CSV content into an array of objects using header names.
 * Handles quoted fields and the given separator.
 */
function parseCsvToObjects(csvText, separator) {
  if (!csvText || !csvText.trim()) return [];

  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headerLine = lines[0];
  const headers = splitCsvLine(headerLine, separator).map(h => h.trim());

  const objects = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const fields = splitCsvLine(line, separator);
    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = (fields[j] || '').trim();
    }
    objects.push(obj);
  }

  return objects;
}

/**
 * Split a CSV line respecting quoted fields.
 */
function splitCsvLine(line, separator) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === separator) {
        fields.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== Supplier Sync Script ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  console.log(`Suppliers configured: ${suppliers.length}\n`);

  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected to PostgreSQL');

  try {
    // ------------------------------------------------------------------
    // 1. Ensure supplier_sync table exists
    // ------------------------------------------------------------------
    console.log('\n--- Ensuring supplier_sync table exists ---');
    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_sync (
        supplier_sync_id SERIAL PRIMARY KEY,
        supplier_name VARCHAR(255) UNIQUE NOT NULL,
        endpoint TEXT NOT NULL,
        field_mapping JSONB DEFAULT '{}',
        last_sync_at TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true
      )
    `);
    console.log('supplier_sync table ready.');

    // ------------------------------------------------------------------
    // 2. Upsert the 7 suppliers
    // ------------------------------------------------------------------
    console.log('\n--- Upserting supplier records ---');
    for (const s of suppliers) {
      await client.query(
        `INSERT INTO supplier_sync (supplier_name, endpoint, field_mapping, is_active)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (supplier_name)
         DO UPDATE SET
           endpoint = EXCLUDED.endpoint,
           field_mapping = EXCLUDED.field_mapping,
           is_active = true`,
        [s.supplierName, s.endpoint, JSON.stringify(s.fieldMapping)]
      );
      console.log(`  Upserted: ${s.supplierName}`);
    }

    // ------------------------------------------------------------------
    // 3. Discover product_image schema
    // ------------------------------------------------------------------
    console.log('\n--- Checking product_image table schema ---');
    const imgCols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'product_image' ORDER BY ordinal_position"
    );
    const imageColumnNames = imgCols.rows.map(r => r.column_name);
    console.log(`  product_image columns: ${imageColumnNames.join(', ') || '(table not found)'}`);

    // Determine which columns exist for inserting images
    const hasProductImageTable = imageColumnNames.length > 0;
    const hasImageCol = imageColumnNames.includes('image');
    const hasOriginImageCol = imageColumnNames.includes('origin_image');
    const hasProductImageProductId = imageColumnNames.includes('product_image_product_id');

    // ------------------------------------------------------------------
    // 4. Load existing products for matching
    // ------------------------------------------------------------------
    console.log('\n--- Loading existing products for matching ---');
    const existingProducts = await client.query(`
      SELECT p.product_id, p.sku,
             pd.name AS product_name
      FROM product p
      LEFT JOIN product_description pd ON pd.product_description_product_id = p.product_id
    `);
    console.log(`  Found ${existingProducts.rows.length} existing products`);

    // Build SKU lookup map
    const skuMap = new Map();
    for (const row of existingProducts.rows) {
      if (row.sku) {
        skuMap.set(row.sku.trim(), row);
      }
    }

    // Build partNumber lookup - check if product table has a part_number column
    const productCols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'product' ORDER BY ordinal_position"
    );
    const productColumnNames = productCols.rows.map(r => r.column_name);
    const hasPartNumberCol = productColumnNames.includes('part_number');
    console.log(`  product table columns: ${productColumnNames.join(', ')}`);
    console.log(`  Has part_number column: ${hasPartNumberCol}`);

    const partNumberMap = new Map();
    if (hasPartNumberCol) {
      const pnRows = await client.query(`
        SELECT p.product_id, p.sku, p.part_number,
               pd.name AS product_name
        FROM product p
        LEFT JOIN product_description pd ON pd.product_description_product_id = p.product_id
        WHERE p.part_number IS NOT NULL AND p.part_number != ''
      `);
      for (const row of pnRows.rows) {
        partNumberMap.set(row.part_number.trim(), row);
      }
      console.log(`  Loaded ${partNumberMap.size} products with part numbers`);
    }

    // Check if product_inventory table exists and its schema
    const invCols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'product_inventory' ORDER BY ordinal_position"
    );
    const inventoryColumnNames = invCols.rows.map(r => r.column_name);
    const hasInventoryTable = inventoryColumnNames.length > 0;
    console.log(`  product_inventory columns: ${inventoryColumnNames.join(', ') || '(table not found)'}`);

    // ------------------------------------------------------------------
    // 5. Process each supplier
    // ------------------------------------------------------------------
    const results = {};

    for (const supplier of suppliers) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Processing supplier: ${supplier.supplierName}`);
      console.log(`${'='.repeat(60)}`);

      const result = {
        matched: 0,
        namesUpdated: 0,
        stockUpdated: 0,
        imagesInserted: 0,
        skipped: 0,
        errors: []
      };

      try {
        // Skip FTP suppliers
        if (supplier.syncType === 'FTP') {
          console.log(`  SKIPPING: ${supplier.supplierName} uses FTP protocol, which is not supported in this script.`);
          console.log(`  Use a dedicated FTP sync tool for Supercomp.`);
          results[supplier.supplierName] = { ...result, skipped: 'FTP not supported' };
          continue;
        }

        // Download CSV
        console.log(`  Downloading CSV from: ${supplier.endpoint.substring(0, 80)}...`);
        let csvText;
        try {
          csvText = await downloadCsv(supplier.endpoint);
        } catch (dlErr) {
          console.error(`  ERROR downloading CSV: ${dlErr.message}`);
          result.errors.push(`Download failed: ${dlErr.message}`);
          results[supplier.supplierName] = result;
          continue;
        }
        console.log(`  Downloaded ${csvText.length} bytes`);

        if (!csvText || csvText.length < 10) {
          console.log(`  WARNING: CSV content is empty or too small. Skipping.`);
          result.errors.push('Empty or invalid CSV content');
          results[supplier.supplierName] = result;
          continue;
        }

        // Parse CSV
        const mapping = supplier.fieldMapping;
        const sep = mapping.separator || ';';
        const products = parseCsvToObjects(csvText, sep);
        console.log(`  Parsed ${products.length} products from CSV`);

        if (products.length === 0) {
          console.log(`  WARNING: No products parsed. Check CSV format.`);
          result.errors.push('No products parsed from CSV');
          results[supplier.supplierName] = result;
          continue;
        }

        // Log first product keys for debugging
        if (products.length > 0) {
          console.log(`  CSV columns: ${Object.keys(products[0]).join(', ')}`);
        }

        // Process each product
        for (let i = 0; i < products.length; i++) {
          const prod = products[i];

          try {
            const supplierSku = mapping.sku ? (prod[mapping.sku] || '').trim() : '';
            const supplierPartNumber = mapping.partNumber ? (prod[mapping.partNumber] || '').trim() : '';
            const supplierName = mapping.name ? (prod[mapping.name] || '').trim() : '';
            const supplierImage = mapping.image ? (prod[mapping.image] || '').trim() : '';
            const supplierStock = mapping.stock ? parseIntSafe(prod[mapping.stock]) : 0;

            if (!supplierSku && !supplierPartNumber) {
              result.skipped++;
              continue;
            }

            // Try to match by SKU first, then by partNumber
            let matchedProduct = null;
            if (supplierSku) {
              matchedProduct = skuMap.get(supplierSku);
            }
            if (!matchedProduct && supplierPartNumber && partNumberMap.size > 0) {
              matchedProduct = partNumberMap.get(supplierPartNumber);
            }

            if (!matchedProduct) {
              result.skipped++;
              continue;
            }

            result.matched++;
            const productId = matchedProduct.product_id;
            const currentName = matchedProduct.product_name || '';

            // UPDATE name: only if the current name equals the SKU (i.e., product was imported without a real name)
            if (supplierName && currentName && currentName === matchedProduct.sku) {
              await client.query(
                `UPDATE product_description SET name = $1 WHERE product_description_product_id = $2`,
                [supplierName, productId]
              );
              result.namesUpdated++;
            }

            // UPDATE inventory: add supplier stock
            if (supplierStock > 0 && hasInventoryTable) {
              const existingInv = await client.query(
                `SELECT qty FROM product_inventory WHERE product_inventory_product_id = $1`,
                [productId]
              );
              if (existingInv.rows.length > 0) {
                await client.query(
                  `UPDATE product_inventory SET qty = qty + $1, stock_availability = true WHERE product_inventory_product_id = $2`,
                  [supplierStock, productId]
                );
              } else {
                await client.query(
                  `INSERT INTO product_inventory (product_inventory_product_id, qty, manage_stock, stock_availability)
                   VALUES ($1, $2, true, true)`,
                  [productId, supplierStock]
                );
              }
              result.stockUpdated++;
            }

            // INSERT image if product has no image and supplier provides one
            if (supplierImage && hasProductImageTable && hasProductImageProductId) {
              const existingImages = await client.query(
                `SELECT product_image_id FROM product_image WHERE product_image_product_id = $1 LIMIT 1`,
                [productId]
              );
              if (existingImages.rows.length === 0) {
                // Build insert based on available columns
                if (hasOriginImageCol && hasImageCol) {
                  await client.query(
                    `INSERT INTO product_image (product_image_product_id, origin_image, image, is_main)
                     VALUES ($1, $2, $3, true)`,
                    [productId, supplierImage, supplierImage]
                  );
                  result.imagesInserted++;
                } else if (hasImageCol) {
                  await client.query(
                    `INSERT INTO product_image (product_image_product_id, image, is_main)
                     VALUES ($1, $2, true)`,
                    [productId, supplierImage]
                  );
                  result.imagesInserted++;
                } else if (hasOriginImageCol) {
                  await client.query(
                    `INSERT INTO product_image (product_image_product_id, origin_image, is_main)
                     VALUES ($1, $2, true)`,
                    [productId, supplierImage]
                  );
                  result.imagesInserted++;
                }
              }
            }
          } catch (prodErr) {
            result.errors.push(`Row ${i}: ${prodErr.message}`);
            if (result.errors.length <= 5) {
              console.error(`  ERROR on row ${i}: ${prodErr.message}`);
            }
          }

          // Log progress every 5000 products
          if ((i + 1) % 5000 === 0) {
            console.log(`  Progress: ${i + 1}/${products.length} (matched: ${result.matched}, names: ${result.namesUpdated}, stock: ${result.stockUpdated}, images: ${result.imagesInserted})`);
          }
        }

        // Update last_sync_at for this supplier
        await client.query(
          `UPDATE supplier_sync SET last_sync_at = NOW() WHERE supplier_name = $1`,
          [supplier.supplierName]
        );

        console.log(`  Results for ${supplier.supplierName}:`);
        console.log(`    Matched: ${result.matched}`);
        console.log(`    Names updated: ${result.namesUpdated}`);
        console.log(`    Stock updated: ${result.stockUpdated}`);
        console.log(`    Images inserted: ${result.imagesInserted}`);
        console.log(`    Skipped (no match): ${result.skipped}`);
        if (result.errors.length > 0) {
          console.log(`    Errors: ${result.errors.length}`);
        }

      } catch (supplierErr) {
        console.error(`  FATAL ERROR processing ${supplier.supplierName}: ${supplierErr.message}`);
        result.errors.push(`Fatal: ${supplierErr.message}`);
      }

      results[supplier.supplierName] = result;
    }

    // ------------------------------------------------------------------
    // 6. Summary
    // ------------------------------------------------------------------
    console.log(`\n${'='.repeat(60)}`);
    console.log('SYNC SUMMARY');
    console.log(`${'='.repeat(60)}`);

    let totalMatched = 0;
    let totalNames = 0;
    let totalStock = 0;
    let totalImages = 0;
    let totalErrors = 0;

    for (const [name, r] of Object.entries(results)) {
      if (typeof r.skipped === 'string') {
        console.log(`  ${name}: ${r.skipped}`);
        continue;
      }
      console.log(`  ${name}: matched=${r.matched}, names=${r.namesUpdated}, stock=${r.stockUpdated}, images=${r.imagesInserted}, errors=${r.errors.length}`);
      totalMatched += r.matched || 0;
      totalNames += r.namesUpdated || 0;
      totalStock += r.stockUpdated || 0;
      totalImages += r.imagesInserted || 0;
      totalErrors += (r.errors || []).length;
    }

    console.log(`\n  TOTALS: matched=${totalMatched}, names=${totalNames}, stock=${totalStock}, images=${totalImages}, errors=${totalErrors}`);
    console.log(`\nFinished at: ${new Date().toISOString()}`);

  } catch (err) {
    console.error('FATAL ERROR:', err);
    throw err;
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
