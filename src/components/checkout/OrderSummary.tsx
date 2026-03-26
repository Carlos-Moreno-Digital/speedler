'use client';

import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal: number;
  canonDigitalTotal: number;
  ivaAmount: number;
  recargoAmount: number;
  shippingCost: number;
  total: number;
}

export default function OrderSummary({
  items,
  subtotal,
  canonDigitalTotal,
  ivaAmount,
  recargoAmount,
  shippingCost,
  total,
}: OrderSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-brand-brown-dark mb-4">Resumen del pedido</h2>

      <div className="space-y-3 mb-4">
        {items.map((item) => (
          <div key={item.productId} className="flex justify-between text-sm">
            <span className="text-gray-600 flex-1 mr-2">
              {item.name} <span className="text-gray-400">x{item.quantity}</span>
            </span>
            <span className="font-medium whitespace-nowrap">
              {formatPrice(item.unitPrice * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <hr className="border-gray-200 my-4" />

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        {canonDigitalTotal > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Canon digital</span>
            <span>{formatPrice(canonDigitalTotal)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">IVA (21%)</span>
          <span>{formatPrice(ivaAmount)}</span>
        </div>

        {recargoAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Recargo de equivalencia (5,2%)</span>
            <span>{formatPrice(recargoAmount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Envío (GLS)</span>
          <span>{shippingCost === 0 ? <span className="text-green-600">Gratis</span> : formatPrice(shippingCost)}</span>
        </div>

        <hr className="border-brand-cream my-2" />

        <div className="flex justify-between text-lg font-bold text-brand-brown-dark pt-2">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
