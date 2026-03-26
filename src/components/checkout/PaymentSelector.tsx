'use client';

interface PaymentSelectorProps {
  selected: string;
  onSelect: (method: string) => void;
}

const PAYMENT_METHODS = [
  {
    id: 'REDSYS',
    name: 'Tarjeta de crédito/débito',
    description: 'Pago seguro con Visa, Mastercard o similar',
    icon: '💳',
  },
  {
    id: 'SEQURA',
    name: 'Pago aplazado',
    description: 'Paga en cómodas cuotas con Sequra',
    icon: '📅',
  },
  {
    id: 'TRANSFER',
    name: 'Transferencia bancaria',
    description: 'Realiza una transferencia a nuestra cuenta',
    icon: '🏦',
  },
];

export default function PaymentSelector({ selected, onSelect }: PaymentSelectorProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h2 className="text-lg font-bold text-brand-brown-dark mb-4">Método de pago</h2>

      <div className="space-y-3">
        {PAYMENT_METHODS.map((method) => (
          <label
            key={method.id}
            className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
              selected === method.id
                ? 'border-brand-orange bg-brand-cream/30'
                : 'border-gray-200 hover:border-brand-peach'
            }`}
          >
            <input
              type="radio"
              name="payment"
              value={method.id}
              checked={selected === method.id}
              onChange={() => onSelect(method.id)}
              className="text-brand-orange focus:ring-brand-orange"
            />
            <span className="text-2xl">{method.icon}</span>
            <div>
              <p className="font-medium text-brand-brown-dark">{method.name}</p>
              <p className="text-sm text-gray-500">{method.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
