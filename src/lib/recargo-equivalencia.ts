// Recargo de equivalencia rates in Spain
// Applied to retail businesses (comercios minoristas) under this tax regime

export const RE_RATES = {
  // General IVA 21% -> RE 5.2%
  GENERAL: { ivaRate: 21, reRate: 5.2 },
  // Reduced IVA 10% -> RE 1.4%
  REDUCED: { ivaRate: 10, reRate: 1.4 },
  // Super-reduced IVA 4% -> RE 0.5%
  SUPER_REDUCED: { ivaRate: 4, reRate: 0.5 },
};

export function calculateRecargoEquivalencia(
  netPrice: number,
  ivaRate: number = 21
): number {
  let reRate = RE_RATES.GENERAL.reRate;

  if (ivaRate === 10) {
    reRate = RE_RATES.REDUCED.reRate;
  } else if (ivaRate === 4) {
    reRate = RE_RATES.SUPER_REDUCED.reRate;
  }

  return Math.round(netPrice * (reRate / 100) * 100) / 100;
}

export function calculateIVA(netPrice: number, ivaRate: number = 21): number {
  return Math.round(netPrice * (ivaRate / 100) * 100) / 100;
}

export interface TaxCalculation {
  subtotal: number;
  canonDigitalTotal: number;
  ivaRate: number;
  ivaAmount: number;
  recargoEquivalenciaRate: number;
  recargoEquivalenciaAmount: number;
  shippingCost: number;
  total: number;
}

export function calculateTaxes(
  subtotal: number,
  canonDigitalTotal: number,
  shippingCost: number,
  isRecargoEquivalencia: boolean,
  ivaRate: number = 21
): TaxCalculation {
  const ivaAmount = calculateIVA(subtotal, ivaRate);
  const recargoEquivalenciaAmount = isRecargoEquivalencia
    ? calculateRecargoEquivalencia(subtotal, ivaRate)
    : 0;

  const total =
    subtotal +
    canonDigitalTotal +
    ivaAmount +
    recargoEquivalenciaAmount +
    shippingCost;

  return {
    subtotal,
    canonDigitalTotal,
    ivaRate,
    ivaAmount,
    recargoEquivalenciaRate: isRecargoEquivalencia
      ? ivaRate === 10
        ? RE_RATES.REDUCED.reRate
        : ivaRate === 4
          ? RE_RATES.SUPER_REDUCED.reRate
          : RE_RATES.GENERAL.reRate
      : 0,
    recargoEquivalenciaAmount,
    shippingCost,
    total: Math.round(total * 100) / 100,
  };
}
