// ============================================================
// Oeconomia Explorer — API Routes
// ============================================================
// REST endpoints for the explorer frontend:
// - Transaction lookup & search
// - Address / wallet data
// - Block data
// - Protocol-specific dashboards
// - Metrics & analytics
// ============================================================

import { Router, Request, Response } from "express";
import {
  getFullTransaction,
  getBlock,
  getLatestBlockNumber,
  getBalance,
  getTokenBalances,
  getTokenMetadata,
  getAssetTransfers,
} from "../services/alchemy";
import { ProtocolDecoder } from "../services/decoder";
import { buildAddressToProtocolMap, PROTOCOLS, TOKENS } from "../../src/utils/constants";
import { prisma, sanitizeForJson } from "../db";

const router = Router();

// Initialize decoder
const addressMap = buildAddressToProtocolMap();
const decoderMap: Record<string, string> = {};
for (const [addr, protocol] of Object.entries(addressMap)) {
  decoderMap[addr] = protocol;
}
const decoder = new ProtocolDecoder(decoderMap);

// ── Transaction Endpoints ─────────────────────────────────────

/**
 * GET /api/transactions/recent
 * Returns the most recent transactions across all protocols (for Dashboard Live Activity)
 */
router.get("/transactions/recent", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

    const transactions = await prisma.transaction.findMany({
      orderBy: { blockTimestamp: "desc" },
      take: limit,
    });

    res.json(
      transactions.map((tx) => ({
        hash: tx.txHash,
        protocol: tx.protocol,
        action: tx.actionType,
        from: tx.fromAddress,
        value: tx.valueWei.toString(),
        timestamp: tx.blockTimestamp.toISOString(),
      }))
    );
  } catch (error) {
    console.error("[API] Error fetching recent transactions:", error);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});

/**
 * GET /api/tx/:hash
 * Fetch and decode a single transaction
 * Returns consistent field names matching the Prisma schema (txHash, fromAddress, etc.)
 */
router.get("/tx/:hash", async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;

    // Check PostgreSQL cache first
    const cached = await prisma.transaction.findUnique({
      where: { txHash: hash },
      include: { tokenTransfers: true },
    });
    if (cached) {
      res.json({
        txHash: cached.txHash,
        blockNumber: Number(cached.blockNumber),
        blockTimestamp: cached.blockTimestamp.toISOString(),
        fromAddress: cached.fromAddress,
        toAddress: cached.toAddress,
        valueWei: cached.valueWei.toString(),
        gasUsed: cached.gasUsed.toString(),
        gasPrice: cached.gasPrice.toString(),
        status: cached.status,
        protocol: cached.protocol,
        actionType: cached.actionType,
        functionName: cached.functionName || null,
        decodedData: cached.decodedData,
        tokenTransfers: cached.tokenTransfers.map((tt) => ({
          tokenAddress: tt.tokenAddress,
          tokenSymbol: tt.tokenSymbol,
          fromAddress: tt.fromAddress,
          toAddress: tt.toAddress,
          amount: tt.amount.toFixed(0),
          decimals: tt.decimals,
        })),
      });
      return;
    }

    // Fetch from Alchemy
    const fullTx = await getFullTransaction(hash);
    if (!fullTx) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    // Decode if it's an Oeconomia protocol tx
    const decoded = decoder.isOeconomiaContract(fullTx.to)
      ? decoder.decode({
          to: fullTx.to,
          input: fullTx.input,
          value: fullTx.value,
          logs: fullTx.logs,
        })
      : null;

    // Fetch block timestamp
    let blockTimestamp = new Date().toISOString();
    try {
      const block = await getBlock(fullTx.blockNumber);
      if (block) blockTimestamp = new Date(block.timestamp * 1000).toISOString();
    } catch {}

    // Return in the same shape as the cached response
    const sanitizedDecoded = decoded
      ? sanitizeForJson({ args: decoded.decodedArgs, events: decoded.decodedEvents })
      : null;

    res.json({
      txHash: fullTx.hash,
      blockNumber: fullTx.blockNumber,
      blockTimestamp,
      fromAddress: fullTx.from,
      toAddress: fullTx.to,
      valueWei: fullTx.value,
      gasUsed: fullTx.gasUsed,
      gasPrice: fullTx.gasPrice,
      status: fullTx.status,
      protocol: decoded?.protocol || "unknown",
      actionType: decoded?.actionType || "External Transaction",
      functionName: decoded?.functionName || null,
      decodedData: sanitizedDecoded,
      tokenTransfers: [],
    });
  } catch (error) {
    console.error("[API] Error fetching tx:", error);
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

// ── Address / Wallet Endpoints ────────────────────────────────

/**
 * GET /api/address/:address
 * Get wallet overview: ETH balance, token balances, recent activity
 */
router.get("/address/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Fetch data in parallel
    const [ethBalance, tokenBalances, recentTransfers] = await Promise.all([
      getBalance(address),
      getTokenBalances(address),
      getAssetTransfers({ fromAddress: address, maxCount: 20 }),
    ]);

    // Enrich token balances with metadata
    const enrichedTokens = await Promise.all(
      tokenBalances.slice(0, 20).map(async (token) => {
        try {
          const metadata = await getTokenMetadata(token.contractAddress);
          // Check if it's an Oeconomia token
          const oecToken = TOKENS.find(
            (t) => t.address.toLowerCase() === token.contractAddress.toLowerCase()
          );
          return {
            ...token,
            ...metadata,
            isOeconomia: !!oecToken,
            protocol: oecToken?.protocol || null,
          };
        } catch {
          return { ...token, symbol: "???", name: "Unknown", decimals: 18, isOeconomia: false };
        }
      })
    );

    // Check for Oeconomia protocol positions from DB
    const walletPositions = await prisma.walletPosition.findMany({
      where: { walletAddress: address.toLowerCase() },
    });

    const protocolPositions: Record<string, unknown> = {
      oeconomia: { isGuardian: false, stakedOEC: "0" },
      alluria: { hasVault: false, collateral: "0", debt: "0" },
      eloqura: { lpPositions: [] },
      artivya: { openOrders: [] },
      iridescia: { deployedContracts: [] },
    };

    // Overlay any stored positions
    for (const pos of walletPositions) {
      protocolPositions[pos.protocol] = {
        ...((protocolPositions[pos.protocol] as object) || {}),
        ...(pos.positionData as object),
        positionType: pos.positionType,
      };
    }

    res.json({
      address,
      ethBalance,
      tokens: enrichedTokens,
      recentTransfers: recentTransfers.transfers,
      protocolPositions,
    });
  } catch (error) {
    console.error("[API] Error fetching address:", error);
    res.status(500).json({ error: "Failed to fetch address data" });
  }
});

