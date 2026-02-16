import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ProtocolBadge, CopyButton, EmptyState, AddressLink } from "@/components/shared";
import { etherscanLink, truncateAddress, truncateTxHash, timeAgo, formatTokenAmount } from "@/utils/formatters";
import { fetchToken, fetchTokenHolders, fetchTokenEvents } from "@/services/api";
import { CHAIN_ID, TOKENS } from "@/utils/constants";
import type { TokenConfig, ProtocolId } from "@/utils/constants";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: unknown }) => Promise<unknown>;
    };
  }
}

async function addToWallet(token: TokenConfig) {
  if (!window.ethereum) {
    alert("MetaMask or a compatible wallet is required to add tokens.");
    return;
  }
  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.logo || "",
        },
      },
    });
  } catch {
    // user rejected or error
  }
}

type TabId = "transfers" | "holders" | "events";

interface Transfer {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  action: string;
  amount: string;
  decimals: number | null;
  tokenSymbol: string | null;
  timestamp: string;
}

interface Holder {
  rank: number;
  address: string;
  balance: string;
  isContract: boolean;
}

interface TokenEvent {
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  eventName: string | null;
  topics: string[];
  data: string;
  decoded: Record<string, string> | null;
  timestamp: string | null;
}

interface TokenData {
  address: string;
  name: string | null;
  symbol: string | null;
  decimals: number | null;
  logo: string | null;
  isOeconomia: boolean;
  protocol: ProtocolId | null;
  color: string | null;
  official: boolean;
  deployed: boolean;
  transfers: Transfer[];
  transferCount: number;
  uniqueAddresses: number;
}

