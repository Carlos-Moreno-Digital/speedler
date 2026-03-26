'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FiChevronLeft, FiChevronRight, FiZoomIn, FiX } from 'react-icons/fi';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  className?: string;
}

export default function ProductGallery({
  images,
  productName,
  className,
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainImageRef = useRef<HTMLDivElement>(null);

  const displayImages = images.length > 0 ? images : ['/placeholder-product.png'];

  const goTo = (index: number) => {
    if (index < 0) index = displayImages.length - 1;
    if (index >= displayImages.length) index = 0;
    setActiveIndex(index);
    setZoomed(false);
  };

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!zoomed || !mainImageRef.current) return;
      const rect = mainImageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setZoomPosition({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
    },
    [zoomed],
  );

  const handleMainClick = () => {
    if (zoomed) {
      setZoomed(false);
    } else {
      setZoomed(true);
    }
  };

  return (
    <>
      <div className={cn('flex flex-col gap-3', className)}>
        {/* Main image */}
        <div
          ref={mainImageRef}
          className="group relative aspect-square overflow-hidden rounded-xl border border-gray-200 bg-bg-alt"
          onClick={handleMainClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setZoomed(false)}
        >
          <Image
            src={displayImages[activeIndex]}
            alt={`${productName} - Imagen ${activeIndex + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              'object-contain p-4 transition-transform duration-300',
              zoomed ? 'scale-[2.5] cursor-zoom-out' : 'cursor-zoom-in',
            )}
            style={
              zoomed
                ? {
                    transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                  }
                : undefined
            }
            priority
          />

          {/* Zoom hint */}
          {!zoomed && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1.5 text-xs font-medium text-gray-600 opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100">
              <FiZoomIn className="h-3.5 w-3.5" />
              Zoom
            </div>
          )}

          {/* Navigation arrows */}
          {displayImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-white opacity-0 group-hover:opacity-100"
                aria-label="Imagen anterior"
              >
                <FiChevronLeft className="h-4 w-4 text-brand-brown-dark" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(activeIndex + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-white opacity-0 group-hover:opacity-100"
                aria-label="Siguiente imagen"
              >
                <FiChevronRight className="h-4 w-4 text-brand-brown-dark" />
              </button>
            </>
          )}

          {/* Fullscreen button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className="absolute top-3 right-3 rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-white opacity-0 group-hover:opacity-100"
            aria-label="Ver en pantalla completa"
          >
            <svg className="h-4 w-4 text-brand-brown-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>

          {/* Image counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-3 left-3 rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium text-gray-600 backdrop-blur-sm">
              {activeIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {displayImages.map((img, index) => (
              <button
                key={index}
                onClick={() => goTo(index)}
                className={cn(
                  'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 bg-bg-alt transition-colors',
                  index === activeIndex
                    ? 'border-brand-orange ring-1 ring-brand-orange/30'
                    : 'border-gray-200 hover:border-brand-peach',
                )}
              >
                <Image
                  src={img}
                  alt={`${productName} - Miniatura ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-contain p-1"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            aria-label="Cerrar"
          >
            <FiX className="h-6 w-6" />
          </button>

          <button
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Imagen anterior"
          >
            <FiChevronLeft className="h-6 w-6" />
          </button>

          <div className="relative h-[80vh] w-[80vw]">
            <Image
              src={displayImages[activeIndex]}
              alt={`${productName} - Imagen ${activeIndex + 1}`}
              fill
              sizes="80vw"
              className="object-contain"
            />
          </div>

          <button
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20"
            aria-label="Siguiente imagen"
          >
            <FiChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm font-medium text-white/70">
            {activeIndex + 1} / {displayImages.length}
          </div>
        </div>
      )}
    </>
  );
}
