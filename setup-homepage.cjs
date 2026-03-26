const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function setup() {
  const client = await pool.connect();
  try {
    console.log('=== Setting up Homepage ===');

    // Collections
    const collRes = await client.query(`
      INSERT INTO collection (uuid, name, code, description)
      VALUES ($1, 'Productos Destacados', 'featured-products', 'Los productos mas populares')
      ON CONFLICT (code) DO UPDATE SET name = 'Productos Destacados'
      RETURNING collection_id
    `, [crypto.randomUUID()]);
    const featuredCollId = collRes.rows[0].collection_id;

    const newRes = await client.query(`
      INSERT INTO collection (uuid, name, code, description)
      VALUES ($1, 'Novedades', 'new-arrivals', 'Ultimos productos')
      ON CONFLICT (code) DO UPDATE SET name = 'Novedades'
      RETURNING collection_id
    `, [crypto.randomUUID()]);
    const newCollId = newRes.rows[0].collection_id;
    console.log('Collections created:', featuredCollId, newCollId);

    // Add products to collections
    const topProducts = await client.query(`SELECT product_id FROM product WHERE status = true ORDER BY price DESC LIMIT 8`);
    for (const p of topProducts.rows) {
      await client.query(`INSERT INTO product_collection (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [featuredCollId, p.product_id]);
    }
    const newestProducts = await client.query(`SELECT product_id FROM product WHERE status = true ORDER BY created_at DESC LIMIT 8`);
    for (const p of newestProducts.rows) {
      await client.query(`INSERT INTO product_collection (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [newCollId, p.product_id]);
    }
    console.log('Products added to collections');

    // Check settings column type
    const colType = await client.query(`SELECT data_type, udt_name FROM information_schema.columns WHERE table_name='widget' AND column_name='settings'`);
    console.log('Settings column type:', colType.rows[0]);

    // Widgets - use simple objects, no HTML
    const widgets = [
      { name: 'Hero Banner', type: 'text_block', settings: { text: 'Speedler - Tu tienda de informatica' }, sort: 1 },
      { name: 'Productos Destacados', type: 'collection_products', settings: { collectionId: featuredCollId, count: 8 }, sort: 2 },
      { name: 'Novedades', type: 'collection_products', settings: { collectionId: newCollId, count: 8 }, sort: 3 },
    ];

    for (const w of widgets) {
      const settingsStr = JSON.stringify(w.settings);
      try {
        await client.query(
          `INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area) VALUES ($1, $2, $3, $4, $5, true, 'homepage', 'content')`,
          [crypto.randomUUID(), w.name, w.type, settingsStr, w.sort]
        );
        console.log('Widget created:', w.name);
      } catch (e) {
        console.log('Widget error for', w.name, ':', e.message);
        // Try without cast
        try {
          await client.query(
            `INSERT INTO widget (uuid, name, type, sort_order, status, route, area) VALUES ($1, $2, $3, $4, true, 'homepage', 'content')`,
            [crypto.randomUUID(), w.name, w.type, w.sort]
          );
          // Update settings separately
          await client.query(`UPDATE widget SET settings = $1 WHERE name = $2`, [settingsStr, w.name]);
          console.log('Widget created (fallback):', w.name);
        } catch (e2) {
          console.log('Widget fallback error:', e2.message);
        }
      }
    }

    // Categories in nav
    const topCats = await client.query(`
      SELECT c.category_id, cd.name, COUNT(p.product_id) as cnt
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id
      WHERE c.status = true
      GROUP BY c.category_id, cd.name ORDER BY cnt DESC LIMIT 12
    `);
    let pos = 1;
    for (const cat of topCats.rows) {
      await client.query(`UPDATE category SET include_in_nav = true, position = $1 WHERE category_id = $2`, [pos++, cat.category_id]);
    }
    console.log('Top', topCats.rows.length, 'categories set in navigation');

    // Store settings
    const settings = [
      ['storeName', 'Speedler'], ['storeDescription', 'Tu tienda de informatica de confianza'],
      ['storeCurrency', 'EUR'], ['storeLanguage', 'es'], ['storeTimeZone', 'Europe/Madrid'],
      ['storeCountry', 'ES'], ['storeEmail', 'info@speedler.es'], ['allowGuest', '1'],
    ];
    for (const [name, value] of settings) {
      await client.query(`INSERT INTO setting (uuid, name, value, is_json) VALUES ($1, $2, $3, false) ON CONFLICT (name) DO UPDATE SET value = $3`, [crypto.randomUUID(), name, value]);
    }
    console.log('Store settings configured');

    console.log('\nDone! Refresh homepage.');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
setup();
