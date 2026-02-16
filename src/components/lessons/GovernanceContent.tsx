// ============================================================
// Governance & Guardians: Staking for Power — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./governance.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "The Guardian Staking Contract and Tier System", meta: "10 min read \u00B7 Mechanics" },
  { num: 2, title: "Staking Mechanics: Lock Periods and Multipliers", meta: "8 min read \u00B7 Staking" },
  { num: 3, title: "Governance Power: How Votes Are Weighted", meta: "10 min read \u00B7 Voting" },
  { num: 4, title: "Creating and Voting on Proposals", meta: "10 min read \u00B7 Proposals" },
  { num: 5, title: "Guardian Tiers: Initiate, Warden, Sentinel, Archon, Sovereign", meta: "10 min read \u00B7 Tiers" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What do you need to do to become a Guardian?",
    options: [
      { letter: "A", text: "Pass a knowledge test and submit an application", correct: false },
      { letter: "B", text: "Stake OEC tokens and lock them for a chosen time period", correct: true },
      { letter: "C", text: "Be invited by an existing Guardian or DAO member", correct: false },
      { letter: "D", text: "Hold a minimum of 1 million OEC tokens in your wallet", correct: false },
    ],
    correctMsg: "Correct! Anyone can become a Guardian by staking OEC tokens and choosing a lock period \u2014 no application or invitation needed.",
    wrongMsg: "Not quite \u2014 becoming a Guardian requires staking OEC tokens and locking them for a chosen time period.",
  },
  2: {
    question: "How does lock duration affect your governance power?",
    options: [
      { letter: "A", text: "It doesn't \u2014 all lock durations give the same voting weight", correct: false },
      { letter: "B", text: "Longer locks reduce your voting power as a security measure", correct: false },
      { letter: "C", text: "Longer lock periods give higher multipliers, increasing your voting weight", correct: true },
      { letter: "D", text: "Only the 365-day lock gives any governance power at all", correct: false },
    ],
    correctMsg: "Correct! Longer lock periods earn higher multipliers (1x to 3x), directly increasing your governance voting weight.",
    wrongMsg: "Not quite \u2014 longer lock periods give higher multipliers, increasing your voting weight.",
  },
  3: {
    question: "What is a quorum in governance?",
    options: [
      { letter: "A", text: "The maximum number of votes allowed on a single proposal", correct: false },
      { letter: "B", text: "The minimum participation required for a proposal vote to be valid", correct: true },
      { letter: "C", text: "A special veto power held by Sovereign-tier Guardians", correct: false },
      { letter: "D", text: "The time period during which voting is open", correct: false },
    ],
    correctMsg: "Correct! Quorum is the minimum participation threshold \u2014 if not enough Guardians vote, the proposal is invalid regardless of the outcome.",
    wrongMsg: "Not quite \u2014 a quorum is the minimum participation required for a proposal vote to be valid.",
  },
  4: {
    question: "Who can create governance proposals in the Oeconomia DAO?",
    options: [
      { letter: "A", text: "Only the founding team and core developers", correct: false },
      { letter: "B", text: "Any wallet holder, even without staking", correct: false },
      { letter: "C", text: "Any Guardian at Warden tier or above", correct: true },
      { letter: "D", text: "Only Sovereign-tier Guardians with maximum stakes", correct: false },
    ],
    correctMsg: "Correct! Proposal creation requires at least Warden tier (10,000+ OEC staked), ensuring proposers have meaningful commitment.",
    wrongMsg: "Not quite \u2014 any Guardian at Warden tier or above can create governance proposals.",
  },
  5: {
    question: "What is the highest Guardian tier?",
    options: [
      { letter: "A", text: "Archon \u2014 the controller of all protocol parameters", correct: false },
      { letter: "B", text: "Sentinel \u2014 the watchers over the ecosystem", correct: false },
      { letter: "C", text: "Sovereign \u2014 requiring the largest stake and longest lock, with the most governance privileges", correct: true },
      { letter: "D", text: "Warden \u2014 the gatekeepers of governance proposals", correct: false },
    ],
    correctMsg: "Correct! Sovereign is the highest tier, requiring 1,000,000+ OEC staked, with unique privileges including veto power.",
    wrongMsg: "Not quite \u2014 Sovereign is the highest Guardian tier, requiring the largest stake and longest lock with the most privileges.",
  },
};

