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
import { ethers } from "ethers";
import {
  getFullTransaction,
  getBlock,
  getLatestBlockNumber,
  getBalance,
  getTokenBalances,
  getCachedTokenMetadata,
  getAssetTransfers,
  getLogs,
  isContract,
} from "../services/alchemy";
import { AssetTransfersCategory } from "alchemy-sdk";
import { ProtocolDecoder } from "../services/decoder";
import {
  buildAddressToProtocolMap,
  getAllContractAddresses,
  SHARED_CONTRACTS,
  PROTOCOLS,
  TOKENS,
} from "../../src/utils/constants";
import { prisma, sanitizeForJson } from "../db";
import { getHoldersFromCache, seedBalancesForToken } from "../services/balances";

const router = Router();

// Initialize decoder
const addressMap = buildAddressToProtocolMap();
const decoderMap: Record<string, string> = {};
for (const [addr, protocol] of Object.entries(addressMap)) {
  decoderMap[addr] = protocol;
}
const decoder = new ProtocolDecoder(decoderMap);

// ── In-memory Cache (reduces Alchemy CU usage) ───────────────

const apiCache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ── Token Price Fetching (Uniswap V3 Quoter + Eloqura DEX) ───
// Same 3-tier approach used by the DAO Hub and Eloqura Swap:
// 1. Direct token → USDC via Uniswap V3 QuoterV2
// 2. Token → WETH → USDC multi-hop
// 3. Eloqura DEX pool reserves fallback

const UNISWAP_QUOTER_V2 = "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3";
const UNISWAP_WETH = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14";
const USDC_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const ELOQURA_FACTORY = "0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e";
const FEE_TIERS = [3000, 500, 10000]; // 0.3%, 0.05%, 1%

const QUOTER_ABI = [
  "function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96)) external returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)",
];
const FACTORY_ABI = [
  "function getPair(address, address) external view returns (address)",
];
const PAIR_ABI = [
  "function token0() external view returns (address)",
  "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
];

// Tokens to price (address → { symbol, decimals })
const PRICE_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238": { symbol: "USDC", decimals: 6 },
  "0x779877a7b0d9e8603169ddbd7836e478b4624789": { symbol: "LINK", decimals: 18 },
  "0xfff9976782d46cc05630d1f6ebab18b2324d6b14": { symbol: "WETH", decimals: 18 },
  "0x34b11f6b8f78fa010bbca71bc7fe79daa811b89f": { symbol: "WETH", decimals: 18 },
  "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba": { symbol: "OEC", decimals: 18 },
  "0x4feb15d0644e5c7bb64dcd85744f0f2ab5f7a253": { symbol: "ELOQ", decimals: 18 },
};

