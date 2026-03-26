import { pool } from '@evershop/evershop/src/lib/postgres/connection.js';
import https from 'https';
import http from 'http';

/**
 * Parse CSV content into array of objects using the first row as headers.
 * Handles quoted fields and different separators.
 */
function parseCsv(content, separator = ';') {
  const lines = content.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0], separator).map((h) => h.trim());
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], separator);
    if (cols.length < 2) continue;

    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (cols[j] || '').trim();
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCsvLine(line, separator) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === separator) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Download content from a URL. Returns the body as a string.
 */
function downloadCsv(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const request = client.get(url, { timeout: 120000 }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadCsv(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }

      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        // Try UTF-8, fallback to latin1
        let text = buffer.toString('utf8');
        if (text.includes('�')) {
          text = buffer.toString('latin1');
        }
        resolve(text);
      });
      res.on('error', reject);
    });
    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error(`Timeout downloading ${url}`));
    });
  });
}

/**
 * Create a URL-friendly slug from text
 */
function createSlug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100);
}

/**
 * Extract a mapped field value from a row using the field_mapping config
 */
function getMappedValue(row, fieldMapping, fieldName) {
  const columnName = fieldMapping[fieldName];
  if (!columnName) return null;
  return row[columnName] || null;
}

/**
 * Parse a numeric value from a string (handles comma decimals)
 */
function parseNumber(val) {
  if (!val) return 0;
  return parseFloat(String(val).replace(',', '.')) || 0;
}

/**
 * Parse an integer from a string
 */
function parseInt10(val) {
  if (!val) return 0;
  return parseInt(String(val).replace(/[^0-9-]/g, ''), 10) || 0;
}

/**
 * Sync a single supplier: download CSV, parse, upsert products
 */
