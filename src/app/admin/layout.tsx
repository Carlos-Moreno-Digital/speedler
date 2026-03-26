'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/productos', label: 'Productos', icon: '📦' },
  { href: '/admin/pedidos', label: 'Pedidos', icon: '🛒' },
  { href: '/admin/clientes', label: 'Clientes', icon: '👥' },
  { href: '/admin/precios', label: 'Reglas de Precios', icon: '💰' },
  { href: '/admin/sync', label: 'Sincronización', icon: '🔄' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-brand-brown-dark text-white min-h-screen flex flex-col">
        <div className="p-6 border-b border-brand-brown-medium">
          <Link href="/admin" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Speedler" width={120} height={40} />
          </Link>
          <p className="text-brand-cream text-xs mt-1">Panel de Administración</p>
        </div>

        <nav className="flex-1 py-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-6 py-3 text-sm transition-colors',
                pathname === item.href
                  ? 'bg-brand-orange text-white'
                  : 'text-brand-cream hover:bg-brand-brown-medium'
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-brown-medium">
          <Link
            href="/"
            className="text-brand-cream text-sm hover:text-white transition-colors"
          >
            ← Volver a la tienda
          </Link>
        </div>
      </aside>

      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
