'use client';

import { useState, useCallback } from 'react';
import { cn, formatPrice } from '@/lib/utils';
import Button from '@/components/ui/Button';
import { FiChevronDown, FiX, FiFilter } from 'react-icons/fi';

interface Category {
  name: string;
  slug: string;
  count?: number;
}

interface Manufacturer {
  name: string;
  slug: string;
  count?: number;
}

interface FilterValues {
  category?: string;
  manufacturer?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

interface ProductFiltersProps {
  categories: Category[];
  manufacturers: Manufacturer[];
  priceRange: { min: number; max: number };
  values: FilterValues;
  onChange: (filters: FilterValues) => void;
  onReset?: () => void;
  className?: string;
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-brand-brown-dark"
      >
        {title}
        <FiChevronDown
          className={cn(
            'h-4 w-4 text-gray-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function ProductFilters({
  categories,
  manufacturers,
  priceRange,
  values,
  onChange,
  onReset,
  className,
}: ProductFiltersProps) {
  const [localMin, setLocalMin] = useState<string>(
    values.minPrice?.toString() ?? '',
  );
  const [localMax, setLocalMax] = useState<string>(
    values.maxPrice?.toString() ?? '',
  );

  const activeFilterCount = [
    values.category,
    values.manufacturer,
    values.minPrice,
    values.maxPrice,
    values.inStock,
  ].filter(Boolean).length;

  const updateFilter = useCallback(
    (key: keyof FilterValues, value: FilterValues[keyof FilterValues]) => {
      onChange({ ...values, [key]: value });
    },
    [values, onChange],
  );

  const handlePriceApply = () => {
    const min = localMin ? parseFloat(localMin) : undefined;
    const max = localMax ? parseFloat(localMax) : undefined;
    onChange({ ...values, minPrice: min, maxPrice: max });
  };

  return (
    <aside className={cn('rounded-xl border border-gray-200 bg-white', className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <FiFilter className="h-4 w-4 text-brand-orange" />
          <h2 className="text-sm font-semibold text-brand-brown-dark">Filtros</h2>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && onReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-brand-orange hover:text-brand-orange-deep transition-colors"
          >
            <FiX className="h-3 w-3" />
            Limpiar
          </button>
        )}
      </div>

      <div className="px-4">
        {/* Categories */}
        <FilterSection title="Categorías">
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {categories.map((cat) => (
              <button
                key={cat.slug}
                onClick={() =>
                  updateFilter(
                    'category',
                    values.category === cat.slug ? undefined : cat.slug,
                  )
                }
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                  values.category === cat.slug
                    ? 'bg-brand-orange/10 font-medium text-brand-orange-deep'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-brand-brown-dark',
                )}
              >
                <span>{cat.name}</span>
                {cat.count !== undefined && (
                  <span className="text-xs text-gray-400">{cat.count}</span>
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Manufacturers */}
        <FilterSection title="Fabricantes">
          <div className="max-h-48 space-y-1 overflow-y-auto">
            {manufacturers.map((mfr) => (
              <button
                key={mfr.slug}
                onClick={() =>
                  updateFilter(
                    'manufacturer',
                    values.manufacturer === mfr.slug ? undefined : mfr.slug,
                  )
                }
                className={cn(
                  'flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition-colors',
                  values.manufacturer === mfr.slug
                    ? 'bg-brand-orange/10 font-medium text-brand-orange-deep'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-brand-brown-dark',
                )}
              >
                <span>{mfr.name}</span>
                {mfr.count !== undefined && (
                  <span className="text-xs text-gray-400">{mfr.count}</span>
                )}
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Price range */}
        <FilterSection title="Precio">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={localMin}
                  onChange={(e) => setLocalMin(e.target.value)}
                  placeholder={formatPrice(priceRange.min)}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                />
              </div>
              <span className="text-sm text-gray-400">-</span>
              <div className="relative flex-1">
                <input
                  type="number"
                  value={localMax}
                  onChange={(e) => setLocalMax(e.target.value)}
                  placeholder={formatPrice(priceRange.max)}
                  min={0}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
                />
              </div>
            </div>

            {/* Price range slider */}
            <input
              type="range"
              min={priceRange.min}
              max={priceRange.max}
              step={10}
              value={localMax || priceRange.max}
              onChange={(e) => setLocalMax(e.target.value)}
              className="w-full accent-brand-orange"
            />
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>{formatPrice(priceRange.min)}</span>
              <span>{formatPrice(priceRange.max)}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handlePriceApply}
              className="w-full"
            >
              Aplicar precio
            </Button>
          </div>
        </FilterSection>

        {/* In stock toggle */}
        <FilterSection title="Disponibilidad" defaultOpen={false}>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2 hover:bg-gray-50 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={values.inStock ?? false}
                onChange={(e) => updateFilter('inStock', e.target.checked || undefined)}
                className="peer sr-only"
              />
              <div className="h-5 w-9 rounded-full bg-gray-200 transition-colors peer-checked:bg-brand-orange" />
              <div className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
            </div>
            <span className="text-sm text-gray-600">Solo disponibles</span>
          </label>
        </FilterSection>
      </div>
    </aside>
  );
}
