'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { FiCpu, FiHardDrive, FiMonitor, FiBox, FiZap, FiWind, FiShoppingCart, FiAlertTriangle, FiCheck, FiChevronDown } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface ComponentOption {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  salePrice: number;
  canonDigital: number;
  stock: number;
  socketType: string | null;
  ramType: string | null;
  formFactor: string | null;
  wattage: number | null;
  storageInterface: string | null;
  manufacturer?: { name: string } | null;
}

interface ComponentStep {
  id: string;
  label: string;
  icon: React.ReactNode;
  slug: string;
  required: boolean;
}

const STEPS: ComponentStep[] = [
  { id: 'cpu', label: 'Procesador', icon: <FiCpu />, slug: 'procesador', required: true },
  { id: 'motherboard', label: 'Placa Base', icon: <FiBox />, slug: 'placa-base', required: true },
  { id: 'ram', label: 'Memoria RAM', icon: <FiHardDrive />, slug: 'memoria-ram', required: true },
  { id: 'gpu', label: 'Tarjeta Gráfica', icon: <FiMonitor />, slug: 'tarjeta-grafica', required: false },
  { id: 'storage', label: 'Almacenamiento', icon: <FiHardDrive />, slug: 'almacenamiento', required: true },
  { id: 'psu', label: 'Fuente de Alimentación', icon: <FiZap />, slug: 'fuente-alimentacion', required: true },
  { id: 'case', label: 'Caja / Torre', icon: <FiBox />, slug: 'caja-torre', required: true },
  { id: 'cooler', label: 'Refrigeración', icon: <FiWind />, slug: 'refrigeracion', required: false },
];

type SelectedComponents = Record<string, ComponentOption | null>;

