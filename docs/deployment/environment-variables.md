# Environment Variables

All configuration is managed through environment variables. Copy `.env.example` to `.env` for local development.

## Required Variables

| Variable          | Description                                  | Example                                        |
| ----------------- | -------------------------------------------- | ---------------------------------------------- |
| `ALCHEMY_API_KEY` | Alchemy API key for Sepolia RPC and Enhanced APIs | `esuQ5PPGg8-Sr5-X-P-JT`                     |
| `DATABASE_URL`    | PostgreSQL connection string (Prisma format) | `postgresql://user:pass@host:5432/oeconomia_explorer` |

## Optional Variables

| Variable             | Default                   | Description                          |
| -------------------- | ------------------------- | ------------------------------------ |
| `ALCHEMY_NETWORK`    | `ETH_SEPOLIA`             | Alchemy network identifier           |
| `PORT`               | `3001`                    | Express server port                  |
| `REDIS_URL`          | -                         | Redis URL for optional caching layer |
| `CLIENT_URL`         | `http://localhost:5173`   | Frontend URL (CORS origin)           |
| `INDEXER_START_BLOCK` | auto                     | Override indexer start block number  |

## Frontend Variables (Vite)

Variables prefixed with `VITE_` are embedded into the frontend build:

| Variable        | Default                       | Description                |
| --------------- | ----------------------------- | -------------------------- |
| `VITE_API_URL`  | `http://localhost:3001/api`   | Backend API base URL       |
| `VITE_WS_URL`   | `http://localhost:3001`      | WebSocket connection URL   |

{% hint style="info" %}
`VITE_` variables are baked into the frontend at **build time**. Changing them requires a rebuild.
{% endhint %}

## Example `.env` File

```bash
# ── Alchemy ──
ALCHEMY_API_KEY=your_alchemy_api_key_here
ALCHEMY_NETWORK=ETH_SEPOLIA

# ── Database ──
DATABASE_URL=postgresql://user:password@localhost:5432/oeconomia_explorer

# ── Redis (optional) ──
REDIS_URL=redis://localhost:6379

# ── Server ──
PORT=3001
CLIENT_URL=http://localhost:5173

# ── Frontend ──
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=http://localhost:3001
```

## Production Notes

* On Railway, set environment variables in the service's Variables tab
* `DATABASE_URL` is automatically provided when you link a Railway PostgreSQL service
* Never commit `.env` files to git: they're in `.gitignore`
