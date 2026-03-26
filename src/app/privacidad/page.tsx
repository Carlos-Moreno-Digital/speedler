import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description:
    'Política de privacidad de Speedler. Información sobre cómo recopilamos, usamos y protegemos tus datos personales conforme al RGPD.',
};

export default function PrivacidadPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-bg">
        <section className="bg-[#3a3a3a] py-12">
          <div className="container-custom text-center">
            <h1 className="text-3xl font-bold text-white">
              Política de Privacidad
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
                1. Responsable del Tratamiento
              </h2>
              <ul className="space-y-1 mt-2">
                <li><strong>Responsable:</strong> Speedler S.L.</li>
                <li><strong>CIF:</strong> B-XXXXXXXX</li>
                <li><strong>Domicilio:</strong> Calle Ejemplo 123, 28001 Madrid, España</li>
                <li><strong>Email:</strong> privacidad@speedler.es</li>
                <li><strong>Delegado de Protección de Datos:</strong> dpd@speedler.es</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                2. Datos que Recopilamos
              </h2>
              <p>
                En cumplimiento del Reglamento General de Protección de Datos
                (RGPD) UE 2016/679 y la Ley Orgánica 3/2018 de Protección de
                Datos Personales y Garantía de los Derechos Digitales (LOPDGDD),
                te informamos de que recopilamos los siguientes datos:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Datos identificativos: nombre, apellidos, DNI/NIF</li>
                <li>Datos de contacto: email, teléfono, dirección postal</li>
                <li>Datos de facturación y pago</li>
                <li>Datos de navegación: dirección IP, cookies, historial de navegación</li>
                <li>Datos de pedidos: historial de compras, preferencias</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                3. Finalidad del Tratamiento
              </h2>
              <p>Los datos personales se tratan con las siguientes finalidades:</p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Gestión de la relación comercial y ejecución de contratos de compraventa</li>
                <li>Envío de pedidos y gestión de entregas</li>
                <li>Facturación y gestión contable</li>
                <li>Atención al cliente y resolución de consultas e incidencias</li>
                <li>Gestión de devoluciones y garantías</li>
                <li>Envío de comunicaciones comerciales (solo con consentimiento previo)</li>
                <li>Mejora de nuestros servicios y personalización de la experiencia de usuario</li>
                <li>Cumplimiento de obligaciones legales y fiscales</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                4. Base Legal del Tratamiento
              </h2>
              <p>El tratamiento de tus datos se fundamenta en:</p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li><strong>Ejecución de contrato:</strong> para la gestión de compras y envíos</li>
                <li><strong>Consentimiento:</strong> para el envío de comunicaciones comerciales y uso de cookies no esenciales</li>
                <li><strong>Interés legítimo:</strong> para la mejora de nuestros servicios y prevención del fraude</li>
                <li><strong>Obligación legal:</strong> para el cumplimiento de obligaciones fiscales y contables</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                5. Conservación de los Datos
              </h2>
              <p>
                Los datos personales se conservarán durante el tiempo necesario
                para cumplir la finalidad para la que fueron recabados:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Datos de clientes: durante la relación comercial y los plazos legales de conservación (mínimo 5 años para obligaciones fiscales)</li>
                <li>Datos de facturación: 6 años conforme al Código de Comercio</li>
                <li>Datos de consentimiento: hasta la revocación del mismo</li>
                <li>Datos de navegación: según la política de cookies vigente</li>
              </ul>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                6. Destinatarios de los Datos
              </h2>
              <p>
                Tus datos podrán ser comunicados a los siguientes destinatarios:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li>Empresas de transporte para la entrega de pedidos</li>
                <li>Entidades bancarias y pasarelas de pago para el procesamiento de transacciones</li>
                <li>Administración Tributaria y otros organismos públicos cuando exista obligación legal</li>
                <li>Proveedores de servicios tecnológicos (hosting, email, analítica) con los que existen contratos de encargo de tratamiento</li>
              </ul>
              <p className="mt-2">
                No se realizan transferencias internacionales de datos fuera del
                Espacio Económico Europeo. En caso de ser necesario, se
                garantizarán las medidas de protección adecuadas conforme al RGPD.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                7. Derechos del Usuario
              </h2>
              <p>
                Conforme al RGPD y la LOPDGDD, tienes derecho a:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1">
                <li><strong>Acceso:</strong> conocer qué datos personales tratamos sobre ti</li>
                <li><strong>Rectificación:</strong> solicitar la corrección de datos inexactos</li>
                <li><strong>Supresión:</strong> solicitar la eliminación de tus datos (&quot;derecho al olvido&quot;)</li>
                <li><strong>Oposición:</strong> oponerte al tratamiento de tus datos</li>
                <li><strong>Limitación:</strong> solicitar la limitación del tratamiento</li>
                <li><strong>Portabilidad:</strong> recibir tus datos en un formato estructurado y de uso común</li>
              </ul>
              <p className="mt-3">
                Para ejercer estos derechos, puedes enviar una solicitud a{' '}
                <a
                  href="mailto:privacidad@speedler.es"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  privacidad@speedler.es
                </a>{' '}
                adjuntando copia de tu DNI. Responderemos en un plazo máximo de
                30 días.
              </p>
              <p className="mt-2">
                También tienes derecho a presentar una reclamación ante la
                Agencia Española de Protección de Datos (AEPD):{' '}
                <a
                  href="https://www.aepd.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  www.aepd.es
                </a>
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                8. Medidas de Seguridad
              </h2>
              <p>
                Speedler ha implementado las medidas técnicas y organizativas
                necesarias para garantizar la seguridad de tus datos personales,
                incluyendo cifrado SSL/TLS, control de accesos, copias de
                seguridad periódicas y formación del personal en materia de
                protección de datos.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#3a3a3a] mb-3">
                9. Modificaciones
              </h2>
              <p>
                Speedler se reserva el derecho de modificar la presente política
                de privacidad para adaptarla a novedades legislativas o
                jurisprudenciales. En caso de cambios significativos, se
                informará a los usuarios a través del sitio web o por correo
                electrónico.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 text-sm text-gray-400">
              <p>
                Para consultas sobre privacidad, contacta con nosotros en{' '}
                <a
                  href="mailto:privacidad@speedler.es"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  privacidad@speedler.es
                </a>{' '}
                o consulta nuestra{' '}
                <a
                  href="/cookies"
                  className="text-[#008060] hover:text-[#006e52] underline"
                >
                  política de cookies
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
