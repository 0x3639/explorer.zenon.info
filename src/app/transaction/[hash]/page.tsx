'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { HashLink } from '@/components/ui/HashLink';
import { TokenSymbolLink } from '@/components/ui/TokenSymbolLink';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { formatFullTimestamp, formatTokenAmount } from '@/lib/utils';
import { useZenonWebSocket } from '@/hooks/useZenonWebSocket';
import { zenonClient } from '@/lib/zenon-api';
import type { AccountBlock } from '@/types/zenon';

export default function TransactionDetailPage() {
  const params = useParams();
  const { status, currentHeight } = useZenonWebSocket();
  const [transaction, setTransaction] = useState<AccountBlock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hash = params.hash as string;

  const fetchTransaction = useCallback(async () => {
    if (!zenonClient.isConnected()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await zenonClient.getAccountBlockByHash(hash);
      setTransaction(result);
    } catch (err) {
      console.error('Failed to fetch transaction:', err);
      setError('Transaction not found');
    } finally {
      setLoading(false);
    }
  }, [hash]);

  useEffect(() => {
    if (status === 'connected') {
      fetchTransaction();
    }
  }, [status, fetchTransaction]);

  const getConfirmations = () => {
    if (!transaction?.confirmationDetail?.momentumHeight) return 0;
    return Math.max(0, currentHeight - transaction.confirmationDetail.momentumHeight);
  };

  const formatAmount = () => {
    if (!transaction) return '0';
    if (!transaction.amount || transaction.amount === '0') return '0';
    const decimals = transaction.token?.decimals || 8;
    return formatTokenAmount(transaction.amount, decimals);
  };

  return (
    <div className="min-h-screen bg-[#121212]">
      <Header status={status} />

      {/* Page Header */}
      <div className="bg-[#7fff00] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto flex items-center gap-3">
          <h1 className="text-black text-sm font-medium">Transaction Details</h1>
          <span className="text-black/60">|</span>
          <span className="text-black font-mono text-sm">{hash}</span>
          <button
            onClick={() => navigator.clipboard.writeText(hash)}
            className="p-1 hover:bg-black/10 rounded"
            title="Copy to clipboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-black/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="space-y-6">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-[#2a2a2a] rounded w-1/4" />
                <div className="h-4 bg-[#2a2a2a] rounded w-3/4" />
                <div className="h-4 bg-[#2a2a2a] rounded w-1/2" />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
            <p className="text-red-400">{error}</p>
            <Link href="/" className="text-[#7fff00] hover:underline mt-2 inline-block">
              ← Back to Dashboard
            </Link>
          </div>
        ) : transaction ? (
          <div className="space-y-6">
            {/* Transaction Information */}
            <div>
              <h2 className="text-white font-medium mb-3">Transaction Information</h2>
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">Confirmations:</span>
                    <span className="text-white">{getConfirmations()}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">Transaction Height:</span>
                    <span className="text-white">{transaction.height.toLocaleString()}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">Timestamp:</span>
                    <span className="text-white">
                      {transaction.confirmationDetail?.momentumTimestamp
                        ? formatFullTimestamp(transaction.confirmationDetail.momentumTimestamp)
                        : 'Pending'}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">Momentum Hash:</span>
                    {transaction.confirmationDetail?.momentumHash ? (
                      <HashLink
                        hash={transaction.confirmationDetail.momentumHash}
                        type="momentum"
                        truncateStart={64}
                        linkToDetail
                        showCopy
                      />
                    ) : (
                      <span className="text-gray-500">Pending</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Message or Result */}
            <div>
              <h2 className="text-white font-medium mb-3">Transaction Message or Result</h2>
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">ZTS:</span>
                    <HashLink
                      hash={transaction.tokenStandard}
                      type="zts"
                      truncateStart={64}
                      linkToDetail
                      showCopy
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">From:</span>
                    <HashLink
                      hash={transaction.address}
                      type="address"
                      linkToDetail
                      showCopy
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">Amount:</span>
                    <span className="text-white">{formatAmount()}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">Symbol:</span>
                    <TokenSymbolLink
                      symbol={transaction.token?.symbol || 'ZNN'}
                      tokenStandard={transaction.tokenStandard || 'zts1znnxxxxxxxxxxxxx9z4ulx'}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-44 shrink-0">To:</span>
                    <HashLink
                      hash={transaction.toAddress}
                      type="address"
                      linkToDetail
                      showCopy
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Data */}
            <JsonViewer data={transaction} title="Raw data" />
          </div>
        ) : null}
      </main>
    </div>
  );
}
