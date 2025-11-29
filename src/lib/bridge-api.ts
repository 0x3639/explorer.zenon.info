import type { BridgeStatus } from '@/types/zenon';

export async function fetchBridgeStatus(): Promise<BridgeStatus> {
  const response = await fetch('/api/bridge/status');

  if (!response.ok) {
    throw new Error(`Failed to fetch bridge status: ${response.status}`);
  }

  return response.json();
}
