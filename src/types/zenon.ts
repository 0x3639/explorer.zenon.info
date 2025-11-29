// Zenon Network Types

export interface Momentum {
  version: number;
  chainIdentifier: number;
  hash: string;
  previousHash: string;
  height: number;
  timestamp: number;
  data: string;
  content: AccountBlock[];
  changesHash: string;
  publicKey: string;
  signature: string;
  producer: string;
}

export interface MomentumList {
  count: number;
  list: Momentum[];
}

export interface AccountBlock {
  version: number;
  chainIdentifier: number;
  blockType: number;
  hash: string;
  previousHash: string;
  height: number;
  momentumAcknowledged: {
    hash: string;
    height: number;
  };
  address: string;
  toAddress: string;
  amount: string;
  tokenStandard: string;
  fromBlockHash: string;
  descendantBlocks: AccountBlock[];
  data: string;
  fusedPlasma: number;
  difficulty: number;
  nonce: string;
  basePlasma: number;
  usedPlasma: number;
  changesHash: string;
  publicKey: string;
  signature: string;
  token?: Token;
  confirmationDetail?: {
    numConfirmations: number;
    momentumHeight: number;
    momentumHash: string;
    momentumTimestamp: number;
  };
  pairedAccountBlock?: AccountBlock;
}

export interface AccountBlockList {
  count: number;
  list: AccountBlock[];
  more: boolean;
}

export interface Pillar {
  name: string;
  rank: number;
  type: number;
  ownerAddress: string;
  producerAddress: string;
  withdrawAddress: string;
  giveMomentumRewardPercentage: number;
  giveDelegateRewardPercentage: number;
  isRevocable: boolean;
  revokeCooldown: number;
  revokeTimestamp: number;
  currentStats: {
    producedMomentums: number;
    expectedMomentums: number;
  };
  weight: string;
}

export interface PillarList {
  count: number;
  list: Pillar[];
}

export interface Sentinel {
  owner: string;
  registrationTimestamp: number;
  isRevocable: boolean;
  revokeCooldown: number;
  active: boolean;
}

export interface SentinelList {
  count: number;
  list: Sentinel[];
}

export interface Token {
  name: string;
  symbol: string;
  domain: string;
  totalSupply: string;
  decimals: number;
  owner: string;
  tokenStandard: string;
  maxSupply: string;
  isBurnable: boolean;
  isMintable: boolean;
  isUtility: boolean;
}

export interface TokenList {
  count: number;
  list: Token[];
}

export interface AccountInfo {
  address: string;
  accountHeight: number;
  balanceInfoMap: Record<string, {
    token: Token;
    balance: string;
  }>;
}

export interface SyncInfo {
  state: number;
  currentHeight: number;
  targetHeight: number;
}

// JSON-RPC Types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: unknown[];
}

export interface JsonRpcResponse<T = unknown> {
  jsonrpc: '2.0';
  id: number;
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Bridge Orchestrator Types
export interface NetworkStats {
  wraps: number;
  unwraps: number;
}

export interface Orchestrator {
  ip: string;
  pillar_name: string;
  producer_address: string;
  status: 'online' | 'offline';
  state: string;
  state_num: number;
  network_stats: {
    bnb: NetworkStats;
    eth: NetworkStats;
    supernova: NetworkStats;
  };
  error: string | null;
  response_time_ms?: number;
  last_checked?: string;
}

export interface BridgeStatus {
  timestamp: string;
  bridge_status: 'online' | 'offline';
  online_count: number;
  total_count: number;
  query_time_seconds: number;
  orchestrators: Orchestrator[];
}
