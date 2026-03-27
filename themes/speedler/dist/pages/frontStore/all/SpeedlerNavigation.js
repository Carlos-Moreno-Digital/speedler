import React from 'react';

export default function SpeedlerNavigation() {
  const links = [
    { label: 'Tienda', url: '/search' },
    { label: 'Procesadores', url: '/procesadores' },
    { label: 'Memorias', url: '/memorias' },
    { label: 'Ordenadores', url: '/ordenadores' },
    { label: 'Sobre nosotros', url: '/page/sobre-nosotros' },
    { label: 'Contacto', url: '/page/contacto' },
  ];

  return React.createElement('nav', { className: 'page-width', style: { borderBottom: '1px solid #f1f2f3' } },
    React.createElement('div', { className: 'flex items-center justify-center gap-6 py-2' },
      links.map(function(link) {
        return React.createElement('a', {
          key: link.url,
          href: link.url,
          className: 'text-sm font-medium hover:text-primary transition-colors',
          style: { color: '#3a3a3a' }
        }, link.label);
      })
    )
  );
}

export const layout = {
  areaId: 'headerBottom',
  sortOrder: 10
};
