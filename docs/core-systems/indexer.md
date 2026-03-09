# Indexing Pipeline

Three ingestion pathways ensure comprehensive transaction coverage with different speed/completeness tradeoffs.

## Pipeline Comparison

| Pipeline         | Trigger          | Latency  | Coverage                     |
| ---------------- | ---------------- | -------- | ---------------------------- |
| Polling Indexer  | Every 5 minutes  | ~5 min   | All exclusive contracts      |
| Alchemy Webhooks | Real-time        | ~2 sec   | Monitored addresses          |
| Site-Triggered   | On user tx       | Instant  | Shared contracts (Uniswap)   |

## Polling Indexer

**Source:** `server/services/indexer.ts`

Runs every 5 minutes. Scans `eth_getLogs` for all exclusive contract addresses in 5000-block chunks.

**Process:**
1. Query `eth_getLogs` for all exclusive Oeconomia contract addresses
2. Extract unique transaction hashes from matching logs
3. Fetch full transaction + receipt from Alchemy
4. Decode via `ProtocolDecoder`
5. Store in PostgreSQL (skip duplicates via unique `txHash`)
6. Extract token transfers from `Transfer` event logs
7. Update token balance cache for affected addresses
8. Broadcast via WebSocket to subscribed clients

**Configuration:**
```typescript
const POLL_INTERVAL_MS = 300_000; // 5 minutes
```

## Alchemy Webhooks

**Source:** `server/routes/webhooks.ts`

Receives real-time `POST /api/webhooks/alchemy` payloads from Alchemy Notify when monitored addresses are involved in transactions.

**Payload:**
```json
{
  "webhookId": "...",
  "event": {
    "network": "ETH_SEPOLIA",
    "activity": [
      {
        "fromAddress": "0x...",
        "toAddress": "0x...",
        "hash": "0x...",
        "value": 0.5,
        "asset": "ETH",
        "category": "external"
      }
    ]
  }
}
```

Each activity item goes through the same fetch → decode → store → broadcast pipeline.

## Site-Triggered Tracking

**Endpoint:** `POST /api/track-tx`

Called by Oeconomia frontend apps when a user submits a transaction. This catches transactions on shared/public contracts (like Uniswap V3) that wouldn't be auto-indexed since they're not exclusive to Oeconomia.

## WebSocket Broadcasting

After a transaction is stored, it's broadcast to WebSocket clients:

```typescript
// Broadcast to all subscribers
io.to("all_transactions").emit("new_transaction", { summary });

// Broadcast to protocol-specific room
io.to(`protocol:${protocol}`).emit("new_transaction", { summary });
```

## Error Handling

* The indexer continues processing if individual transactions fail to decode
* Duplicate transactions are silently skipped via the unique `txHash` constraint
* Rate limit errors from Alchemy are caught and retried on the next polling cycle
* Block range tracking ensures no gaps between indexer runs