/**
 * GET /api/address/:address/transactions
 * Paginated transaction history for a wallet
 */
router.get("/address/:address/transactions", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const { pageKey, direction = "from" } = req.query;

    const transfers = await getAssetTransfers({
      ...(direction === "from" ? { fromAddress: address } : { toAddress: address }),
      maxCount: 50,
      pageKey: pageKey as string | undefined,
    });

    res.json(transfers);
  } catch (error) {
    console.error("[API] Error fetching address txs:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// ── Block Endpoints ───────────────────────────────────────────

/**
 * GET /api/block/latest
 * Get latest block number
 */
router.get("/block/latest", async (_req: Request, res: Response) => {
  try {
    const blockNumber = await getLatestBlockNumber();
    res.json({ blockNumber });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch latest block" });
  }
});

/**
 * GET /api/block/:numberOrHash
 * Get block details
 */
router.get("/block/:numberOrHash", async (req: Request, res: Response) => {
  try {
    const { numberOrHash } = req.params;
    const blockId = numberOrHash.startsWith("0x")
      ? numberOrHash
      : parseInt(numberOrHash, 10);

    const block = await getBlock(blockId);
    if (!block) {
      res.status(404).json({ error: "Block not found" });
      return;
    }

    res.json(block);
  } catch (error) {
    console.error("[API] Error fetching block:", error);
    res.status(500).json({ error: "Failed to fetch block" });
  }
});

// ── Protocol Dashboard Endpoints ──────────────────────────────

/**
 * GET /api/protocol/:protocolId/stats
 * Get aggregate stats for a specific protocol
 */
router.get("/protocol/:protocolId/stats", async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;

    if (!PROTOCOLS[protocolId as keyof typeof PROTOCOLS]) {
      res.status(404).json({ error: "Protocol not found" });
      return;
    }

    // Fetch real stats from DB
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [totalTransactions, recentTxs, uniqueUsersResult] = await Promise.all([
      prisma.transaction.count({ where: { protocol: protocolId } }),
      prisma.transaction.count({
        where: { protocol: protocolId, blockTimestamp: { gte: oneDayAgo } },
      }),
      prisma.transaction.groupBy({
        by: ["fromAddress"],
        where: { protocol: protocolId, blockTimestamp: { gte: oneDayAgo } },
      }),
    ]);

    // Check for stored metrics (TVL, volume)
    const latestMetrics = await prisma.protocolMetric.findMany({
      where: { protocol: protocolId },
      orderBy: { timestamp: "desc" },
      distinct: ["metricName"],
      take: 10,
    });

    const metricsMap: Record<string, string> = {};
    for (const m of latestMetrics) {
      metricsMap[m.metricName] = m.metricValue.toString();
    }

    const stats = {
      protocol: protocolId,
      tvl: metricsMap["tvl"] || "0",
      dailyVolume: metricsMap["daily_volume"] || "0",
      totalTransactions,
      transactions24h: recentTxs,
      uniqueUsers24h: uniqueUsersResult.length,
      lastUpdated: now.toISOString(),
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch protocol stats" });
  }
});

/**
 * GET /api/protocol/:protocolId/transactions
 * Get recent transactions for a specific protocol
 */
router.get("/protocol/:protocolId/transactions", async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { limit = "50", offset = "0" } = req.query;

    const take = Math.min(parseInt(limit as string, 10) || 50, 200);
    const skip = parseInt(offset as string, 10) || 0;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { protocol: protocolId },
        orderBy: { blockTimestamp: "desc" },
        take,
        skip,
      }),
      prisma.transaction.count({ where: { protocol: protocolId } }),
    ]);

    res.json({
      protocol: protocolId,
      transactions: transactions.map((tx) => ({
        txHash: tx.txHash,
        blockNumber: Number(tx.blockNumber),
        blockTimestamp: tx.blockTimestamp.toISOString(),
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        valueWei: tx.valueWei.toString(),
        gasUsed: tx.gasUsed.toString(),
        gasPrice: tx.gasPrice.toString(),
        status: tx.status,
        protocol: tx.protocol,
        actionType: tx.actionType,
        functionName: tx.functionName,
        decodedData: tx.decodedData,
      })),
      total,
      limit: take,
      offset: skip,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch protocol transactions" });
  }
});

