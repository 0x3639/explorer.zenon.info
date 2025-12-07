import { NextResponse } from 'next/server';
import {
  BRIDGE_CONFIG,
  BRIDGE_API_CONFIG,
  PILLAR_MAPPING,
  ORCHESTRATOR_STATE_MAP,
  ORCHESTRATOR_ONLINE_STATES,
} from '@/lib/constants';
import type { Orchestrator, BridgeStatus } from '@/types/zenon';

// Types for the external Bridge API response
interface ExternalNetworkStat {
  network: string;
  wraps_count: number;
  unwraps_count: number;
}

interface ExternalOrchestrator {
  node_id: number;
  node_name: string;
  ip_address: string;
  pillar_name: string | null;
  producer_address: string | null;
  state: number | null;
  state_name: string | null;
  is_online: boolean;
  response_time_ms: number;
  error_message: string | null;
  network_stats: ExternalNetworkStat[];
  last_checked: string;
}

interface ExternalApiResponse {
  timestamp: string;
  bridge_status: string;
  online_count: number;
  total_count: number;
  min_required: number;
  orchestrators: ExternalOrchestrator[];
}

// Transform external API response to internal format
function transformApiResponse(apiData: ExternalApiResponse): BridgeStatus {
  const orchestrators: Orchestrator[] = apiData.orchestrators.map((ext) => {
    // Convert network_stats array to object
    const networkStatsMap: Record<string, { wraps: number; unwraps: number }> = {};
    for (const stat of ext.network_stats) {
      networkStatsMap[stat.network] = {
        wraps: stat.wraps_count,
        unwraps: stat.unwraps_count,
      };
    }

    return {
      ip: ext.ip_address,
      pillar_name: ext.pillar_name || ext.node_name,
      producer_address: ext.producer_address || '',
      status: ext.is_online ? 'online' : 'offline',
      state: ext.state_name || 'Unknown',
      state_num: ext.state ?? -1,
      network_stats: {
        bnb: networkStatsMap['bnb'] || { wraps: 0, unwraps: 0 },
        eth: networkStatsMap['eth'] || { wraps: 0, unwraps: 0 },
        supernova: networkStatsMap['supernova'] || { wraps: 0, unwraps: 0 },
      },
      error: ext.error_message,
      response_time_ms: ext.response_time_ms,
      last_checked: ext.last_checked,
    };
  });

  return {
    timestamp: apiData.timestamp,
    bridge_status: apiData.bridge_status === 'online' ? 'online' : 'offline',
    online_count: apiData.online_count,
    total_count: apiData.total_count,
    query_time_seconds: 0, // API doesn't provide this, but it's fast
    orchestrators: orchestrators.sort((a, b) =>
      a.pillar_name.localeCompare(b.pillar_name)
    ),
  };
}

// Fetch from the centralized Bridge API
async function fetchFromBridgeApi(): Promise<BridgeStatus | null> {
  const token = process.env.BRIDGE_API_TOKEN;
  if (!token) {
    console.log('BRIDGE_API_TOKEN not configured, using fallback');
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BRIDGE_API_CONFIG.TIMEOUT_MS);

    const response = await fetch(BRIDGE_API_CONFIG.URL, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Bridge API returned ${response.status}, using fallback`);
      return null;
    }

    const data: ExternalApiResponse = await response.json();
    return transformApiResponse(data);
  } catch (error) {
    console.log('Bridge API fetch failed, using fallback:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

// ============================================================
// Fallback: Direct orchestrator queries (existing implementation)
// ============================================================

interface OrchestratorStatus {
  state: number;
  bnbWraps: number;
  bnbUnwraps: number;
  ethWraps: number;
  ethUnwraps: number;
  supernovaWraps: number;
  supernovaUnwraps: number;
}

async function makeRpcCall<T>(
  ip: string,
  method: string,
  signal: AbortSignal
): Promise<T> {
  const url = `http://${ip}:${BRIDGE_CONFIG.ORCHESTRATOR_PORT}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params: [],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'RPC Error');
  }

  return data.result;
}

async function queryOrchestrator(
  ip: string,
  pillarInfo: { name: string; pubkey: string; producerAddress: string }
): Promise<Orchestrator> {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    BRIDGE_CONFIG.REQUEST_TIMEOUT_MS
  );

  try {
    const status = await makeRpcCall<OrchestratorStatus>(
      ip,
      'getStatus',
      controller.signal
    );

    clearTimeout(timeoutId);

    const stateNum = status.state;
    const isOnline = ORCHESTRATOR_ONLINE_STATES.includes(stateNum);
    const stateName = ORCHESTRATOR_STATE_MAP[stateNum] || 'Unknown';

    return {
      ip,
      pillar_name: pillarInfo.name,
      producer_address: pillarInfo.producerAddress,
      status: isOnline ? 'online' : 'offline',
      state: stateName,
      state_num: stateNum,
      network_stats: {
        bnb: { wraps: status.bnbWraps || 0, unwraps: status.bnbUnwraps || 0 },
        eth: { wraps: status.ethWraps || 0, unwraps: status.ethUnwraps || 0 },
        supernova: {
          wraps: status.supernovaWraps || 0,
          unwraps: status.supernovaUnwraps || 0,
        },
      },
      error: null,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const errorMessage =
      error instanceof Error ? error.message : 'Connection failed';

    return {
      ip,
      pillar_name: pillarInfo.name,
      producer_address: pillarInfo.producerAddress,
      status: 'offline',
      state: 'Unknown',
      state_num: -1,
      network_stats: {
        bnb: { wraps: 0, unwraps: 0 },
        eth: { wraps: 0, unwraps: 0 },
        supernova: { wraps: 0, unwraps: 0 },
      },
      error: errorMessage,
    };
  }
}

async function queryOrchestratorsDirectly(): Promise<BridgeStatus> {
  const startTime = Date.now();

  const orchestratorPromises = Object.entries(PILLAR_MAPPING).map(
    ([ip, pillarInfo]) => queryOrchestrator(ip, pillarInfo)
  );

  const orchestrators = await Promise.all(orchestratorPromises);

  const queryTime = (Date.now() - startTime) / 1000;
  const onlineCount = orchestrators.filter((o) => o.status === 'online').length;
  const totalCount = orchestrators.length;

  return {
    timestamp: new Date().toISOString(),
    bridge_status:
      onlineCount >= BRIDGE_CONFIG.MIN_ONLINE_FOR_BRIDGE ? 'online' : 'offline',
    online_count: onlineCount,
    total_count: totalCount,
    query_time_seconds: Math.round(queryTime * 100) / 100,
    orchestrators: orchestrators.sort((a, b) =>
      a.pillar_name.localeCompare(b.pillar_name)
    ),
  };
}

// ============================================================
// Main GET handler
// ============================================================

export async function GET() {
  // Try the centralized Bridge API first
  const apiResult = await fetchFromBridgeApi();

  if (apiResult) {
    return NextResponse.json(apiResult, {
      headers: {
        'Cache-Control': 'public, max-age=10, stale-while-revalidate=20',
      },
    });
  }

  // Fallback to direct orchestrator queries
  const fallbackResult = await queryOrchestratorsDirectly();

  return NextResponse.json(fallbackResult, {
    headers: {
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=20',
    },
  });
}
