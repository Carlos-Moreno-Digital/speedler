'use client';

import { useState, useEffect } from 'react';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  costPrice: number;
  stock: number;
  canonDigital: number;
  isActive: boolean;
  category: { name: string } | null;
  manufacturer: { name: string } | null;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [page, search]);

  async function fetchProducts() {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      pageSize: '20',
      ...(search && { search }),
    });

    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setTotalPages(data.pagination?.totalPages || 1);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-brand-brown-dark">Productos</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input-field w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-gray-500">
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Coste</th>
                <th className="px-4 py-3">PVP</th>
                <th className="px-4 py-3">Canon</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400">
                    Cargando...
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                    <td className="px-4 py-3 max-w-xs truncate">{product.name}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {product.category?.name || '-'}
                    </td>
                    <td className="px-4 py-3">{formatPrice(Number(product.costPrice))}</td>
                    <td className="px-4 py-3 font-medium">
                      {formatPrice(Number(product.salePrice))}
                    </td>
                    <td className="px-4 py-3">
                      {Number(product.canonDigital) > 0
                        ? formatPrice(Number(product.canonDigital))
                        : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-medium ${
                          product.stock > 0 ? 'text-green-600' : 'text-red-500'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex justify-between items-center px-4 py-3 border-t bg-gray-50">
          <p className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="btn-secondary btn-sm disabled:opacity-50"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
