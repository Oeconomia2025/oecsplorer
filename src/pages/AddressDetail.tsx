import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProtocolBadge, EmptyState } from "@/components/shared";
import { Pagination } from "@/components/Pagination";
import { timeAgo, etherscanLink, weiToEth, formatTokenAmount } from "@/utils/formatters";
import { fetchAddress } from "@/services/api";
import { CHAIN_ID, TOKENS } from "@/utils/constants";

const TX_PAGE_SIZE = 25;

export default function AddressDetail() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txOffset, setTxOffset] = useState(0);

  const loadData = useCallback((offset: number) => {
    if (!address) return;
    setLoading((prev) => data === null ? true : prev); // only show spinner on initial load
    fetchAddress(address, TX_PAGE_SIZE, offset)
      .then((d) => { setData(d); setError(null); setTxOffset(offset); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address, data]);

  useEffect(() => { loadData(0); }, [address]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-tx-muted text-sm">Loading address...</div>
      </div>
    );
  }

  // Merge Alchemy token balances with known Oeconomia tokens for display
  const tokenBalances = (data?.tokens || []).filter(
    (t: any) => t.tokenBalance && t.tokenBalance !== "0x0000000000000000000000000000000000000000000000000000000000000000"
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-tx-primary">Address</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-3 py-1.5 rounded-lg bg-btn-secondary-bg hover:opacity-80 text-btn-secondary-text transition-colors"
          >
            Back
          </button>
          <a
            href={etherscanLink("address", address || "", CHAIN_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-btn-secondary-bg hover:opacity-80 text-btn-secondary-text transition-colors"
          >
            <img
              src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/Etherscan.png"
              alt="Etherscan"
              className="w-4 h-4 object-contain"
            />
            Etherscan
          </a>
        </div>
      </div>

      {/* Address + Balance card */}
      <div className="p-4 rounded-xl border border-bd-primary bg-th-surface">
        <div className="text-sm font-mono text-oec-gold break-all">{address}</div>
        {data?.ethBalance && (
          <div className="mt-2 text-sm text-tx-tertiary">
            Balance: <span className="text-tx-primary font-mono">{weiToEth(data.ethBalance, 6)} ETH</span>
          </div>
        )}
      </div>

      {/* Token Holdings */}
      {tokenBalances.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">Token Holdings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tokenBalances.map((tb: any) => {
              const knownToken = TOKENS.find(
                (t) => t.address.toLowerCase() === tb.contractAddress?.toLowerCase()
              );
              const symbol = tb.symbol || knownToken?.symbol || "???";
              const name = tb.name || knownToken?.name || "Unknown Token";
              const decimals = tb.decimals ?? knownToken?.decimals ?? 18;
              const logo = knownToken?.logo;
              const color = knownToken?.color || "#6b7280";

              return (
                <div key={tb.contractAddress} className="p-4 rounded-xl border border-bd-primary bg-th-surface">
                  <div className="flex items-center gap-3 mb-2">
                    {logo ? (
                      <img src={logo} alt={symbol} className="w-8 h-8 rounded-full object-contain" />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        {symbol.slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-tx-primary">{symbol}</div>
                      <div className="text-xs text-tx-muted">{name}</div>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-tx-primary">
                    {formatTokenAmount(tb.tokenBalance, decimals, 4)} {symbol}
                  </div>
                  {knownToken && (
                    <div className="mt-1">
                      <ProtocolBadge protocol={knownToken.protocol} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Indexed Transactions from Explorer DB */}
      {data?.transactions && data.transactions.length > 0 ? (
        <div>
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
            Indexed Transactions ({(data.txTotal ?? data.transactions.length).toLocaleString()})
          </h2>
          <div className="border border-bd-primary rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-tx-muted border-b border-bd-primary">
                  <th className="text-left px-4 py-2.5 font-medium">Protocol</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tx Hash</th>
                  <th className="text-left px-4 py-2.5 font-medium">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium">Value</th>
                  <th className="text-right px-4 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx: any) => (
                  <tr key={tx.txHash} className="border-b border-bd-secondary hover:bg-btn-hover-bg transition-colors">
                    <td className="px-4 py-2.5"><ProtocolBadge protocol={tx.protocol || "unknown"} /></td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <a
                          href={etherscanLink("tx", tx.txHash, CHAIN_ID)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Etherscan"
                        >
                          <img
                            src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/Etherscan.png"
                            alt="Etherscan"
                            className="w-4 h-4 object-contain"
                          />
                        </a>
                        <Link to={`/tx/${tx.txHash}`} className="text-accent-link hover:text-accent-link-hover text-sm font-mono">
                          {tx.txHash.slice(0, 14)}...
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-tx-secondary">{tx.actionType || "Transaction"}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-tx-tertiary">
                      {tx.tokenTransfers?.length > 0
                        ? tx.tokenTransfers.map((tt: any, i: number) => (
                            <span key={i}>
                              {formatTokenAmount(tt.amount, tt.decimals || 18, 2)} {tt.tokenSymbol || ""}
                              {i < tx.tokenTransfers.length - 1 ? ", " : ""}
                            </span>
                          ))
                        : `${weiToEth(tx.valueWei || "0")} ETH`
                      }
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-tx-muted">
                      {tx.blockTimestamp ? timeAgo(tx.blockTimestamp) : "\u2014"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination total={data.txTotal ?? 0} limit={TX_PAGE_SIZE} offset={txOffset} onPageChange={loadData} />
          </div>
        </div>
      ) : (
        <EmptyState
          title="No indexed transactions"
          description="Protocol transactions for this address will appear once the indexer processes them."
          icon="📋"
        />
      )}

      {/* Alchemy Transfer History (broader context) */}
      {data?.recentTransfers && data.recentTransfers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
            Recent On-Chain Transfers
          </h2>
          <div className="border border-bd-primary rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-tx-muted border-b border-bd-primary">
                  <th className="text-left px-4 py-2.5 font-medium">Asset</th>
                  <th className="text-left px-4 py-2.5 font-medium">From</th>
                  <th className="text-left px-4 py-2.5 font-medium">To</th>
                  <th className="text-right px-4 py-2.5 font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.recentTransfers.map((t: any, i: number) => (
                  <tr key={i} className="border-b border-bd-secondary hover:bg-btn-hover-bg transition-colors">
                    <td className="px-4 py-2.5 text-sm text-tx-primary">{t.asset || "ETH"}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/address/${t.from}`} className="text-sm font-mono text-tx-tertiary hover:text-tx-primary">
                        {t.from?.slice(0, 10)}...
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      {t.to ? (
                        <Link to={`/address/${t.to}`} className="text-sm font-mono text-tx-tertiary hover:text-tx-primary">
                          {t.to?.slice(0, 10)}...
                        </Link>
                      ) : (
                        <span className="text-sm text-tx-muted">Contract Creation</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm font-mono text-tx-secondary">
                      {t.value != null ? Number(t.value).toFixed(4) : "\u2014"} {t.asset || "ETH"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
