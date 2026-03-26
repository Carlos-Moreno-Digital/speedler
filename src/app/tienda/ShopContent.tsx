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
        <h3 className="text-sm font-semibold uppercase tracking-[0.05em] mb-3" style={{ color: '#3a3a3a' }}>
          Categorías
        </h3>
        <ul className="space-y-0.5">
          <li>
            <button
              onClick={() => handleFilterChange('category', undefined)}
              className={`text-sm w-full text-left px-3 py-2 rounded transition-colors ${
                !currentFilters.category
                  ? 'font-semibold'
                  : 'hover:bg-gray-50'
              }`}
              style={{
                color: !currentFilters.category ? '#008060' : '#777',
              }}
            >
              Todas las categorías
            </button>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <button
                onClick={() => handleFilterChange('category', cat.slug)}
                className={`text-sm w-full text-left px-3 py-2 rounded transition-colors ${
                  currentFilters.category === cat.slug
                    ? 'font-semibold'
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  color: currentFilters.category === cat.slug ? '#008060' : '#777',
                }}
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
        <h3 className="text-sm font-semibold uppercase tracking-[0.05em] mb-3" style={{ color: '#3a3a3a' }}>
          Fabricantes
        </h3>
        <ul className="space-y-0.5 max-h-48 overflow-y-auto">
          <li>
            <button
              onClick={() => handleFilterChange('manufacturer', undefined)}
              className={`text-sm w-full text-left px-3 py-2 rounded transition-colors ${
                !currentFilters.manufacturer
                  ? 'font-semibold'
                  : 'hover:bg-gray-50'
              }`}
              style={{
                color: !currentFilters.manufacturer ? '#008060' : '#777',
              }}
            >
              Todos los fabricantes
            </button>
          </li>
          {manufacturers.map((m) => (
            <li key={m.id}>
              <button
                onClick={() => handleFilterChange('manufacturer', m.slug)}
                className={`text-sm w-full text-left px-3 py-2 rounded transition-colors ${
                  currentFilters.manufacturer === m.slug
                    ? 'font-semibold'
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  color: currentFilters.manufacturer === m.slug ? '#008060' : '#777',
                }}
              >
                {m.name}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.05em] mb-3" style={{ color: '#3a3a3a' }}>
          Precio
        </h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            defaultValue={currentFilters.minPrice || ''}
            className="w-full border border-[#ebebeb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#008060] transition-colors"
            style={{ color: '#3a3a3a' }}
            onBlur={(e) =>
              handleFilterChange('minPrice', e.target.value || undefined)
            }
          />
          <span style={{ color: '#777' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            defaultValue={currentFilters.maxPrice || ''}
            className="w-full border border-[#ebebeb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#008060] transition-colors"
            style={{ color: '#3a3a3a' }}
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
            className="w-4 h-4 rounded border-gray-300 accent-[#008060]"
          />
          <span className="text-sm" style={{ color: '#3a3a3a' }}>Solo en stock</span>
        </label>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="container-custom py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1" style={{ color: '#3a3a3a' }}>Tienda</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Desktop sidebar */}
          <aside className="hidden md:block md:col-span-1">
            <div className="bg-white border border-[#ebebeb] rounded-md p-5 sticky top-24">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile filter button */}
          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg text-white text-sm font-medium"
            style={{ backgroundColor: '#008060' }}
          >
            <FiFilter className="w-4 h-4" />
            Filtros
          </button>

          {/* Mobile filter drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-50 md:hidden">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setShowMobileFilters(false)}
              />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto animate-slide-in">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold" style={{ color: '#3a3a3a' }}>
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

          {/* Product grid + sorting + pagination */}
          <div className="md:col-span-3">
            {/* Sorting bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3 flex-1">
                <form onSubmit={handleSearch} className="relative flex-1 sm:max-w-xs">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#777' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full border border-[#ebebeb] rounded pl-10 pr-3 py-2 text-sm focus:outline-none focus:border-[#008060] transition-colors"
                    style={{ color: '#3a3a3a' }}
                  />
                </form>
                <p className="text-sm hidden sm:block" style={{ color: '#777' }}>
                  {total} resultado{total !== 1 ? 's' : ''}
                </p>
              </div>

              <select
                value={currentFilters.sortBy || 'newest'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="border border-[#ebebeb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#008060] transition-colors w-auto"
                style={{ color: '#3a3a3a' }}
              >
                <option value="newest">Más recientes</option>
                <option value="price_asc">Precio: menor a mayor</option>
                <option value="price_desc">Precio: mayor a menor</option>
                <option value="name">Nombre A-Z</option>
              </select>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-lg mb-4" style={{ color: '#777' }}>
                  No se encontraron productos
                </p>
                <Link
                  href="/tienda"
                  className="inline-block px-5 py-2 rounded text-sm font-medium text-white"
                  style={{ backgroundColor: '#008060' }}
                >
                  Ver todos los productos
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <Link
                      key={product.id}
                      href={`/tienda/${product.slug}`}
                      className="group bg-white border border-[#ebebeb] rounded-md overflow-hidden transition-shadow hover:shadow-md"
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
                          <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded">
                            Agotado
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        {product.manufacturer && (
                          <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#777' }}>
                            {product.manufacturer.name}
                          </p>
                        )}
                        <h3
                          className="font-medium text-sm line-clamp-2 group-hover:text-[#008060] transition-colors"
                          style={{ color: '#3a3a3a' }}
                        >
                          {product.name}
                        </h3>
                        {product.canonDigital > 0 && (
                          <p className="text-xs mt-1" style={{ color: '#777' }}>
                            Canon digital: {formatPrice(product.canonDigital)}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-between">
                          <span className="text-lg font-bold" style={{ color: '#3a3a3a' }}>
                            {formatPrice(product.salePrice)}
                          </span>
                          {product.stock > 0 ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
                              En stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block"></span>
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
                      className={`p-2 rounded border ${
                        page <= 1
                          ? 'opacity-50 pointer-events-none border-[#ebebeb]'
                          : 'border-[#ebebeb] hover:border-[#008060] transition-colors'
                      }`}
                    >
                      <FiChevronLeft className="w-5 h-5" style={{ color: '#3a3a3a' }} />
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
                            <span className="px-2" style={{ color: '#777' }}>...</span>
                          )}
                          <Link
                            href={buildUrl({ page: String(p) })}
                            className={`w-10 h-10 inline-flex items-center justify-center rounded text-sm border transition-colors ${
                              p === page
                                ? 'text-white font-bold border-[#008060]'
                                : 'border-[#ebebeb] hover:border-[#008060]'
                            }`}
                            style={
                              p === page
                                ? { backgroundColor: '#008060', color: '#fff' }
                                : { color: '#3a3a3a' }
                            }
                          >
                            {p}
                          </Link>
                        </span>
                      ))}

                    <Link
                      href={buildUrl({
                        page: String(Math.min(totalPages, page + 1)),
                      })}
                      className={`p-2 rounded border ${
                        page >= totalPages
                          ? 'opacity-50 pointer-events-none border-[#ebebeb]'
                          : 'border-[#ebebeb] hover:border-[#008060] transition-colors'
                      }`}
                    >
                      <FiChevronRight className="w-5 h-5" style={{ color: '#3a3a3a' }} />
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
