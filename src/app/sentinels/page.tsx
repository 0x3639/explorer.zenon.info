'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { HashLink } from '@/components/ui/HashLink';
import { formatFullTimestamp } from '@/lib/utils';
import { useZenonWebSocket } from '@/hooks/useZenonWebSocket';
import { zenonClient } from '@/lib/zenon-api';
import type { Sentinel } from '@/types/zenon';

export default function SentinelsPage() {
  const { status } = useZenonWebSocket();
  const [sentinels, setSentinels] = useState<Sentinel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetchSentinels = useCallback(async () => {
    setLoading(true);
    try {
      const result = await zenonClient.getAllActiveSentinels(page, pageSize);
      setSentinels(result.list);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Failed to fetch sentinels:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (status === 'connected') {
      fetchSentinels();
    }
  }, [status, fetchSentinels]);

  const columns = [
    {
      key: 'address',
      header: 'Address',
      render: (sentinel: Sentinel) => (
        <HashLink hash={sentinel.owner} type="address" linkToDetail showCopy />
      ),
    },
    {
      key: 'registrationTime',
      header: 'Registration time',
      render: (sentinel: Sentinel) => (
        <span className="text-gray-300">
          {formatFullTimestamp(sentinel.registrationTimestamp)}
        </span>
      ),
    },
  ];

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header status={status} />
      <PageHeader title="Sentinels List" />

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
          data={sentinels}
          keyExtractor={(s) => s.owner}
          loading={loading}
          emptyMessage="No active sentinels found"
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
