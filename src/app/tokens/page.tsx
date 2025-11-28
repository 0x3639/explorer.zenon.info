'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { HashLink } from '@/components/ui/HashLink';
import { TokenSymbolLink } from '@/components/ui/TokenSymbolLink';
import { formatNumber } from '@/lib/utils';
import { useZenon } from '@/contexts/ZenonProvider';
import { zenonClient } from '@/lib/zenon-api';
import type { Token } from '@/types/zenon';

export default function ZTSPage() {
  const { status, nodes, selectedNodeUrl, selectNode, addNode, removeNode } = useZenon();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<string>('totalSupply');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    try {
      const result = await zenonClient.getAllTokens(page, pageSize);
      const sortedList = [...result.list];

      // Sort by total supply (default)
      if (sortKey === 'totalSupply') {
        sortedList.sort((a, b) => {
          const supplyA = BigInt(a.totalSupply);
          const supplyB = BigInt(b.totalSupply);
          return sortDirection === 'desc'
            ? supplyB > supplyA ? 1 : -1
            : supplyA > supplyB ? 1 : -1;
        });
      }

      setTokens(sortedList);
      setTotalCount(result.count);
    } catch (error) {
      console.error('Failed to fetch tokens:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortKey, sortDirection]);

  useEffect(() => {
    if (status === 'connected') {
      fetchTokens();
    }
  }, [status, fetchTokens]);

  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortKey(key);
    setSortDirection(direction);
  };

  const formatSupply = (supply: string, decimals: number) => {
    const num = BigInt(supply);
    const divisor = BigInt(10 ** decimals);
    const result = num / divisor;
    return formatNumber(result.toString());
  };

  const columns = [
    {
      key: 'symbol',
      header: 'Symbol',
      mobilePrimary: true,
      render: (token: Token) => (
        <TokenSymbolLink symbol={token.symbol} tokenStandard={token.tokenStandard} />
      ),
    },
    {
      key: 'zts',
      header: 'ZTS',
      render: (token: Token) => (
        <HashLink hash={token.tokenStandard} truncateStart={64} type="zts" linkToDetail showCopy />
      ),
    },
    {
      key: 'totalSupply',
      header: 'Total supply',
      sortable: true,
      mobileLabel: 'Supply',
      render: (token: Token) => (
        <span className="text-gray-300">
          {formatSupply(token.totalSupply, token.decimals)}
        </span>
      ),
    },
    {
      key: 'decimals',
      header: 'Decimals',
      className: 'text-right',
      render: (token: Token) => (
        <span className="text-gray-300">{token.decimals}</span>
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
      <PageHeader title="ZTS List" />

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
          data={tokens}
          keyExtractor={(t) => t.tokenStandard}
          onSort={handleSort}
          loading={loading}
          emptyMessage="No tokens found"
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
