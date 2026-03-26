'use client';

import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-6"
          style={{ backgroundColor: '#FEF3E2' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#008060"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: '#3a3a3a' }}
        >
          Algo salio mal
        </h1>
        <p className="text-gray-600 mb-8 max-w-md">
          Ha ocurrido un error inesperado. Por favor, intenta de nuevo.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: '#008060' }}
        >
          Intentar de nuevo
        </button>
      </main>
      <Footer />
    </>
  );
}
