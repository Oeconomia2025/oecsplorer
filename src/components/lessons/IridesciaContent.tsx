// ============================================================
// Iridescia: Developer Infrastructure — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./iridescia.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "Contract Deployment Tools and Templates", meta: "10 min read \u00B7 Templates" },
  { num: 2, title: "The Security Framework: Audits and Monitoring", meta: "10 min read \u00B7 Security" },
  { num: 3, title: "Template Registry for Common Contract Patterns", meta: "8 min read \u00B7 Registry" },
  { num: 4, title: "Developer SDKs and Integration Guides", meta: "10 min read \u00B7 Developer Tools" },
  { num: 5, title: "Building on Oeconomia: Getting Started", meta: "8 min read \u00B7 Getting Started" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What does Iridescia's template registry provide?",
    options: [
      { letter: "A", text: "Pre-built HTML website templates for DeFi projects", correct: false },
      { letter: "B", text: "Pre-built, audited smart contract templates for common patterns like tokens, staking, and vesting", correct: true },
      { letter: "C", text: "Database schemas for blockchain applications", correct: false },
      { letter: "D", text: "Marketing templates for token launches", correct: false },
    ],
    correctMsg: "Correct! Iridescia provides production-ready, audited smart contract templates that developers can deploy with confidence, covering common patterns like ERC-20 tokens, staking, and vesting.",
    wrongMsg: "Not quite \u2014 Iridescia's template registry provides pre-built, audited smart contract templates for common blockchain patterns.",
  },
  2: {
    question: "Why are pre-audited contract templates valuable?",
    options: [
      { letter: "A", text: "They're cheaper to deploy on the blockchain", correct: false },
      { letter: "B", text: "They reduce development time and security risk by using code that has already been reviewed and tested", correct: true },
      { letter: "C", text: "They automatically generate documentation", correct: false },
      { letter: "D", text: "They guarantee the token price will increase", correct: false },
    ],
    correctMsg: "Correct! Pre-audited templates save weeks of development time and dramatically reduce the risk of security vulnerabilities, since the code has already been thoroughly reviewed.",
    wrongMsg: "Not quite \u2014 the primary value is saving development time and reducing security risk through pre-reviewed, battle-tested code.",
  },
  3: {
    question: "What three phases does Iridescia's security framework cover?",
    options: [
      { letter: "A", text: "Design, Build, and Deploy", correct: false },
      { letter: "B", text: "Prevention (code analysis), Detection (runtime monitoring), and Response (emergency procedures)", correct: true },
      { letter: "C", text: "Testing, Staging, and Production", correct: false },
      { letter: "D", text: "Frontend, Backend, and Database", correct: false },
    ],
    correctMsg: "Correct! The three phases \u2014 Prevention, Detection, and Response \u2014 create a comprehensive security posture that covers the entire lifecycle of a smart contract.",
    wrongMsg: "Not quite \u2014 Iridescia's security framework covers Prevention (code analysis), Detection (runtime monitoring), and Response (emergency procedures).",
  },
  4: {
    question: "What is the first step for a developer building on Oeconomia?",
    options: [
      { letter: "A", text: "Deploy directly to mainnet to test with real funds", correct: false },
      { letter: "B", text: "Set up the development environment and choose an appropriate contract template from the registry", correct: true },
      { letter: "C", text: "Apply for a developer license from the Oeconomia Foundation", correct: false },
      { letter: "D", text: "Purchase OEC tokens before you can access developer tools", correct: false },
    ],
    correctMsg: "Correct! The first step is setting up your development environment (Node.js, Hardhat/Foundry, ethers.js) and choosing a suitable contract template from the Iridescia registry.",
    wrongMsg: "Not quite \u2014 start by setting up your development environment and selecting an appropriate contract template from the Iridescia registry.",
  },
  5: {
    question: "Where should new Oeconomia contracts be tested before mainnet?",
    options: [
      { letter: "A", text: "On the Bitcoin testnet", correct: false },
      { letter: "B", text: "In a local JavaScript console", correct: false },
      { letter: "C", text: "On the Sepolia testnet using test ETH from a faucet", correct: true },
      { letter: "D", text: "Directly on mainnet with small amounts", correct: false },
    ],
    correctMsg: "Correct! The Sepolia testnet provides a safe environment to test contracts with free test ETH, ensuring everything works correctly before deploying with real funds on mainnet.",
    wrongMsg: "Not quite \u2014 always test on the Sepolia testnet first, using free test ETH from a faucet, before deploying to mainnet.",
  },
};

