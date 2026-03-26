'use client';

import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend } from 'react-icons/fi';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function ContactoPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Por favor, rellena todos los campos');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success('Mensaje enviado correctamente. Te responderemos pronto.');
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Error al enviar el mensaje');
      }
    } catch {
      toast.error('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <>
    <Header />
    <main>
    <div className="min-h-screen bg-bg">
      <div className="container-custom py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-brand-brown-dark">Contacto</h1>
          <p className="text-gray-500 mt-2 max-w-xl mx-auto">
            ¿Tienes alguna pregunta o necesitas ayuda? No dudes en contactarnos.
            Te responderemos lo antes posible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact form */}
          <div className="lg:col-span-2">
            <div className="card p-6 sm:p-8">
              <h2 className="text-xl font-bold text-brand-brown-dark mb-6">
                Envíanos un mensaje
              </h2>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Asunto
                  </label>
                  <select
                    value={form.subject}
                    onChange={(e) => updateField('subject', e.target.value)}
                    className="input-field"
                    required
                  >
                    <option value="">Selecciona un asunto</option>
                    <option value="consulta">Consulta general</option>
                    <option value="pedido">Sobre un pedido</option>
                    <option value="devolucion">Devoluciones</option>
                    <option value="soporte">Soporte técnico</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className="input-field"
                    rows={5}
                    placeholder="Escribe tu mensaje aquí..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiSend className="w-4 h-4" />
                  {loading ? 'Enviando...' : 'Enviar mensaje'}
                </button>
              </form>
            </div>
          </div>

          {/* Company info */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="font-bold text-brand-brown-dark mb-4">
                Información de contacto
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <FiMail className="w-5 h-5 text-brand-orange mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <a
                      href="mailto:info@speedler.es"
                      className="text-sm text-brand-orange hover:text-brand-orange-deep"
                    >
                      info@speedler.es
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiPhone className="w-5 h-5 text-brand-orange mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Teléfono</p>
                    <a
                      href="tel:+34900000000"
                      className="text-sm text-brand-orange hover:text-brand-orange-deep"
                    >
                      900 000 000
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiMapPin className="w-5 h-5 text-brand-orange mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Dirección
                    </p>
                    <p className="text-sm text-gray-600">
                      Calle Ejemplo 123
                      <br />
                      28001 Madrid, España
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <FiClock className="w-5 h-5 text-brand-orange mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Horario</p>
                    <p className="text-sm text-gray-600">
                      Lun - Vie: 9:00 - 18:00
                      <br />
                      Sáb: 10:00 - 14:00
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map placeholder */}
            <div className="card overflow-hidden">
              <div className="bg-gray-200 h-64 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <FiMapPin className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">
                    Mapa embebido
                    <br />
                    <span className="text-xs">
                      (Google Maps se cargará aquí)
                    </span>
                  </p>
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
