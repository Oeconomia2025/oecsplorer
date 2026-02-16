// ============================================================
// Blockchain 101 — Full Interactive Lesson Content
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import "./blockchain.css";

// -- Types & Data -----------------------------------------------------------

interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  feedbackCorrect: string;
  feedbackWrong: string;
}

const QUIZZES: QuizData[] = [
  {
    question: "What connects each block to the one before it?",
    options: [
      "A database pointer managed by the network owner",
      "A sequential numbering system",
      "The cryptographic hash of the previous block",
      "A timestamp reference stored on a central server",
    ],
    correctIndex: 2,
    feedbackCorrect:
      "Correct! Each block stores the hash of the previous block, creating an unbroken cryptographic chain back to Block 0.",
    feedbackWrong:
      "Not quite — each block stores the cryptographic hash of the previous block, which is what creates the immutable chain.",
  },
  {
    question:
      "What happens when a node receives a transaction that breaks the protocol rules?",
    options: [
      "It forwards the transaction to an admin for review",
      "It rejects the transaction and does not relay it",
      "It holds the transaction until a majority vote approves it",
      "It corrects the transaction and processes it anyway",
    ],
    correctIndex: 1,
    feedbackCorrect:
      "Correct! Nodes independently validate every transaction and silently reject any that break the rules. No admin needed.",
    feedbackWrong:
      "Not quite — nodes independently reject invalid transactions without forwarding them. There's no admin or voting process.",
  },
  {
    question:
      'What is the "avalanche effect" in cryptographic hash functions?',
    options: [
      "Large inputs produce exponentially larger outputs",
      "A tiny change in input produces a completely different output",
      "Multiple inputs are combined and hashed simultaneously",
      "Hash outputs gradually become longer over time",
    ],
    correctIndex: 1,
    feedbackCorrect:
      'Correct! The avalanche effect means even a single character change produces a completely different hash — "hello" and "Hello" produce wildly different outputs.',
    feedbackWrong:
      "Not quite — the avalanche effect means even the smallest change to the input (like capitalizing one letter) produces a completely different hash output.",
  },
  {
    question:
      "What is the primary advantage of a decentralized blockchain over a centralized database?",
    options: [
      "It processes transactions faster",
      "It uses less storage space",
      "It costs less to operate",
      "It removes the need to trust a central authority",
    ],
    correctIndex: 3,
    feedbackCorrect:
      'Correct! The core value of decentralization is trustlessness — you verify everything yourself instead of trusting a single operator with your data.',
    feedbackWrong:
      "Not quite — blockchains are actually slower, use more storage, and cost more than centralized databases. Their advantage is removing the need to trust any central authority.",
  },
  {
    question:
      "Which type of blockchain would be most appropriate for a DeFi lending protocol that anyone should be able to use?",
    options: [
      "Private (permissioned) blockchain",
      "Public (permissionless) blockchain",
      "Consortium blockchain with KYC",
      "A centralized database with API access",
    ],
    correctIndex: 1,
    feedbackCorrect:
      "Correct! DeFi requires permissionless access, transparency, and censorship resistance — all properties of public blockchains.",
    feedbackWrong:
      "Not quite — DeFi protocols need to be open to everyone without permission. Only a public (permissionless) blockchain provides that.",
  },
];

const LESSON_TITLES = [
  "Blocks, Chains & the Append-Only Ledger",
  "How Transactions Are Validated by Nodes",
  "Hash Functions & Cryptographic Security",
  "Decentralization vs. Centralized Databases",
  "Public vs. Private Blockchains",
];

// -- Helper: simplified hash (FNV-1a based, demo purposes) ------------------

function simpleHash(input: string): string {
  if (!input) return "";
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  let result = "";
  let seed = Math.abs(hash);
  for (let i = 0; i < 64; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    result += "0123456789abcdef"[seed % 16];
  }
  return result;
}

// -- Node network config ----------------------------------------------------

const NODE_POSITIONS = [
  { x: 0.15, y: 0.25, label: "N1" },
  { x: 0.4, y: 0.12, label: "N2" },
  { x: 0.7, y: 0.18, label: "N3" },
  { x: 0.88, y: 0.35, label: "N4" },
  { x: 0.25, y: 0.55, label: "N5" },
  { x: 0.55, y: 0.45, label: "N6" },
  { x: 0.8, y: 0.6, label: "N7" },
  { x: 0.12, y: 0.82, label: "N8" },
  { x: 0.45, y: 0.78, label: "N9" },
  { x: 0.72, y: 0.85, label: "N10" },
];

const NODE_CONNECTIONS: [number, number][] = [
  [0, 1], [0, 4], [1, 2], [1, 5], [2, 3], [2, 5], [3, 6], [4, 5], [4, 7],
  [5, 6], [5, 8], [6, 9], [7, 8], [8, 9], [0, 7], [2, 6], [3, 9], [1, 4],
];

// ===========================================================================
// Component
// ===========================================================================

