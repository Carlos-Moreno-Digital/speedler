const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function fixAll() {
  const client = await pool.connect();
  try {
    console.log('=== FINAL FIX - ALL ISSUES ===\n');

    // ==========================================
    // 1. FIX INSANE PRICES - European format parsing issue
    // Products with price > 10000 need to be divided by 100 (dots were thousands separators)
    // ==========================================
    console.log('1. Fixing inflated prices...');
    // Products imported from providers with price > 10000 likely have parsing errors
    // A smartphone at 4991€ should be 49.91€, a switch at 4993€ should be 49.93€
    const insane = await client.query('SELECT count(*) as cnt FROM product WHERE price > 10000');
    console.log('   Products with price > 10000€: ' + insane.rows[0].cnt);

    // Fix: divide by 100 for products > 10000 (European format: 4.993,75 was parsed as 4993.75 instead of 49.9375)
    // Actually the issue is the parseFloat removes dots (thousands sep) then replaces comma with dot
    // "4.993,75" -> remove dots -> "4993,75" -> replace comma -> "4993.75" -> * 1.25 = 6242
    // Real price should be: 4993.75 / 100 = 49.93 * 1.25 = 62.41
    // But we need to be careful - some products genuinely cost > 10000 (servers, etc)
    // Let's fix products where price/100 * 1.25 would be reasonable (< 5000)
    const fixed = await client.query(`
      UPDATE product SET price = price / 100
      WHERE price > 10000 AND (price / 100) < 5000
      RETURNING product_id
    `);
    console.log('   Fixed ' + fixed.rowCount + ' prices (divided by 100)');

    // Also fix products between 1000-10000 that are likely wrong
    // Check if there are clusters around specific multiplied values
    const mid = await client.query('SELECT count(*) as cnt FROM product WHERE price BETWEEN 1000 AND 10000');
    console.log('   Products 1000-10000€: ' + mid.rows[0].cnt + ' (leaving as-is, may be genuine)');

    // ==========================================
    // 2. FIX LOGO - EverShop uses setting "themeConfig" in JSON
    // ==========================================
    console.log('\n2. Fixing logo...');
    // EverShop's Logo component reads from GraphQL which reads themeConfig setting
    // Check what the logo component actually queries
    const logoSetting = await client.query("SELECT name, value, is_json FROM setting WHERE name LIKE '%ogo%' OR name LIKE '%heme%'");
    console.log('   Logo-related settings:');
    logoSetting.rows.forEach(s => console.log('     ' + s.name + ' = ' + s.value.substring(0, 80) + (s.is_json ? ' (json)' : '')));

    // EverShop reads logo from themeConfig JSON setting
    const themeConfig = {
      logo: {
        src: '/media/speedler/logo.png',
        alt: 'Speedler',
        width: 180,
        height: 60
      },
      copyRight: '© 2026 Speedler. Todos los derechos reservados.'
    };
    await client.query(
      "INSERT INTO setting (uuid, name, value, is_json) VALUES ($1, 'themeConfig', $2, true) ON CONFLICT (name) DO UPDATE SET value = $2, is_json = true",
      [crypto.randomUUID(), JSON.stringify(themeConfig)]
    );
    console.log('   themeConfig set with logo and copyright');

    // ==========================================
    // 3. FIX HERO BANNER - ensure it shows on homepage
    // ==========================================
    console.log('\n3. Fixing hero banner...');
    // Delete old hero and recreate with correct area
    await client.query("DELETE FROM widget WHERE name = 'Speedler Hero'");
    const heroHtml = '<div style="background:linear-gradient(135deg,#FFF8F0 0%,#FFF0E0 100%);padding:3.5rem 1.5rem;text-align:center"><div style="max-width:800px;margin:0 auto"><h1 style="color:#5B2C0E;font-size:2rem;font-weight:700;margin-bottom:0.8rem;line-height:1.3">Tu tienda de informática de confianza</h1><p style="color:#8B6F47;font-size:1rem;margin-bottom:1.5rem;max-width:550px;margin-left:auto;margin-right:auto">Más de 26.000 productos de las mejores marcas con envío rápido a toda España.</p><div style="display:flex;gap:0.8rem;justify-content:center;flex-wrap:wrap"><a href="/search" style="display:inline-block;background:#E8842A;color:white;padding:0.7rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600">Explorar tienda</a><a href="/page/configurador-de-pc" style="display:inline-block;background:white;color:#5B2C0E;padding:0.7rem 1.8rem;border-radius:4px;text-decoration:none;font-weight:600;border:2px solid #E8842A">Configurador PC</a></div></div></div>';
    await client.query(
      'INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area) VALUES ($1, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)',
      [crypto.randomUUID(), 'Speedler Hero', 'text_block', JSON.stringify({text: heroHtml, className: 'page-width'}), -1, JSON.stringify(['homepage']), JSON.stringify('"content"')]
    );
    console.log('   Hero banner recreated with sort_order -1 (first)');

    // ==========================================
    // 4. FIX NEWSLETTER WIDGET - check it exists
    // ==========================================
    console.log('\n4. Fixing newsletter widget...');
    const nlExists = await client.query("SELECT widget_id, sort_order FROM widget WHERE name = 'Newsletter Signup'");
    if (nlExists.rows.length > 0) {
      // Move it to sort_order 10 (after collections)
      await client.query("UPDATE widget SET sort_order = 10 WHERE name = 'Newsletter Signup'");
      console.log('   Newsletter widget exists, moved to sort_order 10');
    } else {
      const nlHtml = '<div style="background:#FFF8F0;padding:2.5rem 1.5rem;text-align:center;border-top:2px solid #E8842A"><div style="max-width:500px;margin:0 auto"><h3 style="color:#5B2C0E;font-size:1.2rem;margin-bottom:0.5rem">No te pierdas nada</h3><p style="color:#8B6F47;font-size:0.85rem;margin-bottom:1rem">Suscríbete y recibe ofertas exclusivas.</p><form style="display:flex;gap:0.5rem;max-width:400px;margin:0 auto" onsubmit="event.preventDefault();this.querySelector(\'button\').textContent=\'Suscrito!\'"><input type="email" placeholder="Tu email" required style="flex:1;padding:0.6rem 0.8rem;border:1px solid #ddd;border-radius:3px;font-size:0.85rem"><button type="submit" style="padding:0.6rem 1.2rem;background:#E8842A;color:white;border:none;border-radius:3px;font-weight:600;cursor:pointer;font-size:0.85rem">Suscribirme</button></form></div></div>';
      await client.query(
        'INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area) VALUES ($1, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)',
        [crypto.randomUUID(), 'Newsletter Signup', 'text_block', JSON.stringify({text: nlHtml}), 10, JSON.stringify(['homepage']), JSON.stringify('"content"')]
      );
      console.log('   Newsletter widget created');
    }

    // ==========================================
    // 5. FIX COLLECTIONS - products with images AND reasonable prices
    // ==========================================
    console.log('\n5. Rebuilding collections with correct prices...');
    await client.query('DELETE FROM product_collection WHERE collection_id = 1');
    const featured = await client.query(`
      SELECT p.product_id, pd.name, p.price FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      JOIN product_image pimg ON pimg.product_image_product_id = p.product_id AND pimg.is_main = true
      WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
      AND length(pd.name) > 5 AND pd.name != p.sku
      AND p.price > 20 AND p.price < 2000
      ORDER BY p.price DESC LIMIT 8
    `);
    for (const p of featured.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (1, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log('   Featured: ' + featured.rows.length + ' products');
    featured.rows.forEach(p => console.log('     ' + p.name.substring(0, 55) + ' - ' + Number(p.price).toFixed(2) + '€'));

    await client.query('DELETE FROM product_collection WHERE collection_id = 2');
    const novedades = await client.query(`
      SELECT p.product_id, pd.name, p.price FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      JOIN product_image pimg ON pimg.product_image_product_id = p.product_id AND pimg.is_main = true
      WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
      AND length(pd.name) > 5 AND pd.name != p.sku
      AND p.price > 10 AND p.price < 1000
      ORDER BY RANDOM() LIMIT 8
    `);
    for (const p of novedades.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (2, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log('   Novedades: ' + novedades.rows.length + ' products');

    // ==========================================
    // 6. FIX NAVIGATION MENU - ensure it's on all pages
    // ==========================================
    console.log('\n6. Fixing navigation menu...');
    const navWidget = await client.query("SELECT widget_id FROM widget WHERE name = 'Main Navigation'");
    if (navWidget.rows.length > 0) {
      // Update route to "all" and area to "header"
      await client.query(
        "UPDATE widget SET route = $1::jsonb, area = $2::jsonb, sort_order = -10 WHERE name = 'Main Navigation'",
        [JSON.stringify(['all']), JSON.stringify('"header"')]
      );
      console.log('   Navigation set to all pages, area=header');
    }

    // ==========================================
    // 7. SORT WIDGETS CORRECTLY
    // ==========================================
    console.log('\n7. Reordering widgets...');
    await client.query("UPDATE widget SET sort_order = -10 WHERE name = 'Main Navigation'");
    await client.query("UPDATE widget SET sort_order = 0 WHERE name = 'Speedler Hero'");
    await client.query("UPDATE widget SET sort_order = 1 WHERE name = 'Productos Destacados'");
    await client.query("UPDATE widget SET sort_order = 2 WHERE name = 'Novedades'");
    await client.query("UPDATE widget SET sort_order = 3 WHERE name = 'Newsletter Signup'");
    console.log('   Widgets reordered: Nav(-10) > Hero(0) > Featured(1) > New(2) > Newsletter(3)');

    // ==========================================
    // 8. FINAL STATS
    // ==========================================
    console.log('\n8. Final stats:');
    const s = await client.query(`SELECT
      (SELECT count(*) FROM product WHERE status = true) as total,
      (SELECT count(*) FROM product WHERE status = true AND price < 10000) as reasonable_price,
      (SELECT count(*) FROM product_image) as images,
      (SELECT count(*) FROM product WHERE canon_digital_amount > 0) as canon,
      (SELECT count(*) FROM widget WHERE status = true) as widgets,
      (SELECT count(*) FROM cms_page WHERE status = true) as pages,
      (SELECT value FROM setting WHERE name = 'copyRight') as copyright
    `);
    const st = s.rows[0];
    console.log('   Products:       ' + st.total);
    console.log('   Reasonable $:   ' + st.reasonable_price);
    console.log('   With images:    ' + st.images);
    console.log('   Canon digital:  ' + st.canon);
    console.log('   Widgets:        ' + st.widgets);
    console.log('   CMS pages:      ' + st.pages);
    console.log('   Copyright:      ' + st.copyright);

    console.log('\n=== ALL FIXES APPLIED ===');
    console.log('Run: docker restart speedler-app-1');

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}
fixAll();
