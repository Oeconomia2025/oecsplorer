import { useState, useEffect } from "react";
import { PROTOCOLS } from "@/utils/constants";
import { ProtocolIcon } from "@/components/shared";
import { fetchStats } from "@/services/api";
import type { ProtocolId } from "@/utils/constants";

export default function StatsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats()
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-tx-muted">Loading statistics...</span>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="text-sm text-tx-muted">Failed to load statistics.</span>
      </div>
    );
  }

  // Find the max daily count for bar chart scaling
  const maxDailyCount = Math.max(...stats.dailyCounts.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-tx-primary">Statistics</h1>
        <a
          href="https://oeconomia.io"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg transition-colors"
          style={{
            background: "linear-gradient(135deg, #da1cfe18, #11c4fe18)",
            border: "1px solid rgba(218, 28, 254, 0.3)",
            color: "#da1cfe",
          }}
        >
          <img
            src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo.png"
            alt="OEC"
            className="w-5 h-5 object-contain"
          />
          Detailed Stats on Oeconomia.io
        </a>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Total Transactions" value={stats.totalTransactions.toLocaleString()} color="#da1cfe" />
        <MetricCard label="Last 24h" value={stats.txLast24h.toLocaleString()} color="#11c4fe" />
        <MetricCard label="Last 7 Days" value={stats.txLast7d.toLocaleString()} color="#ae65fc" />
        <MetricCard label="Unique Wallets" value={stats.uniqueUsersTotal.toLocaleString()} color="#f8e6d8" />
      </div>

      {/* 7-Day Activity Bar Chart */}
      <div className="p-6 rounded-xl border border-bd-primary bg-th-surface">
        <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-4">
          7-Day Transaction Activity
        </h2>
        <div className="flex items-end gap-2 h-40">
          {stats.dailyCounts.map((day: any) => {
            const heightPercent = (day.count / maxDailyCount) * 100;
            const dayLabel = new Date(day.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short" });
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-tx-muted">{day.count}</span>
                <div className="w-full relative" style={{ height: "120px" }}>
                  <div
                    className="absolute bottom-0 w-full rounded-t-md transition-all"
                    style={{
                      height: `${Math.max(heightPercent, 2)}%`,
                      background: "linear-gradient(180deg, #da1cfe, #ae65fc)",
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs text-tx-faint">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Protocol Breakdown */}
      <div className="p-6 rounded-xl border border-bd-primary bg-th-surface">
        <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-4">
          Protocol Breakdown
        </h2>
        <div className="space-y-3">
          {stats.protocolBreakdown
            .sort((a: any, b: any) => b.total - a.total)
            .map((pb: any) => {
              const config = PROTOCOLS[pb.protocol as ProtocolId];
              if (!config) return null;
              const percentage = stats.totalTransactions > 0
                ? ((pb.total / stats.totalTransactions) * 100).toFixed(1)
                : "0";
              return (
                <div key={pb.protocol} className="flex items-center gap-3">
                  <ProtocolIcon protocol={pb.protocol} size="md" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-tx-primary font-medium">{config.name}</span>
                      <span className="text-sm text-tx-secondary font-mono">{pb.total.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-th-elevated overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: config.color,
                          minWidth: pb.total > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-tx-muted">{percentage}% of total</span>
                      <span className="text-xs text-tx-faint">{pb.last24h} in 24h</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl border border-bd-primary bg-th-surface">
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
            User Activity
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-tx-muted">Total unique wallets</span>
              <span className="text-sm font-mono text-tx-primary">{stats.uniqueUsersTotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-tx-muted">Active wallets (24h)</span>
              <span className="text-sm font-mono text-tx-primary">{stats.uniqueUsers24h}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-tx-muted">Avg tx per wallet</span>
              <span className="text-sm font-mono text-tx-primary">
                {stats.uniqueUsersTotal > 0
                  ? (stats.totalTransactions / stats.uniqueUsersTotal).toFixed(1)
                  : "0"}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-bd-primary bg-th-surface">
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
            Network Info
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-tx-muted">Network</span>
              <span className="text-sm text-tx-primary">Sepolia Testnet</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-tx-muted">Protocols tracked</span>
              <span className="text-sm font-mono text-tx-primary">{Object.keys(PROTOCOLS).length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-tx-muted">Most active protocol</span>
              <span className="text-sm text-tx-primary">
                {PROTOCOLS[stats.mostActiveProtocol as ProtocolId]?.name || stats.mostActiveProtocol}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Link to Oeconomia.io */}
      <div className="p-6 rounded-xl border text-center" style={{
        borderColor: "rgba(218, 28, 254, 0.2)",
        background: "linear-gradient(135deg, rgba(218, 28, 254, 0.05), rgba(17, 196, 254, 0.05))",
      }}>
        <img
          src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo.png"
          alt="OEC"
          className="w-12 h-12 object-contain mx-auto mb-3"
        />
        <h3 className="text-sm font-semibold text-tx-primary mb-1">More detailed analytics available</h3>
        <p className="text-xs text-tx-muted mb-4">Visit Oeconomia.io for governance stats, staking metrics, protocol health, and treasury data.</p>
        <a
          href="https://oeconomia.io"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm px-5 py-2.5 rounded-lg font-medium transition-colors"
          style={{
            background: "linear-gradient(135deg, #da1cfe, #ae65fc)",
            color: "#fff",
          }}
        >
          Visit Oeconomia.io
        </a>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      className="p-4 rounded-xl border"
      style={{
        borderColor: `${color}15`,
        background: `linear-gradient(135deg, ${color}08, transparent)`,
      }}
    >
      <div className="text-xs text-tx-muted mb-1">{label}</div>
      <div className="text-xl font-bold text-tx-primary">{value}</div>
    </div>
  );
}
