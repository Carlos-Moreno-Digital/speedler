export default function TiendaLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header skeleton */}
      <div
        className="h-8 w-48 rounded-md mb-8 animate-pulse"
        style={{ backgroundColor: '#F5DCC0' }}
      />

      {/* Product grid skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl overflow-hidden border border-gray-200 bg-white"
          >
            {/* Image skeleton */}
            <div
              className="w-full h-48 animate-pulse"
              style={{ backgroundColor: '#F5DCC0' }}
            />
            {/* Content skeleton */}
            <div className="p-4 space-y-3">
              <div
                className="h-4 w-3/4 rounded animate-pulse"
                style={{ backgroundColor: '#F5DCC0' }}
              />
              <div
                className="h-4 w-1/2 rounded animate-pulse"
                style={{ backgroundColor: '#F5DCC0' }}
              />
              <div
                className="h-6 w-1/3 rounded animate-pulse"
                style={{ backgroundColor: '#E88B2D', opacity: 0.3 }}
              />
              <div
                className="h-10 w-full rounded-lg animate-pulse"
                style={{ backgroundColor: '#E88B2D', opacity: 0.2 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
