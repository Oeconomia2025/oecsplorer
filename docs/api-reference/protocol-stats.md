# API: Protocol Stats

Endpoints for querying per-protocol metrics and cross-protocol analytics.

## Endpoints

### GET `/api/protocol/:protocolId/stats`

Returns aggregated metrics for a specific protocol.

**Path Parameters:**

| Parameter    | Values                                              |
| ------------ | --------------------------------------------------- |
| `protocolId` | `oeconomia`, `alluria`, `eloqura`, `artivya`, `iridescia` |

**Response:**

```json
{
  "protocol": "alluria",
  "tvl": 12500000,
  "dailyVolume": 340000,
  "uniqueUsers": 127,
  "transactionCount": 5
}
```

### GET `/api/protocol/:protocolId/transactions`

Returns transactions for a specific protocol with cross-protocol token transfer matching.

**Query Parameters:**

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `limit`   | number | 50      | Results per page (max 200) |
| `offset`  | number | 0       | Pagination offset          |

This endpoint uses an **OR query** that includes:
1. Transactions directly attributed to the protocol (`protocol = protocolId`)
2. Transactions with token transfers involving any of the protocol's contract addresses

This ensures cross-protocol activity is visible. For example, ALUR tokens used in Eloqura liquidity operations appear on the Alluria protocol page.

### GET `/api/overview`

Dashboard snapshot with latest block, protocol transaction counts, and recent activity.

### GET `/api/stats`

Global cross-protocol statistics: total transactions, unique addresses, gas usage trends.

### GET `/api/search?q=...`

Smart search that auto-detects the query type:
* **Transaction hash** (66 chars, starts with `0x`): redirects to `/tx/:hash`
* **Address** (42 chars, starts with `0x`): redirects to `/address/:addr`
* **Block number** (digits only): redirects to `/block/:number`
