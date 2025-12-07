import { NextRequest, NextResponse } from 'next/server';
import { BRIDGE_API_CONFIG } from '@/lib/constants';

const BRIDGE_REQUESTS_BASE_URL = 'https://bridgeapi.zenon.info/api/v1/bridge';

// API response types from the Bridge API
interface BridgeApiWrapItem {
  request_id: string;
  network_class: number;
  chain_id: number;
  to_address: string;
  token_standard: string;
  token_address: string;
  amount: string;
  fee: string;
  signature: string;
  creation_momentum_height: number;
  confirmations_to_finality: number;
  token_name: string;
  token_symbol: string;
  token_decimals: number;
  token_domain: string;
}

interface BridgeApiUnwrapItem {
  registration_momentum_height: number;
  network_class: number;
  chain_id: number;
  transaction_hash: string;
  log_index: number;
  to_address: string;
  token_standard: string;
  token_address: string;
  amount: string;
  signature: string;
  redeemed: boolean;
  revoked: boolean;
  token_name: string;
  token_symbol: string;
  token_decimals: number;
  token_domain: string;
  redeemable_in: number;
}

interface BridgeApiResponse<T> {
  count: number;
  page: number;
  page_size: number;
  items: T[];
}

// Ensure amount is a proper integer string (not scientific notation)
function normalizeAmount(amount: string | number): string {
  if (typeof amount === 'number') {
    // Convert number to string without scientific notation
    return BigInt(Math.floor(amount)).toString();
  }
  if (amount.includes('E') || amount.includes('e')) {
    return BigInt(Math.floor(Number(amount))).toString();
  }
  return amount;
}

// Transform API wrap item to internal format (matching existing WrapRequest type)
function transformWrapItem(item: BridgeApiWrapItem) {
  return {
    id: item.request_id,
    networkClass: item.network_class,
    chainId: item.chain_id,
    toAddress: item.to_address,
    tokenStandard: item.token_standard,
    tokenAddress: item.token_address,
    amount: normalizeAmount(item.amount),
    fee: normalizeAmount(item.fee),
    signature: item.signature,
    creationMomentumHeight: item.creation_momentum_height,
    confirmationsToFinality: item.confirmations_to_finality,
    token: {
      name: item.token_name,
      symbol: item.token_symbol,
      decimals: item.token_decimals,
      domain: item.token_domain,
      tokenStandard: item.token_standard,
      totalSupply: '0',
      maxSupply: '0',
      owner: '',
      isBurnable: false,
      isMintable: false,
      isUtility: false,
    },
  };
}

// Transform API unwrap item to internal format (matching existing UnwrapRequest type)
function transformUnwrapItem(item: BridgeApiUnwrapItem) {
  return {
    registrationMomentumHeight: item.registration_momentum_height,
    networkClass: item.network_class,
    chainId: item.chain_id,
    transactionHash: item.transaction_hash,
    logIndex: item.log_index,
    toAddress: item.to_address,
    tokenStandard: item.token_standard,
    tokenAddress: item.token_address,
    amount: normalizeAmount(item.amount),
    signature: item.signature,
    redeemed: item.redeemed ? 1 : 0,
    revoked: item.revoked ? 1 : 0,
    redeemableIn: item.redeemable_in,
    token: {
      name: item.token_name,
      symbol: item.token_symbol,
      decimals: item.token_decimals,
      domain: item.token_domain,
      tokenStandard: item.token_standard,
      totalSupply: '0',
      maxSupply: '0',
      owner: '',
      isBurnable: false,
      isMintable: false,
      isUtility: false,
    },
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const type = searchParams.get('type') || 'wraps';
  const page = searchParams.get('page') || '0';
  const pageSize = searchParams.get('page_size') || '10';

  // Build the API URL with filters
  const apiUrl = new URL(`${BRIDGE_REQUESTS_BASE_URL}/${type}`);
  apiUrl.searchParams.set('page', page);
  apiUrl.searchParams.set('page_size', pageSize);

  // Forward filter parameters
  const filterParams = [
    'chain_id',
    'token_symbol',
    'token_standard',
    'to_address',
  ];

  // Wrap-specific filters
  if (type === 'wraps') {
    filterParams.push('confirmations_to_finality');
  }

  // Unwrap-specific filters
  if (type === 'unwraps') {
    filterParams.push('redeemed', 'revoked');
  }

  for (const param of filterParams) {
    const value = searchParams.get(param);
    if (value !== null && value !== '' && value !== 'all') {
      apiUrl.searchParams.set(param, value);
    }
  }

  const token = process.env.BRIDGE_API_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'API not configured', fallback: true },
      { status: 503 }
    );
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BRIDGE_API_CONFIG.TIMEOUT_MS);

    const response = await fetch(apiUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Bridge API returned ${response.status} for ${type}`);
      return NextResponse.json(
        { error: `API returned ${response.status}`, fallback: true },
        { status: response.status }
      );
    }

    if (type === 'wraps') {
      const data: BridgeApiResponse<BridgeApiWrapItem> = await response.json();
      return NextResponse.json({
        count: data.count,
        page: data.page,
        pageSize: data.page_size,
        list: data.items.map(transformWrapItem),
        source: 'api',
      }, {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=20',
        },
      });
    } else {
      const data: BridgeApiResponse<BridgeApiUnwrapItem> = await response.json();
      return NextResponse.json({
        count: data.count,
        page: data.page,
        pageSize: data.page_size,
        list: data.items.map(transformUnwrapItem),
        source: 'api',
      }, {
        headers: {
          'Cache-Control': 'public, max-age=10, stale-while-revalidate=20',
        },
      });
    }
  } catch (error) {
    console.log('Bridge API fetch failed:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'API request failed', fallback: true },
      { status: 503 }
    );
  }
}
