# API: Tokens

Token metadata, holder lists, transfer events, and USD pricing via the 3-tier price engine.

## Endpoints

### GET `/api/tokens`

Returns all tracked tokens defined in the protocol configuration.

**Response:**

```json
{
  "tokens": [
    {
      "symbol": "OEC",
      "name": "Oeconomia",
      "address": "0x00904218319a045a96d776ec6a970f54741208e6",
      "decimals": 18,
      "protocol": "oeconomia",
      "color": "#da1cfe",
      "logo": "https://...",
      "official": true
    }
  ]
}
```

### GET `/api/tokens/:address`

Returns token metadata with current USD price from the 3-tier price engine.

**Response:**

```json
{
  "address": "0x5cdbed8ed63554fde6653f02ae1c4d6d5ae71ad3",
  "symbol": "ALUR",
  "name": "Alluria Token",
  "decimals": 18,
  "logo": "https://...",
  "priceUSD": 0.0523,
  "totalSupply": "10000000000000000000000000"
}
```

{% hint style="info" %}
Token prices are cached for **5 minutes** to reduce Alchemy compute unit usage. See [Price Engine](../core-systems/pricing.md) for details on the 3-tier pricing strategy.
{% endhint %}

### GET `/api/tokens/:address/holders`

Returns top token holders with cached balances.

**Query Parameters:**

| Parameter | Type   | Default | Description               |
| --------- | ------ | ------- | ------------------------- |
| `limit`   | number | 25      | Number of holders to return |
| `offset`  | number | 0       | Pagination offset          |

**Response:**

```json
{
  "holders": [
    {
      "address": "0xba2612...",
      "balance": "500000000000000000000"
    }
  ],
  "total": 42
}
```

### GET `/api/tokens/:address/events`

Returns Transfer events for the token, decoded from the `token_transfers` table.