const TX_STEPS = [
  { num: 1, title: "Wallet Signs Transaction", desc: "Your wallet creates the transaction, signs it with your private key, and broadcasts it to the network. The signature proves you authorized the action without revealing your private key." },
  { num: 2, title: "Transaction Enters Mempool", desc: "The signed transaction enters the mempool (memory pool) \u2014 a waiting area where pending transactions queue up. Validators can see all pending transactions and prioritize them by gas fees." },
  { num: 3, title: "Validator Includes in Block", desc: "A validator selects transactions from the mempool to include in the next block. Higher priority fees get included first. Your transaction is bundled with others into a candidate block." },
  { num: 4, title: "Block Is Proposed", desc: "The validator proposes the block to the network. Other validators verify all transactions in the block are valid, check signatures, and ensure state transitions are correct." },
  { num: 5, title: "Block Is Finalized", desc: "After enough attestations from other validators (2 epochs on Ethereum), the block achieves finality. Your transaction is now permanent and irreversible \u2014 it will exist on the blockchain forever." },
];

export default function IridesciaContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Transaction Lifecycle state
  const [txStep, setTxStep] = useState(-1);
  const [txRunning, setTxRunning] = useState(false);

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

  // Transaction lifecycle animation
  const startTransaction = useCallback(() => {
    if (txRunning) return;
    setTxRunning(true);
    setTxStep(0);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step >= TX_STEPS.length) {
        clearInterval(interval);
        setTxRunning(false);
      } else {
        setTxStep(step);
      }
    }, 1500);
  }, [txRunning]);

  const resetTransaction = useCallback(() => {
    setTxStep(-1);
    setTxRunning(false);
  }, []);

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="ir101-quiz-section">
        <div className="ir101-quiz-title">Check Your Understanding</div>
        <div className="ir101-quiz-question">{q.question}</div>
        <div className="ir101-quiz-options">
          {q.options.map((opt) => {
            let cls = "ir101-quiz-option";
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
          <div className={`ir101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ir101">
      {/* Progress bar */}
      <div className="ir101-progress">
        <div className="ir101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`ir101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="ir101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — Contract Deployment Tools and Templates
          ============================================================ */}
      <div className={`ir101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="ir101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="ir101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="ir101-lesson-header-text">
            <div className="ir101-lesson-title">Contract Deployment Tools and Templates</div>
            <div className="ir101-lesson-meta"><span>10 min read</span><span>Templates</span></div>
          </div>
          <div className="ir101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ir101-lesson-content">
          <div className="ir101-lesson-body">
            <h3>Building Blocks for Blockchain Development</h3>
            <p>
              Smart contract development is complex and high-stakes — bugs can lead to loss of funds, and deployed contracts can't be patched. <strong>Iridescia</strong> solves this by providing a curated library of <strong>pre-built, audited contract templates</strong> that developers can deploy with confidence. Instead of writing a token contract from scratch (and potentially introducing vulnerabilities), you can use a battle-tested template and customize only what you need.
            </p>
            <p>
              These templates cover the most common patterns in blockchain development: ERC-20 tokens, ERC-721 NFTs, staking contracts, vesting schedules, multisig wallets, governance systems, and more. Each template comes with full source code, a comprehensive test suite, deployment scripts, and documentation. They're designed to be production-ready out of the box while remaining fully customizable.
            </p>
            <p>
              The <strong>one-click deployment</strong> system lets developers go from template selection to live contract in minutes rather than weeks. Select a template, configure the parameters (token name, supply, admin addresses), and deploy. Iridescia handles the compilation, optimization, and deployment transaction — no deep Solidity expertise required.
            </p>

            <div className="ir101-data-block">
              <div className="ir101-data-section-label">Available Template Categories</div>
              <div className="ir101-data-row"><span className="ir101-data-label">ERC-20 Token</span><span className="ir101-data-value">Standard token with mint, burn, pause capabilities</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">ERC-721 NFT</span><span className="ir101-data-value">NFT collection with metadata, royalties, reveals</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Staking Vault</span><span className="ir101-data-value">Lock tokens, earn rewards, configurable periods</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Token Vesting</span><span className="ir101-data-value green">Linear/cliff vesting for team and investor tokens</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Multisig Wallet</span><span className="ir101-data-value">N-of-M signature treasury management</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Governor Contract</span><span className="ir101-data-value purple">On-chain governance with proposal/vote/execute</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Timelock</span><span className="ir101-data-value">Delayed execution for governance actions</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">AMM Pool</span><span className="ir101-data-value cyan">Liquidity pool with configurable fee tiers</span></div>
            </div>

            <div className="ir101-info-box green">
              <div className="ir101-info-box-label">Why Templates Matter</div>
              <p>
                The DeFi space has lost over <strong>$5 billion to smart contract exploits</strong>. Most of these weren't novel attack vectors — they were known bugs that could have been prevented with proper code patterns. Templates encode <strong>years of collective security knowledge</strong> into reusable code. Using a template that has been audited and used by hundreds of projects is orders of magnitude safer than writing everything from scratch.
              </p>
            </div>

            <div className="ir101-info-box cyan">
              <div className="ir101-info-box-label">Customization Without Risk</div>
              <p>
                Templates are designed with <strong>configurable parameters</strong> — you set values like token supply, fee percentages, admin addresses, and vesting schedules without modifying the core logic. This means you get custom behavior without touching the audited code. If you need deeper customization, the source code is fully available, but the audit guarantees only apply to the unmodified template.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`ir101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — The Security Framework
          ============================================================ */}
      <div className={`ir101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="ir101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="ir101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="ir101-lesson-header-text">
            <div className="ir101-lesson-title">The Security Framework: Audits and Monitoring</div>
            <div className="ir101-lesson-meta"><span>10 min read</span><span>Security</span></div>
          </div>
          <div className="ir101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ir101-lesson-content">
          <div className="ir101-lesson-body">
            <h3>Security Is Not Optional in DeFi</h3>
            <p>
              In traditional software, a bug means a poor user experience. In DeFi, a bug means <strong>lost funds — permanently and irreversibly</strong>. There's no customer support to call, no chargebacks, and no way to undo transactions on a blockchain. This is why Iridescia treats security not as a feature but as a <strong>foundational requirement</strong> woven into every layer of the development process.
            </p>
            <p>
              The Iridescia security framework operates across three phases: <strong>Prevention</strong> (catching bugs before deployment), <strong>Detection</strong> (monitoring for anomalies in real-time), and <strong>Response</strong> (emergency procedures when something goes wrong). Together, these phases create a comprehensive security posture that protects protocols throughout their entire lifecycle.
            </p>

            <h3>The Three Phases</h3>
            <div className="ir101-three-col">
              <div className="ir101-col-card">
                <h4>Prevention</h4>
                <p>Static analysis tools scan code for known vulnerability patterns. Formal verification mathematically proves contract properties. Comprehensive test suites cover edge cases and attack vectors. Code reviews by multiple auditors catch logic errors that automated tools miss.</p>
              </div>
              <div className="ir101-col-card">
                <h4>Detection</h4>
                <p>Runtime monitoring tracks contract behavior against expected patterns. Anomaly detection flags unusual transaction volumes, unexpected state changes, or abnormal gas usage. Real-time alerts notify protocol teams of potential security incidents before they escalate.</p>
              </div>
              <div className="ir101-col-card">
                <h4>Response</h4>
                <p>Emergency pause functions can halt contract operations instantly. Upgrade procedures allow patching through proxy patterns. Incident response playbooks guide teams through containment and recovery. Post-mortems document lessons learned for future prevention.</p>
              </div>
            </div>

            <div className="ir101-info-box orange">
              <div className="ir101-info-box-label">Historical DeFi Exploits</div>
              <p>
                The DAO Hack (2016) lost $60M from a reentrancy bug — a vulnerability Iridescia's templates guard against with reentrancy locks. The Wormhole Bridge exploit (2022) lost $320M from an unvalidated signature — caught by static analysis. The Euler Finance hack (2023) lost $197M from a missing health check — preventable with formal verification. These weren't sophisticated zero-days; they were <strong>known vulnerability patterns</strong> that proper security frameworks would have caught.
              </p>
            </div>

            <div className="ir101-info-box purple">
              <div className="ir101-info-box-label">Audit Preparation Checklist</div>
              <p>
                Before submitting code for audit, Iridescia recommends: <strong>1)</strong> Run all automated tests with 100% pass rate. <strong>2)</strong> Achieve &gt;95% code coverage. <strong>3)</strong> Run Slither and Mythril static analysis with zero high-severity findings. <strong>4)</strong> Document all external dependencies and trust assumptions. <strong>5)</strong> Prepare a clear specification of intended behavior for auditors to verify against.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`ir101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Template Registry
          ============================================================ */}
      <div className={`ir101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="ir101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="ir101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="ir101-lesson-header-text">
            <div className="ir101-lesson-title">Template Registry for Common Contract Patterns</div>
            <div className="ir101-lesson-meta"><span>8 min read</span><span>Registry</span></div>
          </div>
          <div className="ir101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ir101-lesson-content">
          <div className="ir101-lesson-body">
            <h3>A Categorized Library of Smart Contracts</h3>
            <p>
              The Iridescia <strong>Template Registry</strong> is an organized, searchable library of smart contract templates grouped by category and use case. Each template in the registry isn't just source code — it's a complete <strong>deployment package</strong> containing the Solidity source, a comprehensive test suite (Hardhat + Foundry), deployment scripts for multiple networks, and detailed documentation explaining every function, parameter, and design decision.
            </p>
            <p>
              Templates are versioned and maintained. When a new vulnerability class is discovered or Solidity introduces improved patterns, the affected templates are updated. Projects using older versions receive upgrade notifications with migration guides. This ongoing maintenance is what separates a registry from a simple code repository.
            </p>

            <div className="ir101-data-block">
              <div className="ir101-data-section-label">Template Registry Structure</div>
              <div className="ir101-data-row"><span className="ir101-data-label">Templates available</span><span className="ir101-data-value">24 templates across 6 categories</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Each template includes</span><span className="ir101-data-value">Source + Tests + Scripts + Docs</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Supported networks</span><span className="ir101-data-value cyan">Ethereum, Sepolia, Arbitrum, Optimism</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Solidity version</span><span className="ir101-data-value">^0.8.20 (latest stable)</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Audit status</span><span className="ir101-data-value green">All core templates audited</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">License</span><span className="ir101-data-value">MIT (open source)</span></div>
            </div>

            <h3>Build From Scratch vs Templates</h3>
            <div className="ir101-compare-grid">
              <div className="ir101-compare-card">
                <h4>Building From Scratch</h4>
                <ul>
                  <li>Development time: 2-6 weeks</li>
                  <li>Must write all tests from scratch</li>
                  <li>High risk of introducing bugs</li>
                  <li>Audit cost: $20,000-$100,000+</li>
                  <li>No community battle-testing</li>
                  <li>Full customization freedom</li>
                </ul>
              </div>
              <div className="ir101-compare-card">
                <h4>Using Iridescia Templates</h4>
                <ul>
                  <li>Development time: 2-4 hours</li>
                  <li>Tests included and pre-written</li>
                  <li>Pre-audited, known-safe patterns</li>
                  <li>Audit cost: $0-$5,000 (customizations only)</li>
                  <li>Battle-tested by hundreds of deployments</li>
                  <li>Customization via configurable parameters</li>
                </ul>
              </div>
            </div>

            <div className="ir101-info-box blue">
              <div className="ir101-info-box-label">Community Contributions</div>
              <p>
                The template registry isn't just maintained by the Iridescia team — it accepts <strong>community contributions</strong>. Developers can submit new templates through a proposal process that includes code review, test requirements, and audit verification. Accepted templates benefit from the full registry infrastructure: versioning, documentation hosting, and deployment tooling. This collaborative model means the registry grows with the community's needs.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`ir101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Developer SDKs and Integration Guides
          ============================================================ */}
      <div className={`ir101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="ir101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="ir101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="ir101-lesson-header-text">
            <div className="ir101-lesson-title">Developer SDKs and Integration Guides</div>
            <div className="ir101-lesson-meta"><span>10 min read</span><span>Developer Tools</span></div>
          </div>
          <div className="ir101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ir101-lesson-content">
          <div className="ir101-lesson-body">
            <h3>The Oeconomia SDK</h3>
            <p>
              Iridescia provides <strong>JavaScript/TypeScript SDKs</strong> for interacting with every Oeconomia protocol programmatically. Built on top of <strong>ethers.js</strong>, the SDK abstracts away the complexity of ABI encoding, transaction construction, and error handling. Instead of manually crafting contract calls, developers use clean, type-safe functions that handle all the blockchain plumbing.
            </p>
            <p>
              The SDK covers all major operations: swapping tokens on Eloqura, managing vaults on Alluria, listing and buying NFTs on Artivya, and participating in OEC governance. Each function is fully typed (TypeScript), documented with JSDoc comments, and includes error handling for common failure modes (insufficient balance, slippage exceeded, gas estimation failure).
            </p>

            <div className="ir101-data-block">
              <div className="ir101-data-section-label">SDK Installation and Basic Usage</div>
              <div className="ir101-data-row"><span className="ir101-data-label">Install</span><span className="ir101-data-value cyan">npm install @oeconomia/sdk ethers</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Import</span><span className="ir101-data-value">import {"{ Eloqura, Alluria }"} from "@oeconomia/sdk"</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Connect</span><span className="ir101-data-value">const eloqura = new Eloqura(provider, chainId)</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Quote</span><span className="ir101-data-value green">const quote = await eloqura.getQuote(tokenIn, tokenOut, amount)</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Swap</span><span className="ir101-data-value green">const tx = await eloqura.swap(quote, signer)</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Types</span><span className="ir101-data-value">Full TypeScript definitions included</span></div>
            </div>

            <h3>SDK Features</h3>
            <div className="ir101-three-col">
              <div className="ir101-col-card">
                <h4>Type-Safe</h4>
                <p>Full TypeScript support with generated types from contract ABIs. Catch errors at compile time, not at runtime. Every function parameter and return value is properly typed for IDE autocompletion.</p>
              </div>
              <div className="ir101-col-card">
                <h4>Well-Documented</h4>
                <p>Every function includes JSDoc documentation, usage examples, and parameter descriptions. The SDK ships with a comprehensive guide covering common integration patterns and best practices.</p>
              </div>
              <div className="ir101-col-card">
                <h4>Thoroughly Tested</h4>
                <p>The SDK maintains 95%+ code coverage with both unit tests and integration tests against forked mainnet state. Every release goes through automated CI/CD testing before publication.</p>
              </div>
            </div>

            <div className="ir101-info-box amber">
              <div className="ir101-info-box-label">API Endpoints</div>
              <p>
                In addition to the JavaScript SDK, Iridescia provides <strong>REST API endpoints</strong> for common operations. These are useful for server-side integrations, mobile apps, or any environment where running ethers.js isn't practical. The API supports quote fetching, transaction status checking, pool analytics, and historical data queries. Rate limits are generous for registered developers.
              </p>
            </div>

            <div className="ir101-info-box green">
              <div className="ir101-info-box-label">Getting Started Quickly</div>
              <p>
                The fastest way to start is with the <code>@oeconomia/create-dapp</code> scaffold tool. Run <code>npx @oeconomia/create-dapp my-app</code> and you get a fully configured React + ethers.js project with wallet connection, SDK integration, and example components for swap, vault, and NFT interactions — all pre-wired and ready to customize.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`ir101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Building on Oeconomia: Getting Started
          ============================================================ */}
      <div className={`ir101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="ir101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="ir101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="ir101-lesson-header-text">
            <div className="ir101-lesson-title">Building on Oeconomia: Getting Started</div>
            <div className="ir101-lesson-meta"><span>8 min read</span><span>Getting Started</span></div>
          </div>
          <div className="ir101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ir101-lesson-content">
          <div className="ir101-lesson-body">
            <h3>Your Development Journey</h3>
            <p>
              Building on Oeconomia follows a structured path from environment setup to production deployment. Whether you're creating a new DeFi protocol, an NFT project, or a governance tool, the process is the same: set up your tools, choose a template, customize, test thoroughly, deploy to testnet, get audited, and finally deploy to mainnet. Let's walk through each step.
            </p>

            <h3>The Development Timeline</h3>
            <div className="ir101-timeline">
              <div className="ir101-timeline-item">
                <div className="ir101-timeline-date">Step 1: Set Up Environment</div>
                <div className="ir101-timeline-text">Install <strong>Node.js 18+</strong>, <strong>Hardhat or Foundry</strong>, and the Oeconomia SDK. Configure your wallet with Sepolia test ETH from a faucet. Set up your IDE with Solidity extensions for syntax highlighting and linting.</div>
              </div>
              <div className="ir101-timeline-item">
                <div className="ir101-timeline-date">Step 2: Choose Template</div>
                <div className="ir101-timeline-text">Browse the Iridescia Template Registry and select the template closest to your use case. Clone it, review the source code, and understand the <strong>configuration parameters</strong> available.</div>
              </div>
              <div className="ir101-timeline-item">
                <div className="ir101-timeline-date">Step 3: Customize</div>
                <div className="ir101-timeline-text">Configure template parameters (token name, fees, admin roles). If needed, extend the template with custom logic. <strong>Write additional tests</strong> for any custom code you add.</div>
              </div>
              <div className="ir101-timeline-item">
                <div className="ir101-timeline-date">Step 4: Test on Sepolia</div>
                <div className="ir101-timeline-text">Deploy to the <strong>Sepolia testnet</strong> and run integration tests against the live network. Test all user flows, edge cases, and failure scenarios with test ETH. Interact with other Oeconomia contracts on Sepolia.</div>
              </div>
              <div className="ir101-timeline-item">
                <div className="ir101-timeline-date">Step 5: Deploy to Production</div>
                <div className="ir101-timeline-text">After thorough testing and audit (if applicable), deploy to mainnet. Set up <strong>monitoring and alerting</strong> through Iridescia's security framework. Announce your launch to the Oeconomia community.</div>
              </div>
              <div className="ir101-timeline-item">
                <div className="ir101-timeline-date">Step 6: Submit for Audit</div>
                <div className="ir101-timeline-text">Submit your contract for security audit through Iridescia. Unmodified templates get <strong>expedited review</strong>. Custom code receives full audit treatment. Fix any findings and redeploy if needed.</div>
              </div>
            </div>

            <h3>Try It: Transaction Lifecycle Visualizer</h3>
            <div className="ir101-tx-lifecycle">
              <div className="ir101-tx-lifecycle-title">Transaction Lifecycle: From Wallet to Blockchain</div>
              <div className="ir101-tx-steps">
                {TX_STEPS.map((step, i) => (
                  <div key={i} className={`ir101-tx-step${txStep === i ? " active" : ""}${txStep > i ? " completed" : ""}`}>
                    <div className="ir101-tx-step-indicator">
                      {txStep > i ? "\u2713" : step.num}
                    </div>
                    <div className="ir101-tx-step-content">
                      <div className="ir101-tx-step-title">{step.title}</div>
                      {(txStep === i || txStep > i) && (
                        <div className="ir101-tx-step-desc">{step.desc}</div>
                      )}
                    </div>
                    {i < TX_STEPS.length - 1 && <div className="ir101-tx-step-connector" />}
                  </div>
                ))}
              </div>
              {txStep === -1 && (
                <button className="ir101-tx-btn" onClick={startTransaction}>
                  Send Transaction {"\u2192"}
                </button>
              )}
              {txRunning && (
                <div className="ir101-tx-status">Processing step {txStep + 1} of {TX_STEPS.length}...</div>
              )}
              {txStep === TX_STEPS.length - 1 && !txRunning && (
                <>
                  <button className="ir101-tx-btn complete" disabled>
                    {"\u2713"} Transaction Confirmed
                  </button>
                  <button className="ir101-tx-btn" onClick={resetTransaction} style={{ marginTop: 8 }}>
                    Reset & Try Again
                  </button>
                </>
              )}
            </div>

            <div className="ir101-data-block">
              <div className="ir101-data-section-label">Key Developer Resources</div>
              <div className="ir101-data-row"><span className="ir101-data-label">Oeconomia Explorer</span><span className="ir101-data-value cyan">explorer.oeconomia.io</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Sepolia RPC</span><span className="ir101-data-value">https://rpc.sepolia.org (or Alchemy/Infura)</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Sepolia Faucet</span><span className="ir101-data-value green">sepoliafaucet.com (free test ETH)</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">SDK Package</span><span className="ir101-data-value">@oeconomia/sdk on npm</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Template Registry</span><span className="ir101-data-value">templates.iridescia.oeconomia.io</span></div>
              <div className="ir101-data-row"><span className="ir101-data-label">Community</span><span className="ir101-data-value purple">Discord, GitHub Discussions</span></div>
            </div>

            <div className="ir101-info-box green">
              <div className="ir101-info-box-label">Developer Community</div>
              <p>
                Building on Oeconomia means joining a <strong>growing community of builders</strong>. The developer Discord has channels for technical support, code reviews, and collaboration. Monthly developer calls discuss upcoming protocol changes, new templates, and community projects. The best way to learn is to start building — pick a template, deploy it on Sepolia, and experiment. The community is here to help when you get stuck.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`ir101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
