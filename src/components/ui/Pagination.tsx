'use client';

interface PaginationProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = currentPage * pageSize + 1;
  const end = Math.min((currentPage + 1) * pageSize, totalItems);

  const canGoPrev = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 sm:gap-6 py-4 px-2 text-sm text-gray-400">
      {/* Top row on mobile: Page size + Page info */}
      <div className="flex items-center justify-between sm:justify-end sm:gap-6">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline">Items per page:</span>
            <span className="sm:hidden">Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded px-2 py-1.5 text-white focus:outline-none focus:border-[#7fff00]"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page info */}
        <span className="whitespace-nowrap">
          {start} – {end} of {totalItems.toLocaleString()}
        </span>
      </div>

      {/* Bottom row on mobile: Navigation buttons */}
      <div className="flex items-center justify-center sm:justify-end gap-1">
        {/* First page */}
        <button
          onClick={() => onPageChange(0)}
          disabled={!canGoPrev}
          className="p-2 sm:p-1 rounded hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        {/* Previous page */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          className="p-2 sm:p-1 rounded hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page indicator (mobile) */}
        <span className="px-3 py-1 text-white font-medium sm:hidden">
          {currentPage + 1} / {totalPages || 1}
        </span>

        {/* Next page */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="p-2 sm:p-1 rounded hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Last page */}
        <button
          onClick={() => onPageChange(totalPages - 1)}
          disabled={!canGoNext}
          className="p-2 sm:p-1 rounded hover:bg-[#2a2a2a] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
