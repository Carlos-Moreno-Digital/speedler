import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description:
    'Política de cookies de Speedler. Información sobre el uso de cookies en nuestro sitio web, tipos de cookies y cómo gestionarlas.',
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        <section className="bg-gradient-to-br from-brand-brown-dark to-brand-brown py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-bold text-white">
              Política de Cookies
            </h1>
            <p className="text-brand-cream mt-2">
              Última actualización: marzo 2026
            </p>
          </div>
        </section>

        <section className="container-custom py-12">
          <div className="max-w-3xl mx-auto card p-8 sm:p-10 space-y-8 text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-brand-brown-dark mb-3">
                1. ¿Qué son las Cookies?
              </h2>
              <p>
                Las cookies son pequeños archivos de texto que los sitios web
                almacenan en tu dispositivo (ordenador, tablet o móvil) cuando
                los visitas. Sirven para recordar tus preferencias, mejorar tu
                experiencia de navegación y recopilar información analítica sobre
                el uso del sitio.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-brand-brown-dark mb-3">
                2. ¿Qué Cookies Utilizamos?
              </h2>
              <p className="mb-4">
                En Speedler utilizamos los siguientes tipos de cookies:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-brand-orange/10">
                      <th className="text-left p-3 font-semibold text-brand-brown-dark border border-gray-200">Cookie</th>
                      <th className="text-left p-3 font-semibold text-brand-brown-dark border border-gray-200">Tipo</th>
                      <th className="text-left p-3 font-semibold text-brand-brown-dark border border-gray-200">Finalidad</th>
                      <th className="text-left p-3 font-semibold text-brand-brown-dark border border-gray-200">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-3 border border-gray-200">session_id</td>
                      <td className="p-3 border border-gray-200">Técnica</td>
                      <td className="p-3 border border-gray-200">Gestión de la sesión del usuario</td>
                      <td className="p-3 border border-gray-200">Sesión</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">cart_token</td>
                      <td className="p-3 border border-gray-200">Técnica</td>
                      <td className="p-3 border border-gray-200">Mantener el carrito de compras</td>
                      <td className="p-3 border border-gray-200">30 días</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">cookie_consent</td>
                      <td className="p-3 border border-gray-200">Técnica</td>
                      <td className="p-3 border border-gray-200">Almacenar tus preferencias de cookies</td>
                      <td className="p-3 border border-gray-200">1 año</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="p-3 border border-gray-200">_ga, _gid</td>
                      <td className="p-3 border border-gray-200">Analítica</td>
                      <td className="p-3 border border-gray-200">Google Analytics: análisis de uso del sitio</td>
                      <td className="p-3 border border-gray-200">2 años / 24h</td>
                    </tr>
                    <tr>
                      <td className="p-3 border border-gray-200">_fbp</td>
                      <td className="p-3 border border-gray-200">Publicitaria</td>
                      <td className="p-3 border border-gray-200">Meta Pixel: medición de campañas publicitarias</td>
                      <td className="p-3 border border-gray-200">3 meses</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-brand-brown-dark mb-3">
                3. Tipos de Cookies según su Finalidad
              </h2>
              <div className="space-y-4 mt-3">
                <div>
                  <h3 className="font-semibold text-brand-brown-dark">
                    Cookies técnicas (necesarias)
                  </h3>
                  <p className="text-sm mt-1">
                    Son imprescindibles para el funcionamiento del sitio web.
                    Permiten navegar y usar funciones básicas como el carrito de
                    compras, el inicio de sesión y la seguridad. No requieren
                    consentimiento.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-brown-dark">
                    Cookies de preferencias
                  </h3>
                  <p className="text-sm mt-1">
                    Permiten recordar tus preferencias como el idioma, la moneda
                    o la configuración regional para personalizar tu experiencia.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-brown-dark">
                    Cookies analíticas
                  </h3>
                  <p className="text-sm mt-1">
                    Nos ayudan a entender cómo interactúan los visitantes con el
                    sitio, qué páginas son las más visitadas y detectar posibles
                    problemas de navegación. Utilizamos Google Analytics con
                    anonimización de IP.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-brown-dark">
                    Cookies publicitarias
                  </h3>
                  <p className="text-sm mt-1">
                    Se utilizan para mostrar anuncios relevantes y medir la
                    eficacia de las campañas publicitarias. Solo se instalan con
                    tu consentimiento expreso.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-bold text-brand-brown-dark mb-3">
                4. ¿Cómo Gestionar las Cookies?
              </h2>
              <p>
                Puedes gestionar tus preferencias de cookies en cualquier momento
                a través del panel de configuración de cookies de nuestro sitio
                web. Además, puedes configurar tu navegador para bloquear o
                eliminar cookies:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li>
                  <strong>Chrome:</strong> Configuración &gt; Privacidad y seguridad &gt; Cookies
                </li>
                <li>
                  <strong>Firefox:</strong> Ajustes &gt; Privacidad y seguridad &gt; Cookies
                </li>
                <li>
                  <strong>Safari:</strong> Preferencias &gt; Privacidad &gt; Gestionar datos de sitios web
                </li>
                <li>
                  <strong>Edge:</strong> Configuración &gt; Privacidad &gt; Cookies
                </li>
              </ul>
              <p className="mt-3 text-sm">
                Ten en cuenta que desactivar las cookies técnicas puede afectar
                al funcionamiento correcto del sitio web y a tu experiencia de
                compra.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-brand-brown-dark mb-3">
                5. Cookies de Terceros
              </h2>
              <p>
                Algunos servicios de terceros integrados en nuestro sitio pueden
                instalar sus propias cookies. Speedler no tiene control sobre
                estas cookies. Te recomendamos consultar las políticas de
                privacidad de dichos terceros:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1 text-sm">
                <li>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:text-brand-orange-deep underline">
                    Google Analytics
                  </a>
                </li>
                <li>
                  <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer" className="text-brand-orange hover:text-brand-orange-deep underline">
                    Meta (Facebook)
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-brand-brown-dark mb-3">
                6. Actualizaciones
              </h2>
              <p>
                Esta política de cookies podrá ser actualizada periódicamente
                para reflejar cambios en las cookies que utilizamos o por
                motivos legales. Te recomendamos revisarla regularmente.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 text-sm text-gray-400">
              <p>
                Para más información, consulta nuestra{' '}
                <a
                  href="/privacidad"
                  className="text-brand-orange hover:text-brand-orange-deep underline"
                >
                  política de privacidad
                </a>{' '}
                o{' '}
                <a
                  href="/contacto"
                  className="text-brand-orange hover:text-brand-orange-deep underline"
                >
                  contacta con nosotros
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
