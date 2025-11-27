'use client';

import { useState } from 'react';
import Link from 'next/link';
import { copyToClipboard } from '@/lib/utils';

interface TokenSymbolLinkProps {
  symbol: string;
  tokenStandard: string;
  showCopy?: boolean;
  isCurrentPage?: boolean;
}

export function TokenSymbolLink({ symbol, tokenStandard, showCopy = true, isCurrentPage = false }: TokenSymbolLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await copyToClipboard(symbol);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const copyButton = showCopy && (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
      title={copied ? 'Copied!' : 'Copy symbol'}
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

  // If on current page, show underline on hover but don't make it clickable
  if (isCurrentPage) {
    return (
      <span className="inline-flex items-center gap-1 group">
        <span className="text-[#7fff00] hover:underline cursor-default">{symbol}</span>
        {copyButton}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 group">
      <Link
        href={`/token/${tokenStandard}`}
        className="text-[#7fff00] hover:underline"
      >
        {symbol}
      </Link>
      {copyButton}
    </span>
  );
}
