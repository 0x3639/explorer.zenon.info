'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { zenonClient } from '@/lib/zenon-api';
import { Table } from '@/components/ui/Table';
import { Pagination } from '@/components/ui/Pagination';
import { HashLink, MomentumHeightLink } from '@/components/ui/HashLink';
import { truncateHash, copyToClipboard, formatNumber } from '@/lib/utils';
import { BRIDGE_CHAINS, BRIDGE_TOKENS } from '@/lib/constants';
import type { WrapRequest, UnwrapRequest, ConnectionStatus, WrapFilter, UnwrapFilter } from '@/types/zenon';

interface BridgeRequestsProps {
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

function DataSourceBadge({ source }: { source: 'api' | 'rpc' }) {
  if (source === 'rpc') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
        RPC Fallback
      </span>
    );
  }
  return null;
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

  // Additional filters
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [addressSearch, setAddressSearch] = useState<string>('');

  // Data source tracking
  const [wrapsSource, setWrapsSource] = useState<'api' | 'rpc'>('api');
  const [unwrapsSource, setUnwrapsSource] = useState<'api' | 'rpc'>('api');

  const pageSize = 10;

  // Format amount without decimals (truncate, not round)
  const formatWholeAmount = (amount: string, decimals: number): string => {
    try {
      // Handle scientific notation by converting to regular number string first
      let amountStr = amount;
      if (amount.includes('E') || amount.includes('e')) {
        // Convert scientific notation to full integer string
        amountStr = BigInt(Math.floor(Number(amount))).toString();
      }
      const num = BigInt(amountStr);
      const divisor = BigInt(10 ** decimals);
      const wholeAmount = num / divisor;
      return formatNumber(wholeAmount.toString());
    } catch {
      // Fallback for any parsing errors
      const num = Number(amount);
      const wholeAmount = Math.floor(num / Math.pow(10, decimals));
      return formatNumber(wholeAmount.toString());
    }
  };

  // Build API query params for wraps
  const buildWrapsParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('type', 'wraps');
    params.set('page', wrapsPage.toString());
    params.set('page_size', pageSize.toString());

    if (chainFilter !== 'all') {
      params.set('chain_id', chainFilter);
    }
    if (tokenFilter !== 'all') {
      params.set('token_symbol', tokenFilter);
    }
    if (addressSearch.trim()) {
      params.set('to_address', addressSearch.trim());
    }
    if (wrapsFilter === 'confirmed') {
      params.set('confirmations_to_finality', '0');
    }

    return params.toString();
  }, [wrapsPage, chainFilter, tokenFilter, addressSearch, wrapsFilter]);

  // Build API query params for unwraps
  const buildUnwrapsParams = useCallback(() => {
    const params = new URLSearchParams();
    params.set('type', 'unwraps');
    params.set('page', unwrapsPage.toString());
    params.set('page_size', pageSize.toString());

    if (chainFilter !== 'all') {
      params.set('chain_id', chainFilter);
    }
    if (tokenFilter !== 'all') {
      params.set('token_symbol', tokenFilter);
    }
    if (addressSearch.trim()) {
      params.set('to_address', addressSearch.trim());
    }
    if (unwrapFilter === 'redeemed') {
      params.set('redeemed', 'true');
    } else if (unwrapFilter === 'revoked') {
      params.set('revoked', 'true');
    } else if (unwrapFilter === 'pending') {
      params.set('redeemed', 'false');
      params.set('revoked', 'false');
    }

    return params.toString();
  }, [unwrapsPage, chainFilter, tokenFilter, addressSearch, unwrapFilter]);

  // Client-side filtering for RPC fallback
  const applyClientSideFilters = useCallback(<T extends WrapRequest | UnwrapRequest>(
    items: T[],
    isWrap: boolean
  ): T[] => {
    return items.filter((item) => {
      // Chain filter
      if (chainFilter !== 'all' && item.chainId !== parseInt(chainFilter)) {
        return false;
      }
      // Token filter
      if (tokenFilter !== 'all' && item.token?.symbol !== tokenFilter) {
        return false;
      }
      // Address filter
      if (addressSearch.trim() && !item.toAddress.toLowerCase().includes(addressSearch.toLowerCase())) {
        return false;
      }
      // Status filter
      if (isWrap) {
        const wrap = item as WrapRequest;
        if (wrapsFilter === 'pending' && wrap.confirmationsToFinality === 0) return false;
        if (wrapsFilter === 'confirmed' && wrap.confirmationsToFinality > 0) return false;
      } else {
        const unwrap = item as UnwrapRequest;
        if (unwrapFilter === 'pending' && (unwrap.redeemed === 1 || unwrap.revoked === 1)) return false;
        if (unwrapFilter === 'redeemed' && unwrap.redeemed !== 1) return false;
        if (unwrapFilter === 'revoked' && unwrap.revoked !== 1) return false;
      }
      return true;
    });
  }, [chainFilter, tokenFilter, addressSearch, wrapsFilter, unwrapFilter]);

  const fetchWraps = useCallback(async () => {
    setWrapsLoading(true);

    try {
      // Try API first
      const response = await fetch(`/api/bridge/requests?${buildWrapsParams()}`);

      if (response.ok) {
        const data = await response.json();
        // Apply client-side filtering for "pending" since API doesn't support it
        let filteredList = data.list;
        let filteredCount = data.count;
        if (wrapsFilter === 'pending') {
          filteredList = data.list.filter((w: WrapRequest) => w.confirmationsToFinality > 0);
          // Note: count is approximate since we filtered client-side
          filteredCount = filteredList.length;
        }
        setWraps(filteredList);
        setWrapsTotal(filteredCount);
        setWrapsSource('api');
        setWrapsLoading(false);
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
      setWrapsLoading(false);
      return;
    }

    try {
      // RPC doesn't support filtering, fetch more and filter client-side
      const result = await zenonClient.getAllWrapTokenRequests(0, 100);
      const filtered = applyClientSideFilters(result.list, true);

      // Apply pagination to filtered results
      const startIdx = wrapsPage * pageSize;
      const paginatedWraps = filtered.slice(startIdx, startIdx + pageSize);

      setWraps(paginatedWraps);
      setWrapsTotal(filtered.length);
      setWrapsSource('rpc');
    } catch (error) {
      console.error('Failed to fetch wrap requests from RPC:', error);
    } finally {
      setWrapsLoading(false);
    }
  }, [buildWrapsParams, connectionStatus, wrapsPage, applyClientSideFilters, wrapsFilter]);

  const fetchUnwraps = useCallback(async () => {
    setUnwrapsLoading(true);

    try {
      // Try API first
      const response = await fetch(`/api/bridge/requests?${buildUnwrapsParams()}`);

      if (response.ok) {
        const data = await response.json();
        setUnwraps(data.list);
        setUnwrapsTotal(data.count);
        setUnwrapsSource('api');
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
      const filtered = applyClientSideFilters(sorted, false);

      // Apply pagination to filtered results
      const startIdx = unwrapsPage * pageSize;
      const paginatedUnwraps = filtered.slice(startIdx, startIdx + pageSize);

      setUnwraps(paginatedUnwraps);
      setUnwrapsTotal(filtered.length);
      setUnwrapsSource('rpc');
    } catch (error) {
      console.error('Failed to fetch unwrap requests from RPC:', error);
    } finally {
      setUnwrapsLoading(false);
    }
  }, [buildUnwrapsParams, connectionStatus, unwrapsPage, applyClientSideFilters]);

  // Reset page when filters change
  useEffect(() => {
    setWrapsPage(0);
    setUnwrapsPage(0);
  }, [chainFilter, tokenFilter, addressSearch, wrapsFilter, unwrapFilter]);

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

  // Get chain explorer URL
  const getChainExplorer = (chainId: number) => {
    return BRIDGE_CHAINS[chainId] || BRIDGE_CHAINS[1];
  };

  const wrapColumns = [
    {
      key: 'id',
      header: 'Tx Hash',
      mobilePrimary: true,
      render: (item: WrapRequest) => (
        <span className="inline-flex items-center gap-1 group">
          <HashLink hash={item.id} type="transaction" linkToDetail showCopy />
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
      key: 'chain',
      header: 'Chain',
      mobileLabel: false as const,
      render: (item: WrapRequest) => (
        <span className="text-gray-300 text-sm">
          {getChainExplorer(item.chainId).name}
        </span>
      ),
    },
    {
      key: 'toAddress',
      header: 'To Address',
      mobileLabel: false as const,
      render: (item: WrapRequest) => {
        const explorer = getChainExplorer(item.chainId);
        return (
          <span className="inline-flex items-center gap-1 group">
            <a
              href={`${explorer.explorer}${explorer.addressPath}${item.toAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-[#7fff00] hover:underline"
            >
              {truncateHash(item.toAddress, 8, 6)}
            </a>
            <CopyButton text={item.toAddress} />
          </span>
        );
      },
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
      key: 'toAddress',
      header: 'To Address',
      mobileLabel: false as const,
      render: (item: UnwrapRequest) => (
        <span className="inline-flex items-center gap-1 group">
          <HashLink hash={item.toAddress} type="address" linkToDetail showCopy />
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
    <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] mb-6">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#2a2a2a] px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
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
          <DataSourceBadge source={activeTab === 'wraps' ? wrapsSource : unwrapsSource} />
        </div>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] bg-[#161616]">
        {/* Chain filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Chain:</span>
          <select
            value={chainFilter}
            onChange={(e) => setChainFilter(e.target.value)}
            className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#7fff00]"
          >
            <option value="all">All</option>
            {Object.entries(BRIDGE_CHAINS).map(([id, chain]) => (
              <option key={id} value={id}>{chain.name}</option>
            ))}
          </select>
        </div>

        {/* Token filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Token:</span>
          <select
            value={tokenFilter}
            onChange={(e) => setTokenFilter(e.target.value)}
            className="bg-[#121212] border border-[#2a2a2a] rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[#7fff00]"
          >
            <option value="all">All</option>
            {BRIDGE_TOKENS.map((token) => (
              <option key={token} value={token}>{token}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Status:</span>
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

        {/* Address search */}
        <div className="flex items-center gap-2 flex-grow min-w-[200px]">
          <span className="text-sm text-gray-400">Address:</span>
          <input
            type="text"
            value={addressSearch}
            onChange={(e) => setAddressSearch(e.target.value)}
            placeholder={activeTab === 'wraps' ? 'Search ETH address...' : 'Search Zenon address...'}
            className="flex-grow bg-[#121212] border border-[#2a2a2a] rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7fff00]"
          />
        </div>
      </div>

      {/* Table content */}
      {activeTab === 'wraps' ? (
        <>
          <Table
            columns={wrapColumns}
            data={wraps}
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
            data={unwraps}
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