export default function TokenDetailPage() {
  const { address } = useParams<{ address: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("transfers");

  // Holders state
  const [holders, setHolders] = useState<Holder[]>([]);
  const [holdersLoading, setHoldersLoading] = useState(false);
  const [holdersLoaded, setHoldersLoaded] = useState(false);

  // Events state
  const [events, setEvents] = useState<TokenEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [eventsTotal, setEventsTotal] = useState(0);

  const localToken = TOKENS.find(
    (t) => t.address.toLowerCase() === address?.toLowerCase()
  );

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setHoldersLoaded(false);
    setEventsLoaded(false);
    fetchToken(address)
      .then((d: any) => { setData(d); setError(null); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [address]);

  // Lazy-load holders when tab is selected
  useEffect(() => {
    if (activeTab !== "holders" || holdersLoaded || !address) return;
    setHoldersLoading(true);
    fetchTokenHolders(address)
      .then((d) => { setHolders(d.holders); setHoldersLoaded(true); })
      .catch(() => setHolders([]))
      .finally(() => setHoldersLoading(false));
  }, [activeTab, address, holdersLoaded]);

  // Lazy-load events when tab is selected
  useEffect(() => {
    if (activeTab !== "events" || eventsLoaded || !address) return;
    setEventsLoading(true);
    fetchTokenEvents(address)
      .then((d) => { setEvents(d.events); setEventsTotal(d.total); setEventsLoaded(true); })
      .catch(() => setEvents([]))
      .finally(() => setEventsLoading(false));
  }, [activeTab, address, eventsLoaded]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-tx-muted text-sm">Loading token...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm px-3 py-1.5 rounded-lg bg-btn-secondary-bg hover:opacity-80 text-btn-secondary-text transition-colors"
        >
          Back
        </button>
        <EmptyState
          title="Failed to load token"
          description={error}
        />
      </div>
    );
  }

  const isDeployed = data?.deployed !== false && !address?.startsWith("0x00000");
  const tokenSymbol = data?.symbol || localToken?.symbol || "???";
  const tokenName = data?.name || localToken?.name || "Unknown Token";
  const tokenDecimals = data?.decimals ?? localToken?.decimals ?? 18;
  const tokenColor = data?.color || localToken?.color || "#C9A84C";
  const tokenLogo = data?.logo || localToken?.logo;
  const isOfficial = data?.official || localToken?.official || false;
  const protocol = data?.protocol || localToken?.protocol || null;

  // --- Undeployed token page ---
  if (!isDeployed) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-tx-primary">Token Detail</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm px-3 py-1.5 rounded-lg bg-btn-secondary-bg hover:opacity-80 text-btn-secondary-text transition-colors"
          >
            Back
          </button>
        </div>

        {/* Token Identity Card */}
        <div className="p-5 rounded-xl border border-bd-primary bg-th-surface">
          <div className="flex items-center gap-4 mb-4">
            {tokenLogo ? (
              <img src={tokenLogo} alt={tokenSymbol} className="w-12 h-12 rounded-full object-contain" />
            ) : (
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ backgroundColor: `${tokenColor}20`, color: tokenColor }}
              >
                {tokenSymbol.slice(0, 2)}
              </div>
            )}
            <div>
              <div className="text-lg font-semibold text-tx-primary flex items-center gap-2">
                {tokenSymbol}
                {isOfficial && (
                  <svg className="w-5 h-5 text-oec-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <title>Official Oeconomia DAO Token</title>
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
              </div>
              <div className="text-sm text-tx-muted">{tokenName}</div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {protocol && <ProtocolBadge protocol={protocol} />}
            </div>
          </div>
          <div className="text-xs text-tx-faint">Not yet deployed</div>
        </div>

        {/* Coming Soon */}
        <EmptyState
          title="Coming Soon"
          description={`${tokenSymbol} (${tokenName}) is planned for the Oeconomia ecosystem but has not been deployed yet. Check back later!`}
        />
      </div>
    );
  }

  const TABS: { id: TabId; label: string; count?: number }[] = [
    { id: "transfers", label: "Transfers", count: data?.transferCount },
    { id: "holders", label: "Holders", count: data?.uniqueAddresses },
    { id: "events", label: "Events" },
  ];

  // --- Deployed token page ---
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-tx-primary">Token Detail</h1>
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

      {/* Token Identity Card */}
      <div className="p-5 rounded-xl border border-bd-primary bg-th-surface">
        <div className="flex items-center gap-4 mb-4">
          {tokenLogo ? (
            <img src={tokenLogo} alt={tokenSymbol} className="w-12 h-12 rounded-full object-contain" />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: `${tokenColor}20`, color: tokenColor }}
            >
              {tokenSymbol.slice(0, 2)}
            </div>
          )}
          <div>
            <div className="text-lg font-semibold text-tx-primary flex items-center gap-2">
              {tokenSymbol}
              {isOfficial && (
                <svg className="w-5 h-5 text-oec-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <title>Official Oeconomia DAO Token</title>
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              )}
            </div>
            <div className="text-sm text-tx-muted">{tokenName}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {isOfficial && protocol ? (
              <ProtocolBadge protocol={protocol} />
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
                style={{
                  backgroundColor: "#627EEA18",
                  color: "#627EEA",
                  border: "1px solid #627EEA30",
                }}
              >
                <img
                  src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png"
                  alt="ETH"
                  className="w-4 h-4 rounded-full object-contain"
                />
                <span>SEP-ETH</span>
              </span>
            )}
          </div>
        </div>

        {/* Contract address + decimals */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mb-4">
          <div className="flex items-center gap-1.5">
            <span className="text-tx-muted">Contract:</span>
            <span className="font-mono text-oec-gold break-all">{address}</span>
            <CopyButton text={address || ""} />
          </div>
          <div className="text-tx-muted">
            Decimals: <span className="text-tx-primary">{tokenDecimals}</span>
          </div>
        </div>

        {/* Add to Wallet */}
        {localToken && (
          <button
            onClick={() => addToWallet(localToken)}
            className="text-xs px-3 py-2 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: `${tokenColor}18`,
              color: tokenColor,
              border: `1px solid ${tokenColor}30`,
            }}
          >
            Add to Wallet
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-bd-primary bg-th-surface text-center">
          <div className="text-2xl font-bold text-tx-primary">
            {(data?.transferCount ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-tx-muted mt-1">Indexed Transfers</div>
        </div>
        <div className="p-4 rounded-xl border border-bd-primary bg-th-surface text-center">
          <div className="text-2xl font-bold text-tx-primary">
            {(data?.uniqueAddresses ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-tx-muted mt-1">Unique Addresses</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-bd-primary">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? "text-tx-primary"
                : "text-tx-muted hover:text-tx-secondary"
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 text-xs text-tx-faint">({tab.count.toLocaleString()})</span>
            )}
            {activeTab === tab.id && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: tokenColor }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "transfers" && (
        <TransfersTab
          transfers={data?.transfers || []}
          tokenSymbol={tokenSymbol}
          tokenDecimals={tokenDecimals}
        />
      )}
      {activeTab === "holders" && (
        <HoldersTab
          holders={holders}
          loading={holdersLoading}
          tokenSymbol={tokenSymbol}
          tokenDecimals={tokenDecimals}
          tokenColor={tokenColor}
        />
      )}
      {activeTab === "events" && (
        <EventsTab
          events={events}
          loading={eventsLoading}
          total={eventsTotal}
          tokenDecimals={tokenDecimals}
          tokenSymbol={tokenSymbol}
          tokenColor={tokenColor}
        />
      )}
    </div>
  );
}

