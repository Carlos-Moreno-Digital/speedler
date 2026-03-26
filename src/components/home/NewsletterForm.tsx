'use client';

import { useState, type FormEvent } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStatus('success');
        setMessage('\u00a1Gracias! Te has suscrito correctamente.');
        setEmail('');
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus('error');
        setMessage(data.error || 'Ha ocurrido un error. Int\u00e9ntalo de nuevo.');
      }
    } catch {
      setStatus('error');
      setMessage('Error de conexi\u00f3n. Int\u00e9ntalo de nuevo.');
    }
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#3a3a3a] mb-3">
            No te pierdas nada
          </h2>
          <p className="text-[#777] text-sm mb-8">
            Suscr&iacute;bete a nuestra newsletter y recibe ofertas exclusivas,
            novedades y descuentos directamente en tu email.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              placeholder="Tu email"
              required
              className="flex-1 px-4 py-3 border border-[#ebebeb] rounded-[3px] text-[#3a3a3a] placeholder:text-[#999] focus:outline-none focus:ring-2 focus:ring-[#008060]/30 focus:border-[#008060] bg-white text-sm"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-3 bg-[#008060] text-white font-semibold rounded-[3px] hover:bg-[#006e52] transition-colors disabled:opacity-50 text-sm"
            >
              {status === 'loading' ? 'Enviando...' : 'Suscribirme'}
            </button>
          </form>

          {status === 'success' && (
            <p className="mt-4 text-[#008060] font-medium text-sm">{message}</p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-red-500 font-medium text-sm">{message}</p>
          )}

          <p className="mt-4 text-[#999] text-xs">
            Puedes darte de baja en cualquier momento. Sin spam, lo prometemos.
          </p>
        </div>
      </div>
    </section>
  );
}
