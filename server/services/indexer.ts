// ============================================================
// Oeconomia Explorer — Polling Indexer
// ============================================================
// Uses getLogs() every 5 minutes to fetch events emitted by our
// exclusive contracts, then decodes matched transactions and
// stores them in PostgreSQL. Broadcasts new txs via WebSocket.
// ============================================================

import { prisma, sanitizeForJson } from "../db";
import { getLatestBlockNumber, getFullTransaction, getLogs } from "./alchemy";
import { ProtocolDecoder } from "./decoder";
import { refreshBalancesForTransfer } from "./balances";
import {
  buildAddressToProtocolMap,
  getExclusiveContractAddresses,
  TOKENS,
  ProtocolId,
} from "../../src/utils/constants";

// -- Configuration ----------------------------------------------------------

const POLL_INTERVAL_MS = 300_000; // 5 minutes

// -- Decoder setup ----------------------------------------------------------

const addressMap = buildAddressToProtocolMap();
const decoderMap: Record<string, string> = {};
for (const [addr, protocol] of Object.entries(addressMap)) {
  decoderMap[addr] = protocol;
}
const decoder = new ProtocolDecoder(decoderMap);

// -- State ------------------------------------------------------------------

let lastIndexedBlock = 0;
let broadcastFn: ((event: string, data: unknown) => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;

// -- Token Transfer Helper --------------------------------------------------

/** Resolve token symbol from known tokens list */
function resolveTokenSymbol(contractAddress: string): { symbol: string | null; decimals: number | null } {
  const token = TOKENS.find(
    (t) => t.address.toLowerCase() === contractAddress.toLowerCase()
  );
  return token ? { symbol: token.symbol, decimals: token.decimals } : { symbol: null, decimals: null };
}

/** Store token transfer records extracted from decoded events */
async function storeTokenTransfers(
  txHash: string,
  decodedEvents: Array<{ name: string; args: Record<string, unknown> }>,
  logs: Array<{ address: string; topics: string[]; data: string }> | undefined
) {
  if (!decodedEvents || !logs) return;

  // Match Transfer events with their log addresses (to get the token contract)
  let logIndex = 0;
  for (const event of decodedEvents) {
    if (event.name !== "Transfer") {
      logIndex++;
      continue;
    }

    // Find the corresponding log to get the token contract address
    const fromAddr = String(event.args.from || "").toLowerCase();
    const toAddr = String(event.args.to || "").toLowerCase();
    const value = String(event.args.value || "0");

    // Search logs for the matching Transfer event
    let tokenAddress = "";
    for (let i = logIndex; i < logs.length; i++) {
      // Transfer topic0 = keccak256("Transfer(address,address,uint256)")
      if (logs[i].topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
        tokenAddress = logs[i].address.toLowerCase();
        logIndex = i + 1;
        break;
      }
    }

    if (!tokenAddress) continue;

    const { symbol, decimals } = resolveTokenSymbol(tokenAddress);

    try {
      await prisma.tokenTransfer.create({
        data: {
          txHash,
          tokenAddress,
          tokenSymbol: symbol,
          fromAddress: fromAddr,
          toAddress: toAddr,
          amount: value,
          decimals,
        },
      });

      // Keep balance cache fresh
      refreshBalancesForTransfer(tokenAddress, fromAddr, toAddr).catch(() => {});
    } catch (err) {
      // Skip duplicates or errors silently
    }
  }
}

// -- Public API -------------------------------------------------------------

/**
 * Set the WebSocket broadcast function (injected from server/index.ts)
 */
export function setIndexerBroadcast(fn: (event: string, data: unknown) => void) {
  broadcastFn = fn;
}

/**
 * Start the polling indexer
 */
export async function startIndexer() {
  console.log("[Indexer] Starting polling indexer");

  // Determine where to start: check for env override first
  const envStartBlock = process.env.INDEXER_START_BLOCK;
  if (envStartBlock) {
    lastIndexedBlock = parseInt(envStartBlock, 10);
    console.log(`[Indexer] Using INDEXER_START_BLOCK override: block ${lastIndexedBlock}`);
  } else {
    try {
      const lastBlock = await prisma.indexedBlock.findFirst({
        orderBy: { blockNumber: "desc" },
      });
      if (lastBlock) {
        lastIndexedBlock = Number(lastBlock.blockNumber);
        console.log(`[Indexer] Resuming from IndexedBlock: block ${lastIndexedBlock}`);
      } else {
        // IndexedBlock empty — fall back to latest Transaction blockNumber
        const lastTx = await prisma.transaction.findFirst({
          orderBy: { blockNumber: "desc" },
          select: { blockNumber: true },
        });
        if (lastTx) {
          lastIndexedBlock = Number(lastTx.blockNumber);
          console.log(`[Indexer] No IndexedBlock history — resuming from latest tx block ${lastIndexedBlock}`);
        } else {
          // Truly empty DB — start from current block
          lastIndexedBlock = await getLatestBlockNumber();
          console.log(`[Indexer] Empty database — starting from current block ${lastIndexedBlock}`);
        }
      }
    } catch (err) {
      console.error("[Indexer] Error reading last indexed block, starting from latest:", err);
      lastIndexedBlock = await getLatestBlockNumber();
    }
  }

  // Run once immediately, then schedule
  await pollForTransactions();
  pollTimer = setInterval(pollForTransactions, POLL_INTERVAL_MS);
}

/**
 * Stop the polling indexer
 */
export function stopIndexer() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
    console.log("[Indexer] Stopped");
  }
}

