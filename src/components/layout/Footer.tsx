'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const footerLinks = {
  company: [
    { label: 'Sobre nosotros', href: '/sobre-nosotros' },
    { label: 'Contacto', href: '/contacto' },
    { label: 'Blog', href: '/blog' },
    { label: 'Trabaja con nosotros', href: '/empleo' },
  ],
  legal: [
    { label: 'Términos y condiciones', href: '/terminos' },
    { label: 'Política de privacidad', href: '/privacidad' },
    { label: 'Política de cookies', href: '/cookies' },
    { label: 'Política de devoluciones', href: '/devoluciones' },
  ],
  shop: [
    { label: 'Tienda', href: '/tienda' },
    { label: 'Configurador PC', href: '/configurador-pc' },
    { label: 'Ofertas', href: '/tienda?offers=true' },
    { label: 'Novedades', href: '/tienda?sortBy=newest' },
  ],
};

interface FooterProps {
  className?: string;
}

export default function Footer({ className }: FooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      try {
        await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
      } catch {}
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <>
      {/* Newsletter section - above footer */}
      <section className="bg-white py-10" style={{ borderTop: '1px solid #ebebeb' }}>
        <div className="mx-auto flex max-w-[1200px] flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between lg:px-12">
          <div>
            <h3 className="text-base font-semibold" style={{ color: '#3a3a3a' }}>
              Suscríbete a nuestra newsletter
            </h3>
            <p className="mt-1 text-sm" style={{ color: '#777' }}>
              Recibe ofertas exclusivas y novedades directamente en tu correo.
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="flex w-full gap-2 sm:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full rounded-md px-4 py-2.5 text-sm placeholder-gray-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#008060]/30 sm:w-64"
              style={{ border: '1px solid #ebebeb', color: '#3a3a3a' }}
            />
            <button
              type="submit"
              className="flex-shrink-0 rounded-md px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: '#008060' }}
            >
              {subscribed ? 'Suscrito!' : 'Suscribir'}
            </button>
          </form>
        </div>
      </section>

      <footer className={cn('bg-gray-100', className)}>
        {/* Main footer */}
        <div className="mx-auto max-w-[1200px] px-6 py-12 lg:px-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Logo + description */}
            <div>
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="Speedler"
                  width={140}
                  height={40}
                  className="h-9 w-auto"
                />
              </Link>
              <p className="mt-4 max-w-sm text-sm leading-relaxed" style={{ color: '#777' }}>
                Tu tienda de tecnología de confianza. Componentes, periféricos y equipos
                informáticos con los mejores precios y envío rápido a toda España.
              </p>
            </div>

            {/* Shop links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3a3a3a' }}>
                Tienda
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[#008060]"
                      style={{ color: '#777' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3a3a3a' }}>
                Empresa
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[#008060]"
                      style={{ color: '#777' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: '#3a3a3a' }}>
                Legal
              </h3>
              <ul className="mt-4 space-y-3">
                {footerLinks.legal.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:text-[#008060]"
                      style={{ color: '#777' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div style={{ borderTop: '1px solid #ddd' }}>
          <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row lg:px-12">
            <p className="text-sm" style={{ color: '#777' }}>
              &copy; {new Date().getFullYear()} Speedler. Todos los derechos reservados.
            </p>

            {/* Payment icons placeholder */}
            <div className="flex items-center gap-3">
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-500">Visa</span>
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-500">Mastercard</span>
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-500">PayPal</span>
              <span className="rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-500">Bizum</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
