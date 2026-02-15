import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { PROTOCOLS, TOKENS } from "@/utils/constants";
import { ProtocolBadge, ProtocolIcon, LiveIndicator, EmptyState, CopyButton } from "@/components/shared";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { LiveTransaction } from "@/hooks/useWebSocket";
import { truncateAddress, timeAgo, etherscanLink } from "@/utils/formatters";
import { CHAIN_ID } from "@/utils/constants";
import { fetchLatestBlock, fetchRecentTransactions } from "@/services/api";
import type { ProtocolId } from "@/utils/constants";

export default function Dashboard() {
  const { isConnected, transactions: wsTx } = useWebSocket({ channel: "all" });
  const [latestBlock, setLatestBlock] = useState<number | null>(null);
  const [selectedProtocol, setSelectedProtocol] = useState<string>("all");
  const [dbTransactions, setDbTransactions] = useState<LiveTransaction[]>([]);

  useEffect(() => {
    fetchLatestBlock()
      .then((data) => setLatestBlock(data.blockNumber))
      .catch(() => {});

    fetchRecentTransactions(20)
      .then((data) => setDbTransactions(data))
      .catch(() => {});
  }, []);

  const transactions = useMemo(() => {
    const seen = new Set<string>();
    const merged: LiveTransaction[] = [];
    for (const tx of [...wsTx, ...dbTransactions]) {
      if (!seen.has(tx.hash)) {
        seen.add(tx.hash);
        merged.push(tx);
      }
    }
    return merged;
  }, [wsTx, dbTransactions]);

  const filteredTx = selectedProtocol === "all"
    ? transactions
    : transactions.filter((t) => t.protocol === selectedProtocol);

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Network" value="Sepolia" sub="Testnet" color="#C9A84C" />
        <StatCard
          label="Latest Block"
          value={latestBlock ? latestBlock.toLocaleString() : "\u2014"}
          sub="Syncing..."
          color="#8B5CF6"
        />
        <StatCard
          label="Protocols"
          value="5"
          sub="Active"
          color="#3B82F6"
        />
        <StatCard
          label="Tokens Tracked"
          value={TOKENS.filter((t) => !t.address.startsWith("0x00000")).length.toString()}
          sub="Deployed"
          color="#10B981"
        />
      </div>

      {/* Protocol Cards */}
      <div>
        <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
          Protocol Pantheon
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {(Object.entries(PROTOCOLS) as [ProtocolId, typeof PROTOCOLS[ProtocolId]][]).map(([id, config]) => {
            const contractCount = Object.keys(config.contracts).length;
            const hasReal = Object.values(config.contracts).some((addr) => !addr.startsWith("0x00000"));
            return (
              <Link
                key={id}
                to={`/protocol/${id}`}
                className="group p-4 rounded-xl border transition-all hover:-translate-y-0.5"
                style={{
                  borderColor: `${config.color}20`,
                  background: `linear-gradient(135deg, ${config.color}08, transparent)`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <ProtocolIcon protocol={id} size="md" />
                  <span className="font-semibold text-sm" style={{ color: config.color }}>
                    {config.name}
                  </span>
                </div>
                <p className="text-xs text-tx-muted leading-relaxed mb-3 line-clamp-2">
                  {config.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-tx-faint">
                    {contractCount} contract{contractCount !== 1 ? "s" : ""}
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: hasReal ? "#22C55E18" : "#71717A18",
                      color: hasReal ? "#22C55E" : "#71717A",
                    }}
                  >
                    {hasReal ? "Deployed" : "Pending"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Live Transaction Feed */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider">
              Live Activity
            </h2>
            <LiveIndicator isLive={isConnected} />
          </div>

          {/* Protocol Filter */}
          <div className="flex gap-1">
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
        </div>

        {filteredTx.length > 0 ? (
          <div className="border border-bd-primary rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="text-xs text-tx-muted border-b border-bd-primary">
                  <th className="text-left px-4 py-2.5 font-medium">Protocol</th>
                  <th className="text-left px-4 py-2.5 font-medium">Tx Hash</th>
                  <th className="text-left px-4 py-2.5 font-medium">Action</th>
                  <th className="text-left px-4 py-2.5 font-medium">From</th>
                  <th className="text-left px-4 py-2.5 font-medium">To</th>
                  <th className="text-right px-4 py-2.5 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {filteredTx.map((tx, i) => (
                  <tr key={`${tx.hash}-${i}`} className="border-b border-bd-secondary hover:bg-btn-hover-bg transition-colors">
                    <td className="px-4 py-2.5">
                      <ProtocolBadge protocol={tx.protocol} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <a
                          href={etherscanLink("tx", tx.hash, CHAIN_ID)}
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
                        <Link to={`/tx/${tx.hash}`} className="text-accent-link hover:text-accent-link-hover text-sm font-mono">
                          {tx.hash.slice(0, 14)}...
                        </Link>
                        <CopyButton text={tx.hash} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-tx-secondary">{tx.action}</td>
                    <td className="px-4 py-2.5">
                      <Link to={`/address/${tx.from}`} className="text-tx-tertiary hover:text-tx-primary text-sm font-mono">
                        {truncateAddress(tx.from)}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5">
                      {tx.to ? (
                        <Link to={`/address/${tx.to}`} className="text-tx-tertiary hover:text-tx-primary text-sm font-mono">
                          {truncateAddress(tx.to)}
                        </Link>
                      ) : (
                        <span className="text-tx-faint text-sm">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-tx-muted">
                      {timeAgo(tx.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Waiting for transactions"
            description="Live protocol activity will appear here once the indexer picks up new events. The WebSocket connection is active and listening."
            icon="📡"
          />
        )}
      </div>

      {/* Tracked Tokens */}
      <div>
        <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
          Tracked Tokens
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {TOKENS.filter((t) => !t.address.startsWith("0x00000")).map((token) => (
            <div
              key={token.address}
              className="p-4 rounded-xl border border-bd-primary bg-th-surface hover:border-bd-secondary transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {token.logo ? (
                    <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${token.color}20`, color: token.color }}
                    >
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-semibold text-tx-primary">{token.symbol}</div>
                    <div className="text-xs text-tx-muted">{token.name}</div>
                  </div>
                </div>
                <ProtocolBadge protocol={token.protocol} />
              </div>
              <div className="text-xs text-tx-faint font-mono mt-2 truncate" title={token.address}>
                {token.address}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        borderColor: `${color}15`,
        background: `linear-gradient(135deg, ${color}06, transparent)`,
      }}
    >
      <div className="text-xs text-tx-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-tx-primary">{value}</div>
      <div className="text-xs mt-0.5" style={{ color: `${color}AA` }}>{sub}</div>
    </div>
  );
}
