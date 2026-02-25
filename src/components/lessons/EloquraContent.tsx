// ============================================================
// Eloqura: Swaps, Pools & AMM — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./eloqura.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "How the Eloqura AMM Prices Tokens", meta: "10 min read \u00B7 AMM Fundamentals" },
  { num: 2, title: "Providing Liquidity and Earning Fees", meta: "10 min read \u00B7 Liquidity" },
  { num: 3, title: "Swap Routing: Finding the Best Price Across Pools", meta: "8 min read \u00B7 Routing" },
  { num: 4, title: "Uniswap V3 Integration and Concentrated Liquidity", meta: "10 min read \u00B7 Advanced" },
  { num: 5, title: "Limit Orders and Advanced Trading Features", meta: "8 min read \u00B7 Trading" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "In the constant product formula x*y=k, what happens to the price when someone buys a large amount of Token A?",
    options: [
      { letter: "A", text: "Token A becomes cheaper because there's more demand", correct: false },
      { letter: "B", text: "Token A becomes more expensive because its supply in the pool decreases while Token B increases", correct: true },
      { letter: "C", text: "Both tokens stay the same price because k is constant", correct: false },
      { letter: "D", text: "The pool runs out of Token A completely", correct: false },
    ],
    correctMsg: "Correct! As Token A is removed from the pool, its scarcity increases relative to Token B, driving the price up along the constant product curve.",
    wrongMsg: "Not quite \u2014 when Token A is bought (removed from the pool), its supply decreases, making it more expensive relative to Token B.",
  },
  2: {
    question: "How do liquidity providers earn money?",
    options: [
      { letter: "A", text: "They receive new tokens minted by the protocol", correct: false },
      { letter: "B", text: "They receive a share of the trading fees (0.3%) proportional to their pool share", correct: true },
      { letter: "C", text: "They earn interest from the Ethereum network", correct: false },
      { letter: "D", text: "They are paid by traders directly for providing liquidity", correct: false },
    ],
    correctMsg: "Correct! Every trade pays a 0.3% fee, and this fee is distributed proportionally to all liquidity providers in the pool.",
    wrongMsg: "Not quite \u2014 LPs earn a proportional share of the 0.3% trading fee charged on every swap in their pool.",
  },
  3: {
    question: "What is swap routing?",
    options: [
      { letter: "A", text: "A method for creating new liquidity pools", correct: false },
      { letter: "B", text: "Finding the optimal path through multiple pools to get the best exchange rate", correct: true },
      { letter: "C", text: "The process of approving a token for trading", correct: false },
      { letter: "D", text: "Splitting a large trade across multiple wallets", correct: false },
    ],
    correctMsg: "Correct! Swap routing finds the best path \u2014 sometimes through multiple intermediate pools \u2014 to give you the optimal exchange rate.",
    wrongMsg: "Not quite \u2014 swap routing is the process of finding the optimal path through multiple pools for the best price.",
  },
  4: {
    question: "What is concentrated liquidity in Uniswap V3?",
    options: [
      { letter: "A", text: "Locking all liquidity in a single pool forever", correct: false },
      { letter: "B", text: "Providing liquidity within a specific price range instead of across all possible prices", correct: true },
      { letter: "C", text: "Combining multiple tokens into one liquidity position", correct: false },
      { letter: "D", text: "A technique for hiding liquidity from other traders", correct: false },
    ],
    correctMsg: "Correct! Concentrated liquidity lets LPs focus their capital within a chosen price range, dramatically increasing capital efficiency.",
    wrongMsg: "Not quite \u2014 concentrated liquidity means providing liquidity within a specific price range rather than across all prices from 0 to infinity.",
  },
  5: {
    question: "What is slippage in a swap?",
    options: [
      { letter: "A", text: "The fee charged by the protocol for trading", correct: false },
      { letter: "B", text: "The time delay between submitting and confirming a transaction", correct: false },
      { letter: "C", text: "The difference between the expected price and the actual execution price due to price movement", correct: true },
      { letter: "D", text: "A bug in the smart contract that causes incorrect pricing", correct: false },
    ],
    correctMsg: "Correct! Slippage occurs when the price moves between when you submit a trade and when it executes, resulting in a different rate than expected.",
    wrongMsg: "Not quite \u2014 slippage is the difference between what you expect to receive and what you actually receive due to price changes during execution.",
  },
};

