import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Sobre Nosotros',
  description:
    'Conoce Speedler, tu tienda de confianza en componentes informáticos, periféricos y electrónica. Más de 10 años ofreciendo las mejores soluciones tecnológicas.',
};

export default function SobreNosotrosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        {/* Hero section */}
        <section className="bg-gradient-to-br from-brand-brown-dark to-brand-brown py-16">
          <div className="container-custom text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Sobre Nosotros
            </h1>
            <p className="text-brand-cream text-lg max-w-2xl mx-auto">
              En Speedler creemos que la tecnología debe ser accesible, fiable y
              estar al alcance de todos. Somos tu tienda de informática de
              confianza.
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="container-custom py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold text-brand-brown-dark mb-4">
                Nuestra Historia
              </h2>
              <p className="text-gray-600 mb-4">
                Speedler nació con una misión clara: ofrecer componentes
                informáticos de calidad a precios competitivos, acompañados de un
                asesoramiento experto y un servicio al cliente excepcional.
              </p>
              <p className="text-gray-600 mb-4">
                Desde nuestros inicios, hemos trabajado con los principales
                fabricantes del sector como Intel, AMD, NVIDIA, ASUS, MSI,
                Corsair y muchos más, para garantizar que nuestros clientes
                siempre tengan acceso a los últimos productos y las mejores
                ofertas del mercado.
              </p>
              <p className="text-gray-600">
                Hoy, Speedler es mucho más que una tienda online. Somos un
                equipo de apasionados por la tecnología que disfruta ayudando a
                cada cliente a encontrar exactamente lo que necesita, ya sea para
                montar un PC gaming de última generación, equipar una oficina o
                actualizar su setup actual.
              </p>
            </div>
            <div className="bg-gradient-to-br from-brand-orange/10 to-brand-cream rounded-2xl p-10 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-brand-orange mb-2">S</div>
                <div className="text-2xl font-bold text-brand-brown-dark">
                  Speedler
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Tu tienda de informática
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white py-16">
          <div className="container-custom">
            <h2 className="text-2xl font-bold text-brand-brown-dark text-center mb-10">
              Nuestros Valores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-brand-orange font-bold">1</span>
                </div>
                <h3 className="text-lg font-bold text-brand-brown-dark mb-2">
                  Calidad Garantizada
                </h3>
                <p className="text-gray-600 text-sm">
                  Trabajamos exclusivamente con fabricantes y distribuidores
                  autorizados. Todos nuestros productos cuentan con garantía
                  oficial del fabricante.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-brand-orange font-bold">2</span>
                </div>
                <h3 className="text-lg font-bold text-brand-brown-dark mb-2">
                  Asesoramiento Experto
                </h3>
                <p className="text-gray-600 text-sm">
                  Nuestro equipo está formado por profesionales con amplia
                  experiencia en el sector que te guiarán en cada compra para que
                  tomes la mejor decisión.
                </p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-brand-orange font-bold">3</span>
                </div>
                <h3 className="text-lg font-bold text-brand-brown-dark mb-2">
                  Precio Competitivo
                </h3>
                <p className="text-gray-600 text-sm">
                  Nos esforzamos por ofrecer los precios más competitivos del
                  mercado sin sacrificar la calidad del servicio ni la atención
                  al cliente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="container-custom py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { number: '10.000+', label: 'Productos disponibles' },
              { number: '50.000+', label: 'Clientes satisfechos' },
              { number: '24h', label: 'Envío express' },
              { number: '2 años', label: 'Garantía mínima' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="card p-6 text-center"
              >
                <div className="text-2xl font-bold text-brand-orange mb-1">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-brown-dark py-16">
          <div className="container-custom text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              ¿Listo para encontrar lo que necesitas?
            </h2>
            <p className="text-brand-cream mb-8 max-w-xl mx-auto">
              Explora nuestro catálogo con miles de productos de las mejores
              marcas o utiliza nuestro configurador de PC para montar tu equipo
              ideal.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="/tienda"
                className="btn-primary"
              >
                Ver Tienda
              </a>
              <a
                href="/configurador-pc"
                className="bg-white text-brand-brown-dark font-semibold px-6 py-3 rounded-xl hover:bg-brand-cream transition-colors"
              >
                Configurador PC
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
