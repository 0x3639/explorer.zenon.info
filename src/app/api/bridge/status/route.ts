import { NextResponse } from 'next/server';
import {
  BRIDGE_CONFIG,
  PILLAR_MAPPING,
  ORCHESTRATOR_STATE_MAP,
  ORCHESTRATOR_ONLINE_STATES,
} from '@/lib/constants';
import type { Orchestrator, BridgeStatus } from '@/types/zenon';

export const runtime = 'edge';

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

export async function GET() {
  const startTime = Date.now();

  const orchestratorPromises = Object.entries(PILLAR_MAPPING).map(
    ([ip, pillarInfo]) => queryOrchestrator(ip, pillarInfo)
  );

  const orchestrators = await Promise.all(orchestratorPromises);

  const queryTime = (Date.now() - startTime) / 1000;
  const onlineCount = orchestrators.filter((o) => o.status === 'online').length;
  const totalCount = orchestrators.length;

  const bridgeStatus: BridgeStatus = {
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

  return NextResponse.json(bridgeStatus, {
    headers: {
      'Cache-Control': 'public, max-age=10, stale-while-revalidate=20',
    },
  });
}
