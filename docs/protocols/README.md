# Protocol Overview

The Oeconomia Protocol Pantheon consists of five interconnected protocols, each with its own set of smart contracts, token, and purpose. OECsplorer decodes and tracks activity across all of them.

## The Five Protocols

| Protocol      | Icon | Color     | Purpose                                                              |
| ------------- | ---- | --------- | -------------------------------------------------------------------- |
| **Oeconomia** | ⚡    | `#da1cfe` | Governance hub: OEC token, Guardian staking, proposals, voting      |
| **Alluria**   | 🏦   | `#834841` | Lending: ETH-collateralized vaults, ALUD stablecoin, stability pool |
| **Eloqura**   | 🔄   | `#ae65fc` | DEX/AMM: Uniswap V2-style swaps, liquidity pools, bridge           |
| **Artivya**   | 🎨   | `#11c4fe` | Hybrid exchange: order book + AMM, NFT marketplace                  |
| **Iridescia** | 🛠    | `#c4956a` | Developer infra: contract factory, templates, security              |

## Protocol Attribution

When a transaction is indexed, the decoder determines its protocol by matching the `to` address against a registered contract map:

```typescript
// Each contract address maps to exactly one protocol
const addressMap = buildAddressToProtocolMap();
// { "0x3f42...": "eloqura", "0x5cdb...": "alluria", ... }

// Decoder uses this map at decode time
const protocol = addressMap[tx.to.toLowerCase()] || "unknown";
```

## Cross-Protocol Transactions

Protocol pages use an **OR query**: they show transactions that are either directly attributed to the protocol OR have token transfers involving the protocol's contract addresses. For example, if ALUR tokens are used in an Eloqura liquidity operation, that transaction appears on both the Alluria and Eloqura protocol pages.

## Shared vs. Exclusive Contracts

* **Exclusive contracts**: Protocol-owned contracts (auto-indexed by the polling indexer)
* **Shared contracts**: Public infrastructure like Uniswap V3 (indexed only on user request via `/api/track-tx`)
