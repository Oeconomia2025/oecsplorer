// ============================================================
// Setting Up MetaMask — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./metamask.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "Installing MetaMask on Chrome or Firefox", meta: "5 min read \u00B7 Setup" },
  { num: 2, title: "Creating a Wallet and Securing Your Seed Phrase", meta: "7 min read \u00B7 Security" },
  { num: 3, title: "Adding the Sepolia Testnet Network", meta: "5 min read \u00B7 Configuration" },
  { num: 4, title: "Getting Testnet ETH from a Faucet", meta: "5 min read \u00B7 Resources" },
  { num: 5, title: "Connecting MetaMask to a dApp", meta: "6 min read \u00B7 Interaction" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "Where should you store your seed phrase?",
    options: [
      { letter: "A", text: "In a notes app on your phone", correct: false },
      { letter: "B", text: "In a screenshot saved to your cloud drive", correct: false },
      { letter: "C", text: "On paper in a secure physical location", correct: true },
      { letter: "D", text: "In a text file on your desktop", correct: false },
    ],
    correctMsg: "Correct! Writing your seed phrase on paper and storing it in a secure physical location (like a safe) keeps it offline and away from hackers.",
    wrongMsg: "Not quite \u2014 digital storage (phones, cloud, desktops) can be hacked. The safest method is writing it on paper and storing it in a secure physical location.",
  },
  2: {
    question: "What is a seed phrase used for?",
    options: [
      { letter: "A", text: "To log into MetaMask on different devices", correct: false },
      { letter: "B", text: "To recover your wallet if you lose access to your device", correct: true },
      { letter: "C", text: "To speed up your transactions", correct: false },
      { letter: "D", text: "To verify your identity with the Ethereum Foundation", correct: false },
    ],
    correctMsg: "Correct! Your seed phrase is the master backup. If your device is lost, stolen, or broken, the seed phrase lets you restore your wallet and all its accounts on a new device.",
    wrongMsg: "Not quite \u2014 the primary purpose of a seed phrase is to recover your wallet if you lose access to your device. It regenerates all your private keys.",
  },
  3: {
    question: "What is the Sepolia testnet used for?",
    options: [
      { letter: "A", text: "Mining real ETH at a lower difficulty", correct: false },
      { letter: "B", text: "Testing blockchain applications without real money", correct: true },
      { letter: "C", text: "Storing NFTs for free", correct: false },
      { letter: "D", text: "Running a private blockchain", correct: false },
    ],
    correctMsg: "Correct! Sepolia is a test network where developers and users can experiment with smart contracts and dApps using free test ETH, with zero financial risk.",
    wrongMsg: "Not quite \u2014 Sepolia is a testnet specifically designed for testing blockchain applications without real money. Test ETH has no monetary value.",
  },
  4: {
    question: "Why do testnet faucets exist?",
    options: [
      { letter: "A", text: "To sell test ETH to developers", correct: false },
      { letter: "B", text: "To convert real ETH into test ETH", correct: false },
      { letter: "C", text: "To give developers free test ETH for development and testing", correct: true },
      { letter: "D", text: "To mine new blocks on the testnet", correct: false },
    ],
    correctMsg: "Correct! Faucets distribute free test ETH so developers can deploy contracts, test transactions, and users can try dApps \u2014 all without spending real money.",
    wrongMsg: "Not quite \u2014 faucets exist specifically to distribute free test ETH to developers and users for development and testing purposes.",
  },
  5: {
    question: "What information does a dApp receive when you connect your wallet?",
    options: [
      { letter: "A", text: "Your private key and seed phrase", correct: false },
      { letter: "B", text: "Your public address only", correct: true },
      { letter: "C", text: "Your full transaction history and balances", correct: false },
      { letter: "D", text: "Your MetaMask password", correct: false },
    ],
    correctMsg: "Correct! When you connect, the dApp only receives your public address. Your private key and seed phrase never leave MetaMask. The dApp can see your address and request you sign transactions, but it cannot access your keys.",
    wrongMsg: "Not quite \u2014 a dApp only receives your public address when you connect. Your private key and seed phrase are never shared.",
  },
};

