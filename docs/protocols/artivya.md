# Artivya Protocol

A hybrid trading platform combining an order book with AMM liquidity, plus an integrated NFT marketplace with royalty management.

## Decoded Actions

| Function        | Decoded Label  |
| --------------- | -------------- |
| `placeOrder()`  | Placed Order   |
| `cancelOrder()` | Cancelled Order |
| `fillOrder()`   | Filled Order   |
| `listNFT()`     | Listed NFT     |
| `buyNFT()`      | Purchased NFT  |
| `makeOffer()`   | Made Offer     |
| `acceptOffer()` | Accepted Offer |

## Decoded Events

| Event          | Description                    |
| -------------- | ------------------------------ |
| `OrderPlaced`  | New order added to order book  |
| `OrderFilled`  | Order matched and executed     |
| `NFTListed`    | NFT listed on marketplace      |
| `NFTSold`      | NFT purchased from marketplace |

## Hybrid Trading Model

Artivya combines two execution models:

* **Order Book**: Traditional limit orders with price-time priority matching
* **AMM Liquidity**: Automated market maker pools that provide baseline liquidity

Orders can be filled from either source, with the router selecting the best execution path based on price and available liquidity.
