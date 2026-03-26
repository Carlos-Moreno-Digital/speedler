// Canon digital rates for Spain (2024)
// These are the standard rates per product type
export const CANON_DIGITAL_RATES: Record<string, number> = {
  'discos_duros': 5.45,
  'ssd': 5.45,
  'memorias_usb': 0.24,
  'tarjetas_memoria': 0.24,
  'cd_grabable': 0.08,
  'dvd_grabable': 0.18,
  'bluray_grabable': 0.30,
  'telefonos_moviles': 1.10,
  'tablets': 3.15,
  'portatiles': 5.45,
  'impresoras': 5.25,
  'reproductores': 3.15,
};

export function getCanonDigitalFromTasas(tasasValue: number): number {
  return Math.round(tasasValue * 100) / 100;
}

export function calculateCanonDigitalForCart(
  items: { canonDigital: number; quantity: number }[]
): number {
  return items.reduce(
    (total, item) => total + item.canonDigital * item.quantity,
    0
  );
}

export function formatCanonDigital(amount: number): string {
  if (amount <= 0) return '';
  return `Canon digital: ${new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)}`;
}
