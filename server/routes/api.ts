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
import {
  buildAddressToProtocolMap,
  getAllContractAddresses,
  SHARED_CONTRACTS,
  PROTOCOLS,
  TOKENS,
} from "../../src/utils/constants";
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
        to: tx.toAddress || "",
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
    const addrLower = address.toLowerCase();
    const [ethBalance, tokenBalances, recentTransfers, indexedTransactions] = await Promise.all([
      getBalance(address),
      getTokenBalances(address),
      getAssetTransfers({ fromAddress: address, maxCount: 20 }),
      prisma.transaction.findMany({
        where: {
          OR: [
            { fromAddress: addrLower },
            { toAddress: addrLower },
          ],
        },
        orderBy: { blockTimestamp: "desc" },
        take: 50,
        include: { tokenTransfers: true },
      }),
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
      transactions: indexedTransactions.map((tx) => ({
        txHash: tx.txHash,
        blockNumber: Number(tx.blockNumber),
        blockTimestamp: tx.blockTimestamp.toISOString(),
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        valueWei: tx.valueWei.toString(),
        gasUsed: tx.gasUsed.toString(),
        status: tx.status,
        protocol: tx.protocol,
        actionType: tx.actionType,
        functionName: tx.functionName,
        tokenTransfers: tx.tokenTransfers.map((tt) => ({
          tokenAddress: tt.tokenAddress,
          tokenSymbol: tt.tokenSymbol,
          amount: tt.amount.toFixed(0),
          decimals: tt.decimals,
        })),
      })),
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

// ── Site-Triggered Transaction Tracking ──────────────────────

/**
 * POST /api/track-tx
 * Called by Oeconomia sites (Eloqura, staking dapp, etc.) when a user
 * performs a transaction. Fetches, decodes, and stores the transaction.
 * This is how transactions on shared/public contracts (e.g., Uniswap V3)
 * get indexed — only when initiated from an Oeconomia site.
 */
router.post("/track-tx", async (req: Request, res: Response) => {
  try {
    const { txHash } = req.body;

    if (!txHash || typeof txHash !== "string" || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      res.status(400).json({ error: "Valid txHash is required" });
      return;
    }

    // Already tracked?
    const existing = await prisma.transaction.findUnique({ where: { txHash } });
    if (existing) {
      res.json({ status: "already_tracked", txHash, protocol: existing.protocol, actionType: existing.actionType });
      return;
    }

    // Fetch from Alchemy
    const fullTx = await getFullTransaction(txHash);
    if (!fullTx) {
      res.status(404).json({ error: "Transaction not found on chain" });
      return;
    }

    const toAddr = fullTx.to.toLowerCase();
    const inputData = fullTx.input || "";

    // Build full contract set (including shared) for protocol lookup
    const allContracts = new Set(
      getAllContractAddresses()
        .filter((a) => !a.startsWith("0x000000000000000000000000000000000000"))
        .map((a) => a.toLowerCase())
    );

    let protocol: string | null = null;
    let actionType: string | null = null;
    let functionName: string | null = null;
    let decodedData: unknown = null;
    let decodedEvents: Array<{ name: string; args: Record<string, unknown> }> = [];

    // Case 1: Direct call to a tracked contract (exclusive or shared)
    if (allContracts.has(toAddr)) {
      const decoded = decoder.decode({
        to: fullTx.to,
        input: fullTx.input,
        value: fullTx.value,
        logs: fullTx.logs,
      });
      protocol = decoded.protocol;
      actionType = decoded.actionType;
      functionName = decoded.functionName || null;
      decodedData = sanitizeForJson({ args: decoded.decodedArgs, events: decoded.decodedEvents });
      decodedEvents = decoded.decodedEvents;
    }
    // Case 2: Token approve where spender is our contract
    else if (inputData.startsWith("0x095ea7b3") && inputData.length >= 74) {
      const spenderAddr = "0x" + inputData.slice(34, 74).slice(-40).toLowerCase();
      if (allContracts.has(spenderAddr)) {
        protocol = addressMap[spenderAddr] || "eloqura";
        actionType = "Token Approval";
        functionName = "approve";
        decodedData = sanitizeForJson({ args: { spender: spenderAddr, tokenContract: toAddr }, events: [] });
      }
    }

    if (!protocol) {
      // Still store it with a generic label — the user explicitly tracked it from a site
      protocol = "eloqura"; // default for site-triggered
      actionType = "Site Transaction";
      functionName = null;
      decodedData = null;
    }

    // Get block timestamp
    let blockTimestamp = new Date();
    try {
      const block = await getBlock(fullTx.blockNumber);
      if (block) blockTimestamp = new Date(block.timestamp * 1000);
    } catch {}

    // Store
    await prisma.transaction.upsert({
      where: { txHash },
      create: {
        txHash,
        blockNumber: BigInt(fullTx.blockNumber),
        blockTimestamp,
        fromAddress: fullTx.from.toLowerCase(),
        toAddress: toAddr,
        valueWei: fullTx.value,
        gasUsed: BigInt(fullTx.gasUsed),
        gasPrice: fullTx.gasPrice,
        status: fullTx.status,
        protocol,
        actionType,
        functionName,
        decodedData: decodedData as any,
      },
      update: {},
    });

    // Store token transfers if we have decoded events
    if (decodedEvents.length > 0 && fullTx.logs) {
      // Inline token transfer storage
      let logIndex = 0;
      for (const event of decodedEvents) {
        if (event.name !== "Transfer") { logIndex++; continue; }
        const fromAddr = String(event.args.from || "").toLowerCase();
        const evtToAddr = String(event.args.to || "").toLowerCase();
        const value = String(event.args.value || "0");
        let tokenAddress = "";
        for (let i = logIndex; i < fullTx.logs.length; i++) {
          if (fullTx.logs[i].topics[0] === "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef") {
            tokenAddress = fullTx.logs[i].address.toLowerCase();
            logIndex = i + 1;
            break;
          }
        }
        if (!tokenAddress) continue;
        const token = TOKENS.find((t) => t.address.toLowerCase() === tokenAddress);
        try {
          await prisma.tokenTransfer.create({
            data: {
              txHash,
              tokenAddress,
              tokenSymbol: token?.symbol || null,
              fromAddress: fromAddr,
              toAddress: evtToAddr,
              amount: value,
              decimals: token?.decimals || null,
            },
          });
        } catch { /* skip duplicates */ }
      }
    }

    console.log(`[API] Tracked tx ${txHash.slice(0, 12)}... as ${protocol}/${actionType}`);
    res.json({ status: "tracked", txHash, protocol, actionType });
  } catch (error) {
    console.error("[API] Error tracking tx:", error);
    res.status(500).json({ error: "Failed to track transaction" });
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

// ── Aggregate Statistics ─────────────────────────────────────

/**
 * GET /api/stats
 * Aggregate statistics for the Statistics page
 */
router.get("/stats", async (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total counts
    const [totalTransactions, txLast24h, txLast7d, uniqueUsersAll, uniqueUsers24h] = await Promise.all([
      prisma.transaction.count(),
      prisma.transaction.count({ where: { blockTimestamp: { gte: oneDayAgo } } }),
      prisma.transaction.count({ where: { blockTimestamp: { gte: sevenDaysAgo } } }),
      prisma.transaction.groupBy({ by: ["fromAddress"] }),
      prisma.transaction.groupBy({ by: ["fromAddress"], where: { blockTimestamp: { gte: oneDayAgo } } }),
    ]);

    // Per-protocol breakdown
    const protocolBreakdown = await Promise.all(
      Object.keys(PROTOCOLS).map(async (protocolId) => {
        const count = await prisma.transaction.count({ where: { protocol: protocolId } });
        const recent = await prisma.transaction.count({ where: { protocol: protocolId, blockTimestamp: { gte: oneDayAgo } } });
        return { protocol: protocolId, total: count, last24h: recent };
      })
    );

    // Daily transaction counts for last 7 days
    const dailyCounts: { date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now);
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = await prisma.transaction.count({
        where: { blockTimestamp: { gte: dayStart, lt: dayEnd } },
      });
      dailyCounts.push({
        date: dayStart.toISOString().split("T")[0],
        count,
      });
    }

    // Most active protocol
    const mostActive = protocolBreakdown.reduce((a, b) => (a.total > b.total ? a : b));

    res.json({
      totalTransactions,
      txLast24h,
      txLast7d,
      uniqueUsersTotal: uniqueUsersAll.length,
      uniqueUsers24h: uniqueUsers24h.length,
      protocolBreakdown,
      dailyCounts,
      mostActiveProtocol: mostActive.protocol,
    });
  } catch (error) {
    console.error("[API] Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

export default router;
