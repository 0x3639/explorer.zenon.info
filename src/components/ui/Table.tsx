'use client';

import React, { useState, memo } from 'react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  /** Label to show on mobile card view. If not provided, uses header. Set to false to hide on mobile. */
  mobileLabel?: string | false;
  /** If true, this column is the primary identifier shown at top of card */
  mobilePrimary?: boolean;
  render: (item: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  emptyMessage?: string;
  loading?: boolean;
}

function TableComponent<T>({
  columns,
  data,
  keyExtractor,
  onSort,
  emptyMessage = 'No data available',
  loading = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    const column = columns.find((c) => c.key === key);
    if (!column?.sortable || !onSort) return;

    const newDirection = sortKey === key && sortDirection === 'desc' ? 'asc' : 'desc';
    setSortKey(key);
    setSortDirection(newDirection);
    onSort(key, newDirection);
  };

  // Separate primary column from others for mobile card view
  const primaryColumn = columns.find((col) => col.mobilePrimary);
  const secondaryColumns = columns.filter(
    (col) => !col.mobilePrimary && col.mobileLabel !== false
  );

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
        <div className="animate-pulse">
          {/* Desktop loading skeleton */}
          <div className="hidden md:block">
            <div className="h-12 bg-[#2a2a2a] rounded-t-lg" />
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 border-t border-[#2a2a2a]">
                <div className="flex items-center gap-4 p-4">
                  <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
                  <div className="h-4 bg-[#2a2a2a] rounded w-1/3" />
                  <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
          {/* Mobile loading skeleton */}
          <div className="md:hidden space-y-3 p-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-[#161616] rounded-lg p-4 space-y-3">
                <div className="h-5 bg-[#2a2a2a] rounded w-3/4" />
                <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
                <div className="h-4 bg-[#2a2a2a] rounded w-2/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] px-4 py-8 text-center text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2a2a2a]">
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => handleSort(column.key)}
                  className={`text-left px-4 py-3 text-sm font-medium text-gray-400 ${
                    column.sortable ? 'cursor-pointer hover:text-white select-none' : ''
                  } ${column.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {column.sortable && (
                      <span className="inline-flex flex-col">
                        <svg
                          className={`w-3 h-3 ${
                            sortKey === column.key && sortDirection === 'asc'
                              ? 'text-[#7fff00]'
                              : 'text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 3l-7 7h14l-7-7z" />
                        </svg>
                        <svg
                          className={`w-3 h-3 -mt-1 ${
                            sortKey === column.key && sortDirection === 'desc'
                              ? 'text-[#7fff00]'
                              : 'text-gray-600'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 17l7-7H3l7 7z" />
                        </svg>
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={`border-t border-[#2a2a2a] table-row-hover ${
                  index % 2 === 1 ? 'bg-[#161616]' : ''
                }`}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 text-sm ${column.className || ''}`}
                  >
                    {column.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-[#2a2a2a]">
        {data.map((item) => (
          <div key={keyExtractor(item)} className="p-4 space-y-3">
            {/* Primary field (hash/identifier) at top */}
            {primaryColumn && (
              <div className="pb-2 border-b border-[#2a2a2a]">
                {primaryColumn.render(item)}
              </div>
            )}

            {/* Secondary fields in grid */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              {secondaryColumns.map((column) => (
                <div key={column.key} className="min-w-0">
                  <div className="text-gray-500 text-xs mb-1">
                    {column.mobileLabel || column.header}
                  </div>
                  <div className="text-sm truncate">{column.render(item)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Memoize the Table component to prevent unnecessary re-renders
export const Table = memo(TableComponent) as typeof TableComponent;
