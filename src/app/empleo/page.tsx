import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Empleo',
  description:
    'Trabaja en Speedler. Únete a nuestro equipo y forma parte de una empresa líder en el sector de la informática y la tecnología.',
};

export default function EmpleoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        <section className="bg-[#3a3a3a] py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-bold text-white">Empleo</h1>
            <p className="text-gray-200 mt-2">
              Únete al equipo de Speedler
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
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-[#3a3a3a] mb-4">
                Estamos Creciendo
              </h2>
              <p className="text-gray-600 mb-6">
                En Speedler estamos en pleno crecimiento y buscamos personas
                apasionadas por la tecnología que quieran formar parte de nuestro
                equipo. Próximamente publicaremos nuestras ofertas de empleo
                activas.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="bg-[#008060]/5 rounded-xl p-5 text-left">
                  <div className="text-sm font-semibold text-[#3a3a3a] mb-1">
                    Ambiente Tecnológico
                  </div>
                  <div className="text-xs text-gray-500">
                    Trabaja rodeado de las últimas novedades en hardware y
                    tecnología.
                  </div>
                </div>
                <div className="bg-[#008060]/5 rounded-xl p-5 text-left">
                  <div className="text-sm font-semibold text-[#3a3a3a] mb-1">
                    Crecimiento Profesional
                  </div>
                  <div className="text-xs text-gray-500">
                    Formación continua y oportunidades de desarrollo dentro de
                    la empresa.
                  </div>
                </div>
                <div className="bg-[#008060]/5 rounded-xl p-5 text-left">
                  <div className="text-sm font-semibold text-[#3a3a3a] mb-1">
                    Equipo Dinámico
                  </div>
                  <div className="text-xs text-gray-500">
                    Un equipo joven y motivado con pasión por lo que hace.
                  </div>
                </div>
                <div className="bg-[#008060]/5 rounded-xl p-5 text-left">
                  <div className="text-sm font-semibold text-[#3a3a3a] mb-1">
                    Flexibilidad
                  </div>
                  <div className="text-xs text-gray-500">
                    Horarios flexibles y posibilidad de trabajo remoto en algunos
                    puestos.
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-bold text-[#3a3a3a] mb-2">
                  ¿Te interesa trabajar con nosotros?
                </h3>
                <p className="text-sm text-gray-600">
                  Aunque no tengamos ofertas publicadas actualmente, siempre
                  estamos abiertos a conocer talento. Envíanos tu CV a:
                </p>
                <a
                  href="mailto:empleo@speedler.es"
                  className="inline-block mt-3 text-[#008060] hover:text-[#006e52] font-semibold underline"
                >
                  empleo@speedler.es
                </a>
              </div>

              <p className="text-sm text-gray-400">
                Síguenos en redes sociales para estar al tanto de las nuevas
                oportunidades.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
