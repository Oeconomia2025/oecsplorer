// ============================================================
// Yield Farming & Liquidity Provision — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./yield.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "How AMMs and the Constant Product Formula Work", meta: "12 min read \u00b7 Mechanics" },
  { num: 2, title: "Providing Liquidity: LP Tokens and Pool Shares", meta: "12 min read \u00b7 Pools" },
  { num: 3, title: "Impermanent Loss: What It Is and When It Matters", meta: "15 min read \u00b7 Risk" },
  { num: 4, title: "Yield Farming: Staking LP Tokens for Rewards", meta: "12 min read \u00b7 Farming" },
  { num: 5, title: "Comparing Single-Sided vs. Dual-Sided Liquidity", meta: "10 min read \u00b7 Strategy" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "In the constant product formula x*y=k, what does k represent?",
    options: [
      { letter: "A", text: "The total dollar value of the pool", correct: false },
      { letter: "B", text: "The number of liquidity providers", correct: false },
      { letter: "C", text: "A constant that must remain unchanged \u2014 ensuring the pool always has liquidity", correct: true },
      { letter: "D", text: "The maximum amount that can be traded in one transaction", correct: false },
    ],
    correctMsg: "Correct! k is the invariant \u2014 the product of both token reserves must always equal k, which mathematically guarantees the pool can never be fully drained.",
    wrongMsg: "Not quite \u2014 k is a constant that must remain unchanged, ensuring the pool always has liquidity available for trades.",
  },
  2: {
    question: "What do LP tokens represent?",
    options: [
      { letter: "A", text: "A receipt for gas fees paid on the network", correct: false },
      { letter: "B", text: "Your proportional share of a liquidity pool and its accumulated fees", correct: true },
      { letter: "C", text: "Governance votes in the protocol", correct: false },
      { letter: "D", text: "The price of the tokens in the pool", correct: false },
    ],
    correctMsg: "Correct! LP tokens are your receipt and claim \u2014 they represent your share of the pool's total liquidity plus all fees earned since you deposited.",
    wrongMsg: "Not quite \u2014 LP tokens represent your proportional share of a liquidity pool and its accumulated trading fees.",
  },
  3: {
    question: "When does impermanent loss become permanent?",
    options: [
      { letter: "A", text: "After 30 days of providing liquidity", correct: false },
      { letter: "B", text: "When the protocol is updated", correct: false },
      { letter: "C", text: "When you withdraw your liquidity while token prices have diverged from your entry point", correct: true },
      { letter: "D", text: "When the pool runs out of liquidity", correct: false },
    ],
    correctMsg: "Correct! IL is only \"realized\" when you withdraw. If you wait for prices to return to your entry ratio, the loss can disappear entirely.",
    wrongMsg: "Not quite \u2014 impermanent loss becomes permanent when you withdraw your liquidity while token prices have diverged from your entry point.",
  },
  4: {
    question: "What is the difference between APR and APY?",
    options: [
      { letter: "A", text: "APR is for crypto and APY is for traditional finance", correct: false },
      { letter: "B", text: "APY includes compounding effects, making it higher than APR for the same rate", correct: true },
      { letter: "C", text: "APR is annual and APY is monthly", correct: false },
      { letter: "D", text: "They are the same thing with different names", correct: false },
    ],
    correctMsg: "Correct! APR is the simple annual rate. APY accounts for the compounding effect \u2014 reinvesting earnings to earn returns on your returns.",
    wrongMsg: "Not quite \u2014 APY includes compounding effects, making it higher than APR for the same base rate. The more frequently you compound, the bigger the difference.",
  },
  5: {
    question: "What is concentrated liquidity?",
    options: [
      { letter: "A", text: "A pool with only one type of token", correct: false },
      { letter: "B", text: "A pool controlled by a single whale liquidity provider", correct: false },
      { letter: "C", text: "Providing liquidity within a specific price range for higher capital efficiency", correct: true },
      { letter: "D", text: "A mechanism to prevent impermanent loss", correct: false },
    ],
    correctMsg: "Correct! Concentrated liquidity (introduced in Uniswap V3) lets LPs focus their capital in a chosen price range, dramatically increasing fee earnings per dollar deployed.",
    wrongMsg: "Not quite \u2014 concentrated liquidity means providing liquidity within a specific price range for higher capital efficiency.",
  },
};

