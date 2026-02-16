// ============================================================
// The Five Protocols of the Pantheon — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./fiveprotocols.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "Eloqura: Swaps, Pools, and Automated Market Making", meta: "10 min read \u00B7 DEX" },
  { num: 2, title: "Alluria: Lending, Vaults, and the ALUD Stablecoin", meta: "10 min read \u00B7 Lending" },
  { num: 3, title: "Artivya: NFT Marketplace and Creator Tools", meta: "10 min read \u00B7 NFTs" },
  { num: 4, title: "Iridescia: Developer Infrastructure and Templates", meta: "8 min read \u00B7 Dev Tools" },
  { num: 5, title: "How Protocols Share Liquidity and Governance", meta: "10 min read \u00B7 Integration" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What type of protocol is Eloqura?",
    options: [
      { letter: "A", text: "A lending and borrowing platform", correct: false },
      { letter: "B", text: "A decentralized exchange (DEX) with automated market making (AMM)", correct: true },
      { letter: "C", text: "An NFT marketplace for digital art", correct: false },
      { letter: "D", text: "A developer SDK and tooling platform", correct: false },
    ],
    correctMsg: "Correct! Eloqura is Oeconomia's DEX with automated market making, supporting both V2 and V3 pool types.",
    wrongMsg: "Not quite \u2014 Eloqura is a decentralized exchange (DEX) with automated market making (AMM).",
  },
  2: {
    question: "What is ALUD?",
    options: [
      { letter: "A", text: "Alluria's governance token used for voting", correct: false },
      { letter: "B", text: "A Layer 2 scaling solution for the Oeconomia ecosystem", correct: false },
      { letter: "C", text: "Alluria's crypto-backed stablecoin, minted by depositing ETH collateral into vaults", correct: true },
      { letter: "D", text: "A type of NFT standard used on Artivya", correct: false },
    ],
    correctMsg: "Correct! ALUD is Alluria's crypto-backed stablecoin pegged to $1, minted when users deposit ETH collateral into vaults.",
    wrongMsg: "Not quite \u2014 ALUD is Alluria's crypto-backed stablecoin, minted by depositing ETH collateral into vaults.",
  },
  3: {
    question: "What makes Artivya different from typical NFT marketplaces?",
    options: [
      { letter: "A", text: "It only supports digital art, not other NFT types", correct: false },
      { letter: "B", text: "It combines order book + AMM trading with an NFT marketplace, all decentralized", correct: true },
      { letter: "C", text: "It requires KYC verification to list NFTs", correct: false },
      { letter: "D", text: "It runs on a separate blockchain from the rest of Oeconomia", correct: false },
    ],
    correctMsg: "Correct! Artivya uniquely combines hybrid trading (order book + AMM) with a full decentralized NFT marketplace.",
    wrongMsg: "Not quite \u2014 Artivya stands out by combining order book + AMM trading with an NFT marketplace, all decentralized.",
  },
  4: {
    question: "What does Iridescia provide for developers?",
    options: [
      { letter: "A", text: "Only a JavaScript SDK for frontend development", correct: false },
      { letter: "B", text: "Free mainnet ETH for deploying contracts", correct: false },
      { letter: "C", text: "Contract templates, deployment tools, security frameworks, and SDKs for building on Oeconomia", correct: true },
      { letter: "D", text: "A centralized hosting platform for dApps", correct: false },
    ],
    correctMsg: "Correct! Iridescia provides a comprehensive developer toolkit including templates, deployment tools, security frameworks, and SDKs.",
    wrongMsg: "Not quite \u2014 Iridescia provides contract templates, deployment tools, security frameworks, and SDKs for building on Oeconomia.",
  },
  5: {
    question: "How are the five Oeconomia protocols connected?",
    options: [
      { letter: "A", text: "They run on separate blockchains and communicate via bridges", correct: false },
      { letter: "B", text: "They share liquidity, governance through OEC, and cross-reference each other for pricing and collateral", correct: true },
      { letter: "C", text: "They are completely independent with no shared infrastructure", correct: false },
      { letter: "D", text: "Only Eloqura connects to the others; the rest are standalone", correct: false },
    ],
    correctMsg: "Correct! The five protocols share liquidity, unified OEC governance, and cross-reference each other for pricing and collateral valuation.",
    wrongMsg: "Not quite \u2014 the protocols share liquidity, governance through OEC, and cross-reference each other for pricing and collateral.",
  },
};

