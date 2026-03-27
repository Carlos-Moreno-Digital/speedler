const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function qaFix() {
  const client = await pool.connect();
  try {
    console.log('=== QA FIX - FINAL PASS ===\n');

    // 1. CHECK WIDGET TYPES - which are actually registered and render
    console.log('1. Checking registered widget types...');
    const widgets = await client.query('SELECT widget_id, name, type, sort_order, status, route, area FROM widget ORDER BY sort_order');
    console.log('   All widgets:');
    for (const w of widgets.rows) {
      console.log(`     [${w.sort_order}] ${w.name} (${w.type}) route=${JSON.stringify(w.route)} area=${JSON.stringify(w.area)} status=${w.status}`);
    }

    // 2. Remove text_block widgets that don't render on frontend
    // Keep only collection_products which we know works
    console.log('\n2. Cleaning non-rendering widgets...');
    const deleted = await client.query("DELETE FROM widget WHERE type = 'text_block' RETURNING name");
    console.log('   Removed ' + deleted.rowCount + ' text_block widgets (they dont render on frontend)');
    deleted.rows.forEach(w => console.log('     - ' + w.name));

    // 3. Fix themeConfig for logo and copyright
    console.log('\n3. Setting themeConfig properly...');
    // Check what format EverShop expects
    const existingTheme = await client.query("SELECT value, is_json FROM setting WHERE name = 'themeConfig'");
    if (existingTheme.rows.length > 0) {
      console.log('   Current themeConfig: ' + existingTheme.rows[0].value.substring(0, 200));
    }

    // EverShop reads themeConfig as JSON with specific keys
    const themeConfig = {
      logo: {
        src: '/media/speedler/logo.png',
        alt: 'Speedler',
        width: 180,
        height: 60
      },
      copyRight: '© 2026 Speedler. Todos los derechos reservados.',
      headTags: {
        metas: [],
        links: [
          { rel: 'icon', href: '/media/speedler/logo.png', type: 'image/png' }
        ],
        scripts: []
      }
    };
    await client.query(
      "INSERT INTO setting (uuid, name, value, is_json) VALUES ($1, 'themeConfig', $2, true) ON CONFLICT (name) DO UPDATE SET value = $2, is_json = true",
      [crypto.randomUUID(), JSON.stringify(themeConfig)]
    );
    console.log('   themeConfig updated with logo, copyright, and favicon');

    // 4. Create a basic_menu widget for navigation (this type IS registered by EverShop)
    console.log('\n4. Creating navigation menu widget...');
    const menuSettings = {
      items: [
        { label: 'Tienda', url: '/search' },
        { label: 'Procesadores', url: '/procesadores' },
        { label: 'Memorias', url: '/memorias' },
        { label: 'Sobre nosotros', url: '/page/sobre-nosotros' },
        { label: 'Contacto', url: '/page/contacto' }
      ]
    };
    await client.query(
      'INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area) VALUES ($1, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)',
      [crypto.randomUUID(), 'Menu Principal', 'basic_menu', JSON.stringify(menuSettings), -1, JSON.stringify(['homepage']), JSON.stringify('"header"')]
    );
    console.log('   basic_menu widget created with 5 items');

    // 5. Verify collections have products with correct prices
    console.log('\n5. Verifying collections...');
    const colls = await client.query(`
      SELECT c.name, count(pc.product_id) as cnt,
        round(avg(p.price)::numeric, 2) as avg_price,
        round(min(p.price)::numeric, 2) as min_price,
        round(max(p.price)::numeric, 2) as max_price
      FROM collection c
      LEFT JOIN product_collection pc ON pc.collection_id = c.collection_id
      LEFT JOIN product p ON p.product_id = pc.product_id
      GROUP BY c.collection_id, c.name
    `);
    for (const c of colls.rows) {
      console.log(`   ${c.name}: ${c.cnt} products, avg=${c.avg_price}€, range=${c.min_price}-${c.max_price}€`);
    }

    // 6. Check CMS pages
    console.log('\n6. CMS pages status:');
    const pages = await client.query(`
      SELECT cp.cms_page_id, cpd.name, cpd.url_key, cp.status
      FROM cms_page cp
      JOIN cms_page_description cpd ON cpd.cms_page_description_cms_page_id = cp.cms_page_id
      ORDER BY cp.cms_page_id
    `);
    for (const p of pages.rows) {
      console.log(`   [${p.status ? 'OK' : 'OFF'}] /page/${p.url_key} -> ${p.name}`);
    }

    // 7. Check categories in nav
    console.log('\n7. Categories in navigation:');
    const navCats = await client.query(`
      SELECT cd.name, cd.url_key, c.position
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      WHERE c.include_in_nav = true
      ORDER BY c.position LIMIT 15
    `);
    for (const c of navCats.rows) {
      console.log(`   [${c.position}] /${c.url_key} -> ${c.name}`);
    }

    // 8. Check payment settings
    console.log('\n8. Payment settings:');
    const paySettings = await client.query("SELECT name, value FROM setting WHERE name LIKE '%cod%' OR name LIKE '%payment%' OR name LIKE '%Payment%'");
    for (const s of paySettings.rows) {
      console.log(`   ${s.name} = ${s.value}`);
    }

    // 9. Check store settings
    console.log('\n9. Key store settings:');
    const storeSettings = await client.query("SELECT name, value FROM setting WHERE name IN ('storeName','copyRight','storeCurrency','storeLanguage','storeCountry','freeShippingMinTotal')");
    for (const s of storeSettings.rows) {
      console.log(`   ${s.name} = ${s.value}`);
    }

    // 10. Final product stats
    console.log('\n10. Product stats:');
    const stats = await client.query(`SELECT
      (SELECT count(*) FROM product WHERE status = true) as active,
      (SELECT count(*) FROM product WHERE status = true AND price BETWEEN 1 AND 10000) as reasonable,
      (SELECT count(*) FROM product_image) as images,
      (SELECT count(*) FROM product WHERE canon_digital_amount > 0) as canon,
      (SELECT count(*) FROM product_inventory WHERE qty > 0 AND stock_availability = true) as in_stock
    `);
    const st = stats.rows[0];
    console.log(`   Active: ${st.active} | Reasonable price: ${st.reasonable} | Images: ${st.images} | Canon: ${st.canon} | In stock: ${st.in_stock}`);

    // 11. Remaining widgets
    console.log('\n11. Final widget list:');
    const finalWidgets = await client.query('SELECT name, type, sort_order, route, area FROM widget WHERE status = true ORDER BY sort_order');
    for (const w of finalWidgets.rows) {
      console.log(`   [${w.sort_order}] ${w.name} (${w.type})`);
    }

    console.log('\n=== QA COMPLETE ===');
    console.log('Issues remaining:');
    console.log('  - Provider product prices need re-sync with corrected parser');
    console.log('  - Logo requires theme file deployment (not just DB setting)');
    console.log('  - Hero/newsletter need EverShop theme extension (text_block doesnt render on frontend)');
    console.log('Restart: docker restart speedler-app-1');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
qaFix();
