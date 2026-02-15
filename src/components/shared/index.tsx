// ============================================================
// Oeconomia Explorer — Shared UI Components
// ============================================================

import React from "react";
import { PROTOCOLS } from "@/utils/constants";
import { truncateAddress, timeAgo } from "@/utils/formatters";
import type { ProtocolId } from "@/utils/constants";

// -- Protocol Icon ----------------------------------------------------------

export function ProtocolIcon({
  protocol,
  size = "sm",
  className = "",
}: {
  protocol: ProtocolId | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const config = PROTOCOLS[protocol as ProtocolId];
  const sizeClass = size === "lg" ? "w-8 h-8" : size === "md" ? "w-5 h-5" : "w-4 h-4";

  if (config?.logo) {
    return (
      <img
        src={config.logo}
        alt={config.shortName}
        className={`${sizeClass} rounded-full object-contain ${className}`}
      />
    );
  }
  return <span className={className}>{config?.icon || "?"}</span>;
}

// -- Protocol Badge ---------------------------------------------------------

export function ProtocolBadge({
  protocol,
  size = "sm",
}: {
  protocol: ProtocolId | string;
  size?: "sm" | "md";
}) {
  const config = PROTOCOLS[protocol as ProtocolId];
  if (!config) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-th-elevated text-tx-tertiary">
        Unknown
      </span>
    );
  }

  const padding = size === "md" ? "px-3 py-1" : "px-2 py-0.5";
  const fontSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${padding} rounded-md ${fontSize} font-medium`}
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <ProtocolIcon protocol={protocol} size={size === "md" ? "md" : "sm"} />
      <span>{config.shortName}</span>
    </span>
  );
}

// -- Address Link -----------------------------------------------------------

export function AddressLink({
  address,
  label,
  mono = true,
}: {
  address: string;
  label?: string;
  mono?: boolean;
}) {
  const displayText = label || truncateAddress(address);

  return (
    <a
      href={`/address/${address}`}
      className={`text-accent-link hover:text-accent-link-hover hover:underline transition-colors ${
        mono ? "font-mono" : ""
      }`}
      title={address}
    >
      {displayText}
    </a>
  );
}

// -- Token Amount -----------------------------------------------------------

export function TokenAmount({
  amount,
  symbol,
  decimals = 4,
  protocol,
}: {
  amount: string | number;
  symbol: string;
  decimals?: number;
  protocol?: ProtocolId;
}) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });

  const color = protocol ? PROTOCOLS[protocol]?.color : undefined;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-mono text-tx-primary">{formatted}</span>
      <span className="text-xs font-semibold" style={color ? { color } : undefined}>
        {!color && <span className="text-tx-tertiary">{symbol}</span>}
        {color && symbol}
      </span>
    </span>
  );
}

// -- Time Ago ---------------------------------------------------------------

export function TimeAgo({ timestamp }: { timestamp: Date | string | number }) {
  return (
    <span className="text-tx-muted text-sm" title={new Date(timestamp).toLocaleString()}>
      {timeAgo(timestamp)}
    </span>
  );
}

// -- Live Indicator ---------------------------------------------------------

export function LiveIndicator({ isLive = true }: { isLive?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span
        className="w-2 h-2 rounded-full"
        style={{
          backgroundColor: isLive ? "var(--status-live)" : "var(--tx-muted)",
          boxShadow: isLive ? "0 0 6px #22C55E44" : "none",
          animation: isLive ? "pulse 2s infinite" : "none",
        }}
      />
      <span className={isLive ? "text-status-success" : "text-tx-muted"}>
        {isLive ? "Live" : "Offline"}
      </span>
    </span>
  );
}

// -- Search Bar -------------------------------------------------------------

export function SearchBar({
  onSearch,
  placeholder = "Search by Tx Hash / Address / Block / Token...",
}: {
  onSearch: (query: string) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <div className="w-full max-w-2xl">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit(e)}
          placeholder={placeholder}
          className="w-full bg-input-bg border border-input-border rounded-lg px-4 py-3 pl-10 text-sm text-tx-primary placeholder-input-placeholder focus:outline-none focus:ring-1 font-mono transition-colors"
          style={{
            borderColor: undefined,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--input-focus-border)";
            e.currentTarget.style.boxShadow = "0 0 0 1px var(--input-focus-ring)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.boxShadow = "";
          }}
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tx-muted"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <button
          onClick={handleSubmit}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-btn-primary-bg text-btn-primary-text text-xs font-semibold rounded-md hover:opacity-80 transition-colors border border-btn-primary-border"
        >
          Search
        </button>
      </div>
    </div>
  );
}

// -- Copy Button ------------------------------------------------------------

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className={`transition-colors ${copied ? "text-status-success" : "text-tx-muted hover:text-tx-secondary"}`}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

// -- Empty State ------------------------------------------------------------

export function EmptyState({
  title = "No data yet",
  description = "Transactions will appear here once indexed.",
  icon = "📭",
  logoUrl,
}: {
  title?: string;
  description?: string;
  icon?: string;
  logoUrl?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {logoUrl ? (
        <img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover mb-4" />
      ) : (
        <span className="text-4xl mb-4">{icon}</span>
      )}
      <h3 className="text-lg font-semibold text-tx-secondary mb-1">{title}</h3>
      <p className="text-sm text-tx-muted max-w-md">{description}</p>
    </div>
  );
}
