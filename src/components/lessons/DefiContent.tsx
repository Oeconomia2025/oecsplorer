// ============================================================
// DeFi Explained: Finance Without Banks — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./defi.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "What DeFi Is and Why It Matters", meta: "10 min read \u00b7 Foundations" },
  { num: 2, title: "Lending and Borrowing Protocols", meta: "12 min read \u00b7 Protocols" },
  { num: 3, title: "Decentralized Exchanges (DEXs) and AMMs", meta: "12 min read \u00b7 Trading" },
  { num: 4, title: "Stablecoins and Their Role in DeFi", meta: "10 min read \u00b7 Assets" },
  { num: 5, title: "Risks: Impermanent Loss, Smart Contract Bugs, Liquidation", meta: "12 min read \u00b7 Risk" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What does 'permissionless' mean in DeFi?",
    options: [
      { letter: "A", text: "Anyone can modify the smart contract code", correct: false },
      { letter: "B", text: "Anyone can use the protocols without approval \u2014 no applications, no credit checks", correct: true },
      { letter: "C", text: "Transactions don't require gas fees", correct: false },
      { letter: "D", text: "The protocols don't have any rules or restrictions", correct: false },
    ],
    correctMsg: "Correct! Permissionless means open access \u2014 anyone with a wallet can lend, borrow, trade, or provide liquidity without filling out applications.",
    wrongMsg: "Not quite \u2014 permissionless means anyone can use the protocols without approval, applications, or credit checks.",
  },
  2: {
    question: "Why must DeFi loans be overcollateralized?",
    options: [
      { letter: "A", text: "To generate higher profits for the protocol", correct: false },
      { letter: "B", text: "Because there's no credit score system \u2014 collateral ensures the loan can be repaid even if the borrower defaults", correct: true },
      { letter: "C", text: "It's a regulation requirement from governments", correct: false },
      { letter: "D", text: "To prevent users from borrowing too much", correct: false },
    ],
    correctMsg: "Correct! Without credit scores or identity verification, overcollateralization is the mathematical guarantee that lenders won't lose money.",
    wrongMsg: "Not quite \u2014 overcollateralization is necessary because there's no credit score system. The collateral guarantees repayment.",
  },
  3: {
    question: "In an AMM, who provides the liquidity for trades?",
    options: [
      { letter: "A", text: "The exchange company from its treasury", correct: false },
      { letter: "B", text: "Automated bots run by the protocol developers", correct: false },
      { letter: "C", text: "Liquidity providers who deposit token pairs into pools and earn fees", correct: true },
      { letter: "D", text: "Miners who validate the transactions", correct: false },
    ],
    correctMsg: "Correct! Liquidity providers are regular users who deposit tokens into pools. In return, they earn a share of every swap fee.",
    wrongMsg: "Not quite \u2014 liquidity is provided by regular users (liquidity providers) who deposit token pairs into pools and earn trading fees.",
  },
  4: {
    question: "What backs the value of a crypto-collateralized stablecoin?",
    options: [
      { letter: "A", text: "US dollars in a bank account", correct: false },
      { letter: "B", text: "The reputation of the issuing company", correct: false },
      { letter: "C", text: "Other cryptocurrency assets locked in smart contract vaults at ratios above 100%", correct: true },
      { letter: "D", text: "Gold reserves held in physical vaults", correct: false },
    ],
    correctMsg: "Correct! Crypto-collateralized stablecoins like DAI are backed by excess cryptocurrency locked in smart contracts \u2014 typically at 150%+ collateral ratios.",
    wrongMsg: "Not quite \u2014 crypto-collateralized stablecoins are backed by other cryptocurrency assets locked in smart contract vaults at ratios above 100%.",
  },
  5: {
    question: "What is impermanent loss?",
    options: [
      { letter: "A", text: "When a token permanently loses all its value", correct: false },
      { letter: "B", text: "The gas fees lost during failed transactions", correct: false },
      { letter: "C", text: "The difference in value between holding tokens in a liquidity pool vs. holding them in your wallet", correct: true },
      { letter: "D", text: "Losses caused by inflation on the blockchain", correct: false },
    ],
    correctMsg: "Correct! Impermanent loss is the opportunity cost of providing liquidity \u2014 you'd have been better off simply holding if prices moved significantly.",
    wrongMsg: "Not quite \u2014 impermanent loss is the difference in value between holding tokens in a liquidity pool versus holding them in your wallet.",
  },
};

