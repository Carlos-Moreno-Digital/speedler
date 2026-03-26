import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Speedler - Tu tienda de informática',
    template: '%s | Speedler',
  },
  description:
    'Tienda online de componentes informáticos, periféricos y electrónica. Configura tu PC a medida con nuestro configurador.',
  keywords: [
    'componentes informáticos',
    'tienda online',
    'configurador PC',
    'hardware',
    'speedler',
  ],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'Speedler - Tu tienda de informática',
    description:
      'Componentes informáticos, periféricos y electrónica al mejor precio.',
    url: process.env.NEXT_PUBLIC_SITE_URL || 'https://speedler.es',
    siteName: 'Speedler',
    locale: 'es_ES',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="font-sans">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#5B2C0E',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#E88B2D',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
