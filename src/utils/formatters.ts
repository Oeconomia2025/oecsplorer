// ============================================================
// Oeconomia Explorer — Formatting Utilities
// ============================================================

/**
 * Truncate an Ethereum address for display: 0x1234...abcd
 */
export function truncateAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Truncate a transaction hash for display
 */
export function truncateTxHash(hash: string, chars = 8): string {
  if (!hash) return "";
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

/**
 * Format wei to ETH with specified decimals
 */
export function weiToEth(wei: string | bigint, decimals = 4): string {
  const value = typeof wei === "string" ? BigInt(wei) : wei;
  const eth = Number(value) / 1e18;
  return eth.toFixed(decimals);
}

/**
 * Format token amount given decimals
 */
export function formatTokenAmount(
  amount: string | bigint,
  tokenDecimals = 18,
  displayDecimals = 4
): string {
  const value = typeof amount === "string" ? BigInt(amount) : amount;
  const num = Number(value) / Math.pow(10, tokenDecimals);

  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(2)}K`;
  return num.toFixed(displayDecimals);
}

/**
 * Format gwei
 */
export function formatGwei(wei: string | bigint): string {
  const value = typeof wei === "string" ? BigInt(wei) : wei;
  return (Number(value) / 1e9).toFixed(2);
}

/**
 * Relative time string: "2 min ago", "3 hours ago", etc.
 */
export function timeAgo(timestamp: Date | string | number): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/**
 * Format block number with commas
 */
export function formatBlockNumber(block: number | string): string {
  return Number(block).toLocaleString();
}

/**
 * Format USD value
 */
export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Get Etherscan link for a tx/address/block (fallback for raw data)
 */
export function etherscanLink(
  type: "tx" | "address" | "block",
  value: string | number,
  chainId = 1
): string {
  const base =
    chainId === 1
      ? "https://etherscan.io"
      : chainId === 5
        ? "https://goerli.etherscan.io"
        : chainId === 11155111
          ? "https://sepolia.etherscan.io"
          : "https://etherscan.io";

  return `${base}/${type}/${value}`;
}