async function syncSupplier(supplier) {
  const client = await pool.connect();
  const fieldMapping = supplier.field_mapping || {};
  const separator = fieldMapping.separator || ';';
  const errors = [];
  let productsCreated = 0;
  let productsUpdated = 0;
  let productsDeactivated = 0;

  // Create sync log entry
  const logResult = await client.query(
    `INSERT INTO sync_log (supplier_sync_id, status) VALUES ($1, 'RUNNING') RETURNING sync_log_id`,
    [supplier.supplier_sync_id]
  );
  const syncLogId = logResult.rows[0].sync_log_id;

  try {
    // Skip FTP suppliers for now (would need an FTP library)
    if (supplier.sync_type === 'FTP') {
      console.log(`[supplier-sync] Skipping FTP supplier: ${supplier.supplier_name} (FTP not yet implemented)`);
      await client.query(
        `UPDATE sync_log SET status = 'SKIPPED', completed_at = NOW(),
         errors = $1 WHERE sync_log_id = $2`,
        [JSON.stringify([{ message: 'FTP sync not yet implemented' }]), syncLogId]
      );
      await client.query(
        `UPDATE supplier_sync SET last_sync_at = NOW(), last_sync_status = 'SKIPPED', updated_at = NOW()
         WHERE supplier_sync_id = $1`,
        [supplier.supplier_sync_id]
      );
      client.release();
      return { created: 0, updated: 0, deactivated: 0, errors: ['FTP not implemented'] };
    }

    // Download CSV
    console.log(`[supplier-sync] Downloading CSV from ${supplier.supplier_name}...`);
    const csvContent = await downloadCsv(supplier.endpoint);
    const rows = parseCsv(csvContent, separator);
    console.log(`[supplier-sync] ${supplier.supplier_name}: parsed ${rows.length} rows`);

    if (rows.length === 0) {
      throw new Error('No rows parsed from CSV');
    }

    // Track which supplier SKUs we saw (for deactivation)
    const seenSkus = new Set();

    for (const row of rows) {
      try {
        const sku = getMappedValue(row, fieldMapping, 'sku');
        const partNumber = getMappedValue(row, fieldMapping, 'partNumber');
        const name = getMappedValue(row, fieldMapping, 'name');
        const costPrice = parseNumber(getMappedValue(row, fieldMapping, 'costPrice'));
        const stock = parseInt10(getMappedValue(row, fieldMapping, 'stock'));
        const ean = getMappedValue(row, fieldMapping, 'ean');
        const image = getMappedValue(row, fieldMapping, 'image');
        const category = getMappedValue(row, fieldMapping, 'category');
        const manufacturer = getMappedValue(row, fieldMapping, 'manufacturer');
        const weight = parseNumber(getMappedValue(row, fieldMapping, 'weight'));
        const canonDigital = parseNumber(getMappedValue(row, fieldMapping, 'canonDigital'));
        const description = getMappedValue(row, fieldMapping, 'description');
        const specs = getMappedValue(row, fieldMapping, 'specs');

        if (!sku || costPrice <= 0) continue;

        seenSkus.add(sku);

        // Try to find existing product by SKU or part_number
        let existingProduct = null;
        const skuResult = await client.query(
          `SELECT * FROM product WHERE sku = $1 LIMIT 1`,
          [sku]
        );
        if (skuResult.rows.length > 0) {
          existingProduct = skuResult.rows[0];
        } else if (partNumber) {
          const pnResult = await client.query(
            `SELECT * FROM product WHERE part_number = $1 LIMIT 1`,
            [partNumber]
          );
          if (pnResult.rows.length > 0) {
            existingProduct = pnResult.rows[0];
          }
        }

        if (existingProduct) {
          // UPDATE existing product
          // Supplier stock ADDS to existing stock
          // Only update image/name/description if currently empty
          const updates = [];
          const values = [];
          let paramIndex = 1;

          // Always increment stock with supplier stock
          updates.push(`stock = COALESCE(stock, 0) + $${paramIndex}`);
          values.push(stock);
          paramIndex++;

          // Only update name if currently empty
          if (!existingProduct.name && name) {
            updates.push(`name = $${paramIndex}`);
            values.push(name);
            paramIndex++;
          }

          // Only update image if currently empty
          if (!existingProduct.image && image) {
            updates.push(`image = $${paramIndex}`);
            values.push(image);
            paramIndex++;
          }

          // Only update description if currently empty
          if (!existingProduct.description && description) {
            updates.push(`description = $${paramIndex}`);
            values.push(description);
            paramIndex++;
          }

          // Only update specs if currently empty
          if (!existingProduct.specs && specs) {
            updates.push(`specs = $${paramIndex}`);
            values.push(specs);
            paramIndex++;
          }

          // Update cost price from supplier (for price comparison)
          updates.push(`supplier_cost = $${paramIndex}`);
          values.push(costPrice);
          paramIndex++;

          updates.push(`updated_at = NOW()`);

          values.push(existingProduct.product_id);
          await client.query(
            `UPDATE product SET ${updates.join(', ')} WHERE product_id = $${paramIndex}`,
            values
          );

          productsUpdated++;
        } else {
          // CREATE new product
          const slug = createSlug(name || sku);
          const salePrice = Math.round(costPrice * 1.25 * 100) / 100;

          await client.query(
            `INSERT INTO product (
              sku, part_number, ean, name, slug, description, specs,
              weight, cost_price, sale_price, canon_digital, stock,
              image, supplier_name, is_active, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true, NOW(), NOW())
            ON CONFLICT (sku) DO NOTHING`,
            [
              sku, partNumber, ean, name || sku, slug,
              description, specs, weight, costPrice, salePrice,
              canonDigital, stock, image, supplier.supplier_name
            ]
          );

          productsCreated++;
        }
      } catch (rowError) {
        errors.push({
          sku: getMappedValue(row, fieldMapping, 'sku') || 'unknown',
          message: rowError.message
        });
        // Continue processing other rows
      }
    }

    // Update sync log
    await client.query(
      `UPDATE sync_log SET
        status = 'COMPLETED',
        completed_at = NOW(),
        products_created = $1,
        products_updated = $2,
        products_deactivated = $3,
        errors = $4
       WHERE sync_log_id = $5`,
      [productsCreated, productsUpdated, productsDeactivated, JSON.stringify(errors), syncLogId]
    );

    // Update supplier last sync info
    await client.query(
      `UPDATE supplier_sync SET
        last_sync_at = NOW(),
        last_sync_status = 'COMPLETED',
        updated_at = NOW()
       WHERE supplier_sync_id = $1`,
      [supplier.supplier_sync_id]
    );

    console.log(
      `[supplier-sync] ${supplier.supplier_name}: created=${productsCreated}, updated=${productsUpdated}, deactivated=${productsDeactivated}, errors=${errors.length}`
    );
  } catch (error) {
    console.error(`[supplier-sync] Error syncing ${supplier.supplier_name}:`, error.message);

    await client.query(
      `UPDATE sync_log SET
        status = 'FAILED',
        completed_at = NOW(),
        errors = $1
       WHERE sync_log_id = $2`,
      [JSON.stringify([{ message: error.message }]), syncLogId]
    );

    await client.query(
      `UPDATE supplier_sync SET
        last_sync_at = NOW(),
        last_sync_status = 'FAILED',
        updated_at = NOW()
       WHERE supplier_sync_id = $1`,
      [supplier.supplier_sync_id]
    );
  } finally {
    client.release();
  }

  return { created: productsCreated, updated: productsUpdated, deactivated: productsDeactivated, errors };
}

/**
 * Main sync function - iterates through all active suppliers
 * and syncs products from each one.
 */
export default async function syncAllSuppliers() {
  console.log('[supplier-sync] Starting supplier sync job...');
  const startTime = Date.now();

  try {
    // Get all active suppliers that are due for sync
    const result = await pool.query(`
      SELECT * FROM supplier_sync
      WHERE is_active = true
        AND (
          last_sync_at IS NULL
          OR last_sync_at + (sync_interval_minutes || ' minutes')::interval < NOW()
        )
      ORDER BY supplier_name
    `);

    const suppliers = result.rows;
    console.log(`[supplier-sync] Found ${suppliers.length} suppliers due for sync`);

    const results = {};
    for (const supplier of suppliers) {
      try {
        results[supplier.supplier_name] = await syncSupplier(supplier);
      } catch (error) {
        console.error(`[supplier-sync] Fatal error for ${supplier.supplier_name}:`, error);
        results[supplier.supplier_name] = { error: error.message };
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[supplier-sync] Sync job completed in ${elapsed}s`);
    console.log('[supplier-sync] Results:', JSON.stringify(results, null, 2));

    return results;
  } catch (error) {
    console.error('[supplier-sync] Fatal error in sync job:', error);
    throw error;
  }
}
