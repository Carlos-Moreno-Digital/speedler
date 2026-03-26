'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiShoppingCart, FiMinus, FiPlus, FiCheck, FiTruck } from 'react-icons/fi';

interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  summary: string | null;
  description: string | null;
  specs: string | null;
  image: string | null;
  salePrice: number;
  costPrice: number;
  canonDigital: number;
  stock: number;
  weight: number;
  isOffer: boolean;
  category: { name: string; slug: string } | null;
  manufacturer: { name: string } | null;
}

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  salePrice: number;
  manufacturer: { name: string } | null;
}

interface Props {
  product: Product;
  relatedProducts: RelatedProduct[];
}

export default function ProductDetail({ product, relatedProducts }: Props) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description');

  function handleAddToCart() {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.image,
      unitPrice: product.salePrice,
      canonDigital: product.canonDigital,
      stock: product.stock,
      quantity,
    });
    toast.success(`${product.name} añadido al carrito`);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs mb-8" style={{ color: '#777' }}>
          <Link href="/" className="hover:text-[#008060] transition-colors">
            Inicio
          </Link>
          <span>&gt;</span>
          <Link href="/tienda" className="hover:text-[#008060] transition-colors">
            Tienda
          </Link>
          {product.category && (
            <>
              <span>&gt;</span>
              <Link
                href={`/tienda?category=${product.category.slug}`}
                className="hover:text-[#008060] transition-colors"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>&gt;</span>
          <span className="truncate max-w-xs" style={{ color: '#3a3a3a' }}>{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-white border border-[#ebebeb] rounded-md p-6">
            <div className="aspect-square bg-gray-50 rounded flex items-center justify-center overflow-hidden">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="object-contain w-full h-full p-8"
                />
              ) : (
                <svg
                  className="w-32 h-32 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>
            {product.isOffer && (
              <span className="mt-4 inline-block text-xs font-semibold uppercase px-3 py-1 rounded text-white" style={{ backgroundColor: '#008060' }}>
                Oferta
              </span>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5">
            {product.manufacturer && (
              <p className="text-xs uppercase tracking-wider" style={{ color: '#777' }}>
                {product.manufacturer.name}
              </p>
            )}
            <h1 className="text-2xl font-bold" style={{ color: '#3a3a3a' }}>
              {product.name}
            </h1>

            {product.summary && (
              <p className="text-sm leading-relaxed" style={{ color: '#777' }}>{product.summary}</p>
            )}

            {/* Price */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-bold" style={{ color: '#3a3a3a' }}>
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-sm" style={{ color: '#777' }}>IVA incluido</span>
              </div>
              {product.canonDigital > 0 && (
                <p className="text-sm" style={{ color: '#777' }}>
                  + Canon digital: {formatPrice(product.canonDigital)}
                </p>
              )}
              <p className="text-xs" style={{ color: '#777' }}>SKU: {product.sku}</p>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-3">
              {product.stock > 0 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <FiCheck className="w-5 h-5" />
                  <span className="font-medium text-sm">En stock</span>
                  <span className="text-xs" style={{ color: '#777' }}>
                    ({product.stock} disponible{product.stock > 1 ? 's' : ''})
                  </span>
                </div>
              ) : (
                <span className="text-red-500 font-medium text-sm">
                  Temporalmente sin stock
                </span>
              )}
            </div>

            {/* Shipping estimate */}
            <div className="flex items-center gap-2 text-sm" style={{ color: '#777' }}>
              <FiTruck className="w-4 h-4" />
              <span>Envío estimado: 24-48h laborables</span>
            </div>

            {/* Quantity + Add to Cart */}
            {product.stock > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center border border-[#ebebeb] rounded w-fit">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <FiMinus className="w-4 h-4" style={{ color: '#3a3a3a' }} />
                  </button>
                  <span className="px-5 py-3 text-center min-w-[3rem] font-medium text-sm" style={{ color: '#3a3a3a' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="p-3 hover:bg-gray-50 transition-colors"
                  >
                    <FiPlus className="w-4 h-4" style={{ color: '#3a3a3a' }} />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="w-full flex items-center justify-center gap-2 rounded-sm py-3 text-lg font-medium uppercase tracking-wide text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#008060' }}
                >
                  <FiShoppingCart className="w-5 h-5" />
                  Añadir al carrito
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs: Description / Specs */}
        <div className="mt-16">
          <div className="border-b border-[#ebebeb]">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-[#008060] text-[#008060]'
                    : 'border-transparent hover:text-[#3a3a3a]'
                }`}
                style={activeTab !== 'description' ? { color: '#777' } : undefined}
              >
                Descripción
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'specs'
                    ? 'border-[#008060] text-[#008060]'
                    : 'border-transparent hover:text-[#3a3a3a]'
                }`}
                style={activeTab !== 'specs' ? { color: '#777' } : undefined}
              >
                Especificaciones
              </button>
            </div>
          </div>
          <div className="py-8">
            {activeTab === 'description' && (
              <div className="prose prose-gray max-w-none">
                {product.description ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p style={{ color: '#777' }}>
                    No hay descripción disponible para este producto.
                  </p>
                )}
              </div>
            )}
            {activeTab === 'specs' && (
              <div className="prose prose-gray max-w-none">
                {product.specs ? (
                  <div dangerouslySetInnerHTML={{ __html: product.specs }} />
                ) : (
                  <p style={{ color: '#777' }}>
                    No hay especificaciones disponibles para este producto.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6" style={{ color: '#3a3a3a' }}>
              Productos relacionados
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/tienda/${rp.slug}`}
                  className="group bg-white border border-[#ebebeb] rounded-md overflow-hidden transition-shadow hover:shadow-md"
                >
                  <div className="bg-gray-50 h-40 flex items-center justify-center overflow-hidden">
                    {rp.image ? (
                      <img
                        src={rp.image}
                        alt={rp.name}
                        className="object-contain h-full w-full p-4 group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <svg
                        className="w-12 h-12 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </div>
                  <div className="p-4">
                    {rp.manufacturer && (
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#777' }}>
                        {rp.manufacturer.name}
                      </p>
                    )}
                    <h3
                      className="text-sm font-medium line-clamp-2 group-hover:text-[#008060] transition-colors"
                      style={{ color: '#3a3a3a' }}
                    >
                      {rp.name}
                    </h3>
                    <span className="mt-2 block text-lg font-bold" style={{ color: '#3a3a3a' }}>
                      {formatPrice(rp.salePrice)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
