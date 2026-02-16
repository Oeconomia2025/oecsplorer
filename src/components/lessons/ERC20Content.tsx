// ============================================================
// ERC-20 Tokens: The Standard — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./erc20.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "The ERC-20 Interface: balanceOf, transfer, approve", meta: "8 min read \u00b7 Foundations" },
  { num: 2, title: "How Token Transfers Work Under the Hood", meta: "10 min read \u00b7 Technical" },
  { num: 3, title: "Allowances and the Approve/TransferFrom Pattern", meta: "10 min read \u00b7 Technical" },
  { num: 4, title: "Token Metadata: Name, Symbol, Decimals", meta: "8 min read \u00b7 Standards" },
  { num: 5, title: "How OEC and ELOQ Implement ERC-20", meta: "10 min read \u00b7 Oeconomia" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "Why was the ERC-20 standard created?",
    options: [
      { letter: "A", text: "To make tokens more expensive to create", correct: false },
      { letter: "B", text: "To ensure all tokens work the same way, enabling wallets, DEXs, and dApps to support any token automatically", correct: true },
      { letter: "C", text: "To give the Ethereum Foundation control over all tokens", correct: false },
      { letter: "D", text: "To prevent anyone from creating new cryptocurrencies", correct: false },
    ],
    correctMsg: "Correct! ERC-20 standardization means any wallet or exchange can automatically support a new token without custom integration.",
    wrongMsg: "Not quite \u2014 ERC-20 was created so all tokens follow the same interface, letting wallets, DEXs, and dApps support any token automatically.",
  },
  2: {
    question: "What does the `transfer` function do?",
    options: [
      { letter: "A", text: "Creates new tokens out of thin air", correct: false },
      { letter: "B", text: "Moves tokens from the caller's address to a specified recipient", correct: true },
      { letter: "C", text: "Burns tokens permanently", correct: false },
      { letter: "D", text: "Gives another address permission to spend your tokens", correct: false },
    ],
    correctMsg: "Correct! transfer() moves tokens from msg.sender to the specified recipient address.",
    wrongMsg: "Not quite \u2014 the transfer function moves tokens from the caller's address to a specified recipient.",
  },
  3: {
    question: "Why does a DEX need you to `approve` tokens before swapping?",
    options: [
      { letter: "A", text: "It's a security check required by the Ethereum Foundation", correct: false },
      { letter: "B", text: "The DEX contract needs permission to move tokens from your wallet on your behalf", correct: true },
      { letter: "C", text: "Approval makes the tokens more valuable", correct: false },
      { letter: "D", text: "It's an optional step that most users skip", correct: false },
    ],
    correctMsg: "Correct! Smart contracts can't access your tokens without explicit permission. approve() grants that permission for a specific amount.",
    wrongMsg: "Not quite \u2014 the DEX contract needs permission (via approve) to move tokens from your wallet on your behalf.",
  },
  4: {
    question: "If a token has 18 decimals, how is 1.5 tokens represented internally?",
    options: [
      { letter: "A", text: "As the number 1.5", correct: false },
      { letter: "B", text: "As 150", correct: false },
      { letter: "C", text: "As 1,500,000,000,000,000,000 (1.5 \u00d7 10\u00b9\u2078)", correct: true },
      { letter: "D", text: "As 15,000", correct: false },
    ],
    correctMsg: "Correct! With 18 decimals, 1.5 tokens = 1.5 \u00d7 10\u00b9\u2078 = 1,500,000,000,000,000,000 in raw units.",
    wrongMsg: "Not quite \u2014 with 18 decimals, 1.5 tokens is stored as 1,500,000,000,000,000,000 (1.5 \u00d7 10\u00b9\u2078).",
  },
  5: {
    question: "What event is emitted when tokens are transferred?",
    options: [
      { letter: "A", text: "The Send event", correct: false },
      { letter: "B", text: "The Move event", correct: false },
      { letter: "C", text: "The Transfer event, containing from address, to address, and amount", correct: true },
      { letter: "D", text: "No event is emitted", correct: false },
    ],
    correctMsg: "Correct! The Transfer event logs every token movement with from, to, and amount \u2014 this is how block explorers track token transfers.",
    wrongMsg: "Not quite \u2014 the Transfer event is emitted, containing the from address, to address, and amount.",
  },
};

