// ============================================================
// Oeconomia DAO: The Big Picture — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./oecdao.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "What the Oeconomia DAO Is and Its Mission", meta: "8 min read \u00B7 Overview" },
  { num: 2, title: "The OEC Token: Utility, Governance, and Staking", meta: "8 min read \u00B7 Tokenomics" },
  { num: 3, title: "How the Five Protocols Work Together", meta: "10 min read \u00B7 Ecosystem" },
  { num: 4, title: "Guardian Staking and Governance Power", meta: "10 min read \u00B7 Governance" },
  { num: 5, title: "The Roadmap: From Sepolia Testnet to Mainnet", meta: "8 min read \u00B7 Roadmap" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What type of organization is Oeconomia?",
    options: [
      { letter: "A", text: "A traditional corporation with a CEO and board of directors", correct: false },
      { letter: "B", text: "A Decentralized Autonomous Organization (DAO) governed by OEC token holders", correct: true },
      { letter: "C", text: "A government-regulated financial institution", correct: false },
      { letter: "D", text: "A nonprofit foundation run by volunteers", correct: false },
    ],
    correctMsg: "Correct! Oeconomia is a DAO where governance decisions are made by OEC token holders through smart contract voting.",
    wrongMsg: "Not quite \u2014 Oeconomia is a Decentralized Autonomous Organization (DAO) governed by OEC token holders.",
  },
  2: {
    question: "What are the three roles of the OEC token?",
    options: [
      { letter: "A", text: "Mining, trading, and staking", correct: false },
      { letter: "B", text: "Governance voting, staking for rewards, and utility across all five protocols", correct: true },
      { letter: "C", text: "Payments, remittances, and lending collateral", correct: false },
      { letter: "D", text: "Gas fees, validator rewards, and bridge collateral", correct: false },
    ],
    correctMsg: "Correct! OEC serves three roles: governance voting power, staking for rewards, and cross-protocol utility.",
    wrongMsg: "Not quite \u2014 the three roles are governance voting, staking for rewards, and utility across all five protocols.",
  },
  3: {
    question: "How many protocols are in the Oeconomia ecosystem?",
    options: [
      { letter: "A", text: "Three \u2014 Eloqura, Alluria, and the OEC hub", correct: false },
      { letter: "B", text: "Four \u2014 one for each DeFi category", correct: false },
      { letter: "C", text: "Five \u2014 Eloqura, Alluria, Artivya, Iridescia, and the OEC governance hub", correct: true },
      { letter: "D", text: "Seven \u2014 including Layer 2 scaling protocols", correct: false },
    ],
    correctMsg: "Correct! The five protocols are Eloqura (DEX), Alluria (Lending), Artivya (NFT/Trading), Iridescia (Dev Tools), and the OEC governance hub.",
    wrongMsg: "Not quite \u2014 there are five protocols: Eloqura, Alluria, Artivya, Iridescia, and the OEC governance hub.",
  },
  4: {
    question: "What is a Guardian in the Oeconomia ecosystem?",
    options: [
      { letter: "A", text: "A smart contract auditor hired by the DAO", correct: false },
      { letter: "B", text: "An OEC staker who has locked tokens to earn governance power and voting rights", correct: true },
      { letter: "C", text: "A validator node operator running blockchain infrastructure", correct: false },
      { letter: "D", text: "A community moderator on social media channels", correct: false },
    ],
    correctMsg: "Correct! Guardians are OEC stakers who lock their tokens for a period to earn governance power and participate in DAO voting.",
    wrongMsg: "Not quite \u2014 a Guardian is an OEC staker who has locked tokens to earn governance power and voting rights.",
  },
  5: {
    question: "Why is Oeconomia deployed on a testnet first?",
    options: [
      { letter: "A", text: "Because mainnet is too expensive for any project", correct: false },
      { letter: "B", text: "To thoroughly test smart contracts and gather community feedback before real funds are at risk", correct: true },
      { letter: "C", text: "Because testnets are faster than mainnet", correct: false },
      { letter: "D", text: "Regulatory requirements mandate testnet deployment first", correct: false },
    ],
    correctMsg: "Correct! Testnet deployment allows thorough testing and community feedback before real value is at stake.",
    wrongMsg: "Not quite \u2014 testnet deployment is for thoroughly testing smart contracts and gathering feedback before real funds are at risk.",
  },
};

