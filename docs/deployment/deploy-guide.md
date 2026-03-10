# Deploy Guide

OECsplorer runs on Railway with a PostgreSQL database. The frontend and backend are served from the same Express process.

## Production URLs

| Service          | URL                                              |
| ---------------- | ------------------------------------------------ |
| Public Explorer  | [oecsplorer.oeconomia.io](https://oecsplorer.oeconomia.io) |
| Railway App      | oeconomia-explorer-production.up.railway.app     |
| Database         | PostgreSQL on Railway                            |

## Deployment Flow

Railway auto-deploys from GitHub when you push to the `main` branch:

```bash
# Make changes, commit, push
git add .
git commit -m "Update decoder for new protocol"
git push origin main

# Railway detects the push and deploys automatically
```

## Build Process

```bash
# Production build (frontend + Prisma client)
npm run build

# Start production server
npm start
```

The production server:
1. Starts Express on the configured PORT
2. Serves the built React frontend from `dist/` as static files
3. Starts the polling indexer (5-minute cycle)
4. Opens WebSocket connections for real-time feeds

## Initial Setup on Railway

1. Create a new Railway project
2. Add a PostgreSQL database service
3. Add a web service connected to the GitHub repository
4. Set environment variables (see [Environment Variables](environment-variables.md))
5. Deploy: Railway runs `npm install`, `npm run build`, then `npm start`
6. Run the backfill script to populate historical data:
   ```bash
   DATABASE_URL="postgresql://..." npx tsx server/scripts/backfill.ts
   ```

## Custom Domain

Configure `oecsplorer.oeconomia.io` to point to the Railway app:

1. In Railway, go to Settings → Custom Domain
2. Add `oecsplorer.oeconomia.io`
3. Add a CNAME record in your DNS provider pointing to Railway's domain

## Database Maintenance

```bash
# Push schema changes to production
DATABASE_URL="postgresql://..." npx prisma db push

# Generate client after schema change
npx prisma generate

# Re-decode all stored transactions after decoder updates
DATABASE_URL="postgresql://..." npx tsx server/scripts/redecode.ts
```

## Monitoring

* **Railway Dashboard**: CPU, memory, request logs
* **Alchemy Dashboard**: Compute unit usage, rate limit tracking
* **Application Logs**: `console.error` statements in indexer and webhook handler
