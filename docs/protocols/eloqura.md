# Eloqura Protocol

The decentralized exchange layer. Uniswap V2-style AMM with swap routing, liquidity pools, limit orders, and a cross-chain bridge.

## Contracts

| Contract   | Address                                      |
| ---------- | -------------------------------------------- |
| Router V2  | `0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE` |
| Factory V2 | `0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e` |
| WETH       | `0x34b11F6b8f78fa010bBCA71bC7FE79dAa811b89f` |

## Decoded Actions

| Function                           | Decoded Label          |
| ---------------------------------- | ---------------------- |
| `swapExactTokensForTokens()`       | Token Swap             |
| `swapTokensForExactTokens()`       | Token Swap             |
| `swapExactETHForTokens()`          | ETH → Token Swap      |
| `swapTokensForExactETH()`          | Token → ETH Swap      |
| `swapExactTokensForETH()`          | Token → ETH Swap      |
| `addLiquidity()`                   | Added Liquidity        |
| `addLiquidityETH()`               | Added ETH Liquidity    |
| `removeLiquidity()`               | Removed Liquidity      |
| `removeLiquidityETH()`            | Removed ETH Liquidity  |
| `removeLiquidityWithPermit()`     | Removed Liquidity      |
| `removeLiquidityETHWithPermit()`  | Removed ETH Liquidity  |

## Decoded Events

| Event  | Description                           |
| ------ | ------------------------------------- |
| `Swap` | Token swap executed in a pair         |
| `Mint` | Liquidity added to a pool             |
| `Burn` | Liquidity removed from a pool         |

{% hint style="warning" %}
**Two WETH addresses on Sepolia.** Eloqura uses `0x34b1...89f` while Uniswap V3 uses `0xfFf9...6B14`. Using the wrong WETH with the wrong router causes swap failures.
{% endhint %}

## AMM Pool Independence

Each AMM pool has independent reserves. Prices don't auto-sync between pools (e.g., OEC/USDC vs OEC/WETH). On mainnet, arbitrageurs keep them in sync; on Sepolia testnet, they won't.

## LP Tokens

When liquidity is added to a pool, ELP (Eloqura LP) tokens are minted representing the provider's share. These appear in wallet token lists with the `ELQ-` prefix and are filtered from portfolio valuations to prevent double-counting.
