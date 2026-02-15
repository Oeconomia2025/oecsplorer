import { useState } from "react";

const PROTOCOLS = {
  oeconomia: { name: "Oeconomia", color: "#C9A84C", icon: "⚡", role: "Governance Hub" },
  alluria: { name: "Alluria", color: "#3B82F6", icon: "🏦", role: "Lending / ALUD" },
  eloqura: { name: "Eloqura", color: "#8B5CF6", icon: "🔄", role: "DEX / AMM / Bridge" },
  artivya: { name: "Artivya", color: "#EC4899", icon: "🎨", role: "Trading / NFTs" },
  iridescia: { name: "Iridescia", color: "#10B981", icon: "🛠", role: "Dev Infrastructure" },
};

const PHASES = [
  {
    id: 1,
    title: "Core Explorer",
    weeks: "Weeks 1–2",
    tasks: [
      "Backend + Alchemy SDK connection",
      "ABI decoder for all 5 protocols",
      "Transaction search + detail pages",
      "Wallet address lookup + balances",
      "PostgreSQL schema + indexing",
    ],
  },
  {
    id: 2,
    title: "Real-Time + Dashboards",
    weeks: "Weeks 3–4",
    tasks: [
      "Alchemy webhooks for all contracts",
      "WebSocket live transaction feed",
      "Protocol-specific dashboards",
      "Alluria vault tracker",
      "Eloqura swaps + TradingView",
    ],
  },
  {
    id: 3,
    title: "Advanced Features",
    weeks: "Weeks 5–6",
    tasks: [
      "Cross-protocol wallet portfolio",
      "Protocol metrics + charts",
      "Guardian leaderboard",
      "Integration with Oeconomia hub",
      "Token pages + price history",
    ],
  },
  {
    id: 4,
    title: "Polish + Ship",
    weeks: "Weeks 7–8",
    tasks: [
      "Mobile responsive design",
      "Redis caching layer",
      "Public API documentation",
      "Embed into main hub site",
      "Performance optimization",
    ],
  },
];

const ARCHITECTURE_LAYERS = [
  {
    id: "frontend",
    label: "Frontend",
    tech: "React / TypeScript / Tailwind",
    color: "#C9A84C",
    items: ["Explorer Search", "Wallet Portfolio", "Protocol Dashboards", "TradingView Charts"],
  },
  {
    id: "backend",
    label: "Backend",
    tech: "Node.js / Express",
    color: "#8B5CF6",
    items: ["REST + WebSocket API", "ABI Event Decoder", "Webhook Listener", "Transaction Indexer"],
  },
  {
    id: "data",
    label: "Data Layer",
    tech: "PostgreSQL / Redis / Alchemy",
    color: "#3B82F6",
    items: ["PostgreSQL (decoded txs)", "Redis (cache + pub/sub)", "Alchemy (RPC + Enhanced APIs)", "Alchemy Notify (webhooks)"],
  },
];

const PAGES = [
  { path: "/", desc: "Dashboard — protocol overview + live activity feed" },
  { path: "/tx/:hash", desc: "Decoded transaction detail (protocol-aware)" },
  { path: "/address/:addr", desc: "Wallet portfolio across all 5 protocols" },
  { path: "/block/:num", desc: "Block detail + contained transactions" },
  { path: "/protocol/alluria", desc: "Vaults, liquidations, ALUD supply" },
  { path: "/protocol/eloqura", desc: "Swap history, pool TVL, TradingView" },
  { path: "/protocol/artivya", desc: "Order book, NFT marketplace activity" },
  { path: "/protocol/iridescia", desc: "Deployments, template usage stats" },
  { path: "/protocol/oeconomia", desc: "Proposals, voting, guardians" },
  { path: "/tokens", desc: "OEC, ALUD, ALUR + tracked tokens" },
];

const COSTS = [
  { item: "Alchemy Free Tier", cost: "$0", note: "30M compute units/mo" },
  { item: "VPS Hosting", cost: "$10–24/mo", note: "Backend + DB + Redis" },
  { item: "Domain", cost: "$12/yr", note: "explorer.oeconomia.io" },
  { item: "Total at Launch", cost: "~$10–24/mo", note: "", highlight: true },
  { item: "Scaling (1K+ users)", cost: "~$50–100/mo", note: "Alchemy PAYG kicks in" },
];

const TABS = ["Architecture", "Pages", "Build Phases", "Costs"];

