# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server at localhost:3000

# Production builds
npm run build            # Standard Next.js build
npm run preview          # Build for Cloudflare Workers and preview locally

# Deploy to Cloudflare
npm run deploy           # Build and deploy to Cloudflare Workers

# Linting
npm run lint
```

## Architecture Overview

Zenon Explorer is a blockchain explorer for the Zenon Network. It connects to Zenon nodes via WebSocket JSON-RPC to display real-time data (momentums, transactions, pillars, sentinels, ZTS tokens).

### Core Architecture Pattern

```
ZenonProvider (context)
  ├── useNodeManager (hook) - manages node list + localStorage persistence
  └── zenonClient (singleton) - single WebSocket connection shared by all components
        └── RequestCache - in-memory TTL cache for API responses
```

**Key Decision**: Singleton WebSocket client with provider-based state. Components use `useZenon()` hook for connection status and `zenonClient` directly for data fetching.

### WebSocket Client (`src/lib/zenon-api.ts`)

- **Singleton**: One `ZenonClient` instance manages all connections
- **Observer Pattern**: Status listeners for connection state changes
- **Request Tracking**: Maps request IDs to response handlers
- **Auto-Reconnect**: Exponential backoff (1s, 2s, 4s...) up to 5 attempts
- **Caching**: TTL-based cache with different durations per data type:
  - Momentums/Blocks: 5 min (immutable once confirmed)
  - AccountInfo: 30 sec (balances change frequently)
  - Lists: 10 sec (change constantly)

### State Management

- `ZenonProvider` (`src/contexts/`) - wraps app, provides `useZenon()` hook
- `useNodeManager` (`src/hooks/`) - node list with localStorage persistence
- No external state library - React context + local state only

### Routing Structure

Dynamic routes use Node.js runtime via @opennextjs/cloudflare:

```
/                         # Dashboard (momentums + transactions lists)
/momentums               # Paginated momentum list
/transactions            # Paginated transaction list
/pillars                 # Pillar list (sortable)
/sentinels               # Sentinel list
/tokens                  # ZTS token list
/address/[address]       # Address detail (3 tabs: tx, unreceived, balances)
/momentum/[id]           # Momentum by height or hash
/hash/[id]               # Generic hash lookup (resolves to momentum or tx)
/transaction/[hash]      # Transaction detail
/token/[zts]             # Token detail
/pillar/[address]        # Pillar detail
```

### Data Fetching Pattern

Pages follow this pattern:
1. `useZenon()` for connection status
2. `useCallback` for fetch function with `zenonClient` calls
3. `useEffect` triggers fetch when `status === 'connected'`
4. Local state for data, loading, pagination

Dashboard components (`MomentumsList`, `TransactionsList`) poll every 10 seconds when connected.

### Component Organization

- **`src/components/ui/`** - Reusable: Table (responsive desktop/mobile), Pagination, Card, HashLink, JsonViewer
- **`src/components/layout/`** - Header, NodeSelector, PageHeader, MobileMenu
- **`src/components/dashboard/`** - MomentumsList, TransactionsList (memoized, auto-refresh)

### Key Utilities

- **`src/lib/utils.ts`** - Formatting: `truncateHash()`, `formatRelativeTime()`, `formatTokenAmount()`
- **`src/lib/validators.ts`** - Search type detection: `isValidAddress()`, `isValidHash()`, `getSearchType()`
- **`src/lib/constants.ts`** - CONFIG object with node URLs, timeouts, cache TTLs, block type enums

## Non-Obvious Patterns

1. **Reverse Pagination**: Momentums display newest-first by calculating `height - offset` rather than offset-based
2. **Client-Side Transaction Pagination**: Fetches 1000 momentums, extracts blocks, paginates in-memory
3. **Hash Resolution**: `/hash/[id]` page determines if hash is momentum or transaction, then displays appropriate detail

## Deployment

Deployed to Cloudflare Workers via `@opennextjs/cloudflare`:
- Build command: `opennextjs-cloudflare build`
- Output directory: `.open-next/`
- Configuration: `wrangler.jsonc` and `open-next.config.ts`

The `@opennextjs/cloudflare` adapter converts Next.js to Cloudflare Workers format with full Node.js runtime support.
