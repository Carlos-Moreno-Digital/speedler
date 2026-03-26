'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import { FiSearch, FiFilter, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Product {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  salePrice: number;
  costPrice: number;
  canonDigital: number;
  stock: number;
  manufacturer: { name: string } | null;
  category: { name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface Manufacturer {
  id: string;
  name: string;
  slug: string;
}

interface ShopContentProps {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  categories: Category[];
  manufacturers: Manufacturer[];
  currentFilters: Record<string, string | undefined>;
}

export default function ShopContent({
  products,
  total,
  page,
  totalPages,
  categories,
  manufacturers,
  currentFilters,
}: ShopContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentFilters.search || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  function buildUrl(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const merged = { ...currentFilters, ...params };
    Object.entries(merged).forEach(([key, value]) => {
      if (value && value !== '') sp.set(key, value);
    });
    return `/tienda?${sp.toString()}`;
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ search: search || undefined, page: '1' }));
  }

  function handleFilterChange(key: string, value: string | undefined) {
    router.push(buildUrl({ [key]: value, page: '1' }));
  }

  const Sidebar = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-brand-brown-dark mb-3">Categorías</h3>
        <ul className="space-y-1">
          <li>
            <button
              onClick={() => handleFilterChange('category', undefined)}
              className={`text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                !currentFilters.category
                  ? 'bg-brand-orange text-white'
                  : 'text-gray-600 hover:bg-brand-cream'
              }`}
            >
              Todas las categorías
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => handleFilterChange('category', cat.slug)}
                className={`text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                  currentFilters.category === cat.slug
                    ? 'bg-brand-orange text-white'
                    : 'text-gray-600 hover:bg-brand-cream'
                }`}
              >
                {cat.name}
                <span className="text-xs opacity-60 ml-1">
                  ({cat._count.products})
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Manufacturers */}
      <div>
        <h3 className="font-semibold text-brand-brown-dark mb-3">Fabricantes</h3>
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          <li>
            <button
              onClick={() => handleFilterChange('manufacturer', undefined)}
              className={`text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                !currentFilters.manufacturer
                  ? 'bg-brand-orange text-white'
                  : 'text-gray-600 hover:bg-brand-cream'
              }`}
            >
              Todos los fabricantes
            </button>
          </li>
          {manufacturers.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => handleFilterChange('manufacturer', m.slug)}
                className={`text-sm w-full text-left px-3 py-1.5 rounded-lg transition-colors ${
                  currentFilters.manufacturer === m.slug
                    ? 'bg-brand-orange text-white'
                    : 'text-gray-600 hover:bg-brand-cream'
                }`}
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price range */}
      <div>
        <h3 className="font-semibold text-brand-brown-dark mb-3">Precio</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            defaultValue={currentFilters.minPrice || ''}
            className="input-field text-sm py-2"
            onBlur={(e) =>
              handleFilterChange('minPrice', e.target.value || undefined)
            }
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={currentFilters.maxPrice || ''}
            className="input-field text-sm py-2"
            onBlur={(e) =>
              handleFilterChange('maxPrice', e.target.value || undefined)
            }
          />
        </div>
      </div>

      {/* In stock */}
      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={currentFilters.inStock === 'true'}
            onChange={(e) =>
              handleFilterChange(
                'inStock',
                e.target.checked ? 'true' : undefined
              )
            }
            className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
          />
          <span className="text-sm text-gray-700">Solo en stock</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-brand-brown-dark">Tienda</h1>
            <p className="text-gray-500 mt-1">
              {total} producto{total !== 1 ? 's' : ''} encontrado
              {total !== 1 ? 's' : ''}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="input-field pl-10 text-sm py-2"
              />
            </form>

            {/* Sort */}
            <select
              value={currentFilters.sortBy || 'newest'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="input-field text-sm py-2 w-auto"
            >
              <option value="newest">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              <option value="name">Nombre A-Z</option>
            </select>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden btn-secondary btn-sm"
            >
              <FiFilter className="w-4 h-4" />
              Filtros
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="card p-6 sticky top-24">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto animate-slide-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-brand-brown-dark">
                    Filtros
                  </h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>
                <Sidebar />
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg text-gray-500 mb-4">
                  No se encontraron productos
                </p>
                <Link href="/tienda" className="btn-primary btn-sm">
                  Ver todos los productos
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/tienda/${product.slug}`}
                      className="card group overflow-hidden"
                    >
                      <div className="relative bg-gray-50 h-48 flex items-center justify-center overflow-hidden">
                        {product.image ? (
                          <img
                            src={product.image}
                            alt={product.name}
                            className="object-contain h-full w-full p-4 group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="text-gray-300">
                            <svg
                              className="w-16 h-16"
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
                          </div>
                        )}
                        {product.stock === 0 && (
                          <span className="absolute top-2 right-2 badge-red text-xs">
                            Agotado
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {product.manufacturer && (
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            {product.manufacturer.name}
                          </p>
                        )}
                        <h3 className="font-medium text-gray-800 line-clamp-2 text-sm group-hover:text-brand-orange transition-colors">
                          {product.name}
                        </h3>
                        {product.canonDigital > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Canon digital: {formatPrice(product.canonDigital)}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-bold text-brand-orange">
                            {formatPrice(product.salePrice)}
                          </span>
                          {product.stock > 0 ? (
                            <span className="text-xs text-green-600 font-medium">
                              En stock
                            </span>
                          ) : (
                            <span className="text-xs text-red-500 font-medium">
                              Sin stock
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-10">
                    <Link
                      href={buildUrl({
                        page: String(Math.max(1, page - 1)),
                      })}
                      className={`p-2 rounded-lg border ${
                        page <= 1
                          ? 'opacity-50 pointer-events-none border-gray-200'
                          : 'border-gray-300 hover:bg-brand-cream'
                      }`}
                    >
                      <FiChevronLeft className="w-5 h-5" />
                    </Link>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 2
                      )
                      .map((p, idx, arr) => (
                        <span key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Link
                            href={buildUrl({ page: String(p) })}
                            className={`w-10 h-10 inline-flex items-center justify-center rounded-lg text-sm font-medium ${
                              p === page
                                ? 'bg-brand-orange text-white'
                                : 'border border-gray-300 hover:bg-brand-cream'
                            }`}
                          >
                            {p}
                          </Link>
                        </span>
                      ))}

                    <Link
                      href={buildUrl({
                        page: String(Math.min(totalPages, page + 1)),
                      })}
                      className={`p-2 rounded-lg border ${
                        page >= totalPages
                          ? 'opacity-50 pointer-events-none border-gray-200'
                          : 'border-gray-300 hover:bg-brand-cream'
                      }`}
                    >
                      <FiChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
