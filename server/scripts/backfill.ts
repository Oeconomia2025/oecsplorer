#!/usr/bin/env tsx
// ============================================================
// Oeconomia Explorer — Backfill Script
// ============================================================
// Fetches & decodes past 30 days of transactions for all
// deployed Oeconomia contracts. Run: npm run backfill
//
// Respects Alchemy's getLogs 5000-block limit by chunking.
// Uses getAssetTransfers for reliable historical data.
// ============================================================

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import { ProtocolDecoder } from "../services/decoder";
import {
  buildAddressToProtocolMap,
  getExclusiveContractAddresses,
} from "../../src/utils/constants";
import { sanitizeForJson } from "../db";

// -- Setup ------------------------------------------------------------------

const prisma = new PrismaClient({ log: ["warn", "error"] });

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "YOUR_API_KEY_HERE";

const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network.ETH_SEPOLIA,
});

const addressMap = buildAddressToProtocolMap();
const decoderMap: Record<string, string> = {};
for (const [addr, protocol] of Object.entries(addressMap)) {
  decoderMap[addr] = protocol;
}
const decoder = new ProtocolDecoder(decoderMap);

// -- Constants --------------------------------------------------------------

const DAYS_TO_BACKFILL = 30;
const BLOCKS_PER_DAY_APPROX = 7200; // ~12s per block on Sepolia
const BLOCK_CHUNK_SIZE = 5000; // Alchemy getLogs limit

// -- Main -------------------------------------------------------------------

async function main() {
  console.log("==============================================");
  console.log("  OECONOMIA EXPLORER — BACKFILL");
  console.log("==============================================\n");

  const latestBlock = await alchemy.core.getBlockNumber();
  const startBlock = Math.max(0, latestBlock - DAYS_TO_BACKFILL * BLOCKS_PER_DAY_APPROX);

  console.log(`Latest block:     ${latestBlock}`);
  console.log(`Backfill from:    ${startBlock} (~${DAYS_TO_BACKFILL} days ago)`);
  console.log(`Block range:      ${latestBlock - startBlock} blocks\n`);

  // Only index exclusive Oeconomia contracts (skip placeholders and shared public contracts)
  const contractAddresses = getExclusiveContractAddresses().filter(
    (addr) => !addr.startsWith("0x000000000000000000000000000000000000")
  );

  console.log(`Contracts to index: ${contractAddresses.length}`);
  for (const addr of contractAddresses) {
    const protocol = addressMap[addr.toLowerCase()] || "unknown";
    console.log(`  ${protocol.padEnd(12)} ${addr}`);
  }
  console.log("");

  let totalStored = 0;
  let totalSkipped = 0;

  for (const contractAddr of contractAddresses) {
    const protocol = addressMap[contractAddr.toLowerCase()] || "unknown";
    console.log(`\n--- ${protocol.toUpperCase()} | ${contractAddr} ---`);

    // Fetch inbound transfers (TO the contract)
    const inboundCount = await fetchAndStoreTransfers(
      contractAddr,
      "to",
      startBlock,
      latestBlock
    );
    totalStored += inboundCount.stored;
    totalSkipped += inboundCount.skipped;

    // Fetch outbound transfers (FROM the contract)
    const outboundCount = await fetchAndStoreTransfers(
      contractAddr,
      "from",
      startBlock,
      latestBlock
    );
    totalStored += outboundCount.stored;
    totalSkipped += outboundCount.skipped;
  }

  console.log("\n==============================================");
  console.log(`  BACKFILL COMPLETE`);
  console.log(`  Stored:  ${totalStored} transactions`);
  console.log(`  Skipped: ${totalSkipped} (already in DB)`);
  console.log("==============================================\n");

  await prisma.$disconnect();
}

// -- Helpers ----------------------------------------------------------------