export default function ERC20Content() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Token transfer visualizer state
  const [transferMode, setTransferMode] = useState<"direct" | "approve">("direct");
  const [transferAmount, setTransferAmount] = useState(100);
  const [senderBalance, setSenderBalance] = useState(1000);
  const [receiverBalance, setReceiverBalance] = useState(250);
  const [dexAllowance, setDexAllowance] = useState(0);
  const [transferLog, setTransferLog] = useState<string[]>([]);
  const [hasApproved, setHasApproved] = useState(false);

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

  // Transfer visualizer handlers
  const handleDirectTransfer = () => {
    if (transferAmount <= 0 || transferAmount > senderBalance) {
      setTransferLog((prev) => [...prev, `[REVERT] Insufficient balance. Sender has ${senderBalance} tokens.`]);
      return;
    }
    setSenderBalance((prev) => prev - transferAmount);
    setReceiverBalance((prev) => prev + transferAmount);
    setTransferLog((prev) => [
      ...prev,
      `[CALL] transfer(0xBob...f2, ${transferAmount})`,
      `  balances[0xAlice...a1] -= ${transferAmount}  (${senderBalance} \u2192 ${senderBalance - transferAmount})`,
      `  balances[0xBob...f2] += ${transferAmount}  (${receiverBalance} \u2192 ${receiverBalance + transferAmount})`,
      `[EVENT] Transfer(0xAlice...a1, 0xBob...f2, ${transferAmount})`,
      `[SUCCESS] Transfer complete.`,
    ]);
  };

  const handleApprove = () => {
    setDexAllowance(transferAmount);
    setHasApproved(true);
    setTransferLog((prev) => [
      ...prev,
      `[CALL] approve(0xDEX...c3, ${transferAmount})`,
      `  allowance[0xAlice...a1][0xDEX...c3] = ${transferAmount}`,
      `[EVENT] Approval(0xAlice...a1, 0xDEX...c3, ${transferAmount})`,
      `[SUCCESS] Allowance set. DEX can now spend ${transferAmount} tokens.`,
    ]);
  };

  const handleTransferFrom = () => {
    if (!hasApproved || dexAllowance < transferAmount) {
      setTransferLog((prev) => [...prev, `[REVERT] Insufficient allowance. DEX allowed: ${dexAllowance}`]);
      return;
    }
    if (transferAmount > senderBalance) {
      setTransferLog((prev) => [...prev, `[REVERT] Insufficient balance. Sender has ${senderBalance} tokens.`]);
      return;
    }
    setSenderBalance((prev) => prev - transferAmount);
    setReceiverBalance((prev) => prev + transferAmount);
    setDexAllowance(0);
    setHasApproved(false);
    setTransferLog((prev) => [
      ...prev,
      `[CALL] transferFrom(0xAlice...a1, 0xBob...f2, ${transferAmount})`,
      `  Checking allowance: ${dexAllowance} >= ${transferAmount} \u2713`,
      `  balances[0xAlice...a1] -= ${transferAmount}  (${senderBalance} \u2192 ${senderBalance - transferAmount})`,
      `  balances[0xBob...f2] += ${transferAmount}  (${receiverBalance} \u2192 ${receiverBalance + transferAmount})`,
      `  allowance[0xAlice...a1][0xDEX...c3] -= ${transferAmount}  (${dexAllowance} \u2192 0)`,
      `[EVENT] Transfer(0xAlice...a1, 0xBob...f2, ${transferAmount})`,
      `[SUCCESS] TransferFrom complete.`,
    ]);
  };

  const resetVisualizer = () => {
    setSenderBalance(1000);
    setReceiverBalance(250);
    setDexAllowance(0);
    setHasApproved(false);
    setTransferLog([]);
    setTransferAmount(100);
  };

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="tk101-quiz-section">
        <div className="tk101-quiz-title">Check Your Understanding</div>
        <div className="tk101-quiz-question">{q.question}</div>
        <div className="tk101-quiz-options">
          {q.options.map((opt) => {
            let cls = "tk101-quiz-option";
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
          <div className={`tk101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  /* ---- Transfer visualizer renderer ---- */
  const renderTransferVisualizer = () => (
    <div className="tk101-transfer-viz">
      <div className="tk101-transfer-mode-tabs">
        <div
          className={`tk101-transfer-mode-tab${transferMode === "direct" ? " active" : ""}`}
          onClick={() => { setTransferMode("direct"); resetVisualizer(); }}
        >
          Direct Transfer
        </div>
        <div
          className={`tk101-transfer-mode-tab${transferMode === "approve" ? " active" : ""}`}
          onClick={() => { setTransferMode("approve"); resetVisualizer(); }}
        >
          Approve + TransferFrom
        </div>
      </div>

      <div className="tk101-transfer-wallets">
        <div className="tk101-wallet-box sender">
          <div className="tk101-wallet-label">Sender (Alice)</div>
          <div className="tk101-wallet-addr">0xAlice...a1</div>
          <div className={`tk101-wallet-balance${senderBalance < 1000 ? " decreased" : ""}`}>
            {senderBalance.toLocaleString()} TKN
          </div>
        </div>
        <div className="tk101-transfer-arrow">{"\u2192"}</div>
        {transferMode === "approve" && (
          <>
            <div className="tk101-wallet-box dex">
              <div className="tk101-wallet-label">DEX Contract</div>
              <div className="tk101-wallet-addr">0xDEX...c3</div>
              <div className="tk101-wallet-balance">
                Allowance: {dexAllowance}
              </div>
            </div>
            <div className="tk101-transfer-arrow">{"\u2192"}</div>
          </>
        )}
        <div className="tk101-wallet-box receiver">
          <div className="tk101-wallet-label">Receiver (Bob)</div>
          <div className="tk101-wallet-addr">0xBob...f2</div>
          <div className={`tk101-wallet-balance${receiverBalance > 250 ? " increased" : ""}`}>
            {receiverBalance.toLocaleString()} TKN
          </div>
        </div>
      </div>

      <div className="tk101-transfer-controls">
        <div className="tk101-transfer-input-group">
          <div className="tk101-transfer-input-label">Amount</div>
          <input
            type="number"
            className="tk101-transfer-input"
            value={transferAmount}
            onChange={(e) => setTransferAmount(Number(e.target.value) || 0)}
          />
        </div>
        {transferMode === "direct" ? (
          <div className="tk101-transfer-btn" onClick={handleDirectTransfer}>
            Transfer {"\u2192"}
          </div>
        ) : (
          <>
            <div className={`tk101-transfer-btn approve`} onClick={handleApprove}>
              1. Approve
            </div>
            <div className="tk101-transfer-btn" onClick={handleTransferFrom}>
              2. TransferFrom
            </div>
          </>
        )}
        <div className="tk101-transfer-btn" onClick={resetVisualizer} style={{ opacity: 0.6 }}>
          Reset
        </div>
      </div>

      {transferLog.length > 0 && (
        <div className="tk101-transfer-log">
          {transferLog.map((line, i) => {
            let cls = "";
            if (line.startsWith("[EVENT]")) cls = "event";
            else if (line.startsWith("[SUCCESS]")) cls = "success";
            else if (line.startsWith("[CALL]") || line.startsWith("[REVERT]")) cls = "info";
            return <div key={i} className={cls}>{line}</div>;
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="tk101">
      {/* Progress bar */}
      <div className="tk101-progress">
        <div className="tk101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`tk101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="tk101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — The ERC-20 Interface
          ============================================================ */}
      <div className={`tk101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="tk101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="tk101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="tk101-lesson-header-text">
            <div className="tk101-lesson-title">The ERC-20 Interface: balanceOf, transfer, approve</div>
            <div className="tk101-lesson-meta"><span>8 min read</span><span>Foundations</span></div>
          </div>
          <div className="tk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="tk101-lesson-content">
          <div className="tk101-lesson-body">
            <h3>What Is a Token Standard?</h3>
            <p>
              Imagine if every phone manufacturer used a different charging port, different cable, different voltage. You'd need a unique charger for every device. That's what Ethereum tokens were like before standards: each token contract had its own functions, its own naming conventions, its own way of handling transfers. Wallets and exchanges needed custom code for every single token.
            </p>
            <p>
              <strong>ERC-20</strong> (Ethereum Request for Comment #20) solved this by defining a <strong>standard interface</strong> — a set of functions and events that every token must implement. If a token follows ERC-20, any wallet, DEX, portfolio tracker, or dApp can automatically support it without any custom integration. One standard to rule them all.
            </p>

            <h3>The Six Required Functions</h3>
            <div className="tk101-data-block">
              <div className="tk101-data-section-label">ERC-20 Required Functions</div>
              <div className="tk101-data-row"><span className="tk101-data-label">totalSupply()</span><span className="tk101-data-value cyan">Returns the total number of tokens in existence</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">balanceOf(address)</span><span className="tk101-data-value cyan">Returns how many tokens a specific address holds</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">transfer(to, amount)</span><span className="tk101-data-value green">Sends tokens from caller to the specified address</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">approve(spender, amount)</span><span className="tk101-data-value amber">Grants permission for another address to spend your tokens</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">allowance(owner, spender)</span><span className="tk101-data-value purple">Returns how many tokens spender can still spend from owner</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">transferFrom(from, to, amount)</span><span className="tk101-data-value orange">Moves tokens from one address to another using an allowance</span></div>
            </div>

            <p>
              The standard also requires two events: <code>Transfer(from, to, amount)</code> emitted on every token movement, and <code>Approval(owner, spender, amount)</code> emitted when permissions are granted. These events are critical — they're how block explorers, wallets, and analytics tools track all token activity.
            </p>

            <div className="tk101-info-box blue">
              <div className="tk101-info-box-label">Why ERC-20 Enabled DeFi</div>
              <p>
                Before ERC-20 was finalized in 2017, building a DEX required custom adapters for each token. After standardization, a single swap function works with <strong>any</strong> ERC-20 token. Uniswap doesn't need to know anything about OEC, ELOQ, USDC, or any specific token — it just calls the standard functions. This interoperability is what made DeFi's explosive growth possible. Today, over <strong>500,000 ERC-20 tokens</strong> exist on Ethereum.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`tk101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — How Token Transfers Work Under the Hood
          ============================================================ */}
      <div className={`tk101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="tk101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="tk101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="tk101-lesson-header-text">
            <div className="tk101-lesson-title">How Token Transfers Work Under the Hood</div>
            <div className="tk101-lesson-meta"><span>10 min read</span><span>Technical</span></div>
          </div>
          <div className="tk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="tk101-lesson-content">
          <div className="tk101-lesson-body">
            <h3>It's All a Mapping</h3>
            <p>
              At its core, an ERC-20 token is surprisingly simple. The contract maintains a <strong>mapping</strong> (a key-value store) from addresses to balances: <code>mapping(address =&gt; uint256) balanceOf</code>. That's it. The "tokens" don't actually exist as separate objects floating around the blockchain. They're just numbers in a table.
            </p>
            <p>
              When you "have" 500 OEC tokens, what that really means is that the OEC contract's internal mapping has your address associated with the number 500 (adjusted for decimals). Transferring tokens simply means <strong>updating two numbers in that mapping</strong>: decrease the sender's balance, increase the receiver's balance. There's no actual "movement" — just arithmetic.
            </p>

            <h3>Step-by-Step Transfer</h3>
            <div className="tk101-data-block">
              <div className="tk101-data-section-label">What Happens When You Call transfer()</div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 1</span><span className="tk101-data-value">Contract identifies caller via msg.sender</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 2</span><span className="tk101-data-value amber">require(balanceOf[sender] &gt;= amount) — check funds</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 3</span><span className="tk101-data-value red">balanceOf[sender] -= amount (decrease sender)</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 4</span><span className="tk101-data-value green">balanceOf[receiver] += amount (increase receiver)</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 5</span><span className="tk101-data-value cyan">emit Transfer(sender, receiver, amount) — log event</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 6</span><span className="tk101-data-value">return true (ERC-20 spec requires a boolean return)</span></div>
            </div>

            <p>
              This entire operation is <strong>atomic</strong>. If any step fails (insufficient balance, out of gas, etc.), the entire transaction reverts — all state changes are rolled back as if nothing happened. No partial transfers, no lost tokens. This atomicity guarantee is fundamental to why DeFi can build complex operations on top of simple token transfers.
            </p>

            <div className="tk101-info-box green">
              <div className="tk101-info-box-label">Gas Cost of a Transfer</div>
              <p>
                A standard ERC-20 transfer costs approximately <strong>65,000 gas</strong> — about 3x more than a simple ETH transfer (21,000 gas). This is because the contract must read and write storage slots (updating balances) and emit an event. Storage operations are the most expensive EVM operations, costing 5,000-20,000 gas each depending on whether the slot is empty or already used.
              </p>
            </div>

            <h3>Try It: Token Transfer Visualizer</h3>
            {renderTransferVisualizer()}

            {renderQuizWithSelection(2)}
            <button className={`tk101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Allowances and the Approve/TransferFrom Pattern
          ============================================================ */}
      <div className={`tk101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="tk101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="tk101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="tk101-lesson-header-text">
            <div className="tk101-lesson-title">Allowances and the Approve/TransferFrom Pattern</div>
            <div className="tk101-lesson-meta"><span>10 min read</span><span>Technical</span></div>
          </div>
          <div className="tk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="tk101-lesson-content">
          <div className="tk101-lesson-body">
            <h3>Why Approve Exists</h3>
            <p>
              The <code>transfer</code> function works great when you're sending tokens yourself. But what about when a <strong>smart contract</strong> needs to move your tokens? For example, when you swap on a DEX, the DEX contract needs to take your input tokens and give you output tokens. The contract can't call <code>transfer</code> as you — it's a different address with its own identity.
            </p>
            <p>
              This is where the <strong>approve/transferFrom</strong> pattern comes in. It's a two-step process: first, you <code>approve</code> the DEX to spend up to a certain amount of your tokens. Then, the DEX calls <code>transferFrom</code> to move tokens from your address to wherever they need to go. It's like giving someone a limited power of attorney over a specific amount of your tokens.
            </p>

            <h3>The Two-Step Flow</h3>
            <div className="tk101-data-block">
              <div className="tk101-data-section-label">Approve + TransferFrom Flow</div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 1: User calls approve()</span><span className="tk101-data-value amber">approve(DEX_address, 500)</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">{"\u2192"} Sets allowance</span><span className="tk101-data-value">allowance[user][DEX] = 500</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">{"\u2192"} Emits event</span><span className="tk101-data-value cyan">Approval(user, DEX, 500)</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">Step 2: DEX calls transferFrom()</span><span className="tk101-data-value green">transferFrom(user, pool, 500)</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">{"\u2192"} Checks allowance</span><span className="tk101-data-value">allowance[user][DEX] &gt;= 500? Yes</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">{"\u2192"} Moves tokens</span><span className="tk101-data-value">balanceOf[user] -= 500, balanceOf[pool] += 500</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">{"\u2192"} Decreases allowance</span><span className="tk101-data-value">allowance[user][DEX] -= 500 (now 0)</span></div>
            </div>

            <p>
              This pattern is used <strong>everywhere</strong> in DeFi. Every time you see a "approve" or "enable" button before a swap, deposit, or stake — that's the approve step. The actual operation happens in a second transaction using transferFrom.
            </p>

            <div className="tk101-info-box orange">
              <div className="tk101-info-box-label">Unlimited Approvals Warning</div>
              <p>
                Many dApps request <strong>unlimited approval</strong> (setting the allowance to the maximum uint256 value: 2\u00b2\u2075\u2076 - 1). This is convenient — you only approve once and never need to approve again. But it means that contract can spend <strong>all</strong> your tokens of that type, forever, unless you revoke the approval. If the contract has a vulnerability or is malicious, your entire token balance is at risk. Consider using exact approvals (only the amount you need) for contracts you don't fully trust. Tools like revoke.cash let you review and revoke outstanding approvals.
              </p>
            </div>

            <div className="tk101-info-box cyan">
              <div className="tk101-info-box-label">EIP-2612: Permit (Gasless Approvals)</div>
              <p>
                The traditional approve pattern requires two transactions (and two gas fees). <strong>EIP-2612</strong> introduced the <code>permit</code> function, which lets users sign an off-chain message granting approval. The signature is submitted alongside the actual transaction, combining approve and transferFrom into a single on-chain transaction. This saves gas and improves UX. Many modern tokens (including USDC) support permit.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`tk101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Token Metadata: Name, Symbol, Decimals
          ============================================================ */}
      <div className={`tk101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="tk101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="tk101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="tk101-lesson-header-text">
            <div className="tk101-lesson-title">Token Metadata: Name, Symbol, Decimals</div>
            <div className="tk101-lesson-meta"><span>8 min read</span><span>Standards</span></div>
          </div>
          <div className="tk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="tk101-lesson-content">
          <div className="tk101-lesson-body">
            <h3>The Decimals Problem</h3>
            <p>
              The EVM doesn't support decimal numbers. There are no floats, no fractions — only whole integers (uint256). So how do you represent 1.5 tokens? Through a convention called <strong>decimals</strong>. A token with 18 decimals means that the smallest unit is 10<sup>-18</sup> of one token. The raw integer stored on-chain is the amount in the smallest units, and user interfaces divide by 10<sup>decimals</sup> to show the human-readable value.
            </p>
            <p>
              Think of it like cents and dollars. USD has 2 "decimals" — $1.50 is stored as 150 cents. ETH and most tokens use 18 decimals, so 1.5 tokens = 1,500,000,000,000,000,000 in raw units (1.5 x 10<sup>18</sup>). This allows for incredibly precise fractional amounts while using only integer math.
            </p>

            <h3>Comparing Token Metadata</h3>
            <div className="tk101-data-block">
              <div className="tk101-data-section-label">Token Metadata Examples</div>
              <div className="tk101-data-row"><span className="tk101-data-label">OEC</span><span className="tk101-data-value">name: "Oeconomia" | symbol: OEC | decimals: <span style={{ color: "var(--tk-amber)" }}>18</span></span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">ELOQ</span><span className="tk101-data-value">name: "Eloqura" | symbol: ELOQ | decimals: <span style={{ color: "var(--tk-amber)" }}>18</span></span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">USDC</span><span className="tk101-data-value">name: "USD Coin" | symbol: USDC | decimals: <span style={{ color: "var(--tk-orange)" }}>6</span></span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">WBTC</span><span className="tk101-data-value">name: "Wrapped Bitcoin" | symbol: WBTC | decimals: <span style={{ color: "var(--tk-orange)" }}>8</span></span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">USDT</span><span className="tk101-data-value">name: "Tether USD" | symbol: USDT | decimals: <span style={{ color: "var(--tk-orange)" }}>6</span></span></div>
            </div>

            <p>
              <strong>This matters enormously for developers.</strong> If you're building a swap interface and one token has 18 decimals while another has 6, you must convert between them carefully. Sending 1,000,000 raw units of USDC is $1.00 (10<sup>6</sup>), but sending 1,000,000 raw units of OEC is 0.000000000001 OEC (10<sup>-12</sup>). Getting decimals wrong is one of the most common sources of bugs in DeFi.
            </p>

            <div className="tk101-info-box purple">
              <div className="tk101-info-box-label">The parseUnits / formatUnits Pattern</div>
              <p>
                Libraries like ethers.js provide <code>parseUnits("1.5", 18)</code> to convert human-readable amounts to raw values, and <code>formatUnits(rawValue, 18)</code> to convert back. Always use these helpers instead of manual math. A common bug is JavaScript's floating-point producing strings like "1.500000000000000001" which causes overflow errors. Always use <code>.toFixed(decimals)</code> before <code>parseUnits()</code>.
              </p>
            </div>

            <div className="tk101-info-box amber">
              <div className="tk101-info-box-label">Optional But Universal</div>
              <p>
                Technically, <code>name()</code>, <code>symbol()</code>, and <code>decimals()</code> are <strong>optional</strong> in the ERC-20 specification — they're in the "optional" section. In practice, virtually every token implements them because wallets and UIs need this information to display tokens correctly. A token without metadata would show as "Unknown Token" with no symbol, making it unusable in most interfaces.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`tk101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — How OEC and ELOQ Implement ERC-20
          ============================================================ */}
      <div className={`tk101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="tk101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="tk101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="tk101-lesson-header-text">
            <div className="tk101-lesson-title">How OEC and ELOQ Implement ERC-20</div>
            <div className="tk101-lesson-meta"><span>10 min read</span><span>Oeconomia</span></div>
          </div>
          <div className="tk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="tk101-lesson-content">
          <div className="tk101-lesson-body">
            <h3>Real Tokens, Real Contracts</h3>
            <p>
              The Oeconomia ecosystem uses ERC-20 tokens as the foundation of everything — governance, trading, staking, and protocol interaction. Let's look at how the two primary tokens, <strong>OEC</strong> and <strong>ELOQ</strong>, implement the standard and what additional features they bring.
            </p>
            <p>
              Both tokens are deployed on the <strong>Sepolia testnet</strong>, the primary testing environment for Ethereum development. You can view, verify, and interact with their contracts directly on Sepolia Etherscan. This transparency is core to Oeconomia's philosophy — every line of code is public.
            </p>

            <div className="tk101-data-block">
              <div className="tk101-data-section-label">Oeconomia Token Contracts (Sepolia)</div>
              <div className="tk101-data-row"><span className="tk101-data-label">OEC Token</span><span className="tk101-data-value cyan">0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">OEC Decimals</span><span className="tk101-data-value">18</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">OEC Role</span><span className="tk101-data-value purple">Governance + Staking + Utility</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">ELOQ Token</span><span className="tk101-data-value cyan">Eloqura protocol token</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">ELOQ Decimals</span><span className="tk101-data-value">18</span></div>
              <div className="tk101-data-row"><span className="tk101-data-label">ELOQ Role</span><span className="tk101-data-value green">DEX liquidity incentives + Fee sharing</span></div>
            </div>

            <h3>Beyond Basic ERC-20</h3>
            <p>
              While OEC and ELOQ implement the full ERC-20 interface (they must, for compatibility), they add additional functionality that standard tokens don't have:
            </p>

            <div className="tk101-three-col">
              <div className="tk101-col-card">
                <h4>Governance Hooks</h4>
                <p>OEC includes vote delegation and snapshot mechanisms. When you transfer OEC, your governance power transfers too. This enables Guardian staking to weight votes by token holdings.</p>
              </div>
              <div className="tk101-col-card">
                <h4>Fee Mechanisms</h4>
                <p>Some protocol tokens include transfer fees that fund the treasury or get burned. These are implemented as hooks in the transfer function that take a percentage before crediting the receiver.</p>
              </div>
              <div className="tk101-col-card">
                <h4>Access Control</h4>
                <p>Minting new tokens is restricted to authorized contracts (staking rewards, liquidity mining). This prevents arbitrary inflation while allowing programmatic token distribution.</p>
              </div>
            </div>

            <div className="tk101-info-box green">
              <div className="tk101-info-box-label">Oeconomia Connection</div>
              <p>
                Every Oeconomia protocol interacts through ERC-20 tokens. When you <strong>swap on Eloqura</strong>, the router calls transferFrom on the input token and transfer on the output token. When you <strong>stake OEC</strong>, the staking contract calls transferFrom to lock your tokens. When you <strong>provide liquidity</strong>, the pool contract mints LP tokens (also ERC-20) that represent your share. Understanding ERC-20 is understanding the language that all Oeconomia protocols speak.
              </p>
            </div>

            <div className="tk101-info-box cyan">
              <div className="tk101-info-box-label">Verify It Yourself</div>
              <p>
                Go to Sepolia Etherscan, paste the OEC contract address (<code>0x2b2f...aba</code>), and click the "Read Contract" tab. You can call <code>name()</code>, <code>symbol()</code>, <code>decimals()</code>, and <code>balanceOf()</code> for free — no wallet needed. This is the power of open, on-chain contracts: anyone can verify everything.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`tk101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