// ── Search Endpoint ───────────────────────────────────────────

/**
 * GET /api/search?q=...
 * Universal search: detects if query is a tx hash, address, block number, or token
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") {
      res.status(400).json({ error: "Query parameter 'q' is required" });
      return;
    }

    const query = q.trim();

    // Detect query type
    if (/^0x[a-fA-F0-9]{64}$/.test(query)) {
      // Transaction hash
      res.json({ type: "tx", value: query, redirect: `/tx/${query}` });
    } else if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
      // Address
      res.json({ type: "address", value: query, redirect: `/address/${query}` });
    } else if (/^\d+$/.test(query)) {
      // Block number
      res.json({ type: "block", value: query, redirect: `/block/${query}` });
    } else {
      // Try to match token symbol
      const token = TOKENS.find(
        (t) => t.symbol.toLowerCase() === query.toLowerCase()
      );
      if (token) {
        res.json({ type: "token", value: token.address, redirect: `/tokens/${token.address}` });
      } else {
        res.json({ type: "unknown", value: query, redirect: null });
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Search failed" });
  }
});

// ── Token Endpoints ───────────────────────────────────────────

/**
 * GET /api/tokens
 * List all tracked Oeconomia tokens
 */
router.get("/tokens", (_req: Request, res: Response) => {
  res.json(TOKENS);
});

/**
 * GET /api/tokens/:address
 * Get token details
 */
router.get("/tokens/:address", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const metadata = await getTokenMetadata(address);
    const oecToken = TOKENS.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );

    res.json({
      address,
      ...metadata,
      isOeconomia: !!oecToken,
      protocol: oecToken?.protocol || null,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token details" });
  }
});

// ── Overview / Dashboard ──────────────────────────────────────

/**
 * GET /api/overview
 * Dashboard data: latest block, protocol summaries, recent activity
 */
router.get("/overview", async (_req: Request, res: Response) => {
  try {
    const latestBlock = await getLatestBlockNumber();

    res.json({
      latestBlock,
      protocols: Object.entries(PROTOCOLS).map(([id, config]) => ({
        id,
        name: config.name,
        shortName: config.shortName,
        color: config.color,
        icon: config.icon,
        contractCount: Object.keys(config.contracts).length,
      })),
      tokens: TOKENS.map((t) => ({
        symbol: t.symbol,
        name: t.name,
        address: t.address,
        protocol: t.protocol,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch overview" });
  }
});

export default router;
