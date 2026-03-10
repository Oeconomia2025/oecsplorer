# API: Addresses

Wallet portfolio data: ETH balance, token holdings, cross-protocol positions, and transaction history.

## Endpoints

### GET `/api/address/:address`

Returns a wallet overview including ETH balance, ERC-20 token balances (via Alchemy), and whether the address is a contract.

**Response:**

```json
{
  "address": "0xba2612df1031bb7c7d31425d2b7968f86195e9df",
  "balance": "1250000000000000000",
  "isContract": false,
  "tokenBalances": [
    {
      "contractAddress": "0x5cdbed8ed63554fde6653f02ae1c4d6d5ae71ad3",
      "tokenBalance": "500000000000000000000",
      "symbol": "ALUR",
      "name": "Alluria Token",
      "decimals": 18,
      "logo": "https://..."
    }
  ]
}
```

### GET `/api/address/:address/transactions`

Returns paginated transaction history for an address, fetched from Alchemy's `getAssetTransfers` API.

**Query Parameters:**

| Parameter   | Type   | Description                         |
| ----------- | ------ | ----------------------------------- |
| `direction` | string | `"from"` or `"to"`: filter by sender or recipient |
| `pageKey`   | string | Alchemy pagination cursor for next page |

**Response:**

```json
{
  "transfers": [
    {
      "hash": "0x...",
      "from": "0xba26...",
      "to": "0x5cdb...",
      "value": 1000,
      "asset": "ALUR",
      "category": "erc20",
      "blockNum": "0x9ef...",
      "metadata": { "blockTimestamp": "2026-02-28T..." }
    }
  ],
  "pageKey": "next_page_cursor_or_null"
}
```
