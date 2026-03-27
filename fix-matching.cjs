// Fix product matching: add part_number and EAN columns for supplier sync
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ host: 'db', port: 5432, user: 'postgres', password: 'postgres', database: 'postgres' });

async function fix() {
  const client = await pool.connect();
  try {
    console.log('=== Fixing Product Matching ===\n');

    // 1. Add part_number and ean columns to product table
    console.log('1. Adding part_number and ean columns...');
    await client.query('ALTER TABLE product ADD COLUMN IF NOT EXISTS part_number VARCHAR(255)');
    await client.query('ALTER TABLE product ADD COLUMN IF NOT EXISTS ean VARCHAR(255)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_part_number ON product(part_number) WHERE part_number IS NOT NULL');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_ean ON product(ean) WHERE ean IS NOT NULL');
    console.log('   Columns and indexes created.\n');

    // 2. Populate from CSV
    console.log('2. Populating from CSV...');
    const csvPath = '/app/ProductosPropios.csv';
    const content = fs.readFileSync(csvPath, 'latin1');
    const lines = content.split('\n').filter(l => l.trim());
    let updated = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(';');
      if (cols.length < 22) continue;
      const sku = (cols[2] || '').trim();
      const partNumber = (cols[3] || '').trim();
      const ean = (cols[4] || '').trim();
      if (!sku) continue;
      if (!partNumber && !ean) continue;

      const r = await client.query(
        'UPDATE product SET part_number = COALESCE(NULLIF($1, \'\'), part_number), ean = COALESCE(NULLIF($2, \'\'), ean) WHERE sku = $3',
        [partNumber, ean, sku]
      );
      if (r.rowCount > 0) updated++;
    }
    console.log('   Updated ' + updated + ' products with part_number/ean\n');

    // 3. Stats
    const stats = await client.query(`
      SELECT
        (SELECT count(*) FROM product WHERE part_number IS NOT NULL AND part_number != '') as with_pn,
        (SELECT count(*) FROM product WHERE ean IS NOT NULL AND ean != '') as with_ean,
        (SELECT count(*) FROM product) as total
    `);
    const s = stats.rows[0];
    console.log('3. Stats:');
    console.log('   Total products: ' + s.total);
    console.log('   With part_number: ' + s.with_pn);
    console.log('   With EAN: ' + s.with_ean);

    console.log('\nDone! Now re-run the supplier sync to get better matching.');
    console.log('The sync script needs to be updated to also match by part_number and EAN.');

  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.release();
    await pool.end();
  }
}
fix();
