const { Pool } = require('pg');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function setup() {
  const client = await pool.connect();
  try {
    console.log('=== Speedler Logo & Theme Setup ===\n');

    // 1. Update logo settings
    console.log('1. Updating logo and branding settings...');
    const settings = [
      // Logo - EverShop reads these from setting table
      ['storeLogo', '/assets/theme/frontStore/default/logo.png'],
      ['storeLogoWidth', '180'],
      ['storeLogoHeight', '60'],
      ['storeFavicon', '/assets/theme/frontStore/default/logo.png'],
      // Copyright
      ['copyRight', '© 2026 Speedler. Todos los derechos reservados.'],
      // Store info
      ['storeName', 'Speedler'],
      ['storeDescription', 'Tu tienda de informática de confianza. Componentes, periféricos y equipos al mejor precio.'],
      ['storeEmail', 'info@speedler.es'],
      ['storePhoneNumber', '900 000 000'],
    ];

    for (const [name, value] of settings) {
      await client.query(
        'INSERT INTO setting (uuid, name, value, is_json) VALUES ($1, $2, $3, false) ON CONFLICT (name) DO UPDATE SET value = $3',
        [crypto.randomUUID(), name, value]
      );
    }
    console.log('   Settings updated');

    // 2. Check what EverShop actually reads for logo
    console.log('\n2. Checking logo-related settings...');
    const logoSettings = await client.query(
      "SELECT name, value FROM setting WHERE name LIKE '%ogo%' OR name LIKE '%avicon%' OR name LIKE '%opyRight%' OR name LIKE '%opyright%'"
    );
    for (const s of logoSettings.rows) {
      console.log('   ' + s.name + ' = ' + s.value);
    }

    // 3. Check if there's a theme config table
    console.log('\n3. Checking theme configuration...');
    const themeCheck = await client.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%theme%'"
    );
    console.log('   Theme tables:', themeCheck.rows.map(r => r.table_name));

    // 4. Update the homepage widgets to use Speedler brand colors
    console.log('\n4. Updating widget styles to Speedler orange brand...');

    // Update navigation menu with Speedler colors
    const navWidget = await client.query("SELECT widget_id, settings FROM widget WHERE name = 'Main Navigation'");
    if (navWidget.rows.length > 0) {
      const menuHtml = '<nav style="display:flex;gap:2rem;justify-content:center;padding:0.75rem 0;background:#fff;border-bottom:1px solid #eee"><a href="/search" style="color:#5B2C0E;text-decoration:none;font-weight:600;font-size:0.9rem;transition:color 0.2s" onmouseover="this.style.color=\'#E8842A\'" onmouseout="this.style.color=\'#5B2C0E\'">Tienda</a><a href="/page/configurador-de-pc" style="color:#5B2C0E;text-decoration:none;font-weight:600;font-size:0.9rem" onmouseover="this.style.color=\'#E8842A\'" onmouseout="this.style.color=\'#5B2C0E\'">Configurador PC</a><a href="/page/sobre-nosotros" style="color:#5B2C0E;text-decoration:none;font-weight:600;font-size:0.9rem" onmouseover="this.style.color=\'#E8842A\'" onmouseout="this.style.color=\'#5B2C0E\'">Sobre nosotros</a><a href="/page/contacto" style="color:#5B2C0E;text-decoration:none;font-weight:600;font-size:0.9rem" onmouseover="this.style.color=\'#E8842A\'" onmouseout="this.style.color=\'#5B2C0E\'">Contacto</a></nav>';
      await client.query(
        "UPDATE widget SET settings = $1::jsonb WHERE widget_id = $2",
        [JSON.stringify({text: menuHtml}), navWidget.rows[0].widget_id]
      );
      console.log('   Navigation menu updated with Speedler colors');
    }

    // Check if newsletter widget exists and update colors
    const nlWidget = await client.query("SELECT widget_id FROM widget WHERE name = 'Newsletter Signup'");
    if (nlWidget.rows.length > 0) {
      const nlHtml = '<div style="background:#FFF8F0;padding:3rem 1.5rem;text-align:center;border-top:3px solid #E8842A"><div style="max-width:600px;margin:0 auto"><h3 style="color:#5B2C0E;font-size:1.3rem;margin-bottom:0.5rem">No te pierdas nada</h3><p style="color:#8B6F47;font-size:0.9rem;margin-bottom:1.5rem">Suscríbete y recibe ofertas exclusivas y novedades.</p><form style="display:flex;gap:0.5rem;max-width:450px;margin:0 auto" onsubmit="event.preventDefault();this.querySelector(\'button\').textContent=\'¡Suscrito!\';this.querySelector(\'button\').style.background=\'#2d7a3a\'"><input type="email" placeholder="Tu email" required style="flex:1;padding:0.7rem 1rem;border:1px solid #ddd;border-radius:3px;font-size:0.9rem;outline:none" onfocus="this.style.borderColor=\'#E8842A\'" onblur="this.style.borderColor=\'#ddd\'"><button type="submit" style="padding:0.7rem 1.5rem;background:#E8842A;color:white;border:none;border-radius:3px;font-weight:600;cursor:pointer;font-size:0.9rem;white-space:nowrap">Suscribirme</button></form></div></div>';
      await client.query(
        "UPDATE widget SET settings = $1::jsonb WHERE widget_id = $2",
        [JSON.stringify({text: nlHtml}), nlWidget.rows[0].widget_id]
      );
      console.log('   Newsletter widget updated with Speedler colors');
    }

    // 5. Add a hero/banner widget with Speedler branding
    console.log('\n5. Creating Speedler hero banner...');
    const heroExists = await client.query("SELECT widget_id FROM widget WHERE name = 'Speedler Hero'");
    if (heroExists.rows.length === 0) {
      const heroHtml = '<div style="background:linear-gradient(135deg,#FFF8F0 0%,#FFF0E0 100%);padding:4rem 1.5rem;text-align:center"><div style="max-width:800px;margin:0 auto"><h1 style="color:#5B2C0E;font-size:2.2rem;font-weight:700;margin-bottom:1rem;line-height:1.2">Tu tienda de informática de confianza</h1><p style="color:#8B6F47;font-size:1.1rem;margin-bottom:2rem;max-width:600px;margin-left:auto;margin-right:auto">Más de 26.000 productos de las mejores marcas. Componentes, periféricos y equipos al mejor precio con envío rápido a toda España.</p><div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap"><a href="/search" style="display:inline-block;background:#E8842A;color:white;padding:0.8rem 2rem;border-radius:4px;text-decoration:none;font-weight:600;font-size:1rem;transition:background 0.2s" onmouseover="this.style.background=\'#D4751F\'" onmouseout="this.style.background=\'#E8842A\'">Explorar tienda</a><a href="/page/configurador-de-pc" style="display:inline-block;background:white;color:#5B2C0E;padding:0.8rem 2rem;border-radius:4px;text-decoration:none;font-weight:600;font-size:1rem;border:2px solid #E8842A;transition:background 0.2s" onmouseover="this.style.background=\'#FFF0E0\'" onmouseout="this.style.background=\'white\'">Configurador PC</a></div><div style="display:flex;gap:2rem;justify-content:center;margin-top:2rem;flex-wrap:wrap"><span style="color:#8B6F47;font-size:0.85rem">✓ Envío 24-48h</span><span style="color:#8B6F47;font-size:0.85rem">✓ Garantía 3 años</span><span style="color:#8B6F47;font-size:0.85rem">✓ Soporte técnico</span><span style="color:#8B6F47;font-size:0.85rem">✓ +26.000 productos</span></div></div></div>';
      await client.query(
        'INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area) VALUES ($1, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)',
        [crypto.randomUUID(), 'Speedler Hero', 'text_block', JSON.stringify({text: heroHtml}), 0, JSON.stringify(['homepage']), JSON.stringify('"content"')]
      );
      console.log('   Hero banner created with Speedler branding');
    } else {
      console.log('   Hero already exists');
    }

    // 6. Update collection widget descriptions
    console.log('\n6. Updating collection descriptions...');
    await client.query("UPDATE widget SET settings = jsonb_set(settings, '{name}', '\"Productos Destacados\"') WHERE name = 'Productos Destacados'");
    await client.query("UPDATE widget SET settings = jsonb_set(settings, '{description}', '\"Los productos más populares de nuestra tienda\"') WHERE name = 'Productos Destacados'");
    await client.query("UPDATE widget SET settings = jsonb_set(settings, '{name}', '\"Novedades\"') WHERE name = 'Novedades'");
    await client.query("UPDATE widget SET settings = jsonb_set(settings, '{description}', '\"Los últimos productos añadidos\"') WHERE name = 'Novedades'");

    // 7. Stats
    console.log('\n7. Final store stats:');
    const stats = await client.query(`
      SELECT
        (SELECT count(*) FROM product WHERE status = true) as products,
        (SELECT count(*) FROM category WHERE status = true) as categories,
        (SELECT count(*) FROM product_image) as images,
        (SELECT count(*) FROM product WHERE canon_digital_amount > 0) as canon_products,
        (SELECT count(*) FROM cms_page WHERE status = true) as pages,
        (SELECT count(*) FROM widget WHERE status = true) as widgets,
        (SELECT count(*) FROM product_inventory WHERE stock_availability = true AND qty > 0) as in_stock
    `);
    const s = stats.rows[0];
    console.log('   Products:        ' + s.products);
    console.log('   In stock:        ' + s.in_stock);
    console.log('   With images:     ' + s.images);
    console.log('   Canon digital:   ' + s.canon_products);
    console.log('   Categories:      ' + s.categories);
    console.log('   CMS pages:       ' + s.pages);
    console.log('   Active widgets:  ' + s.widgets);

    console.log('\n=== SPEEDLER THEME SETUP COMPLETE ===');
    console.log('Restart the app to see changes: docker restart speedler-app-1');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
setup();
