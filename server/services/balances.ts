// ============================================================
// Oeconomia Explorer — Token Balance Cache Service
// ============================================================
// Keeps per-wallet token balances in PostgreSQL so the holders
// endpoint reads from DB (0 CUs) instead of calling Alchemy
// getTokenBalances() for every address (~100 CUs per page load).
//
// Balances are refreshed on every Transfer event by the webhook
// handler and the polling indexer.
// ============================================================

import { prisma } from "../db";
import { getTokenBalances } from "./alchemy";

const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

export { TRANSFER_TOPIC };

// -- Refresh on Transfer event -----------------------------------------------

/**
 * Called by webhook handler and indexer when a Transfer event is processed.
 * Fetches the on-chain balance for both sender and receiver of a specific
 * token, then upserts into the token_balances table.
 *
 * Cost: 2 Alchemy CUs (one getTokenBalances per address).
 */
export async function refreshBalancesForTransfer(
  tokenAddress: string,
  fromAddr: string,
  toAddr: string
) {
  const token = tokenAddress.toLowerCase();
  const ZERO = "0x0000000000000000000000000000000000000000";

  // Refresh both addresses in parallel (skip zero-address)
  const addresses = [fromAddr, toAddr]
    .map((a) => a.toLowerCase())
    .filter((a) => a !== ZERO);

  // Deduplicate (self-transfers)
  const unique = [...new Set(addresses)];

  await Promise.all(
    unique.map(async (wallet) => {
      try {
        const balances = await getTokenBalances(wallet);
        const match = balances.find(
          (b) => b.contractAddress.toLowerCase() === token
        );
        const balance = match ? match.balance : "0";

        await prisma.tokenBalance.upsert({
          where: {
            walletAddress_tokenAddress: {
              walletAddress: wallet,
              tokenAddress: token,
            },
          },
          create: {
            walletAddress: wallet,
            tokenAddress: token,
            balance,
            lastUpdated: new Date(),
          },
          update: {
            balance,
            lastUpdated: new Date(),
          },
        });
      } catch (err) {
        // Non-fatal — log and continue
        const msg = err instanceof Error ? err.message : String(err);
        console.error(
          `[Balances] Failed to refresh ${wallet.slice(0, 10)}… for token ${token.slice(0, 10)}…: ${msg}`
        );
      }
    })
  );
}

// -- Read from cache ---------------------------------------------------------

export interface CachedHolder {
  rank: number;
  address: string;
  balance: string;
  isContract: boolean;
}

/**
 * Read all cached holders for a token from the DB.
 * Returns sorted by balance descending, or null if no cached data exists
 * (signals that the caller should fall back to Alchemy and seed).
 */
export async function getHoldersFromCache(
  tokenAddress: string
): Promise<CachedHolder[] | null> {
  const token = tokenAddress.toLowerCase();

  const rows = await prisma.tokenBalance.findMany({
    where: { tokenAddress: token },
  });

  if (rows.length === 0) return null;

  // Filter out zero balances and sort descending
  const holders = rows
    .filter((r) => {
      try {
        return BigInt(r.balance) > 0n;
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      const diff = BigInt(b.balance) - BigInt(a.balance);
      return diff > 0n ? 1 : diff < 0n ? -1 : 0;
    })
    .map((r, i) => ({
      rank: i + 1,
      address: r.walletAddress,
      balance: r.balance,
      isContract: false, // Will be enriched by the endpoint if needed
    }));

  return holders;
}

// -- Seed (one-time bulk populate) -------------------------------------------

/**
 * Seed the balance cache for a token given a list of known holder addresses.
 * Called on first holders page visit when the cache is empty.
 * Cost: N Alchemy CUs (same as the current holders endpoint).
 */
export async function seedBalancesForToken(
  tokenAddress: string,
  balanceResults: Array<{ address: string; balance: string }>
) {
  const token = tokenAddress.toLowerCase();

  // Bulk upsert — do them in parallel batches
  const BATCH_SIZE = 20;
  for (let i = 0; i < balanceResults.length; i += BATCH_SIZE) {
    const batch = balanceResults.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async ({ address, balance }) => {
        try {
          await prisma.tokenBalance.upsert({
            where: {
              walletAddress_tokenAddress: {
                walletAddress: address.toLowerCase(),
                tokenAddress: token,
              },
            },
            create: {
              walletAddress: address.toLowerCase(),
              tokenAddress: token,
              balance,
              lastUpdated: new Date(),
            },
            update: {
              balance,
              lastUpdated: new Date(),
            },
          });
        } catch {
          // Skip individual failures
        }
      })
    );
  }
}
