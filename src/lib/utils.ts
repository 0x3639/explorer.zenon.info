// Utility functions for Zenon Explorer

/**
 * Truncate a hash string for display
 */
export function truncateHash(hash: string, startChars = 24, endChars = 0): string {
  if (!hash) return '';
  if (hash.length <= startChars + endChars) return hash;

  if (endChars === 0) {
    return `${hash.slice(0, startChars)}...`;
  }
  return `${hash.slice(0, startChars)}...${hash.slice(-endChars)}`;
}

/**
 * Truncate an address for display (z1qrz...fejk9 format)
 */
export function truncateAddress(address: string): string {
  if (!address) return '';
  if (address.length <= 13) return address;
  return `${address.slice(0, 5)}...${address.slice(-5)}`;
}

/**
 * Format a timestamp to relative time (e.g., "19 seconds ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;

  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff} second${diff !== 1 ? 's' : ''} ago`;
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diff / 86400);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

/**
 * Format a Unix timestamp to a human-readable date string
 */
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a Unix timestamp to a full date string
 */
export function formatFullTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short',
  });
}

/**
 * Format a large number with commas
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return n.toLocaleString('en-US');
}

/**
 * Format token amount considering decimals
 */
export function formatTokenAmount(amount: string, decimals: number, maxDecimals = 3): string {
  const num = BigInt(amount);
  const divisor = BigInt(10 ** decimals);
  const intPart = num / divisor;
  const fracPart = num % divisor;

  if (fracPart === BigInt(0)) {
    return formatNumber(intPart.toString());
  }

  const fracStr = fracPart.toString().padStart(decimals, '0');
  const trimmedFrac = fracStr.slice(0, maxDecimals).replace(/0+$/, '');

  if (trimmedFrac === '') {
    return formatNumber(intPart.toString());
  }

  return `${formatNumber(intPart.toString())}.${trimmedFrac}`;
}

/**
 * Format ZNN amount (8 decimals)
 */
export function formatZNN(amount: string): string {
  return formatTokenAmount(amount, 8) + ' ZNN';
}

/**
 * Format QSR amount (8 decimals)
 */
export function formatQSR(amount: string): string {
  return formatTokenAmount(amount, 8) + ' QSR';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get token symbol from token standard
 */
export function getTokenSymbol(tokenStandard: string): string {
  if (tokenStandard === 'zts1znnxxxxxxxxxxxxx9z4ulx') return 'ZNN';
  if (tokenStandard === 'zts1qsrxxxxxxxxxxxxxmrhjll') return 'QSR';
  return tokenStandard.slice(0, 10) + '...';
}

/**
 * Check if token is ZNN
 */
export function isZNN(tokenStandard: string): boolean {
  return tokenStandard === 'zts1znnxxxxxxxxxxxxx9z4ulx';
}

/**
 * Check if token is QSR
 */
export function isQSR(tokenStandard: string): boolean {
  return tokenStandard === 'zts1qsrxxxxxxxxxxxxxmrhjll';
}

/**
 * Calculate pagination info
 */
export function getPaginationInfo(page: number, pageSize: number, total: number) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);

  return {
    start,
    end,
    totalPages,
    hasNext: page < totalPages - 1,
    hasPrev: page > 0,
  };
}
