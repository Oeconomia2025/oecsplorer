// ============================================================
// Smart Contracts 101 — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./smartcontracts.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "What a Smart Contract Is", meta: "8 min read \u00b7 Foundations" },
  { num: 2, title: "How Contracts Are Deployed and Executed", meta: "8 min read \u00b7 Technical" },
  { num: 3, title: "Solidity: The Language of Ethereum Contracts", meta: "10 min read \u00b7 Technical" },
  { num: 4, title: "Immutability and Upgradability Patterns", meta: "8 min read \u00b7 Architecture" },
  { num: 5, title: "Real-World Examples: Tokens, DEXs, Lending", meta: "10 min read \u00b7 Ecosystem" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What makes a smart contract 'smart'?",
    options: [
      { letter: "A", text: "It uses artificial intelligence to make decisions", correct: false },
      { letter: "B", text: "It self-executes when conditions are met \u2014 no human intermediary needed", correct: true },
      { letter: "C", text: "It can modify itself to fix bugs", correct: false },
      { letter: "D", text: "It requires a lawyer to interpret the terms", correct: false },
    ],
    correctMsg: "Correct! Smart contracts automatically execute when their programmed conditions are met, removing the need for intermediaries.",
    wrongMsg: "Not quite \u2014 a smart contract is 'smart' because it self-executes when conditions are met, with no human intermediary required.",
  },
  2: {
    question: "What happens when you deploy a smart contract?",
    options: [
      { letter: "A", text: "The source code is stored directly on the blockchain", correct: false },
      { letter: "B", text: "A special transaction stores the compiled bytecode on the blockchain at a unique address", correct: true },
      { letter: "C", text: "The contract is sent to Ethereum Foundation for review", correct: false },
      { letter: "D", text: "A copy is installed on every user's computer", correct: false },
    ],
    correctMsg: "Correct! Deployment is a special transaction that stores compiled bytecode on-chain, and the contract receives a unique address.",
    wrongMsg: "Not quite \u2014 deploying a smart contract means sending a special transaction that stores the compiled bytecode at a unique blockchain address.",
  },
  3: {
    question: "Which programming language is most commonly used for Ethereum smart contracts?",
    options: [
      { letter: "A", text: "JavaScript", correct: false },
      { letter: "B", text: "Python", correct: false },
      { letter: "C", text: "Solidity", correct: true },
      { letter: "D", text: "Rust", correct: false },
    ],
    correctMsg: "Correct! Solidity is the primary language for Ethereum smart contracts, designed specifically for the EVM.",
    wrongMsg: "Not quite \u2014 Solidity is the dominant language for writing Ethereum smart contracts.",
  },
  4: {
    question: "Why can't you fix a bug in a deployed smart contract?",
    options: [
      { letter: "A", text: "The Ethereum Foundation doesn't allow it", correct: false },
      { letter: "B", text: "The blockchain is immutable \u2014 deployed code cannot be modified", correct: true },
      { letter: "C", text: "Only the original developer has the password", correct: false },
      { letter: "D", text: "Bug fixes require 100% of validators to agree", correct: false },
    ],
    correctMsg: "Correct! The blockchain is immutable \u2014 once deployed, the code at that address can never be changed.",
    wrongMsg: "Not quite \u2014 the blockchain is immutable, meaning deployed code cannot be modified. This is a fundamental property of blockchain technology.",
  },
  5: {
    question: "What is a 'proxy pattern' used for?",
    options: [
      { letter: "A", text: "To hide the contract's source code from the public", correct: false },
      { letter: "B", text: "To allow upgrades by pointing a fixed proxy address to different implementation contracts", correct: true },
      { letter: "C", text: "To make transactions anonymous", correct: false },
      { letter: "D", text: "To reduce gas costs by 90%", correct: false },
    ],
    correctMsg: "Correct! The proxy pattern lets you upgrade logic by changing which implementation contract the proxy delegates calls to, while keeping the same address.",
    wrongMsg: "Not quite \u2014 the proxy pattern allows upgrades by pointing a fixed proxy address to different implementation contracts.",
  },
};

