'use client';

import { formatPrice } from '@/lib/utils';

interface CartSummaryProps {
  subtotal: number;
  canonDigitalTotal: number;
  shippingCost: number;
  ivaAmount?: number;
  recargoAmount?: number;
  total: number;
  showCheckoutButton?: boolean;
}

export default function CartSummary({
  subtotal,
  canonDigitalTotal,
  shippingCost,
  ivaAmount,
  recargoAmount,
  total,
  showCheckoutButton = true,
}: CartSummaryProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg font-bold text-brand-brown-dark mb-4">Resumen del pedido</h3>

      <div className="space-y-3 text-sm">
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

        {ivaAmount !== undefined && ivaAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">IVA (21%)</span>
            <span>{formatPrice(ivaAmount)}</span>
          </div>
        )}

        {recargoAmount !== undefined && recargoAmount > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600">Recargo equivalencia (5,2%)</span>
            <span>{formatPrice(recargoAmount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-gray-600">Envío</span>
          <span>{shippingCost === 0 ? <span className="text-green-600 font-medium">Gratis</span> : formatPrice(shippingCost)}</span>
        </div>

        {shippingCost > 0 && subtotal < 100 && (
          <p className="text-xs text-gray-400">
            Envío gratis en pedidos superiores a 100 €
          </p>
        )}

        <hr className="border-brand-cream" />

        <div className="flex justify-between text-lg font-bold text-brand-brown-dark">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      {showCheckoutButton && (
        <a href="/checkout" className="btn-primary w-full mt-6 text-center block">
          Tramitar Pedido
        </a>
      )}
    </div>
  );
}
