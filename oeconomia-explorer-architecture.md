# Architecture & Scaffold

## Overview

A custom blockchain explorer purpose-built for the Oeconomia Protocol Pantheon. Unlike generic explorers (Etherscan), this explorer understands your protocol-specific smart contract interactions and decodes them into human-readable activity across all five protocols.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/TypeScript)               │
│                                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Explorer  │ │ Wallet   │ │ Protocol │ │  TradingView  │  │
│  │  Search   │ │ Portfolio│ │ Dashboards│ │  Integration  │  │
│  └──────────┘ └──────────┘ └──────────┘ └───────────────┘  │
│                         │                                    │
│                    Oeconomia UI Kit                           │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API / WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                   BACKEND (Node.js / Express)                │
│                                                              │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────┐  │
│  │ API Server   │ │ Event Decoder│ │ Webhook Listener    │  │
│  │ (REST + WS)  │ │ (ABI Parser) │ │ (Alchemy Notify)    │  │
│  └──────────────┘ └──────────────┘ └─────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼────────────────────────────────┐   │
│  │              Transaction Indexer Service               │   │
│  │  - Listens for events from all 5 protocol contracts   │   │
│  │  - Decodes raw tx data using protocol ABIs            │   │
│  │  - Classifies by protocol (Alluria/Eloqura/etc.)      │   │
│  │  - Stores decoded data in database                    │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                     DATA LAYER                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  PostgreSQL   │  │    Redis     │  │   Alchemy API     │  │
│  │  (Primary DB) │  │  (Cache +    │  │  (RPC + Enhanced  │  │
│  │              │  │   Pub/Sub)   │  │   APIs + Webhooks)│  │
│  └──────────────┘  └──────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Real-Time Event Ingestion
```
Blockchain Event Emitted
        │
        ▼
Alchemy Webhook (Notify)
        │
        ▼
Webhook Listener (your server)
        │
        ▼
ABI Decoder identifies protocol + action type
        │
        ├── Alluria: VaultOpened, VaultClosed, ALUDMinted, Liquidation
        ├── Eloqura: Swap, AddLiquidity, RemoveLiquidity, BridgeTransfer
        ├── Artivya: OrderPlaced, OrderFilled, NFTListed, NFTSold
        ├── Iridescia: ContractDeployed, TemplateUsed
        └── Oeconomia: GuardianStaked, VoteCast, ProposalCreated
        │
        ▼
Store in PostgreSQL + Publish to Redis (for live UI updates)
        │
        ▼
WebSocket pushes to connected frontend clients
```

### 2. User Query Flow
```
User searches tx hash / wallet address / block number
        │
        ▼
API Server checks Redis cache first
        │
        ├── Cache hit → Return decoded data
        │
        └── Cache miss → Query PostgreSQL
                │
                ├── Found → Return + cache
                │
                └── Not found → Query Alchemy API
                        │
                        ▼
                  Decode on the fly → Store → Return
```

---

## Database Schema (PostgreSQL)

### Core Tables

```sql
-- All decoded transactions across protocols
CREATE TABLE transactions (
    id              SERIAL PRIMARY KEY,
    tx_hash         VARCHAR(66) UNIQUE NOT NULL,
    block_number    BIGINT NOT NULL,
    block_timestamp TIMESTAMP NOT NULL,
    from_address    VARCHAR(42) NOT NULL,
    to_address      VARCHAR(42),
    value_wei       NUMERIC,
    gas_used        BIGINT,
    gas_price       NUMERIC,
    status          BOOLEAN,
    protocol        VARCHAR(20) NOT NULL,  -- 'alluria', 'eloqura', 'artivya', 'iridescia', 'oeconomia'
    action_type     VARCHAR(50) NOT NULL,  -- 'swap', 'mint_alud', 'stake', 'vote', etc.
    decoded_data    JSONB,                 -- Protocol-specific decoded parameters
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_from_address ON transactions(from_address);
CREATE INDEX idx_to_address ON transactions(to_address);
CREATE INDEX idx_protocol ON transactions(protocol);
CREATE INDEX idx_block_timestamp ON transactions(block_timestamp DESC);
CREATE INDEX idx_action_type ON transactions(action_type);

-- Token transfers (ERC-20, including OEC, ALUD, ALUR)
CREATE TABLE token_transfers (
    id              SERIAL PRIMARY KEY,
    tx_hash         VARCHAR(66) NOT NULL REFERENCES transactions(tx_hash),
    token_address   VARCHAR(42) NOT NULL,
    token_symbol    VARCHAR(20),
    from_address    VARCHAR(42) NOT NULL,
    to_address      VARCHAR(42) NOT NULL,
    amount          NUMERIC NOT NULL,
    decimals        INT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_token_from ON token_transfers(from_address);
CREATE INDEX idx_token_to ON token_transfers(to_address);
CREATE INDEX idx_token_symbol ON token_transfers(token_symbol);

-- Wallet portfolio snapshots (for wallet drilldown)
CREATE TABLE wallet_positions (
    id              SERIAL PRIMARY KEY,
    wallet_address  VARCHAR(42) NOT NULL,
    protocol        VARCHAR(20) NOT NULL,
    position_type   VARCHAR(30) NOT NULL,  -- 'vault', 'lp_position', 'stake', 'guardian', 'order'
    position_data   JSONB,                 -- Protocol-specific position details
    last_updated    TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_wallet_positions ON wallet_positions(wallet_address, protocol);

-- Protocol-level aggregate metrics (feeds into Oeconomia dashboards)
CREATE TABLE protocol_metrics (
    id              SERIAL PRIMARY KEY,
    protocol        VARCHAR(20) NOT NULL,
    metric_name     VARCHAR(50) NOT NULL,  -- 'tvl', 'daily_volume', 'unique_users', etc.
    metric_value    NUMERIC NOT NULL,
    timestamp       TIMESTAMP NOT NULL,
    granularity     VARCHAR(10) DEFAULT 'hourly'  -- 'hourly', 'daily', 'weekly'
);

CREATE INDEX idx_metrics_protocol ON protocol_metrics(protocol, metric_name, timestamp DESC);
```

