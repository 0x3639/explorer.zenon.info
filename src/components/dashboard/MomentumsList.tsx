'use client';

import React, { useEffect, useState, useCallback, memo } from 'react';
import { Card } from '@/components/ui/Card';
import { HashLink, MomentumHeightLink } from '@/components/ui/HashLink';
import { formatRelativeTime, formatTimestamp } from '@/lib/utils';
import { zenonClient } from '@/lib/zenon-api';
import type { Momentum } from '@/types/zenon';

// Momentum icon SVG
const MomentumIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
    />
  </svg>
);

interface MomentumsListProps {
  isConnected?: boolean;
}

export const MomentumsList = memo(function MomentumsList({ isConnected = false }: MomentumsListProps) {
  const [momentums, setMomentums] = useState<Momentum[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMomentums = useCallback(async () => {
    if (!zenonClient.isConnected()) {
      return;
    }
    try {
      // Get the latest momentum first
      const frontier = await zenonClient.getFrontierMomentum();
      // Then get the last 8 momentums
      const height = Math.max(frontier.height - 7, 1);
      const result = await zenonClient.getMomentumsByHeight(height, 8);
      // Reverse to show newest first
      setMomentums(result.list.reverse());
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch momentums:', error);
    }
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchMomentums();
      // Refresh every 10 seconds
      const interval = setInterval(fetchMomentums, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected, fetchMomentums]);

  if (loading) {
    return (
      <Card title="Momentums" icon={<MomentumIcon />} viewAllHref="/momentums">
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3 flex justify-between">
              <div className="space-y-2">
                <div className="h-4 bg-[#2a2a2a] rounded w-20" />
                <div className="h-3 bg-[#2a2a2a] rounded w-48" />
              </div>
              <div className="space-y-2 text-right">
                <div className="h-4 bg-[#2a2a2a] rounded w-24" />
                <div className="h-3 bg-[#2a2a2a] rounded w-32" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card title="Momentums" icon={<MomentumIcon />} viewAllHref="/momentums">
      {momentums.map((momentum) => (
        <div
          key={momentum.hash}
          className="px-4 py-3 flex justify-between items-start hover:bg-[#222] transition-colors"
        >
          <div className="space-y-1">
            <MomentumHeightLink height={momentum.height} className="text-sm font-medium" />
            <div>
              <HashLink hash={momentum.hash} truncateStart={28} type="momentum" linkToDetail showCopy />
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-gray-400 text-sm">
              {formatRelativeTime(momentum.timestamp)}
            </div>
            <div className="text-gray-500 text-xs">
              {formatTimestamp(momentum.timestamp)}
            </div>
          </div>
        </div>
      ))}
    </Card>
  );
});
