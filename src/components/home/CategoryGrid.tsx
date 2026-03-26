'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  _count?: { products: number };
}

const FALLBACK_CATEGORIES = [
  { slug: 'procesadores', name: 'Procesadores' },
  { slug: 'tarjetas-graficas', name: 'Tarjetas Gr\u00e1ficas' },
  { slug: 'placas-base', name: 'Placas Base' },
  { slug: 'memoria-ram', name: 'Memoria RAM' },
  { slug: 'almacenamiento', name: 'Almacenamiento' },
  { slug: 'fuentes-alimentacion', name: 'Fuentes de Alimentaci\u00f3n' },
  { slug: 'cajas-torres', name: 'Cajas / Torres' },
  { slug: 'portatiles', name: 'Port\u00e1tiles' },
  { slug: 'monitores', name: 'Monitores' },
  { slug: 'perifericos', name: 'Perif\u00e9ricos' },
  { slug: 'redes', name: 'Redes' },
  { slug: 'impresoras', name: 'Impresoras' },
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setCategories(data.slice(0, 12));
          }
        }
      } catch {
        // Use fallback categories
      } finally {
        setLoaded(true);
      }
    }
    fetchCategories();
  }, []);

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3a3a3a]">
            Compra por categor&iacute;a
          </h2>
          <p className="mt-2 text-[#777] text-sm">
            Encuentra lo que necesitas navegando por nuestras categor&iacute;as
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(categories.length > 0 ? categories : FALLBACK_CATEGORIES).map(
            (cat: any) => (
              <Link
                key={cat.slug}
                href={`/tienda?category=${cat.slug}`}
                className="group bg-white border border-[#ebebeb] rounded-[6px] p-5 text-center hover:border-[#008060] hover:shadow-sm transition-all duration-200"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-[6px] flex items-center justify-center group-hover:bg-[#008060]/5 transition-colors">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-7 h-7 object-contain"
                    />
                  ) : (
                    <svg
                      className="w-6 h-6 text-[#999] group-hover:text-[#008060] transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  )}
                </div>
                <h3 className="text-sm font-medium text-[#3a3a3a] group-hover:text-[#008060] transition-colors">
                  {cat.name}
                </h3>
                {'_count' in cat && cat._count && (
                  <p className="text-xs text-[#999] mt-1">
                    {cat._count.products} productos
                  </p>
                )}
              </Link>
            )
          )}
        </div>
      </div>
    </section>
  );
}