export default function OeconomiaExplorerArch() {
  const [activeTab, setActiveTab] = useState("Architecture");
  const [expandedLayer, setExpandedLayer] = useState(null);
  const [expandedPhase, setExpandedPhase] = useState(null);
  const [hoveredProtocol, setHoveredProtocol] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0A0B0F",
      color: "#E4E4E7",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'SF Mono', monospace",
    }}>
      {/* Header */}
      <div style={{
        padding: "32px 24px 20px",
        borderBottom: "1px solid rgba(201, 168, 76, 0.15)",
        background: "linear-gradient(180deg, rgba(201, 168, 76, 0.06) 0%, transparent 100%)",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: "linear-gradient(135deg, #C9A84C, #8B6914)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18, fontWeight: 700, color: "#0A0B0F",
            }}>
              O
            </div>
            <span style={{ fontSize: 13, color: "#C9A84C", letterSpacing: 3, textTransform: "uppercase" }}>
              Oeconomia Protocol
            </span>
          </div>
          <h1 style={{
            fontSize: 28, fontWeight: 700, margin: "8px 0 6px",
            background: "linear-gradient(90deg, #E4E4E7, #A1A1AA)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            Explorer Architecture
          </h1>
          <p style={{ fontSize: 13, color: "#71717A", lineHeight: 1.6, maxWidth: 600 }}>
            Protocol-aware blockchain explorer for Alluria, Eloqura, Artivya, Iridescia & Oeconomia Governance
          </p>
        </div>
      </div>

      {/* Protocol Bar */}
      <div style={{
        padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.01)",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", gap: 8, flexWrap: "wrap",
        }}>
          {Object.entries(PROTOCOLS).map(([key, p]) => (
            <div
              key={key}
              onMouseEnter={() => setHoveredProtocol(key)}
              onMouseLeave={() => setHoveredProtocol(null)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: `1px solid ${hoveredProtocol === key ? p.color : "rgba(255,255,255,0.06)"}`,
                background: hoveredProtocol === key ? `${p.color}12` : "rgba(255,255,255,0.02)",
                cursor: "default",
                transition: "all 0.2s ease",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ fontSize: 15 }}>{p.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.name}</div>
                <div style={{ fontSize: 10, color: "#71717A" }}>{p.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        padding: "0 24px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.01)",
      }}>
        <div style={{
          maxWidth: 960, margin: "0 auto",
          display: "flex", gap: 0,
        }}>
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "14px 20px",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab ? "2px solid #C9A84C" : "2px solid transparent",
                color: activeTab === tab ? "#C9A84C" : "#71717A",
                fontSize: 13,
                fontWeight: activeTab === tab ? 600 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "all 0.2s ease",
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 24px 48px" }}>
        
        {/* Architecture Tab */}
        {activeTab === "Architecture" && (
          <div>
            <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 24, lineHeight: 1.7 }}>
              Three-layer architecture: React frontend consumes a Node.js backend that indexes decoded
              blockchain events via Alchemy. Click any layer to expand.
            </p>

            {/* Data Flow Arrow */}
            <div style={{ marginBottom: 24 }}>
              <div style={{
                padding: "12px 16px",
                background: "rgba(201, 168, 76, 0.06)",
                border: "1px solid rgba(201, 168, 76, 0.15)",
                borderRadius: 8,
                fontSize: 12,
                color: "#C9A84C",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}>
                <span>⚡</span>
                <span>Data Flow: Blockchain → Alchemy Webhook → ABI Decoder → PostgreSQL → Redis Cache → WebSocket → React UI</span>
              </div>
            </div>

            {/* Layers */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {ARCHITECTURE_LAYERS.map((layer) => {
                const isExpanded = expandedLayer === layer.id;
                return (
                  <div
                    key={layer.id}
                    onClick={() => setExpandedLayer(isExpanded ? null : layer.id)}
                    style={{
                      border: `1px solid ${isExpanded ? layer.color + "44" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10,
                      background: isExpanded ? `${layer.color}08` : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: "50%",
                          background: layer.color,
                          boxShadow: `0 0 8px ${layer.color}44`,
                        }} />
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600 }}>{layer.label}</div>
                          <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>{layer.tech}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 14,
                        color: "#71717A",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}>
                        ▼
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{
                        padding: "0 20px 16px",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 8,
                      }}>
                        {layer.items.map((item, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "10px 14px",
                              background: "rgba(0,0,0,0.3)",
                              borderRadius: 6,
                              fontSize: 12,
                              color: "#D4D4D8",
                              border: "1px solid rgba(255,255,255,0.04)",
                            }}
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Connection Lines Visual */}
            <div style={{ margin: "24px 0", textAlign: "center" }}>
              <div style={{
                display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 4,
                padding: "16px 24px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize: 11, color: "#71717A", letterSpacing: 1 }}>PROTOCOL EVENT DECODING</div>
                <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
                  {Object.entries(PROTOCOLS).map(([key, p]) => (
                    <div key={key} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: `${p.color}18`,
                        border: `1px solid ${p.color}33`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 14,
                      }}>
                        {p.icon}
                      </div>
                      <div style={{ fontSize: 9, color: p.color, fontWeight: 600 }}>
                        {key === "oeconomia" ? "OEC" : key === "alluria" ? "ALUR" : p.name.slice(0, 4).toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: 10, color: "#52525B", marginTop: 8, maxWidth: 400, lineHeight: 1.5 }}>
                  Each protocol's ABI is loaded into the decoder service. Raw transactions are classified by contract 
                  address, decoded into human-readable actions, and stored with protocol tags.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pages Tab */}
        {activeTab === "Pages" && (
          <div>
            <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 20, lineHeight: 1.7 }}>
              Frontend routes — every page is protocol-aware and decodes raw blockchain data into 
              human-readable Oeconomia ecosystem activity.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {PAGES.map((page, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px 18px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 8,
                    display: "flex",
                    gap: 16,
                    alignItems: "baseline",
                    transition: "border-color 0.2s ease",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(201, 168, 76, 0.25)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"}
                >
                  <code style={{
                    fontSize: 12,
                    color: "#C9A84C",
                    fontFamily: "inherit",
                    minWidth: 180,
                    flexShrink: 0,
                  }}>
                    {page.path}
                  </code>
                  <span style={{ fontSize: 12, color: "#71717A" }}>{page.desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Build Phases Tab */}
        {activeTab === "Build Phases" && (
          <div>
            <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 20, lineHeight: 1.7 }}>
              8-week build plan from core explorer to full integration with the Oeconomia hub.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {PHASES.map((phase) => {
                const isExpanded = expandedPhase === phase.id;
                const progress = 0;
                return (
                  <div
                    key={phase.id}
                    onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                    style={{
                      border: `1px solid ${isExpanded ? "#C9A84C33" : "rgba(255,255,255,0.06)"}`,
                      borderRadius: 10,
                      background: isExpanded ? "rgba(201, 168, 76, 0.04)" : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      transition: "all 0.25s ease",
                      overflow: "hidden",
                    }}
                  >
                    <div style={{
                      padding: "16px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: "rgba(201, 168, 76, 0.1)",
                          border: "1px solid rgba(201, 168, 76, 0.2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 14, fontWeight: 700, color: "#C9A84C",
                        }}>
                          {phase.id}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{phase.title}</div>
                          <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>{phase.weeks}</div>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 14, color: "#71717A",
                        transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}>
                        ▼
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: "0 20px 16px" }}>
                        {phase.tasks.map((task, i) => (
                          <div
                            key={i}
                            style={{
                              padding: "10px 0",
                              borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              fontSize: 12,
                              color: "#A1A1AA",
                            }}
                          >
                            <div style={{
                              width: 16, height: 16, borderRadius: 4,
                              border: "1.5px solid #52525B",
                              flexShrink: 0,
                            }} />
                            {task}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Costs Tab */}
        {activeTab === "Costs" && (
          <div>
            <p style={{ fontSize: 13, color: "#A1A1AA", marginBottom: 20, lineHeight: 1.7 }}>
              Monthly infrastructure costs. Alchemy's free tier covers development and early users. 
              Pay As You Go kicks in only when you scale past 30M compute units.
            </p>
            <div style={{
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 10,
              overflow: "hidden",
            }}>
              {COSTS.map((row, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    background: row.highlight ? "rgba(201, 168, 76, 0.06)" : "transparent",
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: row.highlight ? 700 : 400,
                      color: row.highlight ? "#C9A84C" : "#D4D4D8",
                    }}>
                      {row.item}
                    </div>
                    {row.note && (
                      <div style={{ fontSize: 11, color: "#52525B", marginTop: 2 }}>{row.note}</div>
                    )}
                  </div>
                  <div style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: row.highlight ? "#C9A84C" : "#E4E4E7",
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {row.cost}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 20,
              padding: "16px 20px",
              background: "rgba(59, 130, 246, 0.06)",
              border: "1px solid rgba(59, 130, 246, 0.15)",
              borderRadius: 10,
              fontSize: 12,
              color: "#93C5FD",
              lineHeight: 1.7,
            }}>
              <strong>Alchemy Free Tier Breakdown:</strong> 30M compute units/month. A simple RPC call 
              like eth_blockNumber costs ~10 CUs, while eth_getLogs costs ~75 CUs. At an average of 25 CUs 
              per request, that's roughly 1.2M API calls/month for free — more than enough for development 
              and initial users. PAYG is $0.45 per million CUs after that.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
