'use client';

import React, { useState, memo } from 'react';
import Link from 'next/link';
import { truncateHash, truncateAddress, copyToClipboard } from '@/lib/utils';

interface HashLinkProps {
  hash: string;
  href?: string;
  type?: 'hash' | 'address' | 'zts' | 'momentum' | 'transaction';
  truncateStart?: number;
  truncateEnd?: number;
  showCopy?: boolean;
  linkToDetail?: boolean;
  isCurrentPage?: boolean;
  noTruncate?: boolean;
}

export const HashLink = memo(function HashLink({
  hash,
  href,
  type = 'hash',
  truncateStart = 24,
  truncateEnd = 0,
  showCopy = true,
  linkToDetail = false,
  isCurrentPage = false,
  noTruncate = false,
}: HashLinkProps) {
  const [copied, setCopied] = useState(false);

  const displayHash = noTruncate
    ? hash
    : type === 'address'
      ? truncateAddress(hash)
      : truncateHash(hash, truncateStart, truncateEnd);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await copyToClipboard(hash);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Determine the link URL based on type
  const getDetailUrl = () => {
    if (href) return href;
    if (!linkToDetail) return null;

    switch (type) {
      case 'momentum':
        return `/momentum/${hash}`;
      case 'hash':
        return `/hash/${hash}`;
      case 'address':
        return `/address/${hash}`;
      case 'transaction':
        return `/transaction/${hash}`;
      case 'zts':
        return `/token/${hash}`;
      default:
        return null;
    }
  };

  const detailUrl = getDetailUrl();

  const content = (
    <span className="inline-flex items-center gap-1 group">
      <span className="hash-link font-mono text-sm">{displayHash}</span>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
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
      )}
    </span>
  );

  // If on current page, show underline on hover but don't make it clickable
  if (isCurrentPage) {
    return (
      <span className="inline-flex items-center hover:underline cursor-default">
        {content}
      </span>
    );
  }

  if (detailUrl) {
    return (
      <Link href={detailUrl} className="inline-flex items-center hover:underline">
        {content}
      </Link>
    );
  }

  return content;
});

// Convenience component for momentum height links
interface MomentumHeightLinkProps {
  height: number;
  className?: string;
  showCopy?: boolean;
}

export const MomentumHeightLink = memo(function MomentumHeightLink({ height, className = '', showCopy = false }: MomentumHeightLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const success = await copyToClipboard(height.toString());
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span className="inline-flex items-center gap-1 group">
      <Link
        href={`/momentum/${height}`}
        className={`text-[#7fff00] font-mono hover:underline ${className}`}
      >
        {height.toLocaleString()}
      </Link>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#2a2a2a] rounded"
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
      )}
    </span>
  );
});
