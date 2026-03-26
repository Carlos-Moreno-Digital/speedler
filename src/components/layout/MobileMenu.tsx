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
          'fixed inset-0 z-50 bg-black/50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform bg-white shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <Image src="/logo.png" alt="Speedler" width={120} height={36} className="h-8 w-auto" />
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100"
            aria-label="Cerrar men&uacute;"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(100%-65px)] flex-col overflow-y-auto">
          {/* User area */}
          <div className="border-b border-gray-200 bg-bg-alt px-4 py-4">
            {user ? (
              <div>
                <p className="font-medium text-brand-brown-dark">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="mt-2 flex gap-2">
                  <Link
                    href="/cuenta"
                    onClick={onClose}
                    className="text-sm font-medium text-brand-orange hover:text-brand-orange-deep"
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
                  className="flex-1 rounded-lg bg-brand-orange px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-orange-deep"
                >
                  Iniciar sesi&oacute;n
                </Link>
                <Link
                  href="/auth/registro"
                  onClick={onClose}
                  className="flex-1 rounded-lg border-2 border-brand-orange px-4 py-2 text-center text-sm font-semibold text-brand-orange transition-colors hover:bg-brand-orange hover:text-white"
                >
                  Registro
                </Link>
              </div>
            )}
          </div>

          {/* Navigation links */}
          <nav className="border-b border-gray-200 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-brand-brown-dark transition-colors hover:bg-brand-cream"
              >
                {link.label}
                <FiChevronRight className="h-4 w-4 text-gray-400" />
              </Link>
            ))}
          </nav>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                Categor&iacute;as
              </p>
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/tienda?category=${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-brand-cream hover:text-brand-brown-dark"
                >
                  {cat.name}
                  <FiChevronRight className="h-4 w-4 text-gray-400" />
                </Link>
              ))}
            </div>
          )}

          {/* Bottom links */}
          <div className="mt-auto border-t border-gray-200 py-2">
            <Link
              href="/carrito"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-brand-cream"
            >
              Carrito de compras
            </Link>
            {user && (
              <Link
                href="/api/auth/signout"
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-3 text-sm text-red-600 transition-colors hover:bg-red-50"
              >
                Cerrar sesi&oacute;n
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
