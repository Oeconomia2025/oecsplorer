# Price Engine

A 3-tier pricing strategy that attempts progressively broader methods to determine token USD values on Sepolia.

**Source:** `server/routes/api.ts` (price fetching functions)

## Pricing Tiers

### Tier 1 — Uniswap V3 Direct Quote

Calls the Uniswap V3 QuoterV2 contract on Sepolia to get a direct `token → USDC` quote. Tries three fee tiers in order:

| Fee Tier | Percentage | Best For           |
| -------- | ---------- | ------------------ |
| 500      | 0.05%      | Stablecoins        |
| 3000     | 0.3%       | Most pairs         |
| 10000    | 1%         | Exotic/volatile    |

The first successful quote is used. The fee tier is stored and passed through to swap execution.

### Tier 2 — Multi-Hop via WETH

If no direct USDC pair exists, routes through WETH:

```
token → WETH → USDC
```

This catches tokens that only have WETH pairs on Uniswap V3.

### Tier 3 — Eloqura DEX Pools

Falls back to Eloqura V2 AMM pools:

1. **Token/USDC pair** — Check reserves and calculate price directly
2. **Token/WETH pair** — Calculate token price in ETH, then convert via ETH/USD price

```typescript
// Get pair address from Eloqura Factory
const pairAddress = await factory.getPair(tokenAddress, usdcAddress);

// Read reserves
const [reserve0, reserve1] = await pair.getReserves();

// Calculate price based on token ordering
const price = isToken0 ? reserve1 / reserve0 : reserve0 / reserve1;
```

## Caching

Token prices are cached in an in-memory `Map` with a 5-minute TTL:

```typescript
const apiCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
```

This reduces Alchemy compute unit usage significantly, especially for the Uniswap V3 QuoterV2 calls which consume CUs on every invocation.

{% hint style="info" %}
**Fee Tier Mismatch Bug:** Quote logic tries multiple fee tiers and finds the best one. Swap execution **must** use the same fee tier — not a hardcoded default. Store the fee tier in the quote object and pass it through.
{% endhint %}

## Key Addresses

| Contract           | Address (Sepolia)                              |
| ------------------ | ---------------------------------------------- |
| Uniswap V3 Quoter  | `0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3` |
| Uniswap V3 Router  | `0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E` |
| USDC               | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| Eloqura Factory    | `0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e` |
| Eloqura Router     | `0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE` |
