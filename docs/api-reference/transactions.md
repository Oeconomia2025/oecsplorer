# API: Transactions

Endpoints for querying individual transactions and recent activity feeds.

## Endpoints

### GET `/api/tx/:hash`

Returns a fully decoded transaction with protocol context, function arguments, emitted events, and token transfers.

**Response:**

```json
{
  "txHash": "0x044d9d82844dbb7e9bf4a33568544438d8abc53d72f7cf31b4e786fbaf485917",
  "blockNumber": 10412246,
  "blockTimestamp": "2026-02-28T15:30:00.000Z",
  "fromAddress": "0xba2612df1031bb7c7d31425d2b7968f86195e9df",
  "toAddress": "0x5cdbed8ed63554fde6653f02ae1c4d6d5ae71ad3",
  "valueWei": "0",
  "gasUsed": "52341",
  "gasPrice": "1500000007",
  "status": true,
  "protocol": "alluria",
  "actionType": "Transfer",
  "functionName": "transfer",
  "decodedData": {
    "args": {
      "to": "0x3b62AF3344830690770156033D127dE7186Cd9a1",
      "amount": "1000000000000000000000"
    },
    "events": [
      {
        "name": "Transfer",
        "args": { "from": "0xba26...", "to": "0x3b62...", "value": "1000..." }
      }
    ]
  },
  "tokenTransfers": [
    {
      "tokenAddress": "0x5cdbed8ed63554fde6653f02ae1c4d6d5ae71ad3",
      "tokenSymbol": "ALUR",
      "fromAddress": "0xba2612...",
      "toAddress": "0x3b62af...",
      "amount": "1000000000000000000000",
      "decimals": 18
    }
  ]
}
```

### GET `/api/transactions/recent`

Returns the most recent transactions across all protocols, sorted by block timestamp descending.

**Query Parameters:**

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `limit`   | number | 25      | Results per page (max 200) |
| `offset`  | number | 0       | Pagination offset          |

**Response:**

```json
{
  "transactions": [...],
  "total": 184,
  "limit": 25,
  "offset": 0
}
```

### POST `/api/track-tx`

On-demand transaction indexing. Called by Oeconomia frontend apps when a user submits a transaction through the UI.

**Request Body:**

```json
{
  "txHash": "0x..."
}
```

This endpoint fetches the full transaction from Alchemy, decodes it through the ProtocolDecoder, stores it in the database, and broadcasts it via WebSocket. It's the mechanism for indexing transactions on shared contracts (like Uniswap V3) that aren't auto-scanned.