export default function BlockchainContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<number>>(
    () => new Set()
  );
  const [quizAnswers, setQuizAnswers] = useState<
    Map<number, { selected: number; correct: boolean }>
  >(() => new Map());

  // Chain tamper state
  const [isTampered, setIsTampered] = useState(false);
  const [tamperStatus, setTamperStatus] = useState<
    null | { type: "alert" | "safe"; text: string }
  >(null);
  const [blockData, setBlockData] = useState({
    block1Hash: "Hash: 0000d4e5f6...",
    block1Data: "Alice \u2192 Bob: 2 BTC",
    block2Prev: "Prev: 0000d4e5f6...",
    block3Prev: "Prev: 0000g7h8i9...",
    tamperedBlocks: new Set<number>(),
    brokenLinks: new Set<number>(),
  });

  // Hash demo state
  const [hashInput, setHashInput] = useState("");

  // Node network state
  const canvasRef = useRef<HTMLDivElement>(null);
  const [networkStatus, setNetworkStatus] = useState(
    "Each node independently validates every transaction"
  );
  const [nodeStates, setNodeStates] = useState<
    Map<number, "default" | "source" | "reached">
  >(() => new Map());
  const [broadcastingNodes, setBroadcastingNodes] = useState<Set<number>>(
    () => new Set()
  );
  const broadcastTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Cleanup broadcast timeouts
  useEffect(() => {
    return () => {
      broadcastTimeouts.current.forEach(clearTimeout);
    };
  }, []);

  // -- Lesson toggle --------------------------------------------------------

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
    if (!completedLessons.has(idx) && idx < 4) {
      setActiveLesson(idx + 1);
    }
  };

  // -- Quiz -----------------------------------------------------------------

  const answerQuiz = (lessonIdx: number, selectedIdx: number) => {
    if (quizAnswers.has(lessonIdx)) return;
    const correct = selectedIdx === QUIZZES[lessonIdx].correctIndex;
    setQuizAnswers((prev) => {
      const next = new Map(prev);
      next.set(lessonIdx, { selected: selectedIdx, correct });
      return next;
    });
  };

  const renderQuiz = (lessonIdx: number) => {
    const quiz = QUIZZES[lessonIdx];
    const answer = quizAnswers.get(lessonIdx);
    const letters = ["A", "B", "C", "D"];
    return (
      <div className="bc101-quiz">
        <div className="bc101-quiz-label">Check Your Understanding</div>
        <div className="bc101-quiz-question">{quiz.question}</div>
        <div className="bc101-quiz-options">
          {quiz.options.map((opt, i) => {
            let cls = "bc101-quiz-option";
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
          <div className={`bc101-quiz-feedback ${answer.correct ? "correct" : "wrong"}`}>
            {answer.correct ? quiz.feedbackCorrect : quiz.feedbackWrong}
          </div>
        )}
      </div>
    );
  };

  // -- Complete button ------------------------------------------------------

  const renderCompleteBtn = (idx: number) => {
    const done = completedLessons.has(idx);
    return (
      <button
        className={`bc101-complete-btn ${done ? "done" : "incomplete"}`}
        onClick={() => markComplete(idx)}
      >
        {done ? (
          <>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Completed
          </>
        ) : (
          <>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" strokeWidth={2} />
            </svg>
            Mark Complete
          </>
        )}
      </button>
    );
  };

  // -- Chain tamper demo ----------------------------------------------------

  const tamperChain = () => {
    if (isTampered) return;
    setIsTampered(true);

    // Phase 1: tamper block 1
    setBlockData((prev) => ({
      ...prev,
      block1Hash: "Hash: fffa9c7b21...",
      block1Data: "Alice \u2192 Bob: 200 BTC",
      tamperedBlocks: new Set([1]),
      brokenLinks: new Set(),
    }));

    // Phase 2: break link 1→2
    setTimeout(() => {
      setBlockData((prev) => ({
        ...prev,
        block2Prev: "Prev: mismatch!",
        tamperedBlocks: new Set([1, 2]),
        brokenLinks: new Set([1]),
      }));
    }, 400);

    // Phase 3: break link 2→3
    setTimeout(() => {
      setBlockData((prev) => ({
        ...prev,
        block3Prev: "Prev: mismatch!",
        tamperedBlocks: new Set([1, 2, 3]),
        brokenLinks: new Set([1, 2]),
      }));
    }, 800);

    setTimeout(() => {
      setTamperStatus({
        type: "alert",
        text: "CHAIN INVALID \u2014 Tampering with Block 1 broke the hash references in every subsequent block. All nodes would reject this chain.",
      });
    }, 1000);
  };

  const resetChain = () => {
    setIsTampered(false);
    setBlockData({
      block1Hash: "Hash: 0000d4e5f6...",
      block1Data: "Alice \u2192 Bob: 2 BTC",
      block2Prev: "Prev: 0000d4e5f6...",
      block3Prev: "Prev: 0000g7h8i9...",
      tamperedBlocks: new Set(),
      brokenLinks: new Set(),
    });
    setTamperStatus({ type: "safe", text: "Chain restored \u2014 all hash references are valid again." });
    setTimeout(() => setTamperStatus(null), 3000);
  };

  // -- Node network broadcast -----------------------------------------------

  const broadcastFromNode = useCallback(
    (nodeIndex: number) => {
      // Clear previous timeouts
      broadcastTimeouts.current.forEach(clearTimeout);
      broadcastTimeouts.current = [];

      // Reset all nodes
      setNodeStates(new Map([[nodeIndex, "source"]]));
      setBroadcastingNodes(new Set([nodeIndex]));
      setNetworkStatus(
        `Node ${NODE_POSITIONS[nodeIndex].label} broadcasting transaction...`
      );

      // Clear broadcasting animation after delay
      const clearBroadcast = setTimeout(
        () => setBroadcastingNodes(new Set()),
        1200
      );
      broadcastTimeouts.current.push(clearBroadcast);

      // BFS propagation
      const visited = new Set([nodeIndex]);
      let currentWave = NODE_CONNECTIONS.filter(
        ([a, b]) => a === nodeIndex || b === nodeIndex
      ).map(([a, b]) => (a === nodeIndex ? b : a));

      let delay = 400;

      const propagateWave = (wave: number[]) => {
        const nextWave: number[] = [];
        wave.forEach((n) => {
          if (visited.has(n)) return;
          visited.add(n);

          const t = setTimeout(() => {
            setNodeStates((prev) => {
              const next = new Map(prev);
              next.set(n, "reached");
              return next;
            });
            setBroadcastingNodes((prev) => {
              const next = new Set(prev);
              next.add(n);
              return next;
            });
            const clear = setTimeout(() => {
              setBroadcastingNodes((prev) => {
                const next = new Set(prev);
                next.delete(n);
                return next;
              });
            }, 1200);
            broadcastTimeouts.current.push(clear);
          }, delay);
          broadcastTimeouts.current.push(t);

          const neighbors = NODE_CONNECTIONS.filter(
            ([a, b]) => a === n || b === n
          )
            .map(([a, b]) => (a === n ? b : a))
            .filter((x) => !visited.has(x));
          nextWave.push(...neighbors);
        });

        delay += 400;
        if (nextWave.length > 0) {
          const t = setTimeout(() => propagateWave(nextWave), 200);
          broadcastTimeouts.current.push(t);
        } else {
          const t = setTimeout(() => {
            setNetworkStatus(
              `Transaction validated by all ${visited.size} nodes`
            );
          }, delay);
          broadcastTimeouts.current.push(t);
        }
      };

      const t = setTimeout(() => propagateWave(currentWave), 200);
      broadcastTimeouts.current.push(t);
    },
    []
  );

  // -- Render network lines & nodes -----------------------------------------

  const renderNetwork = () => {
    const w = canvasRef.current?.offsetWidth || 600;
    const h = 240;

    const lines = NODE_CONNECTIONS.map(([a, b], i) => {
      const x1 = NODE_POSITIONS[a].x * w + 18;
      const y1 = NODE_POSITIONS[a].y * h + 18;
      const x2 = NODE_POSITIONS[b].x * w + 18;
      const y2 = NODE_POSITIONS[b].y * h + 18;
      const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
      return (
        <div
          key={`line-${i}`}
          className="bc101-node-line"
          style={{
            width: `${length}px`,
            left: `${x1}px`,
            top: `${y1}px`,
            transform: `rotate(${angle}deg)`,
          }}
        />
      );
    });

    const nodes = NODE_POSITIONS.map((node, i) => {
      const state = nodeStates.get(i) || "default";
      const isBroadcasting = broadcastingNodes.has(i);
      let cls = "bc101-node";
      if (state === "source") cls += " source";
      else if (state === "reached") cls += " reached";
      if (isBroadcasting) cls += " broadcasting";
      return (
        <div
          key={`node-${i}`}
          className={cls}
          style={{
            left: `${node.x * w}px`,
            top: `${node.y * h}px`,
          }}
          onClick={() => broadcastFromNode(i)}
        >
          {node.label}
        </div>
      );
    });

    return (
      <>
        {lines}
        {nodes}
      </>
    );
  };

  // -- Lesson content -------------------------------------------------------

  const renderLessonContent = (idx: number) => {
    switch (idx) {
      // =====================================================================
      // Lesson 1: Blocks, Chains & the Append-Only Ledger
      // =====================================================================
      case 0:
        return (
          <div className="bc101-lesson-body">
            <h3>What Is a Blockchain?</h3>
            <p>
              At its core, a blockchain is a <strong>shared digital ledger</strong>{" "}
              — a record book that stores data in groups called "blocks." Each block
              is linked (chained) to the one before it, forming a continuous,
              chronological sequence. Once data is written into a block and that
              block is added to the chain, it becomes practically impossible to
              change or delete.
            </p>
            <p>
              The word "blockchain" literally describes its structure: a{" "}
              <strong>chain of blocks</strong>. But the real power isn't in the
              structure itself — it's in what the structure enables: a record that
              everyone can verify, nobody owns, and no one can alter.
            </p>

            <h3>What's Inside a Block?</h3>
            <p>Every block contains three critical pieces of information:</p>

            <div className="bc101-three-col">
              <div className="bc101-col-card">
                <h4>1. Data</h4>
                <p>
                  The actual information being recorded — in Bitcoin's case,
                  transaction records (who sent how much to whom). In Ethereum, it
                  can also include smart contract code and state changes.
                </p>
              </div>
              <div className="bc101-col-card">
                <h4>2. Own Hash</h4>
                <p>
                  A unique digital fingerprint of this block's contents. Like a
                  human fingerprint, no two blocks share the same hash. Change
                  anything inside the block, and the hash changes completely.
                </p>
              </div>
              <div className="bc101-col-card">
                <h4>3. Previous Hash</h4>
                <p>
                  The hash of the block that came before it. This is the "chain" in
                  blockchain — each block points backward to its predecessor,
                  creating an unbroken link all the way back to Block 0.
                </p>
              </div>
            </div>

            <h3>See the Chain</h3>
            <div className="bc101-chain-visual">
              <div className="bc101-chain-row">
                <div className="bc101-block genesis">
                  <div className="bc101-block-label">Block 0 (Genesis)</div>
                  <div className="bc101-block-hash">Hash: 0000a1b2c3...</div>
                  <div className="bc101-block-hash">Prev: 000000000...</div>
                  <div className="bc101-block-data">First block ever created</div>
                </div>
                <div className="bc101-chain-link">&rarr;</div>
                <div
                  className={`bc101-block ${blockData.tamperedBlocks.has(1) ? "tampered" : ""}`}
                >
                  <div className="bc101-block-label">Block 1</div>
                  <div className="bc101-block-hash">{blockData.block1Hash}</div>
                  <div className="bc101-block-hash">Prev: 0000a1b2c3...</div>
                  <div className="bc101-block-data">{blockData.block1Data}</div>
                </div>
                <div
                  className={`bc101-chain-link ${blockData.brokenLinks.has(1) ? "broken" : ""}`}
                >
                  {blockData.brokenLinks.has(1) ? "\u2717" : "\u2192"}
                </div>
                <div
                  className={`bc101-block ${blockData.tamperedBlocks.has(2) ? "tampered" : ""}`}
                >
                  <div className="bc101-block-label">Block 2</div>
                  <div className="bc101-block-hash">Hash: 0000g7h8i9...</div>
                  <div className="bc101-block-hash">{blockData.block2Prev}</div>
                  <div className="bc101-block-data">
                    Bob &rarr; Carol: 1 BTC
                  </div>
                </div>
                <div
                  className={`bc101-chain-link ${blockData.brokenLinks.has(2) ? "broken" : ""}`}
                >
                  {blockData.brokenLinks.has(2) ? "\u2717" : "\u2192"}
                </div>
                <div
                  className={`bc101-block ${blockData.tamperedBlocks.has(3) ? "tampered" : ""}`}
                >
                  <div className="bc101-block-label">Block 3</div>
                  <div className="bc101-block-hash">Hash: 0000j1k2l3...</div>
                  <div className="bc101-block-hash">{blockData.block3Prev}</div>
                  <div className="bc101-block-data">
                    Carol &rarr; Dave: 0.5 BTC
                  </div>
                </div>
              </div>

              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                {!isTampered ? (
                  <button className="bc101-tamper-btn tamper" onClick={tamperChain}>
                    Tamper with Block 1
                  </button>
                ) : (
                  <button className="bc101-tamper-btn reset" onClick={resetChain}>
                    Reset Chain
                  </button>
                )}
              </div>

              {tamperStatus && (
                <div className={`bc101-tamper-status ${tamperStatus.type}`}>
                  {tamperStatus.type === "alert" ? "\u26A0 " : "\u2713 "}
                  {tamperStatus.text}
                </div>
              )}
            </div>

            <h3>Append-Only: No Edits, No Deletes</h3>
            <p>
              A blockchain is <strong>append-only</strong>, meaning data can only be
              added to the end — never modified or removed from the middle. Think of
              it like writing in permanent ink in a notebook where every page is
              numbered and references the previous page. You can always add a new
              page, but you can't tear one out or use white-out without everyone
              noticing.
            </p>
            <p>
              This is fundamentally different from a traditional database. In a
              normal database (like one your bank uses), administrators can edit,
              overwrite, or delete records. In a blockchain, historical data is
              immutable. If a mistake is made, the only fix is to add a new
              transaction that corrects the error — the original mistake remains
              visible forever in the record.
            </p>

            <div className="bc101-info-box green">
              <div className="bc101-info-box-title">Why This Matters</div>
              Immutability creates <strong>trust without trust</strong>. You don't
              need to trust any single person or company to maintain accurate records
              because the system's design makes fraud computationally impractical.
              Every participant can independently verify the entire history from
              Block 0 to the latest block.
            </div>

            {renderQuiz(0)}
            {renderCompleteBtn(0)}
          </div>
        );

      // =====================================================================
      // Lesson 2: How Transactions Are Validated by Nodes
      // =====================================================================
      case 1:
        return (
          <div className="bc101-lesson-body">
            <h3>What Is a Node?</h3>
            <p>
              A <strong>node</strong> is any computer running the blockchain's
              software and maintaining a copy of the entire ledger. Nodes are the
              backbone of the network — they receive, validate, and relay
              transactions and blocks to each other. There is no central server.
              Instead, thousands of nodes around the world collectively enforce the
              rules.
            </p>
            <p>
              Anyone can run a node. You don't need permission, a license, or
              special hardware (for most blockchains). You just download the
              software, sync the blockchain history, and your computer begins
              participating in the network. This openness is what makes blockchains
              decentralized.
            </p>

            <h3>The Validation Process</h3>
            <div className="bc101-timeline">
              <div className="bc101-timeline-item">
                <div className="bc101-timeline-date">Step 1: Broadcast</div>
                <div className="bc101-timeline-text">
                  When you send a transaction (e.g., sending 1 BTC to someone),
                  your wallet <strong>broadcasts</strong> the transaction to the
                  nearest nodes it's connected to. Those nodes forward it to their
                  peers, and within seconds, the transaction propagates across the
                  entire global network.
                </div>
              </div>
              <div className="bc101-timeline-item">
                <div className="bc101-timeline-date">Step 2: Mempool</div>
                <div className="bc101-timeline-text">
                  Each node places the unconfirmed transaction into its{" "}
                  <strong>memory pool (mempool)</strong> — a waiting room for
                  transactions that haven't been included in a block yet. The
                  mempool acts as a queue where transactions sit until a miner
                  picks them up.
                </div>
              </div>
              <div className="bc101-timeline-item">
                <div className="bc101-timeline-date">Step 3: Validate</div>
                <div className="bc101-timeline-text">
                  Before accepting the transaction into the mempool, each node
                  independently <strong>checks</strong>: Does the sender have
                  enough funds? Is the digital signature valid? Does the
                  transaction follow all protocol rules? Has this coin already been
                  spent (double-spend check)?
                </div>
              </div>
              <div className="bc101-timeline-item">
                <div className="bc101-timeline-date">
                  Step 4: Block Inclusion
                </div>
                <div className="bc101-timeline-text">
                  A miner (or validator, depending on the blockchain) selects
                  transactions from the mempool, bundles them into a{" "}
                  <strong>candidate block</strong>, and works to add it to the
                  chain. Once successfully added, every node verifies the new block
                  independently.
                </div>
              </div>
              <div className="bc101-timeline-item">
                <div className="bc101-timeline-date">Step 5: Consensus</div>
                <div className="bc101-timeline-text">
                  Nodes that verify the block is valid{" "}
                  <strong>add it to their copy</strong> of the blockchain and begin
                  building on top of it. Nodes that find errors{" "}
                  <strong>reject</strong> the block entirely. This collective
                  agreement is called <strong>consensus</strong>.
                </div>
              </div>
            </div>

            <h3>Node Network Visualization</h3>
            <div className="bc101-network">
              <div className="bc101-network-label">
                Peer-to-Peer Network — Click any node
              </div>
              <div
                className="bc101-network-canvas"
                ref={canvasRef}
              >
                {renderNetwork()}
              </div>
              <div className="bc101-network-label">{networkStatus}</div>
            </div>

            <h3>Types of Nodes</h3>
            <div className="bc101-data-block">
              <div className="bc101-data-block-header">Node Types</div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Full Node</span>
                <span className="bc101-data-value cyan">
                  Stores entire blockchain, validates everything independently
                </span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Light Node</span>
                <span className="bc101-data-value blue">
                  Stores only block headers, relies on full nodes for details
                </span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Mining Node</span>
                <span className="bc101-data-value orange">
                  Full node that also competes to create new blocks
                </span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Archive Node</span>
                <span className="bc101-data-value purple">
                  Stores every historical state, not just current (Ethereum)
                </span>
              </div>
            </div>

            <div className="bc101-info-box blue">
              <div className="bc101-info-box-title">Why Run a Node?</div>
              Running your own node means you don't have to trust anyone else's copy
              of the blockchain. You verify everything yourself. This is the
              principle of <strong>"don't trust, verify"</strong> — a foundational
              ethos in blockchain culture. As of 2026, Bitcoin has roughly
              15,000–20,000 reachable full nodes spread across every continent.
            </div>

            <div className="bc101-info-box orange">
              <div className="bc101-info-box-title">Consensus Mechanisms</div>
              Different blockchains use different methods for nodes to agree on the
              next block. Bitcoin uses <strong>Proof of Work</strong> (miners
              compete with computational power). Ethereum uses{" "}
              <strong>Proof of Stake</strong> (validators lock up ETH as
              collateral). Both achieve the same goal — trustless agreement —
              through different means.
            </div>

            {renderQuiz(1)}
            {renderCompleteBtn(1)}
          </div>
        );

      // =====================================================================
      // Lesson 3: Hash Functions & Cryptographic Security
      // =====================================================================
      case 2:
        return (
          <div className="bc101-lesson-body">
            <h3>What Is a Hash Function?</h3>
            <p>
              A <strong>hash function</strong> is a mathematical algorithm that
              takes any input — a word, a sentence, an entire book, or even a single
              character — and produces a fixed-size output called a{" "}
              <strong>hash</strong> (or digest). Think of it as a digital blender:
              you put anything in, and it always produces exactly the same size
              smoothie. But unlike a real blender, if you put in the exact same
              ingredients, you'll get the exact same smoothie every time.
            </p>
            <p>
              Bitcoin uses <strong>SHA-256</strong> (Secure Hash Algorithm, 256-bit),
              which always outputs a 64-character hexadecimal string regardless of
              input size.
            </p>

            <h3>Try It: Live Hash Demo</h3>
            <div className="bc101-hash-demo">
              <input
                type="text"
                className="bc101-hash-input"
                placeholder="Type anything here..."
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
              />
              <div className="bc101-hash-label">SHA-256 Output (simplified)</div>
              <div className={`bc101-hash-output ${hashInput ? "" : "empty"}`}>
                {hashInput
                  ? simpleHash(hashInput)
                  : "Enter text above to see its hash..."}
              </div>
            </div>

            <h3>Five Critical Properties</h3>

            <div className="bc101-info-box cyan">
              <div className="bc101-info-box-title">1. Deterministic</div>
              The same input <strong>always</strong> produces the same output. Hash
              the word "hello" a million times and you'll get the same 64-character
              result every single time. This predictability is what makes
              verification possible.
            </div>

            <div className="bc101-info-box blue">
              <div className="bc101-info-box-title">2. Avalanche Effect</div>
              Change even a single character in the input and the output changes{" "}
              <strong>completely</strong>. "Hello" and "hello" (just a capital H
              difference) produce wildly different hashes with zero resemblance to
              each other. There's no pattern, no way to predict how the output will
              change.
            </div>

            <div className="bc101-info-box green">
              <div className="bc101-info-box-title">3. One-Way Function</div>
              You can easily compute a hash from an input, but it's{" "}
              <strong>computationally infeasible</strong> to reverse-engineer the
              original input from a hash. Knowing the output tells you nothing about
              the input. It would take longer than the age of the universe to
              brute-force reverse a SHA-256 hash.
            </div>

            <div className="bc101-info-box purple">
              <div className="bc101-info-box-title">4. Collision Resistant</div>
              It's practically impossible to find two different inputs that produce
              the <strong>same hash</strong>. SHA-256 has 2{"\u00B2\u2075\u2076"}{" "}
              possible outputs — that's more possibilities than atoms in the
              observable universe. The probability of a collision is so small it's
              effectively zero.
            </div>

            <div className="bc101-info-box orange">
              <div className="bc101-info-box-title">5. Fixed Output Size</div>
              Whether you hash a single letter or the entire contents of Wikipedia,
              the output is <strong>always exactly 256 bits</strong> (64 hex
              characters). This uniformity is essential for blockchain's data
              structure — every block hash is the same size, keeping the chain
              consistent.
            </div>

            <h3>Avalanche Effect in Action</h3>
            <div className="bc101-data-block">
              <div className="bc101-data-block-header">
                Same word, tiny changes
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Input: "hello"</span>
                <span className="bc101-data-value" style={{ fontSize: "0.65rem" }}>
                  2cf24dba5fb0a30e26e83b2ac5b9e29e...
                </span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Input: "Hello"</span>
                <span className="bc101-data-value red" style={{ fontSize: "0.65rem" }}>
                  185f8db32271fe25f561a6fc938b2e26...
                </span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Input: "hello!"</span>
                <span className="bc101-data-value red" style={{ fontSize: "0.65rem" }}>
                  ce06092fb948d9ffac7d1a376e404b26...
                </span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label" style={{ color: "var(--bc-cyan)" }}>
                  Characters changed
                </span>
                <span className="bc101-data-value red">
                  100% different each time
                </span>
              </div>
            </div>

            <h3>How Hashing Secures the Blockchain</h3>
            <p>
              Every block's hash is calculated from its contents plus the previous
              block's hash. This creates a <strong>cryptographic chain</strong> where
              altering any block invalidates every block after it. An attacker would
              need to recalculate the hash of the tampered block and every subsequent
              block — all while outpacing the entire legitimate network. On Bitcoin,
              this would require more computing power than exists on Earth.
            </p>

            <div className="bc101-stats-row">
              <div className="bc101-stat">
                <div className="bc101-stat-value">2{"\u00B2\u2075\u2076"}</div>
                <div className="bc101-stat-label">Possible SHA-256 outputs</div>
              </div>
              <div className="bc101-stat">
                <div className="bc101-stat-value">64</div>
                <div className="bc101-stat-label">Hex characters per hash</div>
              </div>
              <div className="bc101-stat">
                <div className="bc101-stat-value">0%</div>
                <div className="bc101-stat-label">Chance of reversal</div>
              </div>
            </div>

            {renderQuiz(2)}
            {renderCompleteBtn(2)}
          </div>
        );

      // =====================================================================
      // Lesson 4: Decentralization vs. Centralized Databases
      // =====================================================================
      case 3:
        return (
          <div className="bc101-lesson-body">
            <h3>The Core Difference</h3>
            <p>
              The most important distinction in blockchain isn't the technology
              itself — it's the <strong>power structure</strong>. In a centralized
              system, one entity controls the data. In a decentralized system,
              control is distributed across many independent participants. This isn't
              just an engineering choice; it's a philosophical one about who you
              trust with your data, your money, and your digital life.
            </p>

            <h3>Side by Side</h3>
            <div className="bc101-compare-grid">
              <div className="bc101-compare-card">
                <h4>Centralized Database</h4>
                <ul>
                  <li>Single entity controls read/write access</li>
                  <li>Data stored on company-owned servers</li>
                  <li>Admins can modify or delete records</li>
                  <li>Fast performance (one location)</li>
                  <li>Single point of failure</li>
                  <li>Must trust the operator</li>
                  <li>Examples: Banks, Google, Meta</li>
                </ul>
              </div>
              <div className="bc101-compare-card">
                <h4>Decentralized Blockchain</h4>
                <ul>
                  <li>No single entity has control</li>
                  <li>Data replicated across thousands of nodes</li>
                  <li>Records are immutable once confirmed</li>
                  <li>Slower (global consensus required)</li>
                  <li>No single point of failure</li>
                  <li>Trust the math, not an operator</li>
                  <li>Examples: Bitcoin, Ethereum</li>
                </ul>
              </div>
            </div>

            <h3>Why Centralization Is Risky</h3>
            <p>
              Centralized systems have a fundamental vulnerability: they require you
              to <strong>trust the operator</strong>. This creates several risks that
              blockchain was designed to eliminate.
            </p>

            <div className="bc101-info-box orange">
              <div className="bc101-info-box-title">Censorship</div>
              A centralized operator can freeze your account, deny your transaction,
              or remove your data without your consent. In 2022, Canadian
              authorities froze bank accounts of protesters. On a blockchain, no
              government or company can freeze your wallet — only you hold the keys.
            </div>

            <div className="bc101-info-box cyan">
              <div className="bc101-info-box-title">
                Single Point of Failure
              </div>
              When a centralized server goes down, everything goes down with it. AWS
              outages have taken large portions of the internet offline. Bitcoin's
              network has maintained <strong>99.99% uptime</strong> since 2009
              because there's no central server to fail — if some nodes go offline,
              the rest keep running.
            </div>

            <div className="bc101-info-box purple">
              <div className="bc101-info-box-title">Data Manipulation</div>
              A centralized database admin can alter records silently. You trust your
              bank's ledger shows your actual balance, but you have no way to verify
              it independently. On a blockchain, you can download the entire history
              and verify every transaction yourself.
            </div>

            <h3>The Tradeoffs</h3>
            <p>
              Decentralization isn't free. It comes with real costs that explain why
              not everything belongs on a blockchain.
            </p>

            <div className="bc101-data-block">
              <div className="bc101-data-block-header">
                Blockchain vs. Traditional DB
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Speed</span>
                <span className="bc101-data-value red">Slower (consensus takes time)</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Cost</span>
                <span className="bc101-data-value red">Transactions cost fees</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Storage</span>
                <span className="bc101-data-value red">Data replicated across thousands of nodes</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Privacy</span>
                <span className="bc101-data-value red">Public chains are transparent by default</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Censorship Resistance</span>
                <span className="bc101-data-value green">Blockchain wins definitively</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Trust Requirements</span>
                <span className="bc101-data-value green">Zero trust needed (trustless)</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Resilience</span>
                <span className="bc101-data-value green">No single point of failure</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Auditability</span>
                <span className="bc101-data-value green">Anyone can verify everything</span>
              </div>
            </div>

            <div className="bc101-info-box green">
              <div className="bc101-info-box-title">
                The Right Tool for the Job
              </div>
              Blockchains are ideal when you need{" "}
              <strong>
                trustless coordination between parties who don't trust each other
              </strong>{" "}
              — financial transactions, ownership records, governance votes, supply
              chain verification. For applications where you already trust the
              operator (your personal notes, internal company databases, streaming
              services), a centralized database is faster, cheaper, and perfectly
              fine.
            </div>

            {renderQuiz(3)}
            {renderCompleteBtn(3)}
          </div>
        );

      // =====================================================================
      // Lesson 5: Public vs. Private Blockchains
      // =====================================================================
      case 4:
        return (
          <div className="bc101-lesson-body">
            <h3>Not All Blockchains Are Equal</h3>
            <p>
              When most people hear "blockchain," they think of Bitcoin or Ethereum —
              open networks anyone can join. But there's a whole spectrum of
              blockchain designs, each optimized for different use cases. The biggest
              distinction is between <strong>public (permissionless)</strong> and{" "}
              <strong>private (permissioned)</strong> blockchains.
            </p>

            <h3>Public Blockchains (Permissionless)</h3>
            <p>
              A public blockchain is <strong>completely open</strong>. Anyone can
              read the data, submit transactions, and participate in consensus
              (mining or validating) without asking for permission. There's no
              gatekeeper, no application process, no identity verification required
              to participate.
            </p>

            <div className="bc101-data-block">
              <div className="bc101-data-block-header">
                Public Blockchain Characteristics
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Access</span>
                <span className="bc101-data-value green">Open to everyone, globally</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Identity</span>
                <span className="bc101-data-value cyan">Pseudonymous (wallet addresses)</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Consensus</span>
                <span className="bc101-data-value cyan">Proof of Work / Proof of Stake</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Transparency</span>
                <span className="bc101-data-value green">All transactions publicly visible</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Governance</span>
                <span className="bc101-data-value cyan">Community-driven</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Speed</span>
                <span className="bc101-data-value orange">Slower (global consensus)</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Examples</span>
                <span className="bc101-data-value">Bitcoin, Ethereum, Solana</span>
              </div>
            </div>

            <h3>Private Blockchains (Permissioned)</h3>
            <p>
              A private blockchain restricts who can participate. You need{" "}
              <strong>invitation or approval</strong> to join the network, read data,
              or submit transactions. These are typically run by a company or
              consortium of organizations that want blockchain's data integrity
              benefits without the openness.
            </p>

            <div className="bc101-data-block">
              <div className="bc101-data-block-header" style={{ color: "var(--bc-purple)" }}>
                Private Blockchain Characteristics
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Access</span>
                <span className="bc101-data-value red">Restricted to approved participants</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Identity</span>
                <span className="bc101-data-value purple">Known identities (KYC required)</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Consensus</span>
                <span className="bc101-data-value purple">PBFT, Raft, or authority-based</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Transparency</span>
                <span className="bc101-data-value red">Only visible to members</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Governance</span>
                <span className="bc101-data-value purple">Controlled by operator/consortium</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Speed</span>
                <span className="bc101-data-value green">Much faster (fewer nodes)</span>
              </div>
              <div className="bc101-data-row">
                <span className="bc101-data-label">Examples</span>
                <span className="bc101-data-value">Hyperledger Fabric, Corda, Quorum</span>
              </div>
            </div>

            <h3>The Hybrid: Consortium Blockchains</h3>
            <p>
              Between public and private sits the{" "}
              <strong>consortium blockchain</strong> — a semi-decentralized model
              where a group of organizations (not one single entity) collectively
              operates the network. Each member runs a node and participates in
              consensus, but the general public cannot join. Think of it as a shared
              private ledger between companies that need to cooperate but don't fully
              trust each other.
            </p>

            <div className="bc101-info-box amber">
              <div className="bc101-info-box-title">Real-World Example</div>
              Supply chain tracking is a classic consortium use case. A
              manufacturer, shipper, customs authority, and retailer might share a
              blockchain to track a product from factory to shelf. Each party adds
              data at their stage, and all parties can verify the full journey. No
              single company controls the record, but the public doesn't need access
              either.
            </div>

            <h3>When to Use Each</h3>
            <div className="bc101-compare-grid">
              <div className="bc101-compare-card">
                <h4>Use Public When</h4>
                <ul>
                  <li>You need censorship resistance</li>
                  <li>Global, permissionless access matters</li>
                  <li>Trust must be minimized completely</li>
                  <li>The community should govern the protocol</li>
                  <li>Transparency and auditability are priorities</li>
                  <li>Building DeFi, NFTs, DAOs, or open finance</li>
                </ul>
              </div>
              <div className="bc101-compare-card">
                <h4>Use Private When</h4>
                <ul>
                  <li>Participants are known and pre-approved</li>
                  <li>Data privacy is a regulatory requirement</li>
                  <li>High transaction speed is essential</li>
                  <li>The use case is within an organization</li>
                  <li>Compliance (HIPAA, GDPR) restricts data sharing</li>
                  <li>Supply chain, healthcare, enterprise finance</li>
                </ul>
              </div>
            </div>

            <div className="bc101-info-box green">
              <div className="bc101-info-box-title">The DeFi Perspective</div>
              Every protocol in the <strong>Oeconomia ecosystem</strong> — Alluria,
              Eloqura, Artivya, Iridescia, and Oeconomia governance — runs on a
              public blockchain. This is intentional: DeFi's entire value
              proposition depends on being permissionless, transparent, and
              censorship-resistant. If someone could shut down or censor an Alluria
              vault or an Eloqura swap, it would defeat the purpose of decentralized
              finance.
            </div>

            <div className="bc101-info-box blue">
              <div className="bc101-info-box-title">A Common Misconception</div>
              Private blockchains are sometimes criticized as "just a database with
              extra steps." There's truth in this. If one organization controls all
              the nodes, the immutability guarantee is weakened — the operator could
              theoretically collude to rewrite history. The value of a private
              blockchain comes when <strong>multiple organizations</strong> share
              control, creating mutual accountability without a single administrator.
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
    <div className="bc101 space-y-4">
      {/* Progress Bar */}
      <div className="bc101-progress">
        <div className="bc101-progress-steps">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={`bc101-progress-step ${completedLessons.has(i) ? "done" : ""}`}
            />
          ))}
        </div>
        <div className="bc101-progress-text">
          {completedCount} of 5 complete
        </div>
      </div>

      {/* Accordion Lessons */}
      {LESSON_TITLES.map((title, idx) => (
        <div key={idx} className="bc101-lesson">
          <div className="bc101-lesson-header" onClick={() => toggleLesson(idx)}>
            <div
              className={`bc101-lesson-num ${completedLessons.has(idx) ? "completed" : ""}`}
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
            <div className="bc101-lesson-title">{title}</div>
            <svg
              className={`bc101-lesson-chevron ${activeLesson === idx ? "open" : ""}`}
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
        <div className="bc101-info-box green" style={{ textAlign: "center" }}>
          <div className="bc101-info-box-title">Lesson Complete!</div>
          You've completed all 5 sections of Blockchain 101. You now understand
          how blocks form chains, how nodes validate transactions, how hashing
          secures the network, and the differences between public and private
          blockchains. Ready for the next lesson?
        </div>
      )}
    </div>
  );
}