const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getTokenPrices(extraTokens?: Array<{ address: string; decimals: number }>): Promise<Record<string, number>> {
  const cacheKey = "token-prices";
  const cached = getCached<Record<string, number>>(cacheKey);
  if (cached) return cached;

  const prices: Record<string, number> = {};

  try {
    const rpcUrl = `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY || ""}`;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const quoter = new ethers.Contract(UNISWAP_QUOTER_V2, QUOTER_ABI, provider);

    // USDC = $1
    prices["0x1c7d4b196cb0c7b01d743fbc6116a902379c7238"] = 1;

    // Price ETH/WETH first (needed for multi-hop)
    let ethPrice = 0;
    for (const fee of FEE_TIERS) {
      try {
        const result = await quoter.quoteExactInputSingle.staticCall({
          tokenIn: UNISWAP_WETH,
          tokenOut: USDC_ADDRESS,
          amountIn: ethers.parseUnits("1", 18),
          fee,
          sqrtPriceLimitX96: 0n,
        });
        const usdPrice = parseFloat(ethers.formatUnits(result.amountOut, 6));
        if (usdPrice > 0) { ethPrice = usdPrice; break; }
      } catch { continue; }
    }

    if (ethPrice > 0) {
      prices["__eth__"] = ethPrice;
      prices["0xfff9976782d46cc05630d1f6ebab18b2324d6b14"] = ethPrice;
      prices["0x34b11f6b8f78fa010bbca71bc7fe79daa811b89f"] = ethPrice;
    }

    // Merge predefined + extra wallet tokens for pricing
    const allTokensToPrice: Record<string, { symbol: string; decimals: number }> = { ...PRICE_TOKENS };
    if (extraTokens) {
      for (const t of extraTokens) {
        const a = t.address.toLowerCase();
        if (!allTokensToPrice[a]) allTokensToPrice[a] = { symbol: "?", decimals: t.decimals };
      }
    }

    // Price remaining tokens
    for (const [addr, token] of Object.entries(allTokensToPrice)) {
      if (prices[addr] != null) continue; // already priced
      if (token.symbol === "USDC") continue;

      const quoterAddr = addr as string;
      let priceFound = false;

      // Tier 1: Direct token → USDC
      for (const fee of FEE_TIERS) {
        try {
          const result = await quoter.quoteExactInputSingle.staticCall({
            tokenIn: quoterAddr,
            tokenOut: USDC_ADDRESS,
            amountIn: ethers.parseUnits("1", token.decimals),
            fee,
            sqrtPriceLimitX96: 0n,
          });
          const usdPrice = parseFloat(ethers.formatUnits(result.amountOut, 6));
          if (usdPrice > 0) { prices[addr] = usdPrice; priceFound = true; break; }
        } catch { continue; }
      }

      // Tier 2: Token → WETH → USDC
      if (!priceFound && ethPrice > 0) {
        for (const fee of FEE_TIERS) {
          try {
            const result = await quoter.quoteExactInputSingle.staticCall({
              tokenIn: quoterAddr,
              tokenOut: UNISWAP_WETH,
              amountIn: ethers.parseUnits("1", token.decimals),
              fee,
              sqrtPriceLimitX96: 0n,
            });
            const wethAmount = parseFloat(ethers.formatUnits(result.amountOut, 18));
            if (wethAmount > 0) { prices[addr] = wethAmount * ethPrice; priceFound = true; break; }
          } catch { continue; }
        }
      }

      // Tier 3: Eloqura DEX pool reserves
      if (!priceFound) {
        try {
          const factory = new ethers.Contract(ELOQURA_FACTORY, FACTORY_ABI, provider);
          const pairAddress = await factory.getPair(addr, USDC_ADDRESS);
          if (pairAddress && pairAddress !== ethers.ZeroAddress) {
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            const [reserves, token0] = await Promise.all([
              pair.getReserves(),
              pair.token0(),
            ]);
            const isToken0 = token0.toLowerCase() === addr;
            const tokenReserve = parseFloat(ethers.formatUnits(isToken0 ? reserves[0] : reserves[1], token.decimals));
            const usdcReserve = parseFloat(ethers.formatUnits(isToken0 ? reserves[1] : reserves[0], 6));
            if (tokenReserve > 0) { prices[addr] = usdcReserve / tokenReserve; priceFound = true; }
          }
        } catch { /* no Eloqura pair */ }
      }

      // Tier 3b: Eloqura DEX via WETH pair
      if (!priceFound && ethPrice > 0) {
        try {
          const eloquraWeth = "0x34b11F6b8f78fa010bBCA71bC7FE79dAa811b89f";
          const factory = new ethers.Contract(ELOQURA_FACTORY, FACTORY_ABI, provider);
          const pairAddress = await factory.getPair(addr, eloquraWeth);
          if (pairAddress && pairAddress !== ethers.ZeroAddress) {
            const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
            const [reserves, token0] = await Promise.all([
              pair.getReserves(),
              pair.token0(),
            ]);
            const isToken0 = token0.toLowerCase() === addr;
            const tokenReserve = parseFloat(ethers.formatUnits(isToken0 ? reserves[0] : reserves[1], token.decimals));
            const wethReserve = parseFloat(ethers.formatUnits(isToken0 ? reserves[1] : reserves[0], 18));
            if (tokenReserve > 0) { prices[addr] = (wethReserve / tokenReserve) * ethPrice; }
          }
        } catch { /* no Eloqura WETH pair */ }
      }
    }

    setCache("token-prices", prices, PRICE_CACHE_TTL);
  } catch (err) {
    console.error("[API] Token price fetch failed:", err instanceof Error ? err.message : err);
  }

  return prices;
}

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttl = CACHE_TTL) {
  apiCache.set(key, { data, expiresAt: Date.now() + ttl });
}

