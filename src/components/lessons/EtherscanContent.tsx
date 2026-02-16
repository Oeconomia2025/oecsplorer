// ============================================================
// Reading Etherscan Like a Pro — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./etherscan.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "Navigating Transaction Details: From, To, Value, Gas", meta: "10 min read \u00b7 Foundations" },
  { num: 2, title: "Decoding Input Data and Event Logs", meta: "10 min read \u00b7 Technical" },
  { num: 3, title: "Checking if a Contract is Verified", meta: "8 min read \u00b7 Security" },
  { num: 4, title: "Reading Token Transfers and Internal Transactions", meta: "10 min read \u00b7 Analysis" },
  { num: 5, title: "Using Etherscan's Read/Write Contract Interface", meta: "10 min read \u00b7 Practical" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What does a green checkmark on an Etherscan transaction mean?",
    options: [
      { letter: "A", text: "The transaction was verified by the Ethereum Foundation", correct: false },
      { letter: "B", text: "The transaction was successful (did not revert)", correct: true },
      { letter: "C", text: "The transaction was free (no gas was paid)", correct: false },
      { letter: "D", text: "The sender's identity has been verified", correct: false },
    ],
    correctMsg: "Correct! A green checkmark means the transaction executed successfully without reverting. A red X means it failed.",
    wrongMsg: "Not quite \u2014 a green checkmark on Etherscan means the transaction was successful and did not revert.",
  },
  2: {
    question: "What are the first 4 bytes of transaction input data?",
    options: [
      { letter: "A", text: "The sender's address", correct: false },
      { letter: "B", text: "The gas limit", correct: false },
      { letter: "C", text: "The function selector \u2014 a hash of the function signature being called", correct: true },
      { letter: "D", text: "The block number", correct: false },
    ],
    correctMsg: "Correct! The first 4 bytes are the function selector \u2014 the first 4 bytes of the keccak256 hash of the function signature (e.g., transfer(address,uint256)).",
    wrongMsg: "Not quite \u2014 the first 4 bytes of input data are the function selector, derived from the keccak256 hash of the function signature.",
  },
  3: {
    question: "Why is contract verification important?",
    options: [
      { letter: "A", text: "It makes the contract run faster", correct: false },
      { letter: "B", text: "It lets anyone read the source code and verify the contract does what it claims", correct: true },
      { letter: "C", text: "It's required by law", correct: false },
      { letter: "D", text: "It prevents the contract from being hacked", correct: false },
    ],
    correctMsg: "Correct! Verification lets anyone read and audit the source code, confirming the contract behaves as claimed.",
    wrongMsg: "Not quite \u2014 contract verification is important because it lets anyone read the source code and verify the contract does what it claims.",
  },
  4: {
    question: "What are 'internal transactions' on Etherscan?",
    options: [
      { letter: "A", text: "Transactions that haven't been confirmed yet", correct: false },
      { letter: "B", text: "Private transactions hidden from the public", correct: false },
      { letter: "C", text: "Calls made by one smart contract to another during a transaction", correct: true },
      { letter: "D", text: "Transactions within the same wallet", correct: false },
    ],
    correctMsg: "Correct! Internal transactions are contract-to-contract calls that happen during the execution of a user's transaction.",
    wrongMsg: "Not quite \u2014 internal transactions are calls made by one smart contract to another during the execution of a transaction.",
  },
  5: {
    question: "Can you interact with a smart contract directly through Etherscan?",
    options: [
      { letter: "A", text: "No, you always need a custom frontend", correct: false },
      { letter: "B", text: "Only if you're a developer with special access", correct: false },
      { letter: "C", text: "Yes \u2014 using the Read/Write Contract tabs, you can call any function without a frontend", correct: true },
      { letter: "D", text: "Only for reading data, not for writing", correct: false },
    ],
    correctMsg: "Correct! Etherscan's Read/Write tabs let you call any contract function directly \u2014 Read for free queries, Write for state-changing transactions.",
    wrongMsg: "Not quite \u2014 yes, you can interact with any verified contract directly through Etherscan's Read/Write Contract tabs.",
  },
};

