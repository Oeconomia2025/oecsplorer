# Architecture

OECsplorer is a full-stack application with a React frontend, Express backend, PostgreSQL database, and real-time WebSocket layer. Transactions flow in through three ingestion pathways.

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        SEPOLIA BLOCKCHAIN                       │
└──────────┬──────────────────┬────────────────────┬──────────────┘
           │                  │                    │
     ┌─────▼─────┐    ┌──────▼──────┐    ┌───────▼────────┐
     │  Polling   │    │   Alchemy   │    │  Site-Triggered│
     │  Indexer   │    │  Webhooks   │    │   /track-tx    │
     │ (5 min)    │    │ (real-time) │    │  (on demand)   │
     └─────┬──────┘    └──────┬──────┘    └───────┬────────┘
           │                  │                    │
           └──────────┬───────┘────────────────────┘
                      │
              ┌───────▼────────┐
              │   Protocol     │
              │   Decoder      │
              │  (ABI → human) │
              └───────┬────────┘
                      │
           ┌──────────▼──────────┐
           │    PostgreSQL DB    │
           │  (Prisma ORM)      │
           │  7 tables           │
           └──────────┬──────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
  ┌─────▼────┐  ┌────▼─────┐  ┌───▼──────┐
  │ REST API │  │ WebSocket│  │ Price    │
  │ (17 eps) │  │ (live)   │  │ Engine   │
  └─────┬────┘  └────┬─────┘  └───┬──────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
              ┌───────▼────────┐
              │  React Frontend│
              │  9 pages       │
              └────────────────┘
```

## Data Ingestion Pipelines

### 1. Polling Indexer

Runs every **5 minutes**, scanning for new `eth_getLogs` events across all exclusive Oeconomia contract addresses. Fetches full transaction receipts, decodes them, stores in PostgreSQL, and broadcasts via WebSocket.

### 2. Alchemy Webhooks

Receives real-time notifications from Alchemy Notify when monitored addresses are involved in transactions. Processes instantly — decode, store, broadcast. This is the fastest ingestion path.

### 3. Site-Triggered Tracking

The `POST /api/track-tx` endpoint is called by Oeconomia frontend apps (Eloqura, Alluria, etc.) when a user submits a transaction. This ensures transactions on shared contracts (like Uniswap V3) are indexed when initiated from an Oeconomia site.

## Frontend Pages

| Route              | Page              | Description                                              |
| ------------------ | ----------------- | -------------------------------------------------------- |
| `/`                | Dashboard         | Live transaction feed, recent activity across all protocols |
| `/tx/:hash`        | Transaction Detail | Decoded view with protocol context, function args, events |
| `/address/:addr`   | Address Detail    | Portfolio: balances, positions, tx history                |
| `/protocol/:id`    | Protocol Page     | Per-protocol dashboard with metrics and activity         |
| `/tokens`          | Token List        | All tracked tokens with metadata                         |
| `/token/:addr`     | Token Detail      | Holders, transfers, price chart                          |
| `/stats`           | Analytics         | Cross-protocol TVL, volume, gas trends                   |
| `/learn`           | Education Hub     | 22 blockchain & crypto lessons                           |

## File Structure

```
oeconomia-explorer/
├── src/                          # React frontend
│   ├── pages/                    # 8 route pages
│   ├── components/               # Shared UI components
│   ├── hooks/                    # useWebSocket, etc.
│   ├── services/api.ts           # REST API client
│   └── utils/constants.ts        # Protocol configs, tokens, addresses
├── server/                       # Node.js backend
│   ├── index.ts                  # Express + WebSocket entry
│   ├── db.ts                     # Prisma singleton
│   ├── routes/
│   │   ├── api.ts                # 17 REST endpoints
│   │   └── webhooks.ts           # Alchemy webhook receiver
│   ├── services/
│   │   ├── alchemy.ts            # Alchemy SDK wrapper
│   │   ├── decoder.ts            # Protocol ABI decoder
│   │   ├── indexer.ts            # Polling indexer
│   │   └── balances.ts           # Token balance cache
│   └── scripts/
│       ├── backfill.ts           # Historical tx indexing
│       └── redecode.ts           # Re-decode stored transactions
├── prisma/schema.prisma          # PostgreSQL schema (7 tables)
├── package.json
└── .env.example
```
