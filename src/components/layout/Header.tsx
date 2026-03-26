'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FiSearch, FiShoppingCart, FiUser, FiMenu } from 'react-icons/fi';
import MobileMenu from './MobileMenu';

interface HeaderProps {
  cartItemCount?: number;
  user?: { name: string; email: string } | null;
}

export default function Header({ cartItemCount = 0, user = null }: HeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tienda?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { label: 'Tienda', href: '/tienda' },
    { label: 'Configurador PC', href: '/configurador-pc' },
    { label: 'Contacto', href: '/contacto' },
  ];

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-40 w-full border-b bg-white transition-shadow duration-300',
          scrolled ? 'border-gray-200 shadow-md' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-brand-brown-dark transition-colors hover:bg-brand-cream lg:hidden"
            aria-label="Abrir men&uacute;"
          >
            <FiMenu className="h-5 w-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/logo.png"
              alt="Speedler"
              width={140}
              height={40}
              className="h-9 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-brand-brown-dark transition-colors hover:bg-brand-cream hover:text-brand-orange-deep"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="mx-4 hidden flex-1 md:block">
            <div className="relative max-w-lg">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                className="w-full rounded-full border border-gray-300 bg-bg-alt py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/30"
              />
            </div>
          </form>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Mobile search */}
            <Link
              href="/tienda"
              className="rounded-lg p-2 text-brand-brown-dark transition-colors hover:bg-brand-cream md:hidden"
              aria-label="Buscar"
            >
              <FiSearch className="h-5 w-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/carrito"
              className="relative rounded-lg p-2 text-brand-brown-dark transition-colors hover:bg-brand-cream"
              aria-label="Carrito de compras"
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-orange text-[10px] font-bold text-white">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="rounded-lg p-2 text-brand-brown-dark transition-colors hover:bg-brand-cream"
                aria-label="Cuenta de usuario"
              >
                <FiUser className="h-5 w-5" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
                    {user ? (
                      <>
                        <div className="border-b border-gray-100 px-4 py-2">
                          <p className="text-sm font-medium text-brand-brown-dark">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link
                          href="/cuenta"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-cream"
                        >
                          Mi cuenta
                        </Link>
                        <Link
                          href="/cuenta/pedidos"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-cream"
                        >
                          Mis pedidos
                        </Link>
                        <Link
                          href="/api/auth/signout"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Cerrar sesi&oacute;n
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-cream"
                        >
                          Iniciar sesi&oacute;n
                        </Link>
                        <Link
                          href="/auth/registro"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-cream"
                        >
                          Registrarse
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <MobileMenu
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
        user={user}
      />
    </>
  );
}
