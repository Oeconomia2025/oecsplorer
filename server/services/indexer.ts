// ============================================================
// Oeconomia Explorer — Polling Indexer
// ============================================================
// Checks Alchemy every 30s for new transactions on deployed
// contracts, decodes them, stores in PostgreSQL, and broadcasts
// via the WebSocket broadcast function.
// ============================================================

import { prisma, sanitizeForJson } from "../db";
import { getLatestBlockNumber, getFullTransaction } from "./alchemy";
import { ProtocolDecoder } from "./decoder";
import {
  buildAddressToProtocolMap,
  getAllContractAddresses,
  TOKENS,
} from "../../src/utils/constants";
import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";

// -- Configuration ----------------------------------------------------------

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "YOUR_API_KEY_HERE";

const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
});

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

  // Determine where to start: check DB for last indexed block
  try {
    const lastBlock = await prisma.indexedBlock.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    if (lastBlock) {
      lastIndexedBlock = Number(lastBlock.blockNumber);
      console.log(`[Indexer] Resuming from block ${lastIndexedBlock}`);
    } else {
      // Start from current block (don't try to backfill on first boot)
      lastIndexedBlock = await getLatestBlockNumber();
      console.log(`[Indexer] No history — starting from current block ${lastIndexedBlock}`);
    }
  } catch (err) {
    console.error("[Indexer] Error reading last indexed block, starting from latest:", err);
    lastIndexedBlock = await getLatestBlockNumber();
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
 * Single poll cycle: fetch new blocks since last indexed,
 * find Oeconomia transactions, decode & store them.
 */
async function pollForTransactions() {
  try {
    const latestBlock = await getLatestBlockNumber();

    if (latestBlock <= lastIndexedBlock) {
      return; // No new blocks
    }

    const fromBlock = lastIndexedBlock + 1;
    const toBlock = latestBlock;
    const blockRange = toBlock - fromBlock + 1;

    console.log(
      `[Indexer] Checking blocks ${fromBlock}–${toBlock} (${blockRange} blocks)`
    );

    // Use getAssetTransfers to find transactions TO our contracts
    const contractAddresses = getAllContractAddresses().filter(
      (addr) => !addr.startsWith("0x000000000000000000000000000000000000")
    );

    if (contractAddresses.length === 0) {
      lastIndexedBlock = toBlock;
      return;
    }

    let totalProcessed = 0;

    // Fetch transfers TO our contract addresses
    for (const contractAddr of contractAddresses) {
      try {
        const transfers = await alchemy.core.getAssetTransfers({
          toAddress: contractAddr,
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
          category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.ERC20,
          ],
          withMetadata: true,
          maxCount: 100,
        });

        for (const transfer of transfers.transfers) {
          const txHash = transfer.hash;
          if (!txHash) continue;

          // Skip if already in DB
          const existing = await prisma.transaction.findUnique({
            where: { txHash },
          });
          if (existing) continue;

          // Fetch full transaction & decode
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

          // Determine block timestamp
          const blockTimestamp = transfer.metadata?.blockTimestamp
            ? new Date(transfer.metadata.blockTimestamp)
            : new Date();

          // Store in PostgreSQL
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

          // Store token transfers from decoded events
          await storeTokenTransfers(txHash, decoded.decodedEvents, fullTx.logs);

          totalProcessed++;

          // Broadcast to WebSocket clients
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
                value: fullTx.value,
                timestamp: blockTimestamp.toISOString(),
              },
            });
          }
        }
      } catch (err) {
        // Log but don't stop — some contracts may not have activity
        const msg = err instanceof Error ? err.message : String(err);
        if (!msg.includes("No transactions found")) {
          console.error(`[Indexer] Error fetching transfers for ${contractAddr}:`, msg);
        }
      }
    }

    // Also fetch transfers FROM our contracts (outbound)
    for (const contractAddr of contractAddresses) {
      try {
        const transfers = await alchemy.core.getAssetTransfers({
          fromAddress: contractAddr,
          fromBlock: `0x${fromBlock.toString(16)}`,
          toBlock: `0x${toBlock.toString(16)}`,
          category: [
            AssetTransfersCategory.EXTERNAL,
            AssetTransfersCategory.ERC20,
          ],
          withMetadata: true,
          maxCount: 100,
        });

        for (const transfer of transfers.transfers) {
          const txHash = transfer.hash;
          if (!txHash) continue;

          const existing = await prisma.transaction.findUnique({
            where: { txHash },
          });
          if (existing) continue;

          const fullTx = await getFullTransaction(txHash);
          if (!fullTx) continue;

          // For outbound transfers, check the 'to' OR 'from' address
          const protocol =
            decoder.getProtocol(fullTx.to) !== "unknown"
              ? decoder.getProtocol(fullTx.to)
              : decoder.getProtocol(fullTx.from);

          if (protocol === "unknown") continue;

          const decoded = decoder.isOeconomiaContract(fullTx.to)
            ? decoder.decode({
                to: fullTx.to,
                input: fullTx.input,
                value: fullTx.value,
                logs: fullTx.logs,
              })
            : {
                protocol,
                actionType: "Contract Outbound",
                functionName: "",
                decodedArgs: {},
                decodedEvents: [],
              };

          const blockTimestamp = transfer.metadata?.blockTimestamp
            ? new Date(transfer.metadata.blockTimestamp)
            : new Date();

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

          totalProcessed++;
        }
      } catch {
        // Silently skip — outbound may not exist for many contracts
      }
    }

    if (totalProcessed > 0) {
      console.log(`[Indexer] Stored ${totalProcessed} new transactions`);
    }

    // Update last indexed block
    lastIndexedBlock = toBlock;
  } catch (err) {
    console.error("[Indexer] Poll cycle error:", err);
  }
}
