/**
 * PC Configurator Setup Script for Speedler EverShop
 *
 * Creates:
 * 1. A CMS page with an embedded PC configurator UI
 * 2. A homepage widget linking to the configurator
 * 3. Maps category IDs for configurator steps
 *
 * Usage:
 *   docker cp setup-configurator.cjs speedler-app-1:/app/setup-configurator.cjs
 *   docker exec -it speedler-app-1 node setup-configurator.cjs
 */

const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

// Category names used in the configurator mapped to their step IDs
const CONFIGURATOR_CATEGORIES = [
  { id: 'cpu',     name: 'Procesador',          search: 'Procesadores',           slug: 'procesadores',           required: true },
  { id: 'mobo',    name: 'Placa Base',           search: 'Placas Base',            slug: 'placas-base',            required: true },
  { id: 'ram',     name: 'Memoria RAM',          search: 'Memorias',               slug: 'memorias',               required: true },
  { id: 'gpu',     name: 'Tarjeta Gráfica',      search: 'Tarjetas Gráficas',      slug: 'tarjetas-graficas',      required: false },
  { id: 'ssd',     name: 'Almacenamiento SSD',   search: 'SSD',                    slug: 'ssd',                    required: true },
  { id: 'hdd',     name: 'Disco Duro',           search: 'Discos Duros',           slug: 'discos-duros',           required: false },
  { id: 'psu',     name: 'Fuente Alimentación',  search: 'Fuentes Alimentación',   slug: 'fuentes-alimentacion',   required: true },
  { id: 'case',    name: 'Caja / Torre',         search: 'Cajas CPU',              slug: 'cajas-cpu',              required: true },
  { id: 'cooler',  name: 'Refrigeración',        search: 'Ventiladores',           slug: 'ventiladores',           required: false },
];

