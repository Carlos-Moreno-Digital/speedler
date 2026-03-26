import { pool } from '@evershop/evershop/src/lib/postgres/connection.js';

/**
 * Admin page: Supplier Sync Management
 * Displays all suppliers, their sync status, and recent logs.
 * Provides buttons to trigger manual sync.
 */
export default async function SupplierSyncPage(request, response) {
  try {
    // Fetch all suppliers
    const suppliersResult = await pool.query(`
      SELECT
        ss.*,
        (SELECT COUNT(*) FROM sync_log sl WHERE sl.supplier_sync_id = ss.supplier_sync_id) AS total_syncs,
        (SELECT sl.status FROM sync_log sl WHERE sl.supplier_sync_id = ss.supplier_sync_id ORDER BY sl.started_at DESC LIMIT 1) AS latest_log_status,
        (SELECT sl.products_created FROM sync_log sl WHERE sl.supplier_sync_id = ss.supplier_sync_id ORDER BY sl.started_at DESC LIMIT 1) AS latest_created,
        (SELECT sl.products_updated FROM sync_log sl WHERE sl.supplier_sync_id = ss.supplier_sync_id ORDER BY sl.started_at DESC LIMIT 1) AS latest_updated
      FROM supplier_sync ss
      ORDER BY ss.supplier_name
    `);

    // Fetch recent sync logs (last 20)
    const logsResult = await pool.query(`
      SELECT
        sl.*,
        ss.supplier_name
      FROM sync_log sl
      JOIN supplier_sync ss ON sl.supplier_sync_id = ss.supplier_sync_id
      ORDER BY sl.started_at DESC
      LIMIT 20
    `);

    const suppliers = suppliersResult.rows;
    const recentLogs = logsResult.rows;

    // Render the admin page
    const html = renderPage(suppliers, recentLogs);
    response.send(html);
  } catch (error) {
    console.error('[supplier-sync] Admin page error:', error);
    response.status(500).send(`<h1>Error</h1><p>${error.message}</p>`);
  }
}

