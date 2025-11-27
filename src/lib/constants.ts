// Application-wide constants for Zenon Explorer

export const CONFIG = {
  NODE: {
    DEFAULT_URL: process.env.NEXT_PUBLIC_ZENON_NODE_URL || 'wss://my.hc1node.com:35998',
    RECONNECT_MAX_ATTEMPTS: 5,
    RECONNECT_DELAY_MS: 1000,
    REQUEST_TIMEOUT_MS: 30000,
  },
  PAGINATION: {
    DEFAULT_SIZE: 10,
    SIZE_OPTIONS: [10, 25, 50, 100] as const,
  },
  DASHBOARD: {
    MOMENTUMS_COUNT: 8,
    TRANSACTIONS_COUNT: 8,
    REFRESH_INTERVAL_MS: 10000,
  },
  CACHE: {
    MOMENTUM_TTL_MS: 5 * 60 * 1000,      // 5 minutes - immutable once confirmed
    ACCOUNT_BLOCK_TTL_MS: 5 * 60 * 1000, // 5 minutes - immutable once confirmed
    TOKEN_TTL_MS: 5 * 60 * 1000,         // 5 minutes - token info rarely changes
    ACCOUNT_INFO_TTL_MS: 30 * 1000,      // 30 seconds - balances can change
    LIST_TTL_MS: 10 * 1000,              // 10 seconds - lists change frequently
    PILLAR_TTL_MS: 60 * 1000,            // 1 minute - pillar info updates periodically
  },
};

// Block type mapping for transaction types
export const BLOCK_TYPES: Record<number, string> = {
  1: 'GENESIS RECEIVE',
  2: 'USER SEND',
  3: 'USER RECEIVE',
  4: 'CONTRACT SEND',
  5: 'CONTRACT RECEIVE',
};

// Token standard addresses for ZNN and QSR
export const TOKEN_STANDARDS = {
  ZNN: 'zts1znnxxxxxxxxxxxxx9z4ulx',
  QSR: 'zts1qsrxxxxxxxxxxxxxmrhjll',
} as const;

// Display names for tokens
export const TOKEN_NAMES: Record<string, string> = {
  [TOKEN_STANDARDS.ZNN]: 'ZNN',
  [TOKEN_STANDARDS.QSR]: 'QSR',
};
