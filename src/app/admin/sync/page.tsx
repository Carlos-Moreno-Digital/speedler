'use client';

import { useState, useEffect } from 'react';

interface SupplierSync {
  id: string;
  supplierName: string;
  syncType: string;
  endpoint: string;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  syncIntervalMinutes: number;
  isActive: boolean;
  logs: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    status: string;
    productsCreated: number;
    productsUpdated: number;
    productsDeactivated: number;
  }[];
}

export default function AdminSyncPage() {
  const [suppliers, setSuppliers] = useState<SupplierSync[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [form, setForm] = useState({
    supplierName: '',
    syncType: 'CSV_URL',
    endpoint: '',
    credentials: '',
    syncIntervalMinutes: 360,
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  async function fetchSuppliers() {
    const res = await fetch('/api/admin/sync');
    const data = await res.json();
    setSuppliers(data);
  }

  async function createSupplier() {
    await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ supplierName: '', syncType: 'CSV_URL', endpoint: '', credentials: '', syncIntervalMinutes: 360 });
    fetchSuppliers();
  }

  async function triggerSync(supplierId: string) {
    setSyncing(supplierId);
    await fetch('/api/admin/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sync', supplierSyncId: supplierId }),
    });
    setSyncing(null);
    fetchSuppliers();
  }

  async function deleteSupplier(id: string) {
    if (!confirm('¿Eliminar este proveedor?')) return;
    await fetch('/api/admin/sync', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchSuppliers();
  }

  function formatInterval(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    if (minutes < 1440) return `${Math.round(minutes / 60)}h`;
    return `${Math.round(minutes / 1440)} días`;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-brown-dark">Sincronización de Proveedores</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Nuevo Proveedor
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-brand-brown-dark mb-4">Nuevo proveedor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del proveedor</label>
              <input
                type="text"
                value={form.supplierName}
                onChange={(e) => setForm({ ...form, supplierName: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de sincronización</label>
              <select
                value={form.syncType}
                onChange={(e) => setForm({ ...form, syncType: e.target.value })}
                className="input-field"
              >
                <option value="CSV_URL">CSV por URL</option>
                <option value="API">API REST</option>
                <option value="FTP">FTP/SFTP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint / URL</label>
              <input
                type="text"
                value={form.endpoint}
                onChange={(e) => setForm({ ...form, endpoint: e.target.value })}
                className="input-field"
                placeholder="https://proveedor.com/productos.csv"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Intervalo (minutos)</label>
              <select
                value={form.syncIntervalMinutes}
                onChange={(e) => setForm({ ...form, syncIntervalMinutes: parseInt(e.target.value) })}
                className="input-field"
              >
                <option value="60">Cada hora</option>
                <option value="360">Cada 6 horas</option>
                <option value="720">Cada 12 horas</option>
                <option value="1440">Cada 24 horas</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Credenciales (JSON, opcional)
              </label>
              <input
                type="text"
                value={form.credentials}
                onChange={(e) => setForm({ ...form, credentials: e.target.value })}
                className="input-field"
                placeholder='{"username": "...", "password": "..."}'
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createSupplier} className="btn-primary">Añadir Proveedor</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-brand-brown-dark">{supplier.supplierName}</h3>
                <p className="text-sm text-gray-500">
                  {supplier.syncType} | Cada {formatInterval(supplier.syncIntervalMinutes)} |{' '}
                  <span className="font-mono text-xs">{supplier.endpoint}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => triggerSync(supplier.id)}
                  disabled={syncing === supplier.id}
                  className="btn-primary btn-sm disabled:opacity-50"
                >
                  {syncing === supplier.id ? 'Sincronizando...' : 'Sincronizar ahora'}
                </button>
                <button
                  onClick={() => deleteSupplier(supplier.id)}
                  className="btn-secondary btn-sm text-red-500 border-red-300 hover:bg-red-50"
                >
                  Eliminar
                </button>
              </div>
            </div>

            <div className="flex gap-4 text-sm mb-4">
              <span>
                Estado:{' '}
                <span className={`font-medium ${
                  supplier.lastSyncStatus === 'SUCCESS' ? 'text-green-600' :
                  supplier.lastSyncStatus === 'FAILED' ? 'text-red-600' :
                  supplier.lastSyncStatus === 'RUNNING' ? 'text-blue-600' : 'text-gray-400'
                }`}>
                  {supplier.lastSyncStatus || 'Nunca sincronizado'}
                </span>
              </span>
              {supplier.lastSyncAt && (
                <span className="text-gray-500">
                  Última sync: {new Date(supplier.lastSyncAt).toLocaleString('es-ES')}
                </span>
              )}
            </div>

            {supplier.logs.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">Historial reciente</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-gray-500">
                        <th className="pr-4 pb-1">Fecha</th>
                        <th className="pr-4 pb-1">Estado</th>
                        <th className="pr-4 pb-1">Creados</th>
                        <th className="pr-4 pb-1">Actualizados</th>
                        <th className="pb-1">Desactivados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplier.logs.map((log) => (
                        <tr key={log.id} className="border-t">
                          <td className="pr-4 py-1">
                            {new Date(log.startedAt).toLocaleString('es-ES')}
                          </td>
                          <td className="pr-4 py-1">
                            <span className={`${
                              log.status === 'SUCCESS' ? 'text-green-600' :
                              log.status === 'FAILED' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="pr-4 py-1">{log.productsCreated}</td>
                          <td className="pr-4 py-1">{log.productsUpdated}</td>
                          <td className="py-1">{log.productsDeactivated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-400">
            No hay proveedores configurados. Añade uno para empezar a sincronizar productos.
          </div>
        )}
      </div>
    </div>
  );
}
