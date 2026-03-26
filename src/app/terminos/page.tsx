import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description:
    'Términos y condiciones de uso de Speedler. Consulta las condiciones generales de compra, envíos, garantías y más.',
};

export default function TerminosPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        <section className="bg-[#3a3a3a] py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-bold text-white">
              Términos y Condiciones
            </h1>
            <p className="text-gray-200 mt-2">
              Última actualización: marzo 2026
            </p>
          </div>
        </section>

        <section className="container-custom py-12">
          <div className="max-w-3xl mx-auto card p-8 sm:p-10 space-y-8 text-gray-600 leading-relaxed">
            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                1. Información General
              </h2>
              <p>
                El presente documento establece las condiciones generales de uso
                y compra del sitio web speedler.es (en adelante, &quot;Speedler&quot; o
                &quot;la Tienda&quot;), propiedad de Speedler S.L., con domicilio social
                en Madrid, España, y CIF B-XXXXXXXX.
              </p>
              <p className="mt-2">
                El acceso y uso de este sitio web atribuye la condición de
                usuario e implica la aceptación plena y sin reservas de todas y
                cada una de las disposiciones incluidas en estos Términos y
                Condiciones.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                2. Productos y Precios
              </h2>
              <p>
                Los productos ofrecidos en Speedler se presentan con la mayor
                exactitud posible. No obstante, las imágenes y descripciones
                tienen carácter orientativo. Todos los precios indicados
                incluyen el IVA vigente y están expresados en euros.
              </p>
              <p className="mt-2">
                Speedler se reserva el derecho de modificar los precios en
                cualquier momento sin previo aviso. Los productos se facturarán
                al precio vigente en el momento de la confirmación del pedido.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                3. Proceso de Compra
              </h2>
              <p>
                Para realizar una compra, el usuario deberá seguir el proceso de
                pedido online, seleccionando los productos deseados, indicando
                los datos de envío y seleccionando el método de pago. Una vez
                confirmado el pedido, el usuario recibirá un correo electrónico
                de confirmación con el resumen del mismo.
              </p>
              <p className="mt-2">
                El contrato de compraventa se perfecciona en el momento en que
                Speedler confirma el pedido mediante correo electrónico. Speedler
                se reserva el derecho de cancelar pedidos en caso de error en el
                precio, falta de stock o sospecha de fraude.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                4. Métodos de Pago
              </h2>
              <p>
                Speedler acepta los siguientes métodos de pago: tarjeta de
                crédito/débito (Visa, Mastercard), transferencia bancaria,
                PayPal y Bizum. Todas las transacciones se realizan a través de
                pasarelas de pago seguras con cifrado SSL.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                5. Envíos y Entregas
              </h2>
              <p>
                Los envíos se realizan a toda España peninsular, Baleares,
                Canarias, Ceuta y Melilla. Los plazos de entrega estimados son
                de 24-48 horas para península y de 3-7 días laborables para
                islas, Ceuta y Melilla.
              </p>
              <p className="mt-2">
                Los gastos de envío se calcularán durante el proceso de compra y
                se mostrarán antes de la confirmación del pedido. Speedler no se
                responsabiliza de los retrasos causados por la empresa de
                transporte o por causas de fuerza mayor.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                6. Garantías
              </h2>
              <p>
                Todos los productos vendidos por Speedler cuentan con la garantía
                legal de conformidad de 3 años conforme a la legislación vigente
                (Real Decreto-ley 7/2021). Además, los productos cuentan con la
                garantía oficial del fabricante cuando corresponda.
              </p>
              <p className="mt-2">
                Para hacer efectiva la garantía, el cliente deberá presentar la
                factura o comprobante de compra. Speedler gestionará la
                reparación, sustitución o reembolso según proceda.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                7. Derecho de Desistimiento
              </h2>
              <p>
                El cliente tiene derecho a desistir de la compra en un plazo de
                14 días naturales desde la recepción del producto, sin necesidad
                de justificación, conforme al Real Decreto Legislativo 1/2007.
                Para más información, consulta nuestra{' '}
                <a
                  href="/devoluciones"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  política de devoluciones
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                8. Propiedad Intelectual
              </h2>
              <p>
                Todos los contenidos del sitio web (textos, imágenes, logotipos,
                diseño, software) son propiedad de Speedler o de sus
                licenciantes y están protegidos por las leyes de propiedad
                intelectual e industrial. Queda prohibida su reproducción,
                distribución o modificación sin autorización expresa.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                9. Limitación de Responsabilidad
              </h2>
              <p>
                Speedler no será responsable de los daños y perjuicios de
                cualquier naturaleza que pudieran derivarse del acceso o uso del
                sitio web, incluyendo, sin limitación, los producidos por virus
                informáticos o por fallos de funcionamiento. Speedler tampoco
                responde de los daños derivados del uso indebido de los
                productos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                10. Legislación Aplicable
              </h2>
              <p>
                Estos términos y condiciones se regirán e interpretarán conforme
                a la legislación española. Para cualquier controversia, las
                partes se someten a los Juzgados y Tribunales de Madrid, sin
                perjuicio de la competencia que pudiera corresponder al
                consumidor conforme a la normativa vigente.
              </p>
              <p className="mt-2">
                Asimismo, informamos de la existencia de la plataforma europea
                de resolución de litigios en línea (ODR):{' '}
                <a
                  href="https://ec.europa.eu/consumers/odr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  https://ec.europa.eu/consumers/odr
                </a>
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 text-sm text-gray-400">
              <p>
                Si tienes alguna pregunta sobre estos términos, no dudes en{' '}
                <a
                  href="/contacto"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  contactarnos
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
