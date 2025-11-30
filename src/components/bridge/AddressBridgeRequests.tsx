'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { zenonClient } from '@/lib/zenon-api';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { MomentumHeightLink } from '@/components/ui/HashLink';
import { truncateHash, copyToClipboard, formatNumber } from '@/lib/utils';
import { BRIDGE_CHAINS } from '@/lib/constants';
import type { UnwrapRequest, ConnectionStatus, UnwrapFilter } from '@/types/zenon';

interface AddressBridgeRequestsProps {
  address: string;
  connectionStatus: ConnectionStatus;
}

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

export function AddressBridgeRequests({ address, connectionStatus }: AddressBridgeRequestsProps) {
  // Unwrap state (for Zenon addresses, we show unwraps TO this address)
  const [unwraps, setUnwraps] = useState<UnwrapRequest[]>([]);
  const [unwrapsTotal, setUnwrapsTotal] = useState(0);
  const [unwrapsPage, setUnwrapsPage] = useState(0);
  const [unwrapFilter, setUnwrapFilter] = useState<UnwrapFilter>('all');
  const [unwrapsLoading, setUnwrapsLoading] = useState(true);
  const [dataSource, setDataSource] = useState<'api' | 'rpc'>('api');

  const pageSize = 10;

  // Format amount without decimals (truncate, not round)
  const formatWholeAmount = (amount: string, decimals: number): string => {
    const num = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const wholeAmount = num / divisor;
    return formatNumber(wholeAmount.toString());
  };

  // Build API query params for unwraps
  const buildUnwrapsParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('type', 'unwraps');
    params.set('page', unwrapsPage.toString());
    params.set('page_size', pageSize.toString());
    params.set('to_address', address);

    if (unwrapFilter === 'redeemed') {
      params.set('redeemed', 'true');
    } else if (unwrapFilter === 'revoked') {
      params.set('revoked', 'true');
    } else if (unwrapFilter === 'pending') {
      params.set('redeemed', 'false');
      params.set('revoked', 'false');
    }

    return params.toString();
  }, [unwrapsPage, address, unwrapFilter]);

  // Client-side filtering for RPC fallback
  const applyClientSideFilters = useCallback((items: UnwrapRequest[]): UnwrapRequest[] => {
    return items.filter((item) => {
      // Address filter - must match the target address
      if (item.toAddress.toLowerCase() !== address.toLowerCase()) {
        return false;
      }
      // Status filter
      if (unwrapFilter === 'pending' && (item.redeemed === 1 || item.revoked === 1)) return false;
      if (unwrapFilter === 'redeemed' && item.redeemed !== 1) return false;
      if (unwrapFilter === 'revoked' && item.revoked !== 1) return false;
      return true;
    });
  }, [address, unwrapFilter]);

  const fetchUnwraps = useCallback(async () => {
    setUnwrapsLoading(true);

    try {
      // Try API first
      const response = await fetch(`/api/bridge/requests?${buildUnwrapsParams()}`);

      if (response.ok) {
        const data = await response.json();
        setUnwraps(data.list);
        setUnwrapsTotal(data.count);
        setDataSource('api');
        setUnwrapsLoading(false);
        return;
      }

      // Check if we should fallback
      const errorData = await response.json().catch(() => ({ fallback: true }));
      if (!errorData.fallback) {
        throw new Error('API error without fallback');
      }
    } catch (error) {
      console.warn('Bridge API unavailable, falling back to RPC:', error);
    }

    // Fallback to RPC
    if (connectionStatus !== 'connected') {
      setUnwrapsLoading(false);
      return;
    }

    try {
      // RPC doesn't support filtering, fetch more and filter client-side
      const result = await zenonClient.getAllUnwrapTokenRequests(0, 100);
      // Sort by height descending
      const sorted = [...result.list].sort(
        (a, b) => b.registrationMomentumHeight - a.registrationMomentumHeight
      );
      const filtered = applyClientSideFilters(sorted);

      // Apply pagination to filtered results
      const startIdx = unwrapsPage * pageSize;
      const paginatedUnwraps = filtered.slice(startIdx, startIdx + pageSize);

      setUnwraps(paginatedUnwraps);
      setUnwrapsTotal(filtered.length);
      setDataSource('rpc');
    } catch (error) {
      console.error('Failed to fetch unwrap requests from RPC:', error);
    } finally {
      setUnwrapsLoading(false);
    }
  }, [buildUnwrapsParams, connectionStatus, unwrapsPage, applyClientSideFilters]);

  // Reset page when filter changes
  useEffect(() => {
    setUnwrapsPage(0);
  }, [unwrapFilter]);

  useEffect(() => {
    fetchUnwraps();
  }, [fetchUnwraps]);

  // Get chain explorer URL
  const getChainExplorer = (chainId: number) => {
    return BRIDGE_CHAINS[chainId] || BRIDGE_CHAINS[1];
  };

  const unwrapColumns = [
    {
      key: 'hash',
      header: 'Source Tx Hash',
      mobilePrimary: true,
      render: (item: UnwrapRequest) => {
        const explorer = getChainExplorer(item.chainId);
        const txHash = item.transactionHash.startsWith('0x')
          ? item.transactionHash
          : `0x${item.transactionHash}`;
        return (
          <span className="inline-flex items-center gap-1 group">
            <a
              href={`${explorer.explorer}${explorer.txPath}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-[#7fff00] hover:underline"
            >
              {truncateHash(item.transactionHash, 8, 6)}
            </a>
            <CopyButton text={txHash} />
          </span>
        );
      },
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
      key: 'chain',
      header: 'Chain',
      mobileLabel: false as const,
      render: (item: UnwrapRequest) => (
        <span className="text-gray-300 text-sm">
          {getChainExplorer(item.chainId).name}
        </span>
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
    <div>
      {/* Filter row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
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
          {dataSource === 'rpc' && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              RPC Fallback
            </span>
          )}
        </div>
        {unwrapsTotal > pageSize && (
          <Pagination
            currentPage={unwrapsPage}
            totalItems={unwrapsTotal}
            pageSize={pageSize}
            onPageChange={setUnwrapsPage}
          />
        )}
      </div>

      {/* Unwraps section */}
      <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
        <div className="px-4 py-3 border-b border-[#2a2a2a]">
          <h3 className="text-white font-medium">Incoming Bridge Transfers (Unwraps)</h3>
          <p className="text-sm text-gray-400 mt-1">
            Tokens bridged from other networks to this address
          </p>
        </div>
        <Table
          columns={unwrapColumns}
          data={unwraps}
          keyExtractor={(item) => `${item.transactionHash}-${item.logIndex}`}
          loading={unwrapsLoading}
          emptyMessage="No bridge transfers found for this address"
        />
      </div>
    </div>
  );
}
