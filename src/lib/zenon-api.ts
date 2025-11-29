// Zenon Network WebSocket API Client

import { z } from 'zod';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  Momentum,
  MomentumList,
  PillarList,
  SentinelList,
  TokenList,
  AccountBlockList,
  AccountInfo,
  SyncInfo,
  WrapRequestList,
  UnwrapRequestList,
} from '@/types/zenon';

const DEFAULT_NODE = process.env.NEXT_PUBLIC_ZENON_NODE_URL || 'wss://my.hc1node.com:35998';

// Zod schemas for runtime validation of WebSocket responses
const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal('2.0'),
  id: z.number(),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
  }).optional(),
});

const SubscriptionNotificationSchema = z.object({
  jsonrpc: z.literal('2.0'),
  method: z.literal('ledger.subscription'),
  params: z.object({
    subscription: z.string(),
    result: z.array(z.any()),
  }),
});

// Cache TTL constants (in milliseconds)
const CACHE_TTL = {
  MOMENTUM: 5 * 60 * 1000,      // 5 minutes - immutable once confirmed
  ACCOUNT_BLOCK: 5 * 60 * 1000, // 5 minutes - immutable once confirmed
  TOKEN: 5 * 60 * 1000,         // 5 minutes - token info rarely changes
  ACCOUNT_INFO: 30 * 1000,      // 30 seconds - balances can change
  LIST: 10 * 1000,              // 10 seconds - lists change frequently
  PILLAR: 60 * 1000,            // 1 minute - pillar info updates periodically
};

// Simple in-memory cache with TTL
class RequestCache {
  private cache = new Map<string, { data: unknown; expires: number }>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlMs: number): void {
    this.cache.set(key, { data, expires: Date.now() + ttlMs });
  }

  clear(): void {
    this.cache.clear();
  }
}

type MessageHandler = (response: JsonRpcResponse<unknown>) => void;
type SubscriptionHandler = (data: unknown) => void;

class ZenonClient {
  private ws: WebSocket | null = null;
  private messageId = 0;
  private pendingRequests: Map<number, MessageHandler> = new Map();
  private subscriptionHandlers: Map<string, SubscriptionHandler> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private nodeUrl: string = DEFAULT_NODE;
  private statusListeners: Set<(status: 'connecting' | 'connected' | 'disconnected' | 'error') => void> = new Set();
  private connectionPromise: Promise<void> | null = null;
  private isConnecting = false;
  private currentStatus: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private cache = new RequestCache();

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getStatus(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.currentStatus;
  }

  addStatusListener(listener: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) {
    this.statusListeners.add(listener);
    // Immediately notify of current status
    listener(this.currentStatus);
  }

