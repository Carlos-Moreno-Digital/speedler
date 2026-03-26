'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/utils';
import type { CartItem as CartItemType } from '@/types';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export default function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  return (
    <div className="flex gap-4 py-4 border-b last:border-0">
      <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            width={80}
            height={80}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            Sin imagen
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <a href={`/tienda/${item.slug}`} className="font-medium text-brand-brown-dark hover:text-brand-orange line-clamp-2">
          {item.name}
        </a>
        <p className="text-brand-orange font-bold mt-1">{formatPrice(item.unitPrice)}</p>
        {item.canonDigital > 0 && (
          <p className="text-xs text-gray-400">
            Incluye canon digital: {formatPrice(item.canonDigital)}
          </p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => onUpdateQuantity(item.productId, item.quantity - 1)}
            className="px-3 py-1 text-gray-500 hover:text-brand-orange"
            disabled={item.quantity <= 1}
          >
            -
          </button>
          <span className="px-3 py-1 font-medium min-w-[2rem] text-center">
            {item.quantity}
          </span>
          <button
            onClick={() => onUpdateQuantity(item.productId, item.quantity + 1)}
            className="px-3 py-1 text-gray-500 hover:text-brand-orange"
            disabled={item.quantity >= item.stock}
          >
            +
          </button>
        </div>

        <p className="font-bold text-brand-brown-dark">
          {formatPrice(item.unitPrice * item.quantity)}
        </p>

        <button
          onClick={() => onRemove(item.productId)}
          className="text-xs text-red-500 hover:text-red-700"
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
