'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { HashLink, MomentumHeightLink } from '@/components/ui/HashLink';
import { formatFullTimestamp } from '@/lib/utils';
import { useZenonWebSocket } from '@/hooks/useZenonWebSocket';
import { zenonClient } from '@/lib/zenon-api';
import type { Momentum } from '@/types/zenon';

export default function MomentumsPage() {
  const { status, currentHeight } = useZenonWebSocket();
  const [momentums, setMomentums] = useState<Momentum[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetchMomentums = useCallback(async () => {
    setLoading(true);
    try {
      // First get the total count to calculate reverse pagination
      const frontier = await zenonClient.getFrontierMomentum();
      const total = frontier.height;
      setTotalCount(total);

      // Calculate which momentums to fetch (newest first)
      // For page 0, we want the newest momentums
      const startHeight = Math.max(total - (page * pageSize) - pageSize + 1, 1);
      const count = Math.min(pageSize, total - (page * pageSize));

      const result = await zenonClient.getMomentumsByHeight(startHeight, count);
      // Reverse to show newest first within the page
      setMomentums(result.list.reverse());
    } catch (error) {
      console.error('Failed to fetch momentums:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (status === 'connected') {
      fetchMomentums();
    }
  }, [status, fetchMomentums]);

  const columns = [
    {
      key: 'height',
      header: 'Momentum Height',
      render: (momentum: Momentum) => (
        <MomentumHeightLink height={momentum.height} className="font-medium" showCopy />
      ),
    },
    {
      key: 'hash',
      header: 'Momentum Hash',
      render: (momentum: Momentum) => (
        <HashLink hash={momentum.hash} truncateStart={28} type="momentum" linkToDetail showCopy />
      ),
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      render: (momentum: Momentum) => (
        <span className="text-gray-300">
          {formatFullTimestamp(momentum.timestamp)}
        </span>
      ),
    },
    {
      key: 'txCount',
      header: 'Transaction count',
      className: 'text-right',
      render: (momentum: Momentum) => (
        <span className="text-gray-300">
          {momentum.content?.length || 0}
        </span>
      ),
    },
  ];

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0); // Reset to first page
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header status={status} />
      <PageHeader
        title="Momentums List"
        subtitle={currentHeight > 0 ? `Current Height: ${currentHeight.toLocaleString()}` : undefined}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Pagination
          currentPage={page}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
        />

        <Table
          columns={columns}
          data={momentums}
          keyExtractor={(m) => m.hash}
          loading={loading}
          emptyMessage="No momentums found"
        />

        <Pagination
          currentPage={page}
          totalItems={totalCount}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </main>
    </div>
  );
}
