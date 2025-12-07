# Bridge Page Feature

## Status: In Progress

**Branch:** `feature/bridge-page`

## Overview

The Bridge page displays real-time orchestrator status for the Zenon Network bridge. It monitors 20 orchestrator nodes (pillars) that handle cross-chain bridging operations.

## Current Implementation

### What's Working
- Bridge page accessible at `/bridge`
- Navigation link added to header
- Summary cards showing: Bridge Status, Total/Online/Offline counts, Query Time
- Orchestrator table with columns: Pillar, Status, State, Producer, BNB, ETH, Supernova, Error
- Auto-refresh every 30 seconds + on page focus
- Mobile-responsive design with card view
- Pillar names link to `/pillar/{producerAddress}`
- Producer addresses are clickable and link to `/address/{address}`
- Static producer address mapping (doesn't rely on RPC calls for addresses)

### Architecture

```
Browser → /api/bridge/status → Cloudflare Edge → Orchestrator IPs (port 55000)
```

The Edge API route queries orchestrators directly, eliminating the need for a separate Python backend.

### Files Created

| File | Purpose |
|------|---------|
| `src/app/api/bridge/status/route.ts` | Edge API route - queries orchestrators |
| `src/app/bridge/page.tsx` | Main bridge page component |
| `src/lib/bridge-api.ts` | Client-side fetch wrapper |
| `src/components/bridge/BridgeSummary.tsx` | Summary cards component |
| `src/components/bridge/StatusBadge.tsx` | Online/offline status indicator |

### Files Modified

| File | Changes |
|------|---------|
| `src/types/zenon.ts` | Added `BridgeStatus`, `Orchestrator`, `NetworkStats` types |
| `src/lib/constants.ts` | Added `BRIDGE_CONFIG`, state mappings, `PILLAR_MAPPING` with producer addresses |
| `src/components/layout/Header.tsx` | Added "Bridge" nav item |

## Known Issues / TODO

1. **RPC Queries May Fail**: The Edge function queries orchestrators via HTTP to port 55000. Some orchestrators may be unreachable, showing "offline" with error messages.

2. **Cloudflare Edge Limitations**: Need to verify the API route works correctly when deployed to Cloudflare Pages (HTTP calls to external IPs from edge functions).

3. **Missing Features from Python Version**:
   - No sorting by column
   - No filtering options
   - No historical data

## Orchestrator Mapping

The 20 orchestrators are statically mapped in `src/lib/constants.ts` under `PILLAR_MAPPING`. Each entry contains:
- IP address (key)
- Pillar name
- Public key
- Producer address

If orchestrator IPs change, this mapping needs to be updated manually.

## Testing

```bash
# Start dev server
npm run dev

# Visit bridge page
open http://localhost:3000/bridge

# Test API directly
curl http://localhost:3000/api/bridge/status | jq
```

## Deployment

The bridge page uses Edge runtime and should work with Cloudflare Pages:

```bash
npm run pages:build
npm run preview  # Test locally with Wrangler
```

## Reference

Original Python implementation: `/Users/dfriestedt/Github/orchestrator-status-page`