async function fetchAndStoreTransfers(
  contractAddr: string,
  direction: "to" | "from",
  startBlock: number,
  endBlock: number
): Promise<{ stored: number; skipped: number }> {
  let stored = 0;
  let skipped = 0;
  let pageKey: string | undefined;
  let page = 1;

  const label = direction === "to" ? "inbound" : "outbound";

  do {
    try {
      const params: Parameters<typeof alchemy.core.getAssetTransfers>[0] = {
        fromBlock: `0x${startBlock.toString(16)}`,
        toBlock: `0x${endBlock.toString(16)}`,
        category: [
          AssetTransfersCategory.EXTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
        ],
        withMetadata: true,
        maxCount: 100,
        pageKey,
        order: "asc",
      };

      if (direction === "to") {
        params.toAddress = contractAddr;
      } else {
        params.fromAddress = contractAddr;
      }

      const result = await alchemy.core.getAssetTransfers(params);
      const transfers = result.transfers;
      pageKey = result.pageKey;

      if (transfers.length === 0 && page === 1) {
        console.log(`  ${label}: no transfers found`);
        break;
      }

      if (page === 1) {
        console.log(`  ${label}: processing page ${page} (${transfers.length} transfers)...`);
      }

      for (const transfer of transfers) {
        const txHash = transfer.hash;
        if (!txHash) continue;

        // Skip if already stored
        const existing = await prisma.transaction.findUnique({
          where: { txHash },
        });
        if (existing) {
          skipped++;
          continue;
        }

        // Fetch full tx + receipt
        let fullTx;
        try {
          const [tx, receipt] = await Promise.all([
            alchemy.core.getTransaction(txHash),
            alchemy.core.getTransactionReceipt(txHash),
          ]);

          if (!tx || !receipt) continue;

          fullTx = {
            hash: tx.hash,
            from: tx.from,
            to: tx.to || "",
            value: tx.value.toString(),
            input: tx.data,
            gasPrice: tx.gasPrice?.toString() || "0",
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber,
            status: receipt.status === 1,
            logs: receipt.logs.map((log) => ({
              address: log.address,
              topics: log.topics as string[],
              data: log.data,
            })),
          };
        } catch (err) {
          console.error(`  Error fetching tx ${txHash.slice(0, 12)}...:`, err instanceof Error ? err.message : err);
          continue;
        }

        // Decode
        const decoded = decoder.isOeconomiaContract(fullTx.to)
          ? decoder.decode({
              to: fullTx.to,
              input: fullTx.input,
              value: fullTx.value,
              logs: fullTx.logs,
            })
          : null;

        const protocol =
          decoded && decoded.protocol !== "unknown"
            ? decoded.protocol
            : addressMap[contractAddr.toLowerCase()] || "unknown";

        const actionType =
          decoded && decoded.protocol !== "unknown"
            ? decoded.actionType
            : direction === "to"
              ? "Inbound Transfer"
              : "Outbound Transfer";

        const functionName =
          decoded && decoded.protocol !== "unknown"
            ? decoded.functionName
            : null;

        const blockTimestamp = transfer.metadata?.blockTimestamp
          ? new Date(transfer.metadata.blockTimestamp)
          : new Date();

        // Store
        try {
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
              protocol,
              actionType,
              functionName,
              decodedData: decoded
                ? sanitizeForJson({ args: decoded.decodedArgs, events: decoded.decodedEvents })
                : null,
            },
            update: {},
          });
          stored++;
        } catch (err) {
          console.error(`  DB error for ${txHash.slice(0, 12)}...:`, err instanceof Error ? err.message : err);
        }
      }

      if (pageKey) {
        page++;
        console.log(`  ${label}: page ${page} (${transfers.length} more)...`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.includes("No transactions found")) {
        console.error(`  Error fetching ${label} transfers:`, msg);
      }
      break;
    }
  } while (pageKey);

  if (stored > 0 || skipped > 0) {
    console.log(`  ${label}: ${stored} stored, ${skipped} skipped`);
  }

  return { stored, skipped };
}

// -- Run --------------------------------------------------------------------

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
