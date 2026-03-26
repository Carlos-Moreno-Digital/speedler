'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';
import { FiPackage, FiChevronRight, FiArrowLeft } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: { name: string; slug: string; image: string | null };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  canonDigitalTotal: number;
  ivaTotal: number;
  recargoEquivalenciaTotal: number;
  shippingCost: number;
  total: number;
  paymentMethod: string | null;
  shippingTrackingCode: string | null;
  createdAt: string;
  items: OrderItem[];
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700' },
  PAID: { label: 'Pagado', color: 'bg-green-100 text-green-700' },
  SHIPPED: { label: 'Enviado', color: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Entregado', color: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Cancelado', color: 'bg-red-100 text-red-700' },
};

export default function PedidosPage() {
  const { status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/cuenta/pedidos');
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    fetch('/api/orders')
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

  return (
    <>
    <Header />
    <main>
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/cuenta"
            className="p-2 rounded-lg hover:bg-brand-cream transition-colors"
          >
            <FiArrowLeft className="w-5 h-5 text-brand-brown-dark" />
          </Link>
          <h1 className="text-3xl font-bold text-brand-brown-dark">
            Mis pedidos
          </h1>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="bg-gray-200 h-5 rounded w-40" />
                    <div className="bg-gray-200 h-4 rounded w-24" />
                  </div>
                  <div className="bg-gray-200 h-6 rounded-full w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-12 text-center">
            <FiPackage className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h2 className="text-xl font-bold text-brand-brown-dark mb-2">
              No tienes pedidos
            </h2>
            <p className="text-gray-500 mb-6">
              Cuando realices tu primer pedido, aparecerá aquí.
            </p>
            <Link href="/tienda" className="btn-primary">
              Ir a la tienda
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const st = STATUS_LABELS[order.status] || {
                label: order.status,
                color: 'bg-gray-100 text-gray-700',
              };
              const isExpanded = expandedOrder === order.id;

              return (
                <div key={order.id} className="card overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="w-full p-6 text-left"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-brand-brown-dark">
                          {order.orderNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString(
                            'es-ES',
                            {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            }
                          )}
                          {order.paymentMethod && (
                            <span className="ml-2">
                              - {order.paymentMethod}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-brand-orange">
                          {formatPrice(Number(order.total))}
                        </span>
                        <span className={`badge text-xs ${st.color}`}>
                          {st.label}
                        </span>
                        <FiChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-6 bg-gray-50 animate-fade-in">
                      {/* Items */}
                      <div className="space-y-3 mb-4">
                        {order.items?.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4"
                          >
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.product.image ? (
                                <img
                                  src={item.product.image}
                                  alt={item.product.name}
                                  className="object-contain w-full h-full p-1"
                                />
                              ) : (
                                <FiPackage className="w-5 h-5 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                href={`/tienda/${item.product.slug}`}
                                className="text-sm font-medium text-gray-800 hover:text-brand-orange truncate block"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-xs text-gray-500">
                                {item.quantity} x{' '}
                                {formatPrice(Number(item.unitPrice))}
                              </p>
                            </div>
                            <span className="text-sm font-medium">
                              {formatPrice(Number(item.totalPrice))}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Tracking */}
                      {order.shippingTrackingCode && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm">
                            <span className="text-gray-600">Seguimiento: </span>
                            <a
                              href={`https://www.gls-spain.es/es/seguimiento-envios/?match=${order.shippingTrackingCode}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-orange font-medium hover:underline"
                            >
                              {order.shippingTrackingCode}
                            </a>
                          </p>
                        </div>
                      )}

                      {/* Totals */}
                      <div className="border-t border-gray-200 pt-3 space-y-1 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Subtotal</span>
                          <span>{formatPrice(Number(order.subtotal))}</span>
                        </div>
                        {Number(order.canonDigitalTotal) > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Canon digital</span>
                            <span>
                              {formatPrice(Number(order.canonDigitalTotal))}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                          <span>IVA</span>
                          <span>{formatPrice(Number(order.ivaTotal))}</span>
                        </div>
                        {Number(order.recargoEquivalenciaTotal) > 0 && (
                          <div className="flex justify-between text-gray-600">
                            <span>Recargo equivalencia</span>
                            <span>
                              {formatPrice(
                                Number(order.recargoEquivalenciaTotal)
                              )}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                          <span>Envío</span>
                          <span>
                            {Number(order.shippingCost) === 0
                              ? 'Gratis'
                              : formatPrice(Number(order.shippingCost))}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-brand-brown-dark pt-1 border-t border-gray-200">
                          <span>Total</span>
                          <span>{formatPrice(Number(order.total))}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </main>
    <Footer />
    </>
  );
}