// ── Transaction Endpoints ─────────────────────────────────────

/**
 * GET /api/transactions/recent
 * Returns the most recent transactions across all protocols (for Dashboard Live Activity)
 */
router.get("/transactions/recent", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 25, 100);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        orderBy: { blockTimestamp: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.transaction.count(),
    ]);

    res.json({
      transactions: transactions.map((tx) => ({
        hash: tx.txHash,
        protocol: tx.protocol,
        action: tx.actionType,
        from: tx.fromAddress,
        to: tx.toAddress || "",
        value: tx.valueWei.toString(),
        timestamp: tx.blockTimestamp.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("[API] Error fetching recent transactions:", error);
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});

/** Resolve token symbol + decimals from known tokens list */
function resolveTokenSymbol(contractAddress: string): { symbol: string | null; decimals: number | null } {
  const token = TOKENS.find(
    (t) => t.address.toLowerCase() === contractAddress.toLowerCase()
  );
  return token ? { symbol: token.symbol, decimals: token.decimals } : { symbol: null, decimals: null };
}

/** Transfer topic0 = keccak256("Transfer(address,address,uint256)") */
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

/**
 * Build tokenTransfers from raw receipt logs by matching Transfer events
 * with their emitting contract address. Used to auto-repair cached txs
 * that are missing tokenTransfers.
 */
function buildTokenTransfersFromLogs(
  logs: Array<{ address: string; topics: string[]; data: string }>
): Array<{ tokenAddress: string; tokenSymbol: string | null; fromAddress: string; toAddress: string; amount: string; decimals: number | null }> {
  const transfers: Array<{ tokenAddress: string; tokenSymbol: string | null; fromAddress: string; toAddress: string; amount: string; decimals: number | null }> = [];
  for (const log of logs) {
    if (log.topics[0] !== TRANSFER_TOPIC || log.topics.length < 3) continue;
    const tokenAddress = log.address.toLowerCase();
    const fromAddress = "0x" + (log.topics[1] || "").slice(26).toLowerCase();
    const toAddress = "0x" + (log.topics[2] || "").slice(26).toLowerCase();
    const amount = log.data === "0x" ? "0" : BigInt(log.data).toString();
    const { symbol, decimals } = resolveTokenSymbol(tokenAddress);
    transfers.push({ tokenAddress, tokenSymbol: symbol, fromAddress, toAddress, amount, decimals });
  }
  return transfers;
}

/**
 * GET /api/tx/:hash
 * Fetch and decode a single transaction
 * Returns consistent field names matching the Prisma schema (txHash, fromAddress, etc.)
 * Auto-repairs missing tokenTransfers and incorrect valueWei from chain data.
 */
router.get("/tx/:hash", async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;

    // Check PostgreSQL cache first
    const cached = await prisma.transaction.findUnique({
      where: { txHash: hash as string },
      include: { tokenTransfers: true },
    });
    if (cached) {
      let tokenTransfers = cached.tokenTransfers.map((tt) => ({
        tokenAddress: tt.tokenAddress,
        tokenSymbol: tt.tokenSymbol,
        fromAddress: tt.fromAddress,
        toAddress: tt.toAddress,
        amount: tt.amount.toFixed(0),
        decimals: tt.decimals,
      }));
      let valueWei = cached.valueWei.toString();

      // Auto-repair: if tokenTransfers is empty or valueWei looks wrong, re-fetch from chain
      const decodedData = cached.decodedData as any;
      const hasDecodedTransfers = decodedData?.events?.some?.((e: any) => e.name === "Transfer");
      const needsRepair = (tokenTransfers.length === 0 && hasDecodedTransfers) || valueWei === "0";

      if (needsRepair) {
        try {
          const fullTx = await getFullTransaction(hash as string);
          if (fullTx) {
            // Repair tokenTransfers from raw receipt logs
            if (tokenTransfers.length === 0 && fullTx.logs) {
              tokenTransfers = buildTokenTransfersFromLogs(fullTx.logs);
              // Persist repaired tokenTransfers to DB for future requests
              for (const tt of tokenTransfers) {
                try {
                  await prisma.tokenTransfer.create({
                    data: {
                      txHash: cached.txHash,
                      tokenAddress: tt.tokenAddress,
                      tokenSymbol: tt.tokenSymbol,
                      fromAddress: tt.fromAddress,
                      toAddress: tt.toAddress,
                      amount: tt.amount,
                      decimals: tt.decimals,
                    },
                  });
                } catch {} // skip duplicates
              }
            }
            // Repair valueWei if stored as "0" but chain says otherwise
            if (valueWei === "0" && fullTx.value && fullTx.value !== "0") {
              valueWei = fullTx.value;
              try {
                await prisma.transaction.update({
                  where: { txHash: cached.txHash },
                  data: { valueWei: fullTx.value },
                });
              } catch {}
            }
          }
        } catch (repairErr) {
          console.error(`[API] Auto-repair failed for tx ${hash}:`, repairErr);
        }
      }

      res.json({
        txHash: cached.txHash,
        blockNumber: Number(cached.blockNumber),
        blockTimestamp: cached.blockTimestamp.toISOString(),
        fromAddress: cached.fromAddress,
        toAddress: cached.toAddress,
        valueWei,
        gasUsed: cached.gasUsed.toString(),
        gasPrice: cached.gasPrice.toString(),
        status: cached.status,
        protocol: cached.protocol,
        actionType: cached.actionType,
        functionName: cached.functionName || null,
        decodedData: cached.decodedData,
        tokenTransfers,
      });
      return;
    }

    // Fetch from Alchemy
    const fullTx = await getFullTransaction(hash as string);
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

    // Build tokenTransfers from raw receipt logs
    const tokenTransfers = buildTokenTransfersFromLogs(fullTx.logs);

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
      tokenTransfers,
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
    const txLimit = Math.min(parseInt(req.query.txLimit as string, 10) || 25, 100);
    const txOffset = parseInt(req.query.txOffset as string, 10) || 0;

    const txWhere = {
      OR: [
        { fromAddress: addrLower },
        { toAddress: addrLower },
      ],
    };

    const [ethBalance, tokenBalances, recentTransfers, indexedTransactions, txTotal] = await Promise.all([
      getBalance(address),
      getTokenBalances(address),
      getAssetTransfers({ fromAddress: address, maxCount: 20 }),
      prisma.transaction.findMany({
        where: txWhere,
        orderBy: { blockTimestamp: "desc" },
        take: txLimit,
        skip: txOffset,
        include: { tokenTransfers: true },
      }),
      prisma.transaction.count({ where: txWhere }),
    ]);

    // Resolve metadata first so we know decimals for pricing
    const tokenMetas = await Promise.all(
      tokenBalances.slice(0, 20).map(async (token) => {
        try {
          const metadata = await getCachedTokenMetadata(token.contractAddress);
          const oecToken = TOKENS.find(
            (t) => t.address.toLowerCase() === token.contractAddress.toLowerCase()
          );
          return { token, metadata, oecToken, decimals: metadata.decimals ?? oecToken?.decimals ?? 18 };
        } catch {
          return { token, metadata: { symbol: "???", name: "Unknown", decimals: 18 } as any, oecToken: undefined, decimals: 18 };
        }
      })
    );

    // Fetch prices — pass wallet tokens so unknown tokens also get priced
    const extraTokens = tokenMetas.map((m) => ({
      address: m.token.contractAddress,
      decimals: m.decimals,
    }));
    const tokenPrices = await getTokenPrices(extraTokens);

    // Enrich token balances with metadata + USD prices
    const enrichedTokens = tokenMetas.map(({ token, metadata, oecToken, decimals }) => {
      const priceUsd = tokenPrices[token.contractAddress.toLowerCase()] ?? null;
      let valueUsd: number | null = null;
      if (priceUsd != null && token.balance) {
        const bal = Number(BigInt(token.balance)) / Math.pow(10, decimals);
        valueUsd = bal * priceUsd;
      }
      return {
        ...token,
        ...metadata,
        isOeconomia: !!oecToken,
        protocol: oecToken?.protocol || null,
        priceUsd,
        valueUsd,
      };
    });

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
      txTotal,
      txLimit,
      txOffset,
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
        res.json({ type: "token", value: token.address, redirect: `/token/${token.address}` });
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
    const cacheKey = `token:${address.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const metadata = await getCachedTokenMetadata(address);
    const oecToken = TOKENS.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );

    // Fetch transfers via Alchemy getAssetTransfers (covers full history)
    const [alchemyTransfers, uniqueAddresses] = await Promise.all([
      getAssetTransfers({
        contractAddresses: [address],
        category: [AssetTransfersCategory.ERC20],
        maxCount: 50,
      }),
      prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(DISTINCT addr) as count FROM (
          SELECT from_address as addr FROM token_transfers WHERE LOWER(token_address) = LOWER(${address})
          UNION
          SELECT to_address as addr FROM token_transfers WHERE LOWER(token_address) = LOWER(${address})
        ) AS addrs
      `,
    ]);

    // Look up decoded actions from indexed DB transactions
    const txHashes = alchemyTransfers.transfers.map((t: any) => t.hash as string);
    const indexedTxs = txHashes.length > 0
      ? await prisma.transaction.findMany({
          where: { txHash: { in: txHashes } },
          select: { txHash: true, actionType: true },
        })
      : [];
    const actionMap = new Map(indexedTxs.map((t) => [t.txHash.toLowerCase(), t.actionType]));

    const ZERO = "0x0000000000000000000000000000000000000000";
    const transfers = alchemyTransfers.transfers.map((t: any) => {
      const from = t.from || "";
      const to = t.to || "";
      // Use indexed action if available, otherwise derive from transfer
      let action = actionMap.get((t.hash as string).toLowerCase()) || "Transfer";
      if (action === "Transfer") {
        if (from === ZERO) action = "Mint";
        else if (to === ZERO) action = "Burn";
      }
      return {
        txHash: t.hash,
        fromAddress: from,
        toAddress: to,
        action,
        amount: t.rawContract?.value || "0",
        decimals: t.rawContract?.decimal ? parseInt(t.rawContract.decimal, 16) : (metadata.decimals || 18),
        tokenSymbol: metadata.symbol || null,
        timestamp: t.metadata?.blockTimestamp || new Date().toISOString(),
      };
    });

    const result = {
      address,
      ...metadata,
      isOeconomia: !!oecToken,
      protocol: oecToken?.protocol || null,
      color: oecToken?.color || null,
      logo: oecToken?.logo || null,
      official: oecToken?.official || false,
      deployed: oecToken ? !oecToken.address.startsWith("0x00000") : true,
      transfers,
      transferCount: transfers.length,
      uniqueAddresses: Number(uniqueAddresses[0]?.count || 0),
    };
    setCache(cacheKey, result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token details" });
  }
});

