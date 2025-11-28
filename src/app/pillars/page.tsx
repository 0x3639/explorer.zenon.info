'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { formatTokenAmount, truncateAddress } from '@/lib/utils';
import { useZenon } from '@/contexts/ZenonProvider';
import { zenonClient } from '@/lib/zenon-api';
import type { Pillar } from '@/types/zenon';

export default function PillarsPage() {
  const { status, nodes, selectedNodeUrl, selectNode, addNode, removeNode } = useZenon();
  const [pillars, setPillars] = useState<Pillar[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string>('weight');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchPillars = useCallback(async () => {
    setLoading(true);
    try {
      const result = await zenonClient.getAllPillars(page, pageSize);
      const sortedList = [...result.list];

      // Sort by weight (default)
      if (sortKey === 'weight') {
        sortedList.sort((a, b) => {
          const weightA = BigInt(a.weight);
          const weightB = BigInt(b.weight);
          return sortDirection === 'desc'
            ? weightB > weightA ? 1 : -1
            : weightA > weightB ? 1 : -1;
        });
      }

      setPillars(sortedList);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Failed to fetch pillars:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDirection]);

  useEffect(() => {
    if (status === 'connected') {
      fetchPillars();
    }
  }, [status, fetchPillars]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      mobilePrimary: true,
      render: (pillar: Pillar) => (
        <Link href={`/pillar/${pillar.ownerAddress}`} className="text-white font-medium hover:text-[#7fff00]">
          {pillar.name}
        </Link>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (pillar: Pillar) => (
        <Link href={`/pillar/${pillar.ownerAddress}`} className="text-[#7fff00] font-mono text-sm hover:underline">
          {truncateAddress(pillar.ownerAddress)}
        </Link>
      ),
    },
    {
      key: 'weight',
      header: 'Weight',
      sortable: true,
      render: (pillar: Pillar) => (
        <span className="text-gray-300">
          {formatTokenAmount(pillar.weight, 8)} ZNN
        </span>
      ),
    },
    {
      key: 'momentums',
      header: 'Target / Produced Momentums',
      className: 'text-center',
      mobileLabel: 'Momentums',
      render: (pillar: Pillar) => (
        <span className="text-gray-300">
          {pillar.currentStats.expectedMomentums} / {pillar.currentStats.producedMomentums}
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
      <Header
        status={status}
        nodes={nodes}
        selectedNodeUrl={selectedNodeUrl}
        onSelectNode={selectNode}
        onAddNode={addNode}
        onRemoveNode={removeNode}
      />
      <PageHeader title="Pillars List" />

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
          data={pillars}
          keyExtractor={(p) => p.name}
          onSort={handleSort}
          loading={loading}
          emptyMessage="No pillars found"
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
