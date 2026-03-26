const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function fix() {
  const client = await pool.connect();
  try {
    console.log('=== FIXING EVERYTHING ===\n');

    // 1. Fix product names from CSV
    console.log('1. Fixing product names...');
    const csvPath = path.join(process.cwd(), 'ProductosPropios.csv');
    const content = fs.readFileSync(csvPath, 'latin1');
    const lines = content.split('\n').filter(l => l.trim());
    let fixed = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length < 22) continue;
      const sku = (cols[2] || '').trim();
      const nombre = (cols[10] || '').trim();
      if (!sku || !nombre || nombre === sku) continue;

      // Simple two-step: find product_id, then update
      const prod = await client.query('SELECT product_id FROM product WHERE sku = $1', [sku]);
      if (prod.rows.length === 0) continue;
      const pid = prod.rows[0].product_id;

      const upd = await client.query(
        'UPDATE product_description SET name = $1, meta_title = $1 WHERE product_description_product_id = $2 AND (name = $3 OR name = $4 OR name IS NULL)',
        [nombre, pid, sku, '']
      );
      if (upd.rowCount > 0) fixed++;
    }
    console.log('   Fixed ' + fixed + ' product names');

    // 2. Rebuild featured collection
    console.log('\n2. Rebuilding featured collection...');
    await client.query('DELETE FROM product_collection WHERE collection_id = 1');
    const best = await client.query(`
      SELECT p.product_id, pd.name, p.price FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      WHERE p.status = true AND pd.name != p.sku AND length(pd.name) > 3
      ORDER BY p.price DESC LIMIT 8
    `);
    for (const p of best.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (1, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log('   Added ' + best.rows.length + ' products');
    best.rows.forEach(p => console.log('   - ' + p.name + ': ' + Number(p.price).toFixed(2) + ' EUR'));

    // 3. Rebuild novedades
    console.log('\n3. Rebuilding novedades...');
    await client.query('DELETE FROM product_collection WHERE collection_id = 2');
    const newest = await client.query(`
      SELECT p.product_id, pd.name FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      WHERE p.status = true AND pd.name != p.sku AND length(pd.name) > 3 AND pi.qty > 0
      ORDER BY p.created_at DESC LIMIT 8
    `);
    for (const p of newest.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (2, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log('   Added ' + newest.rows.length + ' products');

    // 4. Categories in nav
    console.log('\n4. Setting categories in nav...');
    await client.query('UPDATE category SET include_in_nav = false');
    const cats = await client.query(`
      SELECT c.category_id, cd.name, COUNT(p.product_id)::int as cnt
      FROM category c JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id AND p.status = true
      WHERE c.status = true GROUP BY c.category_id, cd.name HAVING COUNT(p.product_id) > 0
      ORDER BY cnt DESC LIMIT 15
    `);
    let pos = 1;
    for (const c of cats.rows) {
      await client.query('UPDATE category SET include_in_nav = true, position = $1 WHERE category_id = $2', [pos++, c.category_id]);
      console.log('   [' + (pos-1) + '] ' + c.name + ' (' + c.cnt + ')');
    }

    // 5. Stats
    console.log('\n5. Stats:');
    const s = await client.query("SELECT (SELECT count(*) FROM product) as total, (SELECT count(*) FROM product_description WHERE name != '' AND length(name) > 3) as named, (SELECT count(*) FROM product_inventory WHERE qty > 0) as instock");
    console.log('   Products: ' + s.rows[0].total + ', Named: ' + s.rows[0].named + ', In stock: ' + s.rows[0].instock);

    console.log('\nDONE!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
fix();