/**
 * GET /api/tokens/:address/holders
 * Real on-chain balances for addresses seen in indexed transfers.
 * Reads from the token_balances DB cache first (0 CUs).
 * Falls back to Alchemy on cache miss, then seeds the cache.
 */
router.get("/tokens/:address/holders", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const cacheKey = `holders:${address.toLowerCase()}`;
    const memoryCached = getCached(cacheKey);
    if (memoryCached) return res.json(memoryCached);

    const tokenAddress = address.toLowerCase();

    // Build set of known contract addresses from PROTOCOLS + TOKENS
    const knownContracts = new Set<string>();
    for (const config of Object.values(PROTOCOLS)) {
      for (const addr of Object.values(config.contracts)) {
        knownContracts.add(addr.toLowerCase());
      }
    }
    for (const t of TOKENS) {
      if (!t.address.startsWith("0x00000")) {
        knownContracts.add(t.address.toLowerCase());
      }
    }

    // --- Try DB cache first (0 Alchemy CUs) ---
    const cachedHolders = await getHoldersFromCache(tokenAddress);

    if (cachedHolders && cachedHolders.length > 0) {
      // Enrich with isContract flag
      const enriched = await Promise.all(
        cachedHolders.map(async (h) => ({
          ...h,
          isContract: knownContracts.has(h.address.toLowerCase())
            ? true
            : await isContract(h.address).catch(() => false),
        }))
      );

      const result = {
        holders: enriched.map((h, i) => ({ ...h, rank: i + 1 })),
        total: enriched.length,
      };
      setCache(cacheKey, result);
      return res.json(result);
    }

    // --- Cache miss — fall back to Alchemy (same as before) ---
    // 1. Discover unique addresses from indexed transfers
    const knownAddresses = await prisma.$queryRaw<Array<{ addr: string }>>`
      SELECT DISTINCT addr FROM (
        SELECT from_address AS addr FROM token_transfers WHERE LOWER(token_address) = LOWER(${address})
        UNION
        SELECT to_address AS addr FROM token_transfers WHERE LOWER(token_address) = LOWER(${address})
      ) AS addrs
      LIMIT 100
    `;

    if (knownAddresses.length === 0) {
      return res.json({ holders: [], total: 0 });
    }

    // 2. Fetch real on-chain balance + contract status for each address
    const balanceResults = await Promise.all(
      knownAddresses.map(async ({ addr }) => {
        try {
          const [resp, contractFlag] = await Promise.all([
            getTokenBalances(addr),
            knownContracts.has(addr.toLowerCase())
              ? Promise.resolve(true)
              : isContract(addr),
          ]);
          const match = resp.find(
            (b) => b.contractAddress.toLowerCase() === tokenAddress
          );
          return {
            address: addr,
            balance: match ? match.balance : "0",
            isContract: contractFlag,
          };
        } catch {
          return { address: addr, balance: "0", isContract: false };
        }
      })
    );

    // 3. Filter out zero balances, sort descending
    const holders = balanceResults
      .filter((h) => {
        try { return BigInt(h.balance) > 0n; } catch { return false; }
      })
      .sort((a, b) => {
        const diff = BigInt(b.balance) - BigInt(a.balance);
        return diff > 0n ? 1 : diff < 0n ? -1 : 0;
      });

    const result = {
      holders: holders.map((h, i) => ({
        rank: i + 1,
        address: h.address,
        balance: h.balance,
        isContract: h.isContract,
      })),
      total: holders.length,
    };
    setCache(cacheKey, result);

    // 4. Seed the DB cache so subsequent visits are free
    seedBalancesForToken(
      tokenAddress,
      balanceResults.map((r) => ({ address: r.address, balance: r.balance }))
    ).catch((err) => {
      console.error("[API] Failed to seed balance cache:", err instanceof Error ? err.message : err);
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token holders" });
  }
});

