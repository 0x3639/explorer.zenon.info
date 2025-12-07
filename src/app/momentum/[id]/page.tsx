'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { HashLink } from '@/components/ui/HashLink';
import { TokenSymbolLink } from '@/components/ui/TokenSymbolLink';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { formatFullTimestamp, formatTokenAmount } from '@/lib/utils';
import { useZenon } from '@/contexts/ZenonProvider';
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
  const { status, currentHeight, nodes, selectedNodeUrl, selectNode, addNode, removeNode } = useZenon();
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
      <Header
        status={status}
        nodes={nodes}
        selectedNodeUrl={selectedNodeUrl}
        onSelectNode={selectNode}
        onAddNode={addNode}
        onRemoveNode={removeNode}
      />

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
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base sm:w-40 shrink-0">Momentum Hash:</span>
                  {/* Truncated on mobile/tablet, full on desktop */}
                  <span className="lg:hidden">
                    <HashLink hash={momentum.hash} truncateStart={28} type="momentum" showCopy isCurrentPage />
                  </span>
                  <span className="hidden lg:inline">
                    <HashLink hash={momentum.hash} noTruncate type="momentum" showCopy isCurrentPage />
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base sm:w-40 shrink-0">Momentum Height:</span>
                  <span className="text-[#7fff00] font-mono">
                    {momentum.height.toLocaleString()}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base sm:w-40 shrink-0">Timestamp:</span>
                  <span className="text-white">
                    {formatFullTimestamp(momentum.timestamp)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base sm:w-40 shrink-0">Producer:</span>
                  {/* Truncated on mobile/tablet, full on desktop */}
                  <span className="lg:hidden">
                    <HashLink hash={momentum.producer} type="address" linkToDetail showCopy />
                  </span>
                  <span className="hidden lg:inline">
                    <HashLink hash={momentum.producer} type="address" noTruncate linkToDetail showCopy />
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <span className="text-gray-400 text-sm sm:text-base sm:w-40 shrink-0">Previous Hash:</span>
                  {/* Truncated on mobile/tablet, full on desktop */}
                  <span className="lg:hidden">
                    <HashLink hash={momentum.previousHash} truncateStart={28} type="momentum" linkToDetail showCopy />
                  </span>
                  <span className="hidden lg:inline">
                    <HashLink hash={momentum.previousHash} noTruncate type="momentum" linkToDetail showCopy />
                  </span>
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
                        mobilePrimary: true,
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
                        mobileLabel: false,
                        render: (tx: AccountBlock) => (
                          <span className="text-gray-300">{tx.height.toLocaleString()}</span>
                        ),
                      },
                      {
                        key: 'timestamp',
                        header: 'Timestamp',
                        mobileLabel: false,
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
                        mobileLabel: 'Confirms',
                        render: (tx: AccountBlock) => (
                          <span className="text-[#7fff00]">{getConfirmations(tx)}</span>
                        ),
                      },
                      {
                        key: 'from',
                        header: 'From Address',
                        mobileLabel: 'From',
                        render: (tx: AccountBlock) => (
                          <HashLink hash={tx.address} type="address" linkToDetail showCopy />
                        ),
                      },
                      {
                        key: 'to',
                        header: 'To Address',
                        mobileLabel: 'To',
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
            <JsonViewer data={momentum} title="Raw data" />
          </div>
        ) : null}
      </main>
    </div>
  );
}