// ── Transfers Tab ────────────────────────────────────────────

function TransfersTab({
  transfers,
  tokenSymbol,
  tokenDecimals,
}: {
  transfers: Transfer[];
  tokenSymbol: string;
  tokenDecimals: number;
}) {
  if (transfers.length === 0) {
    return (
      <div className="rounded-xl border border-bd-primary bg-th-surface overflow-hidden">
        <EmptyState
          title="No transfers yet"
          description="Token transfers will appear here once indexed by the explorer."
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-bd-primary bg-th-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-tx-muted text-xs border-b border-bd-secondary">
              <th className="px-5 py-2 text-left font-medium">Tx Hash</th>
              <th className="px-5 py-2 text-left font-medium">Action</th>
              <th className="px-5 py-2 text-left font-medium">From</th>
              <th className="px-5 py-2 text-left font-medium">To</th>
              <th className="px-5 py-2 text-right font-medium">Amount</th>
              <th className="px-5 py-2 text-right font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((t, i) => (
              <tr key={`${t.txHash}-${i}`} className="border-b border-bd-secondary last:border-0 hover:bg-th-elevated transition-colors">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <a
                      href={etherscanLink("tx", t.txHash, CHAIN_ID)}
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
                    <Link to={`/tx/${t.txHash}`} className="text-accent-link hover:text-accent-link-hover font-mono text-sm">
                      {t.txHash.slice(0, 14)}...
                    </Link>
                    <CopyButton text={t.txHash} />
                  </div>
                </td>
                <td className="px-5 py-2.5 text-sm text-tx-secondary">{t.action}</td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/address/${t.fromAddress}`} className="font-mono text-xs text-accent-link hover:text-accent-link-hover hover:underline">
                      {truncateAddress(t.fromAddress)}
                    </Link>
                    <CopyButton text={t.fromAddress} />
                  </div>
                </td>
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/address/${t.toAddress}`} className="font-mono text-xs text-accent-link hover:text-accent-link-hover hover:underline">
                      {truncateAddress(t.toAddress)}
                    </Link>
                    <CopyButton text={t.toAddress} />
                  </div>
                </td>
                <td className="px-5 py-2.5 text-right font-mono text-tx-primary whitespace-nowrap">
                  {formatTokenAmount(t.amount, t.decimals ?? tokenDecimals, 4)}{" "}
                  <span className="text-tx-muted text-xs">{t.tokenSymbol || tokenSymbol}</span>
                </td>
                <td className="px-5 py-2.5 text-right text-tx-muted whitespace-nowrap" title={new Date(t.timestamp).toLocaleString()}>
                  {timeAgo(t.timestamp)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Holders Tab ─────────────────────────────────────────────

// Link color values from CSS vars (light: #B45309, dark: #fbd34d)
const LINK_COLORS = new Set(["#b45309", "#fbd34d"]);

function HoldersTab({
  holders,
  loading,
  tokenSymbol,
  tokenDecimals,
  tokenColor,
}: {
  holders: Holder[];
  loading: boolean;
  tokenSymbol: string;
  tokenDecimals: number;
  tokenColor: string;
}) {
  // If tokenColor matches the default link color, use fallback so contracts stand out
  const contractColor = LINK_COLORS.has(tokenColor.toLowerCase())
    ? "#1980c3"
    : tokenColor;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-tx-muted text-sm">Loading holders...</div>
      </div>
    );
  }

  if (holders.length === 0) {
    return (
      <div className="rounded-xl border border-bd-primary bg-th-surface overflow-hidden">
        <EmptyState
          title="No holders found"
          description="Holder data is derived from indexed transfers. Holders will appear as transfers are recorded."
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-bd-primary bg-th-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-tx-muted text-xs border-b border-bd-secondary">
              <th className="px-5 py-2 text-left font-medium w-16">Rank</th>
              <th className="px-5 py-2 text-left font-medium">Address</th>
              <th className="px-5 py-2 text-right font-medium">Balance</th>
              <th className="px-5 py-2 text-right font-medium">Value</th>
            </tr>
          </thead>
          <tbody>
            {holders.map((h) => {
              const num = Number(BigInt(h.balance)) / Math.pow(10, tokenDecimals);
              const formatted = num.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 3,
              });
              return (
                <tr key={h.address} className="border-b border-bd-secondary last:border-0 hover:bg-th-elevated transition-colors">
                  <td className="px-5 py-2.5 text-tx-muted">#{h.rank}</td>
                  <td className="px-5 py-2.5">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/address/${h.address}`}
                        className={`font-mono hover:underline text-xs break-all ${h.isContract ? "" : "text-accent-link hover:text-accent-link-hover"}`}
                        style={h.isContract ? { color: contractColor } : undefined}
                        title={h.address}
                      >
                        {h.address}
                      </a>
                      <CopyButton text={h.address} />
                      {h.isContract && (
                        <span
                          className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            backgroundColor: `${contractColor}15`,
                            color: contractColor,
                            border: `1px solid ${contractColor}30`,
                          }}
                          title="Contract"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                          </svg>
                          Contract
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-tx-primary whitespace-nowrap">
                    {formatted}{" "}
                    <span className="text-tx-muted text-xs">{tokenSymbol}</span>
                  </td>
                  <td className="px-5 py-2.5 text-right text-tx-faint whitespace-nowrap">
                    —
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Events Tab (Etherscan-style) ────────────────────────────

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

function EventRow({
  evt,
  tokenDecimals,
  tokenSymbol,
  tokenColor,
}: {
  evt: TokenEvent;
  tokenDecimals: number;
  tokenSymbol: string;
  tokenColor: string;
}) {
  const [hexMode, setHexMode] = useState(false);

  const decoded = evt.decoded || {};
  const rawValue = evt.data || "0";
  const decValue = decoded.value || "0";

  // Format the decimal display value
  let formattedDecValue: string;
  try {
    formattedDecValue = formatTokenAmount(decValue, tokenDecimals, 6);
  } catch {
    formattedDecValue = decValue;
  }

  return (
    <tr className="border-b border-bd-secondary last:border-0 align-top hover:bg-th-elevated/50 transition-colors">
      {/* Tx Hash */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <a
            href={etherscanLink("tx", evt.transactionHash, CHAIN_ID)}
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
          <Link
            to={`/tx/${evt.transactionHash}`}
            className="font-mono text-xs text-accent-link hover:text-accent-link-hover"
          >
            {evt.transactionHash.slice(0, 14)}...
          </Link>
          <CopyButton text={evt.transactionHash} />
        </div>
      </td>

      {/* Block */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs text-accent-link">
            {evt.blockNumber.toLocaleString()}
          </span>
          <a
            href={etherscanLink("block", evt.blockNumber, CHAIN_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-tx-faint hover:text-tx-muted"
            title="View block on Etherscan"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </td>

      {/* Age */}
      <td className="px-4 py-3 text-xs text-tx-muted whitespace-nowrap">
        {evt.timestamp ? timeAgo(evt.timestamp) : "—"}
      </td>

      {/* Method */}
      <td className="px-4 py-3">
        <span className="inline-block px-2.5 py-1 rounded-md text-[10px] font-mono bg-th-elevated text-tx-muted border border-bd-secondary truncate max-w-[90px]" title="transfer(address,uint256)">
          0xddf252ad
        </span>
      </td>

      {/* Logs */}
      <td className="px-4 py-3">
        <div className="space-y-2">
          {/* Event Signature */}
          <div className="flex items-start gap-1.5 text-xs">
            <span className="text-tx-faint mt-px shrink-0">&gt;</span>
            <div>
              <span className="font-semibold" style={{ color: tokenColor }}>
                Transfer
              </span>
              <span className="text-tx-faint"> (</span>
              <span className="text-tx-muted">index_topic_1 </span>
              <span className="text-cyan-500">address </span>
              <span className="text-tx-secondary">from</span>
              <span className="text-tx-faint">, </span>
              <span className="text-tx-muted">index_topic_2 </span>
              <span className="text-cyan-500">address </span>
              <span className="text-tx-secondary">to</span>
              <span className="text-tx-faint">, </span>
              <span className="text-cyan-500">uint256 </span>
              <span className="text-tx-secondary">{tokenSymbol.toLowerCase()}</span>
              <span className="text-tx-faint">)</span>
            </div>
          </div>

          {/* Topic 0 - Event signature hash */}
          <div className="flex items-center gap-2 text-xs pl-4">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-th-elevated text-tx-faint text-[10px] font-mono border border-bd-secondary shrink-0">
              0
            </span>
            <span className="font-mono text-tx-faint text-[11px] truncate" title={TRANSFER_TOPIC}>
              {TRANSFER_TOPIC.slice(0, 20)}...{TRANSFER_TOPIC.slice(-8)}
            </span>
          </div>

          {/* Topic 1 - from */}
          {decoded.from && (
            <div className="flex items-center gap-2 text-xs pl-4 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-th-elevated text-tx-faint text-[10px] font-mono border border-bd-secondary shrink-0">
                1: <span className="text-tx-secondary">from</span>
              </span>
              <span className="text-tx-faint">→</span>
              <Link
                to={`/address/${decoded.from}`}
                className="font-mono text-[11px] text-accent-link hover:text-accent-link-hover hover:underline break-all"
              >
                {decoded.from}
              </Link>
              <CopyButton text={decoded.from} />
            </div>
          )}

          {/* Topic 2 - to */}
          {decoded.to && (
            <div className="flex items-center gap-2 text-xs pl-4 flex-wrap">
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-th-elevated text-tx-faint text-[10px] font-mono border border-bd-secondary shrink-0">
                2: <span className="text-tx-secondary">to</span>
              </span>
              <span className="text-tx-faint">→</span>
              <Link
                to={`/address/${decoded.to}`}
                className="font-mono text-[11px] text-accent-link hover:text-accent-link-hover hover:underline break-all"
              >
                {decoded.to}
              </Link>
              <CopyButton text={decoded.to} />
            </div>
          )}

          {/* Data - value */}
          <div className="flex items-center justify-between gap-3 text-xs pl-4 mt-1">
            <div className="text-tx-muted">
              <span className="text-tx-secondary">{tokenSymbol.toLowerCase()}</span>
              <span className="text-tx-faint"> (uint256) : </span>
              <span className="font-mono text-tx-primary">
                {hexMode ? rawValue : `${formattedDecValue} (${decValue})`}
              </span>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setHexMode(false)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  !hexMode
                    ? "bg-white text-black dark:bg-black dark:text-white border border-gray-300 dark:border-gray-600"
                    : "bg-th-elevated text-tx-muted hover:text-tx-secondary border border-bd-secondary"
                }`}
              >
                Dec
              </button>
              <button
                onClick={() => setHexMode(true)}
                className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                  hexMode
                    ? "bg-white text-black dark:bg-black dark:text-white border border-gray-300 dark:border-gray-600"
                    : "bg-th-elevated text-tx-muted hover:text-tx-secondary border border-bd-secondary"
                }`}
              >
                Hex
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

function EventsTab({
  events,
  loading,
  total,
  tokenDecimals,
  tokenSymbol,
  tokenColor,
}: {
  events: TokenEvent[];
  loading: boolean;
  total: number;
  tokenDecimals: number;
  tokenSymbol: string;
  tokenColor: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-tx-muted text-sm">Loading events...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-bd-primary bg-th-surface overflow-hidden">
        <EmptyState
          title="No recent events"
          description="Contract event logs will appear here once indexed."
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs text-tx-muted">
        Latest {events.length} Contract Events
      </div>
      <div className="rounded-xl border border-bd-primary bg-th-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-tx-muted text-xs border-b border-bd-secondary">
                <th className="px-4 py-2.5 text-left font-medium">Transaction Hash</th>
                <th className="px-4 py-2.5 text-left font-medium">Block</th>
                <th className="px-4 py-2.5 text-left font-medium">Age</th>
                <th className="px-4 py-2.5 text-left font-medium">Method</th>
                <th className="px-4 py-2.5 text-left font-medium">Logs</th>
              </tr>
            </thead>
            <tbody>
              {events.map((evt, i) => (
                <EventRow
                  key={`${evt.transactionHash}-${i}`}
                  evt={evt}
                  tokenDecimals={tokenDecimals}
                  tokenSymbol={tokenSymbol}
                  tokenColor={tokenColor}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
