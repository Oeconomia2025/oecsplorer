import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProtocolBadge, EmptyState } from "@/components/shared";
import { formatBlockNumber, weiToEth, formatGwei, formatTokenAmount, timeAgo, etherscanLink } from "@/utils/formatters";
import { fetchTransaction } from "@/services/api";
import { CHAIN_ID } from "@/utils/constants";

interface TokenTransfer {
  tokenAddress: string;
  tokenSymbol: string | null;
  fromAddress: string;
  toAddress: string;
  amount: string;
  decimals: number | null;
}

export default function TransactionDetail() {
  const { hash } = useParams<{ hash: string }>();
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

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-tx-primary">Transaction Detail</h1>
      <div className="p-6 rounded-xl border border-bd-primary bg-th-surface space-y-4">
        <Row label="Tx Hash" value={<span className="font-mono text-oec-gold break-all">{tx.txHash}</span>} />
        {tx.protocol && <Row label="Protocol" value={<ProtocolBadge protocol={tx.protocol} size="md" />} />}
        {tx.actionType && <Row label="Action" value={<span className="text-tx-primary">{tx.actionType}</span>} />}
        <Row label="Status" value={
          <span className={tx.status ? "text-status-success" : "text-status-error"}>
            {tx.status ? "Success" : "Failed"}
          </span>
        } />
        <Row label="Block" value={<span className="font-mono text-tx-secondary">{formatBlockNumber(tx.blockNumber)}</span>} />
        <Row label="From" value={
          <Link to={`/address/${tx.fromAddress}`} className="font-mono text-accent-link hover:text-accent-link-hover break-all">{tx.fromAddress}</Link>
        } />
        {tx.toAddress && <Row label="To" value={
          <Link to={`/address/${tx.toAddress}`} className="font-mono text-accent-link hover:text-accent-link-hover break-all">{tx.toAddress}</Link>
        } />}
        <Row label="Value" value={<span className="font-mono text-tx-secondary">{weiToEth(tx.valueWei || "0")} ETH</span>} />
        <Row label="Gas Used" value={<span className="font-mono text-tx-tertiary">{Number(tx.gasUsed).toLocaleString()}</span>} />
        <Row label="Gas Price" value={<span className="font-mono text-tx-tertiary">{formatGwei(tx.gasPrice || "0")} Gwei</span>} />
        {tx.blockTimestamp && <Row label="Timestamp" value={
          <span className="text-tx-tertiary">{new Date(tx.blockTimestamp).toLocaleString()} ({timeAgo(tx.blockTimestamp)})</span>
        } />}
      </div>

      {/* Token Transfers Section */}
      {tokenTransfers.length > 0 && (
        <div className="p-6 rounded-xl border border-bd-primary bg-th-surface space-y-3">
          <h2 className="text-sm font-semibold text-tx-primary">Token Transfers</h2>
          {tokenTransfers.map((tt, i) => (
            <div key={i} className="flex flex-col gap-2 py-3 border-b border-bd-secondary last:border-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-tx-muted">From</span>
                <Link to={`/address/${tt.fromAddress}`} className="font-mono text-sm text-accent-link hover:text-accent-link-hover break-all">
                  {tt.fromAddress}
                </Link>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-tx-muted">To</span>
                <Link to={`/address/${tt.toAddress}`} className="font-mono text-sm text-accent-link hover:text-accent-link-hover break-all">
                  {tt.toAddress}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-tx-muted">Amount</span>
                <span className="font-mono text-sm text-tx-primary font-medium">
                  {formatTokenAmount(tt.amount, tt.decimals || 18, 2)}
                </span>
                {tt.tokenSymbol && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-oec-gold/10 text-oec-gold border border-oec-gold/20">
                    {tt.tokenSymbol}
                  </span>
                )}
              </div>
            </div>
          ))}
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
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2 border-b border-bd-secondary last:border-0">
      <div className="text-xs text-tx-muted sm:w-32 shrink-0 pt-0.5">{label}</div>
      <div className="text-sm flex-1">{value}</div>
    </div>
  );
}
