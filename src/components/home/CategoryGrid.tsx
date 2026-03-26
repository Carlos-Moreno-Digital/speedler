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
  { slug: 'procesadores', name: 'Procesadores', icon: '⚡' },
  { slug: 'tarjetas-graficas', name: 'Tarjetas Gr\u00e1ficas', icon: '🎮' },
  { slug: 'placas-base', name: 'Placas Base', icon: '🔧' },
  { slug: 'memoria-ram', name: 'Memoria RAM', icon: '💾' },
  { slug: 'almacenamiento', name: 'Almacenamiento', icon: '💿' },
  { slug: 'fuentes-alimentacion', name: 'Fuentes de Alimentaci\u00f3n', icon: '🔌' },
  { slug: 'cajas-torres', name: 'Cajas / Torres', icon: '🖥️' },
  { slug: 'portatiles', name: 'Port\u00e1tiles', icon: '💻' },
  { slug: 'monitores', name: 'Monitores', icon: '🖥️' },
  { slug: 'perifericos', name: 'Perif\u00e9ricos', icon: '🖱️' },
  { slug: 'redes', name: 'Redes', icon: '🌐' },
  { slug: 'impresoras', name: 'Impresoras', icon: '🖨️' },
];

export default function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/products?type=categories');
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
    <section className="py-16 bg-bg-alt">
      <div className="container-custom">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-brand-brown-dark">
            Compra por categor&iacute;a
          </h2>
          <p className="mt-2 text-gray-600">
            Encuentra lo que necesitas navegando por nuestras categor&iacute;as
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {(categories.length > 0 ? categories : FALLBACK_CATEGORIES).map(
            (cat: any) => (
              <Link
                key={cat.slug}
                href={`/tienda?category=${cat.slug}`}
                className="group bg-white rounded-xl p-6 text-center hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-brand-orange/30"
              >
                <div className="w-14 h-14 mx-auto mb-3 bg-brand-cream/50 rounded-xl flex items-center justify-center group-hover:bg-brand-orange/10 transition-colors">
                  {'icon' in cat ? (
                    <span className="text-2xl">{(cat as { icon: string }).icon}</span>
                  ) : cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <svg
                      className="w-7 h-7 text-brand-orange"
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
                <h3 className="text-sm font-semibold text-gray-700 group-hover:text-brand-orange transition-colors">
                  {cat.name}
                </h3>
                {'_count' in cat && cat._count && (
                  <p className="text-xs text-gray-400 mt-1">
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
