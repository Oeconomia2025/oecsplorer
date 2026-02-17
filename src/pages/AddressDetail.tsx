import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProtocolBadge, ProtocolIcon, EmptyState } from "@/components/shared";
import { Pagination } from "@/components/Pagination";
import { timeAgo, etherscanLink, weiToEth, formatTokenAmount } from "@/utils/formatters";
import { fetchAddress } from "@/services/api";
import { CHAIN_ID, TOKENS, PROTOCOLS } from "@/utils/constants";
import type { ProtocolId } from "@/utils/constants";

const TX_PAGE_SIZE = 25;

type Tab = "transactions" | "balances";

export default function AddressDetail() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [txOffset, setTxOffset] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>("transactions");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");

  const loadData = useCallback((offset: number) => {
    if (!address) return;
    setLoading((prev) => data === null ? true : prev);
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

  const tokenBalances = (data?.tokens || []).filter(
    (t: any) => {
      const bal = t.tokenBalance || t.balance;
      return bal && bal !== "0" && bal !== "0x0000000000000000000000000000000000000000000000000000000000000000";
    }
  );

  const allTransactions: any[] = data?.transactions || [];
  const filteredTransactions = selectedProtocol === "all"
    ? allTransactions
    : allTransactions.filter((tx: any) => tx.protocol === selectedProtocol);

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

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-bd-primary pb-0">
        <button
          onClick={() => setActiveTab("transactions")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "transactions"
              ? "border-oec-gold text-oec-gold"
              : "border-transparent text-tx-muted hover:text-tx-secondary"
          }`}
        >
          Indexed Transactions
          {data?.txTotal != null && (
            <span className="ml-1.5 text-xs opacity-70">({data.txTotal.toLocaleString()})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("balances")}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === "balances"
              ? "border-oec-gold text-oec-gold"
              : "border-transparent text-tx-muted hover:text-tx-secondary"
          }`}
        >
          Wallet Balances
          {tokenBalances.length > 0 && (
            <span className="ml-1.5 text-xs opacity-70">({tokenBalances.length})</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "transactions" && (
        <div>
          {/* Protocol Filter */}
          <div className="flex items-center gap-1 mb-3">
            <button
              onClick={() => setSelectedProtocol("all")}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                selectedProtocol === "all"
                  ? "bg-oec-gold/15 text-oec-gold"
                  : "text-tx-muted hover:text-tx-secondary"
              }`}
            >
              All
            </button>
            {(Object.entries(PROTOCOLS) as [ProtocolId, typeof PROTOCOLS[ProtocolId]][]).map(([id, config]) => (
              <button
                key={id}
                onClick={() => setSelectedProtocol(id)}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedProtocol === id
                    ? "text-white"
                    : "text-tx-muted hover:text-tx-secondary"
                }`}
                style={selectedProtocol === id ? { backgroundColor: `${config.color}25`, color: config.color } : undefined}
              >
                <ProtocolIcon protocol={id} size="sm" />
              </button>
            ))}
          </div>

          {filteredTransactions.length > 0 ? (
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
                  {filteredTransactions.map((tx: any) => (
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
              {selectedProtocol === "all" && (
                <Pagination total={data.txTotal ?? 0} limit={TX_PAGE_SIZE} offset={txOffset} onPageChange={loadData} />
              )}
            </div>
          ) : (
            <EmptyState
              title={selectedProtocol === "all" ? "No indexed transactions" : `No ${selectedProtocol} transactions`}
              description="Protocol transactions for this address will appear once the indexer processes them."
              icon="📋"
            />
          )}
        </div>
      )}

      {activeTab === "balances" && (
        <div>
          {tokenBalances.length > 0 ? (
            <div className="border border-bd-primary rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="text-xs text-tx-muted border-b border-bd-primary">
                    <th className="text-left px-4 py-2.5 font-medium">Token</th>
                    <th className="text-left px-4 py-2.5 font-medium">Protocol</th>
                    <th className="text-right px-4 py-2.5 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
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
                      <tr key={tb.contractAddress} className="border-b border-bd-secondary hover:bg-btn-hover-bg transition-colors">
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-3">
                            {logo ? (
                              <img src={logo} alt={symbol} className="w-6 h-6 rounded-full object-contain" />
                            ) : (
                              <div
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
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
                        </td>
                        <td className="px-4 py-2.5">
                          {knownToken ? (
                            <ProtocolBadge protocol={knownToken.protocol} />
                          ) : (
                            <span className="text-xs text-tx-muted">External</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right text-sm font-mono text-tx-primary">
                          {formatTokenAmount(tb.tokenBalance || tb.balance, decimals, 4)} {symbol}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No token balances"
              description="This address has no known Oeconomia token balances."
              icon="💰"
            />
          )}
        </div>
      )}
    </div>
  );
}
