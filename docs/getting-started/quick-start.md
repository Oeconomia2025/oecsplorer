# Quick Start

Get OECsplorer running locally in under 5 minutes.

## Prerequisites

* Node.js 18+ and npm
* PostgreSQL database (local or hosted)
* Alchemy API key ([free tier](https://www.alchemy.com/) works)

## Installation

```bash
# Clone the repository
git clone https://github.com/Oeconomia2025/oecsplorer.git
cd oeconomia-explorer

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

## Configure Environment

Edit `.env` with your credentials:

```bash
# Required
ALCHEMY_API_KEY=your_alchemy_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/oeconomia_explorer

# Optional
PORT=3001
REDIS_URL=redis://localhost:6379
```

## Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

## Start Development Server

```bash
# Starts both frontend (port 5173) and backend (port 3001)
npm run dev
```

{% hint style="success" %}
Visit **http://localhost:5173** to see the explorer. The backend API is at **http://localhost:3001/api**.
{% endhint %}

## Backfill Historical Data

The explorer starts with an empty database. Run the backfill script to index the last 30 days of transactions across all protocol contracts:

```bash
npm run backfill
```

The backfill runs in three phases:

1. **Phase 1** — `getAssetTransfers` for each contract (inbound + outbound)
2. **Phase 1.5** — `contractAddresses` filter for cross-contract token transfers
3. **Phase 2** — `eth_getLogs` scan in 10-block chunks

{% hint style="warning" %}
Phase 2 is very slow on Alchemy's free tier (limited to 10-block ranges). For production backfills, consider upgrading to PAYG.
{% endhint %}

## Production Build

```bash
# Build frontend + generate Prisma client
npm run build

# Start production server (serves frontend as static files)
npm start
```
