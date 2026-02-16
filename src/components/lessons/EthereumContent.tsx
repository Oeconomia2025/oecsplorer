// ============================================================
// Ethereum 101 — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./ethereum101.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "How Ethereum Differs from Bitcoin", meta: "8 min read · Foundations" },
  { num: 2, title: "Smart Contracts & the EVM", meta: "10 min read · Technical" },
  { num: 3, title: "What Gas Is & How Fees Work", meta: "10 min read · Economics" },
  { num: 4, title: "Ethereum's Transition to Proof of Stake", meta: "8 min read · History" },
  { num: 5, title: "The Ecosystem: DeFi, NFTs & DAOs", meta: "10 min read · Ecosystem" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What is the fundamental capability Ethereum added that Bitcoin doesn't have?",
    options: [
      { letter: "A", text: "Faster transaction processing", correct: false },
      { letter: "B", text: "Turing-complete programmability (smart contracts)", correct: true },
      { letter: "C", text: "A fixed supply cap", correct: false },
      { letter: "D", text: "Peer-to-peer payments without a middleman", correct: false },
    ],
    correctMsg: "Correct! Ethereum's Turing-complete smart contracts allow any arbitrary program to run on the blockchain.",
    wrongMsg: "Not quite — Ethereum's key innovation is Turing-complete programmability via smart contracts.",
  },
  2: {
    question: "What prevents an infinite loop from crashing the entire Ethereum network?",
    options: [
      { letter: "A", text: "An admin manually stops runaway contracts", correct: false },
      { letter: "B", text: "The gas system — every operation costs gas, and transactions have a gas limit", correct: true },
      { letter: "C", text: "Solidity doesn't support loops", correct: false },
      { letter: "D", text: "Validators vote to cancel suspicious transactions", correct: false },
    ],
    correctMsg: "Correct! The gas system meters every computation — when gas runs out, execution stops.",
    wrongMsg: "Not quite — the gas metering system prevents infinite loops by capping computation per transaction.",
  },
  3: {
    question: "What happens to the base fee portion of every Ethereum transaction since EIP-1559?",
    options: [
      { letter: "A", text: "It goes to the Ethereum Foundation", correct: false },
      { letter: "B", text: "It's distributed to all validators equally", correct: false },
      { letter: "C", text: "It's permanently burned (destroyed), reducing ETH supply", correct: true },
      { letter: "D", text: "It's recycled into the next block's rewards", correct: false },
    ],
    correctMsg: "Correct! EIP-1559 burns the base fee, making ETH deflationary during high-usage periods.",
    wrongMsg: "Not quite — the base fee is permanently burned, reducing the total ETH supply over time.",
  },
  4: {
    question: 'What was "The Merge" in Ethereum\'s history?',
    options: [
      { letter: "A", text: "Combining Ethereum and Bitcoin into one blockchain", correct: false },
      { letter: "B", text: "A hard fork that created Ethereum Classic", correct: false },
      { letter: "C", text: "Transitioning from Proof of Work to Proof of Stake", correct: true },
      { letter: "D", text: "Merging all Layer 2 networks into the main chain", correct: false },
    ],
    correctMsg: "Correct! The Merge switched Ethereum from PoW to PoS, reducing energy use by 99.95%.",
    wrongMsg: "Not quite — The Merge was the transition from Proof of Work to Proof of Stake on September 15, 2022.",
  },
  5: {
    question: "What distinguishes an NFT from a regular cryptocurrency like ETH?",
    options: [
      { letter: "A", text: "NFTs can only be stored in special wallets", correct: false },
      { letter: "B", text: "NFTs are always more valuable than regular tokens", correct: false },
      { letter: "C", text: "Each NFT is unique and not interchangeable with another", correct: true },
      { letter: "D", text: "NFTs don't use the Ethereum blockchain", correct: false },
    ],
    correctMsg: "Correct! NFTs are non-fungible — each one is unique and can't be swapped 1:1 with another.",
    wrongMsg: "Not quite — NFTs are distinguished by being unique and non-interchangeable (non-fungible).",
  },
};