### Protocol-Specific Views

```sql
-- Alluria: Active Vaults
CREATE VIEW alluria_active_vaults AS
SELECT 
    wp.wallet_address,
    wp.position_data->>'collateral_eth' AS collateral,
    wp.position_data->>'debt_alud' AS debt,
    wp.position_data->>'collateral_ratio' AS cr,
    wp.last_updated
FROM wallet_positions wp
WHERE wp.protocol = 'alluria' AND wp.position_type = 'vault';

-- Eloqura: Recent Swaps
CREATE VIEW eloqura_recent_swaps AS
SELECT 
    t.tx_hash,
    t.from_address AS trader,
    t.decoded_data->>'token_in' AS token_in,
    t.decoded_data->>'token_out' AS token_out,
    t.decoded_data->>'amount_in' AS amount_in,
    t.decoded_data->>'amount_out' AS amount_out,
    t.block_timestamp
FROM transactions t
WHERE t.protocol = 'eloqura' AND t.action_type = 'swap'
ORDER BY t.block_timestamp DESC;

-- Oeconomia: Guardian Activity
CREATE VIEW guardian_activity AS
SELECT 
    t.from_address AS guardian,
    t.action_type,
    t.decoded_data,
    t.block_timestamp
FROM transactions t
WHERE t.protocol = 'oeconomia' 
  AND t.action_type IN ('guardian_staked', 'vote_cast', 'proposal_created')
ORDER BY t.block_timestamp DESC;
```

---

## Alchemy Integration Details

### Services to Use

| Alchemy Service | Purpose | Free Tier Limit |
|---|---|---|
| **Core RPC** (eth_call, eth_getTransactionReceipt) | Fetch raw tx data on-demand | 30M CU/month |
| **Enhanced API** (alchemy_getTokenBalances) | Wallet token balances | Included |
| **Enhanced API** (alchemy_getAssetTransfers) | Transaction history by wallet | Included |
| **Alchemy Notify** (Webhooks) | Real-time event streaming | Included (5 webhooks) |
| **Alchemy Token API** | Token metadata + prices | Included |

### Webhook Setup (one per protocol group)

```javascript
// webhook-config.js
const WEBHOOKS = {
  alluria: {
    addresses: ['0x...AlluriaCoreContract', '0x...StabilityPool'],
    events: [
      'VaultOpened(address,uint256,uint256)',
      'VaultClosed(address)',
      'ALUDMinted(address,uint256)',
      'Liquidation(address,uint256,uint256)',
      'StabilityPoolDeposit(address,uint256)',
    ]
  },
  eloqura: {
    addresses: ['0x...EloquraRouter', '0x...EloquraFactory', '0x...Bridge'],
    events: [
      'Swap(address,uint256,uint256,uint256,uint256,address)',
      'Mint(address,uint256,uint256)',       // AddLiquidity
      'Burn(address,uint256,uint256,address)', // RemoveLiquidity
      'BridgeInitiated(address,uint256,uint256,bytes32)',
    ]
  },
  artivya: {
    addresses: ['0x...ArtivyaExchange', '0x...NFTMarketplace'],
    events: [
      'OrderPlaced(bytes32,address,address,uint256,uint256)',
      'OrderFilled(bytes32,address,uint256)',
      'NFTListed(uint256,address,uint256)',
      'NFTSold(uint256,address,address,uint256)',
    ]
  },
  oeconomia_iridescia: {
    addresses: ['0x...OECGovernance', '0x...GuardianStaking', '0x...IridesciaFactory'],
    events: [
      'GuardianStaked(address,uint256)',
      'VoteCast(address,uint256,bool)',
      'ProposalCreated(uint256,address,string)',
      'ContractDeployed(address,address,string)',
    ]
  }
};
```

