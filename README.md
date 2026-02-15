# Oeconomia Protocol Explorer

Protocol-aware blockchain explorer for the **Oeconomia Protocol Pantheon** — decoding raw blockchain transactions into human-readable activity across Alluria, Eloqura, Artivya, Iridescia, and Oeconomia Governance.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your Alchemy API key and database credentials

# 3. Set up database
npx prisma migrate dev --name init
npx prisma generate

# 4. Run development servers (frontend + backend)
npm run dev
```

Frontend runs on `http://localhost:5173`, backend API on `http://localhost:3001`.

## Project Structure

```
oeconomia-explorer/
├── src/                          # React frontend
│   ├── components/
│   │   ├── shared/               # ProtocolBadge, AddressLink, SearchBar, etc.
│   │   ├── explorer/             # TxDetail, TxList, AddressDetail
│   │   ├── protocols/            # AlluriaPanel, EloquraPanel, etc.
│   │   ├── charts/               # TVLChart, VolumeChart
│   │   └── layout/               # Header, Sidebar, Footer
│   ├── hooks/
│   │   └── useWebSocket.ts       # Live transaction feed hook
│   ├── services/
│   │   └── api.ts                # REST API client
│   ├── utils/
│   │   ├── constants.ts          # Protocol configs, contract addresses, tokens
│   │   └── formatters.ts         # Wei conversion, address truncation, timeAgo
│   └── pages/                    # Route pages
├── server/                       # Node.js backend
│   ├── index.ts                  # Express + WebSocket entry point
│   ├── routes/
│   │   ├── api.ts                # REST endpoints (tx, address, block, protocol, search)
│   │   └── webhooks.ts           # Alchemy webhook receiver + decoder
│   └── services/
│       ├── alchemy.ts            # Alchemy SDK wrapper
│       └── decoder.ts            # Protocol ABI decoder (all 5 protocols)
├── prisma/
│   └── schema.prisma             # PostgreSQL schema
└── .env.example                  # Environment variable template
```

## Key Configuration

### Contract Addresses
Edit `src/utils/constants.ts` and replace all `0x000...` placeholder addresses with your deployed contract addresses.

### Protocol ABIs
The decoder in `server/services/decoder.ts` contains minimal ABI fragments. Replace these with your full compiled ABIs for complete decoding coverage.

### Alchemy Webhooks
Set up Address Activity webhooks in the Alchemy dashboard pointing to:
```
https://your-domain.com/api/webhooks/alchemy
```
Add your protocol contract addresses as monitored addresses.

## Tech Stack

| Layer      | Technology                              |
|------------|----------------------------------------|
| Frontend   | React, TypeScript, Tailwind CSS        |
| Backend    | Node.js, Express, Socket.IO            |
| Database   | PostgreSQL (via Prisma ORM)            |
| Cache      | Redis (ioredis)                        |
| Blockchain | Alchemy SDK (RPC + Enhanced APIs)      |
| Real-time  | WebSocket (Socket.IO)                  |
