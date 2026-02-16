// ============================================================
// Alluria: Lending, Vaults & ALUD — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./alluria.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "How Vaults Work: Depositing Collateral, Minting ALUD", meta: "10 min read \u00B7 Vault Basics" },
  { num: 2, title: "Collateralization Ratios and Health Factors", meta: "10 min read \u00B7 Risk Management" },
  { num: 3, title: "The Liquidation Mechanism", meta: "10 min read \u00B7 System Security" },
  { num: 4, title: "ALUD: Oeconomia's Native Stablecoin", meta: "8 min read \u00B7 Stablecoins" },
  { num: 5, title: "Stability Pool and Liquidation Rewards", meta: "8 min read \u00B7 Advanced" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What do you need to deposit to mint ALUD?",
    options: [
      { letter: "A", text: "USDC or other stablecoins", correct: false },
      { letter: "B", text: "ETH (or other accepted collateral) into an Alluria vault", correct: true },
      { letter: "C", text: "OEC governance tokens", correct: false },
      { letter: "D", text: "Nothing \u2014 ALUD is freely minted by the protocol", correct: false },
    ],
    correctMsg: "Correct! You deposit ETH (or other accepted collateral) into an Alluria vault, and the protocol lets you mint ALUD against that locked collateral.",
    wrongMsg: "Not quite \u2014 ALUD is minted by depositing ETH (or other collateral) into an Alluria vault as security.",
  },
  2: {
    question: "What happens if your vault's collateralization ratio falls below the minimum?",
    options: [
      { letter: "A", text: "The protocol automatically adds more collateral for you", correct: false },
      { letter: "B", text: "Your vault can be liquidated \u2014 someone repays your debt and takes your collateral at a discount", correct: true },
      { letter: "C", text: "Your vault is frozen until the price recovers", correct: false },
      { letter: "D", text: "You receive a warning email and have 24 hours to add collateral", correct: false },
    ],
    correctMsg: "Correct! When your collateralization ratio drops below the minimum (e.g., 150%), anyone can liquidate your vault by repaying the ALUD debt and claiming your collateral at a discount.",
    wrongMsg: "Not quite \u2014 liquidation is automatic and permissionless. Anyone can trigger it once the ratio falls below the minimum.",
  },
  3: {
    question: "Who performs liquidations in the Alluria system?",
    options: [
      { letter: "A", text: "Only the Alluria team can perform liquidations", correct: false },
      { letter: "B", text: "Validators on the Ethereum network", correct: false },
      { letter: "C", text: "Anyone can \u2014 liquidators are incentivized by receiving collateral at a discount", correct: true },
      { letter: "D", text: "An automated bot controlled by the Oeconomia DAO", correct: false },
    ],
    correctMsg: "Correct! Liquidation is permissionless \u2014 anyone can call the liquidation function and receive a discount on the collateral as a reward for keeping the system solvent.",
    wrongMsg: "Not quite \u2014 liquidations are permissionless and incentivized. Anyone can liquidate an undercollateralized vault and receive a discount.",
  },
  4: {
    question: "What backs the value of ALUD?",
    options: [
      { letter: "A", text: "US dollars held in a bank account", correct: false },
      { letter: "B", text: "The reputation of the Oeconomia team", correct: false },
      { letter: "C", text: "Cryptocurrency collateral locked in Alluria vaults, always overcollateralized", correct: true },
      { letter: "D", text: "A mix of fiat currency and corporate bonds", correct: false },
    ],
    correctMsg: "Correct! Every ALUD in circulation is backed by more than $1 worth of crypto collateral locked in Alluria vaults, ensuring the peg remains stable.",
    wrongMsg: "Not quite \u2014 ALUD is backed by overcollateralized cryptocurrency locked in Alluria vaults, not by fiat or off-chain assets.",
  },
  5: {
    question: "What incentive do stability pool depositors have?",
    options: [
      { letter: "A", text: "They earn interest from the Ethereum network", correct: false },
      { letter: "B", text: "They receive governance voting power", correct: false },
      { letter: "C", text: "They receive liquidated collateral at a discount, earning a profit on liquidation events", correct: true },
      { letter: "D", text: "They get priority access to new Oeconomia features", correct: false },
    ],
    correctMsg: "Correct! Stability pool depositors provide ALUD to absorb liquidations, and in return they receive the liquidated collateral at a discount \u2014 typically a 10-15% profit on each liquidation.",
    wrongMsg: "Not quite \u2014 stability pool depositors earn profit by receiving liquidated collateral at a discount when vaults are liquidated.",
  },
};

