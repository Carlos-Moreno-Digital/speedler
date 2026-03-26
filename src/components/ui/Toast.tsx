'use client';

import toast, { Toaster as HotToaster } from 'react-hot-toast';

export { toast };

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: '#fff',
          color: '#5B2C0E',
          borderRadius: '0.75rem',
          padding: '12px 16px',
          fontSize: '0.875rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
          border: '1px solid #F5DEB3',
        },
        success: {
          iconTheme: {
            primary: '#E88B2D',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#DC2626',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
