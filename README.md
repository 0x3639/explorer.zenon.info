# Zenon Explorer

A blockchain explorer for the Zenon Network, built with Next.js 15 and deployed on Cloudflare Workers.

## Features

- Real-time momentum and transaction tracking
- Address details with balance and transaction history
- Pillar and Sentinel information
- ZTS token listings
- Bridge status and request tracking
- Multi-node support with persistent selection
- Responsive design for mobile and desktop

## Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the explorer.

### Production Build

```bash
# Standard Next.js build
npm run build

# Build for Cloudflare Workers
npx @opennextjs/cloudflare build
```

### Local Preview (Cloudflare Workers)

```bash
npm run preview
```

This builds and starts a local Wrangler server at [http://localhost:8787](http://localhost:8787).

## Deployment

### Cloudflare Workers

1. Connect your GitHub repository to Cloudflare Workers
2. Configure build settings:
   - **Build command:** `npx @opennextjs/cloudflare build`
   - **Deploy command:** `npx wrangler deploy`
3. Deploy

### Environment

- Node.js 22+
- Next.js 15.5.7
- React 18

## Node Configuration

The explorer connects to Zenon Network nodes via WebSocket. Default nodes:

- `wss://my.hc1node.com:35998` (default)
- `wss://node.zenonhub.io:35998`
- `wss://node.atsocy.com:35998`

Users can add custom nodes through the UI. Node selection is persisted in localStorage.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS 4
- **Deployment:** Cloudflare Workers via @opennextjs/cloudflare
- **API:** Zenon Network JSON-RPC over WebSocket

## License

MIT
