// ============================================================
// Oeconomia Explorer — Webhook Handler
// ============================================================
// Receives real-time events from Alchemy Notify webhooks,
// decodes them via the ProtocolDecoder, stores in DB,
// and broadcasts to connected WebSocket clients.
// ============================================================

import { Router, Request, Response } from "express";
import { ProtocolDecoder } from "../services/decoder";
import { getFullTransaction, getBlock } from "../services/alchemy";
import { buildAddressToProtocolMap } from "../../src/utils/constants";
import { prisma, sanitizeForJson } from "../db";
import { refreshBalancesForTransfer, TRANSFER_TOPIC } from "../services/balances";

const router = Router();

// Initialize decoder with contract address map
const addressMap = buildAddressToProtocolMap();

// Convert to the format the decoder expects: { address: protocol }
const decoderMap: Record<string, string> = {};
for (const [addr, protocol] of Object.entries(addressMap)) {
  decoderMap[addr] = protocol;
}

const decoder = new ProtocolDecoder(decoderMap);

// Store reference to WebSocket broadcast function (injected from server)
let broadcastFn: ((event: string, data: unknown) => void) | null = null;

export function setWebSocketBroadcast(fn: (event: string, data: unknown) => void) {
  broadcastFn = fn;
}

// -- Webhook Endpoint -------------------------------------------------------

/**
 * POST /api/webhooks/alchemy
 *
 * Alchemy sends webhook payloads here when events match
 * the configured filters (our protocol contract addresses).
 *
 * Payload structure (Address Activity):
 * {
 *   webhookId: "...",
 *   id: "...",
 *   createdAt: "...",
 *   type: "ADDRESS_ACTIVITY",
 *   event: {
 *     network: "ETH_MAINNET",
 *     activity: [
 *       {
 *         fromAddress: "0x...",
 *         toAddress: "0x...",
 *         hash: "0x...",
 *         value: 0.5,
 *         asset: "ETH",
 *         category: "external",
 *         ...
 *       }
 *     ]
 *   }
 * }
 */
router.post("/alchemy", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // Validate it's from Alchemy (in production, verify the signing key)
    if (!payload || !payload.event) {
      res.status(400).json({ error: "Invalid webhook payload" });
      return;
    }

    const activities = payload.event?.activity || [];

    for (const activity of activities) {
      const txHash = activity.hash;
      if (!txHash) continue;

      // Fetch full transaction data from Alchemy
      const fullTx = await getFullTransaction(txHash);
      if (!fullTx) continue;

      // Check if this involves an Oeconomia protocol contract
      if (!decoder.isOeconomiaContract(fullTx.to)) continue;

      // Decode the transaction
      const decoded = decoder.decode({
        to: fullTx.to,
        input: fullTx.input,
        value: fullTx.value,
        logs: fullTx.logs,
      });

      // Build the record for storage
      const txRecord = {
        txHash: fullTx.hash,
        blockNumber: fullTx.blockNumber,
        fromAddress: fullTx.from,
        toAddress: fullTx.to,
        valueWei: fullTx.value,
        gasUsed: fullTx.gasUsed,
        gasPrice: fullTx.gasPrice,
        status: fullTx.status,
        protocol: decoded.protocol,
        actionType: decoded.actionType,
        functionName: decoded.functionName,
        decodedArgs: decoded.decodedArgs,
        decodedEvents: decoded.decodedEvents,
        timestamp: new Date(),
      };

      // Store in PostgreSQL via Prisma
      try {
        const block = await getBlock(fullTx.blockNumber);
        const blockTimestamp = block
          ? new Date(block.timestamp * 1000)
          : new Date();

        await prisma.transaction.upsert({
          where: { txHash: fullTx.hash },
          create: {
            txHash: fullTx.hash,
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
      } catch (dbErr) {
        console.error("[Webhook] DB write error:", dbErr instanceof Error ? dbErr.message : dbErr);
      }

      // Update token balance cache for Transfer events
      for (const log of fullTx.logs) {
        if (log.topics[0] === TRANSFER_TOPIC && log.topics.length >= 3) {
          const tokenAddr = log.address.toLowerCase();
          const from = "0x" + log.topics[1].slice(26);
          const to = "0x" + log.topics[2].slice(26);
          refreshBalancesForTransfer(tokenAddr, from, to).catch((err) => {
            console.error("[Webhook] Balance refresh error:", err instanceof Error ? err.message : err);
          });
        }
      }

      console.log(
        `[Webhook] ${decoded.protocol.toUpperCase()} | ${decoded.actionType} | ${txHash.slice(0, 12)}...`
      );

      // Broadcast to connected WebSocket clients
      if (broadcastFn) {
        broadcastFn("new_transaction", {
          ...txRecord,
          // Include a simplified version for the live feed
          summary: {
            hash: fullTx.hash,
            protocol: decoded.protocol,
            action: decoded.actionType,
            from: fullTx.from,
            to: fullTx.to || "",
            value: fullTx.value,
            timestamp: new Date().toISOString(),
          },
        });
      }
    }

    // Always respond 200 to Alchemy quickly
    res.status(200).json({ received: true, processed: activities.length });
  } catch (error) {
    console.error("[Webhook] Error processing:", error);
    // Still return 200 so Alchemy doesn't retry excessively
    res.status(200).json({ received: true, error: "Processing error" });
  }
});

// -- Health Check -----------------------------------------------------------

router.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", decoder: "active", protocols: Object.keys(addressMap).length });
});

export default router;