### ABI Decoder Service

```javascript
// decoder.js
const { ethers } = require('ethers');

class ProtocolDecoder {
  constructor() {
    this.interfaces = {
      alluria:    new ethers.Interface(require('./abis/alluria.json')),
      eloqura:    new ethers.Interface(require('./abis/eloqura.json')),
      artivya:    new ethers.Interface(require('./abis/artivya.json')),
      iridescia:  new ethers.Interface(require('./abis/iridescia.json')),
      oeconomia:  new ethers.Interface(require('./abis/oeconomia.json')),
    };
    
    // Map contract addresses to protocols
    this.addressToProtocol = {
      '0x...AlluriaCoreContract': 'alluria',
      '0x...EloquraRouter':       'eloqura',
      '0x...ArtivyaExchange':     'artivya',
      '0x...IridesciaFactory':    'iridescia',
      '0x...OECGovernance':       'oeconomia',
      // ... all contract addresses
    };
  }

  decode(txReceipt) {
    const protocol = this.addressToProtocol[txReceipt.to];
    if (!protocol) return { protocol: 'unknown', action_type: 'unknown', decoded_data: {} };

    const iface = this.interfaces[protocol];
    
    // Decode function call
    const functionData = iface.parseTransaction({ data: txReceipt.input, value: txReceipt.value });
    
    // Decode event logs
    const decodedLogs = txReceipt.logs.map(log => {
      try { return iface.parseLog(log); } 
      catch { return null; }
    }).filter(Boolean);

    return {
      protocol,
      action_type: this.classifyAction(protocol, functionData?.name, decodedLogs),
      decoded_data: {
        function: functionData?.name,
        args: functionData?.args ? Object.fromEntries(
          Object.entries(functionData.args).filter(([k]) => isNaN(k))
        ) : {},
        events: decodedLogs.map(l => ({ name: l.name, args: l.args })),
      }
    };
  }

  classifyAction(protocol, functionName, logs) {
    // Human-readable action classification
    const actionMap = {
      alluria: {
        'openVault':    'Opened Alluria Vault',
        'closeVault':   'Closed Alluria Vault',
        'mintALUD':     'Minted ALUD',
        'repayDebt':    'Repaid ALUD Debt',
        'addCollateral': 'Added Collateral',
        'liquidate':    'Liquidation Executed',
      },
      eloqura: {
        'swapExactTokensForTokens': 'Token Swap',
        'addLiquidity':             'Added Liquidity',
        'removeLiquidity':          'Removed Liquidity',
        'bridgeTokens':             'Cross-Chain Bridge',
      },
      artivya: {
        'placeOrder':   'Order Placed',
        'cancelOrder':  'Order Cancelled',
        'listNFT':      'NFT Listed',
        'buyNFT':       'NFT Purchased',
      },
      oeconomia: {
        'stakeOEC':        'Guardian Staked OEC',
        'vote':            'Governance Vote Cast',
        'createProposal':  'Proposal Created',
      },
      iridescia: {
        'deployContract':  'Contract Deployed',
        'useTemplate':     'Template Instantiated',
      }
    };
    
    return actionMap[protocol]?.[functionName] || functionName || 'Unknown Action';
  }
}

module.exports = ProtocolDecoder;
```

---

## Frontend Pages & Components

### Page Structure

```
/                           → Dashboard (protocol overview + recent activity)
/tx/:hash                   → Transaction detail (decoded, protocol-aware)
/address/:addr              → Wallet portfolio (cross-protocol positions)
/block/:number              → Block detail
/protocol/alluria           → Alluria dashboard (vaults, liquidations, ALUD stats)
/protocol/eloqura           → Eloqura dashboard (swaps, pools, volume, TradingView charts)
/protocol/artivya           → Artivya dashboard (order book, NFT marketplace activity)
/protocol/iridescia         → Iridescia dashboard (deployments, template usage)
/protocol/oeconomia         → Governance dashboard (proposals, guardian activity)
/tokens                     → Token list (OEC, ALUD, ALUR + all tracked tokens)
/tokens/:address            → Token detail page
```

