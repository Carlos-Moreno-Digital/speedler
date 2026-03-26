'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { FiPackage, FiMapPin, FiUser, FiChevronRight, FiEdit2 } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  SHIPPED: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function CuentaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/cuenta');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/orders?limit=5')
      .then((res) => (res.ok ? res.json() : { data: [] }))
      .then((data) => setOrders(data.data || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <>
        <Header />
        <main>
          <div className="min-h-screen bg-bg flex items-center justify-center">
            <div className="animate-pulse text-gray-400">Cargando...</div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const user = session?.user;

  return (
    <>
    <Header />
    <main>
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-brand-brown-dark mb-8">
          Mi cuenta
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar navigation */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full bg-brand-cream flex items-center justify-center">
                  <FiUser className="w-7 h-7 text-brand-orange" />
                </div>
                <div>
                  <p className="font-bold text-brand-brown-dark">
                    {user?.name}
                  </p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                <Link
                  href="/cuenta"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-brand-orange text-white font-medium"
                >
                  <FiUser className="w-5 h-5" />
                  Panel general
                  <FiChevronRight className="w-4 h-4 ml-auto" />
                </Link>
                <Link
                  href="/cuenta/pedidos"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-brand-cream transition-colors"
                >
                  <FiPackage className="w-5 h-5" />
                  Mis pedidos
                  <FiChevronRight className="w-4 h-4 ml-auto" />
                </Link>
                <Link
                  href="/cuenta/direcciones"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-brand-cream transition-colors"
                >
                  <FiMapPin className="w-5 h-5" />
                  Direcciones
                  <FiChevronRight className="w-4 h-4 ml-auto" />
                </Link>
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile info */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-brand-brown-dark">
                  Información personal
                </h2>
                <button className="text-sm text-brand-orange hover:text-brand-orange-deep font-medium flex items-center gap-1">
                  <FiEdit2 className="w-4 h-4" />
                  Editar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Nombre</p>
                  <p className="font-medium text-gray-800">
                    {user?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">
                    {user?.email || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">NIF</p>
                  <p className="font-medium text-gray-800">
                    {(user as { nif?: string } | undefined)?.nif || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Teléfono</p>
                  <p className="font-medium text-gray-800">-</p>
                </div>
              </div>
            </div>

            {/* Recent orders */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-brand-brown-dark">
                  Pedidos recientes
                </h2>
                <Link
                  href="/cuenta/pedidos"
                  className="text-sm text-brand-orange hover:text-brand-orange-deep font-medium"
                >
                  Ver todos
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="animate-pulse flex justify-between items-center py-3 border-b border-gray-100"
                    >
                      <div className="space-y-2">
                        <div className="bg-gray-200 h-4 rounded w-32" />
                        <div className="bg-gray-200 h-3 rounded w-20" />
                      </div>
                      <div className="bg-gray-200 h-6 rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FiPackage className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                  <p>No tienes pedidos todavía</p>
                  <Link
                    href="/tienda"
                    className="text-brand-orange hover:text-brand-orange-deep text-sm font-medium mt-2 inline-block"
                  >
                    Ir a la tienda
                  </Link>
                </div>
              ) : (
                <div className="space-y-0">
                  {orders.map((order) => {
                    const st = STATUS_LABELS[order.status] || {
                      label: order.status,
                      color: 'bg-gray-100 text-gray-700',
                    };
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <p className="font-medium text-gray-800 text-sm">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(order.createdAt).toLocaleDateString(
                              'es-ES',
                              {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              }
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-sm">
                            {formatPrice(order.total)}
                          </span>
                          <span className={`badge text-xs ${st.color}`}>
                            {st.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </main>
    <Footer />
    </>
  );
}