export default function SmartContractsContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Deployment simulator state
  const [deployStep, setDeployStep] = useState<number>(0); // 0=none, 1=write, 2=compile, 3=deploy

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
      <div className="sc101-quiz-section">
        <div className="sc101-quiz-title">Check Your Understanding</div>
        <div className="sc101-quiz-question">{q.question}</div>
        <div className="sc101-quiz-options">
          {q.options.map((opt) => {
            let cls = "sc101-quiz-option";
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
          <div className={`sc101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  /* ---- Deployment simulator renderer ---- */
  const renderDeploySimulator = () => {
    const getStepOutput = () => {
      if (deployStep === 0) {
        return (
          <span className="muted">Click "1. Write" to begin the deployment simulation...</span>
        );
      }
      if (deployStep === 1) {
        return (
          <>
            <span className="highlight">// SimpleStorage.sol</span>{"\n"}
            <span className="muted">pragma solidity ^0.8.19;</span>{"\n"}
            {"\n"}
            <span className="muted">contract</span> <span className="highlight">SimpleStorage</span> {"{"}{"\n"}
            {"    "}uint256 private storedValue;{"\n"}
            {"\n"}
            {"    "}function <span className="highlight">store</span>(uint256 value) public {"{"}{"\n"}
            {"        "}storedValue = value;{"\n"}
            {"    "}{"}"}{"\n"}
            {"\n"}
            {"    "}function <span className="highlight">retrieve</span>() public view returns (uint256) {"{"}{"\n"}
            {"        "}return storedValue;{"\n"}
            {"    "}{"}"}{"\n"}
            {"}"}
          </>
        );
      }
      if (deployStep === 2) {
        return (
          <>
            <span className="highlight">Compiling SimpleStorage.sol...</span>{"\n"}
            <span className="success">{"\u2713"} Compilation successful</span>{"\n"}
            {"\n"}
            <span className="muted">Bytecode (hex):</span>{"\n"}
            <span style={{ color: "var(--sc-cyan)" }}>6080604052348015600f57600080fd5b50</span>{"\n"}
            <span style={{ color: "var(--sc-cyan)" }}>60a08061001d6000396000f3fe60806040</span>{"\n"}
            <span style={{ color: "var(--sc-cyan)" }}>52348015600f57600080fd5b5060043610</span>{"\n"}
            <span style={{ color: "var(--sc-cyan)" }}>...truncated (1,247 bytes total)</span>{"\n"}
            {"\n"}
            <span className="muted">ABI (Application Binary Interface):</span>{"\n"}
            <span style={{ color: "var(--sc-amber)" }}>{"["} store(uint256), retrieve() {"]"}</span>
          </>
        );
      }
      if (deployStep === 3) {
        return (
          <>
            <span className="highlight">Deploying to Ethereum...</span>{"\n"}
            <span className="success">{"\u2713"} Transaction submitted</span>{"\n"}
            {"\n"}
            <span className="muted">Tx Hash:</span>{"\n"}
            <span style={{ color: "var(--sc-cyan)" }}>0x8a3f...c7e2b1d4</span>{"\n"}
            {"\n"}
            <span className="muted">Gas Used:</span> <span style={{ color: "var(--sc-orange)" }}>127,483</span>{"\n"}
            <span className="muted">Gas Cost:</span> <span style={{ color: "var(--sc-orange)" }}>0.003187 ETH ($7.97)</span>{"\n"}
            {"\n"}
            <span className="success">{"\u2713"} Contract deployed successfully!</span>{"\n"}
            <span className="muted">Contract Address:</span>{"\n"}
            <span className="success">0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18</span>{"\n"}
            {"\n"}
            <span className="muted">Anyone can now call store() and retrieve() at this address.</span>
          </>
        );
      }
      return null;
    };

    const nextStep = () => {
      setDeployStep((prev) => Math.min(prev + 1, 3));
    };

    return (
      <div className="sc101-deploy-sim">
        <div className="sc101-deploy-steps">
          <div
            className={`sc101-deploy-step-btn${deployStep === 1 ? " active" : ""}${deployStep > 1 ? " done" : ""}`}
            onClick={() => setDeployStep(1)}
          >
            1. Write
          </div>
          <div
            className={`sc101-deploy-step-btn${deployStep === 2 ? " active" : ""}${deployStep > 2 ? " done" : ""}`}
            onClick={() => { if (deployStep >= 1) setDeployStep(2); }}
          >
            2. Compile
          </div>
          <div
            className={`sc101-deploy-step-btn${deployStep === 3 ? " active" : ""}`}
            onClick={() => { if (deployStep >= 2) setDeployStep(3); }}
          >
            3. Deploy
          </div>
        </div>
        <div className="sc101-deploy-output">
          {getStepOutput()}
        </div>
        {deployStep < 3 && (
          <div className="sc101-deploy-next-btn" onClick={nextStep}>
            {deployStep === 0 ? "Start: Write Contract \u2192" : deployStep === 1 ? "Next: Compile \u2192" : "Next: Deploy \u2192"}
          </div>
        )}
        {deployStep === 3 && (
          <div className="sc101-deploy-next-btn complete" onClick={() => setDeployStep(0)}>
            {"\u2713"} Deployment Complete \u2014 Click to Reset
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sc101">
      {/* Progress bar */}
      <div className="sc101-progress">
        <div className="sc101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`sc101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="sc101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — What a Smart Contract Is
          ============================================================ */}
      <div className={`sc101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="sc101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="sc101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="sc101-lesson-header-text">
            <div className="sc101-lesson-title">What a Smart Contract Is</div>
            <div className="sc101-lesson-meta"><span>8 min read</span><span>Foundations</span></div>
          </div>
          <div className="sc101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="sc101-lesson-content">
          <div className="sc101-lesson-body">
            <h3>The Vending Machine Analogy</h3>
            <p>
              Imagine a vending machine. You insert money, press a button, and the machine delivers your item. No cashier, no negotiation, no trust needed. The machine's internal logic handles everything: it checks your payment, verifies the selection exists, and dispenses the product. <strong>A smart contract works exactly the same way</strong> — but instead of snacks, it handles digital assets, financial agreements, governance votes, and anything else you can express in code.
            </p>
            <p>
              A <strong>smart contract</strong> is a program stored on the blockchain that automatically executes when predetermined conditions are met. It's self-executing code that enforces the terms of an agreement without requiring a trusted third party. Once deployed, it runs exactly as programmed — no human can alter, censor, or stop it. The "contract" part refers to the agreement between parties; the "smart" part refers to the automatic execution.
            </p>
            <p>
              Unlike traditional legal contracts that rely on courts and lawyers for enforcement, smart contracts are <strong>enforced by mathematics and the blockchain's consensus mechanism</strong>. If the conditions are met, the code executes. Period. No appeals, no delays, no subjective interpretation.
            </p>

            <h3>Traditional vs. Smart Contracts</h3>
            <div className="sc101-compare-grid">
              <div className="sc101-compare-card">
                <h4>Traditional Contract</h4>
                <ul>
                  <li>Written in legal language (English, etc.)</li>
                  <li>Enforced by courts and lawyers</li>
                  <li>Execution takes days to weeks</li>
                  <li>Requires trust in institutions</li>
                  <li>Can be interpreted subjectively</li>
                  <li>Costly to create and enforce</li>
                </ul>
              </div>
              <div className="sc101-compare-card">
                <h4>Smart Contract</h4>
                <ul>
                  <li>Written in code (Solidity)</li>
                  <li>Enforced by the blockchain network</li>
                  <li>Execution is instant (seconds)</li>
                  <li>Trustless — code is the authority</li>
                  <li>Deterministic — same input, same output</li>
                  <li>Low cost once deployed</li>
                </ul>
              </div>
            </div>

            <div className="sc101-info-box purple">
              <div className="sc101-info-box-label">Why "Smart"? — A Brief History</div>
              <p>
                The term "smart contract" was coined by computer scientist <strong>Nick Szabo in 1994</strong> — over a decade before Bitcoin existed. Szabo envisioned digital protocols that could execute the terms of a contract automatically. He used the vending machine as his original analogy. Ethereum, launched in 2015, was the first blockchain to make Szabo's vision practical at scale by providing a Turing-complete programming environment on a decentralized network.
              </p>
            </div>

            <p>
              Smart contracts are the foundation of nearly everything in decentralized finance (DeFi), non-fungible tokens (NFTs), and decentralized autonomous organizations (DAOs). Every token you trade, every liquidity pool you add to, every governance vote you cast — they all run on smart contracts. Understanding them is understanding the engine that powers Web3.
            </p>

            {renderQuizWithSelection(1)}
            <button className={`sc101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — How Contracts Are Deployed and Executed
          ============================================================ */}
      <div className={`sc101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="sc101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="sc101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="sc101-lesson-header-text">
            <div className="sc101-lesson-title">How Contracts Are Deployed and Executed</div>
            <div className="sc101-lesson-meta"><span>8 min read</span><span>Technical</span></div>
          </div>
          <div className="sc101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="sc101-lesson-content">
          <div className="sc101-lesson-body">
            <h3>From Code to Blockchain</h3>
            <p>
              Deploying a smart contract follows a precise pipeline. You write the code in a high-level language like Solidity, compile it into <strong>EVM bytecode</strong> (the low-level instructions the Ethereum Virtual Machine understands), and then send a special <strong>deployment transaction</strong> to the network. This transaction has no "to" address — instead, the bytecode is included in the transaction's data field. When miners or validators process this transaction, the bytecode is stored on the blockchain and the contract receives a <strong>unique address</strong>.
            </p>
            <p>
              Once deployed, the contract lives at that address permanently. Anyone in the world can interact with it by sending transactions to that address. The contract's functions become callable — like an API that exists on a decentralized computer that nobody can turn off.
            </p>

            <h3>The Deployment Pipeline</h3>
            <div className="sc101-data-block">
              <div className="sc101-data-section-label">Smart Contract Lifecycle</div>
              <div className="sc101-data-row"><span className="sc101-data-label">Step 1: Write</span><span className="sc101-data-value">Author Solidity code (.sol files)</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Step 2: Compile</span><span className="sc101-data-value cyan">solc {"\u2192"} EVM bytecode + ABI</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Step 3: Deploy Tx</span><span className="sc101-data-value orange">Send tx with bytecode in data field</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Step 4: Address</span><span className="sc101-data-value green">Contract gets unique address on-chain</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Step 5: Interact</span><span className="sc101-data-value purple">Users call functions via transactions</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Step 6: State</span><span className="sc101-data-value">Contract reads/writes blockchain storage</span></div>
            </div>

            <h3>How Execution Works</h3>
            <p>
              When someone calls a function on a deployed contract, they send a transaction that includes the <strong>function selector</strong> (the first 4 bytes of the function's hash) and any parameters. Every validator on the network independently executes the same code with the same inputs and verifies they get the same result. This is what makes smart contracts <strong>trustless</strong> — no single party controls the outcome.
            </p>
            <p>
              Execution can read existing state (view functions — free, no gas), or modify state (write functions — costs gas). State changes are permanent once the transaction is included in a block. Events can be emitted during execution to create searchable logs.
            </p>

            <div className="sc101-info-box orange">
              <div className="sc101-info-box-label">Deployment Costs</div>
              <p>
                Deploying a smart contract costs gas proportional to the size and complexity of the bytecode. A simple storage contract might cost ~127,000 gas (~$8 at typical prices). A complex DeFi protocol like a DEX router might cost 2,000,000+ gas (~$100+). On Layer 2 networks like Arbitrum, the same deployments cost 90-99% less. This is why many protocols deploy on L2s first for testing.
              </p>
            </div>

            <h3>Try It: Contract Deployment Simulator</h3>
            {renderDeploySimulator()}

            {renderQuizWithSelection(2)}
            <button className={`sc101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Solidity: The Language of Ethereum Contracts
          ============================================================ */}
      <div className={`sc101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="sc101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="sc101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="sc101-lesson-header-text">
            <div className="sc101-lesson-title">Solidity: The Language of Ethereum Contracts</div>
            <div className="sc101-lesson-meta"><span>10 min read</span><span>Technical</span></div>
          </div>
          <div className="sc101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="sc101-lesson-content">
          <div className="sc101-lesson-body">
            <h3>What Solidity Looks Like</h3>
            <p>
              <strong>Solidity</strong> is a statically-typed, contract-oriented programming language designed specifically for implementing smart contracts on the Ethereum Virtual Machine. If you've written JavaScript, C++, or Java, Solidity will feel familiar — it borrows syntax and concepts from all three. It supports inheritance, libraries, complex user-defined types, and a rich standard library.
            </p>
            <p>
              Solidity files use the <code>.sol</code> extension and always begin with a <strong>pragma directive</strong> that specifies the compiler version. Contracts are defined with the <code>contract</code> keyword (similar to <code>class</code> in other languages). Functions can be <code>public</code>, <code>private</code>, <code>internal</code>, or <code>external</code>, and state variables persist on the blockchain between function calls.
            </p>

            <h3>A Real Solidity Contract</h3>
            <div className="sc101-contract-visual">
              <div className="sc101-contract-code">
                <span className="comment">{"// SPDX-License-Identifier: MIT"}</span>{"\n"}
                <span className="keyword">pragma solidity</span> ^0.8.19;{"\n"}
                {"\n"}
                <span className="comment">{"// A simple ERC-20-like token"}</span>{"\n"}
                <span className="keyword">contract</span> <span className="func">MyToken</span> {"{"}{"\n"}
                {"    "}<span className="type">string</span> <span className="keyword">public</span> name = <span className="str">"MyToken"</span>;{"\n"}
                {"    "}<span className="type">uint8</span> <span className="keyword">public</span> decimals = <span className="num">18</span>;{"\n"}
                {"    "}<span className="type">uint256</span> <span className="keyword">public</span> totalSupply;{"\n"}
                {"    "}<span className="keyword">mapping</span>(<span className="type">address</span> =&gt; <span className="type">uint256</span>) <span className="keyword">public</span> balanceOf;{"\n"}
                {"\n"}
                {"    "}<span className="comment">{"// Event emitted on every transfer"}</span>{"\n"}
                {"    "}<span className="keyword">event</span> <span className="func">Transfer</span>(<span className="type">address</span> from, <span className="type">address</span> to, <span className="type">uint256</span> amount);{"\n"}
                {"\n"}
                {"    "}<span className="keyword">constructor</span>(<span className="type">uint256</span> _supply) {"{"}{"\n"}
                {"        "}totalSupply = _supply;{"\n"}
                {"        "}balanceOf[msg.sender] = _supply;{"\n"}
                {"    "}{"}"}{"\n"}
                {"\n"}
                {"    "}<span className="keyword">function</span> <span className="func">transfer</span>(<span className="type">address</span> to, <span className="type">uint256</span> amount) <span className="keyword">external</span> {"{"}{"\n"}
                {"        "}<span className="keyword">require</span>(balanceOf[msg.sender] &gt;= amount, <span className="str">"Insufficient"</span>);{"\n"}
                {"        "}balanceOf[msg.sender] -= amount;{"\n"}
                {"        "}balanceOf[to] += amount;{"\n"}
                {"        "}<span className="keyword">emit</span> <span className="func">Transfer</span>(msg.sender, to, amount);{"\n"}
                {"    "}{"}"}{"\n"}
                {"}"}
              </div>
            </div>
            <p>
              This contract creates a simple token. The <code>constructor</code> runs once at deployment, assigning all tokens to the deployer. The <code>transfer</code> function moves tokens between addresses, using <code>require</code> to ensure the sender has enough. The <code>Transfer</code> event creates a log entry that tools like Etherscan can index and display.
            </p>

            <h3>Key Features of Solidity</h3>
            <div className="sc101-three-col">
              <div className="sc101-col-card">
                <h4>Statically Typed</h4>
                <p>Every variable has a declared type (uint256, address, string, bool). The compiler catches type errors before deployment, reducing bugs on-chain.</p>
              </div>
              <div className="sc101-col-card">
                <h4>Inheritance</h4>
                <p>Contracts can inherit from other contracts, enabling code reuse. OpenZeppelin's libraries provide battle-tested base contracts for tokens, access control, and more.</p>
              </div>
              <div className="sc101-col-card">
                <h4>Events & Logs</h4>
                <p>Events emit data that's stored in transaction logs but not in contract storage (cheaper). Off-chain apps use events to track what happened on-chain.</p>
              </div>
            </div>

            <div className="sc101-info-box blue">
              <div className="sc101-info-box-label">Beyond Solidity</div>
              <p>
                While Solidity dominates, other languages target the EVM too. <strong>Vyper</strong> is a Python-like alternative focused on security and simplicity. <strong>Yul</strong> is a low-level language for optimized assembly-level code. <strong>Fe</strong> is a newer Rust-inspired language. However, ~90% of deployed contracts are written in Solidity, and virtually all DeFi tooling, auditing frameworks, and educational resources target it first.
              </p>
            </div>

            <div className="sc101-info-box cyan">
              <div className="sc101-info-box-label">Special Variables</div>
              <p>
                Solidity provides built-in global variables that give contracts context about the current transaction: <code>msg.sender</code> (who called the function), <code>msg.value</code> (how much ETH was sent), <code>block.timestamp</code> (current block time), and <code>block.number</code> (current block height). These are how contracts know who is interacting with them and when.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`sc101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Immutability and Upgradability Patterns
          ============================================================ */}
      <div className={`sc101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="sc101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="sc101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="sc101-lesson-header-text">
            <div className="sc101-lesson-title">Immutability and Upgradability Patterns</div>
            <div className="sc101-lesson-meta"><span>8 min read</span><span>Architecture</span></div>
          </div>
          <div className="sc101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="sc101-lesson-content">
          <div className="sc101-lesson-body">
            <h3>The Immutability Guarantee</h3>
            <p>
              One of blockchain's most powerful properties is <strong>immutability</strong>: once data is written, it cannot be changed. For smart contracts, this means that the code deployed at an address <strong>can never be modified</strong>. Not by the developer, not by Ethereum's core team, not by anyone. The contract will execute exactly as written for as long as the Ethereum network exists.
            </p>
            <p>
              This is both a feature and a challenge. Immutability provides <strong>absolute guarantees</strong> about what a contract will do — users can verify the code and know it won't change. But it also means that if the code has a bug, a vulnerability, or simply needs an update, there's no way to patch it in place. The code is permanent.
            </p>
            <p>
              History is full of examples. The <strong>DAO hack of 2016</strong> exploited a reentrancy bug in an immutable contract, draining $60 million. The code couldn't be patched — the only recourse was a controversial hard fork of the entire Ethereum network.
            </p>

            <h3>The Proxy Pattern: Having It Both Ways</h3>
            <p>
              Developers created the <strong>proxy pattern</strong> to work around immutability while preserving its benefits. The idea is simple: deploy two contracts instead of one. The <strong>proxy</strong> contract holds the state (storage) and has a fixed address that users interact with. The <strong>implementation</strong> contract holds the logic (code). The proxy delegates all function calls to the current implementation using a low-level EVM operation called <code>delegatecall</code>.
            </p>
            <p>
              To "upgrade" the contract, the admin deploys a new implementation contract and updates the proxy to point to it. Users never change the address they interact with — the proxy stays the same. But the logic behind it can evolve. This is how major DeFi protocols like Aave, Compound, and Uniswap's governance manage upgrades.
            </p>

            <h3>Tradeoffs</h3>
            <div className="sc101-compare-grid">
              <div className="sc101-compare-card">
                <h4>Immutable Contracts</h4>
                <ul>
                  <li>Code is guaranteed to never change</li>
                  <li>Maximum trustlessness — what you see is what you get</li>
                  <li>No admin keys or upgrade authority</li>
                  <li>Bugs are permanent and unfixable</li>
                  <li>Best for simple, proven logic</li>
                </ul>
              </div>
              <div className="sc101-compare-card">
                <h4>Upgradeable (Proxy) Contracts</h4>
                <ul>
                  <li>Logic can be updated after deployment</li>
                  <li>Bugs can be patched, features can be added</li>
                  <li>Requires trust in upgrade authority (admin/DAO)</li>
                  <li>More complex architecture</li>
                  <li>Best for evolving protocols</li>
                </ul>
              </div>
            </div>

            <div className="sc101-info-box orange">
              <div className="sc101-info-box-label">Trust Implications Warning</div>
              <p>
                An upgradeable contract means <strong>someone has the power to change the rules</strong>. If an admin key controls upgrades, that admin could theoretically swap the implementation to a malicious version that drains all funds. This is why the best protocols use <strong>timelocks</strong> (forced delay before upgrades take effect), <strong>multisig wallets</strong> (multiple people must approve), or <strong>DAO governance</strong> (token holders vote). Always check who controls the upgrade authority before trusting a protocol.
              </p>
            </div>

            <div className="sc101-info-box green">
              <div className="sc101-info-box-label">Common Proxy Standards</div>
              <p>
                The most widely used proxy patterns are <strong>UUPS</strong> (Universal Upgradeable Proxy Standard, EIP-1822) and the <strong>Transparent Proxy</strong> pattern (used by OpenZeppelin). UUPS puts upgrade logic in the implementation contract, while Transparent Proxy puts it in the proxy itself. Both achieve the same goal but have different security properties and gas costs.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`sc101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Real-World Examples: Tokens, DEXs, Lending
          ============================================================ */}
      <div className={`sc101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="sc101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="sc101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="sc101-lesson-header-text">
            <div className="sc101-lesson-title">Real-World Examples: Tokens, DEXs, Lending</div>
            <div className="sc101-lesson-meta"><span>10 min read</span><span>Ecosystem</span></div>
          </div>
          <div className="sc101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="sc101-lesson-content">
          <div className="sc101-lesson-body">
            <h3>DeFi Protocols Are Just Smart Contracts</h3>
            <p>
              Every DeFi application you interact with — every DEX, lending platform, yield aggregator, and stablecoin — is <strong>nothing more than a collection of smart contracts</strong>. There are no servers running in a data center processing your trades. There's no database storing your loan. It's all code on the blockchain, executing deterministically, 24/7, for anyone in the world.
            </p>
            <p>
              This is a profound shift. Traditional finance requires banks, brokers, clearinghouses, regulators, and armies of employees. DeFi replaces all of that with audited, open-source code. The "protocol" is the smart contract. The "bank" is the smart contract. The "exchange" is the smart contract.
            </p>

            <h3>What Each Type of Contract Does</h3>
            <div className="sc101-data-block">
              <div className="sc101-data-section-label">Smart Contract Categories in DeFi</div>
              <div className="sc101-data-row"><span className="sc101-data-label">Token Contracts (ERC-20)</span><span className="sc101-data-value cyan">Track balances, handle transfers, manage approvals</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">DEX / AMM Contracts</span><span className="sc101-data-value purple">Price tokens using math, execute swaps, manage liquidity pools</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Lending Contracts</span><span className="sc101-data-value blue">Accept collateral, issue loans, calculate interest, trigger liquidations</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Stablecoin Contracts</span><span className="sc101-data-value green">Maintain price pegs, manage collateral ratios, handle minting/burning</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Governance Contracts</span><span className="sc101-data-value amber">Create proposals, count votes, execute approved actions</span></div>
              <div className="sc101-data-row"><span className="sc101-data-label">Staking Contracts</span><span className="sc101-data-value orange">Lock tokens, calculate rewards, enforce lock periods</span></div>
            </div>

            <p>
              What makes this ecosystem powerful is <strong>composability</strong>. Smart contracts can call other smart contracts. A single transaction might swap tokens on a DEX, deposit the result into a lending protocol, and use the receipt token as collateral — all in one atomic operation. This is why DeFi is called "money Legos" — protocols snap together like building blocks.
            </p>

            <h3>Real Examples You Can Verify</h3>
            <div className="sc101-stats-row">
              <div className="sc101-stat-card"><div className="sc101-stat-value">$50B+</div><div className="sc101-stat-label">Locked in DeFi smart contracts</div></div>
              <div className="sc101-stat-card"><div className="sc101-stat-value">~50M</div><div className="sc101-stat-label">Contracts deployed on Ethereum</div></div>
              <div className="sc101-stat-card"><div className="sc101-stat-value">$2B+</div><div className="sc101-stat-label">Daily DEX volume (Uniswap alone)</div></div>
            </div>

            <div className="sc101-info-box green">
              <div className="sc101-info-box-label">Oeconomia Connection</div>
              <p>
                Everything in the Oeconomia ecosystem is built on smart contracts. The <strong>OEC token</strong> (0x2b2f...aba) is an ERC-20 contract that tracks balances and governance rights. The <strong>Eloqura Router</strong> (0x3f42...7AE) is a DEX contract that handles swap routing and liquidity management. The <strong>Alluria vaults</strong> are lending contracts that accept collateral and mint ALUD stablecoins. The Guardian staking system is a staking contract with tiered rewards. You can verify every line of code on Sepolia Etherscan.
              </p>
            </div>

            <div className="sc101-info-box amber">
              <div className="sc101-info-box-label">Why Open Source Matters</div>
              <p>
                Because smart contracts handle real money, the industry standard is to make source code <strong>publicly verifiable</strong>. Verified contracts on Etherscan let anyone read the exact code that controls their funds. This transparency is what allows DeFi to function without trust — you don't need to trust the developer because you can verify what the code does. Always check contract verification before depositing funds.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`sc101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
