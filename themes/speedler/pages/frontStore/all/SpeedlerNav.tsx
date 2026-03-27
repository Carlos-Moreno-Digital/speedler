import React from 'react';

export default function SpeedlerNav() {
  const links = [
    { label: 'Tienda', url: '/search' },
    { label: 'Procesadores', url: '/procesadores' },
    { label: 'Memorias', url: '/memorias' },
    { label: 'Portátiles', url: '/search?keyword=portatil' },
    { label: 'Ordenadores', url: '/ordenadores' },
    { label: 'Redes', url: '/search?keyword=switch' },
    { label: 'Gaming', url: '/sillas-gaming' },
    { label: 'Sobre nosotros', url: '/page/sobre-nosotros' },
    { label: 'Contacto', url: '/page/contacto' },
  ];

  return (
    <nav style={{ borderTop: '3px solid #E8842A', borderBottom: '1px solid #f1f2f3', background: '#fff' }}>
      <div className="page-width">
        <div className="flex items-center justify-center gap-1 py-0 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {links.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="text-sm font-medium transition-colors whitespace-nowrap"
              style={{ color: '#5B2C0E', padding: '10px 14px', display: 'block' }}
              onMouseOver={(e: any) => { e.target.style.color = '#E8842A'; e.target.style.backgroundColor = '#FFF8F0'; }}
              onMouseOut={(e: any) => { e.target.style.color = '#5B2C0E'; e.target.style.backgroundColor = 'transparent'; }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

export const layout = {
  areaId: 'headerBottom',
  sortOrder: 10
};
