// ============================================================
// Bitcoin 101 — Full Interactive Lesson Content
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import "./bitcoin101.css";

// -- Types ------------------------------------------------------------------

interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  feedback: string;
}

// -- Quiz Data --------------------------------------------------------------

const QUIZZES: QuizData[] = [
  {
    question:
      "What problem was Bitcoin originally created to solve?",
    options: [
      "Making online shopping faster",
      "Eliminating the need for trusted third parties in digital payments",
      "Replacing physical cash entirely",
      "Creating a new stock market",
    ],
    correctIndex: 1,
    feedback:
      "Satoshi Nakamoto's whitepaper described Bitcoin as \"a peer-to-peer electronic cash system\" that removes the need for trusted intermediaries like banks.",
  },
  {
    question: "What do Bitcoin miners actually do?",
    options: [
      "Print new Bitcoin coins",
      "Verify user identities",
      "Compete to find a hash that meets the network's difficulty target",
      "Manually approve each transaction",
    ],
    correctIndex: 2,
    feedback:
      "Miners repeatedly hash block data with different nonces until they find a hash below the difficulty target — this is Proof of Work.",
  },
  {
    question:
      "After all 32 halvings are complete, what will the total supply of Bitcoin be?",
    options: [
      "Unlimited",
      "100 million BTC",
      "21 million BTC",
      "42 million BTC",
    ],
    correctIndex: 2,
    feedback:
      "Bitcoin's code enforces a hard cap of 21 million coins. The last fraction of a Bitcoin is expected to be mined around the year 2140.",
  },
  {
    question:
      "Which property does Bitcoin share with gold that fiat currencies lack?",
    options: [
      "Controlled by a central bank",
      "Verifiable scarcity with a fixed supply",
      "Physical weight",
      "Unlimited printability",
    ],
    correctIndex: 1,
    feedback:
      "Like gold, Bitcoin has a finite supply (21M) that can't be inflated by any authority. Unlike fiat money, no one can \"print more\" Bitcoin.",
  },
  {
    question: "In a Bitcoin transaction, what are UTXOs?",
    options: [
      "User Transaction eXchange Orders",
      "Unspent Transaction Outputs — discrete chunks of BTC that serve as inputs for new transactions",
      "Universal Token eXchange Operations",
      "Unsigned Transaction eXternal Offers",
    ],
    correctIndex: 1,
    feedback:
      "Bitcoin doesn't use account balances like a bank. Instead, your \"balance\" is the sum of all Unspent Transaction Outputs (UTXOs) your private key can spend.",
  },
];

// -- Lesson Titles ----------------------------------------------------------

const LESSON_TITLES = [
  "What Bitcoin Is & Why It Was Created",
  "How Bitcoin Mining Works",
  "The Halving Cycle & 21 Million Cap",
  "Why Bitcoin Is Called Digital Gold",
  "How to Read a Bitcoin Transaction",
];

// -- Helper: pseudo-random hash ---------------------------------------------

function randomHash(): string {
  const chars = "0123456789abcdef";
  let h = "";
  for (let i = 0; i < 64; i++) h += chars[Math.floor(Math.random() * 16)];
  return h;
}

// ===========================================================================
// Component
// ===========================================================================

