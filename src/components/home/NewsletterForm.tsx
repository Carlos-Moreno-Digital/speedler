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
    <section className="py-16 gradient-brand">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-3">
            No te pierdas nada
          </h2>
          <p className="text-white/80 mb-8">
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
              className="flex-1 px-5 py-3.5 rounded-lg text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-8 py-3.5 bg-brand-brown-dark text-white font-semibold rounded-lg hover:bg-brand-brown-medium transition-colors disabled:opacity-50"
            >
              {status === 'loading' ? 'Enviando...' : 'Suscribirme'}
            </button>
          </form>

          {status === 'success' && (
            <p className="mt-4 text-green-200 font-medium animate-fade-in">{message}</p>
          )}
          {status === 'error' && (
            <p className="mt-4 text-red-200 font-medium animate-fade-in">{message}</p>
          )}

          <p className="mt-4 text-white/50 text-xs">
            Puedes darte de baja en cualquier momento. Sin spam, lo prometemos.
          </p>
        </div>
      </div>
    </section>
  );
}
