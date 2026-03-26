'use client';

import { useState } from 'react';

interface CheckoutFormProps {
  onSubmit: (data: {
    shippingAddress: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
    billingAddress?: {
      street: string;
      city: string;
      province: string;
      postalCode: string;
      country: string;
    };
    useSameAddress: boolean;
    notes: string;
  }) => void;
}

export default function CheckoutForm({ onSubmit }: CheckoutFormProps) {
  const [shipping, setShipping] = useState({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'ES',
  });
  const [billing, setBilling] = useState({
    street: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'ES',
  });
  const [useSameAddress, setUseSameAddress] = useState(true);
  const [notes, setNotes] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      shippingAddress: shipping,
      billingAddress: useSameAddress ? undefined : billing,
      useSameAddress,
      notes,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-brand-brown-dark mb-4">Dirección de envío</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
            <input
              type="text"
              value={shipping.street}
              onChange={(e) => setShipping({ ...shipping, street: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
            <input
              type="text"
              value={shipping.city}
              onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
            <input
              type="text"
              value={shipping.province}
              onChange={(e) => setShipping({ ...shipping, province: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
            <input
              type="text"
              value={shipping.postalCode}
              onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">País</label>
            <select
              value={shipping.country}
              onChange={(e) => setShipping({ ...shipping, country: e.target.value })}
              className="input-field"
            >
              <option value="ES">España</option>
              <option value="PT">Portugal</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={useSameAddress}
            onChange={(e) => setUseSameAddress(e.target.checked)}
            className="rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
          />
          <span className="text-sm font-medium text-gray-700">
            Usar la misma dirección para facturación
          </span>
        </label>

        {!useSameAddress && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección facturación *</label>
              <input
                type="text"
                value={billing.street}
                onChange={(e) => setBilling({ ...billing, street: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad *</label>
              <input
                type="text"
                value={billing.city}
                onChange={(e) => setBilling({ ...billing, city: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Provincia *</label>
              <input
                type="text"
                value={billing.province}
                onChange={(e) => setBilling({ ...billing, province: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal *</label>
              <input
                type="text"
                value={billing.postalCode}
                onChange={(e) => setBilling({ ...billing, postalCode: e.target.value })}
                className="input-field"
                required
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas del pedido (opcional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input-field min-h-[80px]"
          placeholder="Instrucciones especiales para el envío..."
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        Continuar al pago
      </button>
    </form>
  );
}