function buildConfiguratorHTML(categoryMap) {
  // Build the CATEGORIES JS array using real slugs from the DB where available
  const catEntries = CONFIGURATOR_CATEGORIES.map(c => {
    const dbSlug = categoryMap[c.search] || c.slug;
    return `  {id:'${c.id}', name:'${c.name}', slug:'${dbSlug}', required:${c.required}}`;
  });

  return `
<style>
.pc-cfg *{box-sizing:border-box}
.pc-cfg{max-width:1200px;margin:0 auto;padding:2rem 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#3a3a3a}
.pc-cfg h1{font-size:1.8rem;font-weight:700;margin-bottom:.5rem}
.pc-cfg .subtitle{color:#6b7280;margin-bottom:2rem}
.pc-cfg .layout{display:grid;grid-template-columns:1fr 350px;gap:2rem}
@media(max-width:768px){.pc-cfg .layout{grid-template-columns:1fr}}
.pc-cfg .steps{display:flex;flex-wrap:wrap;gap:.5rem;margin-bottom:1.5rem}
.pc-cfg .step-btn{padding:.5rem 1rem;border:1px solid #e5e7eb;border-radius:3px;background:#fff;cursor:pointer;font-size:.85rem;transition:all .2s}
.pc-cfg .step-btn:hover{border-color:#058c8c}
.pc-cfg .step-btn.active{background:#058c8c;color:#fff;border-color:#058c8c}
.pc-cfg .step-btn.done{background:#e6f5f5;border-color:#058c8c;color:#058c8c}
.pc-cfg .component-list{border:1px solid #e5e7eb;border-radius:4px;max-height:420px;overflow-y:auto}
.pc-cfg .component-item{padding:.75rem 1rem;border-bottom:1px solid #f3f4f6;cursor:pointer;display:flex;justify-content:space-between;align-items:center;transition:background .15s}
.pc-cfg .component-item:hover{background:#f9fafb}
.pc-cfg .component-item.selected{background:#e6f5f5;border-left:3px solid #058c8c}
.pc-cfg .component-item:last-child{border-bottom:none}
.pc-cfg .comp-name{font-size:.9rem;font-weight:500;flex:1}
.pc-cfg .comp-price{font-weight:600;color:#058c8c;white-space:nowrap;margin-left:1rem}
.pc-cfg .comp-stock{font-size:.75rem;color:#6b7280;margin-left:.5rem}
.pc-cfg .no-items{padding:2rem;text-align:center;color:#6b7280}
.pc-cfg .sidebar{position:sticky;top:1rem}
.pc-cfg .summary{border:1px solid #e5e7eb;border-radius:4px;padding:1.25rem}
.pc-cfg .summary h2{font-size:1.1rem;margin-bottom:1rem;padding-bottom:.75rem;border-bottom:1px solid #e5e7eb}
.pc-cfg .summary-item{display:flex;justify-content:space-between;padding:.5rem 0;font-size:.85rem;border-bottom:1px solid #f3f4f6}
.pc-cfg .summary-item .label{color:#6b7280}
.pc-cfg .summary-item .value{font-weight:500}
.pc-cfg .summary-total{display:flex;justify-content:space-between;padding:1rem 0 .5rem;font-size:1.1rem;font-weight:700;border-top:2px solid #e5e7eb;margin-top:.5rem}
.pc-cfg .btn-cart{width:100%;padding:.75rem;background:#058c8c;color:#fff;border:none;border-radius:3px;font-size:1rem;font-weight:600;cursor:pointer;margin-top:1rem;text-transform:uppercase;letter-spacing:.05em}
.pc-cfg .btn-cart:hover{background:#046d6d}
.pc-cfg .btn-cart:disabled{background:#d1d5db;cursor:not-allowed}
.pc-cfg .warning{background:#fef3c7;border:1px solid #f59e0b;border-radius:4px;padding:.75rem;margin-top:1rem;font-size:.85rem;color:#92400e}
.pc-cfg .loading{text-align:center;padding:2rem;color:#6b7280}
.pc-cfg .search-box{width:100%;padding:.6rem .8rem;border:1px solid #e5e7eb;border-radius:3px;margin-bottom:1rem;font-size:.9rem}
.pc-cfg .search-box:focus{outline:none;border-color:#058c8c}
</style>
<div class="pc-cfg">
<h1>Configurador de PC</h1>
<p class="subtitle">Monta tu equipo eligiendo componentes compatibles. Precio actualizado en tiempo real.</p>
<div class="layout">
<div class="main">
<div class="steps" id="cfg-steps"></div>
<input type="text" class="search-box" id="cfg-search" placeholder="Buscar componente..." oninput="cfgFilterProducts()">
<div id="cfg-list" class="component-list"><div class="loading">Cargando componentes...</div></div>
</div>
<div class="sidebar">
<div class="summary">
<h2>Tu configuraci&oacute;n</h2>
<div id="cfg-summary"></div>
<div class="summary-total"><span>TOTAL</span><span id="cfg-total">0,00&nbsp;&euro;</span></div>
<button class="btn-cart" id="cfg-btn" disabled onclick="cfgAddAllToCart()">A&Ntilde;ADIR TODO AL CARRITO</button>
<div id="cfg-warnings"></div>
</div>
</div>
</div>
</div>
<script>
(function(){
const CATEGORIES = [
${catEntries.join(',\n')}
];
let activeStep = 0, selected = {}, productCache = {}, allItems = [];

function fmt(v){return new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v)}

function renderSteps(){
  document.getElementById('cfg-steps').innerHTML = CATEGORIES.map((c,i)=>{
    let cls='step-btn';
    if(i===activeStep) cls+=' active';
    else if(selected[c.id]) cls+=' done';
    return '<button class="'+cls+'" onclick="cfgSetStep('+i+')">'+c.name+(c.required?'*':'')+'</button>';
  }).join('');
}

window.cfgSetStep = function(i){
  activeStep = i;
  document.getElementById('cfg-search').value = '';
  renderSteps();
  loadProducts(CATEGORIES[i]);
};

async function loadProducts(cat){
  const list = document.getElementById('cfg-list');
  if(productCache[cat.slug]){
    allItems = productCache[cat.slug];
    renderProducts(allItems, cat);
    return;
  }
  list.innerHTML = '<div class="loading">Cargando componentes...</div>';
  try{
    const q = '{ products(filters:[{key:"category",operation:"in",value:"'+cat.slug+'"}]) { items { productId name sku price { regular { value text } } inventory { qty isInStock } } } }';
    const res = await fetch('/api/graphql',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:q})});
    const data = await res.json();
    const items = data?.data?.products?.items || [];
    productCache[cat.slug] = items;
    allItems = items;
    renderProducts(items, cat);
  }catch(e){
    list.innerHTML = '<div class="no-items">Error cargando componentes</div>';
  }
}

function renderProducts(items, cat){
  const list = document.getElementById('cfg-list');
  if(!items.length){list.innerHTML='<div class="no-items">No hay componentes disponibles en esta categor&iacute;a</div>';return}
  const inStock = items.filter(p=>p.inventory?.isInStock);
  const sorted = inStock.sort((a,b)=>(a.price?.regular?.value||0)-(b.price?.regular?.value||0));
  list.innerHTML = sorted.map(p=>{
    const sel = selected[cat.id]?.sku===p.sku?' selected':'';
    const price = p.price?.regular?.value||0;
    const qty = p.inventory?.qty||0;
    const safeName = p.name.replace(/'/g,"\\\\'");
    return '<div class="component-item'+sel+'" onclick="cfgSelect(\\''+cat.id+'\\',\\''+p.sku+'\\',\\''+safeName+'\\','+price+')">'
      +'<span class="comp-name">'+p.name+'</span>'
      +'<span class="comp-price">'+fmt(price)+'</span>'
      +'<span class="comp-stock">('+qty+' uds)</span></div>';
  }).join('');
}

window.cfgFilterProducts = function(){
  const q = document.getElementById('cfg-search').value.toLowerCase();
  const cat = CATEGORIES[activeStep];
  if(!allItems.length) return;
  const filtered = q ? allItems.filter(p=>p.name.toLowerCase().includes(q)) : allItems;
  renderProducts(filtered, cat);
};

window.cfgSelect = function(catId, sku, name, price){
  selected[catId] = {sku,name,price};
  renderSteps();
  loadProducts(CATEGORIES[activeStep]);
  renderSummary();
};

function renderSummary(){
  const el = document.getElementById('cfg-summary');
  let total=0, html='';
  for(const cat of CATEGORIES){
    const s=selected[cat.id];
    if(s){total+=s.price;html+='<div class="summary-item"><span class="label">'+cat.name+'</span><span class="value">'+fmt(s.price)+'</span></div>'}
    else{html+='<div class="summary-item"><span class="label" style="opacity:.4">'+cat.name+' '+(cat.required?'(requerido)':'(opcional)')+'</span><span class="value">-</span></div>'}
  }
  el.innerHTML = html;
  document.getElementById('cfg-total').textContent = fmt(total);
  const allReq = CATEGORIES.filter(c=>c.required).every(c=>selected[c.id]);
  document.getElementById('cfg-btn').disabled = !allReq;
  let warnings=[];
  if(Object.keys(selected).length===0) warnings.push('Selecciona al menos un procesador y una placa base para empezar.');
  document.getElementById('cfg-warnings').innerHTML = warnings.length?'<div class="warning">'+warnings.join('<br>')+'</div>':'';
}

window.cfgAddAllToCart = async function(){
  const btn = document.getElementById('cfg-btn');
  btn.disabled=true; btn.textContent='A\\u00d1ADIENDO...';
  let added=0;
  for(const cat of CATEGORIES){
    const s=selected[cat.id];
    if(!s) continue;
    try{
      await fetch('/api/cart/mine/items',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sku:s.sku,qty:1})});
      added++;
    }catch(e){}
  }
  btn.textContent=added+' COMPONENTES A\\u00d1ADIDOS';
  setTimeout(()=>{btn.textContent='A\\u00d1ADIR TODO AL CARRITO';btn.disabled=false},3000);
};

renderSteps();
renderSummary();
loadProducts(CATEGORIES[0]);
})();
</script>`.trim();
}

