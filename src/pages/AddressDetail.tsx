import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ProtocolBadge, EmptyState } from "@/components/shared";
import { truncateTxHash, timeAgo, etherscanLink } from "@/utils/formatters";
import { fetchAddress } from "@/services/api";
import { CHAIN_ID } from "@/utils/constants";

export default function AddressDetail() {
  const { address } = useParams<{ address: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    fetchAddress(address)
      .then((d) => { setData(d); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-tx-muted text-sm">Loading address...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-tx-primary">Address</h1>
        <a
          href={etherscanLink("address", address || "", CHAIN_ID)}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent-link hover:text-accent-link-hover"
        >
          Etherscan →
        </a>
      </div>

      <div className="p-4 rounded-xl border border-bd-primary bg-th-surface">
        <div className="text-sm font-mono text-oec-gold break-all">{address}</div>
        {data?.balance && (
          <div className="mt-2 text-sm text-tx-tertiary">
            Balance: <span className="text-tx-primary font-mono">{data.balance} ETH</span>
          </div>
        )}
      </div>

      {/* Token Balances */}
      {data?.tokenBalances && data.tokenBalances.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">Token Balances</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.tokenBalances.map((tb: any) => (
              <div key={tb.contractAddress} className="p-3 rounded-lg border border-bd-primary bg-th-surface">
                <div className="text-xs font-mono text-tx-muted truncate">{tb.contractAddress}</div>
                <div className="text-sm font-mono text-tx-primary mt-1">{tb.balance}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {data?.transactions && data.transactions.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">Recent Transactions</h2>
          <div className="border border-bd-primary rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-tx-muted border-b border-bd-primary">
                  <th className="text-left px-4 py-2.5 font-medium">Protocol</th>
                  <th className="text-left px-4 py-2.5 font-medium">Hash</th>
                  <th className="text-left px-4 py-2.5 font-medium">Action</th>
                  <th className="text-right px-4 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx: any, i: number) => (
                  <tr key={i} className="border-b border-bd-secondary hover:bg-btn-hover-bg">
                    <td className="px-4 py-2.5"><ProtocolBadge protocol={tx.protocol || "unknown"} /></td>
                    <td className="px-4 py-2.5">
                      <Link to={`/tx/${tx.txHash}`} className="text-accent-link hover:text-accent-link-hover text-sm font-mono">
                        {truncateTxHash(tx.txHash)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-tx-secondary">{tx.actionType || "Transfer"}</td>
                    <td className="px-4 py-2.5 text-right text-sm text-tx-muted">
                      {tx.blockTimestamp ? timeAgo(tx.blockTimestamp) : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No indexed transactions"
          description="Protocol transactions for this address will appear once the indexer processes them."
          icon="📋"
        />
      )}
    </div>
  );
}