export default function AlluriaContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Vault Health Monitor state
  const [ethPrice, setEthPrice] = useState(2500);
  const [ethDeposited] = useState(2);
  const [aludDebt] = useState(2500);
  const minRatio = 150;

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

  // Vault calculations
  const collateralValue = ethDeposited * ethPrice;
  const collateralizationRatio = (collateralValue / aludDebt) * 100;
  const healthFactor = collateralizationRatio / minRatio;
  const isLiquidatable = healthFactor < 1;
  const liquidationPrice = (aludDebt * (minRatio / 100)) / ethDeposited;
  const liquidationPenalty = 0.10;
  const remainingAfterLiquidation = collateralValue - (aludDebt * (1 + liquidationPenalty));

  const getHealthStatus = () => {
    if (healthFactor >= 1.5) return "safe";
    if (healthFactor >= 1.0) return "warning";
    return "danger";
  };

  const getHealthLabel = () => {
    if (healthFactor >= 1.5) return "SAFE";
    if (healthFactor >= 1.0) return "WARNING";
    return "LIQUIDATION";
  };

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="al101-quiz-section">
        <div className="al101-quiz-title">Check Your Understanding</div>
        <div className="al101-quiz-question">{q.question}</div>
        <div className="al101-quiz-options">
          {q.options.map((opt) => {
            let cls = "al101-quiz-option";
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
          <div className={`al101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="al101">
      {/* Progress bar */}
      <div className="al101-progress">
        <div className="al101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`al101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="al101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — How Vaults Work
          ============================================================ */}
      <div className={`al101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="al101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="al101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="al101-lesson-header-text">
            <div className="al101-lesson-title">How Vaults Work: Depositing Collateral, Minting ALUD</div>
            <div className="al101-lesson-meta"><span>10 min read</span><span>Vault Basics</span></div>
          </div>
          <div className="al101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="al101-lesson-content">
          <div className="al101-lesson-body">
            <h3>Your Personal DeFi Vault</h3>
            <p>
              An Alluria vault is a <strong>smart contract</strong> where you lock cryptocurrency (typically ETH) as collateral and mint <strong>ALUD</strong>, Oeconomia's native stablecoin, against it. Think of it as a <strong>collateralized loan</strong> that you give to yourself — you deposit valuable assets, and the protocol lets you borrow stablecoins up to a certain percentage of your collateral's value. There's no credit check, no approval process, and no due date — as long as your collateral maintains sufficient value, your vault stays healthy.
            </p>
            <p>
              The key word is <strong>overcollateralization</strong>. You must always deposit more value than you borrow. If the minimum collateral ratio is 150%, you need at least $150 worth of ETH for every $100 of ALUD you mint. This buffer protects the system: even if ETH's price drops, there's still enough collateral to cover the ALUD debt.
            </p>
            <p>
              Why would someone lock up $150 to borrow $100? Because they're <strong>bullish on ETH</strong>. Instead of selling their ETH for dollars, they keep their ETH exposure while extracting liquidity (ALUD) that they can use elsewhere — for trading, providing liquidity, or spending — all without triggering a taxable sale of their ETH.
            </p>

            <div className="al101-data-block">
              <div className="al101-data-section-label">Example: Opening an Alluria Vault</div>
              <div className="al101-data-row"><span className="al101-data-label">Deposit</span><span className="al101-data-value">1 ETH (at $2,500)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Collateral value</span><span className="al101-data-value green">$2,500</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Min collateral ratio</span><span className="al101-data-value amber">150%</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Max ALUD mintable</span><span className="al101-data-value">$2,500 / 1.50 = 1,666.67 ALUD</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Safe ALUD to mint</span><span className="al101-data-value green">~1,250 ALUD (200% ratio)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Your health factor</span><span className="al101-data-value green">1.33 (safe)</span></div>
            </div>

            <div className="al101-info-box">
              <div className="al101-info-box-label">The Analogy</div>
              <p>
                A vault is like a <strong>pawn shop</strong> — you deposit something valuable (your ETH), and you receive a loan (ALUD) in return. The pawn shop holds your item as security. If you want your item back, you repay the loan. If the value of your item drops too far, the pawn shop can sell it to cover your debt. The difference is that Alluria vaults are fully automated, transparent, and available to anyone 24/7.
              </p>
            </div>

            <div className="al101-info-box blue">
              <div className="al101-info-box-label">Why Mint Less Than Maximum?</div>
              <p>
                Just because you <strong>can</strong> mint 1,666 ALUD doesn't mean you <strong>should</strong>. Minting the maximum puts your vault at exactly the liquidation threshold — any price drop would trigger liquidation. Experienced users typically mint at 200-250% collateralization ratio, giving themselves a substantial buffer against price volatility.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`al101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Collateralization Ratios and Health Factors
          ============================================================ */}
      <div className={`al101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="al101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="al101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="al101-lesson-header-text">
            <div className="al101-lesson-title">Collateralization Ratios and Health Factors</div>
            <div className="al101-lesson-meta"><span>10 min read</span><span>Risk Management</span></div>
          </div>
          <div className="al101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="al101-lesson-content">
          <div className="al101-lesson-body">
            <h3>Understanding the Collateralization Ratio</h3>
            <p>
              The <strong>collateralization ratio</strong> is the single most important number for vault owners. It's calculated as: <strong>(Collateral Value / Debt) x 100%</strong>. If you have $3,000 of ETH backing $1,500 of ALUD debt, your ratio is 200%. Alluria requires a minimum ratio of <strong>150%</strong> — fall below that, and your vault becomes eligible for liquidation.
            </p>
            <p>
              Your ratio changes constantly because ETH's price is always moving. A ratio of 200% at $2,500 ETH becomes 160% if ETH drops to $2,000, and drops to 120% if ETH falls to $1,500. This is why monitoring your vault is essential, especially during volatile markets.
            </p>

            <h3>The Health Factor</h3>
            <p>
              The <strong>health factor</strong> simplifies the ratio into one easy number: <strong>current ratio / minimum ratio</strong>. A health factor above 1.0 means you're safe. Below 1.0 means liquidation. At exactly 1.0, you're at the threshold. Most DeFi protocols display the health factor prominently because it's the most intuitive way to understand your risk.
            </p>

            <div className="al101-data-block">
              <div className="al101-data-section-label">Health Factor at Different ETH Prices (2 ETH deposited, 2,500 ALUD debt)</div>
              <div className="al101-data-row"><span className="al101-data-label">ETH = $3,000</span><span className="al101-data-value green">Health: 1.60 (240% ratio) \u2014 Very Safe</span></div>
              <div className="al101-data-row"><span className="al101-data-label">ETH = $2,500</span><span className="al101-data-value green">Health: 1.33 (200% ratio) \u2014 Safe</span></div>
              <div className="al101-data-row"><span className="al101-data-label">ETH = $2,000</span><span className="al101-data-value amber">Health: 1.07 (160% ratio) \u2014 Warning</span></div>
              <div className="al101-data-row"><span className="al101-data-label">ETH = $1,875</span><span className="al101-data-value amber">Health: 1.00 (150% ratio) \u2014 Threshold!</span></div>
              <div className="al101-data-row"><span className="al101-data-label">ETH = $1,500</span><span className="al101-data-value red">Health: 0.80 (120% ratio) \u2014 LIQUIDATABLE</span></div>
            </div>

            <h3>Try It: Vault Health Monitor</h3>
            <div className="al101-vault-monitor">
              <div className="al101-vault-monitor-title">Interactive Vault Health Monitor</div>
              <div className="al101-vault-row">
                <div className="al101-vault-input-group">
                  <div className="al101-vault-input-label">ETH Price (USD)</div>
                  <input type="range" className="al101-vault-slider" min={500} max={5000} step={25} value={ethPrice} onChange={(e) => setEthPrice(Number(e.target.value))} />
                  <div className="al101-vault-value">${ethPrice.toLocaleString()}</div>
                </div>
                <div className="al101-vault-input-group">
                  <div className="al101-vault-input-label">Vault Info</div>
                  <div className="al101-vault-value" style={{ fontSize: "0.75rem", color: "var(--tx-muted)" }}>
                    {ethDeposited} ETH deposited | {aludDebt.toLocaleString()} ALUD debt
                  </div>
                </div>
              </div>
              <div className={`al101-vault-gauge ${getHealthStatus()}`}>
                <div className={`al101-vault-gauge-value ${getHealthStatus()}`}>{healthFactor.toFixed(2)}</div>
                <div className="al101-vault-gauge-label">Health Factor (Collateral: ${collateralValue.toLocaleString()} | Ratio: {collateralizationRatio.toFixed(0)}%)</div>
                <div className={`al101-vault-gauge-status ${getHealthStatus()}`}>{getHealthLabel()}</div>
              </div>
              {isLiquidatable && (
                <div className="al101-vault-liquidation">
                  <div className="al101-vault-liquidation-title">Vault Liquidated!</div>
                  <div className="al101-vault-liquidation-detail">Liquidation penalty: {(liquidationPenalty * 100).toFixed(0)}%</div>
                  <div className="al101-vault-liquidation-detail">Debt repaid: {aludDebt.toLocaleString()} ALUD</div>
                  <div className="al101-vault-liquidation-detail">Penalty cost: ${(aludDebt * liquidationPenalty).toFixed(0)}</div>
                  <div className="al101-vault-liquidation-detail" style={{ color: remainingAfterLiquidation > 0 ? "var(--al-green)" : "var(--al-red)" }}>
                    Remaining to owner: ${Math.max(0, remainingAfterLiquidation).toFixed(0)}
                  </div>
                </div>
              )}
              <div style={{ textAlign: "center", marginTop: 8, fontSize: "0.75rem", color: "var(--tx-muted)" }}>
                Liquidation price: ${liquidationPrice.toFixed(0)} per ETH
              </div>
            </div>

            <div className="al101-info-box amber">
              <div className="al101-info-box-label">Monitoring Your Vault</div>
              <p>
                In volatile markets, ETH can drop 20-30% in a single day. If your vault is at 180% collateralization, a 20% drop brings you to 144% — below the liquidation threshold. <strong>Always maintain a buffer</strong>. Set price alerts, consider using automated vault management tools, and keep spare ETH ready to add collateral if needed. The best vaults are those you never have to worry about.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`al101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — The Liquidation Mechanism
          ============================================================ */}
      <div className={`al101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="al101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="al101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="al101-lesson-header-text">
            <div className="al101-lesson-title">The Liquidation Mechanism</div>
            <div className="al101-lesson-meta"><span>10 min read</span><span>System Security</span></div>
          </div>
          <div className="al101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="al101-lesson-content">
          <div className="al101-lesson-body">
            <h3>Why Liquidations Exist</h3>
            <p>
              Liquidation is the <strong>immune system</strong> of the Alluria protocol. Every ALUD in circulation must be backed by collateral. If a vault's collateral value drops to the point where it no longer adequately covers the debt, that vault becomes a threat to the entire system — it's an undercollateralized loan that could leave ALUD holders with less-than-$1 backing. Liquidation resolves this by closing out risky vaults before they become insolvent.
            </p>
            <p>
              The process is <strong>permissionless</strong> — anyone can trigger a liquidation on any undercollateralized vault. There's no waiting period, no appeals, and no human decision-making. The smart contract checks: is the collateral ratio below 150%? If yes, the vault can be liquidated. This immediacy is crucial because prices can move fast, and delayed liquidations could leave the system underwater.
            </p>

            <h3>The Liquidation Process Step-by-Step</h3>
            <div className="al101-timeline">
              <div className="al101-timeline-item safe">
                <div className="al101-timeline-date">Step 1: Price Drops</div>
                <div className="al101-timeline-text">ETH price falls, causing the vault's collateralization ratio to drop <strong>below 150%</strong>. The vault is now eligible for liquidation.</div>
              </div>
              <div className="al101-timeline-item warning">
                <div className="al101-timeline-date">Step 2: Liquidator Detects</div>
                <div className="al101-timeline-text">A liquidator (bot or user) detects the undercollateralized vault by monitoring on-chain data. They prepare a <strong>liquidation transaction</strong>.</div>
              </div>
              <div className="al101-timeline-item warning">
                <div className="al101-timeline-date">Step 3: Debt Repayment</div>
                <div className="al101-timeline-text">The liquidator sends ALUD to the protocol to <strong>repay the vault's debt</strong>. The smart contract verifies the vault is truly undercollateralized.</div>
              </div>
              <div className="al101-timeline-item danger">
                <div className="al101-timeline-date">Step 4: Collateral Seizure</div>
                <div className="al101-timeline-text">The protocol transfers the vault's ETH collateral to the liquidator, <strong>including a liquidation bonus</strong> (typically 10%) as reward.</div>
              </div>
              <div className="al101-timeline-item">
                <div className="al101-timeline-date">Step 5: Vault Closed</div>
                <div className="al101-timeline-text">The vault is closed. Any <strong>remaining collateral</strong> (after debt + penalty) is returned to the original vault owner.</div>
              </div>
            </div>

            <div className="al101-data-block">
              <div className="al101-data-section-label">Liquidation Example</div>
              <div className="al101-data-row"><span className="al101-data-label">Vault collateral</span><span className="al101-data-value">2 ETH @ $1,400 = $2,800</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Vault debt</span><span className="al101-data-value">2,000 ALUD</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Collateral ratio</span><span className="al101-data-value red">140% (below 150% min)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Liquidator repays</span><span className="al101-data-value">2,000 ALUD</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Liquidation bonus</span><span className="al101-data-value green">10% = $200 extra</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Liquidator receives</span><span className="al101-data-value green">$2,200 of ETH (1.571 ETH)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Vault owner keeps</span><span className="al101-data-value amber">$600 of ETH (0.429 ETH)</span></div>
            </div>

            <div className="al101-info-box green">
              <div className="al101-info-box-label">Why Liquidations Are Healthy</div>
              <p>
                Liquidations might seem harsh, but they're essential for <strong>system health</strong>. Without them, undercollateralized vaults would accumulate, ALUD would lose its $1 backing, and the entire protocol would become insolvent. Every liquidation strengthens the system by removing risk and ensuring that every remaining ALUD is properly backed. Think of it as the protocol's self-healing mechanism.
              </p>
            </div>

            <div className="al101-info-box orange">
              <div className="al101-info-box-label">Avoiding Liquidation</div>
              <p>
                The best way to avoid liquidation is to <strong>never be close to the minimum ratio</strong>. Keep your collateralization at 200%+ in normal markets and 250%+ during volatile periods. You can always add more ETH collateral or repay some ALUD debt to improve your ratio. Many users set up automated alerts at 180% and 160% to give themselves time to act.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`al101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — ALUD: Oeconomia's Native Stablecoin
          ============================================================ */}
      <div className={`al101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="al101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="al101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="al101-lesson-header-text">
            <div className="al101-lesson-title">ALUD: Oeconomia's Native Stablecoin</div>
            <div className="al101-lesson-meta"><span>8 min read</span><span>Stablecoins</span></div>
          </div>
          <div className="al101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="al101-lesson-content">
          <div className="al101-lesson-body">
            <h3>What Makes ALUD Special</h3>
            <p>
              <strong>ALUD</strong> (Alluria Dollar) is Oeconomia's native stablecoin, pegged to $1 USD. Unlike centralized stablecoins like USDT or USDC that are backed by bank deposits and financial instruments, ALUD is <strong>crypto-backed</strong> — every ALUD in existence is backed by overcollateralized cryptocurrency locked in Alluria vaults. No bank accounts, no corporate custodians, no regulatory freeze risk.
            </p>
            <p>
              The design philosophy behind ALUD is <strong>trustlessness</strong>. You don't need to trust that a company has enough dollars in a bank vault — you can verify on the blockchain that every ALUD is backed by more than $1 of collateral. The collateral is locked in smart contracts that anyone can audit, and the minting/burning process is fully transparent and automatic.
            </p>
            <p>
              ALUD can be used throughout the Oeconomia ecosystem: as a trading pair on Eloqura, as a payment currency on Artivya, and as a stable store of value for users who want to exit volatile positions without leaving the protocol. It's the <strong>connective tissue</strong> of the Oeconomia economy.
            </p>

            <h3>Stablecoin Comparison</h3>
            <div className="al101-compare-grid">
              <div className="al101-compare-card">
                <h4>USDT (Tether)</h4>
                <ul>
                  <li>Backing: Fiat reserves + commercial paper</li>
                  <li>Type: Centralized, custodial</li>
                  <li>Risk: Counterparty, regulatory freeze</li>
                  <li>Transparency: Periodic attestations</li>
                  <li>Market cap: ~$80B+</li>
                </ul>
              </div>
              <div className="al101-compare-card">
                <h4>USDC (Circle)</h4>
                <ul>
                  <li>Backing: US Treasuries + bank deposits</li>
                  <li>Type: Centralized, regulated</li>
                  <li>Risk: Bank failure, regulatory compliance</li>
                  <li>Transparency: Monthly audits</li>
                  <li>Market cap: ~$25B+</li>
                </ul>
              </div>
              <div className="al101-compare-card">
                <h4>DAI (MakerDAO)</h4>
                <ul>
                  <li>Backing: Crypto collateral (multi-collateral)</li>
                  <li>Type: Decentralized, trustless</li>
                  <li>Risk: Smart contract, oracle failure</li>
                  <li>Transparency: Fully on-chain verifiable</li>
                  <li>Market cap: ~$5B+</li>
                </ul>
              </div>
              <div className="al101-compare-card">
                <h4>ALUD (Alluria)</h4>
                <ul>
                  <li>Backing: ETH collateral in Alluria vaults</li>
                  <li>Type: Decentralized, Oeconomia-native</li>
                  <li>Risk: Smart contract, ETH price volatility</li>
                  <li>Transparency: Fully on-chain verifiable</li>
                  <li>Ecosystem: Deep integration with Oeconomia</li>
                </ul>
              </div>
            </div>

            <div className="al101-info-box purple">
              <div className="al101-info-box-label">Peg Stability Mechanisms</div>
              <p>
                ALUD maintains its $1 peg through <strong>arbitrage incentives</strong>. If ALUD trades above $1 on Eloqura, anyone can mint new ALUD (by opening a vault) and sell it for a profit, pushing the price back down. If ALUD trades below $1, vault owners are incentivized to buy cheap ALUD to repay their debt at a discount, pushing the price back up. These natural market forces, combined with the stability pool, keep ALUD tightly pegged.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`al101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Stability Pool and Liquidation Rewards
          ============================================================ */}
      <div className={`al101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="al101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="al101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="al101-lesson-header-text">
            <div className="al101-lesson-title">Stability Pool and Liquidation Rewards</div>
            <div className="al101-lesson-meta"><span>8 min read</span><span>Advanced</span></div>
          </div>
          <div className="al101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="al101-lesson-content">
          <div className="al101-lesson-body">
            <h3>The System's Safety Net</h3>
            <p>
              The <strong>Stability Pool</strong> is a pool of ALUD deposited by users who want to earn liquidation rewards. When a vault is liquidated, instead of requiring an individual liquidator to come forward with ALUD, the stability pool automatically provides the ALUD needed to repay the vault's debt. In return, stability pool depositors receive the liquidated collateral at a discount.
            </p>
            <p>
              This creates a <strong>self-healing system</strong>. Liquidations happen instantly because the ALUD is always available in the pool. Depositors earn a profit on every liquidation (typically 10-15% discount on the collateral). And the protocol remains solvent because undercollateralized debt is immediately resolved. Everyone wins — except the vault owner who got liquidated.
            </p>
            <p>
              The stability pool is the <strong>first line of defense</strong>. If the pool has enough ALUD to cover a liquidation, it absorbs it automatically. If the pool is depleted (extremely rare), the protocol falls back to individual liquidators who must provide their own ALUD. This tiered approach ensures liquidations always succeed.
            </p>

            <div className="al101-stats-row">
              <div className="al101-stat-card"><div className="al101-stat-value">$2.5M</div><div className="al101-stat-label">Stability Pool Size</div></div>
              <div className="al101-stat-card"><div className="al101-stat-value">~12%</div><div className="al101-stat-label">Avg Annual Reward Rate</div></div>
              <div className="al101-stat-card"><div className="al101-stat-value">847</div><div className="al101-stat-label">Liquidations Absorbed</div></div>
            </div>

            <h3>How Stability Pool Rewards Work</h3>
            <div className="al101-data-block">
              <div className="al101-data-section-label">Stability Pool Reward Calculation</div>
              <div className="al101-data-row"><span className="al101-data-label">You deposit</span><span className="al101-data-value">10,000 ALUD into the stability pool</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Total pool size</span><span className="al101-data-value">100,000 ALUD</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Your share</span><span className="al101-data-value purple">10%</span></div>
              <div className="al101-data-row"><span className="al101-data-label">A vault is liquidated</span><span className="al101-data-value">5,000 ALUD debt, 4 ETH collateral ($1,400 each)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Pool absorbs</span><span className="al101-data-value">5,000 ALUD (your share: 500 ALUD deducted)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Pool receives</span><span className="al101-data-value green">4 ETH ($5,600 value at $1,400)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Your ETH received</span><span className="al101-data-value green">0.4 ETH ($560 value)</span></div>
              <div className="al101-data-row"><span className="al101-data-label">Your net profit</span><span className="al101-data-value green">$560 - $500 = $60 (12% instant return)</span></div>
            </div>

            <div className="al101-info-box green">
              <div className="al101-info-box-label">Self-Healing System</div>
              <p>
                The beauty of the stability pool design is that it creates a <strong>self-reinforcing cycle</strong>. Higher rewards attract more depositors, which makes the pool larger, which ensures liquidations are always processed instantly, which keeps the system solvent, which makes ALUD more trustworthy, which attracts more vault users, which creates more potential liquidations, which generates more rewards. It's a virtuous cycle that makes the protocol more robust over time.
              </p>
            </div>

            <div className="al101-info-box cyan">
              <div className="al101-info-box-label">Risk Considerations</div>
              <p>
                Stability pool depositing isn't risk-free. During a <strong>rapid market crash</strong>, you receive ETH that's dropping in value. If ETH keeps falling after you receive the liquidated collateral, your profit could turn into a loss. However, historically the discount from liquidations more than compensates for continued price drops in most scenarios. The key risk is a catastrophic, sustained crash that depletes the pool faster than collateral can recover value.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`al101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
