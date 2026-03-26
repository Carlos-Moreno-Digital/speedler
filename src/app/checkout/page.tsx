'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import type { CheckoutData } from '@/types';
import toast from 'react-hot-toast';
import { FiCheck, FiChevronRight } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const STEPS = [
  'Dirección de envío',
  'Facturación',
  'Método de pago',
  'Resumen',
] as const;

const emptyAddress = {
  street: '',
  city: '',
  province: '',
  postalCode: '',
  country: 'ES',
};

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, canonDigitalTotal, total, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckoutData>({
    shippingAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
    paymentMethod: 'REDSYS',
    notes: '',
    useSameAddress: true,
  });

  // Tax calculations
  const ivaRate = 21;
  const ivaAmount = Math.round(subtotal * (ivaRate / 100) * 100) / 100;
  const [isRecargoEquivalencia, setIsRecargoEquivalencia] = useState(false);
  const reRate = 5.2;
  const recargoAmount = isRecargoEquivalencia
    ? Math.round(subtotal * (reRate / 100) * 100) / 100
    : 0;
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  const grandTotal =
    Math.round(
      (subtotal + canonDigitalTotal + ivaAmount + recargoAmount + shippingCost) *
        100
    ) / 100;

  function updateShipping(field: string, value: string) {
    setData((prev) => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, [field]: value },
    }));
  }

  function updateBilling(field: string, value: string) {
    setData((prev) => ({
      ...prev,
      billingAddress: { ...prev.billingAddress!, [field]: value },
    }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: {
        const a = data.shippingAddress;
        return !!(a.street && a.city && a.province && a.postalCode);
      }
      case 1:
        if (data.useSameAddress) return true;
        const b = data.billingAddress!;
        return !!(b.street && b.city && b.province && b.postalCode);
      case 2:
        return !!data.paymentMethod;
      default:
        return true;
    }
  }

  async function handleSubmitOrder() {
    setLoading(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            canonDigital: i.canonDigital,
          })),
          isRecargoEquivalencia,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Error al procesar el pedido');
      }

      const order = await res.json();
      clearCart();
      toast.success('Pedido realizado con éxito');

      if (data.paymentMethod === 'REDSYS' && order.paymentUrl) {
        window.location.href = order.paymentUrl;
      } else {
        router.push(`/cuenta/pedidos?success=${order.orderNumber}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Error al procesar el pedido'
      );
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <>
        <Header />
        <main>
          <div className="min-h-screen bg-bg">
            <div className="container-custom py-16 text-center">
              <h1 className="text-2xl font-bold text-brand-brown-dark mb-4">
                No hay productos en el carrito
              </h1>
              <a href="/tienda" className="btn-primary">
                Ir a la tienda
              </a>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const AddressForm = ({
    address,
    onChange,
  }: {
    address: typeof emptyAddress;
    onChange: (field: string, value: string) => void;
  }) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <input
          type="text"
          value={address.street}
          onChange={(e) => onChange('street', e.target.value)}
          className="input-field"
          placeholder="Calle, número, piso..."
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ciudad
        </label>
        <input
          type="text"
          value={address.city}
          onChange={(e) => onChange('city', e.target.value)}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Provincia
        </label>
        <input
          type="text"
          value={address.province}
          onChange={(e) => onChange('province', e.target.value)}
          className="input-field"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Código postal
        </label>
        <input
          type="text"
          value={address.postalCode}
          onChange={(e) => onChange('postalCode', e.target.value)}
          className="input-field"
          maxLength={5}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          País
        </label>
        <select
          value={address.country}
          onChange={(e) => onChange('country', e.target.value)}
          className="input-field"
        >
          <option value="ES">España</option>
          <option value="PT">Portugal</option>
          <option value="FR">Francia</option>
        </select>
      </div>
    </div>
  );

  return (
    <>
    <Header />
    <main>
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-8">
        <h1 className="text-3xl font-bold text-brand-brown-dark mb-8">
          Checkout
        </h1>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  i === step
                    ? 'bg-brand-orange text-white'
                    : i < step
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-400'
                }`}
              >
                {i < step ? (
                  <FiCheck className="w-4 h-4" />
                ) : (
                  <span>{i + 1}</span>
                )}
                <span className="hidden sm:inline">{label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <FiChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="card p-6 sm:p-8">
              {/* Step 0: Shipping */}
              {step === 0 && (
                <div>
                  <h2 className="text-xl font-bold text-brand-brown-dark mb-6">
                    Dirección de envío
                  </h2>
                  <AddressForm
                    address={data.shippingAddress}
                    onChange={updateShipping}
                  />
                </div>
              )}

              {/* Step 1: Billing */}
              {step === 1 && (
                <div>
                  <h2 className="text-xl font-bold text-brand-brown-dark mb-6">
                    Dirección de facturación
                  </h2>
                  <label className="flex items-center gap-3 mb-6 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={data.useSameAddress}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          useSameAddress: e.target.checked,
                        }))
                      }
                      className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                    />
                    <span className="text-sm text-gray-700">
                      Usar la misma dirección de envío
                    </span>
                  </label>
                  {!data.useSameAddress && (
                    <AddressForm
                      address={data.billingAddress!}
                      onChange={updateBilling}
                    />
                  )}

                  <div className="mt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecargoEquivalencia}
                        onChange={(e) =>
                          setIsRecargoEquivalencia(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                      />
                      <span className="text-sm text-gray-700">
                        Soy autónomo/empresa en régimen de recargo de
                        equivalencia
                      </span>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 2: Payment */}
              {step === 2 && (
                <div>
                  <h2 className="text-xl font-bold text-brand-brown-dark mb-6">
                    Método de pago
                  </h2>
                  <div className="space-y-3">
                    {[
                      {
                        id: 'REDSYS' as const,
                        label: 'Tarjeta de crédito/débito',
                        desc: 'Pago seguro con Visa, MasterCard, etc.',
                      },
                      {
                        id: 'SEQURA' as const,
                        label: 'Sequra - Pago aplazado',
                        desc: 'Paga en cómodas cuotas sin intereses.',
                      },
                      {
                        id: 'TRANSFER' as const,
                        label: 'Transferencia bancaria',
                        desc: 'Realiza una transferencia a nuestra cuenta bancaria.',
                      },
                    ].map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                          data.paymentMethod === method.id
                            ? 'border-brand-orange bg-brand-cream/30'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method.id}
                          checked={data.paymentMethod === method.id}
                          onChange={(e) =>
                            setData((prev) => ({
                              ...prev,
                              paymentMethod: e.target.value as CheckoutData['paymentMethod'],
                            }))
                          }
                          className="mt-1 w-4 h-4 border-gray-300 text-brand-orange focus:ring-brand-orange"
                        />
                        <div>
                          <p className="font-medium text-gray-800">
                            {method.label}
                          </p>
                          <p className="text-sm text-gray-500">{method.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas del pedido (opcional)
                    </label>
                    <textarea
                      value={data.notes}
                      onChange={(e) =>
                        setData((prev) => ({ ...prev, notes: e.target.value }))
                      }
                      className="input-field"
                      rows={3}
                      placeholder="Instrucciones especiales de entrega..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Summary */}
              {step === 3 && (
                <div>
                  <h2 className="text-xl font-bold text-brand-brown-dark mb-6">
                    Resumen del pedido
                  </h2>

                  {/* Address summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Envío
                      </h3>
                      <p className="text-sm text-gray-600">
                        {data.shippingAddress.street}
                        <br />
                        {data.shippingAddress.postalCode}{' '}
                        {data.shippingAddress.city}
                        <br />
                        {data.shippingAddress.province}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        Facturación
                      </h3>
                      {data.useSameAddress ? (
                        <p className="text-sm text-gray-500 italic">
                          Igual que la dirección de envío
                        </p>
                      ) : (
                        <p className="text-sm text-gray-600">
                          {data.billingAddress!.street}
                          <br />
                          {data.billingAddress!.postalCode}{' '}
                          {data.billingAddress!.city}
                          <br />
                          {data.billingAddress!.province}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Payment method */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">
                      Pago
                    </h3>
                    <p className="text-sm text-gray-600">
                      {data.paymentMethod === 'REDSYS'
                        ? 'Tarjeta de crédito/débito'
                        : data.paymentMethod === 'SEQURA'
                          ? 'Sequra - Pago aplazado'
                          : 'Transferencia bancaria'}
                    </p>
                  </div>

                  {/* Items */}
                  <div className="space-y-3 mb-6">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between py-2 border-b border-gray-100"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-800">
                            {item.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            x{item.quantity}
                          </span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Tax breakdown */}
                  <div className="bg-brand-cream/30 rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Base imponible</span>
                      <span>{formatPrice(subtotal)}</span>
                    </div>
                    {canonDigitalTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Canon digital</span>
                        <span>{formatPrice(canonDigitalTotal)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>IVA ({ivaRate}%)</span>
                      <span>{formatPrice(ivaAmount)}</span>
                    </div>
                    {isRecargoEquivalencia && (
                      <div className="flex justify-between text-brand-brown-dark">
                        <span>Recargo equivalencia ({reRate}%)</span>
                        <span>{formatPrice(recargoAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envío</span>
                      <span>
                        {shippingCost === 0 ? (
                          <span className="text-green-600">Gratis</span>
                        ) : (
                          formatPrice(shippingCost)
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold text-base border-t border-brand-peach/30 pt-2">
                      <span>Total</span>
                      <span className="text-brand-orange">
                        {formatPrice(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                {step > 0 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="btn-secondary btn-sm"
                  >
                    Anterior
                  </button>
                ) : (
                  <div />
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    disabled={!canProceed()}
                    className="btn-primary"
                  >
                    Continuar
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? 'Procesando...' : 'Confirmar pedido'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-24">
              <h3 className="font-bold text-brand-brown-dark mb-4">
                Tu pedido
              </h3>
              <div className="space-y-2 text-sm">
                {items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex justify-between text-gray-600"
                  >
                    <span className="truncate mr-2">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="flex-shrink-0">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-brand-orange">
                      {formatPrice(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
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
