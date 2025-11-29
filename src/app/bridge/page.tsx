'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { PageHeader } from '@/components/layout/PageHeader';
import { Table } from '@/components/ui/Table';
import { HashLink } from '@/components/ui/HashLink';
import { BridgeSummary } from '@/components/bridge/BridgeSummary';
import { BridgeRequests } from '@/components/bridge/BridgeRequests';
import { StatusBadge } from '@/components/bridge/StatusBadge';
import { fetchBridgeStatus } from '@/lib/bridge-api';
import { BRIDGE_CONFIG } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/utils';
import { useZenon } from '@/contexts/ZenonProvider';
import type { BridgeStatus, Orchestrator } from '@/types/zenon';

// Helper to convert ISO timestamp to relative time
function formatLastChecked(isoString?: string): string {
  if (!isoString) return '-';
  const timestamp = Math.floor(new Date(isoString).getTime() / 1000);
  return formatRelativeTime(timestamp);
}

export default function BridgePage() {
  const [data, setData] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const { status, nodes, selectedNodeUrl, selectNode, addNode, removeNode } = useZenon();

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchBridgeStatus();
      setData(result);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch bridge status');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, BRIDGE_CONFIG.REFRESH_INTERVAL_MS);

    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchData]);

  const columns = [
    {
      key: 'pillar_name',
      header: 'Pillar',
      mobilePrimary: true,
      render: (item: Orchestrator) => (
        <Link
          href={`/pillar/${item.producer_address}`}
          className="text-[#7fff00] hover:underline font-medium"
        >
          {item.pillar_name}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: Orchestrator) => <StatusBadge status={item.status} />,
    },
    {
      key: 'state',
      header: 'State',
      mobileLabel: 'State',
      render: (item: Orchestrator) => (
        <span className="text-gray-300">{item.state}</span>
      ),
    },
    {
      key: 'producer_address',
      header: 'Producer',
      mobileLabel: false as const,
      render: (item: Orchestrator) =>
        item.producer_address ? (
          <HashLink hash={item.producer_address} type="address" showCopy linkToDetail />
        ) : (
          <span className="text-gray-500">-</span>
        ),
    },
    {
      key: 'bnb',
      header: 'BNB',
      mobileLabel: 'BNB',
      render: (item: Orchestrator) => (
        <span className="text-gray-300 text-sm">
          {item.network_stats.bnb.wraps}/{item.network_stats.bnb.unwraps}
        </span>
      ),
    },
    {
      key: 'eth',
      header: 'ETH',
      mobileLabel: 'ETH',
      render: (item: Orchestrator) => (
        <span className="text-gray-300 text-sm">
          {item.network_stats.eth.wraps}/{item.network_stats.eth.unwraps}
        </span>
      ),
    },
    {
      key: 'supernova',
      header: 'Supernova',
      mobileLabel: false as const,
      render: (item: Orchestrator) => (
        <span className="text-gray-300 text-sm">
          {item.network_stats.supernova.wraps}/{item.network_stats.supernova.unwraps}
        </span>
      ),
    },
    {
      key: 'response_time',
      header: 'Resp Time',
      mobileLabel: false as const,
      render: (item: Orchestrator) =>
        item.response_time_ms !== undefined ? (
          <span className="text-gray-300 text-sm">{item.response_time_ms} ms</span>
        ) : (
          <span className="text-gray-500">-</span>
        ),
    },
    {
      key: 'last_checked',
      header: 'Last Checked',
      mobileLabel: false as const,
      render: (item: Orchestrator) => (
        <span className="text-gray-400 text-sm" title={item.last_checked}>
          {formatLastChecked(item.last_checked)}
        </span>
      ),
    },
    {
      key: 'error',
      header: 'Error',
      mobileLabel: false as const,
      render: (item: Orchestrator) =>
        item.error ? (
          <span
            className="text-red-400 text-sm truncate max-w-[150px] inline-block"
            title={item.error}
          >
            {item.error}
          </span>
        ) : null,
    },
  ];

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

      <PageHeader
        title="Bridge Status"
        subtitle={lastUpdated ? `Last updated: ${lastUpdated}` : undefined}
      />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && !data && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <BridgeSummary data={data} loading={loading} />

        <BridgeRequests connectionStatus={status} />

        <Table
          columns={columns}
          data={data?.orchestrators ?? []}
          keyExtractor={(item) => item.ip}
          loading={loading}
          emptyMessage="No orchestrators found"
        />
      </main>
    </div>
  );
}
