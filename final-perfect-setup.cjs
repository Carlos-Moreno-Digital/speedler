// SPEEDLER FINAL SETUP - Verified against EverShop source code
// This script fixes ALL known issues in one run
const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

function uid() { return crypto.randomUUID().split('-')[0]; }

async function run() {
  const client = await pool.connect();
  try {
    console.log('================================================');
    console.log('  SPEEDLER - FINAL PERFECT SETUP');
    console.log('================================================\n');

    // ==========================================
    // 1. FIX ALL WIDGET AREAS AND ROUTES
    // area and route MUST be JSONB arrays, NOT strings
    // ==========================================
    console.log('[1/7] Fixing widget area/route formats...');

    // Delete ALL existing widgets and recreate correctly
    await client.query('DELETE FROM widget');
    console.log('   Cleared all widgets');

    // Get collection codes
    const collections = await client.query('SELECT collection_id, code, name FROM collection ORDER BY collection_id');
    console.log('   Found ' + collections.rows.length + ' collections');

    // Create collection_products widgets with CORRECT jsonb arrays
    let sortOrder = 1;
    for (const col of collections.rows) {
      const count = await client.query('SELECT count(*)::int as cnt FROM product_collection WHERE collection_id = $1', [col.collection_id]);
      if (parseInt(count.rows[0].cnt) === 0) continue;

      await client.query(
        `INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area)
         VALUES ($1, $2, 'collection_products', $3::jsonb, $4, true, '["homepage"]'::jsonb, '["content"]'::jsonb)`,
        [
          crypto.randomUUID(),
          col.name,
          JSON.stringify({ collection: col.code, count: 8, countPerRow: 4 }),
          sortOrder++
        ]
      );
      console.log('   Widget: ' + col.name + ' (sort ' + (sortOrder-1) + ')');
    }

    // ==========================================
    // 2. CREATE NAVIGATION MENU (basic_menu)
    // Format: settings.menus = [{name, url, type:'custom', uuid, children:[]}]
    // ==========================================
    console.log('\n[2/7] Creating navigation menu...');

    const menuSettings = {
      menus: [
        { name: 'Tienda', url: '/search', type: 'custom', uuid: uid(), id: uid(), children: [] },
        { name: 'Procesadores', url: '/procesadores', type: 'custom', uuid: uid(), id: uid(), children: [] },
        { name: 'Memorias', url: '/memorias', type: 'custom', uuid: uid(), id: uid(), children: [] },
        { name: 'Ordenadores', url: '/ordenadores', type: 'custom', uuid: uid(), id: uid(), children: [] },
        { name: 'Sobre nosotros', url: '/page/sobre-nosotros', type: 'custom', uuid: uid(), id: uid(), children: [] },
        { name: 'Contacto', url: '/page/contacto', type: 'custom', uuid: uid(), id: uid(), children: [] },
      ],
      isMain: true,
      className: ''
    };

    await client.query(
      `INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area)
       VALUES ($1, 'Menu Principal', 'basic_menu', $2::jsonb, 0, true, '["all"]'::jsonb, '["headerBottom"]'::jsonb)`,
      [crypto.randomUUID(), JSON.stringify(menuSettings)]
    );
    console.log('   Menu created with ' + menuSettings.menus.length + ' items');
    console.log('   Route: ["all"] (all pages), Area: ["headerBottom"]');

    // ==========================================
    // 3. VERIFY WIDGET DATA IS CORRECT
    // ==========================================
    console.log('\n[3/7] Verifying widget data...');
    const widgets = await client.query(
      'SELECT name, type, jsonb_typeof(area) as area_type, jsonb_typeof(route) as route_type, area::text, route::text FROM widget WHERE status = true ORDER BY sort_order'
    );
    let allOk = true;
    for (const w of widgets.rows) {
      const areaOk = w.area_type === 'array';
      const routeOk = w.route_type === 'array';
      if (!areaOk || !routeOk) allOk = false;
      console.log('   ' + (areaOk && routeOk ? 'OK' : 'FAIL') + ' ' + w.name +
        ' area=' + w.area + '(' + w.area_type + ') route=' + w.route + '(' + w.route_type + ')');
    }
    console.log('   All widgets valid: ' + allOk);

    // ==========================================
    // 4. UPDATE STORE SETTINGS
    // ==========================================
    console.log('\n[4/7] Updating store settings...');
    const settings = [
      ['storeName', 'Speedler'],
      ['storeDescription', 'Tu tienda de informática de confianza'],
      ['storeCurrency', 'EUR'],
      ['storeLanguage', 'es'],
      ['storeCountry', 'ES'],
      ['storeTimeZone', 'Europe/Madrid'],
      ['storeEmail', 'info@speedler.es'],
      ['storePhoneNumber', '900 000 000'],
      ['allowGuest', '1'],
      ['copyRight', '© 2026 Speedler. Todos los derechos reservados.'],
      ['freeShippingMinTotal', '100'],
    ];
    for (const [name, value] of settings) {
      await client.query(
        'INSERT INTO setting (uuid, name, value, is_json) VALUES ($1, $2, $3, false) ON CONFLICT (name) DO UPDATE SET value = $3',
        [crypto.randomUUID(), name, value]
      );
    }
    console.log('   ' + settings.length + ' settings updated');

    // ==========================================
    // 5. FIX PRODUCT DESCRIPTIONS
    // ==========================================
    console.log('\n[5/7] Ensuring product descriptions...');
    const descFix = await client.query(`
      UPDATE product_description SET short_description = name
      WHERE (short_description IS NULL OR short_description = '') AND name IS NOT NULL AND name != ''
    `);
    console.log('   ' + descFix.rowCount + ' products got descriptions');

    // ==========================================
    // 6. CATEGORIES IN NAVIGATION
    // ==========================================
    console.log('\n[6/7] Setting top categories in nav...');
    await client.query('UPDATE category SET include_in_nav = false');
    const cats = await client.query(`
      SELECT c.category_id, cd.name, COUNT(p.product_id)::int as cnt
      FROM category c JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id AND p.status = true
      WHERE c.status = true GROUP BY c.category_id, cd.name HAVING COUNT(p.product_id) > 10
      ORDER BY cnt DESC LIMIT 20
    `);
    let pos = 1;
    for (const c of cats.rows) {
      await client.query('UPDATE category SET include_in_nav = true, position = $1 WHERE category_id = $2', [pos++, c.category_id]);
    }
    console.log('   ' + cats.rows.length + ' categories in nav');

    // ==========================================
    // 7. FINAL VERIFICATION
    // ==========================================
    console.log('\n[7/7] Final verification...');

    const stats = await client.query(`SELECT
      (SELECT count(*) FROM product WHERE status = true) as products,
      (SELECT count(*) FROM product_inventory WHERE qty > 0 AND stock_availability = true) as in_stock,
      (SELECT count(*) FROM product_image WHERE is_main = true) as with_images,
      (SELECT count(*) FROM widget WHERE status = true) as widgets,
      (SELECT count(*) FROM category WHERE include_in_nav = true) as nav_cats,
      (SELECT count(*) FROM collection) as collections,
      (SELECT count(*) FROM product_collection) as collection_items
    `);
    const s = stats.rows[0];

    console.log('\n   ┌─────────────────────────────────────┐');
    console.log('   │  SPEEDLER STORE STATUS               │');
    console.log('   ├─────────────────────────────────────┤');
    console.log('   │  Products:        ' + String(s.products).padStart(6) + '            │');
    console.log('   │  In stock:        ' + String(s.in_stock).padStart(6) + '            │');
    console.log('   │  With images:     ' + String(s.with_images).padStart(6) + '            │');
    console.log('   │  Active widgets:  ' + String(s.widgets).padStart(6) + '            │');
    console.log('   │  Nav categories:  ' + String(s.nav_cats).padStart(6) + '            │');
    console.log('   │  Collections:     ' + String(s.collections).padStart(6) + '            │');
    console.log('   │  Collection items:' + String(s.collection_items).padStart(6) + '            │');
    console.log('   └─────────────────────────────────────┘');

    // Verify no broken widgets
    const broken = await client.query("SELECT count(*) as cnt FROM widget WHERE status = true AND (jsonb_typeof(area) != 'array' OR jsonb_typeof(route) != 'array')");
    if (parseInt(broken.rows[0].cnt) > 0) {
      console.log('\n   ⚠️  WARNING: ' + broken.rows[0].cnt + ' widgets have broken area/route format!');
    } else {
      console.log('\n   ✅ All widgets have correct format');
    }

    console.log('\n================================================');
    console.log('  SETUP COMPLETE - Restart app to apply');
    console.log('  docker restart speedler-app-1');
    console.log('================================================');

  } catch (e) {
    console.error('\n❌ ERROR:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
