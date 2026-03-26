'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <h1
          className="text-8xl font-extrabold mb-4"
          style={{ color: '#008060' }}
        >
          404
        </h1>
        <h2
          className="text-2xl font-bold mb-2"
          style={{ color: '#3a3a3a' }}
        >
          Pagina no encontrada
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Lo sentimos, la pagina que buscas no existe o ha sido movida.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-lg font-semibold text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: '#008060' }}
          >
            Volver al inicio
          </Link>
          <Link
            href="/tienda"
            className="inline-block px-6 py-3 rounded-lg font-semibold border-2 transition-colors hover:opacity-90"
            style={{ borderColor: '#3a3a3a', color: '#3a3a3a' }}
          >
            Ir a la tienda
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
