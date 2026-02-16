// ============================================================
// Consensus Mechanisms — Full Interactive Lesson Content
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import "./consensus.css";

// -- Quiz Data --------------------------------------------------------------

interface QuizData { question: string; options: string[]; correctIndex: number; feedbackCorrect: string; feedbackWrong: string; }

const QUIZZES: QuizData[] = [
  {
    question: 'What is the "Byzantine Generals Problem" in the context of blockchain?',
    options: [
      "A bug in Byzantine-era encryption algorithms",
      "How to reach agreement among distributed participants when some may be dishonest",
      "The challenge of storing data across multiple continents",
      "A method for encrypting military communications",
    ],
    correctIndex: 1,
    feedbackCorrect: "Correct! The Byzantine Generals Problem describes how distributed participants can agree on a single truth when some may be liars or traitors — exactly the challenge blockchain consensus solves.",
    feedbackWrong: "Not quite — it's about reaching agreement among distributed participants when some may be dishonest, which is the fundamental problem all consensus mechanisms address.",
  },
  {
    question: "Why is the energy expenditure in Proof of Work considered a feature, not a bug?",
    options: [
      "It makes transactions process faster",
      "It generates renewable energy for the grid",
      "It makes attacking the network prohibitively expensive",
      "It reduces the total supply of Bitcoin",
    ],
    correctIndex: 2,
    feedbackCorrect: "Correct! The energy cost is the security model — attacking Bitcoin would require more electricity and hardware than any entity could reasonably acquire, making the network practically unbreakable.",
    feedbackWrong: "Not quite — the energy expenditure is what makes attacks prohibitively expensive. An attacker would need to outspend the entire legitimate mining network.",
  },
  {
    question: "What happens to a validator's staked ETH if they act maliciously?",
    options: [
      "It's returned with a warning",
      "It's temporarily frozen for 30 days",
      "It's partially or fully destroyed (slashed)",
      "It's redistributed to all other validators",
    ],
    correctIndex: 2,
    feedbackCorrect: "Correct! Slashing destroys part or all of a malicious validator's stake — this is what makes PoS attacks self-defeating. The attacker loses their own money.",
    feedbackWrong: "Not quite — malicious validators have their staked ETH slashed (partially or fully destroyed), which is the key economic penalty that secures Proof of Stake networks.",
  },
  {
    question: "What is the fundamental difference between PoW and PoS security models?",
    options: [
      "PoW is secure and PoS is not",
      "PoW is backed by physical energy cost; PoS is backed by economic collateral",
      "PoW uses encryption while PoS uses digital signatures",
      "PoS is faster so it's more secure than PoW",
    ],
    correctIndex: 1,
    feedbackCorrect: "Correct! PoW security is grounded in thermodynamics (energy), while PoS security is grounded in game theory (economics). Both are extremely expensive to attack, just through different mechanisms.",
    feedbackWrong: "Not quite — the fundamental difference is that PoW is secured by physical energy expenditure while PoS is secured by economic collateral (staked funds). Both achieve high security through different means.",
  },
  {
    question: "What is the main limitation of Delegated Proof of Stake (DPoS)?",
    options: [
      "It consumes more energy than Proof of Work",
      "It cannot process more than 10 TPS",
      "It concentrates power in a small number of elected delegates",
      "It requires validators to reveal their real-world identity",
    ],
    correctIndex: 2,
    feedbackCorrect: "Correct! DPoS trades decentralization for speed — with only 21-101 delegates, the network is significantly more centralized than PoW or PoS. Voter apathy and whale dominance are persistent issues.",
    feedbackWrong: "Not quite — the main limitation of DPoS is centralization. With only 21-101 elected delegates controlling block production, power becomes concentrated in a small group.",
  },
];

const LESSON_TITLES = [
  "What Consensus Means in a Decentralized Network",
  "Proof of Work: Miners, Hash Power & Energy",
  "Proof of Stake: Validators, Staking & Slashing",
  "Comparing Security, Speed & Decentralization",
  "Emerging Mechanisms: DPoS, PoA & Beyond",
];

// ===========================================================================
// Component
// ===========================================================================

