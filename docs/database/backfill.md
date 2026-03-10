# Backfill Script

Index historical transactions for the past 30 days across all protocol contracts.

**Source:** `server/scripts/backfill.ts`

## Usage

```bash
# Standard usage (uses DATABASE_URL from .env)
npm run backfill

# With a custom database URL
DATABASE_URL="postgresql://..." npx tsx server/scripts/backfill.ts
```

## Phases

### Phase 1: Asset Transfers

Uses Alchemy's `getAssetTransfers` API to find inbound and outbound transfers for each protocol contract address.

**Categories scanned:**
* `EXTERNAL`: ETH transfers
* `INTERNAL`: Internal contract calls
* `ERC20`: ERC-20 token transfers
* `ERC721`: NFT transfers

For each transfer found, the script fetches the full transaction + receipt, decodes it, and stores it in the database.

### Phase 1.5: Contract Token Transfers

Uses `getAssetTransfers` with the `contractAddresses` filter to find ERC-20 Transfer events emitted **by** protocol token contracts, even when the transaction target is a different contract.

This catches cases like ALUR tokens being transferred during an Eloqura liquidity operation: the transaction `to` is the Eloqura Router, but the ALUR token contract emits a Transfer event.

```typescript
const result = await alchemy.core.getAssetTransfers({
  contractAddresses: [contractAddr],  // Filter by token contract
  category: [AssetTransfersCategory.ERC20],
  // ...
});
```

### Phase 2: getLogs Scan

Scans `eth_getLogs` across all contract addresses for any events the previous phases might have missed.

{% hint style="warning" %}
**Alchemy Free Tier Limit:** `eth_getLogs` is restricted to **10-block ranges** on the free plan. Scanning 216,000 blocks (30 days) at 10 blocks per chunk requires 21,600 API calls. This is extremely slow and will hit rate limits. Consider upgrading to PAYG for production backfills.
{% endhint %}

## Output

The script reports progress as it runs:

```
==============================================
  OECONOMIA EXPLORER: BACKFILL
==============================================

Latest block:     10414840
Backfill from:    10198840 (~30 days ago)
Block range:      216000 blocks

Contracts to index: 16
  oeconomia    0x00904218319a045a96d776ec6a970f54741208e6
  alluria      0x5cdBed8ED63554FDE6653F02ae1c4d6d5ae71aD3
  eloqura      0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE
  ...

--- ALLURIA | 0x5cdBed8ED63554FDE6653F02ae1c4d6d5ae71aD3 ---
  inbound: processing page 1 (5 transfers)...
  inbound: 3 stored, 2 skipped
  outbound: processing page 1 (8 transfers)...
  outbound: 5 stored, 3 skipped

Done! Stored 184 new transactions (92 skipped as duplicates).
```

## Duplicate Handling

The backfill is safe to run multiple times. Existing transactions are skipped via the unique `txHash` constraint: the script checks `findUnique({ where: { txHash } })` before attempting to store.

## Re-Decoding

If you update the decoder (new ABI fragments, action labels, etc.), run the re-decode script to update existing transactions:

```bash
npx tsx server/scripts/redecode.ts
```

This reads all stored transactions, re-decodes them through the updated `ProtocolDecoder`, and updates the `protocol`, `actionType`, `functionName`, and `decodedData` fields.
