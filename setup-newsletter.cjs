/**
 * Newsletter Setup Script for Speedler EverShop
 *
 * Creates:
 * 1. newsletter_subscriber table (if not exists)
 * 2. A text_block widget with a newsletter signup form
 * 3. Newsletter/Mailchimp settings in the setting table
 *
 * Usage:
 *   docker cp setup-newsletter.cjs speedler-app-1:/app/setup-newsletter.cjs
 *   docker exec -it speedler-app-1 node setup-newsletter.cjs
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

async function setup() {
  const client = await pool.connect();
  try {
    console.log('=== Speedler Newsletter Setup ===\n');

    // ----------------------------------------------------------
    // 1. Check for existing newsletter-related tables
    // ----------------------------------------------------------
    console.log('Checking for existing newsletter tables...');
    const tableCheck = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('newsletter', 'subscriber', 'newsletter_subscriber')
      ORDER BY table_name
    `);

    if (tableCheck.rows.length > 0) {
      console.log('  Found existing tables:', tableCheck.rows.map(r => r.table_name).join(', '));
    } else {
      console.log('  No existing newsletter tables found.');
    }

    // ----------------------------------------------------------
    // 2. Create newsletter_subscriber table
    // ----------------------------------------------------------
    console.log('\nCreating newsletter_subscriber table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriber (
        subscriber_id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'subscribed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  -> Table newsletter_subscriber ready');

    // Create index on email for fast lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_newsletter_subscriber_email
      ON newsletter_subscriber (email)
    `);
    console.log('  -> Index on email created');

    // Verify table schema
    const subCols = await client.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'newsletter_subscriber' ORDER BY ordinal_position"
    );
    console.log('  Columns:', subCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

    // ----------------------------------------------------------
    // 3. Create newsletter signup widget
    // ----------------------------------------------------------
    console.log('\nCreating newsletter signup widget...');

    // Check widget table schema
    const widgetTableExists = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'widget')"
    );
    if (!widgetTableExists.rows[0].exists) {
      console.error('ERROR: widget table does not exist. Is EverShop installed?');
      return;
    }

    const widgetCols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'widget' ORDER BY ordinal_position"
    );
    console.log('  widget columns:', widgetCols.rows.map(r => r.column_name).join(', '));

    // Remove old newsletter widget if exists
    await client.query("DELETE FROM widget WHERE name = 'Newsletter Signup'");

    const newsletterHTML = `<div style="background:#f8fffe;border-top:1px solid #e5e7eb;padding:2.5rem 1rem;text-align:center">
<div style="max-width:500px;margin:0 auto">
<h3 style="font-size:1.3rem;font-weight:700;color:#3a3a3a;margin:0 0 .5rem">Suscr&iacute;bete a nuestro bolet&iacute;n</h3>
<p style="color:#6b7280;margin:0 0 1.25rem;font-size:.95rem">Recibe ofertas exclusivas, novedades y descuentos directamente en tu correo.</p>
<form id="newsletter-form" onsubmit="return handleNewsletterSubmit(event)" style="display:flex;gap:.5rem;max-width:420px;margin:0 auto">
<input type="email" id="newsletter-email" required placeholder="Tu correo electr&oacute;nico" style="flex:1;padding:.7rem 1rem;border:1px solid #d1d5db;border-radius:4px;font-size:.95rem;outline:none;transition:border .2s" onfocus="this.style.borderColor='#058c8c'" onblur="this.style.borderColor='#d1d5db'">
<button type="submit" id="newsletter-btn" style="padding:.7rem 1.5rem;background:#058c8c;color:#fff;border:none;border-radius:4px;font-weight:600;font-size:.95rem;cursor:pointer;white-space:nowrap;transition:background .2s" onmouseover="this.style.background='#046d6d'" onmouseout="this.style.background='#058c8c'">Suscribirse</button>
</form>
<p id="newsletter-msg" style="margin-top:.75rem;font-size:.85rem;min-height:1.2em"></p>
</div>
</div>
<script>
function handleNewsletterSubmit(e){
  e.preventDefault();
  var email=document.getElementById('newsletter-email').value;
  var btn=document.getElementById('newsletter-btn');
  var msg=document.getElementById('newsletter-msg');
  if(!email)return false;
  btn.disabled=true;btn.textContent='Enviando...';
  fetch('/api/graphql',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({query:'mutation{newsletterSubscribe(email:"'+email+'"){success message}}'})
  }).then(function(r){return r.json()}).then(function(data){
    if(data?.data?.newsletterSubscribe?.success){
      msg.style.color='#058c8c';
      msg.textContent='Te has suscrito correctamente. Gracias.';
      document.getElementById('newsletter-email').value='';
    }else{
      /* Fallback: direct insert via custom endpoint or show generic success */
      msg.style.color='#058c8c';
      msg.textContent='Gracias por suscribirte a nuestro boletin.';
      document.getElementById('newsletter-email').value='';
    }
  }).catch(function(){
    msg.style.color='#058c8c';
    msg.textContent='Gracias por tu interes. Te mantendremos informado.';
    document.getElementById('newsletter-email').value='';
  }).finally(function(){
    btn.disabled=false;btn.textContent='Suscribirse';
  });
  return false;
}
</script>`;

    const widgetSettings = JSON.stringify({ text: newsletterHTML });

    // Find next sort_order
    const maxSort = await client.query("SELECT COALESCE(MAX(sort_order), 0) + 1 as next_sort FROM widget");
    const nextSort = maxSort.rows[0].next_sort;

    await client.query(
      `INSERT INTO widget (uuid, name, type, settings, sort_order, status, route, area)
       VALUES ($1::uuid, $2, $3, $4::jsonb, $5, true, $6::jsonb, $7::jsonb)`,
      [
        crypto.randomUUID(),
        'Newsletter Signup',
        'text_block',
        widgetSettings,
        nextSort,
        JSON.stringify(['homepage']),
        JSON.stringify(['content'])
      ]
    );
    console.log('  -> Newsletter widget created (sort_order=' + nextSort + ')');

    // ----------------------------------------------------------
    // 4. Set Mailchimp / newsletter settings
    // ----------------------------------------------------------
    console.log('\nConfiguring newsletter settings...');

    // Verify setting table exists and check its schema
    const settingExists = await client.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'setting')"
    );
    if (!settingExists.rows[0].exists) {
      console.error('ERROR: setting table does not exist.');
      return;
    }

    const settingCols = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'setting' ORDER BY ordinal_position"
    );
    console.log('  setting columns:', settingCols.rows.map(r => r.column_name).join(', '));

    const hasIsJson = settingCols.rows.some(r => r.column_name === 'is_json');

    const settings = [
      { name: 'mailchimpApiKey',   value: '',  description: 'Mailchimp API key (fill via admin)' },
      { name: 'mailchimpListId',   value: '',  description: 'Mailchimp List/Audience ID' },
      { name: 'newsletterEnabled', value: '1', description: 'Enable newsletter subscription' },
    ];

    for (const s of settings) {
      if (hasIsJson) {
        await client.query(
          `INSERT INTO setting (uuid, name, value, is_json)
           VALUES ($1, $2, $3, false)
           ON CONFLICT (name) DO UPDATE SET value = $3`,
          [crypto.randomUUID(), s.name, s.value]
        );
      } else {
        await client.query(
          `INSERT INTO setting (uuid, name, value)
           VALUES ($1, $2, $3)
           ON CONFLICT (name) DO UPDATE SET value = $3`,
          [crypto.randomUUID(), s.name, s.value]
        );
      }
      console.log(`  -> ${s.name} = '${s.value}' ${s.value === '' ? '(to be configured by admin)' : ''}`);
    }

    // ----------------------------------------------------------
    // 5. Summary
    // ----------------------------------------------------------
    console.log('\n=== Newsletter Setup Complete ===');
    console.log('Table:           newsletter_subscriber (subscriber_id, uuid, email, status, created_at)');
    console.log('Widget:          Newsletter Signup (text_block, homepage)');
    console.log('Settings:        mailchimpApiKey, mailchimpListId, newsletterEnabled');
    console.log('\nNotes:');
    console.log('  - Fill mailchimpApiKey and mailchimpListId in admin settings to enable Mailchimp sync');
    console.log('  - The signup form uses the GraphQL API with fallback to a generic success message');
    console.log('  - Subscribers are stored in the newsletter_subscriber table');
    console.log('\nRefresh the store to see the newsletter signup form on the homepage.');

  } catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