export default function ConfiguradorPcPage() {
  const { addItem } = useCart();
  const [activeStep, setActiveStep] = useState(0);
  const [selected, setSelected] = useState<SelectedComponents>(
    Object.fromEntries(STEPS.map((s) => [s.id, null]))
  );
  const [options, setOptions] = useState<Record<string, ComponentOption[]>>({});
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [compatWarnings, setCompatWarnings] = useState<string[]>([]);

  // Fetch options for active step
  useEffect(() => {
    const step = STEPS[activeStep];
    if (options[step.id]) return;

    setLoadingStep(step.id);
    fetch(`/api/configurator/components?type=${step.slug}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        setOptions((prev) => ({
          ...prev,
          [step.id]: Array.isArray(data) ? data : data.data || [],
        }));
      })
      .catch(() => {
        setOptions((prev) => ({ ...prev, [step.id]: [] }));
      })
      .finally(() => setLoadingStep(null));
  }, [activeStep, options]);

  // Check compatibility
  useEffect(() => {
    const warnings: string[] = [];
    const cpu = selected.cpu;
    const mobo = selected.motherboard;
    const ram = selected.ram;
    const psu = selected.psu;
    const caseComp = selected.case;

    if (cpu && mobo) {
      if (
        cpu.socketType &&
        mobo.socketType &&
        cpu.socketType !== mobo.socketType
      ) {
        warnings.push(
          `Socket incompatible: el procesador usa ${cpu.socketType} pero la placa base usa ${mobo.socketType}.`
        );
      }
    }

    if (mobo && ram) {
      if (mobo.ramType && ram.ramType && mobo.ramType !== ram.ramType) {
        warnings.push(
          `RAM incompatible: la placa base soporta ${mobo.ramType} pero la memoria es ${ram.ramType}.`
        );
      }
    }

    if (mobo && caseComp) {
      if (
        mobo.formFactor &&
        caseComp.formFactor &&
        mobo.formFactor !== caseComp.formFactor
      ) {
        warnings.push(
          `Factor de forma: la placa base es ${mobo.formFactor} y la caja es ${caseComp.formFactor}. Verifica la compatibilidad.`
        );
      }
    }

    // Power estimate
    const estimatedWatts =
      (cpu?.wattage || 65) +
      (selected.gpu?.wattage || 0) +
      50 + // RAM, storage, fans
      30; // Overhead
    if (psu && psu.wattage && psu.wattage < estimatedWatts) {
      warnings.push(
        `Potencia insuficiente: la configuración estima ~${estimatedWatts}W pero la fuente es de ${psu.wattage}W.`
      );
    }

    setCompatWarnings(warnings);
  }, [selected]);

  const totalPrice = Object.values(selected).reduce(
    (sum, comp) => sum + (comp?.salePrice || 0),
    0
  );

  const totalCanon = Object.values(selected).reduce(
    (sum, comp) => sum + (comp?.canonDigital || 0),
    0
  );

  function selectComponent(stepId: string, component: ComponentOption) {
    setSelected((prev) => ({
      ...prev,
      [stepId]: prev[stepId]?.id === component.id ? null : component,
    }));
  }

  function handleAddBuildToCart() {
    const selectedComponents = Object.entries(selected).filter(
      ([, comp]) => comp !== null
    );
    if (selectedComponents.length === 0) {
      toast.error('Selecciona al menos un componente');
      return;
    }

    for (const [, comp] of selectedComponents) {
      if (comp) {
        addItem({
          productId: comp.id,
          name: comp.name,
          slug: comp.slug,
          image: comp.image,
          unitPrice: comp.salePrice,
          canonDigital: comp.canonDigital,
          stock: comp.stock,
        });
      }
    }
    toast.success('Configuración añadida al carrito');
  }

  const currentStepOptions = options[STEPS[activeStep].id] || [];

  return (
    <>
    <Header />
    <main>
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#3a3a3a]">
            Configurador de PC
          </h1>
          <p className="text-gray-500 mt-2">
            Monta tu PC a medida seleccionando cada componente paso a paso.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Steps sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-4 sticky top-24">
              <h3 className="font-semibold text-[#3a3a3a] mb-4">
                Componentes
              </h3>
              <div className="space-y-1">
                {STEPS.map((step, i) => (
                  <button
                    key={step.id}
                    onClick={() => setActiveStep(i)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      i === activeStep
                        ? 'bg-[#008060] text-white'
                        : selected[step.id]
                          ? 'bg-green-50 text-green-700'
                          : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-lg">{step.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {step.label}
                        {step.required && !selected[step.id] && (
                          <span className="text-xs opacity-60 ml-1">*</span>
                        )}
                      </p>
                      {selected[step.id] && (
                        <p className="text-xs truncate opacity-75">
                          {selected[step.id]!.name}
                        </p>
                      )}
                    </div>
                    {selected[step.id] && (
                      <FiCheck className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              {/* Compatibility warnings */}
              {compatWarnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-700 mb-2">
                    <FiAlertTriangle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Advertencias de compatibilidad
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {compatWarnings.map((w, i) => (
                      <li key={i} className="text-xs text-yellow-600">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Running total */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-sm text-gray-500 mb-1">
                  <span>Subtotal</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                {totalCanon > 0 && (
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Canon digital</span>
                    <span>{formatPrice(totalCanon)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-[#3a3a3a]">
                  <span>Total</span>
                  <span className="text-[#008060]">
                    {formatPrice(totalPrice + totalCanon)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleAddBuildToCart}
                disabled={
                  Object.values(selected).every((v) => v === null)
                }
                className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
              >
                <FiShoppingCart className="w-4 h-4" />
                Añadir al carrito
              </button>
            </div>
          </div>

          {/* Component selection */}
          <div className="lg:col-span-3">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-2xl">{STEPS[activeStep].icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-[#3a3a3a]">
                    {STEPS[activeStep].label}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {STEPS[activeStep].required
                      ? 'Componente obligatorio'
                      : 'Componente opcional'}
                  </p>
                </div>
              </div>

              {loadingStep === STEPS[activeStep].id ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse border rounded-xl p-4">
                      <div className="bg-gray-200 h-24 rounded-lg mb-3" />
                      <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
                      <div className="bg-gray-200 h-4 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : currentStepOptions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No hay componentes disponibles para esta categoría.</p>
                  <p className="text-sm mt-2">
                    Esto puede deberse a que aún no se han importado productos
                    de este tipo.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {currentStepOptions.map((comp) => {
                    const isSelected =
                      selected[STEPS[activeStep].id]?.id === comp.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() =>
                          selectComponent(STEPS[activeStep].id, comp)
                        }
                        disabled={comp.stock === 0}
                        className={`text-left border-2 rounded-xl p-4 transition-all ${
                          isSelected
                            ? 'border-[#008060] bg-gray-50 ring-2 ring-[#008060]/20'
                            : comp.stock === 0
                              ? 'border-gray-200 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-[#008060]/50'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-20 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {comp.image ? (
                              <img
                                src={comp.image}
                                alt={comp.name}
                                className="object-contain w-full h-full p-1"
                              />
                            ) : (
                              <span className="text-2xl text-gray-300">
                                {STEPS[activeStep].icon}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {comp.manufacturer && (
                              <p className="text-xs text-gray-400 uppercase">
                                {comp.manufacturer.name}
                              </p>
                            )}
                            <p className="text-sm font-medium text-gray-800 line-clamp-2">
                              {comp.name}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="font-bold text-[#008060]">
                                {formatPrice(comp.salePrice)}
                              </span>
                              {comp.stock > 0 ? (
                                <span className="text-xs text-green-600">
                                  En stock
                                </span>
                              ) : (
                                <span className="text-xs text-red-500">
                                  Sin stock
                                </span>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <FiCheck className="w-5 h-5 text-[#008060] flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Step navigation */}
              <div className="flex justify-between mt-8">
                <button
                  onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                  disabled={activeStep === 0}
                  className="btn-secondary btn-sm disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setActiveStep(
                      Math.min(STEPS.length - 1, activeStep + 1)
                    )
                  }
                  disabled={activeStep === STEPS.length - 1}
                  className="btn-primary btn-sm disabled:opacity-50"
                >
                  Siguiente
                </button>
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
