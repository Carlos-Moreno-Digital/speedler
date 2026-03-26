'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Category {
  name: string;
  slug: string;
  icon?: string;
}

interface NavbarProps {
  categories: Category[];
  activeCategory?: string;
  className?: string;
}

export default function Navbar({ categories, activeCategory, className }: NavbarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories]);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (categories.length === 0) return null;

  return (
    <nav
      className={cn(
        'relative border-b border-gray-200 bg-white',
        className,
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {/* Left scroll button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 z-10 flex h-full items-center bg-gradient-to-r from-white via-white/90 to-transparent pr-4 pl-0"
              aria-label="Desplazar izquierda"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-brand-cream">
                <FiChevronLeft className="h-4 w-4 text-brand-brown-dark" />
              </span>
            </button>
          )}

          {/* Categories */}
          <div
            ref={scrollRef}
            className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <Link
              href="/tienda"
              className={cn(
                'flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200',
                !activeCategory
                  ? 'bg-brand-orange text-white'
                  : 'text-gray-600 hover:bg-brand-cream hover:text-brand-brown-dark',
              )}
            >
              Todos
            </Link>

            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/tienda?category=${cat.slug}`}
                className={cn(
                  'flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-200',
                  activeCategory === cat.slug
                    ? 'bg-brand-orange text-white'
                    : 'text-gray-600 hover:bg-brand-cream hover:text-brand-brown-dark',
                )}
              >
                {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
                {cat.name}
              </Link>
            ))}
          </div>

          {/* Right scroll button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 z-10 flex h-full items-center bg-gradient-to-l from-white via-white/90 to-transparent pl-4 pr-0"
              aria-label="Desplazar derecha"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm transition-colors hover:bg-brand-cream">
                <FiChevronRight className="h-4 w-4 text-brand-brown-dark" />
              </span>
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
