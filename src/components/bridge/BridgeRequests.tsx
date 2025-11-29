'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { zenonClient } from '@/lib/zenon-api';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { HashLink, MomentumHeightLink } from '@/components/ui/HashLink';
import { truncateHash, copyToClipboard, formatNumber } from '@/lib/utils';
import type { WrapRequest, UnwrapRequest, ConnectionStatus } from '@/types/zenon';

interface BridgeRequestsProps {
  connectionStatus: ConnectionStatus;
}

type WrapFilter = 'all' | 'pending' | 'confirmed';
type UnwrapFilter = 'all' | 'pending' | 'redeemed' | 'revoked';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded shrink-0"
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-[#7fff00]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-gray-500 hover:text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  );
}

function WrapStatusBadge({ confirmations }: { confirmations: number }) {
  if (confirmations === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
        Confirmed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
      Pending ({confirmations})
    </span>
  );
}

function UnwrapStatusBadge({ redeemed, revoked }: { redeemed: number; revoked: number }) {
  if (redeemed === 1) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/20 text-green-400">
        Redeemed
      </span>
    );
  }
  if (revoked === 1) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
        Revoked
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
      Pending
    </span>
  );
}

export function BridgeRequests({ connectionStatus }: BridgeRequestsProps) {
  const [activeTab, setActiveTab] = useState<'wraps' | 'unwraps'>('wraps');

  // Wrap state
  const [wraps, setWraps] = useState<WrapRequest[]>([]);
  const [wrapsTotal, setWrapsTotal] = useState(0);
  const [wrapsPage, setWrapsPage] = useState(0);
  const [wrapsFilter, setWrapsFilter] = useState<WrapFilter>('all');
  const [wrapsLoading, setWrapsLoading] = useState(true);

  // Unwrap state
  const [unwraps, setUnwraps] = useState<UnwrapRequest[]>([]);
  const [unwrapsTotal, setUnwrapsTotal] = useState(0);
  const [unwrapsPage, setUnwrapsPage] = useState(0);
  const [unwrapFilter, setUnwrapFilter] = useState<UnwrapFilter>('all');
  const [unwrapsLoading, setUnwrapsLoading] = useState(true);

  const pageSize = 5;

  // Format amount without decimals (truncate, not round)
  const formatWholeAmount = (amount: string, decimals: number): string => {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholeAmount = num / divisor;
    return formatNumber(wholeAmount.toString());
  };

  const fetchWraps = useCallback(async () => {
    if (connectionStatus !== 'connected') return;

    setWrapsLoading(true);
    try {
      // First fetch to get total count
      const firstResult = await zenonClient.getAllWrapTokenRequests(0, 1);
      const total = firstResult.count;
      setWrapsTotal(total);

      // Calculate page from end (newest items are at higher indices)
      const totalPages = Math.ceil(total / pageSize);
      const reversePageIndex = Math.max(0, totalPages - 1 - wrapsPage);

      const result = await zenonClient.getAllWrapTokenRequests(reversePageIndex, pageSize);
      // Reverse the list so newest (highest height) appears first
      const reversed = [...result.list].reverse();
      setWraps(reversed);
    } catch (error) {
      console.error('Failed to fetch wrap requests:', error);
    } finally {
      setWrapsLoading(false);
    }
  }, [connectionStatus, wrapsPage]);

  const fetchUnwraps = useCallback(async () => {
    if (connectionStatus !== 'connected') return;

    setUnwrapsLoading(true);
    try {
      // First fetch to get total count
      const firstResult = await zenonClient.getAllUnwrapTokenRequests(0, 1);
      const total = firstResult.count;
      setUnwrapsTotal(total);

      // Calculate page from end (newest items are at higher indices)
      const totalPages = Math.ceil(total / pageSize);
      const reversePageIndex = Math.max(0, totalPages - 1 - unwrapsPage);

      const result = await zenonClient.getAllUnwrapTokenRequests(reversePageIndex, pageSize);
      // Reverse the list so newest (highest height) appears first
      const reversed = [...result.list].reverse();
      setUnwraps(reversed);
    } catch (error) {
      console.error('Failed to fetch unwrap requests:', error);
    } finally {
      setUnwrapsLoading(false);
    }
  }, [connectionStatus, unwrapsPage]);

  useEffect(() => {
    if (activeTab === 'wraps') {
      fetchWraps();
    }
  }, [activeTab, fetchWraps]);

  useEffect(() => {
    if (activeTab === 'unwraps') {
      fetchUnwraps();
    }
  }, [activeTab, fetchUnwraps]);

  // Filter wraps
  const filteredWraps = wraps.filter((wrap) => {
    if (wrapsFilter === 'all') return true;
    if (wrapsFilter === 'pending') return wrap.confirmationsToFinality > 0;
    if (wrapsFilter === 'confirmed') return wrap.confirmationsToFinality === 0;
    return true;
  });

  // Filter unwraps
  const filteredUnwraps = unwraps.filter((unwrap) => {
    if (unwrapFilter === 'all') return true;
    if (unwrapFilter === 'pending') return unwrap.redeemed === 0 && unwrap.revoked === 0;
    if (unwrapFilter === 'redeemed') return unwrap.redeemed === 1;
    if (unwrapFilter === 'revoked') return unwrap.revoked === 1;
    return true;
  });

  const wrapColumns = [
    {
      key: 'id',
      header: 'ID',
      mobilePrimary: true,
      render: (item: WrapRequest) => (
        <span className="inline-flex items-center gap-1 group">
          <HashLink hash={item.id} type="hash" linkToDetail showCopy />
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: WrapRequest) => (
        <span className="text-gray-300">
          {formatWholeAmount(item.amount, item.token?.decimals || 8)}
        </span>
      ),
    },
    {
      key: 'token',
      header: 'Token',
      render: (item: WrapRequest) => (
        <Link
          href={`/token/${item.tokenStandard}`}
          className="text-[#7fff00] hover:underline"
        >
          {item.token?.symbol || 'Unknown'}
        </Link>
      ),
    },
    {
      key: 'toAddress',
      header: 'To (ETH)',
      mobileLabel: false as const,
      render: (item: WrapRequest) => (
        <span className="inline-flex items-center gap-1 group">
          <a
            href={`https://etherscan.io/address/${item.toAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-[#7fff00] hover:underline"
          >
            {truncateHash(item.toAddress, 8, 6)}
          </a>
          <CopyButton text={item.toAddress} />
        </span>
      ),
    },
    {
      key: 'height',
      header: 'Height',
      mobileLabel: 'Height',
      render: (item: WrapRequest) => (
        <MomentumHeightLink height={item.creationMomentumHeight} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: WrapRequest) => (
        <WrapStatusBadge confirmations={item.confirmationsToFinality} />
      ),
    },
  ];

  const unwrapColumns = [
    {
      key: 'hash',
      header: 'Hash',
      mobilePrimary: true,
      render: (item: UnwrapRequest) => (
        <HashLink hash={item.transactionHash} type="hash" linkToDetail showCopy />
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (item: UnwrapRequest) => (
        <span className="text-gray-300">
          {formatWholeAmount(item.amount, item.token?.decimals || 8)}
        </span>
      ),
    },
    {
      key: 'token',
      header: 'Token',
      render: (item: UnwrapRequest) => (
        <Link
          href={`/token/${item.tokenStandard}`}
          className="text-[#7fff00] hover:underline"
        >
          {item.token?.symbol || 'Unknown'}
        </Link>
      ),
    },
    {
      key: 'height',
      header: 'Height',
      mobileLabel: 'Height',
      render: (item: UnwrapRequest) => (
        <MomentumHeightLink height={item.registrationMomentumHeight} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: UnwrapRequest) => (
        <UnwrapStatusBadge redeemed={item.redeemed} revoked={item.revoked} />
      ),
    },
    {
      key: 'redeemableIn',
      header: 'Redeemable In',
      mobileLabel: false as const,
      render: (item: UnwrapRequest) => {
        if (item.redeemed === 1 || item.revoked === 1) {
          return <span className="text-gray-500">-</span>;
        }
        if (item.redeemableIn === 0) {
          return <span className="text-green-400">Now</span>;
        }
        return <span className="text-gray-300">{item.redeemableIn} blocks</span>;
      },
    },
  ];

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] mb-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between border-b border-[#2a2a2a] px-4 py-3">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('wraps')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'wraps'
                ? 'bg-[#7fff00]/20 text-[#7fff00]'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Wraps
          </button>
          <button
            onClick={() => setActiveTab('unwraps')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'unwraps'
                ? 'bg-[#7fff00]/20 text-[#7fff00]'
                : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            }`}
          >
            Unwraps
          </button>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Filter:</span>
          {activeTab === 'wraps' ? (
            <select
              value={wrapsFilter}
              onChange={(e) => setWrapsFilter(e.target.value as WrapFilter)}
              className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#7fff00]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
            </select>
          ) : (
            <select
              value={unwrapFilter}
              onChange={(e) => setUnwrapFilter(e.target.value as UnwrapFilter)}
              className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#7fff00]"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="redeemed">Redeemed</option>
              <option value="revoked">Revoked</option>
            </select>
          )}
        </div>
      </div>

      {/* Table content */}
      {activeTab === 'wraps' ? (
        <>
          <Table
            columns={wrapColumns}
            data={filteredWraps}
            keyExtractor={(item) => item.id}
            loading={wrapsLoading}
            emptyMessage="No wrap requests found"
          />
          {wrapsTotal > pageSize && (
            <Pagination
              currentPage={wrapsPage}
              totalItems={wrapsTotal}
              pageSize={pageSize}
              onPageChange={setWrapsPage}
            />
          )}
        </>
      ) : (
        <>
          <Table
            columns={unwrapColumns}
            data={filteredUnwraps}
            keyExtractor={(item) => `${item.transactionHash}-${item.logIndex}`}
            loading={unwrapsLoading}
            emptyMessage="No unwrap requests found"
          />
          {unwrapsTotal > pageSize && (
            <Pagination
              currentPage={unwrapsPage}
              totalItems={unwrapsTotal}
              pageSize={pageSize}
              onPageChange={setUnwrapsPage}
            />
          )}
        </>
      )}
    </div>
  );
}