export default function DefiContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Liquidity Pool Simulator state
  const [poolTokenA, setPoolTokenA] = useState(1000);
  const [poolTokenB, setPoolTokenB] = useState(1000);
  const [swapAmount, setSwapAmount] = useState(100);
  const [poolK, setPoolK] = useState(1000 * 1000);
  const [poolHistory, setPoolHistory] = useState<string[]>([]);

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

  // Pool simulator functions
  const poolPrice = poolTokenA > 0 ? poolTokenB / poolTokenA : 0;
  const handleSwapAtoB = () => {
    if (swapAmount <= 0 || swapAmount >= poolTokenA) return;
    const newA = poolTokenA + swapAmount;
    const newB = poolK / newA;
    const received = poolTokenB - newB;
    const priceImpact = ((received / swapAmount - poolPrice) / poolPrice * -100).toFixed(2);
    setPoolHistory((prev) => [`Swapped ${swapAmount} A \u2192 ${received.toFixed(2)} B (impact: ${priceImpact}%)`, ...prev.slice(0, 4)]);
    setPoolTokenA(newA);
    setPoolTokenB(newB);
  };
  const handleSwapBtoA = () => {
    if (swapAmount <= 0 || swapAmount >= poolTokenB) return;
    const newB = poolTokenB + swapAmount;
    const newA = poolK / newB;
    const received = poolTokenA - newA;
    const priceImpact = ((received * poolPrice / swapAmount - 1) * -100).toFixed(2);
    setPoolHistory((prev) => [`Swapped ${swapAmount} B \u2192 ${received.toFixed(2)} A (impact: ${priceImpact}%)`, ...prev.slice(0, 4)]);
    setPoolTokenA(newA);
    setPoolTokenB(newB);
  };
  const handleResetPool = () => {
    setPoolTokenA(1000);
    setPoolTokenB(1000);
    setPoolK(1000000);
    setPoolHistory([]);
  };

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="df101-quiz-section">
        <div className="df101-quiz-title">Check Your Understanding</div>
        <div className="df101-quiz-question">{q.question}</div>
        <div className="df101-quiz-options">
          {q.options.map((opt) => {
            let cls = "df101-quiz-option";
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
          <div className={`df101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="df101">
      {/* Progress bar */}
      <div className="df101-progress">
        <div className="df101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`df101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="df101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — What DeFi Is and Why It Matters
          ============================================================ */}
      <div className={`df101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="df101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="df101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="df101-lesson-header-text">
            <div className="df101-lesson-title">What DeFi Is and Why It Matters</div>
            <div className="df101-lesson-meta"><span>10 min read</span><span>Foundations</span></div>
          </div>
          <div className="df101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="df101-lesson-content">
          <div className="df101-lesson-body">
            <h3>Finance Without Middlemen</h3>
            <p>
              <strong>Decentralized Finance (DeFi)</strong> is the recreation of traditional financial services \u2014 lending, borrowing, trading, insurance, savings \u2014 using smart contracts on a blockchain instead of banks, brokers, and financial institutions. No applications to fill out. No credit checks. No business hours. No geographic restrictions. Just code executing financial logic, accessible to anyone, 24 hours a day, 7 days a week, 365 days a year.
            </p>
            <p>
              In traditional finance (TradFi), every financial transaction requires a trusted intermediary. Want to trade stocks? You need a brokerage. Want a loan? You need a bank's approval. Want to send money internationally? You need a wire transfer service that takes days and charges fees. DeFi eliminates all of these middlemen by encoding their functions into <strong>transparent, auditable smart contracts</strong>.
            </p>
            <p>
              The implications are profound. A farmer in Kenya and a trader in New York can access the <strong>exact same financial tools</strong> with the exact same terms. The protocol doesn't know or care about your nationality, credit history, or net worth. If you have a wallet and some crypto, you can participate.
            </p>

            <h3>TradFi vs. DeFi</h3>
            <div className="df101-compare-grid">
              <div className="df101-compare-card">
                <h4>Traditional Finance</h4>
                <ul>
                  <li>Requires identity verification and credit checks</li>
                  <li>Limited to business hours and banking days</li>
                  <li>Geographic restrictions and regulations</li>
                  <li>Opaque fee structures and hidden costs</li>
                  <li>Banks earn the spread, users get minimal returns</li>
                  <li>Settlement takes days (T+2 for stocks)</li>
                  <li>Requires minimum balances and paperwork</li>
                </ul>
              </div>
              <div className="df101-compare-card">
                <h4>Decentralized Finance</h4>
                <ul>
                  <li>Permissionless \u2014 open to anyone with a wallet</li>
                  <li>Operates 24/7/365, never closes</li>
                  <li>Global access, no geographic barriers</li>
                  <li>Transparent fees visible in smart contract code</li>
                  <li>Users earn directly from protocol fees</li>
                  <li>Settlement in seconds to minutes</li>
                  <li>No minimums \u2014 start with any amount</li>
                </ul>
              </div>
            </div>

            <div className="df101-stats-row">
              <div className="df101-stat-card"><div className="df101-stat-value">$50B+</div><div className="df101-stat-label">Total Value Locked</div></div>
              <div className="df101-stat-card"><div className="df101-stat-value">$2B+</div><div className="df101-stat-label">Daily trading volume</div></div>
              <div className="df101-stat-card"><div className="df101-stat-value">5M+</div><div className="df101-stat-label">Unique DeFi wallets</div></div>
            </div>

            <div className="df101-info-box green">
              <div className="df101-info-box-label">Financial Inclusion</div>
              <p>
                Over <strong>1.4 billion adults</strong> worldwide are unbanked \u2014 they have no access to basic financial services like savings accounts, loans, or insurance. DeFi doesn't require a bank account, a government ID, or a minimum balance. All you need is a smartphone and internet access. For billions of people, DeFi isn't just an alternative to banking \u2014 it's their <strong>first access to financial services, period</strong>.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`df101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Lending and Borrowing Protocols
          ============================================================ */}
      <div className={`df101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="df101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="df101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="df101-lesson-header-text">
            <div className="df101-lesson-title">Lending and Borrowing Protocols</div>
            <div className="df101-lesson-meta"><span>12 min read</span><span>Protocols</span></div>
          </div>
          <div className="df101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="df101-lesson-content">
          <div className="df101-lesson-body">
            <h3>How DeFi Lending Works</h3>
            <p>
              DeFi lending protocols like <strong>Aave</strong> and <strong>Compound</strong> work on a simple principle: lenders deposit crypto into a pool and earn interest. Borrowers take from that pool by posting collateral worth <strong>more</strong> than what they borrow. The interest rates adjust automatically based on supply and demand \u2014 when borrowing demand is high, rates rise to attract more lenders. When it's low, rates fall.
            </p>
            <p>
              This is fundamentally different from traditional banking. A bank takes your deposit, lends it out at a higher rate, and keeps the spread. In DeFi, the <strong>spread goes to you</strong>. The protocol takes a small fee (typically 0.1-0.3%), and the rest flows directly to lenders. There's no loan officer deciding who qualifies \u2014 the smart contract enforces the rules mathematically.
            </p>
            <p>
              Why would someone borrow if they need to post more collateral than they receive? Several reasons: to get <strong>liquidity without selling</strong> (you believe ETH will go up, so you deposit ETH and borrow stablecoins to spend), to <strong>leverage trade</strong> (borrow to buy more of an asset), or for <strong>tax efficiency</strong> (borrowing isn't a taxable event in many jurisdictions, while selling is).
            </p>

            <h3>Typical Lending Rates</h3>
            <div className="df101-data-block">
              <div className="df101-data-section-label">Example DeFi Lending Rates</div>
              <div className="df101-data-row"><span className="df101-data-label">USDC Supply APY</span><span className="df101-data-value green">2.5\u20138%</span></div>
              <div className="df101-data-row"><span className="df101-data-label">ETH Supply APY</span><span className="df101-data-value green">1\u20134%</span></div>
              <div className="df101-data-row"><span className="df101-data-label">USDC Borrow APR</span><span className="df101-data-value orange">4\u201312%</span></div>
              <div className="df101-data-row"><span className="df101-data-label">ETH Borrow APR</span><span className="df101-data-value orange">2\u20138%</span></div>
              <div className="df101-data-row"><span className="df101-data-label">Typical Collateral Ratio</span><span className="df101-data-value purple">150\u2013200%</span></div>
              <div className="df101-data-row"><span className="df101-data-label">Liquidation Threshold</span><span className="df101-data-value red">80\u201385%</span></div>
            </div>

            <div className="df101-info-box cyan">
              <div className="df101-info-box-label">Oeconomia Connection</div>
              <p>
                <strong>Alluria</strong> is Oeconomia's lending protocol. It allows users to deposit ETH as collateral and mint <strong>ALUD</strong>, a stablecoin pegged to $1. This is similar to how MakerDAO lets users mint DAI. The key innovation is Alluria's integration with the broader Oeconomia ecosystem \u2014 ALUD can be traded on Eloqura, used in Artivya, and the governance of Alluria's parameters is controlled by OEC Guardian stakers.
              </p>
            </div>

            <div className="df101-info-box amber">
              <div className="df101-info-box-label">Overcollateralization Explained</div>
              <p>
                If you want to borrow $100, you must deposit $150\u2013200 in collateral. Why? Because there are no credit scores in DeFi. The protocol can't sue you or send a collections agency. The <strong>only guarantee</strong> is the collateral itself. If its value drops below a threshold, the protocol automatically sells it (liquidation) to repay the loan. This mathematical guarantee is what makes trustless lending possible.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`df101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Decentralized Exchanges (DEXs) and AMMs
          ============================================================ */}
      <div className={`df101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="df101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="df101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="df101-lesson-header-text">
            <div className="df101-lesson-title">Decentralized Exchanges (DEXs) and AMMs</div>
            <div className="df101-lesson-meta"><span>12 min read</span><span>Trading</span></div>
          </div>
          <div className="df101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="df101-lesson-content">
          <div className="df101-lesson-body">
            <h3>Order Books vs. Automated Market Makers</h3>
            <p>
              Traditional exchanges (like the NYSE or Coinbase) use <strong>order books</strong>: buyers place bids, sellers place asks, and trades execute when prices match. This works well with high volume, but requires market makers to provide liquidity and can't function without a centralized matching engine.
            </p>
            <p>
              DeFi introduced a revolutionary alternative: the <strong>Automated Market Maker (AMM)</strong>. Instead of matching individual buyers and sellers, an AMM uses a <strong>liquidity pool</strong> \u2014 a smart contract holding reserves of two tokens. Anyone can trade against this pool at any time. The price is determined mathematically by the ratio of tokens in the pool, using the <strong>constant product formula: x * y = k</strong>.
            </p>
            <p>
              In this formula, <strong>x</strong> is the amount of Token A in the pool, <strong>y</strong> is the amount of Token B, and <strong>k</strong> is a constant that never changes. When someone buys Token A (removing it from the pool), they must add Token B to maintain k. This changes the ratio, which changes the price. The more you buy, the more the price moves against you \u2014 this is called <strong>price impact</strong>.
            </p>

            <h3>Try It: Liquidity Pool Simulator</h3>
            <div className="df101-pool-sim">
              <div className="df101-pool-row">
                <div className="df101-pool-input-group">
                  <div className="df101-pool-input-label">Token A in Pool</div>
                  <input type="number" className="df101-pool-input" value={poolTokenA.toFixed(2)} readOnly />
                </div>
                <div className="df101-pool-input-group">
                  <div className="df101-pool-input-label">Token B in Pool</div>
                  <input type="number" className="df101-pool-input" value={poolTokenB.toFixed(2)} readOnly />
                </div>
                <div className="df101-pool-input-group">
                  <div className="df101-pool-input-label">Swap Amount</div>
                  <input type="number" className="df101-pool-input" value={swapAmount} onChange={(e) => setSwapAmount(Number(e.target.value) || 0)} />
                </div>
              </div>
              <div className="df101-pool-result">
                <div className="df101-pool-result-grid">
                  <div className="df101-pool-result-item">
                    <div className="df101-pool-result-value">{poolPrice.toFixed(4)}</div>
                    <div className="df101-pool-result-label">Price (B per A)</div>
                  </div>
                  <div className="df101-pool-result-item">
                    <div className="df101-pool-result-value">{poolK.toLocaleString()}</div>
                    <div className="df101-pool-result-label">k (constant)</div>
                  </div>
                  <div className="df101-pool-result-item">
                    <div className="df101-pool-result-value">{(poolTokenA + poolTokenB).toFixed(2)}</div>
                    <div className="df101-pool-result-label">Total Liquidity</div>
                  </div>
                </div>
              </div>
              <div className="df101-pool-actions">
                <button className="df101-pool-btn" onClick={handleSwapAtoB}>Swap A {"\u2192"} B</button>
                <button className="df101-pool-btn" onClick={handleSwapBtoA}>Swap B {"\u2192"} A</button>
                <button className="df101-pool-btn" onClick={handleResetPool}>Reset Pool</button>
              </div>
              {poolHistory.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  {poolHistory.map((h, i) => (
                    <div key={i} style={{ fontSize: "0.75rem", color: "var(--tx-muted)", padding: "3px 0", fontFamily: "'JetBrains Mono', monospace" }}>{h}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="df101-info-box green">
              <div className="df101-info-box-label">Oeconomia Connection</div>
              <p>
                <strong>Eloqura</strong> is Oeconomia's DEX protocol, built as an AMM. It supports both V2-style constant product pools and integrates with Uniswap V3 for concentrated liquidity. When you swap tokens on Eloqura, you're trading against liquidity pools that follow the exact x*y=k formula described above. Liquidity providers earn 0.3% on every swap in the pools they fund.
              </p>
            </div>

            <div className="df101-info-box orange">
              <div className="df101-info-box-label">Slippage vs. Price Impact</div>
              <p>
                <strong>Price impact</strong> is the price change caused by your specific trade (determined by pool size vs. trade size). <strong>Slippage</strong> is the difference between the expected price when you submit the transaction and the actual price when it executes (caused by other trades landing before yours). Both reduce how much you receive. Setting a <strong>slippage tolerance</strong> (e.g., 0.5%) protects you from getting a much worse price than expected.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`df101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Stablecoins and Their Role in DeFi
          ============================================================ */}
      <div className={`df101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="df101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="df101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="df101-lesson-header-text">
            <div className="df101-lesson-title">Stablecoins and Their Role in DeFi</div>
            <div className="df101-lesson-meta"><span>10 min read</span><span>Assets</span></div>
          </div>
          <div className="df101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="df101-lesson-content">
          <div className="df101-lesson-body">
            <h3>The Bridge Between Crypto and Stability</h3>
            <p>
              Cryptocurrencies like ETH and BTC are volatile \u2014 their prices can swing 10-20% in a single day. This makes them exciting for trading but impractical for everyday transactions. If you're a merchant, you don't want the payment you received this morning to be worth 15% less by evening. If you're saving for rent, you need predictability.
            </p>
            <p>
              <strong>Stablecoins</strong> solve this problem by maintaining a stable value, typically pegged to $1 USD. They combine the benefits of cryptocurrency (fast, global, programmable, permissionless) with the price stability of traditional currency. Stablecoins are the <strong>backbone of DeFi</strong> \u2014 they serve as the base trading pair, the default lending asset, and the standard unit of account across protocols.
            </p>
            <p>
              Without stablecoins, DeFi couldn't function as a financial system. You can't build reliable lending protocols if your unit of account fluctuates wildly. You can't create meaningful price feeds without a stable reference point. Stablecoins are the infrastructure that makes everything else possible.
            </p>

            <h3>Types of Stablecoins</h3>
            <div className="df101-data-block">
              <div className="df101-data-section-label">Major Stablecoins Compared</div>
              <div className="df101-data-row"><span className="df101-data-label">USDT (Tether)</span><span className="df101-data-value">Fiat-backed \u00b7 $83B market cap \u00b7 Most traded</span></div>
              <div className="df101-data-row"><span className="df101-data-label">USDC (Circle)</span><span className="df101-data-value blue">Fiat-backed \u00b7 $25B market cap \u00b7 US-regulated</span></div>
              <div className="df101-data-row"><span className="df101-data-label">DAI (MakerDAO)</span><span className="df101-data-value purple">Crypto-collateralized \u00b7 $5B market cap \u00b7 Decentralized</span></div>
              <div className="df101-data-row"><span className="df101-data-label">FRAX</span><span className="df101-data-value cyan">Hybrid (partial algorithmic) \u00b7 $600M market cap</span></div>
            </div>

            <h3>How Each Type Works</h3>
            <div className="df101-three-col">
              <div className="df101-col-card">
                <h4>Fiat-Backed</h4>
                <p>For every token in circulation, $1 sits in a bank account (or equivalent). Centralized issuers like Circle (USDC) and Tether (USDT) manage the reserves. Simple and effective, but requires trust in the issuer and their audits.</p>
              </div>
              <div className="df101-col-card">
                <h4>Crypto-Collateralized</h4>
                <p>Backed by crypto locked in smart contracts at 150%+ ratios. DAI is minted by depositing ETH into MakerDAO vaults. Fully decentralized and transparent, but capital-inefficient due to overcollateralization.</p>
              </div>
              <div className="df101-col-card">
                <h4>Algorithmic</h4>
                <p>Use algorithms to expand and contract supply based on demand. No direct collateral backing. Risky \u2014 Terra/UST's $40B collapse in May 2022 demonstrated the fragility of pure algorithmic designs.</p>
              </div>
            </div>

            <div className="df101-info-box cyan">
              <div className="df101-info-box-label">Oeconomia Connection: ALUD</div>
              <p>
                <strong>ALUD</strong> is Oeconomia's native stablecoin, minted through the <strong>Alluria</strong> lending protocol. Users deposit ETH into vaults and mint ALUD at a collateral ratio above 150%. It follows the crypto-collateralized model similar to DAI, but is designed to integrate natively with all Oeconomia protocols \u2014 as a trading pair on Eloqura, a payment method on Artivya, and a savings instrument in Alluria's stability pool.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`df101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Risks: Impermanent Loss, Smart Contract Bugs, Liquidation
          ============================================================ */}
      <div className={`df101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="df101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="df101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="df101-lesson-header-text">
            <div className="df101-lesson-title">Risks: Impermanent Loss, Smart Contract Bugs, Liquidation</div>
            <div className="df101-lesson-meta"><span>12 min read</span><span>Risk</span></div>
          </div>
          <div className="df101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="df101-lesson-content">
          <div className="df101-lesson-body">
            <h3>An Honest Look at DeFi Risks</h3>
            <p>
              DeFi offers remarkable opportunities, but it comes with real risks that every participant must understand. There are no customer support lines, no FDIC insurance, and no undo buttons. If you send tokens to the wrong address, they're gone. If a smart contract has a bug, your funds could be drained. Understanding risks is not optional \u2014 it's <strong>the most important DeFi skill you can develop</strong>.
            </p>

            <h3>Impermanent Loss (IL)</h3>
            <p>
              When you provide liquidity to an AMM pool, the pool rebalances your tokens as prices change. If Token A's price doubles while Token B stays flat, the pool sells your Token A and buys Token B to maintain the ratio. When you withdraw, you'll have <strong>less of the token that went up</strong> and <strong>more of the token that didn't</strong> \u2014 compared to if you'd simply held both tokens in your wallet.
            </p>
            <p>
              The "impermanent" part means the loss only materializes when you withdraw. If prices return to where they started, the loss disappears. In practice, trading fees earned from the pool can offset IL, especially for stable pairs (like USDC/DAI) where prices stay close together.
            </p>

            <h3>Smart Contract Exploits</h3>
            <div className="df101-data-block">
              <div className="df101-data-section-label">Notable DeFi Exploits</div>
              <div className="df101-data-row"><span className="df101-data-label">Ronin Bridge (2022)</span><span className="df101-data-value red">$625M stolen</span></div>
              <div className="df101-data-row"><span className="df101-data-label">Wormhole (2022)</span><span className="df101-data-value red">$326M stolen</span></div>
              <div className="df101-data-row"><span className="df101-data-label">Nomad Bridge (2022)</span><span className="df101-data-value red">$190M stolen</span></div>
              <div className="df101-data-row"><span className="df101-data-label">Euler Finance (2023)</span><span className="df101-data-value red">$197M stolen (returned)</span></div>
              <div className="df101-data-row"><span className="df101-data-label">Curve Finance (2023)</span><span className="df101-data-value red">$62M stolen</span></div>
              <div className="df101-data-row"><span className="df101-data-label">Total DeFi hacks (all time)</span><span className="df101-data-value red">$5B+</span></div>
            </div>

            <h3>Liquidation Risk</h3>
            <p>
              If you borrow in DeFi and your collateral's value drops below the <strong>liquidation threshold</strong> (typically 80-85% of your debt), the protocol automatically sells your collateral to repay the loan. This happens instantly, with no warning calls or grace periods. Liquidation usually includes a <strong>penalty</strong> (5-15%) that goes to the liquidator as incentive. In volatile markets, cascading liquidations can cause prices to spiral downward.
            </p>

            <h3>Risk Mitigation Strategies</h3>
            <div className="df101-three-col">
              <div className="df101-col-card">
                <h4>Research & Audit</h4>
                <p>Only use protocols with multiple independent audits. Check audit reports on sites like DeFiSafety. Avoid unaudited "degen" farms. Look for bug bounty programs \u2014 they show the team takes security seriously.</p>
              </div>
              <div className="df101-col-card">
                <h4>Diversify & Limit</h4>
                <p>Never put all your funds in one protocol. Set personal limits per protocol. Use battle-tested protocols (Aave, Uniswap, Compound) for the bulk of your positions. Treat new protocols as high-risk experiments.</p>
              </div>
              <div className="df101-col-card">
                <h4>Monitor & Protect</h4>
                <p>Use tools like DeBank or Zapper to monitor positions. Set up liquidation alerts for borrowed positions. Regularly revoke unnecessary token approvals. Keep collateral ratios well above liquidation thresholds (200%+).</p>
              </div>
            </div>

            <div className="df101-info-box orange">
              <div className="df101-info-box-label">The Golden Rule of DeFi Risk</div>
              <p>
                Never invest more than you can afford to lose completely. This isn't just a saying \u2014 it's a practical rule for DeFi. Smart contracts can have undiscovered bugs. Bridges can be exploited. Stablecoins can depeg. <strong>Treat DeFi like a high-risk investment</strong>, allocate accordingly, and always maintain a reserve of funds you don't put at risk.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`df101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
