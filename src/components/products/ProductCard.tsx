'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatPrice } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  canonDigital?: number;
  stock: number;
  category?: string;
  manufacturer?: string;
  isOffer?: boolean;
  offerPrice?: number;
  onAddToCart?: (productId: string) => void;
  className?: string;
}

export default function ProductCard({
  id,
  slug,
  name,
  image,
  price,
  canonDigital = 0,
  stock,
  category,
  manufacturer,
  isOffer = false,
  offerPrice,
  onAddToCart,
  className,
}: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const displayPrice = isOffer && offerPrice ? offerPrice : price;
  const inStock = stock > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || !onAddToCart) return;
    onAddToCart(id);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Link
      href={`/producto/${slug}`}
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:border-brand-peach hover:shadow-lg',
        className,
      )}
    >
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {isOffer && (
          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-sm">
            Oferta
          </span>
        )}
        {stock > 0 && stock <= 5 && (
          <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-semibold text-white shadow-sm">
            Últimas unidades
          </span>
        )}
      </div>

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-bg-alt p-4">
        {image && !imageError ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        {/* Category & Manufacturer */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {category && (
            <Badge variant="default" className="text-[10px]">
              {category}
            </Badge>
          )}
          {manufacturer && (
            <span className="text-[10px] font-medium text-gray-400 uppercase">
              {manufacturer}
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="mb-2 line-clamp-2 text-sm font-medium leading-snug text-brand-brown-dark group-hover:text-brand-orange-deep transition-colors">
          {name}
        </h3>

        {/* Spacer */}
        <div className="mt-auto" />

        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-brand-orange-deep">
              {formatPrice(displayPrice)}
            </span>
            {isOffer && offerPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(price)}
              </span>
            )}
          </div>
          {canonDigital > 0 && (
            <p className="mt-0.5 text-[10px] text-gray-400">
              Incluye canon digital: {formatPrice(canonDigital)}
            </p>
          )}
        </div>

        {/* Stock indicator */}
        <div className="mb-3 flex items-center gap-1.5">
          <span
            className={cn(
              'h-2 w-2 rounded-full',
              inStock ? 'bg-green-500' : 'bg-red-500',
            )}
          />
          <span
            className={cn(
              'text-xs font-medium',
              inStock ? 'text-green-700' : 'text-red-600',
            )}
          >
            {inStock ? (stock <= 5 ? `${stock} en stock` : 'En stock') : 'Agotado'}
          </span>
        </div>

        {/* Add to cart button */}
        <Button
          variant={added ? 'secondary' : 'primary'}
          size="sm"
          disabled={!inStock}
          onClick={handleAddToCart}
          icon={added ? <FiCheck className="h-4 w-4" /> : <FiShoppingCart className="h-4 w-4" />}
          className="w-full"
        >
          {added ? 'Añadido' : inStock ? 'Añadir al carrito' : 'Sin stock'}
        </Button>
      </div>
    </Link>
  );
}
