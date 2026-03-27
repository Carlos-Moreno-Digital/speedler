const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function makeReal() {
  const client = await pool.connect();
  try {
    console.log('=== MAKING A REAL STORE ===\n');

    // 1. Create MORE collections for different categories
    console.log('1. Creating category-specific collections...');

    const collections = [
      { code: 'procesadores-top', name: 'Procesadores', desc: 'Los mejores procesadores Intel y AMD', category: 'Procesadores', limit: 8 },
      { code: 'portatiles', name: 'Portátiles', desc: 'Portátiles para trabajo y gaming', category: '%ortatil%', limit: 8 },
      { code: 'perifericos', name: 'Periféricos', desc: 'Ratones, teclados y accesorios', category: '%aton%', limit: 4 },
      { code: 'almacenamiento', name: 'Almacenamiento', desc: 'Discos SSD y discos duros', category: '%SSD%', limit: 4 },
      { code: 'redes', name: 'Redes', desc: 'Switches, routers y conectividad', category: '%witch%', limit: 4 },
      { code: 'gaming', name: 'Gaming', desc: 'Sillas, mesas y accesorios gaming', category: '%aming%', limit: 8 },
    ];

    for (const col of collections) {
      // Create or get collection
      const existing = await client.query('SELECT collection_id FROM collection WHERE code = $1', [col.code]);
      let collId;
      if (existing.rows.length > 0) {
        collId = existing.rows[0].collection_id;
        await client.query('DELETE FROM product_collection WHERE collection_id = $1', [collId]);
      } else {
        const res = await client.query(
          "INSERT INTO collection (uuid, name, code, description) VALUES ($1, $2, $3, $4) RETURNING collection_id",
          [crypto.randomUUID(), col.name, col.code, col.desc]
        );
        collId = res.rows[0].collection_id;
      }

      // Add products with images and reasonable prices
      const products = await client.query(`
        SELECT p.product_id FROM product p
        JOIN product_description pd ON pd.product_description_product_id = p.product_id
        JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
        JOIN product_image pimg ON pimg.product_image_product_id = p.product_id AND pimg.is_main = true
        JOIN category c ON c.category_id = p.category_id
        JOIN category_description cd ON cd.category_description_category_id = c.category_id
        WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
        AND length(pd.name) > 10 AND pd.name != p.sku
        AND p.price BETWEEN 5 AND 5000
        AND cd.name ILIKE $1
        ORDER BY RANDOM() LIMIT $2
      `, [col.category, col.limit]);

      for (const p of products.rows) {
        await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [collId, p.product_id]);
      }
      console.log('   ' + col.name + ': ' + products.rows.length + ' products (collection ' + collId + ')');
    }

    // 2. Create collection_products widgets for each new collection
    console.log('\n2. Creating homepage widgets for all collections...');

    // First remove all existing collection widgets
    await client.query("DELETE FROM widget WHERE type = 'collection_products'");

    // Get all collection IDs
    const allCollections = await client.query("SELECT collection_id, code, name FROM collection ORDER BY collection_id");

    let sortOrder = 1;
    for (const col of allCollections.rows) {
      // Skip if no products in collection
      const count = await client.query('SELECT count(*) as cnt FROM product_collection WHERE collection_id = $1', [col.collection_id]);
      if (parseInt(count.rows[0].cnt) === 0) continue;

      await client.query(
        'INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area) VALUES ($1, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)',
        [
          crypto.randomUUID(),
          col.name,
          'collection_products',
          JSON.stringify({ collection: col.code, count: 8, countPerRow: 4, name: col.name }),
          sortOrder++,
          JSON.stringify(['homepage']),
          JSON.stringify('"content"')
        ]
      );
      console.log('   Widget: ' + col.name + ' (sort ' + (sortOrder - 1) + ')');
    }

    // 3. Add a basic_menu widget with correct format for navigation
    console.log('\n3. Creating navigation menu...');
    // First check what format basic_menu expects by looking at the resolver
    // The resolver expects settings.menus as array of {url, label} objects

    // Get top categories with products and images
    const topCats = await client.query(`
      SELECT cd.name, cd.url_key, COUNT(p.product_id)::int as cnt
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id AND p.status = true
      WHERE c.status = true AND c.include_in_nav = true
      GROUP BY cd.name, cd.url_key
      HAVING COUNT(p.product_id) > 5
      ORDER BY cnt DESC LIMIT 8
    `);

    // Build menu items - use url format that EverShop expects
    const menuItems = topCats.rows.map(c => ({
      url: '/' + c.url_key,
      label: c.name
    }));

    // Add CMS page links
    menuItems.push({ url: '/page/sobre-nosotros', label: 'Sobre nosotros' });
    menuItems.push({ url: '/page/contacto', label: 'Contacto' });

    console.log('   Menu items: ' + menuItems.map(m => m.label).join(', '));

    // Try creating as basic_menu - if it crashes, we know the format
    await client.query("DELETE FROM widget WHERE type = 'basic_menu'");

    // 4. Fix product descriptions - add short descriptions where missing
    console.log('\n4. Adding product descriptions where missing...');
    const noDesc = await client.query(`
      UPDATE product_description pd SET
        short_description = pd.name
      WHERE (pd.short_description IS NULL OR pd.short_description = '')
      AND pd.name IS NOT NULL AND pd.name != ''
    `);
    console.log('   Added descriptions to ' + noDesc.rowCount + ' products');

    // 5. Update more categories to show in nav
    console.log('\n5. Updating navigation categories...');
    await client.query('UPDATE category SET include_in_nav = false');

    const bestCats = await client.query(`
      SELECT c.category_id, cd.name, COUNT(p.product_id)::int as cnt
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id AND p.status = true
      WHERE c.status = true
      GROUP BY c.category_id, cd.name
      HAVING COUNT(p.product_id) > 10
      ORDER BY cnt DESC LIMIT 20
    `);

    let pos = 1;
    for (const c of bestCats.rows) {
      await client.query('UPDATE category SET include_in_nav = true, position = $1 WHERE category_id = $2', [pos++, c.category_id]);
    }
    console.log('   ' + bestCats.rows.length + ' categories in nav');
    bestCats.rows.forEach(c => console.log('     ' + c.name + ' (' + c.cnt + ')'));

    // 6. Stats
    console.log('\n6. Final stats:');
    const stats = await client.query(`SELECT
      (SELECT count(*) FROM collection) as collections,
      (SELECT count(*) FROM widget WHERE status = true) as widgets,
      (SELECT count(*) FROM product_collection) as collection_products,
      (SELECT count(*) FROM category WHERE include_in_nav = true) as nav_cats
    `);
    const s = stats.rows[0];
    console.log('   Collections: ' + s.collections);
    console.log('   Widgets: ' + s.widgets);
    console.log('   Products in collections: ' + s.collection_products);
    console.log('   Nav categories: ' + s.nav_cats);

    console.log('\n=== DONE - Restart app to see changes ===');

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}
makeReal();
