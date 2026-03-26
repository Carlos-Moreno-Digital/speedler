'use client';

import { useCart } from '@/hooks/useCart';
import CartItem from './CartItem';
import { formatPrice } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, getSubtotal, getTotal } = useCart();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 animate-slide-in flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-brand-brown-dark">
            Carrito ({items.length})
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
          >
            &#x2715;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <p className="text-lg mb-2">Tu carrito está vacío</p>
              <a href="/tienda" className="text-brand-orange hover:underline" onClick={onClose}>
                Ir a la tienda
              </a>
            </div>
          ) : (
            items.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdateQuantity={updateQuantity}
                onRemove={removeItem}
              />
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t p-4">
            <div className="flex justify-between mb-4">
              <span className="font-medium text-gray-700">Subtotal</span>
              <span className="text-lg font-bold text-brand-brown-dark">
                {formatPrice(getSubtotal())}
              </span>
            </div>
            <a href="/carrito" className="btn-secondary w-full text-center block mb-2" onClick={onClose}>
              Ver Carrito
            </a>
            <a href="/checkout" className="btn-primary w-full text-center block" onClick={onClose}>
              Tramitar Pedido
            </a>
          </div>
        )}
      </div>
    </>
  );
}