const PROTOCOL_MAP = [
  {
    id: "eloqura",
    name: "Eloqura",
    token: "ELOQ",
    icon: "\uD83D\uDD04",
    iconClass: "defi",
    description: "Oeconomia's decentralized exchange (DEX) with automated market making. Supports both V2 constant-product and V3 concentrated liquidity pools.",
    features: ["Token swaps with low slippage", "Liquidity provision and fee earning", "V2 + V3 pool types", "Integration with Uniswap V3 for deeper liquidity"],
    connection: "Provides price discovery and token liquidity for all other protocols",
  },
  {
    id: "alluria",
    name: "Alluria",
    token: "ALUR",
    icon: "\uD83C\uDFE6",
    iconClass: "lending",
    description: "The lending and borrowing protocol. Users deposit ETH collateral into vaults and mint ALUD, a crypto-backed stablecoin pegged to $1.",
    features: ["Collateralized vault system", "ALUD stablecoin minting", "Liquidation mechanisms for solvency", "Stability pool for bad debt absorption"],
    connection: "Uses Eloqura for collateral pricing and OEC for governance over vault parameters",
  },
  {
    id: "artivya",
    name: "Artivya",
    token: "ARTV",
    icon: "\uD83C\uDFA8",
    iconClass: "nft",
    description: "A hybrid exchange combining order book trading with AMM, plus a full NFT marketplace with on-chain royalties.",
    features: ["NFT minting and marketplace", "On-chain royalty enforcement", "Hybrid order book + AMM trading", "Creator tools and collection management"],
    connection: "Uses Eloqura for token pricing and Alluria for NFT-collateralized lending",
  },
  {
    id: "iridescia",
    name: "Iridescia",
    token: "IRID",
    icon: "\uD83D\uDEE0\uFE0F",
    iconClass: "dev",
    description: "Developer infrastructure providing contract templates, deployment tools, security frameworks, and SDK access for building on Oeconomia.",
    features: ["Pre-audited contract templates", "One-click deployment tools", "Security monitoring frameworks", "SDK and API access"],
    connection: "Provides the building blocks for extending all other protocols",
  },
  {
    id: "governance",
    name: "Governance Hub",
    token: "OEC",
    icon: "\uD83C\uDFDB\uFE0F",
    iconClass: "gov",
    description: "The central governance layer where Guardian stakers vote on proposals affecting all five protocols, treasury allocation, and ecosystem direction.",
    features: ["Proposal creation and voting", "Treasury management", "Cross-protocol parameter governance", "Guardian tier system"],
    connection: "Coordinates governance across all protocols through OEC staking power",
  },
];

