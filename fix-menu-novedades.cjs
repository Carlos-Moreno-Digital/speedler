const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function fix() {
  const client = await pool.connect();
  try {
    console.log('=== Fix Menu + Novedades ===\n');

    // 1. Fix menu widget - EverShop expects "menus" array with {label, url} objects
    console.log('1. Fixing menu widget format...');
    const menuSettings = {
      menus: [
        { label: 'Tienda', url: '/search' },
        { label: 'Procesadores', url: '/procesadores' },
        { label: 'Memorias', url: '/memorias' },
        { label: 'Sobre nosotros', url: '/page/sobre-nosotros' },
        { label: 'Contacto', url: '/page/contacto' }
      ],
      isMain: true
    };
    await client.query(
      "UPDATE widget SET settings = $1::jsonb WHERE name = 'Menu Principal'",
      [JSON.stringify(menuSettings)]
    );
    console.log('   Menu updated with menus[] format');

    // 2. Rebuild novedades with products that HAVE images
    console.log('\n2. Rebuilding novedades with products that have images...');
    await client.query('DELETE FROM product_collection WHERE collection_id = 2');
    const novedades = await client.query(`
      SELECT p.product_id, pd.name, p.price FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      JOIN product_image pimg ON pimg.product_image_product_id = p.product_id AND pimg.is_main = true
      WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
      AND length(pd.name) > 10 AND pd.name != p.sku
      AND p.price BETWEEN 5 AND 500
      AND pimg.origin_image IS NOT NULL AND pimg.origin_image != ''
      ORDER BY RANDOM() LIMIT 8
    `);
    for (const p of novedades.rows) {
      await client.query('INSERT INTO product_collection (collection_id, product_id) VALUES (2, $1)', [p.product_id]);
      console.log('   ' + p.name.substring(0, 55) + ' - ' + Number(p.price).toFixed(2) + '€');
    }

    // 3. Verify logo file path
    console.log('\n3. Checking logo file...');
    const fs = require('fs');
    const logoPaths = ['/app/media/speedler/logo.png', '/app/media/logo.png'];
    for (const lp of logoPaths) {
      const exists = fs.existsSync(lp);
      console.log('   ' + lp + ': ' + (exists ? 'EXISTS (' + fs.statSync(lp).size + ' bytes)' : 'NOT FOUND'));
    }

    console.log('\n=== DONE ===');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
fix();
