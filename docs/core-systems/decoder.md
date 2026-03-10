# Transaction Decoder

The heart of OECsplorer. The `ProtocolDecoder` class converts raw transaction calldata and event logs into human-readable protocol actions.

**Source:** `server/services/decoder.ts`

## How It Works

1. **Address Lookup**: The `to` address is matched against the registered contract map to identify the protocol
2. **Function Decoding**: Transaction `input` data is parsed using the protocol's ABI fragments via `ethers.Interface`
3. **Event Decoding**: Receipt logs are decoded against the protocol ABI, with fallback to standard ERC-20 events
4. **Action Classification**: The raw function name is mapped to a human-readable label via `ACTION_LABELS`

## Usage

```typescript
// Decoder initialization
const addressMap = buildAddressToProtocolMap();
const decoder = new ProtocolDecoder(addressMap);

// Decode a transaction
const result = decoder.decode({
  to: "0x90CCA7d8...",   // Alluria TroveManager
  input: "0x...",         // Raw calldata
  value: "0",             // ETH value
  logs: [...]             // Receipt logs
});

// Result:
// {
//   protocol: "alluria",
//   actionType: "Opened Alluria Trove",
//   functionName: "openTrove",
//   decodedArgs: { collateral: "0x34b1...", amount: "1000..." },
//   decodedEvents: [{ name: "TroveOpened", ... }]
// }
```

## Decoder Output

```typescript
interface DecodedTransaction {
  protocol: ProtocolId;       // Which protocol this tx belongs to
  actionType: string;         // Human-readable: "Minted ALUD", "Token Swap"
  functionName: string;       // Raw ABI function name
  decodedArgs: Record<string, unknown>;  // Named function arguments
  decodedEvents: DecodedEvent[];         // Decoded emitted events
}
```

## Fallback Chain

If the primary ABI doesn't match the transaction data:

1. Try standard ERC-20/ERC-721 ABIs (`Transfer`, `Approval`)
2. Try cross-protocol ABIs (labeled with prefix like `eloqura:Transfer`)
3. Fall back to `"Contract Interaction"` if nothing matches

## ABI Fragments

Each protocol registers ABI fragments for its known functions and events. The decoder only includes the function signatures needed: not the full contract ABI. This keeps the decoder lightweight and focused.

Protocols currently registered:
* **Oeconomia**: MultiPoolStakingAPR (stake, unstake, vote, proposals)
* **Alluria**: TroveManager, StabilityPool, EmissionsVault
* **Eloqura**: Router V2 (all swap/liquidity variants), SwapRouter V3
* **Artivya**: Exchange, OrderBook, NFT Marketplace
* **Iridescia**: ContractFactory, TemplateRegistry

{% hint style="warning" %}
**BigInt Safety:** Always use `sanitizeForJson()` before storing decoded args in Prisma JSON fields. Raw BigInt values from ethers.js will crash Prisma.
{% endhint %}

## Adding a New Protocol

To add decoder support for a new protocol:

1. Add ABI fragments to `PROTOCOL_ABIS` in `decoder.ts`
2. Add action labels to `ACTION_LABELS`
3. Register contract addresses in `constants.ts`
4. Run `npx tsx server/scripts/redecode.ts` to re-decode existing transactions
