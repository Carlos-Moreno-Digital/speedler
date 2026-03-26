'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiArrowLeft, FiCheck } from 'react-icons/fi';

interface Address {
  id: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  isBilling: boolean;
}

const emptyForm = {
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'ES',
  isDefault: false,
  isBilling: false,
};

export default function DireccionesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/cuenta/direcciones');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetchAddresses();
  }, [status]);

  async function fetchAddresses() {
    try {
      const res = await fetch('/api/addresses');
      if (res.ok) {
        const data = await res.json();
        setAddresses(Array.isArray(data) ? data : data.data || []);
      }
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }

  function startEdit(addr: Address) {
    setEditingId(addr.id);
    setForm({
      street: addr.street,
      city: addr.city,
      province: addr.province,
      postalCode: addr.postalCode,
      country: addr.country,
      isDefault: addr.isDefault,
      isBilling: addr.isBilling,
    });
    setShowForm(true);
  }

  function startNew() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.street || !form.city || !form.province || !form.postalCode) {
      toast.error('Rellena todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/addresses/${editingId}`
        : '/api/addresses';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Error al guardar');
      }

      toast.success(
        editingId
          ? 'Dirección actualizada'
          : 'Dirección añadida'
      );
      cancelForm();
      fetchAddresses();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al guardar la dirección'
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta dirección?')) {
      return;
    }

    try {
      const res = await fetch(`/api/addresses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Dirección eliminada');
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error('Error al eliminar la dirección');
    }
  }

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/cuenta"
              className="p-2 rounded-lg hover:bg-brand-cream transition-colors"
            >
              <FiArrowLeft className="w-5 h-5 text-brand-brown-dark" />
            </Link>
            <h1 className="text-3xl font-bold text-brand-brown-dark">
              Mis direcciones
            </h1>
          </div>
          {!showForm && (
            <button onClick={startNew} className="btn-primary flex items-center gap-2">
              <FiPlus className="w-4 h-4" />
              Nueva dirección
            </button>
          )}
        </div>

        {/* Form */}
        {showForm && (
          <div className="card p-6 sm:p-8 mb-8 animate-fade-in">
            <h2 className="text-lg font-bold text-brand-brown-dark mb-6">
              {editingId ? 'Editar dirección' : 'Nueva dirección'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    className="input-field"
                    placeholder="Calle, número, piso..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provincia *
                  </label>
                  <input
                    type="text"
                    value={form.province}
                    onChange={(e) => updateField('province', e.target.value)}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código postal *
                  </label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => updateField('postalCode', e.target.value)}
                    className="input-field"
                    maxLength={5}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <select
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="input-field"
                  >
                    <option value="ES">España</option>
                    <option value="PT">Portugal</option>
                    <option value="FR">Francia</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isDefault}
                      onChange={(e) =>
                        updateField('isDefault', e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700">
                      Dirección de envío por defecto
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isBilling}
                      onChange={(e) =>
                        updateField('isBilling', e.target.checked)
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700">
                      Dirección de facturación
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiCheck className="w-4 h-4" />
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Actualizar'
                      : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={cancelForm}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address list */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
                <div className="bg-gray-200 h-4 rounded w-1/2 mb-2" />
                <div className="bg-gray-200 h-4 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : addresses.length === 0 && !showForm ? (
          <div className="card p-12 text-center">
            <FiMapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-brand-brown-dark mb-2">
              No tienes direcciones
            </h2>
            <p className="text-gray-500 mb-6">
              Añade una dirección para agilizar tus compras.
            </p>
            <button onClick={startNew} className="btn-primary">
              Añadir dirección
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="card p-6 relative group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{addr.street}</p>
                    <p className="text-sm text-gray-600">
                      {addr.postalCode} {addr.city}, {addr.province}
                    </p>
                    <p className="text-sm text-gray-500">{addr.country}</p>
                    <div className="flex gap-2 mt-3">
                      {addr.isDefault && (
                        <span className="badge-orange text-xs">
                          Envío por defecto
                        </span>
                      )}
                      {addr.isBilling && (
                        <span className="badge-green text-xs">
                          Facturación
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(addr)}
                      className="p-2 text-gray-400 hover:text-brand-orange transition-colors rounded-lg hover:bg-brand-cream"
                      aria-label="Editar"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                      aria-label="Eliminar"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
