import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Blog de Speedler. Próximamente artículos sobre tecnología, guías de compra, análisis de hardware, tutoriales y las últimas novedades del sector informático.',
};

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        <section className="bg-[#3a3a3a] py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-bold text-white">Blog</h1>
            <p className="text-gray-200 mt-2">
              Noticias, guías y análisis del mundo de la tecnología
            </p>
          </div>
        </section>

        <section className="container-custom py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="card p-10 sm:p-14">
              <div className="w-20 h-20 bg-[#008060]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-[#008060]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-[#3a3a3a] mb-4">
                Próximamente
              </h2>
              <p className="text-gray-600 mb-6">
                Estamos preparando contenido de calidad para ti. Muy pronto
                encontrarás aquí guías de compra detalladas, análisis de los
                últimos componentes, tutoriales de montaje de PC, comparativas
                de hardware y las novedades más importantes del sector
                tecnológico.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-[#008060]/5 rounded-xl p-4">
                  <div className="text-sm font-semibold text-[#3a3a3a]">
                    Guías de Compra
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Comparativas y recomendaciones
                  </div>
                </div>
                <div className="bg-[#008060]/5 rounded-xl p-4">
                  <div className="text-sm font-semibold text-[#3a3a3a]">
                    Tutoriales
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Montaje, overclocking y más
                  </div>
                </div>
                <div className="bg-[#008060]/5 rounded-xl p-4">
                  <div className="text-sm font-semibold text-[#3a3a3a]">
                    Noticias
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Lanzamientos y novedades
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-400">
                ¿Quieres ser el primero en enterarte? Suscríbete a nuestro
                newsletter en la{' '}
                <a
                  href="/"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  página principal
                </a>
                .
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