export default function Bitcoin101Content() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    () => new Set()
  );
  const [quizAnswers, setQuizAnswers] = useState<
    Map<number, { selected: number; correct: boolean }>
  >(() => new Map());

  // Mining sim state
  const [nonce, setNonce] = useState(0);
  const [currentHash, setCurrentHash] = useState(
    "Click 'Start Mining' to begin..."
  );
  const [isMining, setIsMining] = useState(false);
  const [hashFound, setHashFound] = useState(false);
  const miningInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup mining interval on unmount
  useEffect(() => {
    return () => {
      if (miningInterval.current) clearInterval(miningInterval.current);
    };
  }, []);

  // -- Handlers -------------------------------------------------------------

  const toggleLesson = (idx: number) => {
    setActiveLesson((prev) => (prev === idx ? null : idx));
  };

  const markComplete = (idx: number) => {
    setCompletedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) {
        next.delete(idx);
      } else {
        next.add(idx);
      }
      return next;
    });
    // Auto-open next lesson if marking complete
    if (!completedLessons.has(idx) && idx < 4) {
      setActiveLesson(idx + 1);
    }
  };

  const answerQuiz = (lessonIdx: number, selectedIdx: number) => {
    if (quizAnswers.has(lessonIdx)) return; // already answered
    const correct = selectedIdx === QUIZZES[lessonIdx].correctIndex;
    setQuizAnswers((prev) => {
      const next = new Map(prev);
      next.set(lessonIdx, { selected: selectedIdx, correct });
      return next;
    });
  };

  const startMining = useCallback(() => {
    if (hashFound) return;
    if (isMining) {
      // Stop mining
      if (miningInterval.current) clearInterval(miningInterval.current);
      miningInterval.current = null;
      setIsMining(false);
      return;
    }

    setIsMining(true);
    setNonce(0);
    setHashFound(false);
    let n = 0;
    const target = 50 + Math.floor(Math.random() * 150); // find between 50-200 attempts

    miningInterval.current = setInterval(() => {
      n++;
      setNonce(n);
      if (n >= target) {
        // Generate a hash starting with "0000"
        const validHash = "0000" + randomHash().slice(4);
        setCurrentHash(validHash);
        setHashFound(true);
        setIsMining(false);
        if (miningInterval.current) clearInterval(miningInterval.current);
        miningInterval.current = null;
      } else {
        setCurrentHash(randomHash());
      }
    }, 40);
  }, [isMining, hashFound]);

  const resetMining = () => {
    if (miningInterval.current) clearInterval(miningInterval.current);
    miningInterval.current = null;
    setIsMining(false);
    setHashFound(false);
    setNonce(0);
    setCurrentHash("Click 'Start Mining' to begin...");
  };

  // -- Quiz renderer --------------------------------------------------------

  const renderQuiz = (lessonIdx: number) => {
    const quiz = QUIZZES[lessonIdx];
    const answer = quizAnswers.get(lessonIdx);
    const letters = ["A", "B", "C", "D"];

    return (
      <div className="btc101-quiz">
        <div className="btc101-quiz-label">Knowledge Check</div>
        <div className="btc101-quiz-question">{quiz.question}</div>
        <div className="btc101-quiz-options">
          {quiz.options.map((opt, i) => {
            let cls = "btc101-quiz-option";
            if (answer) {
              cls += " disabled";
              if (i === quiz.correctIndex) cls += " correct";
              else if (i === answer.selected && !answer.correct) cls += " wrong";
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => answerQuiz(lessonIdx, i)}
                disabled={!!answer}
              >
                <span className="option-letter">{letters[i]}</span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
        {answer && (
          <div
            className={`btc101-quiz-feedback ${
              answer.correct ? "correct" : "wrong"
            }`}
          >
            {answer.correct ? "Correct! " : "Not quite. "}
            {quiz.feedback}
          </div>
        )}
      </div>
    );
  };

  // -- Mark Complete button -------------------------------------------------

  const renderCompleteBtn = (idx: number) => {
    const done = completedLessons.has(idx);
    return (
      <button
        className={`btc101-complete-btn ${done ? "done" : "incomplete"}`}
        onClick={() => markComplete(idx)}
      >
        {done ? (
          <>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Completed
          </>
        ) : (
          <>
            <svg
              width="14"
              height="14"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
            </svg>
            Mark Complete
          </>
        )}
      </button>
    );
  };

  // -- Lesson content -------------------------------------------------------

  const renderLessonContent = (idx: number) => {
    switch (idx) {
      // =====================================================================
      // Lesson 1: What Bitcoin Is & Why It Was Created
      // =====================================================================
      case 0:
        return (
          <div className="btc101-lesson-body">
            <p>
              On <strong>January 3, 2009</strong>, a pseudonymous developer
              known as <strong>Satoshi Nakamoto</strong> launched the Bitcoin
              network by mining its first block — the{" "}
              <strong>Genesis Block</strong>. Embedded in that block was a
              message from <em>The Times</em> newspaper:
            </p>

            <div className="btc101-info-box orange">
              <div className="btc101-info-box-title">Genesis Block Message</div>
              "The Times 03/Jan/2009 Chancellor on brink of second bailout for
              banks"
            </div>

            <p>
              This wasn't random — it was a statement. Bitcoin was born in the
              aftermath of the <strong>2008 financial crisis</strong>, when
              governments bailed out failing banks with taxpayer money. Satoshi
              envisioned a system where people could send value directly to each
              other, without needing to trust banks or governments as
              intermediaries.
            </p>

            <p>
              Bitcoin is a <strong>peer-to-peer electronic cash system</strong>.
              It runs on a decentralized network of computers (nodes) that all
              agree on the same transaction history without any central
              authority. This agreement mechanism is called{" "}
              <strong>consensus</strong>.
            </p>

            <div className="btc101-info-box blue">
              <div className="btc101-info-box-title">Key Innovation</div>
              Bitcoin solved the "double-spend problem" — the risk that digital
              money could be copied and spent twice — without needing a central
              server. It did this through cryptographic proof and a distributed
              ledger called the <strong>blockchain</strong>.
            </div>

            <div className="btc101-stats-row">
              <div className="btc101-stat">
                <div className="btc101-stat-value">2009</div>
                <div className="btc101-stat-label">Network Launch</div>
              </div>
              <div className="btc101-stat">
                <div className="btc101-stat-value">21M</div>
                <div className="btc101-stat-label">Max Supply</div>
              </div>
              <div className="btc101-stat">
                <div className="btc101-stat-value">~19.6M</div>
                <div className="btc101-stat-label">Currently Mined</div>
              </div>
              <div className="btc101-stat">
                <div className="btc101-stat-value">~18K</div>
                <div className="btc101-stat-label">Nodes Worldwide</div>
              </div>
            </div>

            <p>
              Unlike traditional currencies controlled by central banks, Bitcoin
              is <strong>permissionless</strong> — anyone can participate.
              There's no sign-up, no KYC to run a node, and no authority that
              can freeze your funds or reverse your transactions.
            </p>

            {renderQuiz(0)}
            {renderCompleteBtn(0)}
          </div>
        );

      // =====================================================================
      // Lesson 2: How Bitcoin Mining Works
      // =====================================================================
      case 1:
        return (
          <div className="btc101-lesson-body">
            <p>
              Bitcoin mining is the process of <strong>validating transactions</strong>{" "}
              and <strong>adding new blocks</strong> to the blockchain. Miners
              compete to solve a computational puzzle — the first one to find a
              valid solution gets to add the next block and earn the{" "}
              <strong>block reward</strong> (newly created bitcoins + transaction fees).
            </p>

            <div className="btc101-info-box orange">
              <div className="btc101-info-box-title">How It Works</div>
              Miners take pending transactions, combine them into a block, and
              repeatedly hash the block data with different{" "}
              <strong>nonce</strong> values until they find a hash that starts
              with enough zeros to meet the network's{" "}
              <strong>difficulty target</strong>.
            </div>

            <p>
              Think of it like a lottery: miners guess billions of numbers per
              second, and the network adjusts the difficulty every{" "}
              <strong>2,016 blocks</strong> (~2 weeks) so that, on average, one
              block is found every <strong>10 minutes</strong>.
            </p>

            <div className="btc101-timeline">
              <div className="btc101-timeline-item">
                <div className="btc101-timeline-date">2009 — CPU Era</div>
                <div className="btc101-timeline-text">
                  Satoshi mined on a regular laptop CPU. Anyone could mine with
                  their home computer.
                </div>
              </div>
              <div className="btc101-timeline-item">
                <div className="btc101-timeline-date">2010 — GPU Mining</div>
                <div className="btc101-timeline-text">
                  Miners discovered GPUs were ~100x faster at SHA-256 hashing
                  than CPUs. Graphics cards became the tool of choice.
                </div>
              </div>
              <div className="btc101-timeline-item">
                <div className="btc101-timeline-date">2013 — ASIC Revolution</div>
                <div className="btc101-timeline-text">
                  Purpose-built ASIC chips arrived, making GPUs obsolete for
                  Bitcoin mining. Each generation was orders of magnitude faster.
                </div>
              </div>
              <div className="btc101-timeline-item">
                <div className="btc101-timeline-date">2024 — Industrial Scale</div>
                <div className="btc101-timeline-text">
                  Modern mining uses warehouses of ASICs, often powered by
                  renewable energy. Network hashrate exceeds 500 EH/s.
                </div>
              </div>
            </div>

            {/* Mining Simulator */}
            <div className={`btc101-mining ${isMining ? "active" : ""}`}>
              <div className="btc101-mining-title">
                <span>&#9874;</span> Mining Simulator
              </div>

              <div className="btc101-mining-nonce">
                <span className="nonce-label">Nonce:</span>
                <span className="nonce-value">
                  {nonce.toLocaleString()}
                </span>
              </div>

              <div className="btc101-mining-display">
                <div className="label">Current Hash</div>
                <div className={`hash ${hashFound ? "found" : ""}`}>
                  {currentHash}
                </div>
              </div>

              {hashFound && (
                <div className="btc101-info-box green" style={{ margin: "0.75rem 0" }}>
                  <div className="btc101-info-box-title">Block Found!</div>
                  Valid hash starts with "0000" — this meets the difficulty
                  target. In {nonce.toLocaleString()} attempts, you found a
                  valid block!
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  className={`btc101-mining-btn ${
                    hashFound ? "found" : isMining ? "mining" : "start"
                  }`}
                  onClick={startMining}
                  disabled={hashFound}
                >
                  {hashFound
                    ? "Block Mined!"
                    : isMining
                    ? "Stop Mining"
                    : "Start Mining"}
                </button>
                {hashFound && (
                  <button
                    className="btc101-mining-btn start"
                    onClick={resetMining}
                  >
                    Mine Again
                  </button>
                )}
              </div>
            </div>

            <div className="btc101-data-block">
              <div className="btc101-data-block-header">
                Mining Hardware Evolution
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">CPU (2009)</span>
                <span className="btc101-data-value">~2 MH/s</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">GPU (2010)</span>
                <span className="btc101-data-value">~200 MH/s</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">ASIC Gen 1 (2013)</span>
                <span className="btc101-data-value">~1 TH/s</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">Modern ASIC (2024)</span>
                <span className="btc101-data-value">~250 TH/s</span>
              </div>
            </div>

            {renderQuiz(1)}
            {renderCompleteBtn(1)}
          </div>
        );

      // =====================================================================
      // Lesson 3: The Halving Cycle & 21 Million Cap
      // =====================================================================
      case 2:
        return (
          <div className="btc101-lesson-body">
            <p>
              Bitcoin has a built-in monetary policy that no government, company, or
              individual can change. Every <strong>210,000 blocks</strong>{" "}
              (approximately every 4 years), the block reward that miners receive
              is cut in half. This event is called the <strong>halving</strong>.
            </p>

            <div className="btc101-data-block">
              <div className="btc101-data-block-header">
                Bitcoin Halving History
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">2009 — Launch</span>
                <span className="btc101-data-value">50 BTC / block</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">2012 — Halving #1</span>
                <span className="btc101-data-value">25 BTC / block</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">2016 — Halving #2</span>
                <span className="btc101-data-value">12.5 BTC / block</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">2020 — Halving #3</span>
                <span className="btc101-data-value">6.25 BTC / block</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">2024 — Halving #4</span>
                <span className="btc101-data-value">3.125 BTC / block</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">~2028 — Halving #5</span>
                <span className="btc101-data-value">1.5625 BTC / block</span>
              </div>
            </div>

            <p>
              Because the reward keeps halving, the total number of bitcoins
              that will ever exist converges on exactly{" "}
              <strong>21,000,000</strong>. The last satoshi (the smallest unit,
              0.00000001 BTC) is projected to be mined around the year{" "}
              <strong>2140</strong>.
            </p>

            <div className="btc101-stats-row">
              <div className="btc101-stat">
                <div className="btc101-stat-value">21M</div>
                <div className="btc101-stat-label">Hard Cap</div>
              </div>
              <div className="btc101-stat">
                <div className="btc101-stat-value">~93%</div>
                <div className="btc101-stat-label">Already Mined</div>
              </div>
              <div className="btc101-stat">
                <div className="btc101-stat-value">3-4M</div>
                <div className="btc101-stat-label">Estimated Lost Forever</div>
              </div>
            </div>

            <div className="btc101-info-box purple">
              <div className="btc101-info-box-title">Lost Coins</div>
              An estimated 3-4 million BTC are permanently lost — owners lost
              their private keys, died without sharing access, or sent coins to
              unspendable addresses. These coins can never be recovered, making
              the effective supply even scarcer than 21 million.
            </div>

            <p>
              This predictable, decreasing supply is the opposite of fiat
              currencies, where central banks can print unlimited amounts. It's
              what gives Bitcoin its <strong>deflationary</strong> property and
              fuels the narrative of Bitcoin as "digital gold."
            </p>

            {renderQuiz(2)}
            {renderCompleteBtn(2)}
          </div>
        );

      // =====================================================================
      // Lesson 4: Why Bitcoin Is Called Digital Gold
      // =====================================================================
      case 3:
        return (
          <div className="btc101-lesson-body">
            <p>
              Gold has been humanity's store of value for thousands of years.
              Bitcoin shares many of gold's properties — and improves on several
              of them. This is why it's often called{" "}
              <strong>"digital gold."</strong>
            </p>

            <div className="btc101-compare-grid">
              <div className="btc101-compare-header">Property</div>
              <div className="btc101-compare-header">Gold</div>
              <div className="btc101-compare-header">Bitcoin</div>

              <div className="btc101-compare-cell label">Scarcity</div>
              <div className="btc101-compare-cell">
                Limited but unknown total supply
              </div>
              <div className="btc101-compare-cell">
                Hard cap of exactly 21 million
              </div>

              <div className="btc101-compare-cell label">Divisibility</div>
              <div className="btc101-compare-cell">
                Difficult to divide into small units
              </div>
              <div className="btc101-compare-cell">
                Divisible to 8 decimal places (satoshis)
              </div>

              <div className="btc101-compare-cell label">Portability</div>
              <div className="btc101-compare-cell">
                Heavy and expensive to transport
              </div>
              <div className="btc101-compare-cell">
                Send anywhere instantly via internet
              </div>

              <div className="btc101-compare-cell label">Verifiability</div>
              <div className="btc101-compare-cell">
                Requires assay testing
              </div>
              <div className="btc101-compare-cell">
                Cryptographically verified on-chain
              </div>

              <div className="btc101-compare-cell label">Storage Cost</div>
              <div className="btc101-compare-cell">
                Vaults, insurance, armed guards
              </div>
              <div className="btc101-compare-cell">
                A seed phrase (free to store)
              </div>

              <div className="btc101-compare-cell label">Censorship</div>
              <div className="btc101-compare-cell">
                Can be confiscated (FDR's Executive Order 6102)
              </div>
              <div className="btc101-compare-cell">
                Cannot be seized if keys are secured
              </div>
            </div>

            <div className="btc101-data-block">
              <div className="btc101-data-block-header">
                Market Cap Comparison (approx.)
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">Gold</span>
                <span className="btc101-data-value">~$15 Trillion</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">Bitcoin</span>
                <span className="btc101-data-value">~$1.9 Trillion</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">BTC as % of Gold</span>
                <span className="btc101-data-value">~13%</span>
              </div>
            </div>

            <div className="btc101-info-box orange">
              <div className="btc101-info-box-title">The Bull Case</div>
              If Bitcoin captured just 25% of gold's market cap, each BTC would
              be worth over <strong>$175,000</strong>. Some analysts argue
              Bitcoin could eventually surpass gold entirely due to its superior
              portability, divisibility, and verifiability.
            </div>

            <p>
              Institutional adoption has accelerated this narrative.{" "}
              <strong>Bitcoin ETFs</strong> launched in January 2024, BlackRock's
              IBIT became the fastest-growing ETF in history, and major
              corporations now hold BTC on their balance sheets as a treasury
              reserve asset.
            </p>

            {renderQuiz(3)}
            {renderCompleteBtn(3)}
          </div>
        );

      // =====================================================================
      // Lesson 5: How to Read a Bitcoin Transaction
      // =====================================================================
      case 4:
        return (
          <div className="btc101-lesson-body">
            <p>
              Bitcoin doesn't use account balances like a bank. Instead, it uses
              a model called <strong>UTXOs</strong> — Unspent Transaction
              Outputs. Think of UTXOs like physical bills in your wallet: you
              don't have a "balance," you have specific bills (outputs) that you
              can spend.
            </p>

            <div className="btc101-info-box blue">
              <div className="btc101-info-box-title">The Cash Analogy</div>
              Imagine you have a $20 bill and want to pay $12. You hand over the
              $20 (input), the merchant takes $12 (output to them), and you get
              $8 back as change (output back to you). Bitcoin transactions work
              the same way — old UTXOs are consumed, and new ones are created.
            </div>

            <div className="btc101-data-block">
              <div className="btc101-data-block-header">
                Sample Bitcoin Transaction
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">TX Hash</span>
                <span className="btc101-data-value" style={{ fontSize: "0.7rem" }}>
                  a1b2c3d4e5...f6789
                </span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">Input (from)</span>
                <span className="btc101-data-value">0.5000 BTC</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">Output 1 (to recipient)</span>
                <span className="btc101-data-value">0.3200 BTC</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">Output 2 (change)</span>
                <span className="btc101-data-value">0.1795 BTC</span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">Fee (to miner)</span>
                <span className="btc101-data-value">0.0005 BTC</span>
              </div>
            </div>

            <p>
              The <strong>transaction fee</strong> is the difference between
              total inputs and total outputs. It goes to the miner who includes
              your transaction in a block. Higher fees = faster confirmation.
            </p>

            <div className="btc101-info-box green">
              <div className="btc101-info-box-title">Inputs & Outputs</div>
              <strong>Inputs</strong> reference previous UTXOs being spent.
              Each input includes a cryptographic signature proving the sender
              owns the private key for that UTXO.
              <br />
              <br />
              <strong>Outputs</strong> define who receives the BTC and how much.
              Each output creates a new UTXO locked to the recipient's address.
            </div>

            <p>
              After a transaction is broadcast, it sits in the{" "}
              <strong>mempool</strong> (a waiting area) until a miner includes
              it in a block. The more <strong>confirmations</strong> (blocks
              built on top), the more secure the transaction:
            </p>

            <div className="btc101-data-block">
              <div className="btc101-data-block-header">
                Confirmation Levels
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">0 confirmations</span>
                <span className="btc101-data-value">
                  Unconfirmed (in mempool)
                </span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">1 confirmation</span>
                <span className="btc101-data-value">
                  Included in a block (~10 min)
                </span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">3 confirmations</span>
                <span className="btc101-data-value">
                  Generally safe for small amounts
                </span>
              </div>
              <div className="btc101-data-row">
                <span className="btc101-data-label">6 confirmations</span>
                <span className="btc101-data-value">
                  Industry standard for finality (~1 hour)
                </span>
              </div>
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
    <div className="btc101 space-y-4">
      {/* Progress Bar */}
      <div className="btc101-progress">
        <div className="btc101-progress-steps">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`btc101-progress-step ${
                completedLessons.has(i) ? "done" : ""
              }`}
            />
          ))}
        </div>
        <div className="btc101-progress-text">
          {completedCount} of 5 complete
        </div>
      </div>

      {/* Accordion Lessons */}
      {LESSON_TITLES.map((title, idx) => (
        <div key={idx} className="btc101-lesson">
          <div
            className="btc101-lesson-header"
            onClick={() => toggleLesson(idx)}
          >
            <div
              className={`btc101-lesson-num ${
                completedLessons.has(idx) ? "completed" : ""
              }`}
            >
              {completedLessons.has(idx) ? (
                <svg
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                idx + 1
              )}
            </div>
            <div className="btc101-lesson-title">{title}</div>
            <svg
              className={`btc101-lesson-chevron ${
                activeLesson === idx ? "open" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
          {activeLesson === idx && renderLessonContent(idx)}
        </div>
      ))}

      {/* Completion message */}
      {completedCount === 5 && (
        <div className="btc101-info-box green" style={{ textAlign: "center" }}>
          <div className="btc101-info-box-title">
            Lesson Complete!
          </div>
          You've completed all 5 sections of Bitcoin 101. You now understand
          Bitcoin's origins, mining, the halving cycle, its comparison to gold,
          and how transactions work. Ready for the next lesson?
        </div>
      )}
    </div>
  );
}
