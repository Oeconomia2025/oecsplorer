# Schema Reference

PostgreSQL with Prisma ORM. Seven tables covering transactions, token transfers, wallet positions, protocol metrics, and caching layers.

**Source:** `prisma/schema.prisma`

## Core Tables

### Transaction

The primary table storing all decoded transactions across protocols.

```prisma
model Transaction {
  id             Int      @id @default(autoincrement())
  txHash         String   @unique @map("tx_hash")
  blockNumber    BigInt   @map("block_number")
  blockTimestamp  DateTime @map("block_timestamp")
  fromAddress    String   @map("from_address")
  toAddress      String?  @map("to_address")
  valueWei       Decimal  @map("value_wei")
  gasUsed        BigInt   @map("gas_used")
  gasPrice       Decimal  @map("gas_price")
  status         Boolean
  protocol       String   // alluria, eloqura, oeconomia, artivya, iridescia
  actionType     String   @map("action_type")   // Human-readable label
  functionName   String?  @map("function_name")  // Raw ABI function name
  decodedData    Json?    @map("decoded_data")   // { args, events }
  tokenTransfers TokenTransfer[]
}
```

**Indexes:** `txHash`, `fromAddress`, `toAddress`, `protocol`, `blockTimestamp DESC`, `(protocol, blockTimestamp DESC)`

### TokenTransfer

ERC-20 token transfers extracted from transaction receipt logs.

```prisma
model TokenTransfer {
  id              Int      @id @default(autoincrement())
  txHash          String   @map("tx_hash")
  tokenAddress    String   @map("token_address")
  tokenSymbol     String?  @map("token_symbol")
  fromAddress     String   @map("from_address")
  toAddress       String   @map("to_address")
  amount          Decimal
  decimals        Int?
  transaction     Transaction @relation(fields: [txHash], references: [txHash])
}
```

**Indexes:** `fromAddress`, `toAddress`, `tokenSymbol`, `tokenAddress`

## Supporting Tables

### WalletPosition

Cross-protocol wallet positions (vaults, LP positions, stakes).

```prisma
model WalletPosition {
  id             Int      @id @default(autoincrement())
  walletAddress  String   @map("wallet_address")
  protocol       String
  positionType   String   @map("position_type")  // vault, lp_position, stake, guardian, order
  positionData   Json     @map("position_data")
  lastUpdated    DateTime @map("last_updated")
}
```

### ProtocolMetrics

Aggregated metrics over time (TVL, daily volume, unique users).

```prisma
model ProtocolMetrics {
  id          Int      @id @default(autoincrement())
  protocol    String
  metricName  String   @map("metric_name")   // tvl, daily_volume, unique_users
  metricValue Decimal  @map("metric_value")
  timestamp   DateTime
  granularity String   // hourly, daily, weekly
}
```

### TokenMetadataCache

Cached token symbol/name/decimals/logo from Alchemy (one-time fetch per token).

### TokenBalances

Per-wallet token balances updated by webhook Transfer events.

### IndexedBlocks

Sync progress tracking — prevents reprocessing blocks.

## Common Queries

```sql
-- Recent transactions for a protocol
SELECT * FROM transactions
WHERE protocol = 'alluria'
ORDER BY block_timestamp DESC
LIMIT 25;

-- Token transfers for a specific token
SELECT * FROM token_transfers
WHERE token_address = '0x5cdbed8ed63554fde6653f02ae1c4d6d5ae71ad3'
ORDER BY id DESC;

-- Transaction count by protocol
SELECT protocol, COUNT(*) as count
FROM transactions
GROUP BY protocol;
```

{% hint style="warning" %}
**BigInt in JSON columns:** Always use `sanitizeForJson()` to convert BigInt values to strings before writing to Prisma JSON fields. BigInt values from ethers.js decoded args will crash Prisma otherwise.
{% endhint %}