export default function ConsensusContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(() => new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, { selected: number; correct: boolean }>>(() => new Map());

  // PoW Mining Race state
  const [powRunning, setPowRunning] = useState(false);
  const [powBars, setPowBars] = useState<{ height: number; state: "idle" | "active" | "winner" }[]>(
    () => Array.from({ length: 20 }, () => ({ height: 32, state: "idle" }))
  );
  const [powHashes, setPowHashes] = useState(0);
  const [powResult, setPowResult] = useState("");
  const powInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const powProgress = useRef<number[]>(new Array(20).fill(0));

  // Slashing demo state
  const [validators, setValidators] = useState<("normal" | "slashed" | "honest")[]>(
    () => Array(8).fill("normal")
  );
  const [slashStatus, setSlashStatus] = useState<null | { type: "alert" | "safe"; text: string }>(null);
  const [isSlashed, setIsSlashed] = useState(false);

  // Cleanup
  useEffect(() => {
    return () => { if (powInterval.current) clearInterval(powInterval.current); };
  }, []);

  // -- Accordion / progress -------------------------------------------------

  const toggleLesson = (idx: number) => setActiveLesson((p) => (p === idx ? null : idx));

  const markComplete = (idx: number) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
    if (!completedLessons.has(idx) && idx < 4) setActiveLesson(idx + 1);
  };

  // -- Quiz -----------------------------------------------------------------

  const answerQuiz = (li: number, si: number) => {
    if (quizAnswers.has(li)) return;
    setQuizAnswers((p) => { const n = new Map(p); n.set(li, { selected: si, correct: si === QUIZZES[li].correctIndex }); return n; });
  };

  const renderQuiz = (li: number) => {
    const q = QUIZZES[li]; const a = quizAnswers.get(li); const L = ["A","B","C","D"];
    return (
      <div className="cm101-quiz">
        <div className="cm101-quiz-label">Check Your Understanding</div>
        <div className="cm101-quiz-question">{q.question}</div>
        <div className="cm101-quiz-options">
          {q.options.map((o, i) => {
            let c = "cm101-quiz-option";
            if (a) { c += " disabled"; if (i === q.correctIndex) c += " correct"; else if (i === a.selected && !a.correct) c += " wrong"; }
            return <button key={i} className={c} onClick={() => answerQuiz(li, i)} disabled={!!a}><span className="option-letter">{L[i]}</span><span>{o}</span></button>;
          })}
        </div>
        {a && <div className={`cm101-quiz-feedback ${a.correct ? "correct" : "wrong"}`}>{a.correct ? q.feedbackCorrect : q.feedbackWrong}</div>}
      </div>
    );
  };

  const renderCompleteBtn = (idx: number) => {
    const done = completedLessons.has(idx);
    return (
      <button className={`cm101-complete-btn ${done ? "done" : "incomplete"}`} onClick={() => markComplete(idx)}>
        {done ? (<><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>Completed</>) : (<><svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>Mark Complete</>)}
      </button>
    );
  };

  // -- PoW Mining Race ------------------------------------------------------

  const startPowRace = useCallback(() => {
    if (powInterval.current) return;
    // Reset
    powProgress.current = new Array(20).fill(0);
    setPowBars(Array.from({ length: 20 }, () => ({ height: 32, state: "idle" })));
    setPowHashes(0);
    setPowResult("");
    setPowRunning(true);

    let totalH = 0;

    powInterval.current = setInterval(() => {
      const newBars = [...powProgress.current];
      for (let i = 0; i < 20; i++) {
        const hp = 1 + Math.random() * 3;
        newBars[i] += hp;
        totalH += Math.floor(hp * 100);
      }
      powProgress.current = newBars;
      setPowHashes(totalH);
      setPowBars(newBars.map((p) => ({ height: Math.min(32 + p * 2, 80), state: "active" as const })));

      if (totalH > 5000 && Math.random() < 0.08) {
        clearInterval(powInterval.current!);
        powInterval.current = null;
        // Pick winner weighted by progress
        const total = newBars.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let winner = 0;
        for (let i = 0; i < 20; i++) { r -= newBars[i]; if (r <= 0) { winner = i; break; } }
        setPowBars((prev) => prev.map((b, i) => i === winner ? { height: 80, state: "winner" } : b));
        setPowResult(`Miner #${winner + 1} found a valid hash after ${totalH.toLocaleString()} attempts and wins the block reward!`);
        setPowRunning(false);
      }
    }, 50);
  }, []);

  // -- Slashing Demo --------------------------------------------------------

  const simulateSlashing = () => {
    if (isSlashed) return;
    setIsSlashed(true);
    const badIdx = Math.floor(Math.random() * 8);

    setTimeout(() => {
      setValidators((prev) => prev.map((v, i) => (i === badIdx ? "slashed" : v)));
    }, 200);

    setTimeout(() => {
      setValidators((prev) => prev.map((v, i) => (i === badIdx ? "slashed" : "honest")));
    }, 600);

    setTimeout(() => {
      setSlashStatus({
        type: "alert",
        text: `Validator V${badIdx + 1} attempted to propose conflicting blocks. 16 ETH slashed (50% of stake) and ejected from the active set. Honest validators continue earning rewards.`,
      });
    }, 800);
  };

  const resetSlashing = () => {
    setIsSlashed(false);
    setValidators(Array(8).fill("normal"));
    setSlashStatus({ type: "safe", text: "Validator set restored \u2014 all validators active with 32 ETH staked." });
    setTimeout(() => setSlashStatus(null), 3000);
  };

  // -- Lesson content -------------------------------------------------------

  const renderLessonContent = (idx: number) => {
    switch (idx) {
      // =====================================================================
      // Lesson 1: What Consensus Means
      // =====================================================================
      case 0:
        return (
          <div className="cm101-lesson-body">
            <h3>The Core Problem</h3>
            <p>Imagine ten strangers in different countries, none of whom trust each other, who need to agree on a shared list of financial transactions. There's no referee, no judge, no central authority. Some of them might be liars. Some might try to cheat. How do you get them all to agree on the same version of truth?</p>
            <p>This is the <strong>consensus problem</strong> — and it's the single hardest challenge in building a decentralized system. Every blockchain solves it, but they each take a different approach.</p>

            <h3>Why It Matters</h3>
            <p>In a centralized system (like your bank), consensus is trivial: the bank's server is the authority. Whatever it says your balance is, that's your balance. But centralization creates a single point of failure and requires trust. Blockchain eliminates both — at the cost of needing a mechanism for thousands of independent computers to reach agreement without a leader.</p>

            <div className="cm101-info-box green">
              <div className="cm101-info-box-title">The Byzantine Generals Problem</div>
              Computer scientists have studied this challenge since the 1980s. It's formally known as the <strong>Byzantine Generals Problem</strong>: how can a group of generals, some of whom may be traitors, coordinate an attack without a central commander? Bitcoin was the first system to solve this in a real-world, open, adversarial network — a genuine computer science breakthrough.
            </div>

            <h3>What a Consensus Mechanism Does</h3>
            <div className="cm101-three-col">
              <div className="cm101-col-card"><h4>1. Selects a Leader</h4><p>Determines which node proposes the next block. Different mechanisms use hash power, stake, reputation, or randomness as selection criteria.</p></div>
              <div className="cm101-col-card"><h4>2. Validates Truth</h4><p>Ensures every transaction in the proposed block follows the rules. Invalid transactions are rejected. The network only accepts clean blocks.</p></div>
              <div className="cm101-col-card"><h4>3. Achieves Finality</h4><p>Gets all honest participants to agree this block is permanent. Once consensus is reached, the block is effectively irreversible.</p></div>
            </div>

            <h3>The Trilemma</h3>
            <p>Every consensus mechanism navigates the <strong>blockchain trilemma</strong> — you can optimize for only two of three properties at the expense of the third:</p>
            <div className="cm101-stats-row">
              <div className="cm101-stat"><div className="cm101-stat-value">Security</div><div className="cm101-stat-label">Resistance to attacks</div></div>
              <div className="cm101-stat"><div className="cm101-stat-value">Speed</div><div className="cm101-stat-label">Throughput & finality</div></div>
              <div className="cm101-stat"><div className="cm101-stat-value">Decentral.</div><div className="cm101-stat-label">Number of participants</div></div>
            </div>
            <p>Bitcoin prioritizes security and decentralization (at the cost of speed). Solana prioritizes security and speed (at the cost of some decentralization). There is no perfect solution — only tradeoffs.</p>

            <div className="cm101-info-box green">
              <div className="cm101-info-box-title">The Bottom Line</div>
              A consensus mechanism is the <strong>set of rules</strong> that determines how a decentralized network agrees on the current state of the ledger. Without it, there's no blockchain — just a collection of computers with conflicting databases.
            </div>

            {renderQuiz(0)}
            {renderCompleteBtn(0)}
          </div>
        );

      // =====================================================================
      // Lesson 2: Proof of Work
      // =====================================================================
      case 1:
        return (
          <div className="cm101-lesson-body">
            <h3>The Original Mechanism</h3>
            <p><strong>Proof of Work (PoW)</strong> is the consensus mechanism Bitcoin introduced in 2009. The core idea: to earn the right to add a block, you must prove you've expended computational effort (work). This work is costly to perform but trivially easy for everyone else to verify.</p>

            <h3>How It Works</h3>
            <div className="cm101-timeline">
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 1: Compete</div><div className="cm101-timeline-text">Miners race to solve a cryptographic puzzle — repeatedly hashing block data with different nonce values, searching for a hash below the <strong>difficulty target</strong>.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 2: Spend Energy</div><div className="cm101-timeline-text">This search is pure brute force. Miners run specialized hardware (ASICs) consuming <strong>massive electricity</strong>. The energy expenditure is the "proof" that real-world resources were spent.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 3: Win the Lottery</div><div className="cm101-timeline-text">The first miner to find a valid hash <strong>broadcasts the block</strong>. More hash power = more lottery tickets, but even a small miner could win any given round.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 4: Verify Instantly</div><div className="cm101-timeline-text">Other nodes verify the winning hash in <strong>milliseconds</strong>. This asymmetry — hard to find, easy to verify — is the elegance of PoW.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 5: Get Paid</div><div className="cm101-timeline-text">The winner receives the <strong>block reward</strong> (currently 3.125 BTC) plus all transaction fees. This incentive motivates miners to spend electricity securing the network.</div></div>
            </div>

            <h3>Try It: PoW Mining Race</h3>
            <div className="cm101-sim">
              <div className="cm101-sim-label">20 Miners Competing for the Next Block</div>
              <div className="cm101-sim-bars">
                {powBars.map((bar, i) => (
                  <div
                    key={i}
                    className={`cm101-sim-bar ${bar.state === "active" ? "active" : ""} ${bar.state === "winner" ? "winner" : ""}`}
                    style={{ height: `${bar.height}px` }}
                  />
                ))}
              </div>
              <div className="cm101-sim-big pow">{powHashes.toLocaleString()}</div>
              <div className="cm101-sim-label">total hashes attempted</div>
              <button className="cm101-sim-btn pow" onClick={startPowRace} disabled={powRunning}>
                {powRunning ? "Racing..." : powResult ? "Race Again" : "Start Mining Race"}
              </button>
              {powResult && <div className="cm101-sim-result" style={{ color: "var(--cm-green)" }}>{powResult}</div>}
            </div>

            <h3>The Energy Debate</h3>
            <div className="cm101-compare-grid">
              <div className="cm101-compare-card pow-card"><h4>Critics Say</h4><ul><li>Uses more energy than many countries</li><li>Carbon footprint concerns</li><li>Same security achievable with less energy (PoS)</li><li>Energy could serve other purposes</li></ul></div>
              <div className="cm101-compare-card"><h4>Proponents Say</h4><ul><li>Energy is what makes the network physically secure</li><li>Increasingly powered by renewables (~60%+)</li><li>Monetizes stranded/wasted energy</li><li>Security cost justified for a $2T+ asset</li></ul></div>
            </div>

            <div className="cm101-info-box pow">
              <div className="cm101-info-box-title">The 51% Attack</div>
              To compromise a PoW network, an attacker needs <strong>more than 50% of all mining power</strong>. For Bitcoin, this would cost billions in hardware and electricity — making it economically irrational. The attack would cost more than any gain, and the attacker's own holdings would crash.
            </div>

            <div className="cm101-data-block">
              <div className="cm101-data-block-header">Bitcoin PoW Stats</div>
              <div className="cm101-data-row"><span className="cm101-data-label">Network Hash Rate</span><span className="cm101-data-value orange">~800+ EH/s</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Block Time</span><span className="cm101-data-value">~10 minutes</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Difficulty Adjustment</span><span className="cm101-data-value">Every 2,016 blocks (~2 weeks)</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Block Reward</span><span className="cm101-data-value orange">3.125 BTC + fees</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Est. 51% Attack Cost</span><span className="cm101-data-value green">$10+ billion (hardware alone)</span></div>
            </div>

            {renderQuiz(1)}
            {renderCompleteBtn(1)}
          </div>
        );

      // =====================================================================
      // Lesson 3: Proof of Stake
      // =====================================================================
      case 2:
        return (
          <div className="cm101-lesson-body">
            <h3>A Different Kind of Security</h3>
            <p><strong>Proof of Stake (PoS)</strong> replaces energy expenditure with economic stake. Instead of miners competing with computing power, <strong>validators</strong> lock up their own cryptocurrency as collateral. The protocol randomly selects a validator to propose the next block, weighted by how much they've staked. Honest behavior earns rewards. Cheating loses your stake.</p>
            <p>The key insight: you don't need to burn electricity to make attacks expensive. You just need to make cheaters lose their own money.</p>

            <h3>How It Works</h3>
            <div className="cm101-timeline">
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 1: Stake</div><div className="cm101-timeline-text">Validators deposit crypto into a staking contract. On Ethereum, the minimum is <strong>32 ETH</strong> (~$80,000+). This deposit acts as collateral — skin in the game.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 2: Selection</div><div className="cm101-timeline-text">The protocol uses a <strong>pseudo-random algorithm</strong> to select a validator. More stake = higher chance, but randomness prevents predictability.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 3: Propose & Attest</div><div className="cm101-timeline-text">The selected validator proposes a block. Other validators <strong>attest</strong> (vote) it's valid. A block needs a <strong>2/3 supermajority</strong> of attestations to finalize.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 4: Earn Rewards</div><div className="cm101-timeline-text">Honest validators earn <strong>staking rewards</strong> — new ETH issuance plus transaction fees. Ethereum currently yields roughly <strong>3-5% APY</strong>.</div></div>
              <div className="cm101-timeline-item"><div className="cm101-timeline-date">Step 5: Slashing</div><div className="cm101-timeline-text">Malicious validators have staked ETH <strong>destroyed (slashed)</strong>. Severe offenses mean losing the entire 32 ETH and ejection from the validator set.</div></div>
            </div>

            <h3>Slashing Demonstration</h3>
            <div className="cm101-slash-demo">
              <div className="cm101-sim-label">Validator Set — 8 Validators, 32 ETH Each</div>
              <div className="cm101-validators">
                {validators.map((state, i) => (
                  <div key={i} className={`cm101-validator ${state}`}>
                    <span className="v-label">{state === "slashed" ? "\u26A0 " : ""}V{i + 1}</span>
                    <span className="v-stake">32 ETH</span>
                  </div>
                ))}
              </div>
              {!isSlashed ? (
                <button className="cm101-action-btn slash" onClick={simulateSlashing}>Simulate Malicious Validator</button>
              ) : (
                <button className="cm101-action-btn reset" onClick={resetSlashing}>Reset</button>
              )}
              {slashStatus && (
                <div className={`cm101-status-msg ${slashStatus.type}`}>
                  {slashStatus.type === "alert" ? "\u26A0 " : "\u2713 "}{slashStatus.text}
                </div>
              )}
            </div>

            <h3>Ethereum's Transition: The Merge</h3>
            <p>Ethereum ran Proof of Work from 2015 until September 15, 2022, when <strong>"The Merge"</strong> switched it to Proof of Stake — one of the most significant events in blockchain history, reducing energy consumption by approximately <strong>99.95%</strong>.</p>
            <div className="cm101-stats-row">
              <div className="cm101-stat"><div className="cm101-stat-value">99.95%</div><div className="cm101-stat-label">Energy reduction</div></div>
              <div className="cm101-stat"><div className="cm101-stat-value">~1M</div><div className="cm101-stat-label">Active validators</div></div>
              <div className="cm101-stat"><div className="cm101-stat-value">32 ETH</div><div className="cm101-stat-label">Minimum stake</div></div>
            </div>

            <div className="cm101-info-box pos">
              <div className="cm101-info-box-title">Economic Security</div>
              To attack Ethereum's PoS, you'd need <strong>&gt;33% of all staked ETH</strong> (currently $30+ billion). Unlike PoW where attack hardware retains value, a PoS attacker's stake gets <strong>slashed</strong> — the attack destroys the attacker's own assets.
            </div>

            <div className="cm101-info-box cyan">
              <div className="cm101-info-box-title">Oeconomia Connection</div>
              The Oeconomia ecosystem uses a PoS-inspired model through <strong>Guardian staking</strong>. Guardians stake OEC tokens to participate in governance and earn rewards — the same principle of aligning incentives through economic skin in the game.
            </div>

            {renderQuiz(2)}
            {renderCompleteBtn(2)}
          </div>
        );

      // =====================================================================
      // Lesson 4: Comparing PoW vs PoS
      // =====================================================================
      case 3:
        return (
          <div className="cm101-lesson-body">
            <h3>Head to Head</h3>
            <p>The PoW vs PoS debate is one of the most heated in crypto. Both mechanisms achieve decentralized consensus, but their tradeoffs create fundamentally different networks. Neither is universally "better" — the right choice depends on what you're optimizing for.</p>

            <div className="cm101-compare-grid">
              <div className="cm101-compare-card pow-card"><h4>Proof of Work</h4><ul>
                <li>Security backed by physical energy</li><li>15+ year track record (Bitcoin)</li><li>Simple and battle-tested</li><li>High energy consumption</li><li>Slow finality (~60 min for BTC)</li><li>Hardware = barrier to entry</li><li>Miners can switch chains freely</li><li>No identity needed (censorship resistant)</li>
              </ul></div>
              <div className="cm101-compare-card pos-card"><h4>Proof of Stake</h4><ul>
                <li>Security backed by economic collateral</li><li>Growing track record (ETH since 2022)</li><li>More complex, additional attack vectors</li><li>99.95% less energy</li><li>Faster finality (~12 min for ETH)</li><li>Capital = barrier to entry</li><li>Validators locked in (slashing risk)</li><li>Potential for stake centralization</li>
              </ul></div>
            </div>

            <h3>The Full Comparison</h3>
            <div className="cm101-data-block">
              <div className="cm101-data-block-header">Side-by-Side Metrics</div>
              <div className="cm101-data-row"><span className="cm101-data-label">Security Model</span><span className="cm101-data-value"><span style={{ color: "var(--cm-pow)" }}>PoW: Physics</span> | <span style={{ color: "var(--cm-pos)" }}>PoS: Economics</span></span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Energy Efficiency</span><span className="cm101-data-value purple">PoS wins — 99.95% less energy</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Throughput (TPS)</span><span className="cm101-data-value purple">PoS wins — higher capacity</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Time to Finality</span><span className="cm101-data-value purple">PoS wins — minutes vs. hours</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Proven Track Record</span><span className="cm101-data-value orange">PoW wins — 15+ years unhacked</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Simplicity</span><span className="cm101-data-value orange">PoW wins — fewer attack vectors</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Cost to Attack (51%)</span><span className="cm101-data-value">Both extremely high — $10B+</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Wealth Concentration Risk</span><span className="cm101-data-value red">Both have concerns</span></div>
            </div>

            <h3>Security: Different Threat Models</h3>
            <p><strong>PoW security is physical.</strong> An attacker needs actual hardware and electricity — resources that exist in the real world, are difficult to acquire secretly, and can't be reused after an attack. The security is grounded in thermodynamics.</p>
            <p><strong>PoS security is economic.</strong> An attacker needs to buy and stake massive amounts of cryptocurrency. The act of buying drives the price up (making the attack more expensive), and a failed attack means losing the stake. The security is grounded in game theory.</p>

            <div className="cm101-info-box orange">
              <div className="cm101-info-box-title">PoW: Mining Pool Centralization</div>
              PoW miners invest in hardware that only works for one chain. If they attack, they can't easily repurpose that equipment. However, large mining pools create centralization risk — the top 3-4 pools often control &gt;51% of hash rate, though they're economically incentivized not to attack.
            </div>

            <div className="cm101-info-box pos">
              <div className="cm101-info-box-title">PoS: Long-Range Attacks</div>
              In PoS, old validators who've withdrawn their stake could theoretically create an alternative history from a point where they still had stake. Ethereum addresses this through <strong>weak subjectivity checkpoints</strong> — nodes periodically confirm which chain is canonical, preventing rewrites older than ~2 weeks.
            </div>

            <h3>Decentralization</h3>
            <p>Both mechanisms face centralization pressures. In PoW, economies of scale favor large mining operations with cheap electricity. In PoS, wealthy stakers earn more rewards and can compound their stake over time. The difference is that PoS allows <strong>liquid staking</strong> and <strong>delegation</strong>, enabling small holders to participate through pools.</p>

            <div className="cm101-info-box green">
              <div className="cm101-info-box-title">The Pragmatic View</div>
              Most of the blockchain industry has moved toward PoS or PoS-derived mechanisms. Bitcoin remains the notable exception — its community believes PoW's physical security model and proven track record make it the best choice for a monetary base layer. Both positions have merit, and both networks continue to secure hundreds of billions in value.
            </div>

            {renderQuiz(3)}
            {renderCompleteBtn(3)}
          </div>
        );

      // =====================================================================
      // Lesson 5: Emerging Mechanisms
      // =====================================================================
      case 4:
        return (
          <div className="cm101-lesson-body">
            <h3>Beyond PoW and PoS</h3>
            <p>Proof of Work and Proof of Stake are the two dominant mechanisms, but they're not the only ones. As blockchain technology matures, developers have created <strong>hybrid and alternative approaches</strong> that optimize for specific use cases — higher throughput, lower latency, enterprise compliance, or novel security models.</p>

            <div className="cm101-mech-card">
              <div className="cm101-mech-header">
                <div className="cm101-mech-icon dpos">&#x1F5F3;</div>
                <div><div className="cm101-mech-name">Delegated Proof of Stake (DPoS)</div><div className="cm101-mech-full">Used by: EOS, Tron, Lisk, BitShares</div></div>
              </div>
              <div className="cm101-mech-body">
                <p>Instead of all token holders validating directly, they <strong>vote to elect a small set of delegates</strong> (typically 21-101) who take turns producing blocks. Think of it like a representative democracy.</p>
                <p><strong>Advantage:</strong> Extremely fast block times (0.5-2 seconds) and high throughput because only a small, known set of validators needs to coordinate.</p>
                <p><strong>Tradeoff:</strong> Significantly more centralized. With only 21 block producers, the network is controlled by a small group. Voter apathy and vote-buying are persistent problems.</p>
              </div>
              <div className="cm101-mech-stats"><span className="cm101-mech-stat">~1s blocks</span><span className="cm101-mech-stat">21-101 delegates</span><span className="cm101-mech-stat">1,000+ TPS</span></div>
            </div>

            <div className="cm101-mech-card">
              <div className="cm101-mech-header">
                <div className="cm101-mech-icon poa">&#x1F3E2;</div>
                <div><div className="cm101-mech-name">Proof of Authority (PoA)</div><div className="cm101-mech-full">Used by: VeChain, private Ethereum networks, Palm</div></div>
              </div>
              <div className="cm101-mech-body">
                <p>Validators are selected based on their <strong>real-world identity and reputation</strong> rather than stake or computing power. Only approved, known entities can produce blocks.</p>
                <p><strong>Advantage:</strong> Very high performance, near-instant finality, and minimal energy usage. Ideal for enterprise or consortium blockchains.</p>
                <p><strong>Tradeoff:</strong> Not decentralized in the crypto sense. Susceptible to collusion or regulatory pressure.</p>
              </div>
              <div className="cm101-mech-stats"><span className="cm101-mech-stat">Identity-based</span><span className="cm101-mech-stat">Enterprise-grade</span><span className="cm101-mech-stat">Sub-second finality</span></div>
            </div>

            <div className="cm101-mech-card">
              <div className="cm101-mech-header">
                <div className="cm101-mech-icon pbft">&#x1F91D;</div>
                <div><div className="cm101-mech-name">Practical Byzantine Fault Tolerance (pBFT)</div><div className="cm101-mech-full">Used by: Hyperledger Fabric, Zilliqa, NEO</div></div>
              </div>
              <div className="cm101-mech-body">
                <p>Validators go through <strong>multiple rounds of voting</strong> to agree on each block — a pre-prepare, prepare, and commit phase. The system can tolerate up to 1/3 of validators being malicious. Once committed, a transaction is <strong>immediately final</strong>.</p>
                <p><strong>Advantage:</strong> Instant finality — ideal for financial applications where certainty is critical.</p>
                <p><strong>Tradeoff:</strong> Communication overhead grows quadratically with validators, so it doesn't scale well beyond ~100 nodes.</p>
              </div>
              <div className="cm101-mech-stats"><span className="cm101-mech-stat">Instant finality</span><span className="cm101-mech-stat">Tolerates 1/3 faults</span><span className="cm101-mech-stat">Limited to ~100 nodes</span></div>
            </div>

            <div className="cm101-mech-card">
              <div className="cm101-mech-header">
                <div className="cm101-mech-icon poh">&#x23F1;</div>
                <div><div className="cm101-mech-name">Proof of History (PoH)</div><div className="cm101-mech-full">Used by: Solana</div></div>
              </div>
              <div className="cm101-mech-body">
                <p>Not a consensus mechanism on its own, but a <strong>cryptographic clock</strong> that creates a verifiable ordering of events before consensus happens. Solana's leader hashes continuously, creating a sequence that proves time has passed.</p>
                <p><strong>Advantage:</strong> Enables Solana's theoretical throughput of <strong>65,000+ TPS</strong> with 400ms block times.</p>
                <p><strong>Tradeoff:</strong> High hardware requirements create centralization pressure. Solana has experienced multiple network outages.</p>
              </div>
              <div className="cm101-mech-stats"><span className="cm101-mech-stat">Cryptographic clock</span><span className="cm101-mech-stat">400ms blocks</span><span className="cm101-mech-stat">65,000+ TPS (theoretical)</span></div>
            </div>

            <div className="cm101-mech-card">
              <div className="cm101-mech-header">
                <div className="cm101-mech-icon dag">&#x1F578;</div>
                <div><div className="cm101-mech-name">DAG-Based Consensus</div><div className="cm101-mech-full">Used by: IOTA (Tangle), Hedera Hashgraph, Nano</div></div>
              </div>
              <div className="cm101-mech-body">
                <p>These systems abandon the linear chain structure entirely. Transactions form a <strong>Directed Acyclic Graph (DAG)</strong> — a web-like structure where each new transaction validates one or more previous transactions. No miners, no blocks, often no fees.</p>
                <p><strong>Advantage:</strong> Theoretically infinite scalability — more users means more validators, which means faster confirmation.</p>
                <p><strong>Tradeoff:</strong> Newer and less battle-tested. Security guarantees at low network activity can be weaker than chain-based blockchains.</p>
              </div>
              <div className="cm101-mech-stats"><span className="cm101-mech-stat">No blocks or chains</span><span className="cm101-mech-stat">Often feeless</span><span className="cm101-mech-stat">Scales with usage</span></div>
            </div>

            <h3>The Spectrum of Decentralization</h3>
            <p>All consensus mechanisms sit on a spectrum from fully decentralized to fully centralized:</p>
            <div className="cm101-data-block">
              <div className="cm101-data-block-header">Decentralization Spectrum</div>
              <div className="cm101-data-row"><span className="cm101-data-label">Most Decentralized</span><span className="cm101-data-value orange">PoW (Bitcoin) — 15,000+ nodes</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Highly Decentralized</span><span className="cm101-data-value purple">PoS (Ethereum) — ~1M validators</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Moderately Decentralized</span><span className="cm101-data-value cyan">DPoS (EOS) — 21 elected producers</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Semi-Centralized</span><span className="cm101-data-value amber">PoH+PoS (Solana) — high hardware reqs</span></div>
              <div className="cm101-data-row"><span className="cm101-data-label">Centralized Governance</span><span className="cm101-data-value red">PoA / pBFT — permissioned validators</span></div>
            </div>

            <div className="cm101-info-box green">
              <div className="cm101-info-box-title">The Right Tool for the Job</div>
              There's no single "best" consensus mechanism. Bitcoin's PoW is ideal for a decentralized monetary base layer. Ethereum's PoS balances performance with decentralization. DPoS works well for high-throughput social/gaming blockchains. PoA suits enterprise supply chains. The mechanism should match the use case.
            </div>

            {renderQuiz(4)}
            {renderCompleteBtn(4)}
          </div>
        );

      default:
        return null;
    }
  };

  // -- Render ---------------------------------------------------------------

  const completedCount = completedLessons.size;

  return (
    <div className="cm101 space-y-4">
      <div className="cm101-progress">
        <div className="cm101-progress-steps">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className={`cm101-progress-step ${completedLessons.has(i) ? "done" : ""}`} />
          ))}
        </div>
        <div className="cm101-progress-text">{completedCount} of 5 complete</div>
      </div>

      {LESSON_TITLES.map((title, idx) => (
        <div key={idx} className="cm101-lesson">
          <div className="cm101-lesson-header" onClick={() => toggleLesson(idx)}>
            <div className={`cm101-lesson-num ${completedLessons.has(idx) ? "completed" : ""}`}>
              {completedLessons.has(idx) ? (
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : idx + 1}
            </div>
            <div className="cm101-lesson-title">{title}</div>
            <svg className={`cm101-lesson-chevron ${activeLesson === idx ? "open" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {activeLesson === idx && renderLessonContent(idx)}
        </div>
      ))}

      {completedCount === 5 && (
        <div className="cm101-info-box green" style={{ textAlign: "center" }}>
          <div className="cm101-info-box-title">Lesson Complete!</div>
          You've completed all 5 sections of Consensus Mechanisms. You now understand the Byzantine Generals Problem, how PoW and PoS work, their tradeoffs, and emerging alternatives like DPoS, PoA, and DAG-based systems.
        </div>
      )}
    </div>
  );
}
