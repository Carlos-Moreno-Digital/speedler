// Comprehensive branding, pages, and SEO setup for Speedler EverShop store
// Usage: docker cp setup-branding-pages.cjs speedler-app-1:/app/ && docker exec speedler-app-1 node setup-branding-pages.cjs
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

function uuid() {
  return crypto.randomUUID();
}

async function main() {
  const client = await pool.connect();
  try {
    console.log('================================================');
    console.log('  SPEEDLER - BRANDING, PAGES & SEO SETUP');
    console.log('================================================\n');

    // =========================================================
    // 1. UPDATE STORE SETTINGS
    // =========================================================
    console.log('[1/6] Updating store settings...');

    const settings = [
      ['storeName', 'Speedler'],
      ['storeDescription', 'Tu tienda de informática de confianza. Componentes, periféricos y equipos al mejor precio.'],
      ['copyRight', '© 2026 Speedler. Todos los derechos reservados.'],
      ['storeLogo', '/media/logo.png'],
      ['storeFavicon', '/media/logo.png'],
      ['storeEmail', 'info@speedler.es'],
      ['storePhoneNumber', '900 000 000'],
      ['storeCurrency', 'EUR'],
      ['storeLanguage', 'es'],
      ['storeCountry', 'ES'],
      ['storeTimeZone', 'Europe/Madrid'],
      ['allowGuest', '1'],
      ['freeShippingMinTotal', '100'],
      ['sendOrderConfirmationEmail', '1'],
      ['sendOrderCompleteEmail', '1'],
    ];

    let settingsUpdated = 0;
    for (const [name, value] of settings) {
      await client.query(
        `INSERT INTO setting (uuid, name, value, is_json)
         VALUES ($1, $2, $3, false)
         ON CONFLICT (name) DO UPDATE SET value = $3`,
        [uuid(), name, value]
      );
      settingsUpdated++;
    }
    console.log(`   -> ${settingsUpdated} settings upserted`);
    settings.forEach(([n, v]) => {
      const display = v.length > 60 ? v.substring(0, 57) + '...' : v;
      console.log(`      ${n} = ${display}`);
    });
    console.log('');

    // =========================================================
    // 2. CREATE CMS PAGES
    // =========================================================
    console.log('[2/6] Creating CMS pages...');

    // First, check if cms_page table exists
    const cmsTableCheck = await client.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cms_page')`
    );

    if (!cmsTableCheck.rows[0].exists) {
      console.log('   -> cms_page table does not exist, skipping CMS pages\n');
    } else {
      // Read the actual schema
      const cmsCols = await client.query(
        `SELECT column_name, data_type, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_name = 'cms_page'
         ORDER BY ordinal_position`
      );
      const colNames = cmsCols.rows.map(r => r.column_name);
      console.log('   -> cms_page columns:', colNames.join(', '));

      // Define CMS pages
      const cmsPages = [
        {
          url_key: 'contacto',
          name: 'Contacto',
          content: `<div class="contact-page">
<h1>Contacto</h1>
<p>Estamos aquí para ayudarte. Ponte en contacto con nosotros a través de cualquiera de los siguientes medios:</p>
<ul>
  <li><strong>Email:</strong> <a href="mailto:info@speedler.es">info@speedler.es</a></li>
  <li><strong>Teléfono:</strong> 900 000 000 (L-V, 9:00 - 18:00)</li>
  <li><strong>Dirección:</strong> Calle de la Tecnología, 1, 28001 Madrid, España</li>
</ul>
<p>Nuestro equipo de atención al cliente responderá a tu consulta en un plazo máximo de 24 horas laborables.</p>
</div>`,
          meta_title: 'Contacto - Speedler',
          meta_description: 'Ponte en contacto con Speedler. Email, teléfono y dirección de tu tienda de informática de confianza.',
        },
        {
          url_key: 'politica-de-privacidad',
          name: 'Política de Privacidad',
          content: `<div class="legal-page">
<h1>Política de Privacidad</h1>
<p><strong>Última actualización:</strong> 1 de enero de 2026</p>

<h2>1. Responsable del tratamiento</h2>
<p>Speedler, con domicilio en Calle de la Tecnología, 1, 28001 Madrid, España. Email: info@speedler.es</p>

<h2>2. Datos que recopilamos</h2>
<p>Recopilamos los datos personales que nos proporcionas al realizar un pedido: nombre, dirección de envío y facturación, email, teléfono y datos de pago.</p>

<h2>3. Finalidad del tratamiento</h2>
<ul>
  <li>Gestionar y procesar tus pedidos</li>
  <li>Enviarte confirmaciones y actualizaciones de estado</li>
  <li>Atender tus consultas y reclamaciones</li>
  <li>Cumplir con nuestras obligaciones legales y fiscales</li>
</ul>

<h2>4. Base legal</h2>
<p>El tratamiento de tus datos se basa en la ejecución del contrato de compraventa (art. 6.1.b RGPD), el cumplimiento de obligaciones legales (art. 6.1.c RGPD) y, en su caso, tu consentimiento (art. 6.1.a RGPD).</p>

<h2>5. Destinatarios</h2>
<p>Tus datos podrán ser comunicados a empresas de transporte para la entrega de pedidos, entidades bancarias para el procesamiento de pagos y administraciones públicas cuando exista obligación legal.</p>

<h2>6. Derechos del usuario</h2>
<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, limitación, portabilidad y oposición enviando un email a info@speedler.es. También tienes derecho a presentar una reclamación ante la AEPD (www.aepd.es).</p>

<h2>7. Conservación de datos</h2>
<p>Los datos se conservarán durante el tiempo necesario para cumplir con la finalidad para la que se recogieron y para cumplir con las obligaciones legales aplicables.</p>
</div>`,
          meta_title: 'Política de Privacidad - Speedler',
          meta_description: 'Política de privacidad de Speedler. Conoce cómo tratamos y protegemos tus datos personales conforme al RGPD.',
        },
        {
          url_key: 'politica-de-cookies',
          name: 'Política de Cookies',
          content: `<div class="legal-page">
<h1>Política de Cookies</h1>
<p><strong>Última actualización:</strong> 1 de enero de 2026</p>

<h2>1. ¿Qué son las cookies?</h2>
<p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web. Nos ayudan a mejorar tu experiencia de navegación.</p>

<h2>2. Tipos de cookies que utilizamos</h2>
<ul>
  <li><strong>Cookies técnicas (necesarias):</strong> Permiten la navegación y el uso de funciones esenciales como el carrito de compra y el inicio de sesión.</li>
  <li><strong>Cookies de análisis:</strong> Nos ayudan a entender cómo los usuarios interactúan con el sitio para mejorar su funcionamiento.</li>
  <li><strong>Cookies de preferencias:</strong> Almacenan tus preferencias como idioma y moneda.</li>
</ul>

<h2>3. Gestión de cookies</h2>
<p>Puedes configurar tu navegador para rechazar o eliminar cookies. Ten en cuenta que al deshabilitar ciertas cookies, algunas funcionalidades del sitio podrían no estar disponibles.</p>

<h2>4. Más información</h2>
<p>Para cualquier consulta sobre nuestra política de cookies, contacta con nosotros en info@speedler.es.</p>
</div>`,
          meta_title: 'Política de Cookies - Speedler',
          meta_description: 'Información sobre el uso de cookies en Speedler. Tipos de cookies y cómo gestionarlas.',
        },
        {
          url_key: 'politica-de-devoluciones',
          name: 'Política de Devoluciones',
          content: `<div class="legal-page">
<h1>Política de Devoluciones</h1>
<p><strong>Última actualización:</strong> 1 de enero de 2026</p>

<h2>1. Derecho de desistimiento</h2>
<p>De conformidad con la legislación vigente en la Unión Europea, dispones de un plazo de <strong>14 días naturales</strong> desde la recepción del producto para ejercer tu derecho de desistimiento sin necesidad de justificación.</p>

<h2>2. Condiciones de devolución</h2>
<ul>
  <li>El producto debe estar en su estado original, sin usar y con todo el embalaje y accesorios originales.</li>
  <li>Debes comunicar tu intención de devolver el producto enviando un email a info@speedler.es indicando tu número de pedido.</li>
  <li>Los gastos de envío de la devolución corren a cargo del cliente, salvo que el producto sea defectuoso o no se corresponda con lo pedido.</li>
</ul>

<h2>3. Reembolso</h2>
<p>Una vez recibido y verificado el producto, procederemos al reembolso en un plazo máximo de 14 días. El reembolso se realizará por el mismo medio de pago utilizado en la compra.</p>

<h2>4. Productos defectuosos</h2>
<p>Si recibes un producto defectuoso o dañado, contacta con nosotros en un plazo de 48 horas desde la recepción. Nos haremos cargo de los gastos de devolución y enviaremos un reemplazo o realizaremos el reembolso completo.</p>

<h2>5. Garantía</h2>
<p>Todos nuestros productos cuentan con una garantía mínima de 3 años conforme a la legislación europea vigente.</p>
</div>`,
          meta_title: 'Política de Devoluciones - Speedler',
          meta_description: 'Política de devoluciones de Speedler. 14 días para devolver tu pedido. Garantía de 3 años en todos los productos.',
        },
        {
          url_key: 'terminos-y-condiciones',
          name: 'Términos y Condiciones',
          content: `<div class="legal-page">
<h1>Términos y Condiciones</h1>
<p><strong>Última actualización:</strong> 1 de enero de 2026</p>

<h2>1. Identificación</h2>
<p>El presente sitio web es propiedad de Speedler, con domicilio en Calle de la Tecnología, 1, 28001 Madrid, España.</p>

<h2>2. Objeto</h2>
<p>Estas condiciones generales regulan el acceso y uso del sitio web speedler.es, así como la contratación de productos a través del mismo.</p>

<h2>3. Productos y precios</h2>
<p>Los precios mostrados incluyen IVA. Speedler se reserva el derecho de modificar los precios en cualquier momento, si bien los productos se facturarán al precio vigente en el momento de la confirmación del pedido.</p>

<h2>4. Proceso de compra</h2>
<p>El proceso de compra se completa cuando recibes un email de confirmación de pedido. Speedler se reserva el derecho de cancelar pedidos en caso de error manifiesto en el precio o falta de disponibilidad.</p>

<h2>5. Formas de pago</h2>
<p>Aceptamos tarjeta de crédito/débito y otros métodos de pago electrónico. Todos los pagos se procesan de forma segura.</p>

<h2>6. Envío</h2>
<p>Los pedidos se envían a toda España. Los plazos de entrega estimados son de 2 a 5 días laborables. Envío gratuito en pedidos superiores a 100 EUR.</p>

<h2>7. Legislación aplicable</h2>
<p>Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales del domicilio del consumidor.</p>
</div>`,
          meta_title: 'Términos y Condiciones - Speedler',
          meta_description: 'Términos y condiciones de uso de Speedler. Información sobre compras, envíos, pagos y legislación aplicable.',
        },
        {
          url_key: 'sobre-nosotros',
          name: 'Sobre Nosotros',
          content: `<div class="about-page">
<h1>Sobre Nosotros</h1>
<p>En <strong>Speedler</strong> somos apasionados de la tecnología y la informática. Nuestro objetivo es ofrecer los mejores componentes, periféricos y equipos informáticos al mejor precio posible, con un servicio al cliente excepcional.</p>

<h2>Nuestra misión</h2>
<p>Democratizar el acceso a la tecnología de calidad, ofreciendo productos de las mejores marcas a precios competitivos, con asesoramiento experto y envío rápido a toda España.</p>

<h2>¿Por qué Speedler?</h2>
<ul>
  <li><strong>Amplio catálogo:</strong> Miles de productos de informática y tecnología de las marcas líderes.</li>
  <li><strong>Mejores precios:</strong> Trabajamos directamente con los fabricantes para ofrecerte los precios más competitivos.</li>
  <li><strong>Envío rápido:</strong> Entrega en 2-5 días laborables. Envío gratuito en pedidos superiores a 100 EUR.</li>
  <li><strong>Atención personalizada:</strong> Nuestro equipo de expertos está disponible para asesorarte.</li>
  <li><strong>Garantía:</strong> 3 años de garantía en todos los productos.</li>
</ul>

<h2>Contacto</h2>
<p>Email: <a href="mailto:info@speedler.es">info@speedler.es</a> | Teléfono: 900 000 000</p>
</div>`,
          meta_title: 'Sobre Nosotros - Speedler',
          meta_description: 'Conoce Speedler, tu tienda de informática de confianza. Componentes, periféricos y equipos al mejor precio con envío rápido.',
        },
      ];

      let pagesCreated = 0;
      let pagesSkipped = 0;

      for (const page of cmsPages) {
        // Check if page already exists by url_key
        const existing = await client.query(
          `SELECT cms_page_id FROM cms_page WHERE url_key = $1`,
          [page.url_key]
        );

        if (existing.rows.length > 0) {
          console.log(`   -> "${page.name}" already exists (id: ${existing.rows[0].cms_page_id}), skipping`);
          pagesSkipped++;
          continue;
        }

        // Build the INSERT dynamically based on available columns
        const insertCols = ['uuid'];
        const insertVals = [uuid()];
        const placeholders = ['$1'];
        let idx = 2;

        // Map of desired fields to values
        const fieldMap = {
          url_key: page.url_key,
          name: page.name,
          content: page.content,
          status: true,
          meta_title: page.meta_title,
          meta_description: page.meta_description,
          layout: 'one_column',
        };

        for (const [col, val] of Object.entries(fieldMap)) {
          if (colNames.includes(col)) {
            insertCols.push(col);
            insertVals.push(val);
            placeholders.push(`$${idx}`);
            idx++;
          }
        }

        try {
          await client.query(
            `INSERT INTO cms_page (${insertCols.join(', ')}) VALUES (${placeholders.join(', ')})`,
            insertVals
          );
          console.log(`   -> "${page.name}" created (/${page.url_key})`);
          pagesCreated++;
        } catch (e) {
          console.log(`   -> "${page.name}" failed: ${e.message}`);
        }
      }

      console.log(`   => Pages created: ${pagesCreated}, skipped: ${pagesSkipped}`);
    }
    console.log('');

    // =========================================================
    // 3. CREATE NAVIGATION MENU WIDGET
    // =========================================================
    console.log('[3/6] Setting up navigation menu widget...');

    // Check widget table schema
    const widgetCols = await client.query(
      `SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_name = 'widget'
       ORDER BY ordinal_position`
    );
    const widgetColNames = widgetCols.rows.map(r => r.column_name);
    console.log('   -> widget columns:', widgetColNames.join(', '));

    // Check for existing main_menu or basic_menu widget
    const existingMenu = await client.query(
      `SELECT widget_id, name, type FROM widget WHERE type IN ('basic_menu', 'menu', 'nav') OR name ILIKE '%menu%' OR name ILIKE '%nav%'`
    );

    if (existingMenu.rows.length > 0) {
      console.log('   -> Existing menu widgets found:');
      existingMenu.rows.forEach(w => console.log(`      id=${w.widget_id}, name="${w.name}", type="${w.type}"`));
    }

    // Check what widget types exist
    const widgetTypes = await client.query(`SELECT DISTINCT type FROM widget`);
    console.log('   -> Existing widget types:', widgetTypes.rows.map(r => r.type).join(', '));

    // Create a basic_menu widget for main navigation if none exists
    const menuWidgetCheck = await client.query(
      `SELECT widget_id FROM widget WHERE name = 'Main Navigation'`
    );

    if (menuWidgetCheck.rows.length === 0) {
      const menuSettings = {
        items: [
          { label: 'Tienda', url: '/catalog', type: 'link' },
          { label: 'Sobre Nosotros', url: '/page/sobre-nosotros', type: 'link' },
          { label: 'Contacto', url: '/page/contacto', type: 'link' },
        ]
      };

      try {
        // Determine the best type based on what exists
        const hasBasicMenu = widgetTypes.rows.some(r => r.type === 'basic_menu');
        const menuType = hasBasicMenu ? 'basic_menu' : 'text_block';

        const insertFields = ['uuid', 'name', 'type', 'settings', 'sort_order', 'status'];
        const insertValues = [uuid(), 'Main Navigation', menuType, JSON.stringify(menuSettings), 0, true];
        let phs = insertFields.map((_, i) => `$${i + 1}`);

        // Add route and area if they exist as columns
        if (widgetColNames.includes('route')) {
          insertFields.push('route');
          insertValues.push(JSON.stringify(['all']));
          phs.push(`$${insertFields.length}::jsonb`);
        }
        if (widgetColNames.includes('area')) {
          insertFields.push('area');
          insertValues.push(JSON.stringify(['header']));
          phs.push(`$${insertFields.length}::jsonb`);
        }

        // Fix placeholders - settings needs ::jsonb cast
        const finalPhs = insertFields.map((f, i) => {
          if (f === 'settings') return `$${i + 1}::jsonb`;
          if (f === 'route') return `$${i + 1}::jsonb`;
          if (f === 'area') return `$${i + 1}::jsonb`;
          return `$${i + 1}`;
        });

        await client.query(
          `INSERT INTO widget (${insertFields.join(', ')}) VALUES (${finalPhs.join(', ')})`,
          insertValues
        );
        console.log(`   -> "Main Navigation" widget created (type: ${menuType})`);
      } catch (e) {
        console.log(`   -> Main Navigation widget failed: ${e.message}`);
      }
    } else {
      console.log('   -> "Main Navigation" widget already exists');
    }
    console.log('');

    // =========================================================
    // 4. FIX PRODUCT IMAGES - audit
    // =========================================================
    console.log('[4/6] Auditing product images...');

    const imgTableCheck = await client.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'product_image')`
    );

    if (imgTableCheck.rows[0].exists) {
      const imgStats = await client.query(`
        SELECT
          (SELECT COUNT(DISTINCT product_image_product_id) FROM product_image) as products_with_images,
          (SELECT COUNT(*) FROM product WHERE status = true) as total_active_products,
          (SELECT COUNT(*) FROM product_image) as total_images,
          (SELECT COUNT(*) FROM product_image WHERE origin_image NOT LIKE 'http%' AND origin_image NOT LIKE '/%') as non_url_images
      `);
      const is2 = imgStats.rows[0];
      console.log(`   -> Total active products: ${is2.total_active_products}`);
      console.log(`   -> Products with images: ${is2.products_with_images}`);
      console.log(`   -> Products without images: ${is2.total_active_products - is2.products_with_images}`);
      console.log(`   -> Total image records: ${is2.total_images}`);
      console.log(`   -> Images without proper URL: ${is2.non_url_images}`);

      if (parseInt(is2.non_url_images) > 0) {
        console.log('   -> Note: Some images have non-standard URLs but no prefix change needed (provider sync handles this)');
      }
    } else {
      console.log('   -> product_image table does not exist');
    }
    console.log('');

    // =========================================================
    // 5. UPDATE COLLECTIONS
    // =========================================================
    console.log('[5/6] Updating product collections...');

    // Collection 1: Featured - expensive in-stock products with images
    await client.query('DELETE FROM product_collection WHERE collection_id = 1');
    const featured = await client.query(`
      INSERT INTO product_collection (collection_id, product_id)
      SELECT 1, p.product_id FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      JOIN product_image pimg ON pimg.product_image_product_id = p.product_id AND pimg.is_main = true
      WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
        AND length(pd.name) > 5
      ORDER BY p.price DESC LIMIT 8
      RETURNING product_id
    `);
    console.log(`   -> Collection 1 (Featured): ${featured.rowCount} products added (top price, in-stock, with images)`);

    // Collection 2: New arrivals - newest in-stock products with images
    await client.query('DELETE FROM product_collection WHERE collection_id = 2');
    const newArrivals = await client.query(`
      INSERT INTO product_collection (collection_id, product_id)
      SELECT 2, p.product_id FROM product p
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      JOIN product_inventory pi ON pi.product_inventory_product_id = p.product_id
      JOIN product_image pimg ON pimg.product_image_product_id = p.product_id AND pimg.is_main = true
      WHERE p.status = true AND pi.stock_availability = true AND pi.qty > 0
        AND length(pd.name) > 5
      ORDER BY p.created_at DESC LIMIT 8
      RETURNING product_id
    `);
    console.log(`   -> Collection 2 (New Arrivals): ${newArrivals.rowCount} products added (newest, in-stock, with images)`);

    // Show what's in the collections
    const collDetails = await client.query(`
      SELECT pc.collection_id, pd.name, p.price
      FROM product_collection pc
      JOIN product p ON p.product_id = pc.product_id
      JOIN product_description pd ON pd.product_description_product_id = p.product_id
      WHERE pc.collection_id IN (1, 2)
      ORDER BY pc.collection_id, p.price DESC
    `);
    for (const cid of [1, 2]) {
      const label = cid === 1 ? 'Featured' : 'New Arrivals';
      const items = collDetails.rows.filter(r => r.collection_id === cid);
      if (items.length > 0) {
        console.log(`   -> Collection ${cid} (${label}):`);
        items.forEach(i => console.log(`      ${i.name} - ${Number(i.price).toFixed(2)} EUR`));
      }
    }
    console.log('');

    // =========================================================
    // 6. SUMMARY STATS
    // =========================================================
    console.log('[6/6] Summary statistics...');

    const stats = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM product WHERE status = true) as active_products,
        (SELECT COUNT(*) FROM product_inventory WHERE qty > 0 AND stock_availability = true) as in_stock,
        (SELECT COUNT(DISTINCT product_image_product_id) FROM product_image) as products_with_images,
        (SELECT COUNT(*) FROM category WHERE status = true) as categories,
        (SELECT COUNT(*) FROM category WHERE include_in_nav = true) as nav_categories,
        (SELECT COUNT(*) FROM product_collection) as collection_items,
        (SELECT COUNT(*) FROM setting) as total_settings,
        (SELECT COUNT(*) FROM widget WHERE status = true) as active_widgets
    `);
    const s = stats.rows[0];

    // CMS pages count (if table exists)
    let cmsCount = 'N/A';
    if (cmsTableCheck.rows[0].exists) {
      const cmsResult = await client.query('SELECT COUNT(*) as cnt FROM cms_page');
      cmsCount = cmsResult.rows[0].cnt;
    }

    console.log('   +---------------------------------+--------+');
    console.log('   | Metric                          | Count  |');
    console.log('   +---------------------------------+--------+');
    console.log(`   | Active products                 | ${String(s.active_products).padStart(6)} |`);
    console.log(`   | In stock                        | ${String(s.in_stock).padStart(6)} |`);
    console.log(`   | Products with images            | ${String(s.products_with_images).padStart(6)} |`);
    console.log(`   | Categories (active)             | ${String(s.categories).padStart(6)} |`);
    console.log(`   | Categories in navigation        | ${String(s.nav_categories).padStart(6)} |`);
    console.log(`   | Collection items                | ${String(s.collection_items).padStart(6)} |`);
    console.log(`   | Store settings                  | ${String(s.total_settings).padStart(6)} |`);
    console.log(`   | Active widgets                  | ${String(s.active_widgets).padStart(6)} |`);
    console.log(`   | CMS pages                       | ${String(cmsCount).padStart(6)} |`);
    console.log('   +---------------------------------+--------+');

    console.log('\n================================================');
    console.log('  BRANDING & PAGES SETUP COMPLETE');
    console.log('  Restart app: docker restart speedler-app-1');
    console.log('================================================');

  } catch (e) {
    console.error('\nERROR:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
