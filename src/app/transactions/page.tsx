'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { HashLink } from '@/components/ui/HashLink';
import { TokenSymbolLink } from '@/components/ui/TokenSymbolLink';
import { formatFullTimestamp, formatTokenAmount } from '@/lib/utils';
import { useZenonWebSocket } from '@/hooks/useZenonWebSocket';
import { zenonClient } from '@/lib/zenon-api';
import type { AccountBlock } from '@/types/zenon';

export default function TransactionsPage() {
  const { status, currentHeight } = useZenonWebSocket();
  const [transactions, setTransactions] = useState<AccountBlock[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      // Get momentums with transactions
      // We need to fetch enough to fill the page
      const frontier = await zenonClient.getFrontierMomentum();
      const batchSize = 1000; // Fetch more to find transactions
      const height = Math.max(frontier.height - batchSize + 1, 1);
      const result = await zenonClient.getDetailedMomentumsByHeight(height, batchSize);

      // Extract all account blocks from momentums
      const blocks: AccountBlock[] = [];
      result.list.forEach((item) => {
        if (item.blocks) {
          if (Array.isArray(item.blocks)) {
            blocks.push(...item.blocks);
          } else if (item.blocks.list && Array.isArray(item.blocks.list)) {
            blocks.push(...item.blocks.list);
          }
        }
      });

      // Reverse to show newest first
      const sortedBlocks = blocks.reverse();
      setTotalCount(sortedBlocks.length);

      // Paginate
      const startIndex = page * pageSize;
      const paginatedBlocks = sortedBlocks.slice(startIndex, startIndex + pageSize);
      setTransactions(paginatedBlocks);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    if (status === 'connected') {
      fetchTransactions();
    }
  }, [status, fetchTransactions]);

  const columns = [
    {
      key: 'hash',
      header: 'Transaction Hash',
      mobilePrimary: true,
      render: (tx: AccountBlock) => (
        <HashLink hash={tx.hash} truncateStart={28} type="transaction" linkToDetail showCopy />
      ),
    },
    {
      key: 'from',
      header: 'From',
      render: (tx: AccountBlock) => (
        <HashLink hash={tx.address} type="address" linkToDetail showCopy />
      ),
    },
    {
      key: 'to',
      header: 'To',
      render: (tx: AccountBlock) => (
        <HashLink hash={tx.toAddress} type="address" linkToDetail showCopy />
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (tx: AccountBlock) => {
        if (!tx.amount || tx.amount === '0') {
          return <span className="text-gray-300">0</span>;
        }
        const decimals = tx.token?.decimals || 8;
        const amount = formatTokenAmount(tx.amount, decimals);
        return (
          <span className="text-gray-300 inline-flex items-center gap-1">
            {amount}{' '}
            {tx.token?.symbol && tx.tokenStandard ? (
              <TokenSymbolLink symbol={tx.token.symbol} tokenStandard={tx.tokenStandard} />
            ) : (
              <span className="text-[#7fff00]">ZNN</span>
            )}
          </span>
        );
      },
    },
    {
      key: 'timestamp',
      header: 'Timestamp',
      mobileLabel: 'Time',
      render: (tx: AccountBlock) => (
        <span className="text-gray-300">
          {tx.confirmationDetail?.momentumTimestamp
            ? formatFullTimestamp(tx.confirmationDetail.momentumTimestamp)
            : 'Pending'}
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
      <PageHeader
        title="Transactions List"
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
          data={transactions}
          keyExtractor={(tx) => tx.hash}
          loading={loading}
          emptyMessage="No transactions found"
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
