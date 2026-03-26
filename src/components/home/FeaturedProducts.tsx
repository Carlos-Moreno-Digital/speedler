'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  salePrice: number;
  costPrice: number;
  canonDigital: number;
  stock: number;
  manufacturer?: { name: string } | null;
  category?: { name: string } | null;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch('/api/products?pageSize=8&sortBy=newest');
        if (res.ok) {
          const data = await res.json();
          setProducts(Array.isArray(data.products) ? data.products : []);
        }
      } catch {
        // Silently fail - products will show empty state
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#3a3a3a]">
              Productos destacados
            </h2>
            <p className="mt-2 text-[#777] text-sm">
              Los productos m&aacute;s populares de nuestra tienda
            </p>
          </div>
          <Link
            href="/tienda"
            className="hidden sm:inline-flex items-center text-sm text-[#777] hover:text-[#3a3a3a] transition-colors"
          >
            Ver todos
            <svg className="ml-1 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-[#ebebeb] rounded-[6px] animate-pulse">
                <div className="bg-gray-100 h-48 rounded-t-[6px]" />
                <div className="p-4 space-y-3">
                  <div className="bg-gray-100 h-4 rounded w-3/4" />
                  <div className="bg-gray-100 h-4 rounded w-1/2" />
                  <div className="bg-gray-100 h-6 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-[#777]">
            <p className="text-lg">No hay productos destacados disponibles</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/tienda/${product.slug}`}
                className="group bg-white border border-[#ebebeb] rounded-[6px] overflow-hidden hover:shadow-md transition-shadow duration-200"
              >
                <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="object-contain h-full w-full p-4 group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-gray-300">
                      <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  {product.stock > 0 && product.stock <= 5 && (
                    <span className="absolute top-2 right-2 bg-orange-50 text-orange-600 text-xs font-medium px-2 py-0.5 rounded-[3px]">
                      &Uacute;ltimas unidades
                    </span>
                  )}
                  {product.stock === 0 && (
                    <span className="absolute top-2 right-2 bg-red-50 text-red-500 text-xs font-medium px-2 py-0.5 rounded-[3px]">
                      Agotado
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {product.manufacturer && (
                    <p className="text-xs text-[#777] uppercase tracking-wide mb-1">
                      {product.manufacturer.name}
                    </p>
                  )}
                  <h3 className="font-medium text-[#3a3a3a] line-clamp-2 text-sm group-hover:text-[#008060] transition-colors">
                    {product.name}
                  </h3>
                  {product.canonDigital > 0 && (
                    <p className="text-xs text-[#999] mt-1">
                      Canon digital: {formatPrice(product.canonDigital)}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-lg font-bold text-[#3a3a3a]">
                      {formatPrice(product.salePrice)}
                    </span>
                    {product.stock > 0 ? (
                      <span className="text-xs text-[#008060] font-medium">En stock</span>
                    ) : (
                      <span className="text-xs text-red-500 font-medium">Sin stock</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/tienda"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-[#008060] text-white font-semibold rounded-[3px] text-sm hover:bg-[#006e52] transition-colors"
          >
            Ver todos los productos
          </Link>
        </div>
      </div>
    </section>
  );
}
