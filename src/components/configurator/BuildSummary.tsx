'use client';

import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';

interface Selection {
  componentTypeSlug: string;
  productId: string;
  product: {
    id: string;
    name: string;
    salePrice: number;
    canonDigital: number;
    stock: number;
    image: string | null;
  };
}

interface BuildSummaryProps {
  selections: Selection[];
  totalPrice: number;
  totalCanonDigital: number;
}

export default function BuildSummary({
  selections,
  totalPrice,
  totalCanonDigital,
}: BuildSummaryProps) {
  const { addItem } = useCart();

  function handleAddToCart() {
    for (const selection of selections) {
      addItem({
        productId: selection.product.id,
        name: selection.product.name,
        slug: '',
        image: selection.product.image,
        quantity: 1,
        unitPrice: Number(selection.product.salePrice),
        canonDigital: Number(selection.product.canonDigital),
        stock: selection.product.stock,
      });
    }
    alert('Configuración añadida al carrito');
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
      <h3 className="text-lg font-bold text-brand-brown-dark mb-4">Tu configuración</h3>

      {selections.length === 0 ? (
        <p className="text-gray-400 text-sm">
          Selecciona componentes para ver el resumen
        </p>
      ) : (
        <>
          <div className="space-y-2 mb-4">
            {selections.map((s) => (
              <div key={s.componentTypeSlug} className="flex justify-between text-sm">
                <span className="text-gray-600 truncate mr-2">{s.product.name}</span>
                <span className="font-medium whitespace-nowrap">
                  {formatPrice(Number(s.product.salePrice))}
                </span>
              </div>
            ))}
          </div>

          <hr className="border-brand-cream my-4" />

          {totalCanonDigital > 0 && (
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Canon digital incluido</span>
              <span>{formatPrice(totalCanonDigital)}</span>
            </div>
          )}

          <div className="flex justify-between text-xl font-bold text-brand-brown-dark mb-6">
            <span>Total</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>

          <button onClick={handleAddToCart} className="btn-primary w-full">
            Añadir al carrito
          </button>
        </>
      )}
    </div>
  );
}
