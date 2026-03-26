const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function fix() {
  const client = await pool.connect();
  try {
    console.log('=== FIXING EVERYTHING ===\n');

    // 1. Fix product names that are just SKUs
    console.log('1. Fixing product names from CSV...');
    const csvPath = path.join(process.cwd(), 'ProductosPropios.csv');
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'latin1');
      const lines = content.split('\n').filter(l => l.trim());
      let fixed = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';');
        if (cols.length < 22) continue;
        const sku = (cols[2] || '').trim();
        const nombre = (cols[10] || '').trim();
        const resumen = (cols[11] || '').trim();
        if (!sku || !nombre) continue;

        // Update product_description where name equals SKU
        const res = await client.query(`
          UPDATE product_description pd SET
            name = $1,
            short_description = COALESCE(NULLIF(pd.short_description, ''), $3),
            meta_title = $1
          FROM product p
          WHERE p.product_id = pd.product_description_product_id
            AND p.sku = $2
            AND (pd.name = $2 OR pd.name = '' OR pd.name IS NULL)
        `, [nombre, sku, resumen || null]);
        if (res.rowCount > 0) fixed++;
      }
      console.log(`   Fixed ${fixed} product names`);
    }

    // 2. Fix featured collection - add more products with real names
    console.log('\n2. Rebuilding featured collection with best products...');
    await client.query('DELETE FROM product_collection WHERE collection_id = 1');
    const bestProducts = await client.query(`
      SELECT p.product_id, pd.name, p.price
      FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      WHERE p.status = true AND p.visibility = true
        AND pd.name != p.sku AND pd.name != '' AND pd.name IS NOT NULL
      ORDER BY p.price DESC LIMIT 8
    `);
    for (const p of bestProducts.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (1, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log(`   Added ${bestProducts.rows.length} products to featured (top priced with names)`);
    bestProducts.rows.forEach(p => console.log(`   - ${p.name}: ${Number(p.price).toFixed(2)}€`));

    // 3. Rebuild novedades collection with named products
    console.log('\n3. Rebuilding novedades collection...');
    await client.query('DELETE FROM product_collection WHERE collection_id = 2');
    const newestNamed = await client.query(`
      SELECT p.product_id, pd.name
      FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      WHERE p.status = true AND p.visibility = true
        AND pd.name != p.sku AND pd.name != '' AND pd.name IS NOT NULL
        AND pi.qty > 0
      ORDER BY p.created_at DESC LIMIT 8
    `);
    for (const p of newestNamed.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (2, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log(`   Added ${newestNamed.rows.length} products to novedades`);

    // 4. Update widget settings with better names/descriptions
    console.log('\n4. Updating widget settings...');
    await client.query(`UPDATE widget SET settings = '{"collection":"featured-products","count":8,"countPerRow":4,"name":"Productos Destacados","description":"Los productos más populares de nuestra tienda"}'::jsonb WHERE name = 'Productos Destacados'`);
    await client.query(`UPDATE widget SET settings = '{"collection":"new-arrivals","count":8,"countPerRow":4,"name":"Novedades","description":"Los últimos productos añadidos"}'::jsonb WHERE name = 'Novedades'`);

    // 5. Ensure categories are in navigation
    console.log('\n5. Setting top categories in navigation...');
    const topCats = await client.query(`
      SELECT c.category_id, cd.name, COUNT(p.product_id)::int as cnt
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id AND p.status = true
      WHERE c.status = true
      GROUP BY c.category_id, cd.name
      HAVING COUNT(p.product_id) > 0
      ORDER BY cnt DESC LIMIT 15
    `);
    // Reset all nav
    await client.query('UPDATE category SET include_in_nav = false');
    let pos = 1;
    for (const cat of topCats.rows) {
      await client.query('UPDATE category SET include_in_nav = true, position = $1 WHERE category_id = $2', [pos++, cat.category_id]);
      console.log(`   [${pos-1}] ${cat.name} (${cat.cnt} products)`);
    }

    // 6. Update footer copyright
    console.log('\n6. Updating store settings...');
    const footerSettings = [
      ['storeName', 'Speedler'],
      ['storeDescription', 'Tu tienda de informatica de confianza. Componentes, perifericos y equipos al mejor precio.'],
      ['storeCurrency', 'EUR'],
      ['storeLanguage', 'es'],
      ['storeTimeZone', 'Europe/Madrid'],
      ['storeCountry', 'ES'],
      ['storeEmail', 'info@speedler.es'],
      ['storePhoneNumber', '900 000 000'],
      ['allowGuest', '1'],
      ['sendOrderConfirmationEmail', '1'],
      ['sendOrderCompleteEmail', '1'],
      ['freeShippingMinTotal', '100'],
    ];
    for (const [name, value] of footerSettings) {
      await client.query(`INSERT INTO setting (uuid, name, value, is_json) VALUES ($1, $2, $3, false) ON CONFLICT (name) DO UPDATE SET value = $3`, [crypto.randomUUID(), name, value]);
    }

    // 7. Count stats
    console.log('\n7. Store stats:');
    const stats = await client.query(`
      SELECT
        (SELECT count(*) FROM product WHERE status = true) as products,
        (SELECT count(*) FROM category WHERE status = true) as categories,
        (SELECT count(*) FROM product_description WHERE name != '' AND name IS NOT NULL AND name != (SELECT sku FROM product WHERE product_id = product_description_product_id)) as named_products,
        (SELECT count(*) FROM product_inventory WHERE qty > 0) as in_stock
    `);
    const s = stats.rows[0];
    console.log(`   Total products: ${s.products}`);
    console.log(`   With real names: ${s.named_products}`);
    console.log(`   In stock: ${s.in_stock}`);
    console.log(`   Categories: ${s.categories}`);

    // 8. Verify category URLs work
    console.log('\n8. Top categories with URL keys:');
    const catUrls = await client.query(`
      SELECT cd.name, cd.url_key
      FROM category_description cd
      JOIN category c ON c.category_id = cd.category_description_category_id
      WHERE c.include_in_nav = true
      ORDER BY c.position LIMIT 10
    `);
    for (const c of catUrls.rows) {
      console.log(`   /${c.url_key} -> ${c.name}`);
    }

    console.log('\n✅ ALL FIXES APPLIED!');
    console.log('Reload the homepage to see changes.');

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}
fix();
