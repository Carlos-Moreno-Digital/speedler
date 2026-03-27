/**
 * GLS Shipping Setup Script
 *
 * Creates shipping zone for Spain and GLS shipping methods with weight-based
 * rates, plus a free-shipping threshold rule.
 *
 * EverShop stores shipping config in:
 *   - shipping_zone (zone per country/region)
 *   - shipping_zone_method (methods linked to a zone with rate calculation)
 *
 * Since the exact EverShop shipping schema may vary, this script checks for
 * existing tables and creates custom ones if needed.
 *
 * Usage:
 *   docker cp setup-shipping-gls.cjs speedler-app-1:/app/setup-shipping-gls.cjs
 *   docker exec -it speedler-app-1 node setup-shipping-gls.cjs
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

const GLS_RATES = [
  { name: 'GLS Standard (0-5 kg)',   min_weight: 0,  max_weight: 5,  cost: 4.95 },
  { name: 'GLS Standard (5-15 kg)',  min_weight: 5,  max_weight: 15, cost: 6.95 },
  { name: 'GLS Standard (15-30 kg)', min_weight: 15, max_weight: 30, cost: 9.95 },
];

const FREE_SHIPPING_THRESHOLD = 100.00; // EUR

function uuid() {
  return crypto.randomUUID();
}

async function tableExists(client, tableName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     )`,
    [tableName]
  );
  return res.rows[0].exists;
}

async function columnExists(client, tableName, columnName) {
  const res = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2
     )`,
    [tableName, columnName]
  );
  return res.rows[0].exists;
}

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---------------------------------------------------------------
    // 1. Check if EverShop shipping tables exist
    // ---------------------------------------------------------------
    const hasShippingZone = await tableExists(client, 'shipping_zone');
    const hasShippingZoneMethod = await tableExists(client, 'shipping_zone_method');

    console.log(`shipping_zone table exists:        ${hasShippingZone}`);
    console.log(`shipping_zone_method table exists:  ${hasShippingZoneMethod}`);

    // ---------------------------------------------------------------
    // 2. Create shipping zone for Spain
    // ---------------------------------------------------------------
    let spainZoneId;

    if (hasShippingZone) {
      // Use the existing EverShop shipping_zone table
      console.log('\nUsing existing shipping_zone table...');

      // Check if Spain zone already exists
      const existing = await client.query(
        `SELECT shipping_zone_id FROM shipping_zone WHERE country = 'ES' LIMIT 1`
      );

      if (existing.rows.length > 0) {
        spainZoneId = existing.rows[0].shipping_zone_id;
        console.log(`  Spain shipping zone already exists (id: ${spainZoneId}).`);
      } else {
        // Determine columns available on shipping_zone
        const hasUuid = await columnExists(client, 'shipping_zone', 'uuid');
        if (hasUuid) {
          const ins = await client.query(
            `INSERT INTO shipping_zone (uuid, name, country)
             VALUES ($1, $2, $3)
             RETURNING shipping_zone_id`,
            [uuid(), 'Espana - Peninsula', 'ES']
          );
          spainZoneId = ins.rows[0].shipping_zone_id;
        } else {
          const ins = await client.query(
            `INSERT INTO shipping_zone (name, country)
             VALUES ($1, $2)
             RETURNING shipping_zone_id`,
            ['Espana - Peninsula', 'ES']
          );
          spainZoneId = ins.rows[0].shipping_zone_id;
        }
        console.log(`  Created Spain shipping zone (id: ${spainZoneId}).`);
      }
    } else {
      // EverShop shipping_zone table doesn't exist - create our own
      console.log('\nshipping_zone not found. Creating custom shipping tables...');

      await client.query(`
        CREATE TABLE IF NOT EXISTS shipping_zone (
          shipping_zone_id SERIAL PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL DEFAULT gen_random_uuid()::text,
          name VARCHAR(255) NOT NULL,
          country VARCHAR(2) NOT NULL,
          province VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('  Created shipping_zone table.');

      const ins = await client.query(
        `INSERT INTO shipping_zone (uuid, name, country)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING shipping_zone_id`,
        [uuid(), 'Espana - Peninsula', 'ES']
      );
      if (ins.rows.length > 0) {
        spainZoneId = ins.rows[0].shipping_zone_id;
      } else {
        const sel = await client.query(
          `SELECT shipping_zone_id FROM shipping_zone WHERE country = 'ES' LIMIT 1`
        );
        spainZoneId = sel.rows[0].shipping_zone_id;
      }
      console.log(`  Spain zone id: ${spainZoneId}`);
    }

    // ---------------------------------------------------------------
    // 3. Create shipping methods table if needed and insert GLS rates
    // ---------------------------------------------------------------
    if (!hasShippingZoneMethod) {
      console.log('\nCreating shipping_zone_method table...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS shipping_zone_method (
          method_id SERIAL PRIMARY KEY,
          uuid VARCHAR(36) NOT NULL DEFAULT gen_random_uuid()::text,
          zone_id INT NOT NULL REFERENCES shipping_zone(shipping_zone_id),
          name VARCHAR(255) NOT NULL,
          cost DECIMAL(10,2) NOT NULL DEFAULT 0,
          min_weight DECIMAL(10,2) DEFAULT 0,
          max_weight DECIMAL(10,2) DEFAULT NULL,
          min_order_total DECIMAL(10,2) DEFAULT NULL,
          is_enabled BOOLEAN DEFAULT true,
          calculate_api_url VARCHAR(512),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
      `);
      console.log('  Created shipping_zone_method table.');
    } else {
      console.log('\nUsing existing shipping_zone_method table.');
    }

    // Clear existing GLS methods for this zone to allow re-runs
    await client.query(
      `DELETE FROM shipping_zone_method WHERE zone_id = $1 AND name LIKE 'GLS%'`,
      [spainZoneId]
    );

    // Insert weight-based GLS rates
    console.log('\nInserting GLS shipping rates...');
    for (const rate of GLS_RATES) {
      const hasMinWeight = await columnExists(client, 'shipping_zone_method', 'min_weight');
      if (hasMinWeight) {
        await client.query(
          `INSERT INTO shipping_zone_method (uuid, zone_id, name, cost, min_weight, max_weight, is_enabled)
           VALUES ($1, $2, $3, $4, $5, $6, true)`,
          [uuid(), spainZoneId, rate.name, rate.cost, rate.min_weight, rate.max_weight]
        );
      } else {
        // Fallback: just insert name and cost
        await client.query(
          `INSERT INTO shipping_zone_method (uuid, zone_id, name, cost, is_enabled)
           VALUES ($1, $2, $3, $4, true)`,
          [uuid(), spainZoneId, rate.name, rate.cost]
        );
      }
      console.log(`  ${rate.name}: ${rate.cost.toFixed(2)} EUR`);
    }

    // Insert free shipping method for orders over threshold
    const hasMinOrder = await columnExists(client, 'shipping_zone_method', 'min_order_total');
    if (hasMinOrder) {
      await client.query(
        `INSERT INTO shipping_zone_method (uuid, zone_id, name, cost, min_order_total, is_enabled)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [uuid(), spainZoneId, 'Envio gratuito (pedidos > 100 EUR)', 0, FREE_SHIPPING_THRESHOLD]
      );
    } else {
      await client.query(
        `INSERT INTO shipping_zone_method (uuid, zone_id, name, cost, is_enabled)
         VALUES ($1, $2, $3, $4, true)`,
        [uuid(), spainZoneId, 'Envio gratuito (pedidos > 100 EUR)', 0]
      );
    }
    console.log(`  Free shipping for orders over ${FREE_SHIPPING_THRESHOLD.toFixed(2)} EUR`);

    // ---------------------------------------------------------------
    // Summary
    // ---------------------------------------------------------------
    const methodCount = await client.query(
      `SELECT COUNT(*) AS cnt FROM shipping_zone_method WHERE zone_id = $1`,
      [spainZoneId]
    );
    console.log(`\nTotal shipping methods for Spain zone: ${methodCount.rows[0].cnt}`);

    await client.query('COMMIT');
    console.log('\nDone. GLS shipping setup complete.');
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