export default function EloquraContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // AMM Price Curve state
  const [reserveA, setReserveA] = useState(1000);
  const [reserveB, setReserveB] = useState(1000);
  const [swapAmount, setSwapAmount] = useState(100);
  const [swapResult, setSwapResult] = useState<{ output: number; impact: number } | null>(null);

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

  // AMM calculator
  const k = reserveA * reserveB;
  const priceAinB = reserveB / reserveA;
  const priceBinA = reserveA / reserveB;

  const executeSwap = useCallback(() => {
    const newReserveA = reserveA + swapAmount;
    const newReserveB = k / newReserveA;
    const output = reserveB - newReserveB;
    const expectedOutput = swapAmount * priceAinB;
    const impact = ((expectedOutput - output) / expectedOutput) * 100;
    setSwapResult({ output, impact });
  }, [reserveA, reserveB, k, swapAmount, priceAinB]);

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="el101-quiz-section">
        <div className="el101-quiz-title">Check Your Understanding</div>
        <div className="el101-quiz-question">{q.question}</div>
        <div className="el101-quiz-options">
          {q.options.map((opt) => {
            let cls = "el101-quiz-option";
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
          <div className={`el101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="el101">
      {/* Progress bar */}
      <div className="el101-progress">
        <div className="el101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`el101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="el101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — How the Eloqura AMM Prices Tokens
          ============================================================ */}
      <div className={`el101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="el101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="el101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="el101-lesson-header-text">
            <div className="el101-lesson-title">How the Eloqura AMM Prices Tokens</div>
            <div className="el101-lesson-meta"><span>10 min read</span><span>AMM Fundamentals</span></div>
          </div>
          <div className="el101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="el101-lesson-content">
          <div className="el101-lesson-body">
            <h3>The Constant Product Formula</h3>
            <p>
              At the heart of every Eloqura pool lies a deceptively simple equation: <strong>x * y = k</strong>. Here, <code>x</code> represents the reserve of Token A, <code>y</code> represents the reserve of Token B, and <code>k</code> is a constant that never changes during a swap. This is the <strong>constant product formula</strong>, and it's the mathematical engine that powers all automated market makers (AMMs).
            </p>
            <p>
              Unlike a traditional exchange where buyers and sellers set prices through order books, an AMM determines prices <strong>algorithmically</strong> based on the ratio of tokens in the pool. There's no need for a counterparty to match your trade — the smart contract itself is your trading partner, and the math guarantees there's always a price available.
            </p>
            <p>
              The price of Token A in terms of Token B is simply the ratio <strong>y / x</strong> (reserve of B divided by reserve of A). If a pool has 1,000 Token A and 2,000 Token B, then 1 Token A is worth 2 Token B. This ratio shifts with every trade, creating a dynamic pricing mechanism that responds to supply and demand in real time.
            </p>

            <h3>What Happens During a Swap</h3>
            <p>
              When you swap Token A for Token B, you're <strong>adding Token A to the pool</strong> and <strong>removing Token B</strong>. The constant product <code>k</code> must remain the same, so as Token A's reserve increases, Token B's reserve must decrease. The amount of Token B you receive is determined by solving for the new equilibrium: if k = 1,000,000 and you add 100 Token A to a pool of 1,000, the new reserve of A is 1,100, so the new reserve of B must be k / 1,100 = 909.09. You receive 1,000 - 909.09 = <strong>90.91 Token B</strong>.
            </p>

            <div className="el101-data-block">
              <div className="el101-data-section-label">Example: Swapping 100 Token A for Token B</div>
              <div className="el101-data-row"><span className="el101-data-label">Initial Reserve A</span><span className="el101-data-value">1,000 tokens</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Initial Reserve B</span><span className="el101-data-value">1,000 tokens</span></div>
              <div className="el101-data-row"><span className="el101-data-label">k (constant product)</span><span className="el101-data-value purple">1,000,000</span></div>
              <div className="el101-data-row"><span className="el101-data-label">You send</span><span className="el101-data-value orange">+100 Token A</span></div>
              <div className="el101-data-row"><span className="el101-data-label">New Reserve A</span><span className="el101-data-value">1,100 tokens</span></div>
              <div className="el101-data-row"><span className="el101-data-label">New Reserve B (k/1100)</span><span className="el101-data-value">909.09 tokens</span></div>
              <div className="el101-data-row"><span className="el101-data-label">You receive</span><span className="el101-data-value green">90.91 Token B</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Effective price</span><span className="el101-data-value amber">1.10 A per B (vs 1.00 spot)</span></div>
            </div>

            <p>
              Notice something important: you sent 100 Token A but only received 90.91 Token B, not the 100 you might expect at the initial 1:1 price. This difference is called <strong>price impact</strong> — the larger your trade relative to the pool, the worse your effective price. This is a fundamental property of AMMs and why pool size (liquidity depth) matters so much.
            </p>

            <div className="el101-info-box">
              <div className="el101-info-box-label">The Analogy</div>
              <p>
                An AMM is like a <strong>seesaw</strong> — adding weight to one side (depositing Token A) lifts the other side (makes Token B more valuable). The heavier the load you put on one side (bigger trade), the more dramatically the other side tips. A deep pool is like a very heavy seesaw — it takes much more force (larger trades) to move the price significantly.
              </p>
            </div>

            <h3>Try It: AMM Price Curve Visualizer</h3>
            <div className="el101-amm-curve">
              <div className="el101-amm-curve-title">Interactive AMM Price Curve</div>
              <div className="el101-amm-row">
                <div className="el101-amm-input-group">
                  <div className="el101-amm-input-label">Reserve A</div>
                  <input type="range" className="el101-amm-slider" min={100} max={5000} step={50} value={reserveA} onChange={(e) => { setReserveA(Number(e.target.value)); setSwapResult(null); }} />
                  <div className="el101-amm-value">{reserveA.toLocaleString()} tokens</div>
                </div>
                <div className="el101-amm-input-group">
                  <div className="el101-amm-input-label">Reserve B</div>
                  <input type="range" className="el101-amm-slider" min={100} max={5000} step={50} value={reserveB} onChange={(e) => { setReserveB(Number(e.target.value)); setSwapResult(null); }} />
                  <div className="el101-amm-value">{reserveB.toLocaleString()} tokens</div>
                </div>
              </div>
              <div className="el101-amm-k-display">
                k = {reserveA.toLocaleString()} x {reserveB.toLocaleString()} = {k.toLocaleString()} | Price: 1 A = {priceAinB.toFixed(4)} B | 1 B = {priceBinA.toFixed(4)} A
              </div>
              <div className="el101-amm-row" style={{ marginTop: 16 }}>
                <div className="el101-amm-input-group">
                  <div className="el101-amm-input-label">Swap Amount (Token A)</div>
                  <input type="number" className="el101-amm-input" value={swapAmount} onChange={(e) => { setSwapAmount(Number(e.target.value) || 0); setSwapResult(null); }} />
                </div>
                <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
                  <button className="el101-amm-btn" onClick={executeSwap}>Swap A {"\u2192"} B</button>
                </div>
              </div>
              {swapResult && (
                <div className="el101-amm-result">
                  <div className="el101-amm-result-value">{swapResult.output.toFixed(4)} Token B</div>
                  <div className="el101-amm-result-label">Output for {swapAmount.toLocaleString()} Token A</div>
                  <div className={`el101-amm-result-impact ${swapResult.impact < 2 ? "low" : swapResult.impact < 10 ? "medium" : "high"}`}>
                    Price Impact: {swapResult.impact.toFixed(2)}% {swapResult.impact < 2 ? "(Low)" : swapResult.impact < 10 ? "(Moderate)" : "(High!)"}
                  </div>
                </div>
              )}
            </div>

            {renderQuizWithSelection(1)}
            <button className={`el101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Providing Liquidity and Earning Fees
          ============================================================ */}
      <div className={`el101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="el101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="el101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="el101-lesson-header-text">
            <div className="el101-lesson-title">Providing Liquidity and Earning Fees</div>
            <div className="el101-lesson-meta"><span>10 min read</span><span>Liquidity</span></div>
          </div>
          <div className="el101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="el101-lesson-content">
          <div className="el101-lesson-body">
            <h3>What Is a Liquidity Provider?</h3>
            <p>
              A <strong>liquidity provider (LP)</strong> is anyone who deposits tokens into a pool to enable trading. Without LPs, there would be no tokens in the pool, and no swaps could happen. In return for providing this essential service, LPs earn a share of every trading fee generated by the pool. On Eloqura, that fee is <strong>0.3% of every trade</strong>.
            </p>
            <p>
              To provide liquidity, you deposit <strong>equal value</strong> of two tokens into a pool. If you want to add liquidity to the OEC/USDC pool, and OEC is trading at $2, you'd deposit 500 OEC and 1,000 USDC (both worth $1,000). In return, you receive <strong>LP tokens</strong> — a receipt that represents your share of the pool. When you want to exit, you burn your LP tokens and receive your proportional share of both tokens plus any accrued fees.
            </p>

            <div className="el101-data-block">
              <div className="el101-data-section-label">Example: Providing $2,000 in Liquidity</div>
              <div className="el101-data-row"><span className="el101-data-label">You deposit</span><span className="el101-data-value">500 OEC ($1,000) + 1,000 USDC ($1,000)</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Pool total (after)</span><span className="el101-data-value">10,500 OEC + 21,000 USDC</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Your pool share</span><span className="el101-data-value purple">~4.76%</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Daily volume</span><span className="el101-data-value">$50,000</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Daily fees (0.3%)</span><span className="el101-data-value green">$150</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Your daily earnings</span><span className="el101-data-value green">$7.14 (4.76% of $150)</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Annualized APR</span><span className="el101-data-value green">~130% (if volume stays constant)</span></div>
            </div>

            <h3>LP Tokens: Your Pool Receipt</h3>
            <p>
              When you deposit into a pool, you receive <strong>LP tokens</strong> proportional to your contribution. These tokens are themselves ERC-20 tokens that represent your ownership stake. You can hold them, transfer them, or even use them as collateral in other DeFi protocols. When you're ready to withdraw, you burn the LP tokens and receive your share of the pool's current reserves — which includes all accumulated fees.
            </p>
            <p>
              It's important to understand that fees aren't paid out separately — they <strong>accumulate in the pool</strong>, increasing the total reserves. Your LP tokens represent a fixed percentage of an ever-growing pool. When you withdraw, you simply get more tokens than you put in (the difference being your fee earnings).
            </p>

            <div className="el101-info-box orange">
              <div className="el101-info-box-label">Impermanent Loss Warning</div>
              <p>
                <strong>Impermanent loss</strong> is the risk that the value of your deposited tokens changes relative to each other. If OEC doubles in price while you're providing liquidity, you'd have been better off just holding OEC. The pool automatically rebalances as the price moves, selling your appreciating token and buying the depreciating one. The loss is "impermanent" because it reverses if the price returns to its original ratio — but if you withdraw at a different ratio, the loss becomes permanent. Fee earnings can offset impermanent loss, but it's the primary risk LPs face.
              </p>
            </div>

            <div className="el101-info-box green">
              <div className="el101-info-box-label">Fee Rewards vs Risk</div>
              <p>
                The 0.3% fee on every trade is the incentive that makes liquidity provision worthwhile. High-volume pools with stable token pairs (like stablecoin pairs) tend to generate good fee revenue with minimal impermanent loss. Volatile pairs can generate higher fees during active markets but come with greater impermanent loss risk. The key is finding pools where <strong>fee income exceeds impermanent loss</strong> over your time horizon.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`el101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Swap Routing
          ============================================================ */}
      <div className={`el101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="el101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="el101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="el101-lesson-header-text">
            <div className="el101-lesson-title">Swap Routing: Finding the Best Price Across Pools</div>
            <div className="el101-lesson-meta"><span>8 min read</span><span>Routing</span></div>
          </div>
          <div className="el101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="el101-lesson-content">
          <div className="el101-lesson-body">
            <h3>When Direct Pools Don't Exist</h3>
            <p>
              Not every token pair has a direct liquidity pool. If you want to swap Token A for Token C, but no A/C pool exists, the router must find an <strong>indirect path</strong>. The most common intermediate token is <strong>WETH</strong> (Wrapped Ether), since most tokens have a WETH pair. So your swap might route as A {"\u2192"} WETH {"\u2192"} C — a <strong>multi-hop swap</strong> that executes atomically in a single transaction.
            </p>
            <p>
              The Eloqura router is smart enough to evaluate multiple possible paths and select the one that gives you the <strong>best output</strong>. It compares direct routes, WETH routes, and even routes through USDC or other major tokens. This all happens transparently — you just specify what you want to trade, and the router handles the complexity.
            </p>

            <h3>Fee Tiers Matter</h3>
            <p>
              Different pools can have different <strong>fee tiers</strong>: 500 bps (0.05%), 3,000 bps (0.3%), and 10,000 bps (1%). The fee tier affects both the cost to traders and the revenue to LPs. Stable pairs often use the lowest fee tier (0.05%) because price doesn't move much, while exotic pairs use higher tiers to compensate LPs for the greater impermanent loss risk.
            </p>
            <p>
              Eloqura's quoter tries <strong>all fee tiers</strong> when calculating the best price for your swap. A 0.05% pool might have better depth but lower fees, while a 0.3% pool might have less liquidity but more favorable pricing for your specific trade size. The system evaluates every combination and presents the optimal route.
            </p>

            <div className="el101-data-block">
              <div className="el101-data-section-label">Routing Example: Swapping LINK for OEC</div>
              <div className="el101-data-row"><span className="el101-data-label">Route 1: Direct</span><span className="el101-data-value">LINK {"\u2192"} OEC (3000 bps pool)</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Route 1 output</span><span className="el101-data-value">482.5 OEC</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Route 2: Multi-hop</span><span className="el101-data-value cyan">LINK {"\u2192"} WETH {"\u2192"} OEC (500+3000 bps)</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Route 2 output</span><span className="el101-data-value green">497.8 OEC (best!)</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Route 3: USDC hop</span><span className="el101-data-value">LINK {"\u2192"} USDC {"\u2192"} OEC (3000+3000 bps)</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Route 3 output</span><span className="el101-data-value">475.2 OEC</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Selected</span><span className="el101-data-value green">Route 2 (+3.2% vs worst route)</span></div>
            </div>

            <div className="el101-info-box amber">
              <div className="el101-info-box-label">Oeconomia on Sepolia: Two WETH Addresses</div>
              <p>
                On the Sepolia testnet, Oeconomia uses <strong>two different WETH contracts</strong>: the Eloqura WETH (<code>0x34b1...b89f</code>) and the Uniswap WETH (<code>0xfFf9...6B14</code>). Each router must use its own WETH address — mixing them will cause swap failures. The Eloqura router handles this automatically, but it's important to understand that the correct WETH must be used for each protocol's liquidity pools.
              </p>
            </div>

            <div className="el101-info-box blue">
              <div className="el101-info-box-label">Why Routing Matters</div>
              <p>
                Good routing can save you <strong>5-15%</strong> on large trades compared to naive single-pool swaps. The difference comes from avoiding excessive price impact in shallow pools and finding fee tier combinations that minimize costs. Always use the router — never manually send tokens to a pool contract.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`el101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Uniswap V3 Integration and Concentrated Liquidity
          ============================================================ */}
      <div className={`el101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="el101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="el101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="el101-lesson-header-text">
            <div className="el101-lesson-title">Uniswap V3 Integration and Concentrated Liquidity</div>
            <div className="el101-lesson-meta"><span>10 min read</span><span>Advanced</span></div>
          </div>
          <div className="el101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="el101-lesson-content">
          <div className="el101-lesson-body">
            <h3>Two Generations of Liquidity</h3>
            <p>
              Eloqura supports both <strong>V2-style (full-range) liquidity</strong> and <strong>V3-style (concentrated) liquidity</strong>. V2 spreads your liquidity across the entire price range from 0 to infinity. This is simple and hands-off, but capital-inefficient — most of your liquidity sits in price ranges that are never used. V3 changed the game by allowing LPs to concentrate their capital within a <strong>specific price range</strong>.
            </p>
            <p>
              With concentrated liquidity, if you believe ETH will trade between $2,000 and $3,000 over the next month, you can provide liquidity <strong>only in that range</strong>. Your capital is up to <strong>4,000x more efficient</strong> than full-range V2 liquidity because every dollar you deposit is actively working in the price range where trades actually happen.
            </p>

            <h3>V2 vs V3 Comparison</h3>
            <div className="el101-compare-grid">
              <div className="el101-compare-card">
                <h4>V2: Full-Range Liquidity</h4>
                <ul>
                  <li>Liquidity spread from $0 to $infinity</li>
                  <li>Simple: deposit and forget</li>
                  <li>Lower fees earned per dollar deposited</li>
                  <li>No active management needed</li>
                  <li>LP tokens are fungible ERC-20s</li>
                  <li>Lower impermanent loss risk per position</li>
                </ul>
              </div>
              <div className="el101-compare-card">
                <h4>V3: Concentrated Liquidity</h4>
                <ul>
                  <li>Liquidity in a chosen price range</li>
                  <li>Complex: requires range selection</li>
                  <li>Much higher fees earned per dollar</li>
                  <li>Needs active management (rebalancing)</li>
                  <li>LP positions are unique NFTs (ERC-721)</li>
                  <li>Higher impermanent loss if price leaves range</li>
                </ul>
              </div>
            </div>

            <h3>Capital Efficiency in Numbers</h3>
            <div className="el101-stats-row">
              <div className="el101-stat-card"><div className="el101-stat-value">4,000x</div><div className="el101-stat-label">Max capital efficiency gain</div></div>
              <div className="el101-stat-card"><div className="el101-stat-value">~3x</div><div className="el101-stat-label">Typical real-world improvement</div></div>
              <div className="el101-stat-card"><div className="el101-stat-value">0.05-1%</div><div className="el101-stat-label">Fee tier range</div></div>
            </div>

            <p>
              The tradeoff is clear: V3 earns more fees per dollar, but requires <strong>active management</strong>. If the price moves outside your range, your position earns zero fees and is entirely converted to the less valuable token. V2 is passive and always earning (though less efficiently). Many LPs use V2 for set-and-forget positions and V3 for active strategies in pairs they monitor closely.
            </p>

            <div className="el101-info-box purple">
              <div className="el101-info-box-label">Why Eloqura Supports Both</div>
              <p>
                By supporting both V2 and V3, Eloqura serves all types of liquidity providers — from passive holders who want simple yield to sophisticated market makers who actively manage ranges. The router aggregates liquidity from both systems, so traders always get the best available price regardless of which version the liquidity lives in.
              </p>
            </div>

            <div className="el101-info-box cyan">
              <div className="el101-info-box-label">NFT Positions in V3</div>
              <p>
                Unlike V2 where your position is represented by a fungible ERC-20 LP token, each V3 position is a <strong>unique NFT</strong> (ERC-721). This is because every position has different parameters — tick range, fee tier, and deposit amounts. Your V3 position NFT contains all this information and can be transferred, sold, or used as collateral just like any other NFT.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`el101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Limit Orders and Advanced Trading Features
          ============================================================ */}
      <div className={`el101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="el101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="el101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="el101-lesson-header-text">
            <div className="el101-lesson-title">Limit Orders and Advanced Trading Features</div>
            <div className="el101-lesson-meta"><span>8 min read</span><span>Trading</span></div>
          </div>
          <div className="el101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="el101-lesson-content">
          <div className="el101-lesson-body">
            <h3>Beyond Simple Swaps</h3>
            <p>
              While instant swaps are the bread and butter of any DEX, sophisticated traders need more tools. Eloqura provides several advanced features that bring the control of centralized exchanges to decentralized trading: <strong>limit orders</strong>, <strong>custom slippage tolerance</strong>, and <strong>deadline protection</strong>.
            </p>
            <p>
              A <strong>limit order</strong> lets you set a specific price at which you want your trade to execute. Instead of accepting whatever the current market price is, you specify "buy OEC at $1.50 or better." Your order sits until the market reaches your target price, then executes automatically. This gives you precision control without having to watch the market constantly.
            </p>
            <p>
              <strong>Slippage tolerance</strong> is the maximum price difference you're willing to accept between when you submit a trade and when it executes. If you set 0.5% slippage and the price moves more than 0.5% before your transaction is confirmed, the swap automatically reverts — protecting you from unexpected price changes. The default on Eloqura is 0.5%, but you can adjust it higher for volatile tokens or lower for stablecoin swaps.
            </p>

            <h3>Deadline Protection</h3>
            <p>
              Every swap on Eloqura includes a <strong>transaction deadline</strong> — a timestamp after which the swap will revert even if it hasn't been confirmed yet. This prevents a scenario where your transaction sits in the mempool for minutes (or even hours during network congestion) and executes at a stale price long after you submitted it. Default deadline is typically 20 minutes, configurable per trade.
            </p>

            <div className="el101-info-box orange">
              <div className="el101-info-box-label">MEV Protection</div>
              <p>
                <strong>MEV (Maximal Extractable Value)</strong> is a form of front-running where bots detect your pending swap, execute a trade before yours to move the price, then profit from the difference. Eloqura's slippage tolerance and deadline features provide basic MEV protection — if a bot moves the price beyond your tolerance, your transaction reverts. For additional protection, consider using private transaction pools or MEV-protecting RPC endpoints.
              </p>
            </div>

            <div className="el101-data-block">
              <div className="el101-data-section-label">Eloqura Contract Addresses (Sepolia)</div>
              <div className="el101-data-row"><span className="el101-data-label">Factory</span><span className="el101-data-value cyan">0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Router</span><span className="el101-data-value cyan">0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Eloqura WETH</span><span className="el101-data-value">0x34b11F6b8f78fa010bBCA71bC7FE79dAa811b89f</span></div>
              <div className="el101-data-row"><span className="el101-data-label">Uniswap WETH</span><span className="el101-data-value">0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14</span></div>
              <div className="el101-data-row"><span className="el101-data-label">OEC Token</span><span className="el101-data-value purple">0x00904218319a045a96d776ec6a970f54741208e6</span></div>
            </div>

            <div className="el101-info-box green">
              <div className="el101-info-box-label">Connect via Oeconomia Explorer</div>
              <p>
                You can interact with Eloqura directly through the <strong>Oeconomia Explorer</strong> — the same application you're reading this lesson in. Navigate to the swap interface, connect your wallet, and you can trade any supported token pair. The explorer also provides real-time transaction tracking, pool analytics, and historical swap data so you can make informed trading decisions.
              </p>
            </div>

            <div className="el101-info-box blue">
              <div className="el101-info-box-label">Custom Token Import</div>
              <p>
                Eloqura supports importing <strong>any ERC-20 token</strong> by pasting its contract address into the swap modal. The system reads the token's name, symbol, and decimals directly from the blockchain. Imported tokens are saved to your browser's local storage for easy access. Always verify token addresses from trusted sources — anyone can create a token with any name.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`el101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
