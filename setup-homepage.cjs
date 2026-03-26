// Setup EverShop homepage widgets, collections, and featured products
const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function setup() {
  const client = await pool.connect();
  try {
    console.log('=== Setting up Homepage ===');

    // 1. Create a "Featured Products" collection
    console.log('Creating collections...');

    // Check widget table structure
    const widgetCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='widget' ORDER BY ordinal_position`);
    console.log('Widget columns:', widgetCols.rows.map(r => r.column_name));

    const collCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name='collection' ORDER BY ordinal_position`);
    console.log('Collection columns:', collCols.rows.map(r => r.column_name));

    // Create featured products collection
    const collRes = await client.query(`
      INSERT INTO collection (uuid, name, code, description)
      VALUES ($1, 'Productos Destacados', 'featured-products', 'Los productos más populares de nuestra tienda')
      ON CONFLICT (code) DO UPDATE SET name = 'Productos Destacados'
      RETURNING collection_id
    `, [crypto.randomUUID()]);
    const featuredCollId = collRes.rows[0].collection_id;
    console.log('Featured collection created, id:', featuredCollId);

    // Create "New Arrivals" collection
    const newRes = await client.query(`
      INSERT INTO collection (uuid, name, code, description)
      VALUES ($1, 'Novedades', 'new-arrivals', 'Los últimos productos añadidos')
      ON CONFLICT (code) DO UPDATE SET name = 'Novedades'
      RETURNING collection_id
    `, [crypto.randomUUID()]);
    const newCollId = newRes.rows[0].collection_id;
    console.log('New arrivals collection created, id:', newCollId);

    // Add top products to featured collection (most expensive = most interesting for display)
    const topProducts = await client.query(`
      SELECT product_id FROM product
      WHERE status = true AND visibility = true
      ORDER BY price DESC
      LIMIT 8
    `);

    for (const p of topProducts.rows) {
      await client.query(`
        INSERT INTO product_collection (collection_id, product_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [featuredCollId, p.product_id]);
    }
    console.log(`Added ${topProducts.rows.length} products to featured collection`);

    // Add newest products to new arrivals
    const newestProducts = await client.query(`
      SELECT product_id FROM product
      WHERE status = true AND visibility = true
      ORDER BY created_at DESC
      LIMIT 8
    `);

    for (const p of newestProducts.rows) {
      await client.query(`
        INSERT INTO product_collection (collection_id, product_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [newCollId, p.product_id]);
    }
    console.log(`Added ${newestProducts.rows.length} products to new arrivals collection`);

    // 2. Create homepage widgets
    console.log('Creating widgets...');

    // Check existing widgets
    const existingWidgets = await client.query('SELECT name FROM widget');
    console.log('Existing widgets:', existingWidgets.rows.map(r => r.name));

    // Create Hero Banner widget
    await client.query(`
      INSERT INTO widget (uuid, name, type, setting, sort_order, status)
      VALUES ($1, 'Hero Banner', 'text_block', $2, 1, true)
      ON CONFLICT DO NOTHING
    `, [
      crypto.randomUUID(),
      JSON.stringify({
        className: 'hero-banner',
        content: '<div style="background-color:#f9fafb;padding:4rem 0;text-align:center"><div style="max-width:1200px;margin:0 auto;padding:0 22px"><h1 style="font-size:2.5rem;font-weight:700;color:#1a1a2e;margin-bottom:1rem">Tu tienda de informática de confianza</h1><p style="font-size:1.125rem;color:#6b7280;max-width:600px;margin:0 auto 2rem">Componentes, periféricos y equipos al mejor precio. Más de 670 productos disponibles con envío rápido a toda España.</p><a href="/search" style="display:inline-block;background:#058c8c;color:white;padding:0.75rem 2rem;border-radius:3px;text-decoration:none;font-weight:600;margin-right:1rem">Explorar tienda</a></div></div>'
      })
    ]);
    console.log('Hero banner widget created');

    // Create Featured Products widget
    await client.query(`
      INSERT INTO widget (uuid, name, type, setting, sort_order, status)
      VALUES ($1, 'Productos Destacados', 'collection_products', $2, 2, true)
      ON CONFLICT DO NOTHING
    `, [
      crypto.randomUUID(),
      JSON.stringify({
        collectionId: featuredCollId,
        count: 8,
        name: 'Productos Destacados',
        description: 'Los productos más populares de nuestra tienda'
      })
    ]);
    console.log('Featured products widget created');

    // Create New Arrivals widget
    await client.query(`
      INSERT INTO widget (uuid, name, type, setting, sort_order, status)
      VALUES ($1, 'Novedades', 'collection_products', $2, 3, true)
      ON CONFLICT DO NOTHING
    `, [
      crypto.randomUUID(),
      JSON.stringify({
        collectionId: newCollId,
        count: 8,
        name: 'Novedades',
        description: 'Los últimos productos añadidos a nuestra tienda'
      })
    ]);
    console.log('New arrivals widget created');

    // 3. Make sure top categories are visible in nav
    console.log('Configuring category navigation...');

    // Get top categories by product count
    const topCats = await client.query(`
      SELECT c.category_id, cd.name, COUNT(p.product_id) as prod_count
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id
      WHERE c.status = true
      GROUP BY c.category_id, cd.name
      ORDER BY prod_count DESC
      LIMIT 12
    `);

    let pos = 1;
    for (const cat of topCats.rows) {
      await client.query(`
        UPDATE category SET include_in_nav = true, position = $1 WHERE category_id = $2
      `, [pos, cat.category_id]);
      pos++;
    }
    console.log(`Set ${topCats.rows.length} top categories to show in navigation`);

    // 4. Set store logo and basic settings
    console.log('Configuring store settings...');

    const storeSettings = [
      ['storeName', 'Speedler'],
      ['storeDescription', 'Tu tienda de informática de confianza'],
      ['storeCurrency', 'EUR'],
      ['storeLanguage', 'es'],
      ['storeTimeZone', 'Europe/Madrid'],
      ['storeCountry', 'ES'],
      ['storePhoneNumber', '900 000 000'],
      ['storeEmail', 'info@speedler.es'],
      ['allowGuest', '1'],
    ];

    for (const [name, value] of storeSettings) {
      await client.query(`
        INSERT INTO setting (uuid, name, value, is_json)
        VALUES ($1, $2, $3, false)
        ON CONFLICT (name) DO UPDATE SET value = $3
      `, [crypto.randomUUID(), name, value]);
    }

    // 5. Setup main menu
    console.log('Setting up main menu...');

    // Check if cms_page table exists for menu
    const cmsCheck = await client.query(`SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cms_page')`);
    if (cmsCheck.rows[0].exists) {
      // Create About Us page
      const aboutExists = await client.query(`SELECT cms_page_id FROM cms_page WHERE url_key = 'about-us'`);
      if (aboutExists.rows.length === 0) {
        await client.query(`
          INSERT INTO cms_page (uuid, status, url_key, name, content, meta_title, meta_description, layout)
          VALUES ($1, true, 'about-us', 'Sobre nosotros', $2, 'Sobre nosotros - Speedler', 'Conoce Speedler, tu tienda de informática de confianza', 'one_column')
        `, [
          crypto.randomUUID(),
          '<h2>Sobre Speedler</h2><p>Somos tu tienda de informática de confianza. Ofrecemos componentes, periféricos y equipos informáticos al mejor precio con envío rápido a toda España.</p><h3>¿Por qué elegirnos?</h3><ul><li><strong>Más de 670 productos</strong> de las mejores marcas</li><li><strong>Envío rápido</strong> en 24-48h a toda España</li><li><strong>Garantía oficial</strong> en todos los productos</li><li><strong>Soporte técnico</strong> especializado</li><li><strong>Precios competitivos</strong> actualizados diariamente</li></ul>'
        ]);
        console.log('About Us page created');
      }
    }

    console.log('\n✅ Homepage setup completed!');
    console.log('- Hero banner widget created');
    console.log('- Featured products collection (8 products)');
    console.log('- New arrivals collection (8 products)');
    console.log('- Top 12 categories set in navigation');
    console.log('- Store settings configured');
    console.log('\nRefresh the homepage to see the changes.');

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
