'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowLeft } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CarritoPage() {
  const {
    items,
    subtotal,
    canonDigitalTotal,
    total,
    removeItem,
    updateQuantity,
    clearCart,
    itemCount,
  } = useCart();

  const shippingEstimate = subtotal >= 100 ? 0 : 5.99;
  const grandTotal = Math.round((total + shippingEstimate) * 100) / 100;

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main>
          <div className="min-h-screen bg-bg">
            <div className="container-custom py-16 text-center">
              <FiShoppingBag className="w-20 h-20 mx-auto text-gray-300 mb-6" />
              <h1 className="text-2xl font-bold text-[#3a3a3a] mb-3">
                Tu carrito está vacío
              </h1>
              <p className="text-gray-500 mb-8">
                Añade productos desde nuestra tienda para empezar tu compra.
              </p>
              <Link href="/tienda" className="btn-primary">
                Ir a la tienda
              </Link>
            </div>
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-[#3a3a3a]">
            Carrito de compras
          </h1>
          <span className="text-gray-500">
            {itemCount} artículo{itemCount !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.productId} className="card p-4 sm:p-6">
                <div className="flex gap-4">
                  {/* Image */}
                  <Link
                    href={`/tienda/${item.slug}`}
                    className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="object-contain w-full h-full p-2"
                      />
                    ) : (
                      <svg
                        className="w-10 h-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    )}
                  </Link>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/tienda/${item.slug}`}
                      className="font-medium text-gray-800 hover:text-[#008060] transition-colors line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1">
                      {formatPrice(item.unitPrice)} / ud.
                    </p>
                    {item.canonDigital > 0 && (
                      <p className="text-xs text-gray-400">
                        Canon digital: {formatPrice(item.canonDigital)}
                      </p>
                    )}

                    {/* Quantity + actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                        >
                          <FiMinus className="w-3 h-3" />
                        </button>
                        <span className="px-3 py-2 text-sm font-medium min-w-[2.5rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.quantity + 1)
                          }
                          disabled={item.quantity >= item.stock}
                          className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors disabled:opacity-50"
                        >
                          <FiPlus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="font-bold text-[#3a3a3a]">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                          aria-label="Eliminar"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between">
              <Link
                href="/tienda"
                className="inline-flex items-center gap-2 text-sm text-[#008060] hover:text-[#006e52] font-medium"
              >
                <FiArrowLeft className="w-4 h-4" />
                Seguir comprando
              </Link>
              <button
                onClick={clearCart}
                className="text-sm text-gray-500 hover:text-red-500 transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h2 className="text-lg font-bold text-[#3a3a3a] mb-4">
                Resumen del pedido
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                {canonDigitalTotal > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Canon digital</span>
                    <span className="font-medium">
                      {formatPrice(canonDigitalTotal)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío estimado</span>
                  <span className="font-medium">
                    {shippingEstimate === 0 ? (
                      <span className="text-green-600">Gratis</span>
                    ) : (
                      formatPrice(shippingEstimate)
                    )}
                  </span>
                </div>
                {shippingEstimate > 0 && (
                  <p className="text-xs text-gray-400">
                    Envío gratuito en pedidos superiores a 100,00 EUR
                  </p>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-[#3a3a3a]">
                      Total
                    </span>
                    <span className="font-bold text-[#008060] text-lg">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">IVA incluido</p>
                </div>
              </div>

              <Link
                href="/checkout"
                className="btn-primary w-full mt-6 text-center"
              >
                Realizar pedido
              </Link>
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