function renderPage(suppliers, recentLogs) {
  const supplierRows = suppliers.map((s) => `
    <tr>
      <td>${s.supplier_name}</td>
      <td><span class="badge badge-${s.is_active ? 'success' : 'secondary'}">${s.is_active ? 'Active' : 'Inactive'}</span></td>
      <td>${s.sync_type}</td>
      <td>${s.sync_interval_minutes} min</td>
      <td>${s.last_sync_at ? new Date(s.last_sync_at).toLocaleString('es-ES') : 'Never'}</td>
      <td><span class="badge badge-${statusColor(s.last_sync_status)}">${s.last_sync_status || 'N/A'}</span></td>
      <td>${s.latest_created || 0} / ${s.latest_updated || 0}</td>
      <td>${s.total_syncs || 0}</td>
      <td>
        <button class="btn btn-sm btn-primary" onclick="triggerSync(${s.supplier_sync_id})">Sync Now</button>
        <button class="btn btn-sm btn-${s.is_active ? 'warning' : 'success'}" onclick="toggleSupplier(${s.supplier_sync_id}, ${!s.is_active})">
          ${s.is_active ? 'Disable' : 'Enable'}
        </button>
      </td>
    </tr>
  `).join('');

  const logRows = recentLogs.map((l) => `
    <tr>
      <td>${l.supplier_name}</td>
      <td>${new Date(l.started_at).toLocaleString('es-ES')}</td>
      <td>${l.completed_at ? new Date(l.completed_at).toLocaleString('es-ES') : '-'}</td>
      <td><span class="badge badge-${statusColor(l.status)}">${l.status}</span></td>
      <td>${l.products_created}</td>
      <td>${l.products_updated}</td>
      <td>${l.products_deactivated}</td>
      <td>${Array.isArray(l.errors) ? l.errors.length : 0}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Supplier Sync - Admin</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
    h1 { color: #333; }
    h2 { color: #555; margin-top: 30px; }
    table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 20px; }
    th { background: #2c3e50; color: white; padding: 12px 10px; text-align: left; font-size: 13px; }
    td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
    tr:hover { background: #f8f9fa; }
    .badge { padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    .badge-success { background: #d4edda; color: #155724; }
    .badge-warning { background: #fff3cd; color: #856404; }
    .badge-danger { background: #f8d7da; color: #721c24; }
    .badge-secondary { background: #e2e3e5; color: #383d41; }
    .badge-info { background: #d1ecf1; color: #0c5460; }
    .btn { border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 4px; }
    .btn-primary { background: #007bff; color: white; }
    .btn-primary:hover { background: #0056b3; }
    .btn-warning { background: #ffc107; color: #333; }
    .btn-success { background: #28a745; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-sm { padding: 4px 8px; }
    .btn-lg { padding: 10px 20px; font-size: 14px; }
    .actions { margin: 20px 0; }
    #syncStatus { margin-top: 10px; padding: 10px; display: none; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Supplier Sync Management</h1>

  <div class="actions">
    <button class="btn btn-primary btn-lg" onclick="triggerSyncAll()">Sync All Suppliers</button>
    <div id="syncStatus"></div>
  </div>

  <h2>Suppliers (${suppliers.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Supplier</th>
        <th>Status</th>
        <th>Type</th>
        <th>Interval</th>
        <th>Last Sync</th>
        <th>Last Result</th>
        <th>Created / Updated</th>
        <th>Total Syncs</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      ${supplierRows || '<tr><td colspan="9">No suppliers configured</td></tr>'}
    </tbody>
  </table>

  <h2>Recent Sync Logs</h2>
  <table>
    <thead>
      <tr>
        <th>Supplier</th>
        <th>Started</th>
        <th>Completed</th>
        <th>Status</th>
        <th>Created</th>
        <th>Updated</th>
        <th>Deactivated</th>
        <th>Errors</th>
      </tr>
    </thead>
    <tbody>
      ${logRows || '<tr><td colspan="8">No sync logs yet</td></tr>'}
    </tbody>
  </table>

  <script>
    function showStatus(msg, type) {
      const el = document.getElementById('syncStatus');
      el.style.display = 'block';
      el.style.background = type === 'error' ? '#f8d7da' : type === 'success' ? '#d4edda' : '#d1ecf1';
      el.style.color = type === 'error' ? '#721c24' : type === 'success' ? '#155724' : '#0c5460';
      el.textContent = msg;
    }

    async function triggerSync(supplierId) {
      showStatus('Syncing supplier... This may take a few minutes.', 'info');
      try {
        const res = await fetch('/admin/api/supplier-sync/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ supplierId })
        });
        const data = await res.json();
        if (data.success) {
          showStatus('Sync completed successfully! Refreshing...', 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showStatus('Sync failed: ' + data.message, 'error');
        }
      } catch (e) {
        showStatus('Error: ' + e.message, 'error');
      }
    }

    async function triggerSyncAll() {
      showStatus('Syncing all suppliers... This may take several minutes.', 'info');
      try {
        const res = await fetch('/admin/api/supplier-sync/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({})
        });
        const data = await res.json();
        if (data.success) {
          showStatus('All suppliers synced successfully! Refreshing...', 'success');
          setTimeout(() => location.reload(), 1500);
        } else {
          showStatus('Sync failed: ' + data.message, 'error');
        }
      } catch (e) {
        showStatus('Error: ' + e.message, 'error');
      }
    }

    async function toggleSupplier(id, activate) {
      try {
        // Simple toggle via direct DB update would need its own API endpoint
        // For now, just show a message
        alert('Toggle supplier active/inactive - implement via admin API');
      } catch (e) {
        alert('Error: ' + e.message);
      }
    }
  </script>
</body>
</html>
  `;
}

function statusColor(status) {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'RUNNING': return 'info';
    case 'FAILED': return 'danger';
    case 'SKIPPED': return 'warning';
    default: return 'secondary';
  }
}
