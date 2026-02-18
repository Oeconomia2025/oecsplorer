import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProtocolBadge, EmptyState, CopyButton } from "@/components/shared";
import { formatBlockNumber, weiToEth, formatGwei, formatTokenAmount, timeAgo, etherscanLink, truncateAddress } from "@/utils/formatters";
import { fetchTransaction } from "@/services/api";
import { CHAIN_ID, TOKENS, PROTOCOLS, getAllContractAddresses } from "@/utils/constants";

// Build a set of all known contract addresses for contract badge detection
const KNOWN_CONTRACTS = new Set(
  getAllContractAddresses().map((a) => a.toLowerCase())
);
// Also add all known token addresses
for (const t of TOKENS) {
  KNOWN_CONTRACTS.add(t.address.toLowerCase());
}

function isKnownContract(address: string): boolean {
  return KNOWN_CONTRACTS.has(address.toLowerCase());
}

// Contract badge component matching the Holders tab style
const CONTRACT_COLOR = "#da1cfe"; // OEC pink
function ContractBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{
        backgroundColor: `${CONTRACT_COLOR}15`,
        color: CONTRACT_COLOR,
        border: `1px solid ${CONTRACT_COLOR}30`,
      }}
      title="Contract"
    >
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
      Contract
    </span>
  );
}

interface TokenTransfer {
  tokenAddress: string;
  tokenSymbol: string | null;
  fromAddress: string;
  toAddress: string;
  amount: string;
  decimals: number | null;
}

// Look up token info from our known tokens list
function findToken(addressOrSymbol: string) {
  const lower = addressOrSymbol.toLowerCase();
  return TOKENS.find(
    (t) => t.address.toLowerCase() === lower || t.symbol.toLowerCase() === lower
  );
}

// Format a raw wei/token amount into a readable string
function formatAmount(raw: string, decimals = 18): string {
  try {
    const num = parseFloat(raw) / Math.pow(10, decimals);
    if (isNaN(num)) return raw;
    return num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  } catch {
    return raw;
  }
}

// Token pill with optional logo
function TokenPill({ symbol, address }: { symbol?: string; address?: string }) {
  const token = address ? findToken(address) : symbol ? findToken(symbol) : null;
  const displaySymbol = token?.symbol || symbol || truncateAddress(address || "");
  const color = token?.color || "#C9A84C";

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ backgroundColor: `${color}15`, color, border: `1px solid ${color}30` }}
    >
      {token?.logo && (
        <img src={token.logo} alt={displaySymbol} className="w-3.5 h-3.5 rounded-full object-contain" />
      )}
      {displaySymbol}
    </span>
  );
}