export default function MetaMaskContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Wallet Connection Simulator state
  const [simStep, setSimStep] = useState(0); // 0=idle, 1=clicked, 2=popup, 3=approved, 4=connected

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

  // Simulator advance
  const advanceSim = useCallback(() => {
    setSimStep((prev) => {
      if (prev >= 4) return prev;
      return prev + 1;
    });
  }, []);

  const resetSim = useCallback(() => {
    setSimStep(0);
  }, []);

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="mm101-quiz-section">
        <div className="mm101-quiz-title">Check Your Understanding</div>
        <div className="mm101-quiz-question">{q.question}</div>
        <div className="mm101-quiz-options">
          {q.options.map((opt) => {
            let cls = "mm101-quiz-option";
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
          <div className={`mm101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  const SIM_STEPS = [
    { icon: "\uD83D\uDDB1\uFE0F", label: "Click Connect" },
    { icon: "\uD83E\uDD8A", label: "MetaMask Popup" },
    { icon: "\u2705", label: "User Approves" },
    { icon: "\uD83D\uDD17", label: "Connected!" },
  ];

  return (
    <div className="mm101">
      {/* Progress bar */}
      <div className="mm101-progress">
        <div className="mm101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`mm101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="mm101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — Installing MetaMask on Chrome or Firefox
          ============================================================ */}
      <div className={`mm101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="mm101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="mm101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="mm101-lesson-header-text">
            <div className="mm101-lesson-title">Installing MetaMask on Chrome or Firefox</div>
            <div className="mm101-lesson-meta"><span>5 min read</span><span>Setup</span></div>
          </div>
          <div className="mm101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="mm101-lesson-content">
          <div className="mm101-lesson-body">
            <h3>Your Gateway to Web3</h3>
            <p>
              <strong>MetaMask</strong> is the most popular cryptocurrency wallet and browser extension in the world, used by over 30 million people. It acts as your identity, your bank account, and your passport in the decentralized web. Without a wallet like MetaMask, you cannot interact with any dApp, swap tokens, provide liquidity, or participate in governance.
            </p>
            <p>
              MetaMask is available as a <strong>browser extension</strong> for Chrome, Firefox, Brave, and Edge, as well as a <strong>mobile app</strong> for iOS and Android. For this guide, we will focus on the browser extension, which provides the smoothest experience when interacting with Oeconomia protocols like Eloqura and Alluria.
            </p>

            <h3>Step-by-Step Installation</h3>
            <p>
              <strong>Step 1:</strong> Open your browser (Chrome or Firefox) and navigate to <code>metamask.io</code>. Always type the URL directly or use a bookmark you have verified. Never click links from emails, DMs, or search ads, as phishing sites impersonate MetaMask frequently.
            </p>
            <p>
              <strong>Step 2:</strong> Click the "Download" button on the official site. You will be redirected to your browser's extension store (Chrome Web Store or Firefox Add-ons). Verify the publisher is "metamask.io" and the extension has millions of users.
            </p>
            <p>
              <strong>Step 3:</strong> Click "Add to Chrome" (or "Add to Firefox"). The browser will ask for permissions. MetaMask needs to read and change data on websites you visit so it can detect when a dApp requests a wallet connection.
            </p>
            <p>
              <strong>Step 4:</strong> After installation, you will see the MetaMask fox icon in your browser toolbar. Click it to begin wallet setup. Pin the extension to your toolbar for easy access.
            </p>

            <div className="mm101-compare-grid">
              <div className="mm101-compare-card">
                <h4>Chrome / Brave / Edge</h4>
                <ul>
                  <li>Install from Chrome Web Store</li>
                  <li>Most popular, best dApp compatibility</li>
                  <li>Works with all Chromium browsers</li>
                  <li>Largest community and support</li>
                </ul>
              </div>
              <div className="mm101-compare-card">
                <h4>Firefox</h4>
                <ul>
                  <li>Install from Firefox Add-ons</li>
                  <li>Strong privacy features built in</li>
                  <li>Slightly different UI, same functionality</li>
                  <li>Good alternative for privacy-focused users</li>
                </ul>
              </div>
            </div>

            <div className="mm101-info-box blue">
              <div className="mm101-info-box-label">Why MetaMask Specifically?</div>
              <p>
                While other wallets exist (Coinbase Wallet, Trust Wallet, Rabby), MetaMask has the widest dApp compatibility, the largest developer community, and the most extensive documentation. Nearly every Web3 tutorial and protocol assumes MetaMask. For learning and interacting with Oeconomia, it is the recommended choice.
              </p>
            </div>

            <div className="mm101-info-box red">
              <div className="mm101-info-box-label">Security Warning</div>
              <p>
                <strong>Only download MetaMask from metamask.io or your browser's official extension store.</strong> Fake MetaMask extensions have stolen millions of dollars. Never download wallet software from third-party sites, Telegram groups, or links in emails. Always verify the URL and publisher before installing.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`mm101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Creating a Wallet and Securing Your Seed Phrase
          ============================================================ */}
      <div className={`mm101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="mm101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="mm101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="mm101-lesson-header-text">
            <div className="mm101-lesson-title">Creating a Wallet and Securing Your Seed Phrase</div>
            <div className="mm101-lesson-meta"><span>7 min read</span><span>Security</span></div>
          </div>
          <div className="mm101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="mm101-lesson-content">
          <div className="mm101-lesson-body">
            <h3>Creating Your First Wallet</h3>
            <p>
              After installing MetaMask, click the fox icon in your toolbar. You will be presented with two options: <strong>"Create a new wallet"</strong> or <strong>"Import an existing wallet."</strong> Since this is your first time, select "Create a new wallet."
            </p>
            <p>
              <strong>Step 1:</strong> Agree to the terms of use after reading them. MetaMask will ask if you want to share anonymous usage data. This is optional and does not affect your wallet's security or functionality.
            </p>
            <p>
              <strong>Step 2:</strong> Create a strong password. This password is used to unlock MetaMask on your local device only. It is <strong>not</strong> the same as your seed phrase. If you forget this password, you can always restore your wallet using your seed phrase.
            </p>
            <p>
              <strong>Step 3:</strong> MetaMask will now display your <strong>Secret Recovery Phrase</strong> (seed phrase). This is the single most important piece of information in your crypto journey. It is a sequence of 12 random words that acts as the master key to your wallet.
            </p>

            <div className="mm101-info-box red">
              <div className="mm101-info-box-label">Critical: Seed Phrase Security</div>
              <p>
                Your seed phrase is the <strong>only way</strong> to recover your wallet. If you lose it, your funds are gone forever. If someone else gets it, they can steal everything. <strong>Write it down on paper. Store it in a safe or lockbox. Never type it into any website. Never share it with anyone. Never take a screenshot or photo of it. Never store it digitally.</strong> MetaMask, Oeconomia, and no legitimate project will ever ask for your seed phrase.
              </p>
            </div>

            <h3>Verifying Your Seed Phrase</h3>
            <p>
              After writing down your seed phrase, MetaMask will ask you to confirm it by selecting the words in the correct order. This verification step ensures you actually recorded the phrase and did not just skip past it. Take your time and get it right.
            </p>
            <p>
              Once confirmed, your wallet is created. You now have an Ethereum address (starting with <code>0x</code>) that you can use to receive ETH and tokens. This address is public and safe to share. Think of it like your email address: anyone can send to it, but only you can access what arrives.
            </p>

            <div className="mm101-info-box amber">
              <div className="mm101-info-box-label">Password vs. Seed Phrase</div>
              <p>
                Your <strong>password</strong> locks MetaMask on your device, like a screen lock on your phone. Your <strong>seed phrase</strong> is the master key to your wallet itself. If you get a new computer, you need the seed phrase to import your wallet. The password only works on the device where you set it.
              </p>
            </div>

            <div className="mm101-three-col">
              <div className="mm101-col-card">
                <h4>Do</h4>
                <p>Write seed phrase on paper. Store in a safe. Make 2 copies in separate locations. Test recovery before depositing large amounts.</p>
              </div>
              <div className="mm101-col-card">
                <h4>Don't</h4>
                <p>Screenshot it. Store in notes app. Email it to yourself. Save it in a text file. Store it on cloud drives. Type it into websites.</p>
              </div>
              <div className="mm101-col-card">
                <h4>Advanced</h4>
                <p>Stamp seed phrase on metal for fire/water resistance. Use a hardware wallet for large holdings. Consider multi-sig for extra security.</p>
              </div>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`mm101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Adding the Sepolia Testnet Network
          ============================================================ */}
      <div className={`mm101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="mm101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="mm101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="mm101-lesson-header-text">
            <div className="mm101-lesson-title">Adding the Sepolia Testnet Network</div>
            <div className="mm101-lesson-meta"><span>5 min read</span><span>Configuration</span></div>
          </div>
          <div className="mm101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="mm101-lesson-content">
          <div className="mm101-lesson-body">
            <h3>What Are Testnets?</h3>
            <p>
              A <strong>testnet</strong> is a separate blockchain network that mirrors the functionality of the main Ethereum network (mainnet) but uses tokens with no real-world value. Think of it as a sandbox or practice environment. Developers deploy and test their smart contracts on testnets before going live, and users can experiment with dApps risk-free.
            </p>
            <p>
              <strong>Sepolia</strong> is Ethereum's primary testnet for application developers. It was launched in October 2022 and has become the recommended testnet after Goerli was deprecated. All Oeconomia protocols (Eloqura, Alluria, Artivya) are deployed on Sepolia for testing.
            </p>

            <h3>Enabling Sepolia in MetaMask</h3>
            <p>
              <strong>Step 1:</strong> Open MetaMask and click the network dropdown at the top (it likely says "Ethereum Mainnet").
            </p>
            <p>
              <strong>Step 2:</strong> Click <strong>"Show test networks"</strong> at the bottom of the dropdown. If you do not see this option, go to Settings {"\u2192"} Advanced {"\u2192"} toggle "Show test networks" to ON.
            </p>
            <p>
              <strong>Step 3:</strong> Select <strong>"Sepolia"</strong> from the network list. MetaMask will automatically switch to the Sepolia network. You will see "Sepolia test network" displayed at the top.
            </p>
            <p>
              <strong>Step 4:</strong> Your wallet address remains the same across all networks. The same <code>0x...</code> address works on mainnet, Sepolia, Arbitrum, and any other EVM network. However, your balances are network-specific: mainnet ETH and Sepolia ETH are completely separate.
            </p>

            <div className="mm101-data-block">
              <div className="mm101-data-section-label">Sepolia Network Details</div>
              <div className="mm101-data-row"><span className="mm101-data-label">Network Name</span><span className="mm101-data-value">Sepolia</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">Chain ID</span><span className="mm101-data-value cyan">11155111</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">Currency Symbol</span><span className="mm101-data-value">SepoliaETH</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">RPC URL</span><span className="mm101-data-value blue">https://rpc.sepolia.org</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">Block Explorer</span><span className="mm101-data-value blue">https://sepolia.etherscan.io</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">Block Time</span><span className="mm101-data-value">~12 seconds</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">Consensus</span><span className="mm101-data-value green">Proof of Stake</span></div>
            </div>

            <div className="mm101-info-box cyan">
              <div className="mm101-info-box-label">Why Sepolia?</div>
              <p>
                Sepolia uses the same Proof of Stake consensus as mainnet Ethereum, making it the most accurate testing environment. It has reliable uptime, a controlled validator set, and active faucets. Goerli (the previous popular testnet) was deprecated in early 2024, and Sepolia is now the recommended testnet for both developers and users.
              </p>
            </div>

            <div className="mm101-info-box">
              <div className="mm101-info-box-label">Same Address, Different Networks</div>
              <p>
                Your Ethereum address works on every EVM-compatible network. This means your <code>0x...</code> address is the same on Mainnet, Sepolia, Arbitrum, Polygon, and more. However, assets on one network do not exist on another. Sending real ETH to your address does not give you Sepolia ETH, and vice versa.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`mm101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Getting Testnet ETH from a Faucet
          ============================================================ */}
      <div className={`mm101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="mm101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="mm101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="mm101-lesson-header-text">
            <div className="mm101-lesson-title">Getting Testnet ETH from a Faucet</div>
            <div className="mm101-lesson-meta"><span>5 min read</span><span>Resources</span></div>
          </div>
          <div className="mm101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="mm101-lesson-content">
          <div className="mm101-lesson-body">
            <h3>What Is a Faucet?</h3>
            <p>
              A <strong>faucet</strong> is a web application that distributes free testnet tokens to users. The name comes from the idea of a dripping faucet: small amounts given freely. Faucets exist because testnet tokens have no real value, but you still need them to pay gas fees when interacting with smart contracts on the testnet.
            </p>
            <p>
              Without testnet ETH, you cannot send transactions on Sepolia. Every action on the blockchain requires a small gas fee, even on testnets. Faucets ensure that anyone can get started with development and testing at zero cost.
            </p>

            <h3>How to Get Sepolia ETH</h3>
            <p>
              <strong>Step 1:</strong> Copy your wallet address from MetaMask. Click on your account name or the address display at the top of MetaMask. This copies your full <code>0x...</code> address to your clipboard.
            </p>
            <p>
              <strong>Step 2:</strong> Visit one of the faucets listed below. Paste your address into the input field. Some faucets require you to log in with a GitHub or Google account to prevent abuse.
            </p>
            <p>
              <strong>Step 3:</strong> Click "Request" or "Send" and wait. The testnet ETH will arrive in your MetaMask wallet within a few seconds to a minute. You can verify the transaction on <code>sepolia.etherscan.io</code>.
            </p>

            <div className="mm101-data-block">
              <div className="mm101-data-section-label">Sepolia Faucet Comparison</div>
              <div className="mm101-data-row"><span className="mm101-data-label">Google Cloud Faucet</span><span className="mm101-data-value green">0.05 ETH/day \u00B7 Requires Google login</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">Alchemy Faucet</span><span className="mm101-data-value green">0.5 ETH/day \u00B7 Requires Alchemy account</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">Infura Faucet</span><span className="mm101-data-value green">0.5 ETH/day \u00B7 Requires Infura account</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">QuickNode Faucet</span><span className="mm101-data-value green">0.1 ETH/day \u00B7 Requires QuickNode account</span></div>
              <div className="mm101-data-row"><span className="mm101-data-label">sepoliafaucet.com</span><span className="mm101-data-value amber">0.5 ETH/day \u00B7 Requires mainnet ETH verification</span></div>
            </div>

            <div className="mm101-info-box green">
              <div className="mm101-info-box-label">Tip: Get Enough for Testing</div>
              <p>
                For testing Oeconomia protocols, you will need testnet ETH for gas fees and for interacting with contracts (e.g., swapping, providing liquidity, minting tokens). Request from multiple faucets if one gives you a small amount. Having <strong>0.5-1.0 SepoliaETH</strong> is enough for extensive testing.
              </p>
            </div>

            <div className="mm101-info-box amber">
              <div className="mm101-info-box-label">Faucet Limitations</div>
              <p>
                Faucets rate-limit requests to prevent hoarding. Most allow one request per day per address. Some require identity verification (Google, GitHub, or holding mainnet ETH) to reduce bot abuse. If a faucet is empty or slow, try another one. Testnet ETH has <strong>zero real-world value</strong> and cannot be sold or traded for real money.
              </p>
            </div>

            <div className="mm101-stats-row">
              <div className="mm101-stat-card"><div className="mm101-stat-value">$0</div><div className="mm101-stat-label">Cost of testnet ETH</div></div>
              <div className="mm101-stat-card"><div className="mm101-stat-value">~12s</div><div className="mm101-stat-label">Block confirmation time</div></div>
              <div className="mm101-stat-card"><div className="mm101-stat-value">5+</div><div className="mm101-stat-label">Available Sepolia faucets</div></div>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`mm101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Connecting MetaMask to a dApp
          ============================================================ */}
      <div className={`mm101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="mm101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="mm101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="mm101-lesson-header-text">
            <div className="mm101-lesson-title">Connecting MetaMask to a dApp</div>
            <div className="mm101-lesson-meta"><span>6 min read</span><span>Interaction</span></div>
          </div>
          <div className="mm101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="mm101-lesson-content">
          <div className="mm101-lesson-body">
            <h3>How Wallet Connection Works</h3>
            <p>
              When you visit a decentralized application (dApp), you will see a <strong>"Connect Wallet"</strong> button. Clicking it triggers a request from the dApp to your MetaMask extension. MetaMask opens a popup asking for your permission to share your <strong>public address</strong> with the site. This is the Web3 equivalent of "logging in."
            </p>
            <p>
              Unlike traditional logins with usernames and passwords, wallet connection is <strong>permissionless and non-custodial</strong>. The dApp never receives your private key or seed phrase. It only learns your public address, which it can use to display your balances, show your transaction history, and request you sign transactions. You remain in full control at all times.
            </p>

            <h3>The Connection Flow</h3>
            <p>
              <strong>Step 1:</strong> Visit the dApp (e.g., Eloqura at eloqura.oeconomia.io) and click "Connect Wallet."
            </p>
            <p>
              <strong>Step 2:</strong> MetaMask opens a popup showing the site URL requesting access. Verify the URL is correct. This is a critical security check: phishing sites try to look identical to real dApps but have slightly different URLs.
            </p>
            <p>
              <strong>Step 3:</strong> Click "Connect" in the MetaMask popup. Choose which accounts to share (you can select one or multiple).
            </p>
            <p>
              <strong>Step 4:</strong> The dApp now displays your connected address, typically truncated (e.g., <code>0x1234...abcd</code>). You are now connected and can interact with the protocol.
            </p>

            <h3>Try It: Wallet Connection Simulator</h3>
            <div className="mm101-wallet-sim">
              <div className="mm101-wallet-sim-title">Wallet Connection Flow</div>
              <div className="mm101-wallet-sim-steps">
                {SIM_STEPS.map((step, i) => (
                  <span key={i} style={{ display: "contents" }}>
                    <div className={`mm101-wallet-sim-step${simStep === i + 1 ? " active" : ""}${simStep > i + 1 ? " done" : ""}`}>
                      <span className="mm101-wallet-sim-step-icon">{step.icon}</span>
                      <span className="mm101-wallet-sim-step-label">{step.label}</span>
                    </div>
                    {i < SIM_STEPS.length - 1 && <span className="mm101-wallet-sim-arrow">{"\u2192"}</span>}
                  </span>
                ))}
              </div>
              <div className={`mm101-wallet-sim-status ${simStep >= 4 ? "connected" : "pending"}`}>
                {simStep === 0 && "Click the button below to start the connection flow"}
                {simStep === 1 && "User clicked \"Connect Wallet\" on the dApp..."}
                {simStep === 2 && "MetaMask popup appeared \u2014 requesting access to your address..."}
                {simStep === 3 && "User approved the connection in MetaMask..."}
                {simStep >= 4 && "Connected! dApp now sees address 0x7a3b...9f2e"}
              </div>
              {simStep < 4 ? (
                <button className="mm101-wallet-sim-btn" onClick={advanceSim}>
                  {simStep === 0 ? "Start Simulation" : "Next Step \u2192"}
                </button>
              ) : (
                <button className="mm101-wallet-sim-btn reset" onClick={resetSim}>
                  Reset Simulation
                </button>
              )}
            </div>

            <div className="mm101-info-box green">
              <div className="mm101-info-box-label">Oeconomia Connection</div>
              <p>
                All Oeconomia protocols use the same "Connect Wallet" pattern. When you connect to <strong>Eloqura</strong> (the DEX), <strong>Alluria</strong> (the lending platform), or the <strong>Oeconomia DAO Hub</strong>, MetaMask will prompt you to approve the connection. Once connected, your address and Sepolia balances are visible within the dApp. You can swap tokens, provide liquidity, stake OEC, and vote on governance proposals.
              </p>
            </div>

            <div className="mm101-info-box">
              <div className="mm101-info-box-label">Disconnecting and Revoking</div>
              <p>
                You can disconnect your wallet at any time. Most dApps have a "Disconnect" button in their UI. You can also manage connected sites in MetaMask by going to Settings {"\u2192"} Connections. Disconnecting prevents the dApp from seeing your address, but it does <strong>not</strong> revoke any token approvals you may have granted. Revoking approvals is a separate action covered in the Transaction Safety lesson.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`mm101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