  removeStatusListener(listener: (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void) {
    this.statusListeners.delete(listener);
  }

  private notifyStatusChange(status: 'connecting' | 'connected' | 'disconnected' | 'error') {
    this.currentStatus = status;
    this.statusListeners.forEach(listener => listener(status));
  }

  async waitForConnection(): Promise<void> {
    if (this.isConnected()) return;
    if (this.connectionPromise) {
      await this.connectionPromise;
    }
  }

  connect(nodeUrl?: string): Promise<void> {
    // If already connected or connecting to the same URL, reuse connection
    if (this.isConnected() && (nodeUrl || DEFAULT_NODE) === this.nodeUrl) {
      return Promise.resolve();
    }

    // If already connecting, return existing promise
    if (this.isConnecting && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.nodeUrl = nodeUrl || DEFAULT_NODE;
    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      this.notifyStatusChange('connecting');

      try {
        // Close existing connection if any
        if (this.ws) {
          this.ws.onclose = null; // Prevent reconnect attempt
          this.ws.close();
        }

        this.ws = new WebSocket(this.nodeUrl);

        this.ws.onopen = () => {
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.notifyStatusChange('connected');
          resolve();
        };

        this.ws.onclose = () => {
          this.isConnecting = false;
          this.notifyStatusChange('disconnected');
          this.attemptReconnect();
        };

        this.ws.onerror = () => {
          this.isConnecting = false;
          this.notifyStatusChange('error');
          reject(new Error('WebSocket connection error'));
        };

        this.ws.onmessage = (event) => {
          try {
            const rawData = JSON.parse(event.data);

            // Try to parse as subscription notification first
            const subscriptionResult = SubscriptionNotificationSchema.safeParse(rawData);
            if (subscriptionResult.success) {
              const { subscription, result } = subscriptionResult.data.params;
              const handler = this.subscriptionHandlers.get(subscription);
              if (handler && result) {
                result.forEach((item) => handler(item));
              }
              return;
            }

            // Parse as regular JSON-RPC response
            const responseResult = JsonRpcResponseSchema.safeParse(rawData);
            if (!responseResult.success) {
              console.error('Invalid JSON-RPC response:', responseResult.error);
              return;
            }

            const response = responseResult.data;
            const handler = this.pendingRequests.get(response.id);
            if (handler) {
              handler(response as JsonRpcResponse);
              this.pendingRequests.delete(response.id);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };
      } catch (error) {
        this.isConnecting = false;
        this.notifyStatusChange('error');
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.notifyStatusChange('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(this.nodeUrl).catch(() => {
        // Reconnection failed, will try again
      });
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
    this.subscriptionHandlers.clear();
    this.cache.clear();
  }

  // Helper for cached requests
  private async sendCached<T>(cacheKey: string, ttl: number, method: string, params?: unknown[]): Promise<T> {
    const cached = this.cache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const result = await this.send<T>(method, params);
    this.cache.set(cacheKey, result, ttl);
    return result;
  }

  private send<T>(method: string, params?: unknown[]): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'));
        return;
      }

      const id = ++this.messageId;
      const request: JsonRpcRequest = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      this.pendingRequests.set(id, (response) => {
        if (response.error) {
          reject(new Error(response.error.message));
        } else {
          resolve(response.result as T);
        }
      });

      this.ws.send(JSON.stringify(request));

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout after 30s: ${method}`));
        }
      }, 30000);
    });
  }

  // Ledger Methods
  async getFrontierMomentum(): Promise<Momentum> {
    // Not cached - always needs latest
    return this.send<Momentum>('ledger.getFrontierMomentum');
  }

  async getMomentumsByHeight(height: number, count: number): Promise<MomentumList> {
    // Cached - momentum data is immutable
    return this.sendCached<MomentumList>(
      `momentum:height:${height}:${count}`,
      CACHE_TTL.MOMENTUM,
      'ledger.getMomentumsByHeight',
      [height, count]
    );
  }

  async getMomentumsByPage(pageIndex: number, pageSize: number): Promise<MomentumList> {
    // Short cache - page 0 changes frequently with new momentums
    return this.sendCached<MomentumList>(
      `momentum:page:${pageIndex}:${pageSize}`,
      pageIndex === 0 ? CACHE_TTL.LIST : CACHE_TTL.MOMENTUM,
      'ledger.getMomentumsByPage',
      [pageIndex, pageSize]
    );
  }

  async getMomentumByHash(hash: string): Promise<Momentum> {
    // Cached - momentum data is immutable once confirmed
    return this.sendCached<Momentum>(
      `momentum:hash:${hash}`,
      CACHE_TTL.MOMENTUM,
      'ledger.getMomentumByHash',
      [hash]
    );
  }

  async getDetailedMomentumsByHeight(height: number, count: number): Promise<{ list: Array<{ momentum: Momentum; blocks: AccountBlockList }> }> {
    // Cached - detailed momentum data is immutable
    return this.sendCached(
      `momentum:detailed:${height}:${count}`,
      CACHE_TTL.MOMENTUM,
      'ledger.getDetailedMomentumsByHeight',
      [height, count]
    );
  }

  // Account Block Methods
  async getAccountBlocksByPage(address: string, pageIndex: number, pageSize: number): Promise<AccountBlockList> {
    // Short cache - account blocks can be added frequently
    return this.sendCached<AccountBlockList>(
      `blocks:${address}:${pageIndex}:${pageSize}`,
      CACHE_TTL.LIST,
      'ledger.getAccountBlocksByPage',
      [address, pageIndex, pageSize]
    );
  }

  async getAccountBlockByHash(hash: string): Promise<import('@/types/zenon').AccountBlock> {
    // Cached - block data is immutable once confirmed
    return this.sendCached(
      `block:${hash}`,
      CACHE_TTL.ACCOUNT_BLOCK,
      'ledger.getAccountBlockByHash',
      [hash]
    );
  }

  async getAccountInfoByAddress(address: string): Promise<AccountInfo> {
    // Short cache - balances can change
    return this.sendCached<AccountInfo>(
      `account:${address}`,
      CACHE_TTL.ACCOUNT_INFO,
      'ledger.getAccountInfoByAddress',
      [address]
    );
  }

  async getUnreceivedBlocksByAddress(address: string, pageIndex: number, pageSize: number): Promise<AccountBlockList> {
    // Short cache - unreceived blocks change when received
    return this.sendCached<AccountBlockList>(
      `unreceived:${address}:${pageIndex}:${pageSize}`,
      CACHE_TTL.LIST,
      'ledger.getUnreceivedBlocksByAddress',
      [address, pageIndex, pageSize]
    );
  }

  // Embedded Contract Methods
  async getAllPillars(pageIndex: number, pageSize: number): Promise<PillarList> {
    // Medium cache - pillar list doesn't change often
    return this.sendCached<PillarList>(
      `pillars:${pageIndex}:${pageSize}`,
      CACHE_TTL.PILLAR,
      'embedded.pillar.getAll',
      [pageIndex, pageSize]
    );
  }

  async getPillarByName(name: string): Promise<import('@/types/zenon').Pillar> {
    // Medium cache - pillar info doesn't change often
    return this.sendCached(
      `pillar:${name}`,
      CACHE_TTL.PILLAR,
      'embedded.pillar.getByName',
      [name]
    );
  }

  async getAllActiveSentinels(pageIndex: number, pageSize: number): Promise<SentinelList> {
    // Medium cache - sentinel list doesn't change often
    return this.sendCached<SentinelList>(
      `sentinels:${pageIndex}:${pageSize}`,
      CACHE_TTL.PILLAR,
      'embedded.sentinel.getAllActive',
      [pageIndex, pageSize]
    );
  }

  async getAllTokens(pageIndex: number, pageSize: number): Promise<TokenList> {
    // Long cache - token list rarely changes
    return this.sendCached<TokenList>(
      `tokens:${pageIndex}:${pageSize}`,
      CACHE_TTL.TOKEN,
      'embedded.token.getAll',
      [pageIndex, pageSize]
    );
  }

  async getTokenByZts(zts: string): Promise<import('@/types/zenon').Token> {
    // Long cache - token info rarely changes
    return this.sendCached(
      `token:${zts}`,
      CACHE_TTL.TOKEN,
      'embedded.token.getByZts',
      [zts]
    );
  }

  // Stats Methods
  async getSyncInfo(): Promise<SyncInfo> {
    // Not cached - needs real-time sync status
    return this.send<SyncInfo>('stats.syncInfo');
  }

  // Subscription Methods
  async subscribeToMomentums(handler: SubscriptionHandler): Promise<string> {
    const subscriptionId = await this.send<string>('ledger.subscribe', ['momentums']);
    this.subscriptionHandlers.set(subscriptionId, handler);
    return subscriptionId;
  }

  async subscribeToAllAccountBlocks(handler: SubscriptionHandler): Promise<string> {
    const subscriptionId = await this.send<string>('ledger.subscribe', ['allAccountBlocks']);
    this.subscriptionHandlers.set(subscriptionId, handler);
    return subscriptionId;
  }

  unsubscribe(subscriptionId: string) {
    this.subscriptionHandlers.delete(subscriptionId);
  }

  // Bridge Methods
  async getAllWrapTokenRequests(pageIndex: number, pageSize: number): Promise<WrapRequestList> {
    return this.sendCached<WrapRequestList>(
      `bridge:wraps:${pageIndex}:${pageSize}`,
      CACHE_TTL.LIST,
      'embedded.bridge.getAllWrapTokenRequests',
      [pageIndex, pageSize]
    );
  }

  async getAllUnwrapTokenRequests(pageIndex: number, pageSize: number): Promise<UnwrapRequestList> {
    return this.sendCached<UnwrapRequestList>(
      `bridge:unwraps:${pageIndex}:${pageSize}`,
      CACHE_TTL.LIST,
      'embedded.bridge.getAllUnwrapTokenRequests',
      [pageIndex, pageSize]
    );
  }
}

// Singleton instance
export const zenonClient = new ZenonClient();

export default ZenonClient;
