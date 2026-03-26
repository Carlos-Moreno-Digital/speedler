'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi';
import MobileMenu from './MobileMenu';

interface HeaderProps {
  cartItemCount?: number;
  user?: { name: string; email: string } | null;
}

export default function Header({ cartItemCount = 0, user = null }: HeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
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
      setSearchOpen(false);
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
          'sticky top-0 z-40 w-full bg-white transition-shadow duration-300',
          scrolled ? 'shadow-sm' : '',
        )}
        style={{ borderBottom: '1px solid #ebebeb' }}
      >
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6 lg:px-12">
          {/* LEFT: Mobile hamburger + Logo */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 transition-colors lg:hidden"
              style={{ color: '#3a3a3a' }}
              aria-label="Abrir menú"
            >
              <FiMenu className="h-5 w-5" />
            </button>

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
          </div>

          {/* CENTER: Desktop navigation */}
          <nav className="hidden items-center gap-6 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-[#008060]"
                style={{ color: '#3a3a3a' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* RIGHT: Icons */}
          <div className="flex items-center gap-3">
            {/* Search toggle */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-1 transition-colors hover:text-[#008060]"
              style={{ color: '#3a3a3a' }}
              aria-label="Buscar"
            >
              {searchOpen ? <FiX className="h-5 w-5" /> : <FiSearch className="h-5 w-5" />}
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-1 transition-colors hover:text-[#008060]"
                style={{ color: '#3a3a3a' }}
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
                  <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg bg-white py-1 shadow-lg" style={{ border: '1px solid #ebebeb' }}>
                    {user ? (
                      <>
                        <div className="px-4 py-2" style={{ borderBottom: '1px solid #ebebeb' }}>
                          <p className="text-sm font-medium" style={{ color: '#3a3a3a' }}>
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <Link
                          href="/cuenta"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#008060]"
                        >
                          Mi cuenta
                        </Link>
                        <Link
                          href="/cuenta/pedidos"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#008060]"
                        >
                          Mis pedidos
                        </Link>
                        <Link
                          href="/api/auth/signout"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                        >
                          Cerrar sesión
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/auth/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#008060]"
                        >
                          Iniciar sesión
                        </Link>
                        <Link
                          href="/auth/registro"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#008060]"
                        >
                          Registrarse
                        </Link>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Cart */}
            <Link
              href="/carrito"
              className="relative p-1 transition-colors hover:text-[#008060]"
              style={{ color: '#3a3a3a' }}
              aria-label="Carrito de compras"
            >
              <FiShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#008060] text-[10px] font-bold text-white">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Search bar - slides down when open */}
        <div
          className={cn(
            'overflow-hidden transition-all duration-200',
            searchOpen ? 'max-h-16' : 'max-h-0',
          )}
          style={{ borderTop: searchOpen ? '1px solid #ebebeb' : 'none' }}
        >
          <div className="mx-auto max-w-[1200px] px-6 py-3 lg:px-12">
            <form onSubmit={handleSearch} className="relative">
              <FiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar productos..."
                autoFocus={searchOpen}
                className="w-full rounded-md py-2 pl-10 pr-4 text-sm placeholder-gray-400 transition-colors focus:outline-none"
                style={{ border: '1px solid #ebebeb', color: '#3a3a3a' }}
              />
            </form>
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
