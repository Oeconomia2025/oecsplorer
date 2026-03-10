# OECsplorer Documentation

A protocol-aware blockchain explorer built for the Oeconomia ecosystem. Unlike generic explorers, OECsplorer decodes smart contract interactions into human-readable activity across five interconnected protocols: all on Sepolia testnet.

{% hint style="info" %}
**Live at** [oecsplorer.oeconomia.io](https://oecsplorer.oeconomia.io): Explore decoded transactions, wallet portfolios, and protocol dashboards in real time.
{% endhint %}

## Key Features

<table data-view="cards">
<thead><tr><th></th><th></th></tr></thead>
<tbody>
<tr><td><strong>Protocol-Aware Decoding</strong></td><td>Raw calldata decoded into human-readable actions like "Minted ALUD" or "Token Swap" with full argument display.</td></tr>
<tr><td><strong>Cross-Protocol Portfolios</strong></td><td>View any wallet's positions across all five protocols: token balances, LP positions, staking, vaults.</td></tr>
<tr><td><strong>Real-Time WebSocket Feed</strong></td><td>Live transaction stream via Socket.IO with protocol-specific room subscriptions.</td></tr>
<tr><td><strong>Protocol Dashboards</strong></td><td>Per-protocol metrics: TVL, volume, unique users, and contract activity.</td></tr>
<tr><td><strong>Token Analytics</strong></td><td>Holder lists, transfer history, real-time balance tracking, and 3-tier price engine.</td></tr>
<tr><td><strong>Education Hub</strong></td><td>22 integrated lessons on blockchain fundamentals, DeFi, governance, and more.</td></tr>
</tbody>
</table>

## Supported Protocols

| Protocol       | Token | Description                                                         |
| -------------- | ----- | ------------------------------------------------------------------- |
| **Oeconomia**  | OEC   | Governance hub: Guardian staking, proposals, voting, treasury       |
| **Alluria**    | ALUR  | Lending protocol: collateralized vaults, ALUD stablecoin, liquidations |
| **Eloqura**    | ELOQ  | DEX/AMM: Uniswap V2-style swaps, liquidity pools, limit orders    |
| **Artivya**    | ARTV  | Hybrid exchange: order book + AMM, NFT marketplace                 |
| **Iridescia**  | IRID  | Developer infra: contract factory, templates, security modules     |

## Tech Stack

| Layer      | Technology              | Purpose                              |
| ---------- | ----------------------- | ------------------------------------ |
| Frontend   | React 18 + TypeScript   | UI framework                         |
| Styling    | Tailwind CSS            | Utility-first styling                |
| Charts     | Recharts                | TVL, gas, and metric visualizations  |
| Backend    | Express.js + TypeScript | REST API server                      |
| Blockchain | ethers.js 6 + Alchemy SDK | RPC calls, ABI decoding            |
| Database   | PostgreSQL + Prisma ORM | Transaction storage & querying       |
| Real-time  | Socket.IO               | WebSocket live feed                  |
| Build      | Vite                    | Frontend bundling                    |
| Hosting    | Railway                 | Server + database deployment         |
