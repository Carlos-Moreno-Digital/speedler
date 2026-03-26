/**
 * Product Import Script for EverShop
 * Imports products from ProductosPropios.csv into the EverShop PostgreSQL database.
 *
 * Usage: node import-products.js
 * Run inside the EverShop Docker container where `pg` is available.
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
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

const CSV_PATH = path.resolve(__dirname, 'ProductosPropios.csv');
const MARKUP = 1.25; // 25% markup on cost

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Turn a display name into a URL-safe slug */
function slugify(text) {
  return text
    .toString()
    .normalize('NFD')                   // decompose accents
    .replace(/[\u0300-\u036f]/g, '')    // strip diacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')       // non-alphanum -> hyphen
    .replace(/^-+|-+$/g, '');           // trim leading/trailing hyphens
}

/** Parse a Spanish-locale decimal string ("1.234,56" or "0,000") to a JS number */
function parseDecimal(str) {
  if (!str || str.trim() === '') return 0;
  // Remove thousands separator (dot), then replace comma with dot
  const cleaned = str.trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Parse an integer string, default 0 */
function parseIntSafe(str) {
  if (!str || str.trim() === '') return 0;
  const n = parseInt(str.trim(), 10);
  return isNaN(n) ? 0 : n;
}

/** Read CSV file with latin1 encoding, fallback to utf8 */
function readCSV(filePath) {
  let raw;
  try {
    // Node >= 16 supports latin1 encoding natively
    raw = fs.readFileSync(filePath, { encoding: 'latin1' });
  } catch (e) {
    console.warn('latin1 read failed, falling back to utf8');
    raw = fs.readFileSync(filePath, { encoding: 'utf8' });
  }
  return raw;
}

/** Split CSV content into rows of fields (semicolon-separated) */
function parseCSVRows(raw) {
  const lines = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  // Skip header (first line) and empty trailing lines
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    rows.push(line.split(';'));
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== EverShop Product Import ===');
  console.log(`Reading CSV: ${CSV_PATH}`);

  const raw = readCSV(CSV_PATH);
  const rows = parseCSVRows(raw);
  console.log(`Parsed ${rows.length} data rows from CSV`);

  const client = new Client(DB_CONFIG);
  await client.connect();
  console.log('Connected to PostgreSQL');

  try {
    await client.query('BEGIN');

    // ------------------------------------------------------------------
    // 1. Categories
    // ------------------------------------------------------------------
    console.log('\n--- Creating categories ---');
    const categoryMap = new Map(); // name -> category_id
    const uniqueCategories = [...new Set(rows.map(r => (r[20] || '').trim()).filter(Boolean))];
    let catCreated = 0;

    for (const catName of uniqueCategories) {
      const urlKey = slugify(catName);
      const uuid = crypto.randomUUID();

      // Upsert category: check if exists by name in category_description
      const existing = await client.query(
        `SELECT c.category_id
         FROM category c
         JOIN category_description cd ON cd.category_description_category_id = c.category_id
         WHERE cd.name = $1
         LIMIT 1`,
        [catName]
      );

      if (existing.rows.length > 0) {
        categoryMap.set(catName, existing.rows[0].category_id);
      } else {
        const catRes = await client.query(
          `INSERT INTO category (uuid, status, parent_id, include_in_nav, position)
           VALUES ($1, $2, NULL, $3, $4)
           RETURNING category_id`,
          [uuid, true, true, catCreated + 1]
        );
        const categoryId = catRes.rows[0].category_id;

        // Ensure unique url_key for category
        let finalUrlKey = urlKey;
        const urlCheck = await client.query(
          `SELECT 1 FROM category_description WHERE url_key = $1 LIMIT 1`,
          [finalUrlKey]
        );
        if (urlCheck.rows.length > 0) {
          finalUrlKey = `${urlKey}-${categoryId}`;
        }

        await client.query(
          `INSERT INTO category_description
             (category_description_category_id, name, url_key, short_description)
           VALUES ($1, $2, $3, $4)`,
          [categoryId, catName, finalUrlKey, '']
        );

        categoryMap.set(catName, categoryId);
        catCreated++;
      }
    }
    console.log(`Categories: ${catCreated} created, ${uniqueCategories.length - catCreated} already existed`);

    // ------------------------------------------------------------------
    // 2. Manufacturer attribute
    // ------------------------------------------------------------------
    console.log('\n--- Creating manufacturer attribute ---');
    let manufacturerAttrId;

    const attrCheck = await client.query(
      `SELECT attribute_id FROM attribute WHERE attribute_code = 'manufacturer' LIMIT 1`
    );
    if (attrCheck.rows.length > 0) {
      manufacturerAttrId = attrCheck.rows[0].attribute_id;
      console.log(`Manufacturer attribute already exists (id=${manufacturerAttrId})`);
    } else {
      const uuid = crypto.randomUUID();
      const attrRes = await client.query(
        `INSERT INTO attribute (uuid, attribute_code, attribute_name, type)
         VALUES ($1, 'manufacturer', 'Manufacturer', 'select')
         RETURNING attribute_id`,
        [uuid]
      );
      manufacturerAttrId = attrRes.rows[0].attribute_id;
      console.log(`Manufacturer attribute created (id=${manufacturerAttrId})`);
    }

    // ------------------------------------------------------------------
    // 3. Manufacturer attribute options
    // ------------------------------------------------------------------
    console.log('\n--- Creating manufacturer options ---');
    const mfgMap = new Map(); // manufacturer name -> option_id
    const uniqueMfgs = [...new Set(
      rows.map(r => (r[21] || '').trim()).filter(m => m && m !== '[sin fabricante]')
    )];
    let mfgCreated = 0;

    for (const mfgName of uniqueMfgs) {
      const optCheck = await client.query(
        `SELECT attribute_option_id FROM attribute_option
         WHERE attribute_id = $1 AND option_text = $2
         LIMIT 1`,
        [manufacturerAttrId, mfgName]
      );
      if (optCheck.rows.length > 0) {
        mfgMap.set(mfgName, optCheck.rows[0].attribute_option_id);
      } else {
        const uuid = crypto.randomUUID();
        const optRes = await client.query(
          `INSERT INTO attribute_option (uuid, attribute_id, attribute_code, option_text)
           VALUES ($1, $2, 'manufacturer', $3)
           RETURNING attribute_option_id`,
          [uuid, manufacturerAttrId, mfgName]
        );
        mfgMap.set(mfgName, optRes.rows[0].attribute_option_id);
        mfgCreated++;
      }
    }
    console.log(`Manufacturer options: ${mfgCreated} created, ${uniqueMfgs.length - mfgCreated} already existed`);

    // ------------------------------------------------------------------
    // 4. Products
    // ------------------------------------------------------------------
    console.log('\n--- Importing products ---');
    const usedUrlKeys = new Set();

    // Pre-load existing url_keys to avoid duplicates
    const existingUrlKeys = await client.query(
      `SELECT url_key FROM product_description`
    );
    for (const row of existingUrlKeys.rows) {
      usedUrlKeys.add(row.url_key);
    }

    let prodCreated = 0;
    let prodUpdated = 0;
    let prodSkipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const sku = (r[2] || '').trim();
      if (!sku) {
        prodSkipped++;
        continue;
      }

      const catName = (r[20] || '').trim();
      const categoryId = categoryMap.get(catName) || null;
      const nombre = (r[10] || '').trim();
      const productName = nombre || sku;
      const resumen = (r[11] || '').trim();
      const descripcion = (r[12] || '').trim();
      const peso = parseDecimal(r[5]);
      const stock = parseIntSafe(r[16]);
      const coste = parseDecimal(r[19]);
      const price = Math.round(coste * MARKUP * 100) / 100; // round to 2 decimals
      const mfgName = (r[21] || '').trim();
      const stockAvailability = stock > 0;

      // Generate url_key, ensure uniqueness
      let urlKey = slugify(productName);
      if (!urlKey) urlKey = slugify(sku);
      if (usedUrlKeys.has(urlKey)) {
        urlKey = `${urlKey}-${slugify(sku)}`;
      }
      // If still duplicate (same name as sku), add a counter
      if (usedUrlKeys.has(urlKey)) {
        let counter = 2;
        while (usedUrlKeys.has(`${urlKey}-${counter}`)) counter++;
        urlKey = `${urlKey}-${counter}`;
      }

      // Check if product already exists by SKU
      const existingProd = await client.query(
        `SELECT product_id FROM product WHERE sku = $1 LIMIT 1`,
        [sku]
      );

      let productId;
      if (existingProd.rows.length > 0) {
        // Update existing product
        productId = existingProd.rows[0].product_id;
        await client.query(
          `UPDATE product SET
             price = $1, weight = $2, status = $3, visibility = $4,
             group_id = $5, manage_stock = $6, stock_availability = $7,
             category_id = $8
           WHERE product_id = $9`,
          [price, peso, true, true, 1, true, stockAvailability, categoryId, productId]
        );

        await client.query(
          `UPDATE product_description SET
             name = $1, description = $2, short_description = $3,
             meta_title = $4, meta_description = $5
           WHERE product_description_product_id = $6`,
          [productName, descripcion, resumen, productName, resumen, productId]
        );

        // Upsert inventory
        await client.query(
          `INSERT INTO product_inventory (product_inventory_product_id, qty, manage_stock, stock_availability)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (product_inventory_product_id) DO UPDATE SET
             qty = EXCLUDED.qty,
             manage_stock = EXCLUDED.manage_stock,
             stock_availability = EXCLUDED.stock_availability`,
          [productId, stock, true, stockAvailability]
        );

        prodUpdated++;
      } else {
        // Insert new product
        const uuid = crypto.randomUUID();
        const prodRes = await client.query(
          `INSERT INTO product (uuid, sku, price, weight, status, visibility, group_id, manage_stock, stock_availability, tax_class, category_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           RETURNING product_id`,
          [uuid, sku, price, peso, true, true, 1, true, stockAvailability, null, categoryId]
        );
        productId = prodRes.rows[0].product_id;

        await client.query(
          `INSERT INTO product_description
             (product_description_product_id, name, url_key, description, short_description, meta_title, meta_description)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [productId, productName, urlKey, descripcion, resumen, productName, resumen]
        );

        usedUrlKeys.add(urlKey);

        // Insert inventory
        await client.query(
          `INSERT INTO product_inventory (product_inventory_product_id, qty, manage_stock, stock_availability)
           VALUES ($1, $2, $3, $4)`,
          [productId, stock, true, stockAvailability]
        );

        prodCreated++;
      }

      // Manufacturer attribute value
      if (mfgName && mfgName !== '[sin fabricante]' && mfgMap.has(mfgName)) {
        const optionId = mfgMap.get(mfgName);
        await client.query(
          `INSERT INTO product_attribute_value_index (product_id, attribute_id, option_id, option_text)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (product_id, attribute_id, option_id) DO UPDATE SET
             option_text = EXCLUDED.option_text`,
          [productId, manufacturerAttrId, optionId, mfgName]
        );
      }

      // Log progress every 100 products
      if ((i + 1) % 100 === 0) {
        console.log(`  Progress: ${i + 1}/${rows.length} rows processed`);
      }
    }

    await client.query('COMMIT');

    console.log('\n=== Import Complete ===');
    console.log(`Categories:    ${catCreated} created`);
    console.log(`Manufacturers: ${mfgCreated} options created`);
    console.log(`Products:      ${prodCreated} created, ${prodUpdated} updated, ${prodSkipped} skipped`);
    console.log(`Total rows:    ${rows.length}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Import failed, transaction rolled back:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
