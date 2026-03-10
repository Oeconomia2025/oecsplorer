# Alluria Protocol

A decentralized lending protocol. Deposit WETH, WBTC, or LINK as collateral to mint ALUD stablecoins. Earn yield in the Stability Pool. Stake ALUR for fee revenue.

## Contracts

| Contract           | Address                                      |
| ------------------ | -------------------------------------------- |
| ALUR Token         | `0x5cdBed8ED63554FDE6653F02ae1c4d6d5ae71aD3` |
| ALUD Stablecoin    | `0x41B07704b9d671615A3E9f83c06D85CB38bbf4D9` |
| Trove Manager      | `0x90CCA7d8B6cAb91d53e384E3c0cD3Ba34b7B8Cc2` |
| Stability Pool     | `0xB61a71C78e10C0C92e2dFF457C9F87dC71260c43` |
| Collateral Manager | `0x6423C894371992594a7fE8e2e0E65BEF4EE5cABb` |
| Price Feed         | `0x79A91c7659AA69A5F8722aB3786D44D367ADEeFe` |
| Emissions Vault    | `0x3b62AF3344830690770156033D127dE7186Cd9a1` |
| AluriaLens         | `0x150485AC97153Ac772D43736564ccf7122d92bcf` |

## Decoded Actions

| Function                | Decoded Label              |
| ----------------------- | -------------------------- |
| `openTrove()`           | Opened Alluria Trove       |
| `closeTrove()`          | Closed Alluria Trove       |
| `mintALUD()`            | Minted ALUD                |
| `repayALUD()`           | Repaid ALUD Debt           |
| `addCollateral()`       | Added Trove Collateral     |
| `removeCollateral()`    | Removed Trove Collateral   |
| `liquidate()`           | Liquidation Executed       |
| `redeemCollateral()`    | Redeemed Collateral        |
| `depositALUD()`         | Stability Pool Deposit     |
| `withdrawALUD()`        | Stability Pool Withdrawal  |
| `claimCollateralGains()` | Claimed Liquidation Gains |
| `claimOECRewards()`     | Claimed OEC Rewards        |
| `release()`             | OEC Emissions Released     |

## Collateral Types

| Token | Address                                      | Decimals | Chainlink Feed (Sepolia)                     |
| ----- | -------------------------------------------- | -------- | -------------------------------------------- |
| WBTC  | `0x29f2D40B0605204364af54EC677bD022dA425d03` | 8        | `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43` |
| WETH  | `0x34b11F6b8f78fa010bBCA71bC7FE79dAa811b89f` | 18       | `0x694AA1769357215DE4FAC081bf1f309aDC325306` |
| LINK  | `0x779877A7B0D9E8603169DdbD7836e478b4624789` | 18       | `0xc59E3633BAAC79493d908e63626716e204A45EdF` |

## Price Feed

The PriceFeed contract operates in dual mode:

* **Chainlink mode**: Reads `latestRoundData()` from Chainlink Sepolia aggregators and normalizes to 18 decimals
* **Manual fallback**: Admin-set prices for assets without Chainlink coverage

Safety features:
* **Staleness check**: Rejects prices older than 1 hour
* **Max deviation**: 50% max change between updates prevents oracle manipulation

## AluriaLens

The AluriaLens contract provides read-only aggregated views for frontend consumption:

* `getAllUserTroves(owner)`: Returns all trove positions for a wallet
* `getUserStabilityPoolPosition(owner)`: Returns stability pool deposit + pending gains
* `getCollateralStats(collateral)`: Returns aggregate stats per collateral type
* `getSystemStats()`: Returns total TVL, ALUD supply, and collateral ratios
