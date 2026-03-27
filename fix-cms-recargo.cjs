const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function fix() {
  const client = await pool.connect();
  try {
    console.log('=== Fixing CMS Pages + Recargo ===\n');

    // 1. CMS Pages - use cms_page + cms_page_description
    const pages = [
      {
        url_key: 'contacto',
        name: 'Contacto',
        meta_title: 'Contacto - Speedler',
        meta_description: 'Contacta con Speedler',
        content: '<h2>Contacto</h2><p><strong>Email:</strong> info@speedler.es</p><p><strong>Teléfono:</strong> 900 000 000</p><p><strong>Horario:</strong> Lunes a Viernes 9:00-18:00, Sábados 10:00-14:00</p><p><strong>Dirección:</strong> España</p><h3>Formulario de contacto</h3><p>Para cualquier consulta, escríbenos a <a href="mailto:info@speedler.es">info@speedler.es</a> y te responderemos lo antes posible.</p>'
      },
      {
        url_key: 'politica-de-privacidad',
        name: 'Política de Privacidad',
        meta_title: 'Política de Privacidad - Speedler',
        meta_description: 'Política de privacidad de Speedler',
        content: '<h2>Política de Privacidad</h2><p><strong>Responsable:</strong> Speedler</p><p><strong>Finalidad:</strong> Gestión de pedidos, envío de comunicaciones comerciales.</p><p><strong>Legitimación:</strong> Consentimiento del interesado y ejecución de contrato.</p><p><strong>Destinatarios:</strong> No se ceden datos a terceros salvo obligación legal.</p><p><strong>Derechos:</strong> Acceso, rectificación, supresión, limitación, portabilidad y oposición. Contacto: info@speedler.es</p><p><strong>Plazo de conservación:</strong> Los datos se conservarán mientras dure la relación comercial y el tiempo legalmente establecido.</p><p>Cumplimos con el RGPD (Reglamento UE 2016/679) y la LOPDGDD (Ley Orgánica 3/2018).</p>'
      },
      {
        url_key: 'politica-de-cookies',
        name: 'Política de Cookies',
        meta_title: 'Política de Cookies - Speedler',
        meta_description: 'Política de cookies de Speedler',
        content: '<h2>Política de Cookies</h2><p>Utilizamos cookies propias y de terceros para mejorar la experiencia de navegación.</p><h3>Cookies utilizadas</h3><ul><li><strong>Cookies técnicas:</strong> Necesarias para el funcionamiento del sitio (sesión, carrito de compras).</li><li><strong>Cookies de análisis:</strong> Para medir el tráfico y uso del sitio.</li></ul><h3>Gestión de cookies</h3><p>Puede configurar su navegador para rechazar cookies. Sin embargo, algunas funcionalidades del sitio podrían no estar disponibles.</p><p>Contacto: info@speedler.es</p>'
      },
      {
        url_key: 'politica-de-devoluciones',
        name: 'Política de Devoluciones',
        meta_title: 'Política de Devoluciones - Speedler',
        meta_description: 'Política de devoluciones de Speedler',
        content: '<h2>Política de Devoluciones</h2><h3>Derecho de desistimiento</h3><p>Dispone de <strong>14 días naturales</strong> desde la recepción del producto para ejercer su derecho de desistimiento sin necesidad de justificación, conforme a la Directiva 2011/83/UE.</p><h3>Condiciones</h3><ul><li>El producto debe estar en su embalaje original, sin abrir y en perfecto estado.</li><li>Debe incluir todos los accesorios y documentación.</li><li>Conservar factura o ticket de compra.</li></ul><h3>Proceso</h3><ol><li>Contacte con info@speedler.es indicando su número de pedido.</li><li>Recibirá instrucciones y etiqueta de envío.</li><li>Una vez recibido y verificado, se procederá al reembolso en un plazo máximo de 14 días.</li></ol><h3>Garantía</h3><p>Todos los productos cuentan con <strong>3 años de garantía legal</strong> conforme a la normativa española vigente.</p>'
      },
      {
        url_key: 'terminos-y-condiciones',
        name: 'Términos y Condiciones',
        meta_title: 'Términos y Condiciones - Speedler',
        meta_description: 'Términos y condiciones de Speedler',
        content: '<h2>Términos y Condiciones</h2><h3>1. Datos del vendedor</h3><p>Speedler - info@speedler.es</p><h3>2. Productos y precios</h3><p>Todos los precios incluyen IVA. El canon digital se muestra de forma separada cuando aplica. Los precios pueden variar sin previo aviso.</p><h3>3. Proceso de compra</h3><p>Al realizar un pedido, recibirá un email de confirmación. El contrato se perfecciona con la confirmación del pedido.</p><h3>4. Métodos de pago</h3><p>Aceptamos transferencia bancaria, tarjeta de crédito/débito (Redsys) y pago aplazado (SeQura).</p><h3>5. Envíos</h3><p>Envío en 24-48h laborables a toda España. Envío gratuito en pedidos superiores a 100€.</p><h3>6. Devoluciones</h3><p>14 días naturales para ejercer el derecho de desistimiento. Ver nuestra Política de Devoluciones.</p><h3>7. Garantía</h3><p>3 años de garantía legal en todos los productos.</p><h3>8. Ley aplicable</h3><p>Se aplica la legislación española. Para resolución de litigios: plataforma ODR de la UE.</p>'
      },
      {
        url_key: 'sobre-nosotros',
        name: 'Sobre Nosotros',
        meta_title: 'Sobre Nosotros - Speedler',
        meta_description: 'Conoce Speedler, tu tienda de informática de confianza',
        content: '<h2>Sobre Speedler</h2><p>Somos tu tienda de informática de confianza. Ofrecemos componentes, periféricos y equipos informáticos al mejor precio con envío rápido a toda España.</p><h3>¿Por qué elegirnos?</h3><ul><li><strong>Más de 26.000 productos</strong> de las mejores marcas</li><li><strong>Envío rápido</strong> en 24-48h a toda España</li><li><strong>Garantía oficial</strong> de 3 años en todos los productos</li><li><strong>Soporte técnico</strong> especializado</li><li><strong>Precios competitivos</strong> actualizados diariamente de 6 proveedores</li><li><strong>Configurador de PC</strong> para montar tu equipo a medida</li></ul>'
      },
      {
        url_key: 'configurador-de-pc',
        name: 'Configurador de PC',
        meta_title: 'Configurador de PC - Speedler',
        meta_description: 'Monta tu PC a medida con el configurador de Speedler',
        content: '<h2>Configurador de PC</h2><p>Próximamente podrás montar tu PC personalizado eligiendo componentes compatibles con validación en tiempo real.</p><p>Mientras tanto, puedes navegar por nuestras categorías de componentes:</p><ul><li><a href="/procesadores">Procesadores</a></li><li><a href="/placas-base">Placas Base</a></li><li><a href="/memorias">Memorias RAM</a></li><li><a href="/tarjetas-graficas-edicion-de-video">Tarjetas Gráficas</a></li><li><a href="/ssd">SSD</a></li><li><a href="/fuentes-alimentacion">Fuentes de Alimentación</a></li><li><a href="/cajas-cpu">Cajas</a></li><li><a href="/ventiladores-cpu">Ventiladores</a></li></ul>'
      }
    ];

    let created = 0;
    for (const page of pages) {
      const exists = await client.query(
        'SELECT cpd.cms_page_description_id FROM cms_page_description cpd WHERE cpd.url_key = $1',
        [page.url_key]
      );
      if (exists.rows.length > 0) {
        console.log('  Page exists: ' + page.name);
        continue;
      }
      const cmsRes = await client.query(
        'INSERT INTO cms_page (uuid, status) VALUES ($1, true) RETURNING cms_page_id',
        [crypto.randomUUID()]
      );
      const pageId = cmsRes.rows[0].cms_page_id;
      await client.query(
        'INSERT INTO cms_page_description (cms_page_description_cms_page_id, url_key, name, content, meta_title, meta_description) VALUES ($1, $2, $3, $4, $5, $6)',
        [pageId, page.url_key, page.name, page.content, page.meta_title, page.meta_description]
      );
      console.log('  Created: ' + page.name + ' -> /page/' + page.url_key);
      created++;
    }
    console.log('  Total pages created: ' + created);

    // 2. Fix recargo - table already exists with correct columns, just insert
    console.log('\nFixing recargo de equivalencia...');
    await client.query('DELETE FROM recargo_equivalencia');
    await client.query("INSERT INTO recargo_equivalencia (iva_rate, recargo_rate) VALUES (21, 5.2), (10, 1.4), (4, 0.5)");
    console.log('  3 recargo rates inserted');

    // 3. Navigation menu widget
    console.log('\nCreating navigation menu widget...');
    const navExists = await client.query("SELECT widget_id FROM widget WHERE name = 'Main Navigation'");
    if (navExists.rows.length === 0) {
      const menuHtml = '<nav style="display:flex;gap:1.5rem;justify-content:center;padding:0.5rem 0"><a href="/search" style="color:#3a3a3a;text-decoration:none;font-weight:500;font-size:0.9rem">Tienda</a><a href="/page/sobre-nosotros" style="color:#3a3a3a;text-decoration:none;font-weight:500;font-size:0.9rem">Sobre nosotros</a><a href="/page/contacto" style="color:#3a3a3a;text-decoration:none;font-weight:500;font-size:0.9rem">Contacto</a><a href="/page/configurador-de-pc" style="color:#3a3a3a;text-decoration:none;font-weight:500;font-size:0.9rem">Configurador PC</a></nav>';
      await client.query(
        'INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area) VALUES ($1, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)',
        [crypto.randomUUID(), 'Main Navigation', 'text_block', JSON.stringify({text: menuHtml}), 0, JSON.stringify(['all']), JSON.stringify('"header"')]
      );
      console.log('  Navigation menu widget created');
    } else {
      console.log('  Navigation menu already exists');
    }

    console.log('\n=== ALL FIXES APPLIED ===');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
fix();
