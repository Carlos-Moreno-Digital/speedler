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
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-brand-orange">
            Inicio
          </Link>
          <span>/</span>
          <Link href="/tienda" className="hover:text-brand-orange">
            Tienda
          </Link>
          {product.category && (
            <>
              <span>/</span>
              <Link
                href={`/tienda?category=${product.category.slug}`}
                className="hover:text-brand-orange"
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-gray-800 truncate max-w-xs">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image gallery */}
          <div className="card p-8">
            <div className="aspect-square bg-gray-50 rounded-xl flex items-center justify-center overflow-hidden">
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
              <span className="mt-4 inline-block badge-orange">Oferta</span>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-6">
            {product.manufacturer && (
              <p className="text-sm text-gray-500 uppercase tracking-wide">
                {product.manufacturer.name}
              </p>
            )}
            <h1 className="text-2xl lg:text-3xl font-bold text-brand-brown-dark">
              {product.name}
            </h1>

            {product.summary && (
              <p className="text-gray-600 leading-relaxed">{product.summary}</p>
            )}

            {/* Price breakdown */}
            <div className="card p-6 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-brand-orange">
                  {formatPrice(product.salePrice)}
                </span>
                <span className="text-sm text-gray-400">IVA incluido</span>
              </div>
              {product.canonDigital > 0 && (
                <p className="text-sm text-gray-500">
                  + Canon digital: {formatPrice(product.canonDigital)}
                </p>
              )}
              <p className="text-xs text-gray-400">SKU: {product.sku}</p>
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-3">
              {product.stock > 0 ? (
                <>
                  <div className="flex items-center gap-2 text-green-600">
                    <FiCheck className="w-5 h-5" />
                    <span className="font-medium">En stock</span>
                    <span className="text-sm text-gray-400">
                      ({product.stock} disponible{product.stock > 1 ? 's' : ''})
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-red-500 font-medium">
                  Temporalmente sin stock
                </span>
              )}
            </div>

            {/* Shipping estimate */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FiTruck className="w-4 h-4" />
              <span>Envío estimado: 24-48h laborables</span>
            </div>

            {/* Quantity + Add to Cart */}
            {product.stock > 0 && (
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-3 hover:bg-gray-100 rounded-l-lg transition-colors"
                  >
                    <FiMinus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-3 text-center min-w-[3rem] font-medium">
                    {quantity}
                  </span>
                  <button
                    onClick={() =>
                      setQuantity(Math.min(product.stock, quantity + 1))
                    }
                    className="p-3 hover:bg-gray-100 rounded-r-lg transition-colors"
                  >
                    <FiPlus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
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
          <div className="border-b border-gray-200">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('description')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'description'
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Descripción
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'specs'
                    ? 'border-brand-orange text-brand-orange'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
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
                  <p className="text-gray-500">
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
                  <p className="text-gray-500">
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
            <h2 className="text-2xl font-bold text-brand-brown-dark mb-6">
              Productos relacionados
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/tienda/${rp.slug}`}
                  className="card group overflow-hidden"
                >
                  <div className="bg-gray-50 h-40 flex items-center justify-center overflow-hidden">
                    {rp.image ? (
                      <img
                        src={rp.image}
                        alt={rp.name}
                        className="object-contain h-full w-full p-4 group-hover:scale-105 transition-transform duration-300"
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
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        {rp.manufacturer.name}
                      </p>
                    )}
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-brand-orange transition-colors">
                      {rp.name}
                    </h3>
                    <span className="mt-2 block text-lg font-bold text-brand-orange">
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
