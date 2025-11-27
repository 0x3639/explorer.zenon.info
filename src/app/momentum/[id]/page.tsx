'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { HashLink } from '@/components/ui/HashLink';
import { TokenSymbolLink } from '@/components/ui/TokenSymbolLink';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { formatFullTimestamp, formatTokenAmount } from '@/lib/utils';
import { useZenonWebSocket } from '@/hooks/useZenonWebSocket';
import { zenonClient } from '@/lib/zenon-api';
import type { Momentum, AccountBlock } from '@/types/zenon';

// Block type mapping
const BLOCK_TYPES: Record<number, string> = {
  1: 'GENESIS RECEIVE',
  2: 'USER SEND',
  3: 'USER RECEIVE',
  4: 'CONTRACT SEND',
  5: 'CONTRACT RECEIVE',
};

export default function MomentumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { status, currentHeight } = useZenonWebSocket();
  const [momentum, setMomentum] = useState<Momentum | null>(null);
  const [transactions, setTransactions] = useState<AccountBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txPage, setTxPage] = useState(0);
  const [txPageSize, setTxPageSize] = useState(10);

  const id = params.id as string;

  const fetchMomentum = useCallback(async () => {
    if (!zenonClient.isConnected()) return;

    setLoading(true);
    setError(null);

    try {
      let height: number;

      // Check if id is a hash (64 chars) or a height (numeric)
      if (/^\d+$/.test(id)) {
        height = parseInt(id, 10);
      } else {
        // It's a hash - fetch by hash to get the height
        const momentumByHash = await zenonClient.getMomentumByHash(id);
        height = momentumByHash.height;
      }

      // Use getDetailedMomentumsByHeight to get full transaction details
      const detailed = await zenonClient.getDetailedMomentumsByHeight(height, 1);
      if (detailed.list.length === 0) {
        setError('Momentum not found');
        return;
      }

      const item = detailed.list[0];
      setMomentum(item.momentum);

      // Extract transactions
      if (item.blocks) {
        if (Array.isArray(item.blocks)) {
          setTransactions(item.blocks);
        } else if (item.blocks.list && Array.isArray(item.blocks.list)) {
          setTransactions(item.blocks.list);
        }
      }
    } catch (err) {
      console.error('Failed to fetch momentum:', err);
      setError('Failed to load momentum details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (status === 'connected') {
      fetchMomentum();
    }
  }, [status, fetchMomentum]);

  const navigateToMomentum = (height: number) => {
    router.push(`/momentum/${height}`);
  };

  const getConfirmations = (tx: AccountBlock) => {
    if (!tx.confirmationDetail?.momentumHeight) return 0;
    return Math.max(0, currentHeight - tx.confirmationDetail.momentumHeight);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header status={status} />

      {/* Page Header with navigation */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto flex items-center gap-4">
          <h1 className="text-white text-sm font-medium">Momentum Details</h1>
          {momentum && (
            <>
              <span className="text-gray-600">|</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigateToMomentum(momentum.height - 1)}
                  disabled={momentum.height <= 1}
                  className="p-1 text-[#7fff00] hover:bg-[#2a2a2a] rounded disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous momentum"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[#7fff00] font-mono font-medium">
                  {momentum.height.toLocaleString()}
                </span>
                <button
                  onClick={() => navigateToMomentum(momentum.height + 1)}
                  className="p-1 text-[#7fff00] hover:bg-[#2a2a2a] rounded"
                  title="Next momentum"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
              <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
              <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
            </div>
          </div>
        ) : error ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
            <p className="text-red-400">{error}</p>
            <Link href="/momentums" className="text-[#7fff00] hover:underline mt-2 inline-block">
              ← Back to Momentums
            </Link>
          </div>
        ) : momentum ? (
          <div className="space-y-6">
            {/* Momentum Info */}
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-400 w-40 shrink-0">Momentum Hash:</span>
                  <HashLink hash={momentum.hash} truncateStart={64} type="momentum" showCopy isCurrentPage />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-400 w-40 shrink-0">Momentum Height:</span>
                  <span className="text-[#7fff00] font-mono">
                    {momentum.height.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-400 w-40 shrink-0">Timestamp:</span>
                  <span className="text-white">
                    {formatFullTimestamp(momentum.timestamp)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-400 w-40 shrink-0">Producer:</span>
                  <HashLink hash={momentum.producer} type="address" linkToDetail showCopy />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-gray-400 w-40 shrink-0">Previous Hash:</span>
                  <HashLink hash={momentum.previousHash} truncateStart={64} type="momentum" linkToDetail showCopy />
                </div>

              </div>
            </div>

            {/* Momentum Transactions */}
            {transactions.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-medium">Momentum Transactions</h2>
                  <Pagination
                    currentPage={txPage}
                    totalItems={transactions.length}
                    pageSize={txPageSize}
                    onPageChange={setTxPage}
                    onPageSizeChange={(size) => {
                      setTxPageSize(size);
                      setTxPage(0);
                    }}
                  />
                </div>
                <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                  <Table
                    columns={[
                      {
                        key: 'hash',
                        header: 'Transaction Hash',
                        render: (tx: AccountBlock) => (
                          <HashLink hash={tx.hash} truncateStart={24} type="transaction" linkToDetail showCopy />
                        ),
                      },
                      {
                        key: 'type',
                        header: 'Type',
                        render: (tx: AccountBlock) => (
                          <span className="text-gray-300 text-sm">
                            {BLOCK_TYPES[tx.blockType] || `TYPE ${tx.blockType}`}
                          </span>
                        ),
                      },
                      {
                        key: 'height',
                        header: 'Height',
                        render: (tx: AccountBlock) => (
                          <span className="text-gray-300">{tx.height.toLocaleString()}</span>
                        ),
                      },
                      {
                        key: 'timestamp',
                        header: 'Timestamp',
                        render: () => (
                          <span className="text-gray-300 text-sm">
                            {formatFullTimestamp(momentum.timestamp)}
                          </span>
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
                          return (
                            <span className="text-gray-300">
                              {formatTokenAmount(tx.amount, decimals)}
                            </span>
                          );
                        },
                      },
                      {
                        key: 'symbol',
                        header: 'Symbol',
                        render: (tx: AccountBlock) => (
                          tx.token?.symbol && tx.tokenStandard ? (
                            <TokenSymbolLink symbol={tx.token.symbol} tokenStandard={tx.tokenStandard} />
                          ) : (
                            <span className="text-[#7fff00]">ZNN</span>
                          )
                        ),
                      },
                      {
                        key: 'confirmations',
                        header: 'Confirmations',
                        render: (tx: AccountBlock) => (
                          <span className="text-[#7fff00]">{getConfirmations(tx)}</span>
                        ),
                      },
                      {
                        key: 'from',
                        header: 'From Address',
                        render: (tx: AccountBlock) => (
                          <HashLink hash={tx.address} type="address" linkToDetail showCopy />
                        ),
                      },
                      {
                        key: 'to',
                        header: 'To Address',
                        render: (tx: AccountBlock) => (
                          <HashLink hash={tx.toAddress} type="address" linkToDetail showCopy />
                        ),
                      },
                    ]}
                    data={transactions.slice(txPage * txPageSize, (txPage + 1) * txPageSize)}
                    keyExtractor={(tx) => tx.hash}
                    loading={false}
                    emptyMessage="No transactions"
                  />
                </div>
              </div>
            )}

            {/* Raw Data */}
            <div>
              <h2 className="text-white font-medium mb-3">Raw data</h2>
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] overflow-hidden">
                <pre className="p-4 text-sm overflow-x-auto">
                  <code className="text-gray-300">
                    {JSON.stringify(momentum, null, 2)
                      .split('\n')
                      .map((line, i) => {
                        // Highlight different parts
                        let highlightedLine = line
                          // Highlight hash values (64 char hex strings)
                          .replace(/"([a-f0-9]{64})"/g, '"<span class="text-[#7fff00]">$1</span>"')
                          // Highlight numbers
                          .replace(/: (\d+)/g, ': <span class="text-yellow-400">$1</span>')
                          // Highlight addresses (z1...)
                          .replace(/"(z1[a-z0-9]+)"/g, '"<span class="text-[#7fff00]">$1</span>"')
                          // Highlight empty strings
                          .replace(/""/g, '<span class="text-gray-500">""</span>');

                        return (
                          <div key={i} className="flex">
                            <span className="text-gray-600 w-8 shrink-0 select-none text-right pr-4">
                              {i + 1}
                            </span>
                            <span dangerouslySetInnerHTML={{ __html: highlightedLine }} />
                          </div>
                        );
                      })}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