### Key Components

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.tsx         : Search bar + protocol nav
│   │   ├── Sidebar.tsx        : Protocol quick links
│   │   └── Footer.tsx
│   ├── explorer/
│   │   ├── SearchBar.tsx      : Universal search (tx/address/block/token)
│   │   ├── TxDetail.tsx       : Decoded transaction view
│   │   ├── TxList.tsx         : Paginated transaction table
│   │   ├── BlockDetail.tsx    : Block info + transactions
│   │   └── AddressDetail.tsx  : Wallet overview + positions
│   ├── protocols/
│   │   ├── AlluriaPanel.tsx   : Vault status, collateral ratios, ALUD supply
│   │   ├── EloquraPanel.tsx   : Swap history, pool TVL, TradingView embed
│   │   ├── ArtivyaPanel.tsx   : Order book, NFT listings
│   │   ├── IridesciaPanel.tsx : Deployment logs, template gallery
│   │   └── GovernancePanel.tsx: Proposals, voting, guardian leaderboard
│   ├── charts/
│   │   ├── TVLChart.tsx       : Cross-protocol TVL over time
│   │   ├── VolumeChart.tsx    : Trading volume (Eloqura + Artivya)
│   │   └── GasTracker.tsx     : Network gas metrics
│   └── shared/
│       ├── AddressLink.tsx    : Clickable address with copy + identicon
│       ├── TokenAmount.tsx    : Formatted token amount with symbol
│       ├── ProtocolBadge.tsx  : Color-coded protocol identifier
│       ├── TimeAgo.tsx        : Relative timestamp
│       └── LiveIndicator.tsx  : Pulsing dot for real-time data
├── hooks/
│   ├── useWebSocket.ts       : Live transaction feed
│   ├── useAlchemy.ts         : Alchemy SDK wrapper
│   └── useProtocolData.ts    : Protocol-specific data fetching
├── services/
│   ├── api.ts                : REST API client
│   ├── decoder.ts            : Client-side lightweight decoder
│   └── websocket.ts          : WebSocket connection manager
└── utils/
    ├── formatters.ts         : Wei/Gwei conversion, address truncation
    ├── protocolColors.ts     : Consistent color mapping per protocol
    └── constants.ts          : Contract addresses, API endpoints
```

---

## Tech Stack Summary

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React + TypeScript + Tailwind | Already your stack for the ecosystem |
| **Charts** | TradingView (Eloqura) + Recharts (metrics) | TradingView already integrated |
| **Backend** | Node.js + Express | JS everywhere, fast development |
| **Database** | PostgreSQL | Better for relational queries + JSONB for flexible decoded data |
| **Cache** | Redis | Fast lookups + pub/sub for live updates |
| **Blockchain Data** | Alchemy SDK + Webhooks | Free tier sufficient, enhanced APIs save dev time |
| **Real-time** | WebSocket (ws or socket.io) | Live transaction feed to frontend |
| **Hosting** | VPS (DigitalOcean/Hetzner) or Vercel + Railway | $10-30/month to start |

---

## Build Phases

### Phase 1: Core Explorer (Weeks 1-2)
- [ ] Set up backend with Alchemy SDK connection
- [ ] Implement ABI decoder for all 5 protocols
- [ ] Build transaction search + detail pages
- [ ] Wallet address lookup with token balances
- [ ] Basic PostgreSQL schema + indexing

### Phase 2: Real-Time + Protocol Dashboards (Weeks 3-4)
- [ ] Set up Alchemy webhooks for all protocol contracts
- [ ] WebSocket live transaction feed
- [ ] Protocol-specific dashboard pages
- [ ] Alluria vault tracker
- [ ] Eloqura swap history + TradingView integration

### Phase 3: Advanced Features (Weeks 5-6)
- [ ] Wallet portfolio view (cross-protocol positions)
- [ ] Protocol metrics aggregation + charts
- [ ] Guardian leaderboard + governance tracker
- [ ] Integration with existing Oeconomia data visualization site
- [ ] Token pages with price history

### Phase 4: Polish + Integration (Week 7-8)
- [ ] Mobile responsive design
- [ ] Performance optimization (Redis caching)
- [ ] API documentation (for other devs building on Iridescia)
- [ ] Embed explorer into main Oeconomia hub site

---

## Monthly Cost Estimate

| Item | Cost |
|---|---|
| Alchemy Free Tier | $0 |
| VPS Hosting (backend + DB) | $10-24/month |
| Domain (if separate) | $12/year |
| Redis (managed or self-hosted on VPS) | $0 (on same VPS) |
| **Total at launch** | **~$10-24/month** |
| **Scaling to 1000+ users** | **~$50-100/month** |
