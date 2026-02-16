// ============================================================
// Oeconomia Explorer — Alchemy Service
// ============================================================
// Wraps the Alchemy SDK for RPC calls, enhanced APIs, and
// webhook management. This is the primary blockchain data source.
// ============================================================

import { Alchemy, Network, AssetTransfersCategory } from "alchemy-sdk";
import { prisma } from "../db";

// -- Configuration ----------------------------------------------------------

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "YOUR_API_KEY_HERE";
const ALCHEMY_NETWORK = (process.env.ALCHEMY_NETWORK as keyof typeof Network) || "ETH_SEPOLIA";

const alchemy = new Alchemy({
  apiKey: ALCHEMY_API_KEY,
  network: Network[ALCHEMY_NETWORK] || Network.ETH_SEPOLIA,
});

// -- Transaction Fetching ---------------------------------------------------

/**
 * Get a transaction receipt with full logs
 */
export async function getTransactionReceipt(txHash: string) {
  const receipt = await alchemy.core.getTransactionReceipt(txHash);
  return receipt;
}

/**
 * Get transaction details (input data, value, etc.)
 */
export async function getTransaction(txHash: string) {
  const tx = await alchemy.core.getTransaction(txHash);
  return tx;
}

/**
 * Get full transaction with receipt (combined for decoder)
 */
export async function getFullTransaction(txHash: string) {
  const [tx, receipt] = await Promise.all([
    alchemy.core.getTransaction(txHash),
    alchemy.core.getTransactionReceipt(txHash),
  ]);

  if (!tx || !receipt) return null;

  return {
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
}

// -- Block Fetching ---------------------------------------------------------

/**
 * Get block with transaction hashes
 */
export async function getBlock(blockNumberOrHash: number | string) {
  const block = await alchemy.core.getBlock(
    typeof blockNumberOrHash === "string"
      ? blockNumberOrHash
      : blockNumberOrHash
  );
  return block;
}

/**
 * Get block with full transaction objects (for scanning block contents)
 */
export async function getBlockWithTransactions(blockNumber: number) {
  const block = await alchemy.core.getBlockWithTransactions(blockNumber);
  return block;
}

/**
 * Get latest block number
 */
export async function getLatestBlockNumber(): Promise<number> {
  return await alchemy.core.getBlockNumber();
}

// -- Address / Wallet Data --------------------------------------------------

/**
 * Get ETH balance for an address
 */
export async function getBalance(address: string) {
  const balance = await alchemy.core.getBalance(address);
  return balance.toString();
}

/**
 * Get all token balances for an address (Enhanced API)
 */
export async function getTokenBalances(address: string) {
  const balances = await alchemy.core.getTokenBalances(address);
  return balances.tokenBalances
    .filter((b) => b.tokenBalance && BigInt(b.tokenBalance) > 0n)
    .map((b) => ({
      contractAddress: b.contractAddress,
      balance: b.tokenBalance || "0",
    }));
}

/**
 * Get token metadata (symbol, decimals, name)
 */
export async function getTokenMetadata(contractAddress: string) {
  const metadata = await alchemy.core.getTokenMetadata(contractAddress);
  return {
    symbol: metadata.symbol || "???",
    name: metadata.name || "Unknown",
    decimals: metadata.decimals || 18,
    logo: metadata.logo || null,
  };
}

/**
 * Get token metadata with DB-level caching.
 * First call for any token hits Alchemy (1 CU), all subsequent calls are free.
 */
export async function getCachedTokenMetadata(contractAddress: string) {
  const addr = contractAddress.toLowerCase();

  // Check DB cache first
  const cached = await prisma.tokenMetadataCache.findUnique({
    where: { contractAddress: addr },
  });
  if (cached) {
    return {
      symbol: cached.symbol,
      name: cached.name,
      decimals: cached.decimals,
      logo: cached.logo,
    };
  }

  // Miss — fetch from Alchemy (costs 1 CU)
  const metadata = await getTokenMetadata(contractAddress);

  // Store in DB so we never call Alchemy for this token again
  try {
    await prisma.tokenMetadataCache.upsert({
      where: { contractAddress: addr },
      create: {
        contractAddress: addr,
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        logo: metadata.logo,
      },
      update: {
        symbol: metadata.symbol,
        name: metadata.name,
        decimals: metadata.decimals,
        logo: metadata.logo,
      },
    });
  } catch {
    // Non-fatal — cache write failure shouldn't break the request
  }

  return metadata;
}

/**
 * Get asset transfers for an address (Enhanced API)
 * This is the key method for building transaction history
 */
export async function getAssetTransfers(params: {
  fromAddress?: string;
  toAddress?: string;
  contractAddresses?: string[];
  category?: AssetTransfersCategory[];
  maxCount?: number;
  pageKey?: string;
  fromBlock?: string;
  toBlock?: string;
}) {
  const transfers = await alchemy.core.getAssetTransfers({
    fromAddress: params.fromAddress,
    toAddress: params.toAddress,
    contractAddresses: params.contractAddresses,
    category: params.category || [
      AssetTransfersCategory.EXTERNAL,
      AssetTransfersCategory.ERC20,
      AssetTransfersCategory.ERC721,
      AssetTransfersCategory.ERC1155,
    ],
    maxCount: params.maxCount || 50,
    pageKey: params.pageKey,
    fromBlock: params.fromBlock || "0x0",
    toBlock: params.toBlock || "latest",
    withMetadata: true,
    order: "desc",
  });

  return {
    transfers: transfers.transfers,
    pageKey: transfers.pageKey,
  };
}

/**
 * Check if an address is a contract (has deployed bytecode)
 */
export async function isContract(address: string): Promise<boolean> {
  const code = await alchemy.core.getCode(address);
  return code !== "0x";
}

// -- Event Logs (for indexing) ----------------------------------------------

/**
 * Get logs for specific contract addresses and topics
 * Used by the indexer to catch up on missed events
 */
export async function getLogs(params: {
  address: string | string[];
  fromBlock: number;
  toBlock: number | "latest";
  topics?: string[];
}) {
  const logs = await alchemy.core.getLogs({
    address: params.address,
    fromBlock: params.fromBlock,
    toBlock: params.toBlock,
    topics: params.topics,
  });
  return logs;
}

// -- Webhook Management -----------------------------------------------------
// Note: Webhook creation is typically done once via the Alchemy dashboard
// or their management API. These helpers are for programmatic setup.

/**
 * Get the Alchemy SDK instance (for advanced usage)
 */
export function getAlchemyInstance() {
  return alchemy;
}

export default alchemy;
