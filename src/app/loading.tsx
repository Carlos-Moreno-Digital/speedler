export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div
        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: '#E88B2D', borderTopColor: 'transparent' }}
      />
      <p
        className="mt-4 text-lg font-medium animate-pulse"
        style={{ color: '#5B2C0E' }}
      >
        Cargando...
      </p>
    </div>
  );
}
