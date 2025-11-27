'use client';

import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { HashLink } from '@/components/ui/HashLink';
import { formatTokenAmount } from '@/lib/utils';
import { zenonClient } from '@/lib/zenon-api';
import type { AccountBlock } from '@/types/zenon';

// Transaction icon SVG
const TransactionIcon = () => (
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
      d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
    />
  </svg>
);

interface TransactionsListProps {
  isConnected?: boolean;
}

export const TransactionsList = memo(function TransactionsList({ isConnected = false }: TransactionsListProps) {
  const [transactions, setTransactions] = useState<AccountBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!zenonClient.isConnected()) {
      return;
    }
    try {
      // Get the latest momentums with their blocks
      // Fetch 500 momentums (~83 minutes) to find transactions during quiet periods
      const frontier = await zenonClient.getFrontierMomentum();
      const height = Math.max(frontier.height - 499, 1);
      const result = await zenonClient.getDetailedMomentumsByHeight(height, 500);

      // Extract all account blocks from momentums
      const blocks: AccountBlock[] = [];
      result.list.forEach((item) => {
        if (item.blocks) {
          // Handle both possible structures
          if (Array.isArray(item.blocks)) {
            blocks.push(...item.blocks);
          } else if (item.blocks.list && Array.isArray(item.blocks.list)) {
            blocks.push(...item.blocks.list);
          }
        }
      });

      // Reverse to show newest first and take the most recent 8
      setTransactions(blocks.reverse().slice(0, 8));
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      setLoading(false);
    }
  }, []);

  const subscriptionRef = useRef<string | null>(null);

  useEffect(() => {
    if (isConnected) {
      fetchTransactions();

      // Subscribe to new account blocks for real-time updates
      const subscribeToBlocks = async () => {
        try {
          subscriptionRef.current = await zenonClient.subscribeToAllAccountBlocks((block) => {
            setTransactions((prev) => {
              const newBlock = block as AccountBlock;
              // Check if this block already exists (avoid duplicates)
              if (prev.some((tx) => tx.hash === newBlock.hash)) {
                return prev;
              }
              return [newBlock, ...prev].slice(0, 8);
            });
          });
        } catch {
          // Subscription failed, fall back to polling
          const interval = setInterval(fetchTransactions, 10000);
          return () => clearInterval(interval);
        }
      };

      subscribeToBlocks();

      return () => {
        if (subscriptionRef.current) {
          zenonClient.unsubscribe(subscriptionRef.current);
          subscriptionRef.current = null;
        }
      };
    }
  }, [isConnected, fetchTransactions]);

  const renderAmount = (block: AccountBlock) => {
    if (!block.amount || block.amount === '0') {
      return <span>Amount: 0</span>;
    }

    const decimals = block.token?.decimals || 8;
    const symbol = block.token?.symbol || 'ZNN';
    const amount = formatTokenAmount(block.amount, decimals);

    return (
      <span>
        Amount: {amount}{' '}
        {block.tokenStandard ? (
          <Link href={`/token/${block.tokenStandard}`} className="text-[#7fff00] hover:underline">
            {symbol}
          </Link>
        ) : (
          <span className="text-[#7fff00]">{symbol}</span>
        )}
      </span>
    );
  };

  if (loading) {
    return (
      <Card title="Transactions" icon={<TransactionIcon />}>
        <div className="animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-3">
              <div className="h-4 bg-[#2a2a2a] rounded w-64 mb-2" />
              <div className="h-3 bg-[#2a2a2a] rounded w-32" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card title="Transactions" icon={<TransactionIcon />}>
        <div className="px-4 py-8 text-center text-gray-500">
          No recent transactions
        </div>
      </Card>
    );
  }

  return (
    <Card title="Transactions" icon={<TransactionIcon />} viewAllHref="/transactions">
      {transactions.map((tx) => (
        <div
          key={tx.hash}
          className="px-4 py-3 hover:bg-[#222] transition-colors"
        >
          <HashLink hash={tx.hash} truncateStart={36} type="transaction" linkToDetail showCopy />
          <div className="text-gray-400 text-sm mt-1">{renderAmount(tx)}</div>
        </div>
      ))}
    </Card>
  );
});