export default function TransactionDetail() {
  const { hash } = useParams<{ hash: string }>();
  const navigate = useNavigate();
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const loadTransaction = (txHash: string) => {
    setLoading(true);
    setError(null);
    fetchTransaction(txHash)
      .then((data) => { setTx(data); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => { setLoading(false); setRetrying(false); });
  };

  useEffect(() => {
    if (!hash) return;
    loadTransaction(hash);
  }, [hash]);

  const handleRetry = () => {
    if (!hash) return;
    setRetrying(true);
    loadTransaction(hash);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-tx-muted text-sm">Loading transaction...</div>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="space-y-4">
        <h1 className="text-lg font-semibold text-tx-primary">Transaction Detail</h1>
        <div className="p-6 rounded-xl border border-bd-primary bg-th-surface">
          <div className="text-sm font-mono text-oec-gold break-all mb-4">{hash}</div>
          <EmptyState
            title="Transaction not indexed yet"
            description={error || "This transaction hasn't been decoded by the explorer yet. It may appear after the indexer processes it, or you can view it on Etherscan."}
            icon="🔍"
          />
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="text-sm px-4 py-2 rounded-lg bg-btn-secondary-bg hover:opacity-80 text-btn-secondary-text transition-colors disabled:opacity-50"
            >
              {retrying ? "Retrying..." : "Retry"}
            </button>
            <a
              href={etherscanLink("tx", hash || "", CHAIN_ID)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-link hover:text-accent-link-hover underline"
            >
              View on Etherscan →
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Use stored token transfers if available; otherwise extract from decoded Transfer events
  let tokenTransfers: TokenTransfer[] = tx.tokenTransfers || [];
  if (tokenTransfers.length === 0 && tx.decodedData?.events) {
    tokenTransfers = tx.decodedData.events
      .filter((e: any) => e.name === "Transfer" && e.args?.from && e.args?.to && e.args?.value)
      .map((e: any) => ({
        tokenAddress: "",
        tokenSymbol: null,
        fromAddress: e.args.from,
        toAddress: e.args.to,
        amount: e.args.value,
        decimals: 18,
      }));
  }
  // Also pull from top-level decodedEvents (re-decoded format)
  if (tokenTransfers.length === 0 && tx.decodedData?.decodedEvents) {
    tokenTransfers = tx.decodedData.decodedEvents
      .filter((e: any) => e.name === "Transfer" && e.args?.from && e.args?.to && e.args?.value)
      .map((e: any) => ({
        tokenAddress: "",
        tokenSymbol: null,
        fromAddress: e.args.from,
        toAddress: e.args.to,
        amount: e.args.value,
        decimals: 18,
      }));
  }

  // Synthesize an ETH ↔ WETH entry for deposit/withdraw transactions
  // Detect by: tx sent to a WETH contract with a WETH Transfer event
  const knownWethAddresses = TOKENS
    .filter((t) => t.symbol === "WETH")
    .map((t) => t.address.toLowerCase());
  const txToWeth = knownWethAddresses.includes((tx.toAddress || "").toLowerCase());

  if (txToWeth && tokenTransfers.length > 0) {
    // Find the WETH transfer to get the amount
    const wethTransfer = tokenTransfers.find(
      (tt) => knownWethAddresses.includes(tt.tokenAddress?.toLowerCase() || "")
    );
    if (wethTransfer) {
      const wethAddress = tx.toAddress || "";
      // Use valueWei if available, otherwise use the WETH transfer amount
      const ethAmount = (tx.valueWei && tx.valueWei !== "0") ? tx.valueWei : wethTransfer.amount;
      const ethDeposit: TokenTransfer = {
        tokenAddress: "",  // empty so TokenPill shows "ETH", not "WETH"
        tokenSymbol: "ETH",
        fromAddress: tx.fromAddress,
        toAddress: wethAddress,
        amount: ethAmount,
        decimals: 18,
      };
      tokenTransfers = [ethDeposit, ...tokenTransfers];
    }
  } else if (tx.valueWei && tx.valueWei !== "0" && tokenTransfers.length > 0) {
    // Generic ETH value transfer (non-WETH contract but sent ETH)
    const ethDeposit: TokenTransfer = {
      tokenAddress: "",
      tokenSymbol: "ETH",
      fromAddress: tx.fromAddress,
      toAddress: tx.toAddress || "",
      amount: tx.valueWei,
      decimals: 18,
    };
    tokenTransfers = [ethDeposit, ...tokenTransfers];
  }

  // Build transaction summary from decoded data
  const summary = buildSummary(tx);

  return (
    <div className="space-y-4">
      {/* Header row with title + buttons */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-tx-primary">Transaction Details</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-3 py-1.5 rounded-lg bg-btn-secondary-bg hover:opacity-80 text-btn-secondary-text transition-colors"
          >
            Back
          </button>
          <a
            href={etherscanLink("tx", tx.txHash, CHAIN_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-btn-secondary-bg hover:opacity-80 text-btn-secondary-text transition-colors"
          >
            <img
              src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/Etherscan.png"
              alt="Etherscan"
              className="w-4 h-4 object-contain"
            />
            View on Etherscan
          </a>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-bd-primary bg-th-surface space-y-1">
        <Row label="Tx Hash" value={<span className="font-mono text-oec-gold break-all flex items-center gap-2">{tx.txHash}<CopyButton text={tx.txHash} /></span>} />
        {tx.protocol && <Row label="Protocol" value={<ProtocolBadge protocol={tx.protocol} size="md" />} />}
        {tx.actionType && <Row label="Action" value={<span className="text-tx-primary">{tx.actionType}</span>} />}
        <Row label="Status" value={
          <span className={tx.status ? "text-status-success" : "text-status-error"}>
            {tx.status ? "Success" : "Failed"}
          </span>
        } />
        {tx.blockTimestamp && <Row label="Timestamp" value={
          <span className="text-tx-tertiary">{new Date(tx.blockTimestamp).toLocaleString()} ({timeAgo(tx.blockTimestamp)})</span>
        } />}
        <Row label="Block" value={<span className="font-mono text-tx-secondary">{formatBlockNumber(tx.blockNumber)}</span>} />

        {/* Token Transfers — nested card replacing From/To when available */}
        {tokenTransfers.length > 0 ? (
          <div className="rounded-lg border border-bd-primary p-4 space-y-3 my-1 bg-th-surface">
            <h3 className="text-xs font-semibold text-tx-muted uppercase tracking-wide">Token Transfers</h3>
            {tokenTransfers.map((tt, i) => {
              const fromIsContract = isKnownContract(tt.fromAddress);
              const toIsContract = isKnownContract(tt.toAddress);
              return (
                <div key={i} className="flex flex-col gap-2 py-3 border-b border-bd-secondary last:border-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-tx-muted w-12">From</span>
                    <Link
                      to={`/address/${tt.fromAddress}`}
                      className={`font-mono text-sm break-all ${fromIsContract ? "hover:underline" : "text-accent-link hover:text-accent-link-hover"}`}
                      style={fromIsContract ? { color: CONTRACT_COLOR } : undefined}
                    >
                      {tt.fromAddress}
                    </Link>
                    <CopyButton text={tt.fromAddress} />
                    {fromIsContract && <ContractBadge />}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-tx-muted w-12">To</span>
                    <Link
                      to={`/address/${tt.toAddress}`}
                      className={`font-mono text-sm break-all ${toIsContract ? "hover:underline" : "text-accent-link hover:text-accent-link-hover"}`}
                      style={toIsContract ? { color: CONTRACT_COLOR } : undefined}
                    >
                      {tt.toAddress}
                    </Link>
                    <CopyButton text={tt.toAddress} />
                    {toIsContract && <ContractBadge />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-tx-muted w-12">Amount</span>
                    <span className="font-mono text-sm text-tx-primary font-medium">
                      {formatTokenAmount(tt.amount, tt.decimals || 18, 2)}
                    </span>
                    {tt.tokenSymbol && (
                      <TokenPill symbol={tt.tokenSymbol} address={tt.tokenAddress} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <Row label="From" value={
              <span className="flex items-center gap-2">
                <Link to={`/address/${tx.fromAddress}`} className="font-mono text-accent-link hover:text-accent-link-hover break-all">{tx.fromAddress}</Link>
                <CopyButton text={tx.fromAddress} />
              </span>
            } />
            {tx.toAddress && <Row label="To" value={
              <span className="flex items-center gap-2">
                <Link to={`/address/${tx.toAddress}`} className="font-mono text-accent-link hover:text-accent-link-hover break-all">{tx.toAddress}</Link>
                <CopyButton text={tx.toAddress} />
              </span>
            } />}
          </>
        )}

        <Row label="Value" value={<span className="font-mono text-tx-secondary">{weiToEth(tx.valueWei || "0")} ETH</span>} />
        <Row label="Gas Used" value={<span className="font-mono text-tx-tertiary">{Number(tx.gasUsed).toLocaleString()}</span>} />
        <Row label="Gas Price" value={<span className="font-mono text-tx-tertiary">{formatGwei(tx.gasPrice || "0")} Gwei</span>} />
      </div>

      {/* Transaction Summary — human-readable breakdown */}
      {summary && (
        <div className="p-6 rounded-xl border border-bd-primary bg-th-surface space-y-4">
          <h2 className="text-sm font-semibold text-tx-primary">Transaction Summary</h2>
          {summary}
        </div>
      )}

      {/* Decoded Data */}
      {tx.decodedData && (
        <div className="p-6 rounded-xl border border-bd-primary bg-th-surface space-y-3">
          <h2 className="text-sm font-semibold text-tx-primary">Decoded Data</h2>
          <pre className="text-xs text-tx-tertiary bg-code-bg p-3 rounded-lg overflow-x-auto max-h-48">
            {JSON.stringify(tx.decodedData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-1 border-b border-bd-secondary last:border-0">
      <div className="text-xs text-tx-muted sm:w-32 shrink-0 pt-0.5">{label}</div>
      <div className="text-sm flex-1">{value}</div>
    </div>
  );
}

// -- Summary Builder --------------------------------------------------------

function buildSummary(tx: any): React.ReactNode | null {
  const args = tx.decodedData?.decodedArgs || tx.decodedData?.args || {};
  const events = tx.decodedData?.decodedEvents || tx.decodedData?.events || [];
  const action = tx.actionType || "";
  const fn = tx.functionName || tx.decodedData?.functionName || "";

  // Staking
  if (fn === "stake" || action.includes("Staked")) {
    const amount = args._amount || args.amount;
    const packageId = args._packageId || args.packageId;
    return (
      <div className="space-y-2">
        <SummaryRow icon="lock" label="Action" value="Staked tokens in Guardian Staking" />
        {amount && (
          <SummaryRow icon="coins" label="Amount Staked">
            <span className="font-mono font-medium text-tx-primary">{formatAmount(amount)}</span>
            <TokenPill symbol="OEC" />
          </SummaryRow>
        )}
        {packageId && (
          <SummaryRow icon="package" label="Staking Package" value={`Package #${packageId}`} />
        )}
      </div>
    );
  }

  // Unstaking
  if (fn === "unstake" || action.includes("Unstaked")) {
    const packageId = args._packageId || args.packageId;
    return (
      <div className="space-y-2">
        <SummaryRow icon="unlock" label="Action" value="Unstaked tokens from Guardian Staking" />
        {packageId && (
          <SummaryRow icon="package" label="Staking Package" value={`Package #${packageId}`} />
        )}
      </div>
    );
  }

  // V3 Swap (exactInputSingle)
  if (fn === "exactInputSingle") {
    const params = args.params || args;
    const tokenIn = params?.tokenIn;
    const tokenOut = params?.tokenOut;
    const amountIn = params?.amountIn;
    const fee = params?.fee;
    return (
      <div className="space-y-2">
        <SummaryRow icon="swap" label="Action" value="Swapped tokens via Uniswap V3" />
        {tokenIn && (
          <SummaryRow icon="arrow-up" label="Token In">
            <TokenPill address={tokenIn} />
            {amountIn && <span className="font-mono text-tx-primary ml-1">{formatAmount(amountIn, findToken(tokenIn)?.decimals || 18)}</span>}
          </SummaryRow>
        )}
        {tokenOut && (
          <SummaryRow icon="arrow-down" label="Token Out">
            <TokenPill address={tokenOut} />
          </SummaryRow>
        )}
        {fee && (
          <SummaryRow icon="percent" label="Fee Tier" value={`${Number(fee) / 10000}%`} />
        )}
      </div>
    );
  }

  // V3 Swap (exactOutputSingle)
  if (fn === "exactOutputSingle") {
    const params = args.params || args;
    const tokenIn = params?.tokenIn;
    const tokenOut = params?.tokenOut;
    const amountOut = params?.amountOut;
    return (
      <div className="space-y-2">
        <SummaryRow icon="swap" label="Action" value="Swapped tokens via Uniswap V3 (exact output)" />
        {tokenIn && (
          <SummaryRow icon="arrow-up" label="Token In">
            <TokenPill address={tokenIn} />
          </SummaryRow>
        )}
        {tokenOut && (
          <SummaryRow icon="arrow-down" label="Token Out">
            <TokenPill address={tokenOut} />
            {amountOut && <span className="font-mono text-tx-primary ml-1">{formatAmount(amountOut, findToken(tokenOut)?.decimals || 18)}</span>}
          </SummaryRow>
        )}
      </div>
    );
  }

  // V3 Multicall
  if (fn === "multicall" || action === "V3 Multicall") {
    // Try to extract info from events
    const swapEvents = events.filter((e: any) => e.name === "Swap" || e.name === "Transfer");
    const transfers = events.filter((e: any) => e.name === "Transfer");
    return (
      <div className="space-y-2">
        <SummaryRow icon="layers" label="Action" value="Executed multiple operations in a single V3 Multicall" />
        {transfers.length > 0 && (
          <SummaryRow icon="coins" label="Token Movements" value={`${transfers.length} token transfer${transfers.length !== 1 ? "s" : ""} in this call`} />
        )}
        {transfers.map((t: any, i: number) => (
          <div key={i} className="flex items-center gap-2 pl-6 text-sm">
            <span className="text-tx-faint">Transfer:</span>
            <span className="font-mono text-tx-tertiary">{truncateAddress(t.args?.from || "")}</span>
            <span className="text-tx-faint">→</span>
            <span className="font-mono text-tx-tertiary">{truncateAddress(t.args?.to || "")}</span>
            {t.args?.value && (
              <span className="font-mono text-tx-primary">{formatAmount(t.args.value)}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  // Add Liquidity (V2)
  if (fn === "addLiquidity" || fn === "addLiquidityETH") {
    const tokenA = args.tokenA || args.token;
    const amountA = args.amountADesired || args.amountTokenDesired;
    const isETH = fn === "addLiquidityETH";
    const mintEvent = events.find((e: any) => e.name === "Mint");
    return (
      <div className="space-y-2">
        <SummaryRow icon="plus" label="Action" value={isETH ? "Added liquidity with ETH" : "Added liquidity to pool"} />
        {tokenA && (
          <SummaryRow icon="coins" label={isETH ? "Token" : "Token A"}>
            <TokenPill address={tokenA} />
            {amountA && <span className="font-mono text-tx-primary ml-1">{formatAmount(amountA, findToken(tokenA)?.decimals || 18)}</span>}
          </SummaryRow>
        )}
        {isETH && tx.valueWei && tx.valueWei !== "0" && (
          <SummaryRow icon="coins" label="ETH Amount">
            <TokenPill symbol="WETH" />
            <span className="font-mono text-tx-primary ml-1">{weiToEth(tx.valueWei)} ETH</span>
          </SummaryRow>
        )}
        {!isETH && args.tokenB && (
          <SummaryRow icon="coins" label="Token B">
            <TokenPill address={args.tokenB} />
            {args.amountBDesired && <span className="font-mono text-tx-primary ml-1">{formatAmount(args.amountBDesired, findToken(args.tokenB)?.decimals || 18)}</span>}
          </SummaryRow>
        )}
      </div>
    );
  }

  // Remove Liquidity (V2)
  if (fn === "removeLiquidity" || fn === "removeLiquidityETH" || fn === "removeLiquidityWithPermit" || fn === "removeLiquidityETHWithPermit") {
    const tokenA = args.tokenA || args.token;
    const liquidity = args.liquidity;
    const isETH = fn.includes("ETH");
    return (
      <div className="space-y-2">
        <SummaryRow icon="minus" label="Action" value={isETH ? "Removed liquidity (received ETH)" : "Removed liquidity from pool"} />
        {tokenA && (
          <SummaryRow icon="coins" label={isETH ? "Token" : "Token A"}>
            <TokenPill address={tokenA} />
          </SummaryRow>
        )}
        {!isETH && args.tokenB && (
          <SummaryRow icon="coins" label="Token B">
            <TokenPill address={args.tokenB} />
          </SummaryRow>
        )}
        {liquidity && (
          <SummaryRow icon="droplet" label="LP Tokens Burned">
            <span className="font-mono text-tx-primary">{formatAmount(liquidity)}</span>
          </SummaryRow>
        )}
      </div>
    );
  }

  // Token Transfer / Approval
  if (fn === "transfer" || fn === "transferFrom") {
    const to = args.to || args.dst;
    const amount = args.amount || args.value || args.wad;
    const tokenAddr = tx.toAddress;
    return (
      <div className="space-y-2">
        <SummaryRow icon="send" label="Action" value="Transferred tokens" />
        <SummaryRow icon="coins" label="Token">
          <TokenPill address={tokenAddr} />
        </SummaryRow>
        {amount && (
          <SummaryRow icon="hash" label="Amount">
            <span className="font-mono text-tx-primary">{formatAmount(amount, findToken(tokenAddr)?.decimals || 18)}</span>
          </SummaryRow>
        )}
        {to && (
          <SummaryRow icon="arrow-down" label="Recipient">
            <Link to={`/address/${to}`} className="font-mono text-sm text-accent-link hover:text-accent-link-hover">
              {truncateAddress(to)}
            </Link>
          </SummaryRow>
        )}
      </div>
    );
  }

  if (fn === "approve") {
    const spender = args.spender;
    const amount = args.amount || args.value;
    const tokenAddr = tx.toAddress;
    return (
      <div className="space-y-2">
        <SummaryRow icon="check" label="Action" value="Approved token spending" />
        <SummaryRow icon="coins" label="Token">
          <TokenPill address={tokenAddr} />
        </SummaryRow>
        {spender && (
          <SummaryRow icon="user" label="Approved Spender">
            <Link to={`/address/${spender}`} className="font-mono text-sm text-accent-link hover:text-accent-link-hover">
              {truncateAddress(spender)}
            </Link>
          </SummaryRow>
        )}
      </div>
    );
  }

  // Universal Router execute
  if (fn === "execute" && action === "Universal Router Swap") {
    const transfers = events.filter((e: any) => e.name === "Transfer");
    return (
      <div className="space-y-2">
        <SummaryRow icon="swap" label="Action" value="Executed swap via Uniswap Universal Router" />
        {transfers.length > 0 && (
          <SummaryRow icon="coins" label="Token Movements" value={`${transfers.length} transfer${transfers.length !== 1 ? "s" : ""}`} />
        )}
      </div>
    );
  }

  // Generic fallback — show decoded args if available
  if (Object.keys(args).length > 0) {
    return (
      <div className="space-y-2">
        <SummaryRow icon="info" label="Action" value={action || "Contract Interaction"} />
        {Object.entries(args).map(([key, val]) => {
          if (key === "data" || key === "path") return null; // skip raw bytes
          const strVal = String(val);
          // Check if it's a token address
          if (strVal.startsWith("0x") && strVal.length === 42) {
            return (
              <SummaryRow key={key} icon="tag" label={key}>
                <TokenPill address={strVal} />
                <span className="font-mono text-tx-faint text-xs ml-1">({truncateAddress(strVal)})</span>
              </SummaryRow>
            );
          }
          // Large numbers — likely token amounts
          if (/^\d+$/.test(strVal) && strVal.length > 10) {
            return <SummaryRow key={key} icon="hash" label={key} value={formatAmount(strVal)} />;
          }
          return <SummaryRow key={key} icon="tag" label={key} value={strVal.length > 60 ? strVal.slice(0, 60) + "..." : strVal} />;
        })}
      </div>
    );
  }

  return null;
}

// -- Summary Row Component --------------------------------------------------

const ICONS: Record<string, React.ReactNode> = {
  lock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  unlock: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  swap: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" /></svg>,
  coins: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  "arrow-up": <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>,
  "arrow-down": <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  minus: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>,
  layers: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  send: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  user: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  package: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  percent: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  droplet: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 21a8 8 0 004-14.947V6a4 4 0 00-8 0v.053A8 8 0 0012 21z" /></svg>,
  hash: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>,
  tag: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>,
  info: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

function SummaryRow({ icon, label, value, children }: {
  icon: string;
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-tx-muted shrink-0">{ICONS[icon] || ICONS.info}</span>
      <span className="text-tx-muted w-32 shrink-0">{label}</span>
      {value && <span className="text-tx-primary">{value}</span>}
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  );
}
