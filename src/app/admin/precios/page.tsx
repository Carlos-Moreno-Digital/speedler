'use client';

import { useState, useEffect } from 'react';

interface PricingRule {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  appliesTo: string;
  targetId: string | null;
  priority: number;
  isActive: boolean;
}

export default function AdminPricingPage() {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    value: 25,
    appliesTo: 'GLOBAL',
    targetId: '',
    priority: 0,
  });

  useEffect(() => {
    fetchRules();
  }, []);

  async function fetchRules() {
    const res = await fetch('/api/admin/pricing');
    const data = await res.json();
    setRules(data);
  }

  async function createRule() {
    await fetch('/api/admin/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: '', type: 'PERCENTAGE', value: 25, appliesTo: 'GLOBAL', targetId: '', priority: 0 });
    fetchRules();
  }

  async function deleteRule(id: string) {
    if (!confirm('¿Eliminar esta regla?')) return;
    await fetch('/api/admin/pricing', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchRules();
  }

  async function toggleRule(id: string, isActive: boolean) {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;
    await fetch('/api/admin/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...rule, isActive: !isActive }),
    });
    fetchRules();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-brown-dark">Reglas de Precios</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + Nueva Regla
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-bold text-brand-brown-dark mb-4">Nueva regla de precio</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="Ej: Margen cables 15%"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                className="input-field"
              >
                <option value="PERCENTAGE">Porcentaje (%)</option>
                <option value="FIXED">Cantidad fija (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor ({form.type === 'PERCENTAGE' ? '%' : '€'})
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) })}
                className="input-field"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aplica a</label>
              <select
                value={form.appliesTo}
                onChange={(e) => setForm({ ...form, appliesTo: e.target.value })}
                className="input-field"
              >
                <option value="GLOBAL">Global (todos)</option>
                <option value="CATEGORY">Categoría</option>
                <option value="MANUFACTURER">Fabricante</option>
                <option value="PRODUCT">Producto</option>
              </select>
            </div>
            {form.appliesTo !== 'GLOBAL' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID del objetivo</label>
                <input
                  type="text"
                  value={form.targetId}
                  onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                  className="input-field"
                  placeholder="ID de categoría/fabricante/producto"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) })}
                className="input-field"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={createRule} className="btn-primary">Crear Regla</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-gray-500">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Aplica a</th>
              <th className="px-4 py-3">Prioridad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{rule.name}</td>
                <td className="px-4 py-3">
                  {rule.type === 'PERCENTAGE' ? 'Porcentaje' : 'Fijo'}
                </td>
                <td className="px-4 py-3 font-medium">
                  {rule.type === 'PERCENTAGE'
                    ? `${Number(rule.value)}%`
                    : `${Number(rule.value)} €`}
                </td>
                <td className="px-4 py-3">{rule.appliesTo}</td>
                <td className="px-4 py-3">{rule.priority}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleRule(rule.id, rule.isActive)}
                    className={`px-2 py-1 rounded-full text-xs ${
                      rule.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rule.isActive ? 'Activa' : 'Inactiva'}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-red-500 hover:text-red-700 text-xs"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
