import { cn } from '@/lib/utils';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  canonDigital?: number;
  stock: number;
  category?: string;
  manufacturer?: string;
  isOffer?: boolean;
  offerPrice?: number;
}

interface ProductGridProps {
  products: Product[];
  onAddToCart?: (productId: string) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function ProductGridSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <div className="aspect-square bg-gray-100" />
          <div className="p-4 space-y-3">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="space-y-1.5">
              <div className="h-4 rounded bg-gray-100" />
              <div className="h-4 w-3/4 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-24 rounded bg-gray-100" />
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="h-9 rounded-lg bg-gray-100" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function ProductGrid({
  products,
  onAddToCart,
  loading = false,
  emptyMessage = 'No se encontraron productos.',
  className,
}: ProductGridProps) {
  if (!loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-bg-alt px-6 py-16 text-center">
        <svg
          className="mb-4 h-12 w-12 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500">{emptyMessage}</p>
        <p className="mt-1 text-sm text-gray-400">
          Prueba a cambiar los filtros o buscar algo diferente.
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
        className,
      )}
    >
      {loading ? (
        <ProductGridSkeleton />
      ) : (
        products.map((product) => (
          <ProductCard
            key={product.id}
            {...product}
            onAddToCart={onAddToCart}
          />
        ))
      )}
    </div>
  );
}
