'use client';

import React, { useState, memo } from 'react';

interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
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

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
        <div className="animate-pulse">
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
      </div>
    );
  }

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
      <div className="overflow-x-auto">
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
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Memoize the Table component to prevent unnecessary re-renders
export const Table = memo(TableComponent) as typeof TableComponent;
