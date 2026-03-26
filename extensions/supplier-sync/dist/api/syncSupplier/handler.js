import { pool } from '@evershop/evershop/src/lib/postgres/connection.js';
import syncAllSuppliers from '../../crons/syncSuppliers.js';

/**
 * Admin API handler to manually trigger supplier sync.
 * POST /admin/api/supplier-sync/trigger
 * Body: { supplierId?: number } - optional, syncs all if omitted
 */
export default async function handler(request, response) {
  try {
    const { supplierId } = request.body || {};

    if (supplierId) {
      // Sync a specific supplier: reset its last_sync_at so it becomes due
      await pool.query(
        `UPDATE supplier_sync SET last_sync_at = NULL WHERE supplier_sync_id = $1 AND is_active = true`,
        [supplierId]
      );
      console.log(`[supplier-sync] Manual sync triggered for supplier ID ${supplierId}`);
    } else {
      // Reset all active suppliers so they all sync
      await pool.query(
        `UPDATE supplier_sync SET last_sync_at = NULL WHERE is_active = true`
      );
      console.log('[supplier-sync] Manual sync triggered for ALL suppliers');
    }

    // Run the sync
    const results = await syncAllSuppliers();

    response.json({
      success: true,
      message: supplierId
        ? `Sync completed for supplier ${supplierId}`
        : 'Sync completed for all suppliers',
      results
    });
  } catch (error) {
    console.error('[supplier-sync] Manual sync error:', error);
    response.status(500).json({
      success: false,
      message: error.message
    });
  }
}
