'use client';

import { cn, getPageRange } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = getPageRange(currentPage, totalPages);
  const showStartEllipsis = pages[0] > 2;
  const showEndEllipsis = pages[pages.length - 1] < totalPages - 1;

  const baseBtn =
    'inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200';
  const activeBtn = 'bg-brand-orange text-white shadow-sm';
  const inactiveBtn = 'text-gray-600 hover:bg-brand-cream hover:text-brand-brown-dark';
  const disabledBtn = 'pointer-events-none opacity-40';

  return (
    <nav aria-label="Paginaci&oacute;n" className={cn('flex items-center justify-center gap-1', className)}>
      {/* Previous */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className={cn(baseBtn, inactiveBtn, currentPage <= 1 && disabledBtn)}
        aria-label="P&aacute;gina anterior"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* First page */}
      {pages[0] > 1 && (
        <button onClick={() => onPageChange(1)} className={cn(baseBtn, inactiveBtn)}>
          1
        </button>
      )}

      {showStartEllipsis && (
        <span className="inline-flex h-10 w-10 items-center justify-center text-gray-400">
          ...
        </span>
      )}

      {/* Page numbers */}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={cn(baseBtn, page === currentPage ? activeBtn : inactiveBtn)}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}

      {showEndEllipsis && (
        <span className="inline-flex h-10 w-10 items-center justify-center text-gray-400">
          ...
        </span>
      )}

      {/* Last page */}
      {pages[pages.length - 1] < totalPages && (
        <button onClick={() => onPageChange(totalPages)} className={cn(baseBtn, inactiveBtn)}>
          {totalPages}
        </button>
      )}

      {/* Next */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className={cn(baseBtn, inactiveBtn, currentPage >= totalPages && disabledBtn)}
        aria-label="P&aacute;gina siguiente"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