export default function GovernanceContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Voting Simulator state
  const [userVote, setUserVote] = useState<string | null>(null);
  const [forVotes, setForVotes] = useState(320000);
  const [againstVotes, setAgainstVotes] = useState(145000);
  const [abstainVotes, setAbstainVotes] = useState(35000);
  const userVotingPower = 75000; // Preset: Sentinel tier, 90-day lock (50,000 x 1.5)

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

  const handleVote = useCallback((voteType: string) => {
    if (userVote) return;
    setUserVote(voteType);
    if (voteType === "for") setForVotes((v) => v + userVotingPower);
    else if (voteType === "against") setAgainstVotes((v) => v + userVotingPower);
    else setAbstainVotes((v) => v + userVotingPower);
  }, [userVote]);

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="gg101-quiz-section">
        <div className="gg101-quiz-title">Check Your Understanding</div>
        <div className="gg101-quiz-question">{q.question}</div>
        <div className="gg101-quiz-options">
          {q.options.map((opt) => {
            let cls = "gg101-quiz-option";
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
          <div className={`gg101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  /* ---- Voting Simulator renderer ---- */
  const renderVotingSimulator = () => {
    const totalVotes = forVotes + againstVotes + abstainVotes;
    const quorumTarget = 500000;
    const quorumPct = Math.min((totalVotes / quorumTarget) * 100, 100);
    const forPct = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
    const againstPct = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;
    const abstainPct = totalVotes > 0 ? (abstainVotes / totalVotes) * 100 : 0;
    const quorumMet = totalVotes >= quorumTarget;
    const passed = quorumMet && forVotes > againstVotes;

    return (
      <div className="gg101-voting-sim">
        <div className="gg101-voting-sim-title">Proposal Voting Simulator</div>

        <div className="gg101-proposal-card">
          <div className="gg101-proposal-label">Proposal #OEC-042</div>
          <div className="gg101-proposal-title">Allocate 50,000 OEC to Developer Grants</div>
          <div className="gg101-proposal-desc">
            Fund a developer grants program from the DAO treasury to incentivize third-party development on the Oeconomia ecosystem. Grants of 5,000-15,000 OEC for approved projects.
          </div>
        </div>

        <div className="gg101-voter-info">
          <div className="gg101-voter-info-item">
            <div className="gg101-voter-info-label">Your Tier</div>
            <div className="gg101-voter-info-value">Sentinel</div>
          </div>
          <div className="gg101-voter-info-item">
            <div className="gg101-voter-info-label">Staked</div>
            <div className="gg101-voter-info-value">50,000 OEC</div>
          </div>
          <div className="gg101-voter-info-item">
            <div className="gg101-voter-info-label">Lock</div>
            <div className="gg101-voter-info-value">90 days (1.5x)</div>
          </div>
          <div className="gg101-voter-info-item">
            <div className="gg101-voter-info-label">Voting Power</div>
            <div className="gg101-voter-info-value">75,000</div>
          </div>
        </div>

        <div className="gg101-vote-buttons">
          <button
            className={`gg101-vote-btn for${userVote ? " voted" : ""}${userVote === "for" ? " selected" : ""}`}
            onClick={() => handleVote("for")}
          >
            {"\u2713"} For
          </button>
          <button
            className={`gg101-vote-btn against${userVote ? " voted" : ""}${userVote === "against" ? " selected" : ""}`}
            onClick={() => handleVote("against")}
          >
            {"\u2717"} Against
          </button>
          <button
            className={`gg101-vote-btn abstain${userVote ? " voted" : ""}${userVote === "abstain" ? " selected" : ""}`}
            onClick={() => handleVote("abstain")}
          >
            {"\u2014"} Abstain
          </button>
        </div>

        <div className="gg101-vote-progress">
          <div className="gg101-vote-progress-label">
            <span>Vote Distribution</span>
            <span>{totalVotes.toLocaleString()} total votes</span>
          </div>
          <div className="gg101-vote-bar">
            <div className="gg101-vote-bar-for" style={{ width: `${forPct}%` }} />
            <div className="gg101-vote-bar-against" style={{ width: `${againstPct}%` }} />
            <div className="gg101-vote-bar-abstain" style={{ width: `${abstainPct}%` }} />
          </div>
          <div className="gg101-vote-tally">
            <span className="gg101-vote-tally-for">For: {forVotes.toLocaleString()} ({forPct.toFixed(1)}%)</span>
            <span className="gg101-vote-tally-against">Against: {againstVotes.toLocaleString()} ({againstPct.toFixed(1)}%)</span>
            <span className="gg101-vote-tally-abstain">Abstain: {abstainVotes.toLocaleString()} ({abstainPct.toFixed(1)}%)</span>
          </div>
        </div>

        <div className="gg101-quorum-bar">
          <div className="gg101-quorum-label">Quorum Progress ({quorumPct.toFixed(0)}%)</div>
          <div className="gg101-quorum-track">
            <div className="gg101-quorum-fill" style={{ width: `${quorumPct}%` }} />
            <div className="gg101-quorum-threshold" style={{ left: "100%" }} />
          </div>
          <div className="gg101-quorum-info">
            <span>{totalVotes.toLocaleString()} / {quorumTarget.toLocaleString()} required</span>
            <span>{quorumMet ? "Quorum met" : "Quorum not met"}</span>
          </div>
        </div>

        {userVote && (
          <div className={`gg101-vote-result ${passed ? "passed" : "failed"}`}>
            {quorumMet
              ? passed
                ? "\u2713 Proposal PASSED \u2014 For votes exceed Against votes with quorum met"
                : "\u2717 Proposal FAILED \u2014 Against votes exceed For votes"
              : "\u26A0 Quorum not reached \u2014 proposal is invalid regardless of vote distribution"}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="gg101">
      {/* Progress bar */}
      <div className="gg101-progress">
        <div className="gg101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`gg101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="gg101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — The Guardian Staking Contract and Tier System
          ============================================================ */}
      <div className={`gg101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="gg101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="gg101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="gg101-lesson-header-text">
            <div className="gg101-lesson-title">The Guardian Staking Contract and Tier System</div>
            <div className="gg101-lesson-meta"><span>10 min read</span><span>Mechanics</span></div>
          </div>
          <div className="gg101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="gg101-lesson-content">
          <div className="gg101-lesson-body">
            <h3>Governance Through Commitment</h3>
            <p>
              Guardian staking is the <strong>core governance mechanism</strong> of the Oeconomia DAO. It's how OEC token holders earn the right to influence the protocol's direction. The concept is straightforward: stake your OEC tokens by locking them in the Guardian staking smart contract, and in return, you gain governance voting power and staking rewards.
            </p>
            <p>
              But not all stakers are equal. Oeconomia uses a <strong>five-tier Guardian system</strong> that creates a hierarchy based on both the amount staked and the duration of the lock. The tiers — <strong>Initiate, Warden, Sentinel, Archon, and Sovereign</strong> — each unlock additional privileges and responsibilities within the DAO.
            </p>

            <h3>The Five Guardian Tiers</h3>
            <div className="gg101-data-block">
              <div className="gg101-data-section-label">Tier Requirements and Privileges</div>
              <div className="gg101-data-row"><span className="gg101-data-label">Initiate (1,000+ OEC)</span><span className="gg101-data-value">Basic voting rights, staking rewards</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">Warden (10,000+ OEC)</span><span className="gg101-data-value green">+ Proposal creation</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">Sentinel (50,000+ OEC)</span><span className="gg101-data-value blue">+ Enhanced rewards, delegate voting</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">Archon (250,000+ OEC)</span><span className="gg101-data-value purple">+ Emergency proposals, parameter fast-track</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">Sovereign (1,000,000+ OEC)</span><span className="gg101-data-value amber">+ Veto power, treasury oversight</span></div>
            </div>

            <div className="gg101-info-box">
              <div className="gg101-info-box-label">Why Tiers Prevent Plutocracy</div>
              <p>
                A simple "1 token = 1 vote" system means the wealthiest always dominate. Oeconomia's tier system adds a <strong>commitment dimension</strong>. It's not just about how much you have — it's about how long you're willing to lock it. A Sentinel who locks for a year has more voting power than a whale who locks for 30 days. This design rewards long-term alignment over short-term capital, creating governance that reflects genuine stakeholder commitment.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`gg101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Staking Mechanics: Lock Periods and Multipliers
          ============================================================ */}
      <div className={`gg101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="gg101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="gg101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="gg101-lesson-header-text">
            <div className="gg101-lesson-title">Staking Mechanics: Lock Periods and Multipliers</div>
            <div className="gg101-lesson-meta"><span>8 min read</span><span>Staking</span></div>
          </div>
          <div className="gg101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="gg101-lesson-content">
          <div className="gg101-lesson-body">
            <h3>Choosing Your Lock Period</h3>
            <p>
              When you stake OEC tokens, you choose a <strong>lock period</strong> — the minimum time your tokens will remain locked in the staking contract. During this period, you cannot withdraw your staked tokens. In exchange for this commitment, you receive a <strong>multiplier</strong> that increases your governance voting power. The longer you lock, the higher the multiplier.
            </p>

            <h3>Lock Period Multipliers</h3>
            <div className="gg101-data-block">
              <div className="gg101-data-section-label">Voting Power = Staked OEC x Lock Multiplier</div>
              <div className="gg101-data-row"><span className="gg101-data-label">30 days</span><span className="gg101-data-value">1.0x multiplier</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">90 days</span><span className="gg101-data-value green">1.5x multiplier</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">180 days</span><span className="gg101-data-value cyan">2.0x multiplier</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">365 days</span><span className="gg101-data-value purple">3.0x multiplier</span></div>
            </div>

            <h3>Example Calculations</h3>
            <div className="gg101-data-block">
              <div className="gg101-data-section-label">Same Stake, Different Commitments</div>
              <div className="gg101-data-row"><span className="gg101-data-label">100,000 OEC x 30 days (1.0x)</span><span className="gg101-data-value">100,000 voting power</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">100,000 OEC x 90 days (1.5x)</span><span className="gg101-data-value green">150,000 voting power</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">100,000 OEC x 180 days (2.0x)</span><span className="gg101-data-value cyan">200,000 voting power</span></div>
              <div className="gg101-data-row"><span className="gg101-data-label">100,000 OEC x 365 days (3.0x)</span><span className="gg101-data-value purple">300,000 voting power</span></div>
            </div>

            <p>
              Notice how a 365-day lock gives you <strong>3x the voting power</strong> of a 30-day lock with the same number of tokens. This means a smaller holder with a year-long commitment can outweigh a larger holder with only a month of commitment.
            </p>

            <div className="gg101-info-box green">
              <div className="gg101-info-box-label">Why Longer Locks Get More Power</div>
              <p>
                The multiplier system <strong>aligns incentives with long-term protocol health</strong>. Someone who locks their tokens for a year has real skin in the game — they can't sell during market volatility, they're committed through upgrades and changes, and they have a vested interest in the protocol's long-term success. Short-term stakers might vote for quick profits; long-term stakers vote for sustainable growth.
              </p>
            </div>

            <h3>Staking Rewards</h3>
            <p>
              In addition to governance power, Guardians earn <strong>staking rewards</strong> proportional to their staked amount, lock duration, and tier. Rewards come from protocol revenue (trading fees from Eloqura, stability fees from Alluria, marketplace fees from Artivya) and are distributed continuously to stakers. Higher tiers and longer locks earn proportionally more rewards.
            </p>

            {renderQuizWithSelection(2)}
            <button className={`gg101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Governance Power: How Votes Are Weighted
          ============================================================ */}
      <div className={`gg101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="gg101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="gg101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="gg101-lesson-header-text">
            <div className="gg101-lesson-title">Governance Power: How Votes Are Weighted</div>
            <div className="gg101-lesson-meta"><span>10 min read</span><span>Voting</span></div>
          </div>
          <div className="gg101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="gg101-lesson-content">
          <div className="gg101-lesson-body">
            <h3>Not All Votes Are Equal</h3>
            <p>
              In the Oeconomia DAO, voting power is <strong>commitment-weighted</strong>, not simply token-weighted. Your vote's weight depends on three factors: the <strong>amount of OEC staked</strong>, the <strong>lock duration multiplier</strong>, and your <strong>Guardian tier</strong>. This creates a nuanced governance system where influence correlates with genuine long-term commitment to the ecosystem.
            </p>

            <h3>Vote Weighting Example</h3>
            <div className="gg101-data-block">
              <div className="gg101-data-section-label">Two Guardians, Different Approaches</div>
              <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 12, marginBottom: 12 }}>
                <div className="gg101-data-row"><span className="gg101-data-label">Guardian A: 200,000 OEC, 30-day lock</span><span className="gg101-data-value">200,000 x 1.0 = 200,000 power</span></div>
              </div>
              <div>
                <div className="gg101-data-row"><span className="gg101-data-label">Guardian B: 100,000 OEC, 365-day lock</span><span className="gg101-data-value green">100,000 x 3.0 = 300,000 power</span></div>
              </div>
            </div>
            <p>
              Guardian B has <strong>half the tokens</strong> but <strong>50% more voting power</strong> because of their longer commitment. This is by design — the system values commitment over capital.
            </p>

            <h3>Token-Weighted vs. Guardian System</h3>
            <div className="gg101-compare-grid">
              <div className="gg101-compare-card">
                <h4>{"\u2696\uFE0F"} Token-Weighted Voting</h4>
                <ul>
                  <li>1 token = 1 vote, simple and direct</li>
                  <li>Wealthiest holders always dominate</li>
                  <li>No commitment required — buy, vote, sell</li>
                  <li>Vulnerable to flash loan governance attacks</li>
                  <li>Short-term holders have equal influence</li>
                  <li>Easy to understand but easily gamed</li>
                </ul>
              </div>
              <div className="gg101-compare-card">
                <h4>{"\uD83D\uDEE1\uFE0F"} Guardian System</h4>
                <ul>
                  <li>Voting power = stake x multiplier x tier</li>
                  <li>Commitment matters as much as capital</li>
                  <li>Must lock tokens — real skin in the game</li>
                  <li>Flash loans useless (tokens must be locked)</li>
                  <li>Long-term holders have amplified influence</li>
                  <li>More complex but more democratic</li>
                </ul>
              </div>
            </div>

            <h3>Quorum Requirements</h3>
            <p>
              Proposals aren't just about who votes — they require a <strong>quorum</strong> (minimum participation) to be valid. Even if 100% of voters agree, the proposal fails if quorum isn't met. This prevents a small group of Guardians from passing proposals when most of the community isn't paying attention. The quorum threshold is itself a governance parameter that Guardians can vote to adjust.
            </p>

            <div className="gg101-stats-row">
              <div className="gg101-stat-card"><div className="gg101-stat-value">3</div><div className="gg101-stat-label">Factors in Vote Weight</div></div>
              <div className="gg101-stat-card"><div className="gg101-stat-value">3x</div><div className="gg101-stat-label">Max Lock Multiplier</div></div>
              <div className="gg101-stat-card"><div className="gg101-stat-value">50%+</div><div className="gg101-stat-label">Required to Pass</div></div>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`gg101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Creating and Voting on Proposals
          ============================================================ */}
      <div className={`gg101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="gg101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="gg101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="gg101-lesson-header-text">
            <div className="gg101-lesson-title">Creating and Voting on Proposals</div>
            <div className="gg101-lesson-meta"><span>10 min read</span><span>Proposals</span></div>
          </div>
          <div className="gg101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="gg101-lesson-content">
          <div className="gg101-lesson-body">
            <h3>The Proposal Process</h3>
            <p>
              Any Guardian at <strong>Warden tier or above</strong> (10,000+ OEC staked) can create a governance proposal. Proposals are the mechanism through which the DAO makes decisions — from treasury spending to protocol parameter changes to strategic partnerships. The process is designed to be thorough but not bureaucratic: enough structure to prevent spam, but accessible enough that good ideas can surface from anywhere in the community.
            </p>

            <h3>Proposal Types</h3>
            <div className="gg101-three-col">
              <div className="gg101-col-card">
                <h4>Treasury</h4>
                <p>Allocate DAO funds for development, grants, marketing, or partnerships. Examples: developer grant programs, bug bounties, ecosystem incentives.</p>
              </div>
              <div className="gg101-col-card">
                <h4>Parameters</h4>
                <p>Adjust protocol settings like Alluria's collateral ratios, Eloqura's fee tiers, or staking reward rates. Changes go into effect automatically on passage.</p>
              </div>
              <div className="gg101-col-card">
                <h4>Strategic</h4>
                <p>New protocol integrations, partnership agreements, governance rule changes, or ecosystem expansion decisions. Broader direction-setting for Oeconomia.</p>
              </div>
            </div>

            <h3>Proposal Lifecycle</h3>
            <div className="gg101-timeline">
              <div className="gg101-timeline-item draft">
                <div className="gg101-timeline-date">Phase 1: Draft</div>
                <div className="gg101-timeline-text">Guardian creates a proposal with title, description, and specific actions. The proposal is submitted on-chain and enters the <strong>draft</strong> phase for community review.</div>
              </div>
              <div className="gg101-timeline-item discuss">
                <div className="gg101-timeline-date">Phase 2: Discussion (3 days)</div>
                <div className="gg101-timeline-text">Community members discuss the proposal, ask questions, and suggest modifications. The proposer can update the draft during this phase. <strong>No voting occurs yet.</strong></div>
              </div>
              <div className="gg101-timeline-item voting">
                <div className="gg101-timeline-date">Phase 3: Voting (7 days)</div>
                <div className="gg101-timeline-text">All Guardians can vote <strong>For, Against, or Abstain</strong>. Voting is weighted by staked amount and lock multiplier. The proposal must reach quorum and majority to pass.</div>
              </div>
              <div className="gg101-timeline-item execute">
                <div className="gg101-timeline-date">Phase 4: Execution</div>
                <div className="gg101-timeline-text">If the proposal passes (quorum met + majority For), the smart contract <strong>automatically executes</strong> the specified actions. No human intermediary can block or alter the outcome.</div>
              </div>
            </div>

            <div className="gg101-info-box purple">
              <div className="gg101-info-box-label">On-Chain Execution</div>
              <p>
                Once a proposal passes, its execution is <strong>automated and unstoppable</strong>. The smart contract doesn't ask for permission — if the vote passes, the action happens. Treasury transfers, parameter changes, contract upgrades — all execute exactly as specified in the proposal. This is what makes DAO governance trustless: you don't need to trust that someone will follow through, because the code guarantees it.
              </p>
            </div>

            <h3>Try It: Proposal Voting Simulator</h3>
            {renderVotingSimulator()}

            {renderQuizWithSelection(4)}
            <button className={`gg101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Guardian Tiers: Initiate to Sovereign
          ============================================================ */}
      <div className={`gg101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="gg101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="gg101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="gg101-lesson-header-text">
            <div className="gg101-lesson-title">Guardian Tiers: Initiate, Warden, Sentinel, Archon, Sovereign</div>
            <div className="gg101-lesson-meta"><span>10 min read</span><span>Tiers</span></div>
          </div>
          <div className="gg101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="gg101-lesson-content">
          <div className="gg101-lesson-body">
            <h3>A Deep Dive into Each Tier</h3>
            <p>
              The five Guardian tiers create a structured hierarchy within the Oeconomia DAO. Each tier unlocks additional capabilities and responsibilities. As you stake more OEC and commit for longer periods, you ascend through the ranks — gaining greater influence over the protocol's direction.
            </p>

            <div className="gg101-eco-card">
              <div className="gg101-eco-header">
                <div className="gg101-eco-icon initiate">{"\uD83D\uDD30"}</div>
                <div>
                  <div className="gg101-eco-name">Initiate</div>
                  <div className="gg101-eco-sub">1,000+ OEC staked \u00B7 Entry tier</div>
                </div>
              </div>
              <div className="gg101-eco-body">
                <p>The starting point for governance participation. Initiates earn basic staking rewards and can vote on proposals. This tier is designed to be accessible — anyone with 1,000 OEC can begin participating in governance and earning rewards.</p>
              </div>
              <div className="gg101-eco-examples">
                <span className="gg101-eco-tag">Basic Voting</span>
                <span className="gg101-eco-tag">Staking Rewards</span>
                <span className="gg101-eco-tag">Community Access</span>
              </div>
            </div>

            <div className="gg101-eco-card">
              <div className="gg101-eco-header">
                <div className="gg101-eco-icon warden">{"\uD83D\uDD11"}</div>
                <div>
                  <div className="gg101-eco-name">Warden</div>
                  <div className="gg101-eco-sub">10,000+ OEC staked \u00B7 Proposal creator</div>
                </div>
              </div>
              <div className="gg101-eco-body">
                <p>Wardens are the gatekeepers of governance. At this tier, you can <strong>create proposals</strong> — drafting new initiatives, parameter changes, or treasury allocations for the community to vote on. This threshold ensures proposers have meaningful stake in the outcome.</p>
              </div>
              <div className="gg101-eco-examples">
                <span className="gg101-eco-tag">Proposal Creation</span>
                <span className="gg101-eco-tag">Enhanced Rewards</span>
                <span className="gg101-eco-tag">Voting</span>
              </div>
            </div>

            <div className="gg101-eco-card">
              <div className="gg101-eco-header">
                <div className="gg101-eco-icon sentinel">{"\uD83D\uDC41\uFE0F"}</div>
                <div>
                  <div className="gg101-eco-name">Sentinel</div>
                  <div className="gg101-eco-sub">50,000+ OEC staked \u00B7 Ecosystem watcher</div>
                </div>
              </div>
              <div className="gg101-eco-body">
                <p>Sentinels are the watchful guardians of the ecosystem. They earn <strong>enhanced staking rewards</strong> and gain the ability to <strong>delegate their voting power</strong> to other Guardians. Delegation is useful when you trust another Guardian's judgment on specific topics.</p>
              </div>
              <div className="gg101-eco-examples">
                <span className="gg101-eco-tag">Vote Delegation</span>
                <span className="gg101-eco-tag">Enhanced Rewards</span>
                <span className="gg101-eco-tag">Proposal Creation</span>
              </div>
            </div>

            <div className="gg101-eco-card">
              <div className="gg101-eco-header">
                <div className="gg101-eco-icon archon">{"\u2694\uFE0F"}</div>
                <div>
                  <div className="gg101-eco-name">Archon</div>
                  <div className="gg101-eco-sub">250,000+ OEC staked \u00B7 Emergency authority</div>
                </div>
              </div>
              <div className="gg101-eco-body">
                <p>Archons hold significant influence. They can submit <strong>emergency proposals</strong> that bypass the normal discussion period — critical for responding to security threats or urgent protocol issues. They can also <strong>fast-track parameter changes</strong> when time-sensitive adjustments are needed.</p>
              </div>
              <div className="gg101-eco-examples">
                <span className="gg101-eco-tag">Emergency Proposals</span>
                <span className="gg101-eco-tag">Fast-Track Changes</span>
                <span className="gg101-eco-tag">Premium Rewards</span>
              </div>
            </div>

            <div className="gg101-eco-card">
              <div className="gg101-eco-header">
                <div className="gg101-eco-icon sovereign">{"\uD83D\uDC51"}</div>
                <div>
                  <div className="gg101-eco-name">Sovereign</div>
                  <div className="gg101-eco-sub">1,000,000+ OEC staked \u00B7 Supreme guardian</div>
                </div>
              </div>
              <div className="gg101-eco-body">
                <p>The highest tier of Guardian. Sovereigns carry the most governance weight and hold a unique privilege: <strong>veto power</strong> over proposals that threaten protocol security. They also have <strong>treasury oversight</strong> authority, providing an additional check on fund allocation. With great power comes great responsibility — Sovereigns are the ultimate stewards of the Oeconomia ecosystem.</p>
              </div>
              <div className="gg101-eco-examples">
                <span className="gg101-eco-tag">Veto Power</span>
                <span className="gg101-eco-tag">Treasury Oversight</span>
                <span className="gg101-eco-tag">Maximum Rewards</span>
                <span className="gg101-eco-tag">All Privileges</span>
              </div>
            </div>

            <div className="gg101-info-box amber">
              <div className="gg101-info-box-label">The Mythology Behind the Names</div>
              <p>
                The Guardian tier names draw from ancient traditions of stewardship. <strong>Initiates</strong> are newcomers beginning their journey. <strong>Wardens</strong> are keepers of the gates. <strong>Sentinels</strong> are watchful protectors. <strong>Archons</strong> are rulers in the ancient Greek tradition — leaders with executive authority. And <strong>Sovereigns</strong> are the supreme guardians, bearing the highest responsibility for the realm's welfare. Each name reflects the growing responsibility that comes with greater commitment.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`gg101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
