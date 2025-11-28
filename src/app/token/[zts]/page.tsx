'use client';

export const runtime = 'edge';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { HashLink } from '@/components/ui/HashLink';
import { TokenSymbolLink } from '@/components/ui/TokenSymbolLink';
import { JsonViewer } from '@/components/ui/JsonViewer';
import { formatNumber } from '@/lib/utils';
import { useZenon } from '@/contexts/ZenonProvider';
import { zenonClient } from '@/lib/zenon-api';
import type { Token } from '@/types/zenon';

export default function TokenDetailPage() {
  const params = useParams();
  const { status, nodes, selectedNodeUrl, selectNode, addNode, removeNode } = useZenon();
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const zts = params.zts as string;

  const fetchToken = useCallback(async () => {
    if (!zenonClient.isConnected()) return;

    setLoading(true);
    setError(null);

    try {
      const tokenData = await zenonClient.getTokenByZts(zts);
      setToken(tokenData);
    } catch (err) {
      console.error('Failed to fetch token:', err);
      setError('Failed to load token details');
    } finally {
      setLoading(false);
    }
  }, [zts]);

  useEffect(() => {
    if (status === 'connected') {
      fetchToken();
    }
  }, [status, fetchToken]);

  const formatSupply = (supply: string, decimals: number) => {
    const num = BigInt(supply);
    const divisor = BigInt(10 ** decimals);
    const result = num / divisor;
    return formatNumber(result.toString());
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

      {/* Page Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2a2a2a] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1600px] mx-auto">
          <h1 className="text-white text-sm font-medium">Token Details ZTS</h1>
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
          </div>
        ) : token ? (
          <div className="space-y-6">
            {/* Token Information */}
            <div>
              <h2 className="text-white font-medium mb-3">Token Information</h2>
              <div className="bg-[#1a1a1a] rounded-lg border border-[#2a2a2a] p-6">
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-40 shrink-0">ZTS:</span>
                    <HashLink hash={token.tokenStandard} type="zts" truncateStart={64} showCopy isCurrentPage />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-40 shrink-0">Symbol:</span>
                    <TokenSymbolLink symbol={token.symbol} tokenStandard={token.tokenStandard} isCurrentPage />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-40 shrink-0">Balance:</span>
                    <span className="text-white font-mono">
                      {formatSupply(token.totalSupply, token.decimals)}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-gray-400 w-40 shrink-0">Decimals:</span>
                    <span className="text-white font-mono">{token.decimals}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Raw Data */}
            <JsonViewer data={token} title="Raw data" />
          </div>
        ) : null}
      </main>
    </div>
  );
}