export default function OecDaoContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Ecosystem Map interactive state
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);

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
      <div className="od101-quiz-section">
        <div className="od101-quiz-title">Check Your Understanding</div>
        <div className="od101-quiz-question">{q.question}</div>
        <div className="od101-quiz-options">
          {q.options.map((opt) => {
            let cls = "od101-quiz-option";
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
          <div className={`od101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  /* ---- Ecosystem Map renderer ---- */
  const renderEcosystemMap = () => {
    const selected = PROTOCOL_MAP.find((p) => p.id === selectedProtocol);
    return (
      <div className="od101-ecosystem-map">
        <div className="od101-map-title">Interactive Ecosystem Map</div>
        <div className="od101-map-container">
          <div className="od101-map-center">OEC</div>
          <div className="od101-map-connector">{"\u2502"} {"\u2502"} {"\u2502"} {"\u2502"} {"\u2502"}</div>
          <div className="od101-map-nodes">
            {PROTOCOL_MAP.map((p) => (
              <div
                key={p.id}
                className={`od101-map-node${selectedProtocol === p.id ? " selected" : ""}`}
                onClick={() => setSelectedProtocol(selectedProtocol === p.id ? null : p.id)}
              >
                <div className={`od101-map-node-icon od101-eco-icon ${p.iconClass}`}>{p.icon}</div>
                <div className="od101-map-node-label">{p.name}</div>
              </div>
            ))}
          </div>
          {selected && (
            <div className="od101-map-detail">
              <h4>{selected.name}</h4>
              <div className="od101-map-detail-token">Token: ${selected.token}</div>
              <p>{selected.description}</p>
              <ul>
                {selected.features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
              <div className="od101-info-box" style={{ marginTop: 12, marginBottom: 0 }}>
                <div className="od101-info-box-label">Connection to OEC</div>
                <p>{selected.connection}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="od101">
      {/* Progress bar */}
      <div className="od101-progress">
        <div className="od101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`od101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="od101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — What the Oeconomia DAO Is and Its Mission
          ============================================================ */}
      <div className={`od101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="od101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="od101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="od101-lesson-header-text">
            <div className="od101-lesson-title">What the Oeconomia DAO Is and Its Mission</div>
            <div className="od101-lesson-meta"><span>8 min read</span><span>Overview</span></div>
          </div>
          <div className="od101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="od101-lesson-content">
          <div className="od101-lesson-body">
            <h3>A New Kind of Organization</h3>
            <p>
              Oeconomia is a <strong>Decentralized Autonomous Organization (DAO)</strong> building a comprehensive suite of DeFi protocols. Unlike traditional companies with CEOs, boards of directors, and closed-door decision-making, Oeconomia is governed entirely by its token holders through transparent, on-chain voting. Every decision — from treasury allocation to protocol upgrades — is proposed, debated, and executed through smart contracts.
            </p>
            <p>
              The mission is ambitious but clear: <strong>create accessible, transparent financial infrastructure</strong> that anyone can use, regardless of geography, wealth, or status. Traditional finance is gated — you need credit scores, bank accounts, minimum balances, and the right passport. Oeconomia's protocols are open to anyone with an internet connection and a wallet.
            </p>

            <h3>Traditional Company vs. DAO</h3>
            <div className="od101-compare-grid">
              <div className="od101-compare-card">
                <h4>{"\uD83C\uDFE2"} Traditional Company</h4>
                <ul>
                  <li>Led by a CEO and executive team</li>
                  <li>Board of directors makes strategic decisions</li>
                  <li>Decisions made behind closed doors</li>
                  <li>Shareholders have limited voting rights</li>
                  <li>Opaque financial reporting (quarterly)</li>
                  <li>Incorporated in a specific jurisdiction</li>
                  <li>Can censor or exclude users</li>
                </ul>
              </div>
              <div className="od101-compare-card">
                <h4>{"\uD83C\uDFDB\uFE0F"} Oeconomia DAO</h4>
                <ul>
                  <li>No CEO — governed by token holders</li>
                  <li>Smart contracts enforce decisions</li>
                  <li>All proposals and votes are public on-chain</li>
                  <li>Every OEC holder has governance power</li>
                  <li>Transparent treasury visible in real-time</li>
                  <li>Exists on the blockchain, jurisdiction-agnostic</li>
                  <li>Permissionless — anyone can participate</li>
                </ul>
              </div>
            </div>

            <div className="od101-info-box purple">
              <div className="od101-info-box-label">The Name "Oeconomia"</div>
              <p>
                The name comes from the Latin/Greek word <strong>oikonomia</strong> ({"\u03BF\u1F30\u03BA\u03BF\u03BD\u03BF\u03BC\u03AF\u03B1"}), meaning "household management." It is the direct origin of the modern English word "economy." The ancient concept encompassed not just money, but the art of managing resources wisely for the benefit of the whole household. Oeconomia the DAO reclaims that original meaning — managing shared financial resources through collective, transparent governance.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`od101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — The OEC Token: Utility, Governance, and Staking
          ============================================================ */}
      <div className={`od101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="od101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="od101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="od101-lesson-header-text">
            <div className="od101-lesson-title">The OEC Token: Utility, Governance, and Staking</div>
            <div className="od101-lesson-meta"><span>8 min read</span><span>Tokenomics</span></div>
          </div>
          <div className="od101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="od101-lesson-content">
          <div className="od101-lesson-body">
            <h3>The Heart of the Ecosystem</h3>
            <p>
              OEC is the <strong>native governance token</strong> of the Oeconomia DAO. It isn't just a speculative asset — it's the key that unlocks participation in every layer of the ecosystem. OEC serves three distinct but interconnected roles, each essential to how the DAO functions.
            </p>

            <h3>Three Roles of OEC</h3>
            <div className="od101-three-col">
              <div className="od101-col-card">
                <h4>Governance</h4>
                <p>OEC holders vote on proposals that direct the DAO — treasury allocations, protocol parameter changes, new partnerships, and ecosystem upgrades. More OEC staked means more voting power.</p>
              </div>
              <div className="od101-col-card">
                <h4>Staking</h4>
                <p>Lock OEC tokens to become a Guardian. Guardians earn staking rewards proportional to their stake and lock duration. Staking aligns incentives: the longer you commit, the more you earn.</p>
              </div>
              <div className="od101-col-card">
                <h4>Utility</h4>
                <p>OEC provides utility across all five protocols — from fee discounts on Eloqura swaps to enhanced features on Artivya and priority access to Iridescia developer tools.</p>
              </div>
            </div>

            <h3>OEC Token Details</h3>
            <div className="od101-data-block">
              <div className="od101-data-section-label">Token Specifications</div>
              <div className="od101-data-row"><span className="od101-data-label">Token Name</span><span className="od101-data-value">Oeconomia (OEC)</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Standard</span><span className="od101-data-value">ERC-20</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Decimals</span><span className="od101-data-value">18</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Network</span><span className="od101-data-value cyan">Sepolia Testnet</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Contract</span><span className="od101-data-value">0x2b2fb8df...2a06aba</span></div>
            </div>

            <div className="od101-stats-row">
              <div className="od101-stat-card"><div className="od101-stat-value">1B</div><div className="od101-stat-label">Total Supply</div></div>
              <div className="od101-stat-card"><div className="od101-stat-value">~35%</div><div className="od101-stat-label">Staked %</div></div>
              <div className="od101-stat-card"><div className="od101-stat-value">12</div><div className="od101-stat-label">Proposals Passed</div></div>
            </div>

            <div className="od101-info-box green">
              <div className="od101-info-box-label">Token as Alignment Tool</div>
              <p>
                The OEC token isn't just about speculation — it's a <strong>coordination mechanism</strong>. By requiring governance power to come from staking (locking tokens), the system ensures that those with the most influence are also the most committed to the protocol's long-term success. Short-term traders have less say; long-term believers have more.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`od101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — How the Five Protocols Work Together
          ============================================================ */}
      <div className={`od101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="od101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="od101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="od101-lesson-header-text">
            <div className="od101-lesson-title">How the Five Protocols Work Together</div>
            <div className="od101-lesson-meta"><span>10 min read</span><span>Ecosystem</span></div>
          </div>
          <div className="od101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="od101-lesson-content">
          <div className="od101-lesson-body">
            <h3>An Interconnected Ecosystem</h3>
            <p>
              Oeconomia isn't a single protocol — it's a <strong>suite of five interconnected protocols</strong> that form a complete financial ecosystem. Each protocol has its own token and specialized function, but they all feed into the OEC governance layer and share liquidity, users, and data. Think of it as five specialized departments within one decentralized organization.
            </p>

            <div className="od101-eco-card">
              <div className="od101-eco-header">
                <div className="od101-eco-icon defi">{"\uD83D\uDD04"}</div>
                <div>
                  <div className="od101-eco-name">Eloqura (ELOQ)</div>
                  <div className="od101-eco-sub">Decentralized Exchange & AMM</div>
                </div>
              </div>
              <div className="od101-eco-body">
                <p>The liquidity backbone of the ecosystem. Eloqura enables token swaps, liquidity provision, and price discovery using both V2 constant-product and V3 concentrated liquidity pools. Every other protocol relies on Eloqura for accurate pricing.</p>
              </div>
              <div className="od101-eco-examples">
                <span className="od101-eco-tag">Token Swaps</span>
                <span className="od101-eco-tag">Liquidity Pools</span>
                <span className="od101-eco-tag">Fee Earning</span>
                <span className="od101-eco-tag">Price Oracle</span>
              </div>
            </div>

            <div className="od101-eco-card">
              <div className="od101-eco-header">
                <div className="od101-eco-icon lending">{"\uD83C\uDFE6"}</div>
                <div>
                  <div className="od101-eco-name">Alluria (ALUR)</div>
                  <div className="od101-eco-sub">Lending, Vaults & ALUD Stablecoin</div>
                </div>
              </div>
              <div className="od101-eco-body">
                <p>The credit layer. Users deposit ETH as collateral, mint ALUD stablecoins, and borrow against their holdings. Liquidation mechanisms and stability pools ensure the system remains solvent even during market volatility.</p>
              </div>
              <div className="od101-eco-examples">
                <span className="od101-eco-tag">Collateralized Vaults</span>
                <span className="od101-eco-tag">ALUD Stablecoin</span>
                <span className="od101-eco-tag">Liquidations</span>
                <span className="od101-eco-tag">Stability Pool</span>
              </div>
            </div>

            <div className="od101-eco-card">
              <div className="od101-eco-header">
                <div className="od101-eco-icon nft">{"\uD83C\uDFA8"}</div>
                <div>
                  <div className="od101-eco-name">Artivya (ARTV)</div>
                  <div className="od101-eco-sub">NFT Marketplace & Hybrid Trading</div>
                </div>
              </div>
              <div className="od101-eco-body">
                <p>Where creativity meets finance. Artivya combines a full NFT marketplace with hybrid order book and AMM trading. Creators mint NFTs with on-chain royalties guaranteed by smart contracts — no platform can override them.</p>
              </div>
              <div className="od101-eco-examples">
                <span className="od101-eco-tag">NFT Minting</span>
                <span className="od101-eco-tag">On-chain Royalties</span>
                <span className="od101-eco-tag">Hybrid Exchange</span>
                <span className="od101-eco-tag">Creator Tools</span>
              </div>
            </div>

            <div className="od101-eco-card">
              <div className="od101-eco-header">
                <div className="od101-eco-icon dev">{"\uD83D\uDEE0\uFE0F"}</div>
                <div>
                  <div className="od101-eco-name">Iridescia (IRID)</div>
                  <div className="od101-eco-sub">Developer Infrastructure & Tools</div>
                </div>
              </div>
              <div className="od101-eco-body">
                <p>The builder's toolkit. Iridescia provides pre-audited contract templates, one-click deployment tools, security monitoring frameworks, and SDKs for developers building on Oeconomia. It lowers the barrier to entry for extending the ecosystem.</p>
              </div>
              <div className="od101-eco-examples">
                <span className="od101-eco-tag">Contract Templates</span>
                <span className="od101-eco-tag">Deploy Tools</span>
                <span className="od101-eco-tag">Security Frameworks</span>
                <span className="od101-eco-tag">SDK Access</span>
              </div>
            </div>

            <div className="od101-eco-card">
              <div className="od101-eco-header">
                <div className="od101-eco-icon gov">{"\uD83C\uDFDB\uFE0F"}</div>
                <div>
                  <div className="od101-eco-name">OEC Governance Hub</div>
                  <div className="od101-eco-sub">Cross-Protocol Governance & Treasury</div>
                </div>
              </div>
              <div className="od101-eco-body">
                <p>The coordination center. The governance hub is where Guardian stakers vote on proposals that affect all five protocols. Treasury allocation, parameter changes, new features, and partnerships are all decided here through OEC-weighted voting.</p>
              </div>
              <div className="od101-eco-examples">
                <span className="od101-eco-tag">Proposal Voting</span>
                <span className="od101-eco-tag">Treasury</span>
                <span className="od101-eco-tag">Guardian Staking</span>
                <span className="od101-eco-tag">Cross-Protocol</span>
              </div>
            </div>

            <h3>Try It: Ecosystem Map</h3>
            {renderEcosystemMap()}

            <div className="od101-info-box cyan">
              <div className="od101-info-box-label">Shared Liquidity & Governance</div>
              <p>
                The five protocols are not isolated silos — they <strong>share liquidity and governance</strong>. Eloqura pools feed Alluria's collateral pricing. Artivya uses Eloqura for token valuation. Iridescia provides tools that all protocols use. And OEC governance sits at the center, coordinating upgrades and treasury decisions across the entire ecosystem.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`od101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Guardian Staking and Governance Power
          ============================================================ */}
      <div className={`od101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="od101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="od101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="od101-lesson-header-text">
            <div className="od101-lesson-title">Guardian Staking and Governance Power</div>
            <div className="od101-lesson-meta"><span>10 min read</span><span>Governance</span></div>
          </div>
          <div className="od101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="od101-lesson-content">
          <div className="od101-lesson-body">
            <h3>Becoming a Guardian</h3>
            <p>
              Guardian staking is the core mechanism through which OEC holders earn governance power. To become a Guardian, you <strong>lock your OEC tokens</strong> in the staking contract for a chosen time period. The act of locking demonstrates long-term commitment to the ecosystem and earns you both staking rewards and voting weight.
            </p>
            <p>
              Longer lock periods earn higher multipliers, meaning your governance power grows with your commitment. This creates a system where the people with the most influence are also the most invested in the protocol's long-term success.
            </p>

            <h3>The Five Guardian Tiers</h3>
            <div className="od101-data-block">
              <div className="od101-data-section-label">Guardian Tier Requirements</div>
              <div className="od101-data-row"><span className="od101-data-label">Initiate</span><span className="od101-data-value">1,000+ OEC staked</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Warden</span><span className="od101-data-value">10,000+ OEC staked</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Sentinel</span><span className="od101-data-value">50,000+ OEC staked</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Archon</span><span className="od101-data-value purple">250,000+ OEC staked</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Sovereign</span><span className="od101-data-value amber">1,000,000+ OEC staked</span></div>
            </div>

            <h3>Lock Period Multipliers</h3>
            <div className="od101-data-block">
              <div className="od101-data-section-label">Voting Power = Staked Amount x Multiplier</div>
              <div className="od101-data-row"><span className="od101-data-label">30 days</span><span className="od101-data-value">1.0x multiplier</span></div>
              <div className="od101-data-row"><span className="od101-data-label">90 days</span><span className="od101-data-value green">1.5x multiplier</span></div>
              <div className="od101-data-row"><span className="od101-data-label">180 days</span><span className="od101-data-value cyan">2.0x multiplier</span></div>
              <div className="od101-data-row"><span className="od101-data-label">365 days</span><span className="od101-data-value purple">3.0x multiplier</span></div>
            </div>

            <div className="od101-info-box">
              <div className="od101-info-box-label">Why Tiered Staking?</div>
              <p>
                Tiered staking prevents simple plutocracy (where the richest automatically have the most power). By weighting governance power on <strong>both amount and commitment duration</strong>, the system rewards long-term alignment over short-term capital. A smaller holder locked for a year can have more influence than a larger holder locked for just 30 days. This aligns governance incentives with the protocol's long-term health.
              </p>
            </div>

            <h3>Example Calculation</h3>
            <div className="od101-data-block">
              <div className="od101-data-section-label">Guardian Voting Power Examples</div>
              <div className="od101-data-row"><span className="od101-data-label">50,000 OEC x 30 days (1.0x)</span><span className="od101-data-value">50,000 voting power</span></div>
              <div className="od101-data-row"><span className="od101-data-label">50,000 OEC x 90 days (1.5x)</span><span className="od101-data-value green">75,000 voting power</span></div>
              <div className="od101-data-row"><span className="od101-data-label">50,000 OEC x 180 days (2.0x)</span><span className="od101-data-value cyan">100,000 voting power</span></div>
              <div className="od101-data-row"><span className="od101-data-label">50,000 OEC x 365 days (3.0x)</span><span className="od101-data-value purple">150,000 voting power</span></div>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`od101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — The Roadmap: From Sepolia Testnet to Mainnet
          ============================================================ */}
      <div className={`od101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="od101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="od101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="od101-lesson-header-text">
            <div className="od101-lesson-title">The Roadmap: From Sepolia Testnet to Mainnet</div>
            <div className="od101-lesson-meta"><span>8 min read</span><span>Roadmap</span></div>
          </div>
          <div className="od101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="od101-lesson-content">
          <div className="od101-lesson-body">
            <h3>Building in Public</h3>
            <p>
              Oeconomia is currently deployed on the <strong>Sepolia testnet</strong>, Ethereum's primary test network. This is intentional — developing and testing on a testnet allows the team to iterate rapidly, fix bugs, and gather community feedback without putting real funds at risk. Every smart contract, every governance vote, every swap and stake is fully functional on Sepolia, using test tokens that have no monetary value.
            </p>

            <h3>The Development Timeline</h3>
            <div className="od101-data-block">
              <div className="od101-data-section-label">Roadmap Phases</div>
              <div className="od101-data-row"><span className="od101-data-label">Phase 1</span><span className="od101-data-value">Concept & Design</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Phase 2</span><span className="od101-data-value">Smart Contract Development</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Phase 3</span><span className="od101-data-value green">Testnet Deployment (Current)</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Phase 4</span><span className="od101-data-value amber">Security Audits</span></div>
              <div className="od101-data-row"><span className="od101-data-label">Phase 5</span><span className="od101-data-value purple">Mainnet Launch</span></div>
            </div>

            <h3>Current Status</h3>
            <div className="od101-stats-row">
              <div className="od101-stat-card"><div className="od101-stat-value">5/5</div><div className="od101-stat-label">Protocols on Testnet</div></div>
              <div className="od101-stat-card"><div className="od101-stat-value">Active</div><div className="od101-stat-label">Governance Voting</div></div>
              <div className="od101-stat-card"><div className="od101-stat-value">Next</div><div className="od101-stat-label">Security Audits</div></div>
            </div>

            <div className="od101-info-box orange">
              <div className="od101-info-box-label">Why Testnet First?</div>
              <p>
                Smart contracts are <strong>immutable once deployed</strong> — bugs can't be patched like traditional software. A single vulnerability on mainnet could mean the loss of real funds. Testnet deployment allows the team to discover edge cases, stress-test the system under various conditions, and receive community feedback — all without financial risk. Major DeFi protocols like Uniswap, Aave, and Compound all went through extensive testnet phases before their mainnet launches.
              </p>
            </div>

            <h3>What's Next</h3>
            <p>
              With all five protocols deployed and functional on Sepolia, the next milestone is <strong>comprehensive security audits</strong>. Professional audit firms will review every smart contract for vulnerabilities, logic errors, and potential attack vectors. After audits are completed and any findings are addressed, Oeconomia will prepare for <strong>mainnet launch</strong> — where all protocols will go live with real value on Ethereum mainnet.
            </p>

            <div className="od101-info-box green">
              <div className="od101-info-box-label">Community-Driven Development</div>
              <p>
                Oeconomia's development isn't happening in a vacuum. The testnet phase is a time for community members to interact with the protocols, report issues, suggest improvements, and participate in governance. When mainnet launches, the protocols will have been battle-tested not just by developers, but by the very community that will use them.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`od101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