// -- Internal ---------------------------------------------------------------

/**
 * Single poll cycle: use getLogs() to fetch all events emitted by our
 * exclusive contracts in the new block range, then fetch full transaction
 * details only for the (rare) matches. ~77% cheaper than block scanning.
 */
async function pollForTransactions() {
  try {
    const latestBlock = await getLatestBlockNumber();

    if (latestBlock <= lastIndexedBlock) {
      return; // No new blocks
    }

    const fromBlock = lastIndexedBlock + 1;
    // Cap at 500 blocks per cycle to keep catch-up reasonable
    const toBlock = Math.min(latestBlock, fromBlock + 499);
    const blockRange = toBlock - fromBlock + 1;

    // Only scan exclusive (Oeconomia-owned) contracts
    const contractAddresses = new Set(
      getExclusiveContractAddresses()
        .filter((addr) => !addr.startsWith("0x000000000000000000000000000000000000"))
        .map((addr) => addr.toLowerCase())
    );

    if (contractAddresses.size === 0) {
      lastIndexedBlock = toBlock;
      return;
    }

    console.log(
      `[Indexer] Checking blocks ${fromBlock}–${toBlock} (${blockRange} blocks) via getLogs`
    );

    // Alchemy free tier limits getLogs to 10 blocks per request — chunk accordingly
    const GETLOGS_CHUNK_SIZE = 10;
    const allLogs: Awaited<ReturnType<typeof getLogs>> = [];

    for (let chunkStart = fromBlock; chunkStart <= toBlock; chunkStart += GETLOGS_CHUNK_SIZE) {
      const chunkEnd = Math.min(chunkStart + GETLOGS_CHUNK_SIZE - 1, toBlock);
      const chunk = await getLogs({
        address: Array.from(contractAddresses),
        fromBlock: chunkStart,
        toBlock: chunkEnd,
      });
      allLogs.push(...chunk);
    }

    // Extract unique transaction hashes from matched logs
    const txHashes = [...new Set(allLogs.map((log) => log.transactionHash))];

    console.log(
      `[Indexer] getLogs returned ${allLogs.length} events from ${txHashes.length} transactions`
    );

    let totalProcessed = 0;

    for (const txHash of txHashes) {
      try {
        // Skip already-indexed transactions
        const existing = await prisma.transaction.findUnique({ where: { txHash } });
        if (existing) continue;

        const fullTx = await getFullTransaction(txHash);
        if (!fullTx) continue;

        const decoded = decoder.isOeconomiaContract(fullTx.to)
          ? decoder.decode({
              to: fullTx.to,
              input: fullTx.input,
              value: fullTx.value,
              logs: fullTx.logs,
            })
          : null;

        if (!decoded || decoded.protocol === "unknown") continue;

        const blockTimestamp = new Date(); // getLogs doesn't include timestamps

        await prisma.transaction.upsert({
          where: { txHash },
          create: {
            txHash,
            blockNumber: BigInt(fullTx.blockNumber),
            blockTimestamp,
            fromAddress: fullTx.from.toLowerCase(),
            toAddress: fullTx.to.toLowerCase(),
            valueWei: fullTx.value,
            gasUsed: BigInt(fullTx.gasUsed),
            gasPrice: fullTx.gasPrice,
            status: fullTx.status,
            protocol: decoded.protocol,
            actionType: decoded.actionType,
            functionName: decoded.functionName || null,
            decodedData: sanitizeForJson({
              args: decoded.decodedArgs,
              events: decoded.decodedEvents,
            }),
          },
          update: {},
        });

        await storeTokenTransfers(txHash, decoded.decodedEvents, fullTx.logs);
        totalProcessed++;

        if (broadcastFn) {
          broadcastFn("new_transaction", {
            txHash,
            blockNumber: fullTx.blockNumber,
            fromAddress: fullTx.from,
            toAddress: fullTx.to,
            valueWei: fullTx.value,
            protocol: decoded.protocol,
            actionType: decoded.actionType,
            functionName: decoded.functionName,
            timestamp: blockTimestamp.toISOString(),
            summary: {
              hash: txHash,
              protocol: decoded.protocol,
              action: decoded.actionType,
              from: fullTx.from,
              to: fullTx.to || "",
              value: fullTx.value,
              timestamp: blockTimestamp.toISOString(),
            },
          });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[Indexer] Error processing tx ${txHash}:`, msg);
      }
    }

    if (totalProcessed > 0) {
      console.log(`[Indexer] Stored ${totalProcessed} new transactions`);
    }

    // Update last indexed block (in memory and persisted)
    lastIndexedBlock = toBlock;

    // Persist progress so restarts don't create gaps
    try {
      await prisma.indexedBlock.upsert({
        where: { blockNumber: BigInt(toBlock) },
        create: {
          blockNumber: BigInt(toBlock),
          blockHash: `0x${"0".repeat(64)}`, // placeholder
          timestamp: new Date(),
          txCount: 0,
          oecTxCount: totalProcessed,
        },
        update: {
          oecTxCount: totalProcessed,
        },
      });
    } catch {
      // Non-critical — progress is still tracked in memory
    }
  } catch (err) {
    console.error("[Indexer] Poll cycle error:", err);
  }
}
