// Setup Spanish taxes and Speedler branding in EverShop
const { Pool } = require('pg');
const pool = new Pool({
  host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres'
});

async function setup() {
  const client = await pool.connect();
  try {
    // 1. Setup Tax Classes
    console.log('Setting up Spanish tax classes...');

    // IVA General 21%
    await client.query(`
      INSERT INTO tax_class (uuid, name)
      VALUES (gen_random_uuid(), 'IVA General 21%')
      ON CONFLICT DO NOTHING
    `);

    // IVA Reducido 10%
    await client.query(`
      INSERT INTO tax_class (uuid, name)
      VALUES (gen_random_uuid(), 'IVA Reducido 10%')
      ON CONFLICT DO NOTHING
    `);

    // Get tax class IDs
    const taxClasses = await client.query(`SELECT tax_class_id, name FROM tax_class`);
    console.log('Tax classes:', taxClasses.rows);

    const ivaGeneral = taxClasses.rows.find(t => t.name.includes('21'));
    const ivaReducido = taxClasses.rows.find(t => t.name.includes('10'));

    if (ivaGeneral) {
      // Tax rate for IVA 21% - Spain
      await client.query(`
        INSERT INTO tax_rate (uuid, name, tax_class_id, country, province, postcode, rate, is_compound, priority)
        VALUES (gen_random_uuid(), 'IVA 21% España', $1, 'ES', '*', '*', 21.0000, false, 1)
        ON CONFLICT DO NOTHING
      `, [ivaGeneral.tax_class_id]);
    }

    if (ivaReducido) {
      await client.query(`
        INSERT INTO tax_rate (uuid, name, tax_class_id, country, province, postcode, rate, is_compound, priority)
        VALUES (gen_random_uuid(), 'IVA 10% España', $1, 'ES', '*', '*', 10.0000, false, 1)
        ON CONFLICT DO NOTHING
      `, [ivaReducido.tax_class_id]);
    }

    console.log('Tax rates configured');

    // 2. Setup store settings
    console.log('Setting up Speedler branding...');

    const settings = [
      ['storeName', 'Speedler'],
      ['storeDescription', 'Tu tienda de informática de confianza'],
      ['storeCurrency', 'EUR'],
      ['storeLanguage', 'es'],
      ['storeTimeZone', 'Europe/Madrid'],
      ['storeCountry', 'ES'],
      ['storePhoneNumber', '900 000 000'],
      ['storeEmail', 'info@speedler.es'],
      ['weightUnit', 'kg'],
      ['allowGuest', '1'],
      ['sendOrderConfirmationEmail', '1'],
      ['sendOrderCompleteEmail', '1'],
    ];

    for (const [name, value] of settings) {
      await client.query(`
        INSERT INTO setting (uuid, name, value, is_json)
        VALUES (gen_random_uuid(), $1, $2, false)
        ON CONFLICT (name) DO UPDATE SET value = $2
      `, [name, value]);
    }

    console.log('Store settings configured');

    // 3. Setup shipping zones for Spain
    console.log('Setting up shipping...');

    // Check if shipping tables exist
    const shippingCheck = await client.query(`
      SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'shipping_zone')
    `);

    if (shippingCheck.rows[0].exists) {
      await client.query(`
        INSERT INTO shipping_zone (uuid, name, country)
        VALUES (gen_random_uuid(), 'España', 'ES')
        ON CONFLICT DO NOTHING
      `);
      console.log('Shipping zone created');
    }

    console.log('✅ Spain setup completed!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
