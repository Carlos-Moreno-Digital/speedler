// MASTER FIX SCRIPT - Run once to fix everything
// Usage: docker cp fix-all-final.cjs speedler-app-1:/app/fixall.cjs && docker exec -it speedler-app-1 node fixall.cjs
const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function fixAll() {
  const client = await pool.connect();
  try {
    console.log('========================================');
    console.log('  SPEEDLER - MASTER FIX SCRIPT');
    console.log('========================================\n');

    // =============================================
    // 1. FIX PRODUCT NAMES FROM CSV
    // =============================================
    console.log('1/8 Fixing product names from CSV...');
    const csvPath = '/app/ProductosPropios.csv';
    if (fs.existsSync(csvPath)) {
      const content = fs.readFileSync(csvPath, 'latin1');
      const lines = content.split('\n').filter(l => l.trim());
      let fixed = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(';');
        if (cols.length < 22) continue;
        const sku = (cols[2] || '').trim();
        const nombre = (cols[10] || '').trim();
        if (!sku || !nombre || nombre === sku) continue;
        const r = await client.query(
          'UPDATE product_description SET name = $1 WHERE product_description_product_id = (SELECT product_id FROM product WHERE sku = $2 LIMIT 1)',
          [nombre, sku]
        );
        if (r.rowCount > 0) fixed++;
      }
      console.log('   -> Fixed ' + fixed + ' product names\n');
    }

    // =============================================
    // 2. REBUILD COLLECTIONS WITH IN-STOCK PRODUCTS
    // =============================================
    console.log('2/8 Rebuilding collections with in-stock products...');

    // Featured: most expensive in-stock products with real names
    await client.query('DELETE FROM product_collection WHERE collection_id = 1');
    const featured = await client.query(`
      SELECT p.product_id, pd.name, p.price FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
        AND pd.name != p.sku AND length(pd.name) > 5
      ORDER BY p.price DESC LIMIT 8
    `);
    for (const p of featured.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (1, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log('   -> Featured: ' + featured.rows.length + ' products');
    featured.rows.forEach(p => console.log('      ' + p.name + ' - ' + Number(p.price).toFixed(2) + ' EUR'));

    // Novedades: varied in-stock products with real names
    await client.query('DELETE FROM product_collection WHERE collection_id = 2');
    const novedades = await client.query(`
      SELECT p.product_id, pd.name, p.price FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
        AND pd.name != p.sku AND length(pd.name) > 5
      ORDER BY pi.qty DESC, p.price DESC LIMIT 8
    `);
    for (const p of novedades.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (2, $1) ON CONFLICT DO NOTHING', [p.product_id]);
    }
    console.log('   -> Novedades: ' + novedades.rows.length + ' products\n');

    // =============================================
    // 3. SET CATEGORIES IN NAVIGATION
    // =============================================
    console.log('3/8 Setting categories in navigation...');
    await client.query('UPDATE category SET include_in_nav = false');
    const cats = await client.query(`
      SELECT c.category_id, cd.name, COUNT(p.product_id)::int as cnt
      FROM category c
      JOIN category_description cd ON cd.category_description_category_id = c.category_id
      LEFT JOIN product p ON p.category_id = c.category_id AND p.status = true
      WHERE c.status = true GROUP BY c.category_id, cd.name
      HAVING COUNT(p.product_id) > 0 ORDER BY cnt DESC LIMIT 15
    `);
    let pos = 1;
    for (const c of cats.rows) {
      await client.query('UPDATE category SET include_in_nav = true, position = $1 WHERE category_id = $2', [pos++, c.category_id]);
    }
    console.log('   -> ' + cats.rows.length + ' categories in nav');
    cats.rows.forEach(c => console.log('      ' + c.name + ' (' + c.cnt + ' products)'));
    console.log('');

    // =============================================
    // 4. STORE SETTINGS
    // =============================================
    console.log('4/8 Configuring store settings...');
    const settings = [
      ['storeName', 'Speedler'],
      ['storeDescription', 'Tu tienda de informatica de confianza'],
      ['storeCurrency', 'EUR'],
      ['storeLanguage', 'es'],
      ['storeTimeZone', 'Europe/Madrid'],
      ['storeCountry', 'ES'],
      ['storeEmail', 'info@speedler.es'],
      ['storePhoneNumber', '900 000 000'],
      ['allowGuest', '1'],
      ['sendOrderConfirmationEmail', '1'],
      ['freeShippingMinTotal', '100'],
      ['copyRight', '© 2026 Speedler. Todos los derechos reservados.'],
    ];
    for (const [name, value] of settings) {
      await client.query(
        'INSERT INTO setting (uuid, name, value, is_json) VALUES ($1, $2, $3, false) ON CONFLICT (name) DO UPDATE SET value = $3',
        [crypto.randomUUID(), name, value]
      );
    }
    console.log('   -> Store settings updated\n');

    // =============================================
    // 5. SETUP TAX RATES FOR SPAIN
    // =============================================
    console.log('5/8 Setting up Spanish taxes...');
    // Check existing
    const existingTax = await client.query("SELECT name FROM tax_class");
    const hasIva21 = existingTax.rows.some(r => r.name.includes('21'));
    if (!hasIva21) {
      await client.query("INSERT INTO tax_class (uuid, name) VALUES ($1, 'IVA General 21%')", [crypto.randomUUID()]);
      const tc = await client.query("SELECT tax_class_id FROM tax_class WHERE name = 'IVA General 21%'");
      if (tc.rows.length > 0) {
        await client.query(
          "INSERT INTO tax_rate (uuid, name, tax_class_id, country, province, postcode, rate, is_compound, priority) VALUES ($1, 'IVA 21%', $2, 'ES', '*', '*', 21.0000, false, 1) ON CONFLICT DO NOTHING",
          [crypto.randomUUID(), tc.rows[0].tax_class_id]
        );
      }
    }
    console.log('   -> Tax classes configured\n');

    // =============================================
    // 6. CREATE ABOUT US CMS PAGE
    // =============================================
    console.log('6/8 Creating CMS pages...');
    const cmsExists = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cms_page')");
    if (cmsExists.rows[0].exists) {
      const aboutCheck = await client.query("SELECT cms_page_id FROM cms_page WHERE url_key = 'about-us'");
      if (aboutCheck.rows.length === 0) {
        const cols = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'cms_page' ORDER BY ordinal_position");
        const colNames = cols.rows.map(r => r.column_name);
        if (colNames.includes('url_key')) {
          try {
            await client.query(
              "INSERT INTO cms_page (uuid, status, url_key, name, content, meta_title, meta_description, layout) VALUES ($1, true, 'about-us', 'Sobre nosotros', 'Speedler es tu tienda de informatica de confianza.', 'Sobre nosotros - Speedler', 'Conoce Speedler', 'one_column')",
              [crypto.randomUUID()]
            );
            console.log('   -> About Us page created');
          } catch (e) {
            console.log('   -> About Us page skipped: ' + e.message);
          }
        }
      } else {
        console.log('   -> About Us page already exists');
      }
    }
    console.log('');

    // =============================================
    // 7. SETUP SHIPPING ZONES
    // =============================================
    console.log('7/8 Setting up shipping...');
    const shipCheck = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shipping_zone')");
    if (shipCheck.rows[0].exists) {
      const zoneExists = await client.query("SELECT * FROM shipping_zone WHERE country = 'ES'");
      if (zoneExists.rows.length === 0) {
        try {
          await client.query("INSERT INTO shipping_zone (uuid, name, country) VALUES ($1, 'Spain', 'ES')", [crypto.randomUUID()]);
          console.log('   -> Spain shipping zone created');
        } catch (e) {
          console.log('   -> Shipping zone skipped: ' + e.message);
        }
      } else {
        console.log('   -> Spain shipping zone already exists');
      }
    }
    console.log('');

    // =============================================
    // 8. FINAL STATS
    // =============================================
    console.log('8/8 Final statistics...');
    const stats = await client.query(`
      SELECT
        (SELECT count(*) FROM product WHERE status = true) as total_products,
        (SELECT count(*) FROM product_description WHERE length(name) > 5 AND name NOT IN (SELECT sku FROM product)) as named_products,
        (SELECT count(*) FROM product_inventory WHERE qty > 0 AND stock_availability = true) as in_stock,
        (SELECT count(*) FROM category WHERE status = true) as categories,
        (SELECT count(*) FROM category WHERE include_in_nav = true) as nav_categories,
        (SELECT count(*) FROM product_collection) as collection_products,
        (SELECT count(*) FROM widget WHERE status = true) as widgets,
        (SELECT count(*) FROM admin_user) as admins
    `);
    const st = stats.rows[0];
    console.log('   Total products:      ' + st.total_products);
    console.log('   With real names:     ' + st.named_products);
    console.log('   In stock:            ' + st.in_stock);
    console.log('   Categories:          ' + st.categories);
    console.log('   In navigation:       ' + st.nav_categories);
    console.log('   Collection products: ' + st.collection_products);
    console.log('   Active widgets:      ' + st.widgets);
    console.log('   Admin users:         ' + st.admins);

    console.log('\n========================================');
    console.log('  ALL FIXES APPLIED SUCCESSFULLY!');
    console.log('  Restart the app: docker restart speedler-app-1');
    console.log('========================================');

  } catch (e) {
    console.error('\nERROR:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

fixAll();
