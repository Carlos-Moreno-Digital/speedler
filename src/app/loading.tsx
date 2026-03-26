export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div
        className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: '#008060', borderTopColor: 'transparent' }}
      />
      <p
        className="mt-4 text-lg font-medium animate-pulse"
        style={{ color: '#3a3a3a' }}
      >
        Cargando...
      </p>
    </div>
  );
}
