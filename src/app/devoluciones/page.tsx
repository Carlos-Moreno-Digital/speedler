import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Política de Devoluciones',
  description:
    'Política de devoluciones de Speedler. Información sobre el derecho de desistimiento de 14 días, condiciones de devolución y proceso de reembolso.',
};

export default function DevolucionesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        <section className="bg-[#3a3a3a] py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-bold text-white">
              Política de Devoluciones
            </h1>
            <p className="text-gray-200 mt-2">
              14 días para devoluciones conforme a la normativa europea
            </p>
          </div>
        </section>

        <section className="container-custom py-12">
          <div className="max-w-3xl mx-auto space-y-8">
            {/* Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-5 text-center">
                <div className="text-2xl font-bold text-[#008060] mb-1">14 días</div>
                <div className="text-sm text-gray-500">Plazo de devolución</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-2xl font-bold text-[#008060] mb-1">Gratuito</div>
                <div className="text-sm text-gray-500">Sin coste por defecto</div>
              </div>
              <div className="card p-5 text-center">
                <div className="text-2xl font-bold text-[#008060] mb-1">Reembolso</div>
                <div className="text-sm text-gray-500">En 14 días hábiles</div>
              </div>
            </div>

            <div className="card p-8 sm:p-10 space-y-8 text-gray-600 leading-relaxed">
              <div>
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  1. Derecho de Desistimiento
                </h2>
                <p>
                  De conformidad con el Real Decreto Legislativo 1/2007, por el
                  que se aprueba el texto refundido de la Ley General para la
                  Defensa de los Consumidores y Usuarios, y la Directiva
                  2011/83/UE del Parlamento Europeo, dispones de un plazo de
                  <strong> 14 días naturales</strong> desde la recepción del
                  producto para ejercer tu derecho de desistimiento sin
                  necesidad de justificación.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  2. Condiciones de Devolución
                </h2>
                <p>Para que la devolución sea aceptada, el producto debe:</p>
                <ul className="list-disc list-inside mt-3 space-y-2">
                  <li>
                    Encontrarse en su estado original, sin usar y sin daños
                  </li>
                  <li>
                    Conservar todos los embalajes, accesorios, manuales y
                    documentación original
                  </li>
                  <li>
                    Incluir todos los elementos con los que fue entregado
                    (cables, adaptadores, pegatinas, etc.)
                  </li>
                  <li>
                    No haber sido desprecintado en el caso de software,
                    videojuegos o productos sellados por razones de higiene o
                    protección de la salud
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  3. Productos Excluidos
                </h2>
                <p>
                  Conforme a la legislación vigente, no se admitirán
                  devoluciones en los siguientes casos:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2">
                  <li>
                    Software, licencias digitales y contenido digital una vez
                    descargado o desprecintado
                  </li>
                  <li>
                    Productos personalizados o fabricados según especificaciones
                    del cliente (PCs configurados a medida)
                  </li>
                  <li>
                    Productos sellados que no sean aptos para ser devueltos por
                    razones de protección de la salud o higiene y que hayan sido
                    desprecintados
                  </li>
                  <li>
                    Productos que se hayan mezclado de forma inseparable con
                    otros tras su entrega
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  4. Proceso de Devolución
                </h2>
                <p>Para iniciar una devolución, sigue estos pasos:</p>
                <ol className="list-decimal list-inside mt-3 space-y-3">
                  <li>
                    <strong>Solicitud:</strong> Accede a tu cuenta en{' '}
                    <a href="/cuenta/pedidos" className="text-[#008060] hover:text-[#006e52] underline">
                      Mis Pedidos
                    </a>{' '}
                    y selecciona el producto que deseas devolver, o envía un
                    email a{' '}
                    <a href="mailto:devoluciones@speedler.es" className="text-[#008060] hover:text-[#006e52] underline">
                      devoluciones@speedler.es
                    </a>{' '}
                    indicando el número de pedido y el motivo.
                  </li>
                  <li>
                    <strong>Aprobación:</strong> Revisaremos tu solicitud y te
                    enviaremos una etiqueta de envío de devolución en un plazo
                    de 24-48 horas laborables.
                  </li>
                  <li>
                    <strong>Envío:</strong> Empaqueta el producto de forma segura
                    en su embalaje original y adhiere la etiqueta de devolución.
                    Deposítalo en el punto de recogida indicado.
                  </li>
                  <li>
                    <strong>Recepción y verificación:</strong> Una vez recibido
                    el producto en nuestro almacén, verificaremos su estado en
                    un plazo de 48 horas.
                  </li>
                  <li>
                    <strong>Reembolso:</strong> Si todo está correcto,
                    procederemos al reembolso en un plazo máximo de 14 días
                    naturales desde la confirmación.
                  </li>
                </ol>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  5. Reembolso
                </h2>
                <p>
                  El reembolso se realizará utilizando el mismo método de pago
                  empleado en la compra original. Incluirá el importe total del
                  producto devuelto. Los gastos de envío originales se
                  reembolsarán solo si la devolución se debe a un error por
                  parte de Speedler o a un producto defectuoso.
                </p>
                <p className="mt-2">
                  En caso de que el producto devuelto presente deterioro o uso
                  indebido, Speedler podrá aplicar una depreciación proporcional
                  al estado del producto y reembolsar un importe reducido.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  6. Productos Defectuosos o Erróneos
                </h2>
                <p>
                  Si has recibido un producto defectuoso, dañado durante el
                  transporte o diferente al pedido, contacta con nosotros en un
                  plazo de 48 horas desde la recepción. En estos casos:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2">
                  <li>Los gastos de envío de devolución corren a cargo de Speedler</li>
                  <li>Podrás elegir entre la sustitución del producto o el reembolso completo</li>
                  <li>El proceso de gestión será prioritario</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  7. Garantía Legal
                </h2>
                <p>
                  Independientemente del derecho de desistimiento, todos los
                  productos disponen de una garantía legal de conformidad de 3
                  años conforme al Real Decreto-ley 7/2021. Si un producto
                  presenta un defecto de conformidad durante este periodo, tienes
                  derecho a la reparación, sustitución, reducción del precio o
                  resolución del contrato.
                </p>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                  ¿Necesitas Ayuda?
                </h2>
                <p>
                  Si tienes alguna duda sobre el proceso de devolución, nuestro
                  equipo de atención al cliente está a tu disposición:
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  <li>
                    Email:{' '}
                    <a href="mailto:devoluciones@speedler.es" className="text-[#008060] hover:text-[#006e52] underline">
                      devoluciones@speedler.es
                    </a>
                  </li>
                  <li>
                    Teléfono:{' '}
                    <a href="tel:+34900000000" className="text-[#008060] hover:text-[#006e52] underline">
                      900 000 000
                    </a>{' '}
                    (Lun-Vie 9:00-18:00)
                  </li>
                  <li>
                    Formulario:{' '}
                    <a href="/contacto" className="text-[#008060] hover:text-[#006e52] underline">
                      Página de contacto
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