export default function EtherscanContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Transaction decoder state
  const [decoded, setDecoded] = useState(false);

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
      <div className="es101-quiz-section">
        <div className="es101-quiz-title">Check Your Understanding</div>
        <div className="es101-quiz-question">{q.question}</div>
        <div className="es101-quiz-options">
          {q.options.map((opt) => {
            let cls = "es101-quiz-option";
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
          <div className={`es101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  /* ---- Transaction decoder renderer ---- */
  const renderTransactionDecoder = () => (
    <div className="es101-decoder">
      <div className="es101-decoder-raw">
        {!decoded ? (
          <>
            <span>0x</span>
            <span className="selector">38ed1739</span>
            <span className="param">0000000000000000000000000000000000000000000000000de0b6b3a7640000</span>
            <span className="param">000000000000000000000000000000000000000000000000000000000098968</span>
            <span className="param">000000000000000000000000000000000000000000000000000000000000000a0</span>
            <span className="param">0000000000000000000000005b38da6a701c568545dcfcb03fcb875f56beddc4</span>
            <span className="param">0000000000000000000000000000000000000000000000000000000065a8f2c0</span>
            <span>...remaining parameter data</span>
          </>
        ) : (
          <>
            <span className="selector">Function:</span> swapExactTokensForTokens{"\n"}
            <span className="param">Selector: 0x38ed1739</span>
          </>
        )}
      </div>

      <div
        className={`es101-decode-btn${decoded ? " decoded" : ""}`}
        onClick={() => !decoded && setDecoded(true)}
      >
        {decoded ? "\u2713 Decoded Successfully" : "Decode Transaction \u2192"}
      </div>

      {decoded && (
        <div className="es101-decoded-result">
          <div className="es101-decoded-header">Decoded Transaction Data</div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">Function</span>
            <span className="es101-decoded-val func">swapExactTokensForTokens()</span>
          </div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">amountIn</span>
            <span className="es101-decoded-val num">1,000,000,000,000,000,000 (1.0 tokens)</span>
          </div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">amountOutMin</span>
            <span className="es101-decoded-val num">10,000,000 (10.0 USDC)</span>
          </div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">path</span>
            <span className="es101-decoded-val addr">[OEC {"\u2192"} WETH {"\u2192"} USDC]</span>
          </div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">to</span>
            <span className="es101-decoded-val addr">0x5b38...ddc4</span>
          </div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">deadline</span>
            <span className="es101-decoded-val num">1705636544 (Jan 19, 2024 12:15:44 UTC)</span>
          </div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">Gas Used</span>
            <span className="es101-decoded-val num">152,847 / 300,000 limit</span>
          </div>
          <div className="es101-decoded-row">
            <span className="es101-decoded-key">Status</span>
            <span className="es101-decoded-val success">{"\u2713"} Success</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="es101">
      {/* Progress bar */}
      <div className="es101-progress">
        <div className="es101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`es101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="es101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — Navigating Transaction Details
          ============================================================ */}
      <div className={`es101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="es101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="es101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="es101-lesson-header-text">
            <div className="es101-lesson-title">Navigating Transaction Details: From, To, Value, Gas</div>
            <div className="es101-lesson-meta"><span>10 min read</span><span>Foundations</span></div>
          </div>
          <div className="es101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="es101-lesson-content">
          <div className="es101-lesson-body">
            <h3>The Anatomy of a Transaction</h3>
            <p>
              Every transaction on Ethereum is a permanent, publicly visible record. When you open a transaction on Etherscan, you're looking at the complete story of what happened — who sent it, where it went, how much it cost, and whether it succeeded. Learning to read this information is like learning to read a financial statement: once you understand the fields, the entire blockchain becomes transparent.
            </p>
            <p>
              Etherscan displays transactions in a structured format with clearly labeled fields. Each field tells you something specific about the transaction. Let's break down every field you'll encounter.
            </p>

            <h3>Transaction Fields Explained</h3>
            <div className="es101-data-block">
              <div className="es101-data-section-label">Etherscan Transaction Details</div>
              <div className="es101-data-row"><span className="es101-data-label">Transaction Hash</span><span className="es101-data-value cyan">Unique 66-character identifier (0x...)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Status</span><span className="es101-data-value green">Success (green) or Failed (red)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Block</span><span className="es101-data-value">Block number where tx was included</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Timestamp</span><span className="es101-data-value">When the block was produced</span></div>
              <div className="es101-data-row"><span className="es101-data-label">From</span><span className="es101-data-value purple">Sender address (who initiated the tx)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">To</span><span className="es101-data-value purple">Recipient address (EOA or contract)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Value</span><span className="es101-data-value amber">Amount of ETH transferred (can be 0)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Gas Price</span><span className="es101-data-value orange">Price per gas unit in Gwei</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Gas Limit</span><span className="es101-data-value">Maximum gas the sender is willing to pay</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Gas Used</span><span className="es101-data-value orange">Actual gas consumed by execution</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Nonce</span><span className="es101-data-value">Sequential tx count from sender's address</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Input Data</span><span className="es101-data-value blue">Encoded function call data (or empty for ETH transfers)</span></div>
            </div>

            <div className="es101-info-box blue">
              <div className="es101-info-box-label">Reading the Status Field</div>
              <p>
                The <strong>Status</strong> field is the first thing to check. A green checkmark means the transaction executed successfully. A red exclamation mark means it <strong>reverted</strong> — the operation failed and all state changes were rolled back. Common revert reasons include: insufficient balance, slippage exceeded, approval not set, or a require() condition failing. Even failed transactions cost gas (the computation was performed, it just didn't produce the desired result).
              </p>
            </div>

            <div className="es101-info-box green">
              <div className="es101-info-box-label">The Nonce Field</div>
              <p>
                The <strong>nonce</strong> is a sequential counter of how many transactions an address has sent. Your first transaction is nonce 0, second is nonce 1, and so on. This prevents replay attacks (submitting the same transaction twice) and ensures transactions from an address are processed in order. If you see a "stuck" transaction, it's often because a lower-nonce transaction hasn't been confirmed yet.
              </p>
            </div>

            <p>
              A key insight: when the "To" field shows a contract address (often labeled with the contract name), the transaction is a <strong>contract interaction</strong>. The "Value" field might be 0 ETH even though tokens are moving — because ERC-20 token transfers don't involve ETH value, they're encoded in the Input Data. We'll learn to read that in the next section.
            </p>

            {renderQuizWithSelection(1)}
            <button className={`es101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Decoding Input Data and Event Logs
          ============================================================ */}
      <div className={`es101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="es101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="es101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="es101-lesson-header-text">
            <div className="es101-lesson-title">Decoding Input Data and Event Logs</div>
            <div className="es101-lesson-meta"><span>10 min read</span><span>Technical</span></div>
          </div>
          <div className="es101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="es101-lesson-content">
          <div className="es101-lesson-body">
            <h3>What Input Data Contains</h3>
            <p>
              When you send a transaction to a smart contract, the <strong>Input Data</strong> field contains the encoded function call — which function to execute and what parameters to pass. In its raw form, it looks like an incomprehensible hex string. But it follows a precise structure that Etherscan (and other tools) can decode.
            </p>
            <p>
              The first <strong>4 bytes</strong> (8 hex characters after 0x) are the <strong>function selector</strong>. This is calculated by taking the first 4 bytes of the keccak256 hash of the function's signature. For example, <code>transfer(address,uint256)</code> hashes to <code>0xa9059cbb...</code>, so any transaction starting with <code>0xa9059cbb</code> in its input data is a token transfer. The remaining bytes are the ABI-encoded parameters.
            </p>

            <h3>A Decoded Swap Call</h3>
            <div className="es101-data-block">
              <div className="es101-data-section-label">Decoded Input Data: DEX Swap</div>
              <div className="es101-data-row"><span className="es101-data-label">Function</span><span className="es101-data-value amber">swapExactTokensForTokens()</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Selector</span><span className="es101-data-value cyan">0x38ed1739</span></div>
              <div className="es101-data-row"><span className="es101-data-label">amountIn</span><span className="es101-data-value">1,000,000,000,000,000,000 (1.0 token)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">amountOutMin</span><span className="es101-data-value">9,500,000 (9.5 USDC min)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">path</span><span className="es101-data-value purple">[tokenA {"\u2192"} WETH {"\u2192"} USDC]</span></div>
              <div className="es101-data-row"><span className="es101-data-label">to</span><span className="es101-data-value">0x5b38...ddc4 (recipient)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">deadline</span><span className="es101-data-value orange">1705636544 (Unix timestamp)</span></div>
            </div>

            <h3>Event Logs: The Transaction's Receipts</h3>
            <p>
              <strong>Event logs</strong> are data emitted by smart contracts during execution. They don't modify state (and are cheaper than storage), but they create a permanent, indexed record of what happened. Think of them as receipts. When you view a transaction's "Logs" tab on Etherscan, you see every event emitted during execution.
            </p>
            <p>
              A single DEX swap might emit 3-5 events: a <code>Transfer</code> event for tokens leaving your wallet, another <code>Transfer</code> for tokens entering the pool, a <code>Swap</code> event from the pool contract recording the trade details, and another <code>Transfer</code> for tokens coming back to you. Reading these events tells the full story of what happened under the hood.
            </p>

            <div className="es101-info-box cyan">
              <div className="es101-info-box-label">Indexed vs. Non-Indexed Parameters</div>
              <p>
                Events can have <strong>indexed</strong> parameters (up to 3) which are stored as "topics" and are efficiently searchable. Non-indexed parameters are stored in the "data" field. This is how Etherscan can quickly find all transfers involving your address — the <code>from</code> and <code>to</code> parameters in the Transfer event are indexed. When building queries or filters, you can only filter by indexed parameters.
              </p>
            </div>

            <h3>Try It: Transaction Decoder</h3>
            {renderTransactionDecoder()}

            <div className="es101-info-box purple">
              <div className="es101-info-box-label">4byte.directory</div>
              <p>
                Even if a contract isn't verified, you can often identify function calls using the <strong>4byte.directory</strong> — a public database that maps function selectors to their human-readable signatures. Etherscan uses this automatically, but you can also look up selectors manually. If you see <code>0xa9059cbb</code>, that's almost certainly <code>transfer(address,uint256)</code>.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`es101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Checking if a Contract is Verified
          ============================================================ */}
      <div className={`es101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="es101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="es101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="es101-lesson-header-text">
            <div className="es101-lesson-title">Checking if a Contract is Verified</div>
            <div className="es101-lesson-meta"><span>8 min read</span><span>Security</span></div>
          </div>
          <div className="es101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="es101-lesson-content">
          <div className="es101-lesson-body">
            <h3>What Contract Verification Means</h3>
            <p>
              When a smart contract is deployed, only the compiled <strong>bytecode</strong> lives on the blockchain — raw machine instructions that are nearly impossible for humans to read. <strong>Contract verification</strong> is the process of submitting the original Solidity source code to Etherscan, which then compiles it independently and confirms the bytecode matches. If it matches, the contract gets a green checkmark and the source code becomes publicly readable.
            </p>
            <p>
              This is critical for trust. Without verification, you're interacting with a black box. With verification, anyone can read every line of code, understand what the contract does, check for vulnerabilities, and verify that the developer's claims are accurate. It's the difference between signing a document you can read and signing one in an unknown language.
            </p>

            <h3>Verified vs. Unverified Contracts</h3>
            <div className="es101-compare-grid">
              <div className="es101-compare-card">
                <h4>{"\u2713"} Verified Contract</h4>
                <ul>
                  <li>Source code is publicly readable on Etherscan</li>
                  <li>Green checkmark on the Contract tab</li>
                  <li>Read/Write tabs are available with named functions</li>
                  <li>Anyone can audit the code</li>
                  <li>Function names and parameters are human-readable</li>
                  <li>Industry standard for trustworthy protocols</li>
                </ul>
              </div>
              <div className="es101-compare-card">
                <h4>{"\u2717"} Unverified Contract</h4>
                <ul>
                  <li>Only raw bytecode is visible</li>
                  <li>No source code to read or audit</li>
                  <li>Function calls show as raw hex data</li>
                  <li>Cannot confirm what the code actually does</li>
                  <li>Higher risk — could contain hidden logic</li>
                  <li>Major red flag for any DeFi protocol</li>
                </ul>
              </div>
            </div>

            <div className="es101-info-box orange">
              <div className="es101-info-box-label">Red Flag: Unverified Contracts</div>
              <p>
                If a DeFi protocol asks you to approve tokens to an <strong>unverified contract</strong>, treat it as a major red flag. Legitimate protocols verify their contracts because they have nothing to hide. Unverified contracts are commonly used in scams — the code might contain a function that drains all approved tokens. Always check verification status before interacting with any contract, especially before granting token approvals.
              </p>
            </div>

            <h3>How to Check Verification</h3>
            <p>
              Navigate to the contract address on Etherscan and click the <strong>"Contract"</strong> tab. If verified, you'll see a green checkmark next to "Contract Source Code Verified" and the full Solidity source code below. If unverified, you'll only see the raw bytecode in hex. Some contracts also display a "Similar Match" badge — meaning the bytecode matches a known verified contract template (like OpenZeppelin's ERC-20).
            </p>

            <div className="es101-info-box green">
              <div className="es101-info-box-label">How to Verify Your Own Contract</div>
              <p>
                Developers can verify contracts through Etherscan's web interface (paste source code), through the API, or through build tools like Hardhat and Foundry which have built-in Etherscan verification plugins. The key requirement is that you compile with the <strong>exact same settings</strong> (compiler version, optimization runs, EVM version) used in the original deployment. Even a single setting difference will produce different bytecode.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`es101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Reading Token Transfers and Internal Transactions
          ============================================================ */}
      <div className={`es101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="es101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="es101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="es101-lesson-header-text">
            <div className="es101-lesson-title">Reading Token Transfers and Internal Transactions</div>
            <div className="es101-lesson-meta"><span>10 min read</span><span>Analysis</span></div>
          </div>
          <div className="es101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="es101-lesson-content">
          <div className="es101-lesson-body">
            <h3>The ERC-20 Transfers Tab</h3>
            <p>
              When you view a transaction on Etherscan, the <strong>"ERC-20 Tokens Transferred"</strong> section shows every token movement that occurred during execution. This is derived from the <code>Transfer</code> events emitted by each token contract. A simple token send shows one transfer. A DEX swap typically shows 2-4 transfers. A complex DeFi transaction might show a dozen or more.
            </p>
            <p>
              Each transfer line shows: the <strong>token name and symbol</strong>, the <strong>from</strong> address, the <strong>to</strong> address, and the <strong>amount</strong> (formatted using the token's decimals). Etherscan also shows the token's logo if available and links to the token contract page. This is the fastest way to understand what a transaction actually did.
            </p>
            <p>
              For address pages, the <strong>"Token Transfers"</strong> tab shows all ERC-20 transfers involving that address. You can filter by token type, and sort by time. This is how portfolio trackers build your transaction history — by scanning all Transfer events where your address appears as the sender or receiver.
            </p>

            <h3>Internal Transactions</h3>
            <p>
              A regular transaction is initiated by a user (an Externally Owned Account, or EOA). But during execution, a smart contract can call other smart contracts — these are <strong>internal transactions</strong> (also called "message calls" or "traces"). They don't appear on the blockchain as separate transactions; they're nested inside the parent transaction's execution trace.
            </p>
            <p>
              The <strong>"Internal Transactions"</strong> tab on Etherscan shows these contract-to-contract calls. This is crucial for understanding complex DeFi operations. For example, when you swap on Uniswap, the router contract calls the pool contract, which calls both token contracts. Without the internal transactions view, you'd only see "you sent a transaction to the router" — not the full chain of actions.
            </p>

            <div className="es101-data-block">
              <div className="es101-data-section-label">Anatomy of a DEX Swap (Internal Transactions)</div>
              <div className="es101-data-row"><span className="es101-data-label">1. User {"\u2192"} Router</span><span className="es101-data-value">User calls swapExactTokensForTokens()</span></div>
              <div className="es101-data-row"><span className="es101-data-label">2. Router {"\u2192"} Token A</span><span className="es101-data-value cyan">transferFrom(user, pool, amountIn)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">3. Router {"\u2192"} Pool</span><span className="es101-data-value purple">swap(amount0Out, amount1Out, to)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">4. Pool {"\u2192"} Token B</span><span className="es101-data-value green">transfer(user, amountOut)</span></div>
            </div>

            <div className="es101-info-box cyan">
              <div className="es101-info-box-label">Oeconomia Connection</div>
              <p>
                You can view OEC token transfers on <strong>Sepolia Etherscan</strong> right now. Navigate to the OEC contract address (<code>0x2b2f...aba</code>), click the "Events" tab, and you'll see every Transfer event ever emitted — showing every time OEC tokens changed hands. The Oeconomia Explorer itself indexes these same events to build its transaction history and protocol analytics dashboards.
              </p>
            </div>

            <div className="es101-info-box amber">
              <div className="es101-info-box-label">Tracing Execution</div>
              <p>
                For advanced debugging, Etherscan provides a <strong>"State Changes"</strong> tab showing exactly which storage slots were modified and a <strong>"Trace"</strong> view showing the complete call tree. Tools like Tenderly and Blocknative provide even more detailed trace visualizations. These are invaluable when debugging why a transaction reverted or understanding exactly how a complex DeFi operation works.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`es101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Using Etherscan's Read/Write Contract Interface
          ============================================================ */}
      <div className={`es101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="es101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="es101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="es101-lesson-header-text">
            <div className="es101-lesson-title">Using Etherscan's Read/Write Contract Interface</div>
            <div className="es101-lesson-meta"><span>10 min read</span><span>Practical</span></div>
          </div>
          <div className="es101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="es101-lesson-content">
          <div className="es101-lesson-body">
            <h3>Interacting Without a Frontend</h3>
            <p>
              One of Etherscan's most powerful features is the ability to interact with any verified contract directly — no custom frontend needed. The <strong>"Read Contract"</strong> and <strong>"Write Contract"</strong> tabs (found under the Contract tab) expose every public function of the contract as a form you can fill in and execute. This is your direct connection to the blockchain.
            </p>
            <p>
              This is incredibly useful in several scenarios: checking your token balance, verifying contract state, testing a function before building it into your dApp, interacting with a protocol that has no official frontend, or accessing emergency functions (like withdrawing from a contract whose website is down). The contract on the blockchain is always available, even if every frontend disappears.
            </p>

            <h3>Read vs. Write</h3>
            <div className="es101-three-col">
              <div className="es101-col-card">
                <h4>Read Contract (Free)</h4>
                <p>Calls view/pure functions. No gas cost, no wallet needed. Returns current state: balances, allowances, total supply, pool reserves, config values. Results appear instantly.</p>
              </div>
              <div className="es101-col-card">
                <h4>Write Contract (Gas)</h4>
                <p>Sends state-changing transactions. Requires connecting a wallet (MetaMask) and paying gas. Used for transfers, approvals, staking, swapping, governance votes, and admin functions.</p>
              </div>
              <div className="es101-col-card">
                <h4>Events (Historical)</h4>
                <p>The Events tab shows all emitted logs. Filter by event type to track transfers, swaps, approvals, and other actions. Useful for building transaction history and debugging.</p>
              </div>
            </div>

            <h3>Practical Examples</h3>
            <p>
              Here are common operations you can do directly through Etherscan's interface:
            </p>
            <div className="es101-data-block">
              <div className="es101-data-section-label">Common Read/Write Operations</div>
              <div className="es101-data-row"><span className="es101-data-label">Check your balance</span><span className="es101-data-value green">Read: balanceOf(your_address)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Check token allowance</span><span className="es101-data-value green">Read: allowance(your_address, spender)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">View pool reserves</span><span className="es101-data-value green">Read: getReserves() on pool contract</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Approve a token</span><span className="es101-data-value amber">Write: approve(spender, amount)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Transfer tokens</span><span className="es101-data-value amber">Write: transfer(to, amount)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Revoke an approval</span><span className="es101-data-value amber">Write: approve(spender, 0)</span></div>
              <div className="es101-data-row"><span className="es101-data-label">Emergency withdrawal</span><span className="es101-data-value orange">Write: withdraw() or emergencyWithdraw()</span></div>
            </div>

            <div className="es101-info-box blue">
              <div className="es101-info-box-label">Proxy Contracts: Read/Write as Proxy</div>
              <p>
                For upgradeable (proxy) contracts, Etherscan shows a special <strong>"Read as Proxy"</strong> and <strong>"Write as Proxy"</strong> tab. This is important because the proxy contract's own functions are just the upgrade mechanisms — the actual protocol functions are on the implementation contract. The "as Proxy" tabs combine the proxy's address with the implementation's ABI, showing you the functions you actually want to use.
              </p>
            </div>

            <div className="es101-info-box green">
              <div className="es101-info-box-label">Your Safety Net</div>
              <p>
                <strong>If a dApp's frontend goes down, your funds are still accessible.</strong> This is a fundamental advantage of decentralized protocols. The smart contract lives on the blockchain independently of any website. By using Etherscan's Write tab, you can withdraw funds, unstake tokens, or close positions even if the protocol's website never comes back. This is why learning to use Etherscan directly is not just educational — it's a critical safety skill for any DeFi user.
              </p>
            </div>

            <div className="es101-info-box purple">
              <div className="es101-info-box-label">Beyond Etherscan</div>
              <p>
                Etherscan is the most popular block explorer, but alternatives exist: <strong>Blockscout</strong> (open-source, used by many L2s), <strong>Tenderly</strong> (advanced debugging and simulation), <strong>Dethcode</strong> (VS Code-style contract browsing), and <strong>Sourcify</strong> (decentralized verification). The Oeconomia Explorer itself is a custom block explorer focused on the Oeconomia protocols, providing protocol-aware transaction decoding and analytics.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`es101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
