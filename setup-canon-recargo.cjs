/**
 * Canon Digital & Recargo de Equivalencia Setup Script
 *
 * Creates tables and populates Spanish tax surcharge data:
 * - Canon Digital: fixed per-unit levy on storage/electronics
 * - Recargo de Equivalencia: surcharge for retail businesses under simplified VAT regime
 *
 * Usage:
 *   docker cp setup-canon-recargo.cjs speedler-app-1:/app/setup-canon-recargo.cjs
 *   docker exec -it speedler-app-1 node setup-canon-recargo.cjs
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: 'db',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres'
});

const CANON_DIGITAL_RATES = [
  { pattern: 'Discos Duros%',  amount: 6.45, description: 'Canon digital - Discos duros / HDD' },
  { pattern: 'SSD%',           amount: 6.45, description: 'Canon digital - Unidades SSD' },
  { pattern: 'Memorias%',      amount: 0.24, description: 'Canon digital - Memorias USB / tarjetas' },
  { pattern: 'CD%',            amount: 0.08, description: 'Canon digital - Soportes CD' },
  { pattern: 'DVD%',           amount: 0.08, description: 'Canon digital - Soportes DVD' },
  { pattern: 'Ordenadores%',   amount: 5.45, description: 'Canon digital - Ordenadores de sobremesa' },
  { pattern: 'Portatiles%',    amount: 5.45, description: 'Canon digital - Ordenadores portatiles' },
  { pattern: 'Tablets%',       amount: 3.15, description: 'Canon digital - Tablets' },
  { pattern: 'Smartphones%',   amount: 1.10, description: 'Canon digital - Smartphones' },
  { pattern: 'Impresoras%',    amount: 7.50, description: 'Canon digital - Impresoras multifuncion' },
];

const RECARGO_RATES = [
  { iva_rate: 21.00, recargo_rate: 5.20 },
  { iva_rate: 10.00, recargo_rate: 1.40 },
  { iva_rate:  4.00, recargo_rate: 0.50 },
];

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---------------------------------------------------------------
    // 1. Create canon_digital table
    // ---------------------------------------------------------------
    console.log('Creating canon_digital table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS canon_digital (
        canon_id SERIAL PRIMARY KEY,
        category_pattern VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        description VARCHAR(255)
      )
    `);

    // ---------------------------------------------------------------
    // 2. Populate canon digital rates (upsert by pattern)
    // ---------------------------------------------------------------
    console.log('Populating canon digital rates...');
    for (const rate of CANON_DIGITAL_RATES) {
      // Delete existing entry for this pattern to allow re-runs
      await client.query(
        'DELETE FROM canon_digital WHERE category_pattern = $1',
        [rate.pattern]
      );
      await client.query(
        `INSERT INTO canon_digital (category_pattern, amount, description)
         VALUES ($1, $2, $3)`,
        [rate.pattern, rate.amount, rate.description]
      );
    }
    console.log(`  Inserted ${CANON_DIGITAL_RATES.length} canon digital rates.`);

    // ---------------------------------------------------------------
    // 3. Create recargo_equivalencia table
    // ---------------------------------------------------------------
    console.log('Creating recargo_equivalencia table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS recargo_equivalencia (
        recargo_id SERIAL PRIMARY KEY,
        iva_rate DECIMAL(5,2) NOT NULL,
        recargo_rate DECIMAL(5,2) NOT NULL
      )
    `);

    // ---------------------------------------------------------------
    // 4. Populate recargo de equivalencia rates
    // ---------------------------------------------------------------
    console.log('Populating recargo de equivalencia rates...');
    for (const rate of RECARGO_RATES) {
      await client.query(
        'DELETE FROM recargo_equivalencia WHERE iva_rate = $1',
        [rate.iva_rate]
      );
      await client.query(
        `INSERT INTO recargo_equivalencia (iva_rate, recargo_rate)
         VALUES ($1, $2)`,
        [rate.iva_rate, rate.recargo_rate]
      );
    }
    console.log(`  Inserted ${RECARGO_RATES.length} recargo de equivalencia rates.`);

    // ---------------------------------------------------------------
    // 5. Add canon_digital_amount column to product table
    // ---------------------------------------------------------------
    console.log('Adding canon_digital_amount column to product table...');
    await client.query(`
      ALTER TABLE product
      ADD COLUMN IF NOT EXISTS canon_digital_amount DECIMAL(10,2) DEFAULT 0
    `);
    console.log('  Column canon_digital_amount ensured on product table.');

    // ---------------------------------------------------------------
    // 6. Update products' canon_digital_amount based on category
    // ---------------------------------------------------------------
    console.log('Updating product canon digital amounts from category...');
    const updateResult = await client.query(`
      UPDATE product p
      SET canon_digital_amount = cd.amount
      FROM category c
      JOIN category_description cdesc
        ON cdesc.category_description_category_id = c.category_id
      JOIN canon_digital cd
        ON cdesc.name LIKE cd.category_pattern
      WHERE p.category_id = c.category_id
    `);

    // ---------------------------------------------------------------
    // 7. Report results
    // ---------------------------------------------------------------
    const updatedCount = updateResult.rowCount;
    console.log(`  ${updatedCount} product(s) updated with canon digital amounts.`);

    // Also show a breakdown per category pattern
    const breakdown = await client.query(`
      SELECT cd.category_pattern, cd.amount, COUNT(p.product_id) AS product_count
      FROM canon_digital cd
      LEFT JOIN category_description cdesc
        ON cdesc.name LIKE cd.category_pattern
      LEFT JOIN category c
        ON c.category_id = cdesc.category_description_category_id
      LEFT JOIN product p
        ON p.category_id = c.category_id
      GROUP BY cd.canon_id, cd.category_pattern, cd.amount
      ORDER BY cd.category_pattern
    `);

    console.log('\n--- Canon Digital Breakdown ---');
    console.log('Category Pattern        | Amount  | Products');
    console.log('------------------------|---------|----------');
    for (const row of breakdown.rows) {
      const pat = row.category_pattern.padEnd(24);
      const amt = parseFloat(row.amount).toFixed(2).padStart(7);
      const cnt = row.product_count.toString().padStart(8);
      console.log(`${pat}| ${amt} | ${cnt}`);
    }

    await client.query('COMMIT');
    console.log('\nDone. Canon digital and recargo de equivalencia setup complete.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during setup:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