async function setup() {
  const client = await pool.connect();
  try {
    console.log('=== Speedler PC Configurator Setup ===\n');

    // ----------------------------------------------------------
    // 1. Verify cms_page table exists and inspect schema
    // ----------------------------------------------------------
    const cmsTableExists = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cms_page')"
    );
    if (!cmsTableExists.rows[0].exists) {
      console.error('ERROR: cms_page table does not exist. Is EverShop installed?');
      return;
    }

    const cmsCols = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cms_page' ORDER BY ordinal_position"
    );
    console.log('cms_page columns:', cmsCols.rows.map(r => r.column_name).join(', '));

    // ----------------------------------------------------------
    // 2. Query category IDs for configurator steps
    // ----------------------------------------------------------
    console.log('\nLooking up PC building categories...');
    const categoryMap = {}; // search name -> url_key

    for (const cat of CONFIGURATOR_CATEGORIES) {
      const res = await client.query(
        `SELECT c.category_id, cd.name, cd.url_key
         FROM category c
         JOIN category_description cd ON cd.category_description_category_id = c.category_id
         WHERE cd.name ILIKE $1
         LIMIT 1`,
        [`%${cat.search}%`]
      );
      if (res.rows.length > 0) {
        const row = res.rows[0];
        categoryMap[cat.search] = row.url_key;
        console.log(`  [OK] ${cat.search} -> category_id=${row.category_id}, url_key=${row.url_key}`);
      } else {
        console.log(`  [--] ${cat.search} -> not found, using default slug: ${cat.slug}`);
      }
    }

    // ----------------------------------------------------------
    // 3. Create CMS page for PC Configurator
    // ----------------------------------------------------------
    console.log('\nCreating CMS page: Configurador de PC...');

    const configuratorHTML = buildConfiguratorHTML(categoryMap);

    const colNames = cmsCols.rows.map(r => r.column_name);
    const hasLayout = colNames.includes('layout');
    const hasMetaTitle = colNames.includes('meta_title');
    const hasMetaDesc = colNames.includes('meta_description');

    // Check if page already exists
    const existing = await client.query(
      "SELECT cms_page_id FROM cms_page WHERE url_key = 'configurador-de-pc'"
    );

    if (existing.rows.length > 0) {
      // Update existing page
      await client.query(
        "UPDATE cms_page SET name = $1, content = $2, status = true WHERE url_key = 'configurador-de-pc'",
        ['Configurador de PC', configuratorHTML]
      );
      console.log('  -> Updated existing CMS page (id=' + existing.rows[0].cms_page_id + ')');
    } else {
      // Build INSERT dynamically based on available columns
      const insertCols = ['uuid', 'status', 'url_key', 'name', 'content'];
      const insertVals = [crypto.randomUUID(), true, 'configurador-de-pc', 'Configurador de PC', configuratorHTML];
      let paramIdx = insertVals.length;

      if (hasLayout) {
        insertCols.push('layout');
        insertVals.push('one_column');
        paramIdx++;
      }
      if (hasMetaTitle) {
        insertCols.push('meta_title');
        insertVals.push('Configurador de PC - Speedler');
        paramIdx++;
      }
      if (hasMetaDesc) {
        insertCols.push('meta_description');
        insertVals.push('Configura tu PC a medida eligiendo componentes. Procesadores, tarjetas gráficas, RAM y más.');
        paramIdx++;
      }

      const placeholders = insertVals.map((_, i) => '$' + (i + 1)).join(', ');
      await client.query(
        `INSERT INTO cms_page (${insertCols.join(', ')}) VALUES (${placeholders})`,
        insertVals
      );
      console.log('  -> CMS page created successfully');
    }

    // ----------------------------------------------------------
    // 4. Create homepage widget linking to the configurator
    // ----------------------------------------------------------
    console.log('\nCreating homepage widget for configurator...');

    // Check widget table schema
    const widgetCols = await client.query(
      "SELECT column_name, data_type, udt_name FROM information_schema.columns WHERE table_name = 'widget' ORDER BY ordinal_position"
    );
    console.log('widget columns:', widgetCols.rows.map(r => r.column_name).join(', '));

    // Remove old configurator widget if exists
    await client.query("DELETE FROM widget WHERE name = 'Configurador PC Banner'");

    const widgetText = '<div style="text-align:center;padding:2.5rem 1rem;background:linear-gradient(135deg,#e6f5f5 0%,#f0fafa 100%);border-radius:8px;margin:1rem 0">'
      + '<h3 style="font-size:1.4rem;font-weight:700;color:#3a3a3a;margin:0 0 .5rem">Configura tu PC a medida</h3>'
      + '<p style="color:#6b7280;margin:0 0 1.25rem;font-size:1rem">Elige los componentes y monta tu equipo ideal paso a paso</p>'
      + '<a href="/page/configurador-de-pc" style="display:inline-block;padding:.75rem 2rem;background:#058c8c;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;font-size:1rem;letter-spacing:.03em;transition:background .2s" '
      + 'onmouseover="this.style.background=\'#046d6d\'" onmouseout="this.style.background=\'#058c8c\'">'
      + 'Configurador PC &rarr;</a></div>';

    const widgetSettings = JSON.stringify({ text: widgetText });

    // Find what sort_order to use (put it after existing widgets)
    const maxSort = await client.query("SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM widget");
    const nextSort = maxSort.rows[0].next_sort;

    await client.query(
      `INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area)
       VALUES ($1::uuid, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)`,
      [
        crypto.randomUUID(),
        'Configurador PC Banner',
        'text_block',
        widgetSettings,
        nextSort,
        JSON.stringify(['homepage']),
        JSON.stringify(['content'])
      ]
    );
    console.log('  -> Homepage widget created (sort_order=' + nextSort + ')');

    // ----------------------------------------------------------
    // 5. Summary
    // ----------------------------------------------------------
    console.log('\n=== Setup Complete ===');
    console.log('CMS Page URL:    /page/configurador-de-pc');
    console.log('Homepage widget: Configurador PC Banner (text_block)');
    console.log('Categories mapped:', Object.keys(categoryMap).length, '/', CONFIGURATOR_CATEGORIES.length);
    console.log('\nRefresh the store to see the changes.');

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