export default function YieldContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // APY Calculator state
  const [principal, setPrincipal] = useState(1000);
  const [apr, setApr] = useState(50);
  const [compFreq, setCompFreq] = useState<"daily" | "weekly" | "monthly">("daily");

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

  // APY calculations
  const compPeriods = compFreq === "daily" ? 365 : compFreq === "weekly" ? 52 : 12;
  const ratePerPeriod = (apr / 100) / compPeriods;
  const compoundedValue = principal * Math.pow(1 + ratePerPeriod, compPeriods);
  const simpleValue = principal * (1 + apr / 100);
  const effectiveAPY = (Math.pow(1 + ratePerPeriod, compPeriods) - 1) * 100;
  const compoundBonus = compoundedValue - simpleValue;

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="yf101-quiz-section">
        <div className="yf101-quiz-title">Check Your Understanding</div>
        <div className="yf101-quiz-question">{q.question}</div>
        <div className="yf101-quiz-options">
          {q.options.map((opt) => {
            let cls = "yf101-quiz-option";
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
          <div className={`yf101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="yf101">
      {/* Progress bar */}
      <div className="yf101-progress">
        <div className="yf101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`yf101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="yf101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — How AMMs and the Constant Product Formula Work
          ============================================================ */}
      <div className={`yf101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="yf101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="yf101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="yf101-lesson-header-text">
            <div className="yf101-lesson-title">How AMMs and the Constant Product Formula Work</div>
            <div className="yf101-lesson-meta"><span>12 min read</span><span>Mechanics</span></div>
          </div>
          <div className="yf101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="yf101-lesson-content">
          <div className="yf101-lesson-body">
            <h3>The Mathematics of Decentralized Trading</h3>
            <p>
              At the heart of every AMM-based DEX is a simple but powerful equation: <strong>x * y = k</strong>. This is the <strong>constant product formula</strong>, and it's the mathematical engine that makes decentralized trading possible without order books, market makers, or any centralized infrastructure.
            </p>
            <p>
              In this formula, <strong>x</strong> represents the quantity of Token A in the pool, <strong>y</strong> represents the quantity of Token B, and <strong>k</strong> is a constant (the product of x and y) that must remain the same before and after every trade. The pool's price of Token A in terms of Token B is simply <strong>y / x</strong> \u2014 the ratio of the two reserves.
            </p>
            <p>
              When a trader wants to buy Token A, they send Token B to the pool (increasing y). To maintain k, the pool must decrease x (send Token A to the trader). The amount of Token A they receive depends on how much Token B they add relative to the pool's size. This ratio-based pricing means <strong>the more you trade relative to the pool, the worse your price gets</strong> \u2014 a built-in protection against pool drainage.
            </p>

            <h3>A Swap Step by Step</h3>
            <div className="yf101-data-block">
              <div className="yf101-data-section-label">Example: Swapping Token B for Token A</div>
              <div className="yf101-data-row"><span className="yf101-data-label">Pool Before</span><span className="yf101-data-value">1,000 A \u00d7 1,000 B = k of 1,000,000</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Price Before</span><span className="yf101-data-value">1 A = 1 B (ratio 1:1)</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Trader Sends</span><span className="yf101-data-value cyan">100 Token B</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">New B Reserve</span><span className="yf101-data-value">1,000 + 100 = 1,100 B</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">New A Reserve</span><span className="yf101-data-value">1,000,000 / 1,100 = 909.09 A</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Trader Receives</span><span className="yf101-data-value green">1,000 - 909.09 = 90.91 Token A</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Effective Price</span><span className="yf101-data-value orange">100 B / 90.91 A = 1.10 B per A</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Price Impact</span><span className="yf101-data-value red">~9.09% worse than the starting price</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">New Pool Price</span><span className="yf101-data-value">1,100 / 909.09 = 1.21 B per A</span></div>
            </div>

            <p>
              Notice the trader sent 100 B but only received 90.91 A \u2014 not the 100 A the starting price suggested. This difference is the <strong>price impact</strong>. The larger the trade relative to pool size, the greater the price impact. A trade of 10 B in this same pool would have near-zero impact, receiving approximately 9.99 A.
            </p>

            <div className="yf101-info-box">
              <div className="yf101-info-box-label">Price Impact vs. Pool Depth</div>
              <p>
                Price impact is inversely related to pool depth (total liquidity). A $1,000 swap in a $10 million pool has negligible impact. The same swap in a $10,000 pool has massive impact. This is why <strong>deep liquidity is so valuable</strong> \u2014 it means better prices for traders, which attracts more trading volume, which generates more fees for liquidity providers. It's a virtuous cycle.
              </p>
            </div>

            <div className="yf101-info-box cyan">
              <div className="yf101-info-box-label">Beyond x*y=k</div>
              <p>
                While x*y=k is the foundation, modern AMMs have evolved. <strong>Curve</strong> uses a modified formula optimized for assets with similar prices (stablecoin pairs), reducing slippage dramatically. <strong>Uniswap V3</strong> introduced concentrated liquidity, where LPs can focus capital in specific price ranges for up to 4000x capital efficiency. <strong>Balancer</strong> supports weighted pools with ratios other than 50/50. Each variant tweaks the math for specific use cases.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`yf101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Providing Liquidity: LP Tokens and Pool Shares
          ============================================================ */}
      <div className={`yf101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="yf101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="yf101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="yf101-lesson-header-text">
            <div className="yf101-lesson-title">Providing Liquidity: LP Tokens and Pool Shares</div>
            <div className="yf101-lesson-meta"><span>12 min read</span><span>Pools</span></div>
          </div>
          <div className="yf101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="yf101-lesson-content">
          <div className="yf101-lesson-body">
            <h3>What Happens When You Provide Liquidity</h3>
            <p>
              When you provide liquidity to an AMM pool, you deposit <strong>two tokens in equal value</strong> (for a standard 50/50 pool). In return, the pool mints <strong>LP tokens</strong> \u2014 special ERC-20 tokens that represent your proportional share of the pool. These LP tokens are your receipt, your claim ticket, and your proof of ownership.
            </p>
            <p>
              As traders swap through the pool, they pay a fee (typically <strong>0.3%</strong> of each trade). This fee is added to the pool's reserves. Since your LP tokens represent a fixed percentage of the pool, and the pool keeps growing from fees, your LP tokens represent an ever-increasing amount of underlying tokens. When you burn (redeem) your LP tokens, you receive your share of the pool \u2014 including all accumulated fees.
            </p>
            <p>
              Think of LP tokens like shares in a dividend-reinvesting fund. The fund (pool) earns income (trading fees), and that income is automatically reinvested (added to pool reserves). Your shares (LP tokens) don't change in quantity, but each share is worth more over time.
            </p>

            <h3>Deposit Example</h3>
            <div className="yf101-data-block">
              <div className="yf101-data-section-label">Adding Liquidity to an ETH/USDC Pool</div>
              <div className="yf101-data-row"><span className="yf101-data-label">Pool Before You</span><span className="yf101-data-value">10 ETH + 25,000 USDC</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Total LP Supply</span><span className="yf101-data-value">500 LP tokens</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">You Deposit</span><span className="yf101-data-value cyan">1 ETH + 2,500 USDC</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Your Share</span><span className="yf101-data-value purple">1/11 = 9.09% of pool</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">LP Tokens Minted to You</span><span className="yf101-data-value green">50 LP tokens</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">Pool After You</span><span className="yf101-data-value">11 ETH + 27,500 USDC</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">New LP Supply</span><span className="yf101-data-value">550 LP tokens</span></div>
            </div>

            <p>
              After 30 days of trading activity, the pool has earned 0.5 ETH and 1,250 USDC in fees. The pool now holds 11.5 ETH and 28,750 USDC. Your 50 LP tokens (9.09% share) now represent approximately <strong>1.045 ETH and 2,613 USDC</strong> \u2014 more than you deposited, thanks to fee accumulation.
            </p>

            <div className="yf101-info-box green">
              <div className="yf101-info-box-label">LP Tokens Are Composable</div>
              <p>
                Because LP tokens are standard ERC-20 tokens, they can be used in <strong>other DeFi protocols</strong>. You can stake LP tokens in a yield farm to earn additional rewards. You can use them as collateral in some lending protocols. You can even trade them on secondary markets. This <strong>composability</strong> \u2014 using one DeFi building block inside another \u2014 is what makes the DeFi ecosystem so powerful. It's often called "money legos."
              </p>
            </div>

            <div className="yf101-info-box amber">
              <div className="yf101-info-box-label">Important: Equal Value, Not Equal Quantity</div>
              <p>
                You must deposit tokens in <strong>equal dollar value</strong>, not equal quantity. If ETH is $2,500 and you want to add 1 ETH, you need $2,500 worth of the other token (e.g., 2,500 USDC). If you try to deposit in unequal value, the pool will reject the transaction. Some protocols offer "zap" features that automatically swap to balance your deposit, but this incurs swap fees and slippage.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`yf101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Impermanent Loss: What It Is and When It Matters
          ============================================================ */}
      <div className={`yf101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="yf101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="yf101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="yf101-lesson-header-text">
            <div className="yf101-lesson-title">Impermanent Loss: What It Is and When It Matters</div>
            <div className="yf101-lesson-meta"><span>15 min read</span><span>Risk</span></div>
          </div>
          <div className="yf101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="yf101-lesson-content">
          <div className="yf101-lesson-body">
            <h3>The Hidden Cost of Providing Liquidity</h3>
            <p>
              <strong>Impermanent loss (IL)</strong> is the difference between the value of your tokens if you had simply held them in your wallet versus the value of those same tokens after providing liquidity. When token prices diverge from their ratio at the time you deposited, the AMM rebalances your position \u2014 selling the token that went up and buying the token that went down. This automatic rebalancing means you end up with <strong>less of the winning token</strong> than if you'd just held.
            </p>
            <p>
              The word "impermanent" is key: if prices return to their original ratio, the loss disappears. It only becomes <strong>permanent</strong> when you withdraw your liquidity while prices have diverged. This is why timing matters \u2014 providing liquidity during stable periods is safer than during volatile ones.
            </p>
            <p>
              IL is not a bug \u2014 it's the mathematical consequence of the constant product formula. The AMM must maintain x*y=k, so when external prices change, the pool's internal reserves adjust. Arbitrage traders keep the pool's price aligned with the market, and in doing so, they extract the value that becomes your impermanent loss.
            </p>

            <h3>IL at Different Price Changes</h3>
            <div className="yf101-data-block">
              <div className="yf101-data-section-label">Impermanent Loss by Price Divergence</div>
              <div className="yf101-data-row"><span className="yf101-data-label">1.25x price change</span><span className="yf101-data-value amber">0.6% IL</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">1.50x price change</span><span className="yf101-data-value orange">2.0% IL</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">2x price change</span><span className="yf101-data-value orange">5.7% IL</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">3x price change</span><span className="yf101-data-value red">13.4% IL</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">4x price change</span><span className="yf101-data-value red">20.0% IL</span></div>
              <div className="yf101-data-row"><span className="yf101-data-label">5x price change</span><span className="yf101-data-value red">25.5% IL</span></div>
            </div>

            <h3>When IL Matters vs. When It Doesn't</h3>
            <div className="yf101-compare-grid">
              <div className="yf101-compare-card">
                <h4>IL Is Significant</h4>
                <ul>
                  <li>Volatile token pairs (ETH/ALT, BTC/ALT)</li>
                  <li>New tokens with unpredictable price action</li>
                  <li>Short time horizons (fees haven't offset IL)</li>
                  <li>Low-volume pools (not enough fees to compensate)</li>
                  <li>One-directional price moves (token goes 5x or 0.2x)</li>
                </ul>
              </div>
              <div className="yf101-compare-card">
                <h4>IL Is Negligible</h4>
                <ul>
                  <li>Stablecoin pairs (USDC/DAI \u2014 near-zero divergence)</li>
                  <li>Correlated assets (ETH/stETH)</li>
                  <li>High-volume pools (fees far exceed IL)</li>
                  <li>Long time horizons with mean-reverting prices</li>
                  <li>Pools with additional farming rewards</li>
                </ul>
              </div>
            </div>

            <div className="yf101-info-box orange">
              <div className="yf101-info-box-label">The Break-Even Question</div>
              <p>
                The practical question for every LP is: <strong>do the trading fees I earn exceed the impermanent loss I experience?</strong> For major pairs like ETH/USDC on Uniswap, high trading volume typically generates enough fees to more than offset IL. For obscure low-volume pairs, IL often dominates. Always check a pool's historical fee APR before depositing, and compare it to the expected IL for the price range you anticipate.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`yf101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Yield Farming: Staking LP Tokens for Rewards
          ============================================================ */}
      <div className={`yf101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="yf101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="yf101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="yf101-lesson-header-text">
            <div className="yf101-lesson-title">Yield Farming: Staking LP Tokens for Rewards</div>
            <div className="yf101-lesson-meta"><span>12 min read</span><span>Farming</span></div>
          </div>
          <div className="yf101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="yf101-lesson-content">
          <div className="yf101-lesson-body">
            <h3>The Concept of Yield Farming</h3>
            <p>
              <strong>Yield farming</strong> is the practice of staking (locking) your LP tokens in a "farm" contract to earn additional reward tokens on top of the trading fees you already earn from the liquidity pool. It's like earning interest on top of interest \u2014 you earn swap fees from the pool AND reward tokens from the farm simultaneously.
            </p>
            <p>
              Protocols use farming rewards as an <strong>incentive to bootstrap liquidity</strong>. A new DEX needs deep liquidity to attract traders, so it offers its native token as a reward to anyone who provides liquidity. This creates a flywheel: farming rewards attract LPs, deep liquidity attracts traders, trading volume generates fees, fees + rewards make farming more attractive, attracting more LPs.
            </p>
            <p>
              The reward tokens themselves have value \u2014 they can be sold, staked for governance power, or compounded back into more LP positions. The <strong>APR</strong> (Annual Percentage Rate) advertised by farms represents the simple return from rewards alone, not counting trading fees. The <strong>APY</strong> (Annual Percentage Yield) includes the effect of compounding \u2014 regularly claiming rewards and reinvesting them.
            </p>

            <h3>Try It: APY Calculator</h3>
            <div className="yf101-apy-calc">
              <div className="yf101-apy-row">
                <div className="yf101-apy-input-group">
                  <div className="yf101-apy-input-label">Principal ($)</div>
                  <input type="number" className="yf101-apy-input" value={principal} onChange={(e) => setPrincipal(Number(e.target.value) || 0)} />
                </div>
                <div className="yf101-apy-input-group">
                  <div className="yf101-apy-input-label">APR (%)</div>
                  <input type="number" className="yf101-apy-input" value={apr} onChange={(e) => setApr(Number(e.target.value) || 0)} />
                </div>
                <div className="yf101-apy-input-group">
                  <div className="yf101-apy-input-label">Compounding</div>
                  <select className="yf101-apy-select" value={compFreq} onChange={(e) => setCompFreq(e.target.value as "daily" | "weekly" | "monthly")}>
                    <option value="daily">Daily (365x/yr)</option>
                    <option value="weekly">Weekly (52x/yr)</option>
                    <option value="monthly">Monthly (12x/yr)</option>
                  </select>
                </div>
              </div>
              <div className="yf101-apy-result">
                <div className="yf101-apy-result-grid">
                  <div className="yf101-apy-result-item">
                    <div className="yf101-apy-result-value">${simpleValue.toFixed(2)}</div>
                    <div className="yf101-apy-result-label">Simple Interest (APR: {apr}%)</div>
                  </div>
                  <div className="yf101-apy-result-item">
                    <div className="yf101-apy-result-value green">${compoundedValue.toFixed(2)}</div>
                    <div className="yf101-apy-result-label">Compound ({compFreq}) (APY: {effectiveAPY.toFixed(1)}%)</div>
                  </div>
                  <div className="yf101-apy-result-item">
                    <div className="yf101-apy-result-value green">+${compoundBonus.toFixed(2)}</div>
                    <div className="yf101-apy-result-label">Compounding Bonus</div>
                  </div>
                </div>
                <div className="yf101-apy-diff">
                  Compounding {compFreq} turns {apr}% APR into {effectiveAPY.toFixed(1)}% APY \u2014 earning you <strong>${compoundBonus.toFixed(2)} extra</strong> per year on a ${principal.toLocaleString()} deposit
                </div>
              </div>
            </div>

            <div className="yf101-info-box green">
              <div className="yf101-info-box-label">Oeconomia Connection</div>
              <p>
                The <strong>Eloqura DEX</strong> offers yield farming opportunities for liquidity providers. By staking LP tokens in Eloqura's farm contracts, users earn <strong>ELOQ</strong> reward tokens on top of the 0.3% swap fees from the pool. OEC Guardian stakers can vote on which pools receive the highest farming reward allocations \u2014 giving governance participants direct influence over yield farming incentives across the ecosystem.
              </p>
            </div>

            <div className="yf101-info-box purple">
              <div className="yf101-info-box-label">Auto-Compounding Vaults</div>
              <p>
                Manually claiming and reinvesting farming rewards is gas-intensive and time-consuming. <strong>Auto-compounding vaults</strong> (like Yearn Finance or Beefy) automate this process: they claim rewards, swap them for more LP tokens, and restake \u2014 all in a single transaction amortized across all vault depositors. This maximizes your APY while minimizing the gas cost per user.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`yf101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Comparing Single-Sided vs. Dual-Sided Liquidity
          ============================================================ */}
      <div className={`yf101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="yf101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="yf101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="yf101-lesson-header-text">
            <div className="yf101-lesson-title">Comparing Single-Sided vs. Dual-Sided Liquidity</div>
            <div className="yf101-lesson-meta"><span>10 min read</span><span>Strategy</span></div>
          </div>
          <div className="yf101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="yf101-lesson-content">
          <div className="yf101-lesson-body">
            <h3>Approaches to Providing Liquidity</h3>
            <p>
              Not all liquidity provision is the same. The DeFi ecosystem has evolved multiple approaches, each with different risk profiles, capital efficiency, and complexity levels. Understanding the differences helps you choose the right strategy for your goals and risk tolerance.
            </p>
            <p>
              <strong>Dual-sided liquidity</strong> is the traditional model: you deposit two tokens in equal value. This is what standard AMM pools (like Uniswap V2, Eloqura V2) require. It's simple to understand and manage, but requires exposure to both tokens and subjects you to impermanent loss.
            </p>
            <p>
              <strong>Single-sided liquidity</strong> allows depositing just one token. Some protocols handle the conversion internally (zapping half into the other token), while others use asymmetric pool designs or lending-based models. This is more convenient but often has hidden costs (swap fees, different IL dynamics).
            </p>

            <h3>Comparing Approaches</h3>
            <div className="yf101-three-col">
              <div className="yf101-col-card">
                <h4>Standard (V2) Pools</h4>
                <p>Deposit two tokens in 50/50 value. Simple, proven model. Full price range coverage. Lower capital efficiency \u2014 most of your liquidity sits idle, serving price ranges that may never be reached. Moderate IL risk. Best for passive LPs who want simplicity.</p>
              </div>
              <div className="yf101-col-card">
                <h4>Concentrated (V3)</h4>
                <p>Choose a specific price range for your liquidity. Dramatically higher capital efficiency \u2014 up to 4000x more effective per dollar. But if the price moves outside your range, you earn zero fees and face significant IL. Requires active management. Best for experienced LPs.</p>
              </div>
              <div className="yf101-col-card">
                <h4>Single-Sided</h4>
                <p>Deposit one token only. The protocol handles pairing or uses asymmetric designs. Convenient and reduces token exposure decisions. May have lower yields or hidden swap costs. Available on some protocols like Bancor (with IL protection) or via zap functions.</p>
              </div>
            </div>

            <h3>Key Metrics for Comparison</h3>
            <div className="yf101-stats-row">
              <div className="yf101-stat-card"><div className="yf101-stat-value">1x</div><div className="yf101-stat-label">V2 Capital Efficiency</div></div>
              <div className="yf101-stat-card"><div className="yf101-stat-value">4000x</div><div className="yf101-stat-label">V3 Max Efficiency</div></div>
              <div className="yf101-stat-card"><div className="yf101-stat-value">~50x</div><div className="yf101-stat-label">V3 Typical Efficiency</div></div>
            </div>

            <div className="yf101-info-box cyan">
              <div className="yf101-info-box-label">Concentrated Liquidity: The V3 Revolution</div>
              <p>
                Uniswap V3 (and Eloqura's V3 integration) introduced <strong>concentrated liquidity</strong>, where LPs choose a price range like $2,000\u2013$3,000 for ETH/USDC. Within that range, your capital is incredibly efficient \u2014 you earn fees as if your deposit were much larger. But the tradeoff is active management: if ETH drops to $1,800, your position is 100% ETH (no USDC left) and earning zero fees until it re-enters your range. This approach rewards expertise and attention.
              </p>
            </div>

            <div className="yf101-info-box">
              <div className="yf101-info-box-label">Choosing Your Strategy</div>
              <p>
                For beginners, <strong>standard V2 pools with major pairs</strong> (ETH/USDC, ETH/WBTC) are the safest starting point. Fees are reliable, IL is moderate, and no active management is needed. As you gain experience, explore concentrated liquidity positions in narrow ranges for higher returns. And always remember: the highest APY farms often carry the highest risks. A sustainable 20% APR on a blue-chip pool is worth more than a fleeting 1,000% APR on an unaudited protocol that might drain your funds.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`yf101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
