'use client';

import { useState } from 'react';
import { formatPrice } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  salePrice: number;
  canonDigital: number;
  stock: number;
  image: string | null;
  manufacturer: { name: string } | null;
}

interface ComponentSelectorProps {
  componentType: {
    id: string;
    name: string;
    slug: string;
    isRequired: boolean;
    products: Product[];
  };
  selectedProduct: Product | null;
  onSelect: (product: Product) => void;
  onRemove: () => void;
}

export default function ComponentSelector({
  componentType,
  selectedProduct,
  onSelect,
  onRemove,
}: ComponentSelectorProps) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const filteredProducts = componentType.products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
              selectedProduct ? 'bg-green-500' : 'bg-brand-orange'
            }`}
          >
            {selectedProduct ? '✓' : componentType.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-bold text-brand-brown-dark">
              {componentType.name}
              {componentType.isRequired && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h3>
            {selectedProduct ? (
              <p className="text-sm text-gray-600">{selectedProduct.name}</p>
            ) : (
              <p className="text-sm text-gray-400">Sin seleccionar</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {selectedProduct && (
            <span className="font-bold text-brand-orange">
              {formatPrice(Number(selectedProduct.salePrice))}
            </span>
          )}
          <span className="text-gray-400">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="border-t p-4">
          {selectedProduct && (
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg mb-4">
              <span className="text-sm font-medium text-green-800">
                Seleccionado: {selectedProduct.name}
              </span>
              <button
                onClick={() => {
                  onRemove();
                  setExpanded(false);
                }}
                className="text-red-500 text-sm hover:text-red-700"
              >
                Quitar
              </button>
            </div>
          )}

          <input
            type="text"
            placeholder={`Buscar ${componentType.name.toLowerCase()}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field mb-3"
          />

          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredProducts.length === 0 ? (
              <p className="text-center text-gray-400 py-4">
                No hay productos disponibles en esta categoría
              </p>
            ) : (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id
                      ? 'border-brand-orange bg-brand-cream/30'
                      : 'border-gray-200 hover:border-brand-peach'
                  }`}
                  onClick={() => {
                    onSelect(product);
                    setExpanded(false);
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-brown-dark truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {product.manufacturer?.name || 'Sin fabricante'}
                      {product.stock <= 0 && (
                        <span className="text-red-500 ml-2">Agotado</span>
                      )}
                    </p>
                  </div>
                  <span className="font-bold text-brand-orange ml-3 whitespace-nowrap">
                    {formatPrice(Number(product.salePrice))}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