export default function EthereumContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Gas calculator state
  const [gasUsed, setGasUsed] = useState(21000);
  const [baseFee, setBaseFee] = useState(25);
  const [priorityFee, setPriorityFee] = useState(2);
  const [ethPrice, setEthPrice] = useState(2500);

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

  // Gas calculator
  const totalGwei = gasUsed * (baseFee + priorityFee);
  const totalETH = totalGwei / 1e9;
  const totalUSD = totalETH * ethPrice;
  const burnETH = (gasUsed * baseFee) / 1e9;
  const burnUSD = burnETH * ethPrice;
  const tipETH = (gasUsed * priorityFee) / 1e9;
  const tipUSD = tipETH * ethPrice;

  /* ---- Quiz renderer ---- */
  const renderQuiz = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="eth101-quiz-section">
        <div className="eth101-quiz-title">Check Your Understanding</div>
        <div className="eth101-quiz-question">{q.question}</div>
        <div className="eth101-quiz-options">
          {q.options.map((opt) => {
            let cls = "eth101-quiz-option";
            if (answered) {
              cls += " disabled";
              if (opt.correct) cls += " correct";
              else if (!wasCorrect && opt === q.options.find((o) => !o.correct && o.letter === opt.letter))
                cls += "";
            }
            return (
              <div
                key={opt.letter}
                className={cls + (!answered ? "" : !opt.correct && wasCorrect === false ? "" : "")}
                onClick={() => handleQuiz(quizNum, opt.correct)}
              >
                <span className="option-letter">{opt.letter}</span>
                <span>{opt.text}</span>
              </div>
            );
          })}
        </div>
        {answered && (
          <div className={`eth101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  /* ---- Render per-option class logic (find which was clicked) ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="eth101-quiz-section">
        <div className="eth101-quiz-title">Check Your Understanding</div>
        <div className="eth101-quiz-question">{q.question}</div>
        <div className="eth101-quiz-options">
          {q.options.map((opt) => {
            let cls = "eth101-quiz-option";
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
          <div className={`eth101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="eth101">
      {/* Progress bar */}
      <div className="eth101-progress">
        <div className="eth101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`eth101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="eth101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — How Ethereum Differs from Bitcoin
          ============================================================ */}
      <div className={`eth101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="eth101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="eth101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="eth101-lesson-header-text">
            <div className="eth101-lesson-title">How Ethereum Differs from Bitcoin</div>
            <div className="eth101-lesson-meta"><span>8 min read</span><span>Foundations</span></div>
          </div>
          <div className="eth101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="eth101-lesson-content">
          <div className="eth101-lesson-body">
            <h3>More Than Digital Money</h3>
            <p>
              Bitcoin proved that decentralized digital money could work. Ethereum asked a bigger question: <strong>what if you could decentralize everything?</strong> Not just currency, but contracts, applications, financial instruments, identity systems, and governance — all running on a global, permissionless computer that nobody owns and nobody can shut down.
            </p>
            <p>
              Proposed in 2013 by <strong>Vitalik Buterin</strong> (then 19 years old) and launched in July 2015, Ethereum took Bitcoin's blockchain concept and added a crucial ingredient: <strong>programmability</strong>. While Bitcoin's scripting language is deliberately limited (it handles payments and not much else), Ethereum is <strong>Turing-complete</strong> — meaning you can write any arbitrary program and deploy it to run on the blockchain.
            </p>

            <h3>The Key Differences</h3>
            <div className="eth101-compare-grid">
              <div className="eth101-compare-card">
                <h4>{"\u20BF"} Bitcoin</h4>
                <ul>
                  <li>Purpose: Digital money / store of value</li>
                  <li>Script: Limited (send/receive only)</li>
                  <li>Block time: ~10 minutes</li>
                  <li>Consensus: Proof of Work</li>
                  <li>Supply: Fixed at 21 million</li>
                  <li>Smart contracts: Very limited</li>
                  <li>Philosophy: "Digital gold" — do one thing perfectly</li>
                </ul>
              </div>
              <div className="eth101-compare-card">
                <h4>{"\u039E"} Ethereum</h4>
                <ul>
                  <li>Purpose: Programmable world computer</li>
                  <li>Language: Turing-complete (Solidity)</li>
                  <li>Block time: ~12 seconds</li>
                  <li>Consensus: Proof of Stake</li>
                  <li>Supply: No hard cap (deflationary since EIP-1559)</li>
                  <li>Smart contracts: Full-featured</li>
                  <li>Philosophy: "Build anything" — general-purpose platform</li>
                </ul>
              </div>
            </div>

            <div className="eth101-info-box">
              <div className="eth101-info-box-label">The Analogy</div>
              <p>
                If Bitcoin is a <strong>calculator</strong> — excellent at one thing (moving value) — then Ethereum is a <strong>smartphone</strong>. It can do what Bitcoin does, but it can also run apps, execute contracts, create tokens, manage organizations, and much more. The tradeoff is complexity: a calculator is simpler, more reliable, and harder to break.
              </p>
            </div>

            <h3>Account Model vs. UTXO Model</h3>
            <p>
              Bitcoin and Ethereum handle balances differently at a fundamental level. Bitcoin uses <strong>UTXOs</strong> (Unspent Transaction Outputs) — your balance is the sum of all unspent outputs addressed to you, like having various bills in your wallet. Ethereum uses an <strong>account model</strong> — more like a bank account with a running balance that gets updated with each transaction. This simpler model makes smart contracts much easier to build.
            </p>

            <div className="eth101-stats-row">
              <div className="eth101-stat-card"><div className="eth101-stat-value">~12s</div><div className="eth101-stat-label">Block time</div></div>
              <div className="eth101-stat-card"><div className="eth101-stat-value">~1M</div><div className="eth101-stat-label">Smart contracts deployed</div></div>
              <div className="eth101-stat-card"><div className="eth101-stat-value">$400B+</div><div className="eth101-stat-label">Market cap</div></div>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`eth101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Smart Contracts & the EVM
          ============================================================ */}
      <div className={`eth101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="eth101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="eth101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="eth101-lesson-header-text">
            <div className="eth101-lesson-title">Smart Contracts & the EVM</div>
            <div className="eth101-lesson-meta"><span>10 min read</span><span>Technical</span></div>
          </div>
          <div className="eth101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="eth101-lesson-content">
          <div className="eth101-lesson-body">
            <h3>What Is a Smart Contract?</h3>
            <p>
              A smart contract is a <strong>program stored on the blockchain</strong> that executes automatically when predetermined conditions are met. Think of it as a vending machine: you put in the right inputs (coins + selection), and the machine automatically delivers the output (your snack). No cashier needed, no trust required — the machine's logic handles everything.
            </p>
            <p>
              On Ethereum, smart contracts are written in a language called <strong>Solidity</strong> (which looks similar to JavaScript), compiled into bytecode, and deployed to the blockchain. Once deployed, the contract lives at a specific address, and anyone can interact with it by sending transactions. The code is public, the execution is deterministic, and no one — not even the creator — can alter the code after deployment (unless the contract is explicitly designed to be upgradeable).
            </p>

            <h3>What a Smart Contract Looks Like</h3>
            <div className="eth101-contract-visual">
              <div className="eth101-contract-code">
                <span className="comment">{"// A simple token vault contract"}</span>{"\n"}
                <span className="keyword">pragma solidity</span> ^0.8.19;{"\n"}
                {"\n"}
                <span className="keyword">contract</span> <span className="func">SimpleVault</span> {"{"}{"\n"}
                {"    "}<span className="keyword">mapping</span>(<span className="type">address</span> =&gt; <span className="type">uint256</span>) <span className="keyword">public</span> balances;{"\n"}
                {"\n"}
                {"    "}<span className="comment">{"// Deposit ETH into the vault"}</span>{"\n"}
                {"    "}<span className="keyword">function</span> <span className="func">deposit</span>() <span className="keyword">external payable</span> {"{"}{"\n"}
                {"        "}balances[msg.sender] += msg.value;{"\n"}
                {"    "}{"}"}{"\n"}
                {"\n"}
                {"    "}<span className="comment">{"// Withdraw your ETH"}</span>{"\n"}
                {"    "}<span className="keyword">function</span> <span className="func">withdraw</span>(<span className="type">uint256</span> amount) <span className="keyword">external</span> {"{"}{"\n"}
                {"        "}<span className="keyword">require</span>(balances[msg.sender] &gt;= amount, <span className="str">"Insufficient balance"</span>);{"\n"}
                {"        "}balances[msg.sender] -= amount;{"\n"}
                {"        "}payable(msg.sender).<span className="func">transfer</span>(amount);{"\n"}
                {"    "}{"}"}{"\n"}
                {"}"}
              </div>
            </div>
            <p>
              This simple contract lets anyone deposit ETH and withdraw it later. The <code>require</code> statement ensures you can't withdraw more than you deposited. No bank, no admin, no permission needed — just math and code.
            </p>

            <h3>The Ethereum Virtual Machine (EVM)</h3>
            <p>
              The <strong>EVM</strong> is the runtime environment where smart contracts execute. Every Ethereum node runs a copy of the EVM, and every contract execution produces the same result on every node. Think of it as a <strong>global, decentralized computer</strong> where thousands of machines simultaneously run the same program and verify they all get the same answer.
            </p>

            <div className="eth101-three-col">
              <div className="eth101-col-card">
                <h4>Deterministic</h4>
                <p>Given the same input and state, the EVM always produces the same output on every node. No randomness, no variations.</p>
              </div>
              <div className="eth101-col-card">
                <h4>Sandboxed</h4>
                <p>Each contract runs in isolation. A bug in one contract can't crash the network or access another contract's data without permission.</p>
              </div>
              <div className="eth101-col-card">
                <h4>Metered</h4>
                <p>Every operation costs gas (computational units). This prevents infinite loops and ensures the network can't be spammed with runaway code.</p>
              </div>
            </div>

            <div className="eth101-info-box cyan">
              <div className="eth101-info-box-label">EVM Compatibility</div>
              <p>
                The EVM has become the <strong>standard runtime</strong> for smart contract blockchains. Chains like Polygon, Arbitrum, Optimism, Avalanche, and BNB Chain are all "EVM-compatible" — meaning Solidity contracts deploy to these chains with minimal or no changes. This is why the Oeconomia protocols can target multiple chains: the same Solidity code runs everywhere the EVM does.
              </p>
            </div>

            <div className="eth101-info-box orange">
              <div className="eth101-info-box-label">Immutability Warning</div>
              <p>
                Once deployed, a smart contract's code <strong>cannot be changed</strong>. If there's a bug, you can't patch it — the flawed contract exists permanently on the blockchain. This is why auditing, testing, and formal verification are critical in smart contract development. Upgradeable proxy patterns exist but add complexity and trust assumptions.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`eth101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — What Gas Is & How Fees Work
          ============================================================ */}
      <div className={`eth101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="eth101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="eth101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="eth101-lesson-header-text">
            <div className="eth101-lesson-title">What Gas Is & How Fees Work</div>
            <div className="eth101-lesson-meta"><span>10 min read</span><span>Economics</span></div>
          </div>
          <div className="eth101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="eth101-lesson-content">
          <div className="eth101-lesson-body">
            <h3>The Concept of Gas</h3>
            <p>
              <strong>Gas</strong> is the unit that measures the computational effort required to execute an operation on Ethereum. Every action — sending ETH, calling a smart contract function, deploying code, storing data — costs a specific amount of gas. Simple transfers cost 21,000 gas. Complex DeFi transactions might cost 200,000-500,000+ gas.
            </p>
            <p>
              Think of gas like fuel for a car. The destination (what you want to do) determines how much fuel you need. The price per gallon (gas price) fluctuates based on demand. Your total bill = gallons needed x price per gallon.
            </p>

            <h3>The Fee Formula</h3>
            <div className="eth101-data-block">
              <div className="eth101-data-section-label">How Transaction Fees Are Calculated</div>
              <div className="eth101-data-row"><span className="eth101-data-label">Transaction Fee</span><span className="eth101-data-value">=</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Gas Used</span><span className="eth101-data-value purple">x (Base Fee + Priority Fee)</span></div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12, marginTop: 8 }}>
                <div className="eth101-data-row"><span className="eth101-data-label">Gas Used</span><span className="eth101-data-value">Amount of computation (fixed per operation)</span></div>
                <div className="eth101-data-row"><span className="eth101-data-label">Base Fee</span><span className="eth101-data-value orange">Set by the network (burned!)</span></div>
                <div className="eth101-data-row"><span className="eth101-data-label">Priority Fee (Tip)</span><span className="eth101-data-value green">Set by you (goes to validator)</span></div>
              </div>
            </div>

            <h3>Try It: Gas Fee Calculator</h3>
            <div className="eth101-gas-calc">
              <div className="eth101-gas-row">
                <div className="eth101-gas-input-group">
                  <div className="eth101-gas-input-label">Gas Used</div>
                  <input type="number" className="eth101-gas-input" value={gasUsed} onChange={(e) => setGasUsed(Number(e.target.value) || 0)} />
                </div>
                <div className="eth101-gas-input-group">
                  <div className="eth101-gas-input-label">Base Fee (Gwei)</div>
                  <input type="number" className="eth101-gas-input" value={baseFee} onChange={(e) => setBaseFee(Number(e.target.value) || 0)} />
                </div>
                <div className="eth101-gas-input-group">
                  <div className="eth101-gas-input-label">Priority Fee (Gwei)</div>
                  <input type="number" className="eth101-gas-input" value={priorityFee} onChange={(e) => setPriorityFee(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="eth101-gas-row">
                <div className="eth101-gas-input-group">
                  <div className="eth101-gas-input-label">ETH Price (USD)</div>
                  <input type="number" className="eth101-gas-input" value={ethPrice} onChange={(e) => setEthPrice(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="eth101-gas-result">
                <div className="eth101-gas-result-value">{totalETH.toFixed(6)} ETH</div>
                <div className="eth101-gas-result-label">Total Fee: ${totalUSD.toFixed(2)}</div>
                <div className="eth101-gas-result-burn">
                  Base fee burned: ${burnUSD.toFixed(2)} | Validator tip: ${tipUSD.toFixed(2)}
                </div>
              </div>
            </div>

            <h3>EIP-1559: The Fee Burn</h3>
            <p>
              In August 2021, Ethereum implemented <strong>EIP-1559</strong>, one of the most significant economic changes in crypto history. Before EIP-1559, the entire fee went to miners. After, the fee was split into two parts: a <strong>base fee</strong> that gets <strong>permanently burned</strong> (destroyed), and a <strong>priority fee</strong> (tip) that goes to the validator.
            </p>
            <p>
              The burn mechanism is critical. Every transaction on Ethereum permanently removes some ETH from circulation. During periods of high network usage, more ETH is burned than is issued to validators — making Ethereum <strong>deflationary</strong>. Since The Merge, the total ETH supply has actually decreased over time.
            </p>

            <div className="eth101-info-box green">
              <div className="eth101-info-box-label">Why Gas Prices Fluctuate</div>
              <p>
                Gas prices are driven by <strong>network demand</strong>. When many people want to use Ethereum simultaneously (NFT mint, DeFi farming opportunity, market volatility), gas prices spike because users bid higher priority fees to get their transactions included first. During quiet periods, fees drop to just a few cents. Layer 2 solutions like Arbitrum and Optimism reduce fees by batching transactions off the main chain.
              </p>
            </div>

            <div className="eth101-data-block">
              <div className="eth101-data-section-label">Typical Gas Costs (at 25 Gwei base)</div>
              <div className="eth101-data-row"><span className="eth101-data-label">ETH Transfer</span><span className="eth101-data-value">21,000 gas ~ $1.30</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">ERC-20 Token Transfer</span><span className="eth101-data-value">65,000 gas ~ $4.06</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Uniswap Swap</span><span className="eth101-data-value">150,000 gas ~ $9.38</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">NFT Mint</span><span className="eth101-data-value">200,000+ gas ~ $12.50+</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Contract Deployment</span><span className="eth101-data-value">1,000,000+ gas ~ $62.50+</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Same swap on Arbitrum L2</span><span className="eth101-data-value green">~$0.10-0.30</span></div>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`eth101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Ethereum's Transition to Proof of Stake
          ============================================================ */}
      <div className={`eth101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="eth101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="eth101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="eth101-lesson-header-text">
            <div className="eth101-lesson-title">Ethereum's Transition to Proof of Stake</div>
            <div className="eth101-lesson-meta"><span>8 min read</span><span>History</span></div>
          </div>
          <div className="eth101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="eth101-lesson-content">
          <div className="eth101-lesson-body">
            <h3>The Most Complex Upgrade in Crypto History</h3>
            <p>
              On September 15, 2022, Ethereum executed <strong>"The Merge"</strong> — switching from Proof of Work to Proof of Stake while the network was live with hundreds of billions of dollars at stake. It's been compared to changing the engine of an airplane mid-flight. Years of development, testing, and coordination led to a transition so smooth that most users didn't notice it happen.
            </p>

            <h3>The Road to The Merge</h3>
            <div className="eth101-merge-timeline">
              <div className="eth101-merge-item pow">
                <div className="eth101-merge-date">July 2015 — Launch</div>
                <div className="eth101-merge-text">Ethereum launches on <strong>Proof of Work</strong>, similar to Bitcoin. GPU mining becomes hugely popular and profitable.</div>
              </div>
              <div className="eth101-merge-item">
                <div className="eth101-merge-date">December 2020 — Beacon Chain</div>
                <div className="eth101-merge-text">The Beacon Chain launches as a separate <strong>Proof of Stake chain</strong> running in parallel. Validators begin staking 32 ETH. The two chains run simultaneously for almost 2 years.</div>
              </div>
              <div className="eth101-merge-item">
                <div className="eth101-merge-date">2021-2022 — Testing</div>
                <div className="eth101-merge-text">Multiple testnets (Ropsten, Goerli, Sepolia) successfully merge. Hundreds of client teams, researchers, and validators coordinate preparations.</div>
              </div>
              <div className="eth101-merge-item pos">
                <div className="eth101-merge-date">September 15, 2022 — The Merge</div>
                <div className="eth101-merge-text">At block 15,537,393, the PoW execution layer merges with the PoS Beacon Chain. <strong>Mining stops forever.</strong> Energy consumption drops 99.95% overnight. Not a single transaction is missed.</div>
              </div>
              <div className="eth101-merge-item pos">
                <div className="eth101-merge-date">April 2023 — Shanghai/Capella</div>
                <div className="eth101-merge-text"><strong>Staked ETH withdrawals</strong> are enabled for the first time. Validators can now unstake and access their ETH + rewards.</div>
              </div>
              <div className="eth101-merge-item pos">
                <div className="eth101-merge-date">2024+ — Dencun & Beyond</div>
                <div className="eth101-merge-text"><strong>EIP-4844 (Proto-Danksharding)</strong> dramatically reduces Layer 2 fees. The roadmap continues toward full sharding, statelessness, and a fully scalable PoS network.</div>
              </div>
            </div>

            <h3>Before and After</h3>
            <div className="eth101-data-block">
              <div className="eth101-data-section-label">The Merge: Impact</div>
              <div className="eth101-data-row"><span className="eth101-data-label">Energy Consumption</span><span className="eth101-data-value green">{"\u2193"} 99.95%</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">ETH Issuance Rate</span><span className="eth101-data-value green">{"\u2193"} ~90% (from ~13,000 to ~1,600 ETH/day)</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Net Supply Change</span><span className="eth101-data-value green">Deflationary (burn &gt; issuance)</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Block Time</span><span className="eth101-data-value">~13s {"\u2192"} exactly 12s (consistent)</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Transaction Speed</span><span className="eth101-data-value amber">No change (same throughput)</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Validator Count</span><span className="eth101-data-value purple">~1,000,000 active validators</span></div>
              <div className="eth101-data-row"><span className="eth101-data-label">Staked ETH</span><span className="eth101-data-value purple">~33 million ETH (~$80B+)</span></div>
            </div>

            <div className="eth101-info-box">
              <div className="eth101-info-box-label">"Ultra Sound Money"</div>
              <p>
                After The Merge, the combination of reduced issuance (PoS requires far less new ETH than PoW) and EIP-1559's fee burn means Ethereum's total supply is <strong>decreasing over time</strong>. The community calls this "ultra sound money" — a play on Bitcoin's "sound money" narrative, arguing that a deflationary asset with decreasing supply is even more scarce than one with a fixed supply that hasn't been fully issued yet.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`eth101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — The Ecosystem: DeFi, NFTs & DAOs
          ============================================================ */}
      <div className={`eth101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="eth101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="eth101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="eth101-lesson-header-text">
            <div className="eth101-lesson-title">The Ecosystem: DeFi, NFTs & DAOs</div>
            <div className="eth101-lesson-meta"><span>10 min read</span><span>Ecosystem</span></div>
          </div>
          <div className="eth101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="eth101-lesson-content">
          <div className="eth101-lesson-body">
            <h3>What Smart Contracts Unlocked</h3>
            <p>
              Ethereum's programmability didn't just enable new kinds of tokens — it spawned <strong>entirely new categories</strong> of applications that couldn't exist before. Three categories have dominated: Decentralized Finance (DeFi), Non-Fungible Tokens (NFTs), and Decentralized Autonomous Organizations (DAOs). Together, they represent the foundation of what's being called the "decentralized internet" or Web3.
            </p>

            {/* DeFi */}
            <div className="eth101-eco-card">
              <div className="eth101-eco-header">
                <div className="eth101-eco-icon defi">{"🏦"}</div>
                <div>
                  <div className="eth101-eco-name">Decentralized Finance (DeFi)</div>
                  <div className="eth101-eco-sub">Rebuilding finance without banks</div>
                </div>
              </div>
              <div className="eth101-eco-body">
                <p>DeFi recreates traditional financial services — lending, borrowing, trading, insurance, savings — using smart contracts instead of banks or brokers. There's no loan officer, no application, no credit check. The code is the intermediary, and it operates 24/7, globally, for anyone with an internet connection.</p>
                <p><strong>How it works:</strong> Protocols like Aave let you deposit crypto and earn interest (supplied by borrowers who post collateral). Uniswap lets anyone trade tokens using automated market makers (liquidity pools) instead of order books. Compound, Curve, and MakerDAO each automate different financial primitives through smart contracts.</p>
                <p><strong>Scale:</strong> At peak, DeFi protocols held over $180 billion in Total Value Locked (TVL). Even after market downturns, tens of billions remain locked in DeFi contracts, processing billions in daily volume.</p>
              </div>
              <div className="eth101-eco-examples">
                <span className="eth101-eco-tag">Uniswap (DEX)</span>
                <span className="eth101-eco-tag">Aave (Lending)</span>
                <span className="eth101-eco-tag">MakerDAO (Stablecoin)</span>
                <span className="eth101-eco-tag">Curve (Stableswaps)</span>
                <span className="eth101-eco-tag">Lido (Liquid Staking)</span>
              </div>
            </div>

            {/* NFTs */}
            <div className="eth101-eco-card">
              <div className="eth101-eco-header">
                <div className="eth101-eco-icon nft">{"🎨"}</div>
                <div>
                  <div className="eth101-eco-name">Non-Fungible Tokens (NFTs)</div>
                  <div className="eth101-eco-sub">Digital ownership, provably unique</div>
                </div>
              </div>
              <div className="eth101-eco-body">
                <p>An NFT is a <strong>unique token</strong> on the blockchain that represents ownership of a specific asset — digital art, music, game items, real estate deeds, event tickets, or anything else that needs to be individually identifiable. Unlike ETH or Bitcoin (where every unit is interchangeable), each NFT is one-of-a-kind.</p>
                <p><strong>How it works:</strong> NFTs use the <strong>ERC-721</strong> (unique items) or <strong>ERC-1155</strong> (semi-fungible, like editions) token standards. The token on-chain points to metadata (often stored on IPFS) that describes the asset. Ownership is verifiable, transferable, and permanent on the blockchain.</p>
                <p><strong>Beyond art:</strong> While digital art drove the 2021 NFT boom, the technology applies broadly — domain names (ENS), gaming assets, membership passes, royalty-bearing music, and proof of attendance. Smart contract royalties ensure creators earn on every secondary sale.</p>
              </div>
              <div className="eth101-eco-examples">
                <span className="eth101-eco-tag">OpenSea (Marketplace)</span>
                <span className="eth101-eco-tag">ENS (Domains)</span>
                <span className="eth101-eco-tag">ERC-721 Standard</span>
                <span className="eth101-eco-tag">IPFS (Storage)</span>
                <span className="eth101-eco-tag">On-chain Royalties</span>
              </div>
            </div>

            {/* DAOs */}
            <div className="eth101-eco-card">
              <div className="eth101-eco-header">
                <div className="eth101-eco-icon dao">{"🏛"}</div>
                <div>
                  <div className="eth101-eco-name">Decentralized Autonomous Organizations (DAOs)</div>
                  <div className="eth101-eco-sub">Internet-native governance</div>
                </div>
              </div>
              <div className="eth101-eco-body">
                <p>A DAO is an <strong>organization governed by smart contracts and token-holder votes</strong> rather than a CEO or board of directors. Members hold governance tokens that give them voting power over decisions — treasury spending, protocol upgrades, partnerships, and strategic direction. Everything is transparent and executed on-chain.</p>
                <p><strong>How it works:</strong> A member creates a proposal (e.g., "Allocate 100,000 tokens to fund a developer grant"). Token holders vote during a defined period. If the proposal passes the required threshold, the smart contract automatically executes the action. No intermediary can block or alter the outcome.</p>
                <p><strong>Real impact:</strong> DAOs manage billions in treasury funds. Uniswap's DAO governs a protocol processing billions in daily volume. MakerDAO's governance controls the parameters of a stablecoin with billions in circulation. ConstitutionDAO famously raised $47 million in days to try to buy a copy of the US Constitution.</p>
              </div>
              <div className="eth101-eco-examples">
                <span className="eth101-eco-tag">Uniswap Governance</span>
                <span className="eth101-eco-tag">MakerDAO</span>
                <span className="eth101-eco-tag">Snapshot (Voting)</span>
                <span className="eth101-eco-tag">Gnosis Safe (Treasury)</span>
                <span className="eth101-eco-tag">Nouns DAO</span>
              </div>
            </div>

            <div className="eth101-info-box green">
              <div className="eth101-info-box-label">Oeconomia: All Three Combined</div>
              <p>
                The Oeconomia ecosystem is a living example of all three pillars. <strong>Eloqura</strong> is DeFi (AMM/DEX with V2+V3 liquidity). <strong>Alluria</strong> is DeFi (collateralized lending with ALUD stablecoin). <strong>Artivya</strong> combines DeFi trading with an NFT marketplace. And <strong>OEC governance</strong> is a DAO — Guardian stakers vote on proposals that direct the protocol's treasury and development. These aren't separate concepts; they're interconnected layers of the same decentralized economy.
              </p>
            </div>

            <h3>The Bigger Picture</h3>
            <div className="eth101-stats-row">
              <div className="eth101-stat-card"><div className="eth101-stat-value">$50B+</div><div className="eth101-stat-label">DeFi Total Value Locked</div></div>
              <div className="eth101-stat-card"><div className="eth101-stat-value">$70B+</div><div className="eth101-stat-label">NFT cumulative volume</div></div>
              <div className="eth101-stat-card"><div className="eth101-stat-value">$30B+</div><div className="eth101-stat-label">DAO-managed treasuries</div></div>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`eth101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
