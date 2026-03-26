'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FiX, FiChevronRight } from 'react-icons/fi';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navLinks: { label: string; href: string }[];
  user?: { name: string; email: string } | null;
  categories?: { name: string; slug: string }[];
}

export default function MobileMenu({
  isOpen,
  onClose,
  navLinks,
  user,
  categories = [],
}: MobileMenuProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/40 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform bg-white shadow-xl transition-transform duration-300 ease-in-out',
        )}
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4" style={{ borderBottom: '1px solid #ebebeb' }}>
          <Image src="/logo.png" alt="Speedler" width={120} height={36} className="h-8 w-auto" />
          <button
            onClick={onClose}
            className="rounded-md p-2 transition-colors hover:bg-gray-100"
            style={{ color: '#3a3a3a' }}
            aria-label="Cerrar menú"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-65px)] flex-col overflow-y-auto">
          {/* User area */}
          <div className="bg-gray-50 px-4 py-4" style={{ borderBottom: '1px solid #ebebeb' }}>
            {user ? (
              <div>
                <p className="font-medium" style={{ color: '#3a3a3a' }}>{user.name}</p>
                <p className="text-sm" style={{ color: '#777' }}>{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/cuenta"
                    onClick={onClose}
                    className="text-sm font-medium text-[#008060] hover:underline"
                  >
                    Mi cuenta
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/auth/login"
                  onClick={onClose}
                  className="flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#008060' }}
                >
                  Iniciar sesión
                </Link>
                <Link
                  href="/auth/registro"
                  onClick={onClose}
                  className="flex-1 rounded-md px-4 py-2 text-center text-sm font-semibold transition-colors hover:bg-gray-50"
                  style={{ border: '2px solid #008060', color: '#008060' }}
                >
                  Registro
                </Link>
              </div>
            )}
          </div>

          {/* Navigation links */}
          <nav className="py-2" style={{ borderBottom: '1px solid #ebebeb' }}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-[#008060]"
                style={{ color: '#3a3a3a' }}
              >
                {link.label}
                <FiChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </nav>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: '#777' }}>
                Categorías
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/tienda?category=${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 hover:text-[#008060]"
                  style={{ color: '#3a3a3a' }}
                >
                  {cat.name}
                  <FiChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}

          {/* Bottom links */}
          <div className="mt-auto py-2" style={{ borderTop: '1px solid #ebebeb' }}>
            <Link
              href="/carrito"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm transition-colors hover:bg-gray-50 hover:text-[#008060]"
              style={{ color: '#3a3a3a' }}
            >
              Carrito de compras
            </Link>
            {user && (
              <Link
                href="/api/auth/signout"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                Cerrar sesión
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
