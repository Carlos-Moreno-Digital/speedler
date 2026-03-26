'use client';

import { useState, useEffect } from 'react';
import ComponentSelector from './ComponentSelector';
import BuildSummary from './BuildSummary';
import CompatibilityChecker from './CompatibilityChecker';
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

interface ComponentTypeData {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  isRequired: boolean;
  products: Product[];
}

interface Selection {
  componentTypeSlug: string;
  productId: string;
  product: Product;
}

export default function PcConfigurator() {
  const [componentTypes, setComponentTypes] = useState<ComponentTypeData[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [issues, setIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    fetch('/api/configurator')
      .then((res) => res.json())
      .then((data) => {
        setComponentTypes(data);
        setLoading(false);
      });
  }, []);

  async function handleSelect(componentTypeSlug: string, product: Product) {
    const newSelections = [
      ...selections.filter((s) => s.componentTypeSlug !== componentTypeSlug),
      { componentTypeSlug, productId: product.id, product },
    ];
    setSelections(newSelections);

    // Validate compatibility
    if (newSelections.length >= 2) {
      setValidating(true);
      try {
        const res = await fetch('/api/configurator/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            components: newSelections.map((s) => ({
              componentTypeSlug: s.componentTypeSlug,
              productId: s.productId,
            })),
          }),
        });
        const data = await res.json();
        setIssues(data.issues || []);
      } catch {
        // Skip validation errors
      }
      setValidating(false);
    }
  }

  function handleRemove(componentTypeSlug: string) {
    setSelections(selections.filter((s) => s.componentTypeSlug !== componentTypeSlug));
    setIssues([]);
  }

  const totalPrice = selections.reduce(
    (sum, s) => sum + Number(s.product.salePrice),
    0
  );
  const totalCanonDigital = selections.reduce(
    (sum, s) => sum + Number(s.product.canonDigital),
    0
  );

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">
        Cargando configurador...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        {componentTypes.map((ct) => {
          const selected = selections.find(
            (s) => s.componentTypeSlug === ct.slug
          );

          return (
            <ComponentSelector
              key={ct.id}
              componentType={ct}
              selectedProduct={selected?.product || null}
              onSelect={(product) => handleSelect(ct.slug, product)}
              onRemove={() => handleRemove(ct.slug)}
            />
          );
        })}
      </div>

      <div className="space-y-4">
        <CompatibilityChecker issues={issues} validating={validating} />
        <BuildSummary
          selections={selections}
          totalPrice={totalPrice}
          totalCanonDigital={totalCanonDigital}
        />
      </div>
    </div>
  );
}