/**
 * GET /api/tokens/:address/events
 * Recent event logs from on-chain via Alchemy
 */
router.get("/tokens/:address/events", async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    const cacheKey = `events:${address.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    // Use getAssetTransfers (Enhanced API, no block-range limits on free tier)
    // to get full transfer event history for this token
    const result = await getAssetTransfers({
      contractAddresses: [address],
      category: [AssetTransfersCategory.ERC20],
      maxCount: 100,
    });

    const events = result.transfers.map((t: any) => {
      const rawValue = t.rawContract?.value || "0";
      let decimalValue: string;
      try {
        decimalValue = rawValue.startsWith("0x") ? BigInt(rawValue).toString() : rawValue;
      } catch {
        decimalValue = rawValue;
      }
      return {
        blockNumber: t.blockNum ? parseInt(t.blockNum, 16) : 0,
        transactionHash: t.hash,
        logIndex: 0,
        eventName: "Transfer",
        topics: [
          "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        ],
        data: rawValue,
        decoded: {
          from: t.from || "",
          to: t.to || "",
          value: decimalValue,
        },
        timestamp: (t.metadata as any)?.blockTimestamp || null,
      };
    });

    const eventsResult = { events, total: events.length };
    setCache(cacheKey, eventsResult);
    res.json(eventsResult);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch token events" });
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
