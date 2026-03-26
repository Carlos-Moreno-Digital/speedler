/**
 * Migration: Create supplier_sync and sync_log tables
 * @param {import('pg').Pool} pool - PostgreSQL connection pool
 */
export default async function migrate(pool) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS supplier_sync (
        supplier_sync_id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid() UNIQUE,
        supplier_name VARCHAR(255) UNIQUE NOT NULL,
        sync_type VARCHAR(50) DEFAULT 'CSV_URL',
        endpoint TEXT NOT NULL,
        credentials TEXT,
        last_sync_at TIMESTAMP WITH TIME ZONE,
        last_sync_status VARCHAR(50),
        sync_interval_minutes INT DEFAULT 360,
        field_mapping JSONB DEFAULT '{}',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sync_log (
        sync_log_id SERIAL PRIMARY KEY,
        uuid UUID DEFAULT gen_random_uuid() UNIQUE,
        supplier_sync_id INT REFERENCES supplier_sync(supplier_sync_id) ON DELETE CASCADE,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE,
        status VARCHAR(50) DEFAULT 'RUNNING',
        products_created INT DEFAULT 0,
        products_updated INT DEFAULT 0,
        products_deactivated INT DEFAULT 0,
        errors JSONB DEFAULT '[]'
      );
    `);

    // Index for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_log_supplier ON sync_log(supplier_sync_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
    `);

    await client.query('COMMIT');
    console.log('[supplier-sync] Migration Version-1.0.0 completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('[supplier-sync] Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}
