import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
        <div className="max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          <h1 className="text-4xl md:text-5xl lg:text-[56px] font-bold leading-tight text-[#3a3a3a]">
            Tu tienda de inform&aacute;tica de confianza
          </h1>
          <p className="mt-5 text-lg md:text-xl text-[#777] max-w-xl mx-auto lg:mx-0">
            Componentes, perif&eacute;ricos y equipos al mejor precio.
            Configura tu PC a medida con nuestro configurador online.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#008060] text-white font-semibold rounded-[3px] shadow hover:bg-[#006e52] transition-colors duration-200 text-base"
            >
              Explorar tienda
              <svg
                className="ml-2 w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </Link>
            <Link
              href="/configurador-pc"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white border border-[#ebebeb] text-[#3a3a3a] font-semibold rounded-[3px] hover:border-[#ccc] transition-colors duration-200 text-base"
            >
              Configurador PC
            </Link>
          </div>
        </div>
      </div>

      {/* Feature icons row */}
      <div className="border-t border-[#ebebeb] bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-[#777]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#008060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Env&iacute;o 24-48h
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#008060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Garant&iacute;a oficial
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#008060]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              Soporte t&eacute;cnico
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