const PROTOCOL_EXPLORER_DATA = [
  {
    id: "eloqura",
    name: "Eloqura",
    token: "ELOQ",
    tagline: "Decentralized Exchange & AMM",
    icon: "\uD83D\uDD04",
    iconClass: "defi",
    description: "Eloqura is the liquidity engine of the Oeconomia ecosystem. It provides decentralized token swaps through automated market making, supporting both V2 constant-product pools and V3 concentrated liquidity positions.",
    features: [
      "V2 constant-product and V3 concentrated liquidity pools",
      "Low-slippage token swaps across all ecosystem tokens",
      "Liquidity provision with trading fee rewards",
      "Integration with Uniswap V3 for extended liquidity",
    ],
    addresses: "Factory: 0x1a4C7849...952B3b8e | Router: 0x3f42823d...9C650f7AE",
    connection: "Eloqura provides price discovery and liquidity that all other protocols depend on for collateral valuation and token pricing.",
  },
  {
    id: "alluria",
    name: "Alluria",
    token: "ALUR",
    tagline: "Lending, Vaults & ALUD Stablecoin",
    icon: "\uD83C\uDFE6",
    iconClass: "lending",
    description: "Alluria enables collateralized lending and the minting of ALUD, a crypto-backed stablecoin pegged to $1. Users lock ETH in vaults and borrow ALUD against their collateral.",
    features: [
      "Collateralized vault system for ETH deposits",
      "ALUD stablecoin minting pegged to $1",
      "Automated liquidation for under-collateralized vaults",
      "Stability pool for bad debt absorption",
    ],
    addresses: "Vault: Sepolia deployment | ALUD Token: ERC-20 on Sepolia",
    connection: "Uses Eloqura pools for real-time collateral pricing. OEC governance controls vault parameters like collateral ratios.",
  },
  {
    id: "artivya",
    name: "Artivya",
    token: "ARTV",
    tagline: "NFT Marketplace & Hybrid Exchange",
    icon: "\uD83C\uDFA8",
    iconClass: "nft",
    description: "Artivya combines traditional order book trading with AMM pools, plus a full NFT marketplace where creators can mint, list, and sell NFTs with smart-contract-enforced royalties.",
    features: [
      "Full NFT marketplace with minting and listing",
      "On-chain royalty enforcement via smart contracts",
      "Hybrid trading: order book + AMM in one interface",
      "Collection management and creator analytics",
    ],
    addresses: "Marketplace: Sepolia deployment | ARTV Token: ERC-20 on Sepolia",
    connection: "Uses Eloqura for token pricing in NFT listings. Integrates with Alluria for potential NFT-collateralized borrowing.",
  },
  {
    id: "iridescia",
    name: "Iridescia",
    token: "IRID",
    tagline: "Developer Infrastructure & SDKs",
    icon: "\uD83D\uDEE0\uFE0F",
    iconClass: "dev",
    description: "Iridescia provides the developer toolkit for building on Oeconomia \u2014 pre-audited contract templates, one-click deployment, security monitoring, and comprehensive SDK access.",
    features: [
      "Pre-audited smart contract templates and patterns",
      "One-click deployment tools for Oeconomia protocols",
      "Security monitoring and audit frameworks",
      "SDK and API access for third-party integrations",
    ],
    addresses: "IRID Token: ERC-20 on Sepolia | SDK: npm package",
    connection: "Provides the building blocks that developers use to extend all other protocols in the ecosystem.",
  },
  {
    id: "governance",
    name: "OEC Governance Hub",
    token: "OEC",
    tagline: "Cross-Protocol Governance & Treasury",
    icon: "\uD83C\uDFDB\uFE0F",
    iconClass: "gov",
    description: "The governance hub is where OEC Guardian stakers propose and vote on decisions affecting all five protocols \u2014 treasury allocation, parameter changes, upgrades, and strategic direction.",
    features: [
      "Guardian staking with tiered voting power",
      "Proposal creation, discussion, and on-chain voting",
      "Treasury management across all protocols",
      "Cross-protocol parameter governance",
    ],
    addresses: "OEC Token: 0x2b2fb8df...2a06aba | Staking: Sepolia deployment",
    connection: "The central coordination layer \u2014 all protocol changes flow through OEC governance for approval.",
  },
];

export default function FiveProtocolsContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Protocol Explorer interactive state
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null);

  const toggleLesson = useCallback((n: number) => {
    setActiveLesson((prev) => (prev === n ? null : n));
  }, []);

  const markComplete = useCallback((n: number) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(n)) next.delete(n);
      else next.add(n);
      if (next.has(n) && n < 5) setTimeout(() => setActiveLesson(n + 1), 500);
      return next;
    });
  }, []);

  const handleQuiz = useCallback((quiz: number, correct: boolean) => {
    if (quizAnswers.has(quiz)) return;
    setQuizAnswers((prev) => new Map(prev).set(quiz, correct));
  }, [quizAnswers]);

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="fp101-quiz-section">
        <div className="fp101-quiz-title">Check Your Understanding</div>
        <div className="fp101-quiz-question">{q.question}</div>
        <div className="fp101-quiz-options">
          {q.options.map((opt) => {
            let cls = "fp101-quiz-option";
            if (answered) {
              cls += " disabled";
              if (opt.correct) cls += " correct";
            }
            return (
              <div key={opt.letter} className={cls} onClick={() => handleQuiz(quizNum, opt.correct)}>
                <span className="option-letter">{opt.letter}</span>
                <span>{opt.text}</span>
              </div>
            );
          })}
        </div>
        {answered && (
          <div className={`fp101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  /* ---- Protocol Explorer renderer ---- */
  const renderProtocolExplorer = () => {
    return (
      <div className="fp101-protocol-explorer">
        <div className="fp101-explorer-title">Interactive Protocol Explorer</div>
        <div className="fp101-explorer-cards">
          {PROTOCOL_EXPLORER_DATA.map((p) => (
            <div
              key={p.id}
              className={`fp101-explorer-card${expandedProtocol === p.id ? " expanded" : ""}`}
            >
              <div
                className="fp101-explorer-card-header"
                onClick={() => setExpandedProtocol(expandedProtocol === p.id ? null : p.id)}
              >
                <div className={`fp101-explorer-card-icon fp101-eco-icon ${p.iconClass}`}>{p.icon}</div>
                <div className="fp101-explorer-card-info">
                  <div className="fp101-explorer-card-name">{p.name}</div>
                  <div className="fp101-explorer-card-tagline">{p.tagline}</div>
                </div>
                <div className="fp101-explorer-card-token">${p.token}</div>
                <div className="fp101-explorer-card-toggle">{"\u25BC"}</div>
              </div>
              <div className="fp101-explorer-card-body">
                <div className="fp101-explorer-card-content">
                  <p>{p.description}</p>
                  <ul className="fp101-explorer-features">
                    {p.features.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                  <div className="fp101-explorer-addresses">{p.addresses}</div>
                  <div className="fp101-explorer-connection">
                    <strong>Ecosystem Connection:</strong> {p.connection}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fp101">
      {/* Progress bar */}
      <div className="fp101-progress">
        <div className="fp101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`fp101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="fp101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — Eloqura: Swaps, Pools, and Automated Market Making
          ============================================================ */}
      <div className={`fp101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="fp101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="fp101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="fp101-lesson-header-text">
            <div className="fp101-lesson-title">Eloqura: Swaps, Pools, and Automated Market Making</div>
            <div className="fp101-lesson-meta"><span>10 min read</span><span>DEX</span></div>
          </div>
          <div className="fp101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="fp101-lesson-content">
          <div className="fp101-lesson-body">
            <h3>The Liquidity Engine</h3>
            <p>
              Eloqura is Oeconomia's <strong>decentralized exchange (DEX)</strong> — the protocol that makes token trading possible without centralized intermediaries. Powered by its native <strong>ELOQ</strong> token, Eloqura uses automated market making (AMM) to enable instant token swaps. Instead of matching buyers with sellers like a traditional exchange, Eloqura uses liquidity pools — smart contracts holding reserves of token pairs that algorithmically determine prices.
            </p>
            <p>
              Eloqura supports both <strong>V2 (constant product)</strong> pools and <strong>V3 (concentrated liquidity)</strong> pools. V2 pools spread liquidity evenly across all prices — simple but capital-inefficient. V3 pools let liquidity providers concentrate their capital within specific price ranges, dramatically improving capital efficiency and reducing slippage for traders.
            </p>

            <h3>How AMM Trading Works</h3>
            <div className="fp101-three-col">
              <div className="fp101-col-card">
                <h4>Liquidity Pools</h4>
                <p>Token pairs (e.g., OEC/ETH) are deposited into smart contract pools. The pool holds reserves of both tokens and uses a mathematical formula to set prices.</p>
              </div>
              <div className="fp101-col-card">
                <h4>Price Discovery</h4>
                <p>V2 uses x * y = k (constant product). V3 uses concentrated liquidity curves. Both ensure prices adjust automatically based on supply and demand.</p>
              </div>
              <div className="fp101-col-card">
                <h4>Fee Earning</h4>
                <p>Every swap pays a fee (typically 0.3%) distributed to liquidity providers proportional to their share of the pool. This incentivizes liquidity provision.</p>
              </div>
            </div>

            <h3>Eloqura Contract Addresses (Sepolia)</h3>
            <div className="fp101-data-block">
              <div className="fp101-data-section-label">Deployed Contracts</div>
              <div className="fp101-data-row"><span className="fp101-data-label">Factory</span><span className="fp101-data-value">0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Router</span><span className="fp101-data-value">0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Pool Types</span><span className="fp101-data-value green">V2 + V3</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Fee Tiers</span><span className="fp101-data-value">500 (0.05%) / 3000 (0.3%) / 10000 (1%)</span></div>
            </div>

            <div className="fp101-info-box cyan">
              <div className="fp101-info-box-label">Uniswap V3 Integration</div>
              <p>
                Eloqura integrates with <strong>Uniswap V3</strong> for deeper liquidity on widely traded pairs. This means traders on Eloqura can access not just Eloqura's native pools, but also Uniswap's massive liquidity — giving users the best possible prices with minimal slippage. The router intelligently routes trades through whichever pool offers the best rate.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`fp101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Alluria: Lending, Vaults, and the ALUD Stablecoin
          ============================================================ */}
      <div className={`fp101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="fp101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="fp101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="fp101-lesson-header-text">
            <div className="fp101-lesson-title">Alluria: Lending, Vaults, and the ALUD Stablecoin</div>
            <div className="fp101-lesson-meta"><span>10 min read</span><span>Lending</span></div>
          </div>
          <div className="fp101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="fp101-lesson-content">
          <div className="fp101-lesson-body">
            <h3>The Credit Layer</h3>
            <p>
              Alluria is Oeconomia's <strong>lending and borrowing protocol</strong>, powered by its native <strong>ALUR</strong> token. At its core, Alluria lets users deposit ETH as collateral into smart contract vaults and mint <strong>ALUD</strong> — a crypto-backed stablecoin pegged to $1. Think of it like taking a loan against your house, except the "house" is ETH and the "bank" is a transparent smart contract.
            </p>
            <p>
              The key innovation is that no one approves or denies your loan — the smart contract handles everything. If your collateral is sufficient, you can mint ALUD instantly. If the value of your collateral drops below a safety threshold, the contract automatically liquidates your position to maintain system solvency.
            </p>

            <h3>Vault Mechanics</h3>
            <div className="fp101-data-block">
              <div className="fp101-data-section-label">How Alluria Vaults Work</div>
              <div className="fp101-data-row"><span className="fp101-data-label">Collateral Type</span><span className="fp101-data-value">ETH</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Minimum Collateral Ratio</span><span className="fp101-data-value amber">150%</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Liquidation Threshold</span><span className="fp101-data-value red">110%</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Stability Fee (APR)</span><span className="fp101-data-value">2-5% (governance-set)</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Stablecoin Output</span><span className="fp101-data-value green">ALUD (pegged to $1)</span></div>
            </div>

            <div className="fp101-info-box blue">
              <div className="fp101-info-box-label">How ALUD Maintains Its Peg</div>
              <p>
                ALUD maintains its $1 peg through several mechanisms. <strong>Over-collateralization</strong> ensures every ALUD is backed by more than $1 of ETH. <strong>Liquidation</strong> automatically sells under-collateralized vault positions to repay ALUD debt. The <strong>stability pool</strong> absorbs liquidated collateral, providing a buffer against bad debt. And <strong>arbitrage</strong> incentivizes traders to buy ALUD below $1 or sell above $1, naturally pushing the price back to peg.
              </p>
            </div>

            <h3>Example: Opening a Vault</h3>
            <div className="fp101-data-block">
              <div className="fp101-data-section-label">Vault Example (ETH at $2,500)</div>
              <div className="fp101-data-row"><span className="fp101-data-label">You Deposit</span><span className="fp101-data-value">2 ETH ($5,000)</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">At 150% ratio, max ALUD</span><span className="fp101-data-value green">3,333 ALUD</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Safe mint (200% ratio)</span><span className="fp101-data-value cyan">2,500 ALUD</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Liquidation price (at max)</span><span className="fp101-data-value red">ETH drops below $1,833</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Liquidation price (safe)</span><span className="fp101-data-value amber">ETH drops below $1,375</span></div>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`fp101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Artivya: NFT Marketplace and Creator Tools
          ============================================================ */}
      <div className={`fp101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="fp101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="fp101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="fp101-lesson-header-text">
            <div className="fp101-lesson-title">Artivya: NFT Marketplace and Creator Tools</div>
            <div className="fp101-lesson-meta"><span>10 min read</span><span>NFTs</span></div>
          </div>
          <div className="fp101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="fp101-lesson-content">
          <div className="fp101-lesson-body">
            <h3>Where Creativity Meets DeFi</h3>
            <p>
              Artivya is Oeconomia's <strong>hybrid exchange and NFT marketplace</strong>, powered by its native <strong>ARTV</strong> token. It's not just another NFT marketplace — Artivya combines traditional order book trading with AMM-style automated pools, plus a full-featured NFT platform where creators can mint, list, and sell digital assets with on-chain royalties enforced by smart contracts.
            </p>
            <p>
              The critical difference from centralized marketplaces like OpenSea is permanence and creator protection. On centralized platforms, NFTs can be delisted, royalties can be bypassed, and the platform can change its terms at any time. On Artivya, <strong>smart contracts guarantee</strong> that creator royalties are paid on every secondary sale — no platform can override the code.
            </p>

            <h3>Traditional vs. Artivya NFT Marketplace</h3>
            <div className="fp101-compare-grid">
              <div className="fp101-compare-card">
                <h4>{"\uD83C\uDFEC"} Traditional Marketplace</h4>
                <ul>
                  <li>Centralized company controls listings</li>
                  <li>Can delist NFTs at discretion</li>
                  <li>Royalties are optional / bypassable</li>
                  <li>Platform takes large commission fees</li>
                  <li>Creator has limited control post-sale</li>
                  <li>Metadata can be altered or removed</li>
                </ul>
              </div>
              <div className="fp101-compare-card">
                <h4>{"\uD83C\uDFA8"} Artivya</h4>
                <ul>
                  <li>Fully decentralized — no central control</li>
                  <li>Listings are permanent on-chain</li>
                  <li>Royalties enforced by smart contract code</li>
                  <li>Minimal, transparent protocol fees</li>
                  <li>Creator royalties on every secondary sale</li>
                  <li>Immutable metadata stored on IPFS</li>
                </ul>
              </div>
            </div>

            <h3>Hybrid Trading</h3>
            <p>
              Artivya's token trading combines two approaches. The <strong>order book</strong> allows traders to place limit orders at specific prices — ideal for precise entries and exits. The <strong>AMM pools</strong> provide instant execution at market prices with deep liquidity. Users can choose which method best fits their trading style, or the router can automatically find the best execution across both.
            </p>

            <div className="fp101-info-box orange">
              <div className="fp101-info-box-label">On-Chain Royalties</div>
              <p>
                One of the biggest problems in the NFT space has been royalty enforcement. Many marketplaces allow buyers to skip royalty payments, cutting creators out of secondary sales revenue. Artivya solves this by encoding royalty percentages directly into the smart contract. <strong>Every transfer triggers a royalty payment</strong> — it's not optional, it's not bypassable, it's code. Creators earn on every sale, forever.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`fp101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Iridescia: Developer Infrastructure and Templates
          ============================================================ */}
      <div className={`fp101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="fp101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="fp101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="fp101-lesson-header-text">
            <div className="fp101-lesson-title">Iridescia: Developer Infrastructure and Templates</div>
            <div className="fp101-lesson-meta"><span>8 min read</span><span>Dev Tools</span></div>
          </div>
          <div className="fp101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="fp101-lesson-content">
          <div className="fp101-lesson-body">
            <h3>Building on Oeconomia</h3>
            <p>
              Iridescia is Oeconomia's <strong>developer infrastructure protocol</strong>, powered by its native <strong>IRID</strong> token. While the other four protocols serve end users (traders, borrowers, creators, governors), Iridescia serves <strong>developers</strong> — the people who build extensions, integrations, and new applications on top of the Oeconomia ecosystem.
            </p>
            <p>
              Smart contract development is hard. Security vulnerabilities can cost millions. Deployment is complex. Testing is time-consuming. Iridescia lowers these barriers by providing <strong>pre-audited templates, one-click deployment tools, security monitoring, and comprehensive SDKs</strong> — letting developers focus on building rather than reinventing infrastructure.
            </p>

            <h3>The Developer Toolkit</h3>
            <div className="fp101-three-col">
              <div className="fp101-col-card">
                <h4>Templates</h4>
                <p>Pre-audited smart contract patterns for common use cases: token creation, staking mechanisms, governance modules, vault systems, and marketplace logic. Battle-tested code that developers can customize.</p>
              </div>
              <div className="fp101-col-card">
                <h4>Deployment</h4>
                <p>One-click deployment tools that handle contract compilation, verification, and multi-chain deployment. Configure parameters through a UI instead of writing deployment scripts from scratch.</p>
              </div>
              <div className="fp101-col-card">
                <h4>Security</h4>
                <p>Real-time monitoring and alert frameworks that watch deployed contracts for suspicious activity, unusual transactions, or potential exploits. Plus audit checklists and formal verification tools.</p>
              </div>
            </div>

            <div className="fp101-info-box green">
              <div className="fp101-info-box-label">Lowering the Barrier</div>
              <p>
                In traditional software, developers can push a fix within minutes if something breaks. In smart contracts, <strong>bugs are permanent</strong> — deployed code can't be patched. This makes the cost of mistakes extremely high, which discourages new developers from entering the space. Iridescia's pre-audited templates and security frameworks dramatically reduce this risk, letting more developers build safely and confidently on Oeconomia.
              </p>
            </div>

            <h3>SDK and API Access</h3>
            <p>
              Iridescia provides a comprehensive SDK that abstracts away the complexity of interacting with Oeconomia's protocols. Developers can integrate Eloqura swaps, Alluria vault operations, Artivya NFT listings, and OEC governance into their own applications with simple API calls. The SDK handles wallet connections, transaction building, gas estimation, and error handling behind the scenes.
            </p>

            <div className="fp101-data-block">
              <div className="fp101-data-section-label">Iridescia SDK Capabilities</div>
              <div className="fp101-data-row"><span className="fp101-data-label">Eloqura Integration</span><span className="fp101-data-value green">Swap, add/remove liquidity, pool queries</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Alluria Integration</span><span className="fp101-data-value blue">Open vault, mint ALUD, check ratios</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Artivya Integration</span><span className="fp101-data-value orange">Mint NFT, list, buy, set royalties</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Governance Integration</span><span className="fp101-data-value purple">Create proposal, vote, check status</span></div>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`fp101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — How Protocols Share Liquidity and Governance
          ============================================================ */}
      <div className={`fp101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="fp101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="fp101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="fp101-lesson-header-text">
            <div className="fp101-lesson-title">How Protocols Share Liquidity and Governance</div>
            <div className="fp101-lesson-meta"><span>10 min read</span><span>Integration</span></div>
          </div>
          <div className="fp101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="fp101-lesson-content">
          <div className="fp101-lesson-body">
            <h3>The Pantheon: Five as One</h3>
            <p>
              The five Oeconomia protocols aren't isolated products — they form a <strong>coordinated system</strong> called the Pantheon. Like the ancient Roman Pantheon was a temple dedicated to all the gods working in harmony, Oeconomia's Pantheon is a financial ecosystem where five specialized protocols work as one integrated system. Each protocol strengthens the others.
            </p>

            <h3>Shared Liquidity</h3>
            <p>
              Liquidity doesn't live in silos. <strong>Eloqura's pools</strong> provide the pricing data that Alluria uses to value collateral in real-time. When ETH prices change on Eloqura, Alluria's vault health checks update automatically. Artivya references Eloqura's pricing for token valuations in NFT listings. This shared liquidity layer means all protocols operate on the same consistent price data.
            </p>

            <h3>Unified Governance</h3>
            <p>
              While each protocol has its own native token (ELOQ, ALUR, ARTV, IRID), <strong>OEC governs them all</strong>. Guardian stakers don't just vote on OEC-specific issues — they govern parameters across every protocol. Alluria's collateral ratios, Eloqura's fee tiers, Artivya's marketplace rules, and Iridescia's template approval processes are all governed through OEC proposals and votes.
            </p>

            <div className="fp101-stats-row">
              <div className="fp101-stat-card"><div className="fp101-stat-value">5</div><div className="fp101-stat-label">Interconnected Protocols</div></div>
              <div className="fp101-stat-card"><div className="fp101-stat-value">1</div><div className="fp101-stat-label">Unified Governance Token</div></div>
              <div className="fp101-stat-card"><div className="fp101-stat-value">{"\u221E"}</div><div className="fp101-stat-label">Cross-Protocol Composability</div></div>
            </div>

            <h3>Try It: Protocol Explorer</h3>
            {renderProtocolExplorer()}

            <div className="fp101-info-box purple">
              <div className="fp101-info-box-label">The Pantheon Concept</div>
              <p>
                The name "Pantheon" reflects the design philosophy: five specialized protocols working as one coordinated system, much like the five major protocols of the internet (HTTP, SMTP, FTP, DNS, TCP/IP) work together to power the web. No single protocol could create a complete financial ecosystem alone. But together — a DEX, a lending platform, an NFT marketplace, developer tools, and a governance hub — they cover the full spectrum of decentralized finance.
              </p>
            </div>

            <h3>Cross-Protocol Examples</h3>
            <div className="fp101-data-block">
              <div className="fp101-data-section-label">How Protocols Interact</div>
              <div className="fp101-data-row"><span className="fp101-data-label">Eloqura {"\u2192"} Alluria</span><span className="fp101-data-value">Price feeds for collateral valuation</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Eloqura {"\u2192"} Artivya</span><span className="fp101-data-value">Token pricing for NFT listings</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Alluria {"\u2192"} Eloqura</span><span className="fp101-data-value">ALUD liquidity in DEX pools</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">Iridescia {"\u2192"} All</span><span className="fp101-data-value">Developer tools for every protocol</span></div>
              <div className="fp101-data-row"><span className="fp101-data-label">OEC Gov {"\u2192"} All</span><span className="fp101-data-value">Parameter governance across all protocols</span></div>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`fp101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
