// ============================================================
// Transaction Safety & Avoiding Scams — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./txsafety.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "Common Scam Types: Phishing, Rug Pulls, Fake Airdrops", meta: "8 min read \u00B7 Threats" },
  { num: 2, title: "How to Verify Contract Addresses Before Interacting", meta: "7 min read \u00B7 Verification" },
  { num: 3, title: "Understanding and Revoking Token Approvals", meta: "8 min read \u00B7 Permissions" },
  { num: 4, title: "Red Flags in DeFi Projects", meta: "7 min read \u00B7 Due Diligence" },
  { num: 5, title: "Tools for Checking Contract Safety", meta: "7 min read \u00B7 Tools" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What is a 'rug pull' in crypto?",
    options: [
      { letter: "A", text: "A sudden price increase caused by a whale buying", correct: false },
      { letter: "B", text: "When project creators drain liquidity and abandon the project with investors' funds", correct: true },
      { letter: "C", text: "A technical bug that causes a smart contract to fail", correct: false },
      { letter: "D", text: "When a blockchain network goes offline temporarily", correct: false },
    ],
    correctMsg: "Correct! A rug pull occurs when project creators withdraw all liquidity from a trading pool or exploit their admin privileges to drain funds, leaving investors with worthless tokens.",
    wrongMsg: "Not quite \u2014 a rug pull is when project creators drain liquidity and abandon the project, stealing investors' funds.",
  },
  2: {
    question: "Why is it important to verify contract addresses?",
    options: [
      { letter: "A", text: "To check if the gas fees will be high", correct: false },
      { letter: "B", text: "Fake contracts with similar names can steal your funds", correct: true },
      { letter: "C", text: "Contract addresses change every day", correct: false },
      { letter: "D", text: "Verified contracts are faster to execute", correct: false },
    ],
    correctMsg: "Correct! Scammers regularly deploy fake token contracts with identical names and symbols to trick users into interacting with malicious code. Always verify the contract address against official sources.",
    wrongMsg: "Not quite \u2014 the main reason is that fake contracts with similar names can steal your funds. Always verify addresses from official sources.",
  },
  3: {
    question: "What does revoking a token approval do?",
    options: [
      { letter: "A", text: "Deletes the token from your wallet", correct: false },
      { letter: "B", text: "Sends your tokens back to the contract", correct: false },
      { letter: "C", text: "Removes a contract's permission to spend your tokens", correct: true },
      { letter: "D", text: "Burns the tokens permanently", correct: false },
    ],
    correctMsg: "Correct! Revoking an approval sets the contract's allowance back to zero, removing its ability to spend your tokens on your behalf. This is a safety measure to limit exposure to potentially compromised contracts.",
    wrongMsg: "Not quite \u2014 revoking a token approval removes a contract's permission to spend your tokens. Your tokens stay in your wallet.",
  },
  4: {
    question: "Which is a red flag for a DeFi project?",
    options: [
      { letter: "A", text: "The project has a public audit from a reputable firm", correct: false },
      { letter: "B", text: "The team is doxxed and has a track record", correct: false },
      { letter: "C", text: "Promising guaranteed 1000% APY with no risk", correct: true },
      { letter: "D", text: "The project has a time-locked liquidity pool", correct: false },
    ],
    correctMsg: "Correct! Any project promising guaranteed extremely high returns with no risk is almost certainly a scam. In DeFi, all yield comes with risk, and no legitimate project can guarantee returns.",
    wrongMsg: "Not quite \u2014 promising guaranteed extremely high APY with no risk is a classic red flag. Legitimate DeFi projects always acknowledge risk.",
  },
  5: {
    question: "What is the safest way to access a DeFi protocol?",
    options: [
      { letter: "A", text: "Click the first Google result for the protocol name", correct: false },
      { letter: "B", text: "Follow links sent by helpful users in Discord DMs", correct: false },
      { letter: "C", text: "Type the URL directly or use a verified bookmark", correct: true },
      { letter: "D", text: "Download the app from a link in a Telegram group", correct: false },
    ],
    correctMsg: "Correct! Always type the URL directly in your browser or use a bookmark you have previously verified. Never click links from DMs, emails, search ads, or social media posts \u2014 these are the most common phishing vectors.",
    wrongMsg: "Not quite \u2014 the safest way is to type the URL directly or use a verified bookmark. Never click links from DMs or emails.",
  },
};

/* ---- Phishing game data ---- */
const PHISHING_URLS = [
  { url: "https://metamask.io", isPhishing: false, explanation: "This is the real MetaMask URL. The domain is correct: metamask.io" },
  { url: "https://metam\u00E4sk.io", isPhishing: true, explanation: "Phishing! The 'a' in 'mask' has been replaced with '\u00E4' (a with umlaut). This is a homograph attack using a lookalike Unicode character." },
  { url: "https://app.uniswap.org", isPhishing: false, explanation: "This is the real Uniswap URL. The domain app.uniswap.org is correct." },
  { url: "https://un1swap.org", isPhishing: true, explanation: "Phishing! The letter 'i' has been replaced with the number '1'. This is a classic character substitution attack." },
  { url: "https://etherscan.io", isPhishing: false, explanation: "This is the real Etherscan URL. The domain etherscan.io is correct." },
];

export default function TxSafetyContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Phishing game state
  const [phishingIndex, setPhishingIndex] = useState(0);
  const [phishingScore, setPhishingScore] = useState({ correct: 0, wrong: 0 });
  const [phishingAnswered, setPhishingAnswered] = useState(false);
  const [phishingLastCorrect, setPhishingLastCorrect] = useState<boolean | null>(null);

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

  // Phishing game handlers
  const handlePhishingAnswer = useCallback((userSaysPhishing: boolean) => {
    if (phishingAnswered) return;
    const currentUrl = PHISHING_URLS[phishingIndex];
    const isCorrect = userSaysPhishing === currentUrl.isPhishing;
    setPhishingAnswered(true);
    setPhishingLastCorrect(isCorrect);
    setPhishingScore((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
    }));
  }, [phishingAnswered, phishingIndex]);

  const nextPhishingUrl = useCallback(() => {
    setPhishingIndex((prev) => prev + 1);
    setPhishingAnswered(false);
    setPhishingLastCorrect(null);
  }, []);

  const phishingGameDone = phishingIndex >= PHISHING_URLS.length;
  const currentPhishingUrl = PHISHING_URLS[phishingIndex];

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="ts101-quiz-section">
        <div className="ts101-quiz-title">Check Your Understanding</div>
        <div className="ts101-quiz-question">{q.question}</div>
        <div className="ts101-quiz-options">
          {q.options.map((opt) => {
            let cls = "ts101-quiz-option";
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
          <div className={`ts101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ts101">
      {/* Progress bar */}
      <div className="ts101-progress">
        <div className="ts101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`ts101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="ts101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — Common Scam Types
          ============================================================ */}
      <div className={`ts101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="ts101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="ts101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="ts101-lesson-header-text">
            <div className="ts101-lesson-title">Common Scam Types: Phishing, Rug Pulls, Fake Airdrops</div>
            <div className="ts101-lesson-meta"><span>8 min read</span><span>Threats</span></div>
          </div>
          <div className="ts101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ts101-lesson-content">
          <div className="ts101-lesson-body">
            <h3>The Crypto Threat Landscape</h3>
            <p>
              The crypto space offers incredible financial freedom, but that freedom comes with real risks. Unlike traditional finance where banks and regulators provide safety nets, <strong>blockchain transactions are irreversible</strong>. Once you send crypto to a scammer, there is no chargeback, no fraud department to call, and no way to reverse the transaction. Understanding common scam types is your first line of defense.
            </p>
            <p>
              According to industry reports, over <strong>$5.6 billion</strong> was stolen through crypto scams in 2023 alone. The three most common categories are phishing attacks, rug pulls, and fake airdrops. Each exploits different vulnerabilities: phishing targets your credentials, rug pulls target your trust, and fake airdrops target your greed.
            </p>

            <div className="ts101-stats-row">
              <div className="ts101-stat-card"><div className="ts101-stat-value">$5.6B</div><div className="ts101-stat-label">Lost to crypto scams (2023)</div></div>
              <div className="ts101-stat-card"><div className="ts101-stat-value">298K+</div><div className="ts101-stat-label">Phishing sites detected</div></div>
              <div className="ts101-stat-card"><div className="ts101-stat-value">~2,000</div><div className="ts101-stat-label">Rug pulls in 2023</div></div>
            </div>

            <h3>Phishing Attacks</h3>
            <p>
              <strong>Phishing</strong> is the most common attack vector. Scammers create fake websites that look identical to popular dApps (Uniswap, MetaMask, OpenSea) with slightly different URLs. They promote these sites through Google Ads, social media, Discord DMs, and fake customer support accounts. When you connect your wallet to a phishing site, it prompts you to sign a malicious transaction that drains your funds.
            </p>
            <p>
              Phishing can also come as fake emails, fake MetaMask popups, or messages claiming your "wallet needs to be verified." The rule is simple: <strong>no legitimate protocol will ever DM you first or ask you to "verify" or "validate" your wallet.</strong>
            </p>

            <h3>Rug Pulls</h3>
            <p>
              A <strong>rug pull</strong> occurs when the creators of a token or DeFi project withdraw all liquidity from the trading pool, making the token impossible to sell. Investors are left holding tokens worth zero. This is facilitated by deploying a token with no liquidity lock, building hype on social media, and then draining the pool once enough people have bought in.
            </p>
            <p>
              Advanced rug pulls use "slow rug" tactics: gradually siphoning funds through hidden admin functions in unverified contracts, or quietly reducing liquidity over weeks instead of all at once.
            </p>

            <h3>Fake Airdrops</h3>
            <p>
              <strong>Fake airdrops</strong> appear as unsolicited tokens in your wallet. You did not buy them, you did not earn them, and they appeared out of nowhere. The scam works in two ways: either the token's contract has a hidden <code>approve()</code> function that triggers when you try to sell (draining your real tokens), or the "claim" website for the airdrop is a phishing site that asks you to connect your wallet and sign a malicious transaction.
            </p>

            <div className="ts101-info-box red">
              <div className="ts101-info-box-label">Real-World Example</div>
              <p>
                In 2022, a fake "Uniswap V3" airdrop was sent to over 73,000 wallets. The tokens appeared to be from Uniswap. When users visited the "claim" website and approved the transaction, the site drained all their real UNI and ETH. Over <strong>$8 million</strong> was stolen in a single phishing campaign.
              </p>
            </div>

            <div className="ts101-info-box amber">
              <div className="ts101-info-box-label">The Golden Rules</div>
              <p>
                Never interact with tokens you did not buy or earn. Never click links from DMs. Never enter your seed phrase anywhere. Always verify URLs letter by letter. If an offer seems too good to be true, it is. Legitimate projects do not need to DM you.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`ts101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — How to Verify Contract Addresses
          ============================================================ */}
      <div className={`ts101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="ts101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="ts101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="ts101-lesson-header-text">
            <div className="ts101-lesson-title">How to Verify Contract Addresses Before Interacting</div>
            <div className="ts101-lesson-meta"><span>7 min read</span><span>Verification</span></div>
          </div>
          <div className="ts101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ts101-lesson-content">
          <div className="ts101-lesson-body">
            <h3>Why Verification Matters</h3>
            <p>
              Anyone can deploy a smart contract on Ethereum with any name and symbol. There is nothing stopping a scammer from creating a token called "Uniswap" with the symbol "UNI" at a fake contract address. If you interact with the wrong contract, you could be approving a malicious contract to drain your wallet, or buying a worthless token that mimics a real one.
            </p>
            <p>
              The <strong>contract address</strong> is the only reliable identifier. Names and symbols can be duplicated, but each contract has a unique address. Before interacting with any contract, you must verify that the address matches the official one published by the project.
            </p>

            <h3>Step-by-Step Verification</h3>
            <p>
              <strong>Step 1:</strong> Find the official contract address. Check the project's official website, official Twitter/X account, or their documentation. For major tokens, CoinGecko and CoinMarketCap list verified contract addresses.
            </p>
            <p>
              <strong>Step 2:</strong> Compare addresses character by character. Do not just glance at the first and last few characters. Scammers create "vanity" addresses that match the beginning and end of real addresses.
            </p>
            <p>
              <strong>Step 3:</strong> Check the contract on Etherscan. A verified contract (with a green checkmark on Etherscan) means the source code has been published and matches the deployed bytecode. Unverified contracts are a red flag.
            </p>
            <p>
              <strong>Step 4:</strong> Look at the contract's transaction history. A legitimate token will have thousands of transactions from diverse addresses. A fake token often has very few transactions, mostly from the creator.
            </p>

            <div className="ts101-data-block">
              <div className="ts101-data-section-label">Oeconomia Verified Contract Addresses (Sepolia)</div>
              <div className="ts101-data-row"><span className="ts101-data-label">OEC Token</span><span className="ts101-data-value cyan">0x00904218319a045a96d776ec6a970f54741208e6</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">Eloqura Factory</span><span className="ts101-data-value cyan">0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">Eloqura Router</span><span className="ts101-data-value cyan">0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">USDC</span><span className="ts101-data-value cyan">0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">LINK</span><span className="ts101-data-value cyan">0x779877A7B0D9E8603169DdbD7836e478b4624789</span></div>
            </div>

            <div className="ts101-info-box green">
              <div className="ts101-info-box-label">Oeconomia Connection</div>
              <p>
                The Oeconomia Explorer itself is a verification tool. You can look up any contract address on the explorer to see its transaction history, decoded events, and associated protocol. When interacting with Eloqura or Alluria, always verify the contract addresses match those published on oeconomia.io and listed above.
              </p>
            </div>

            <div className="ts101-info-box">
              <div className="ts101-info-box-label">Pro Tip: Bookmark Verified Links</div>
              <p>
                Create bookmarks for every DeFi protocol you use regularly. Bookmark the exact URL (e.g., <code>app.uniswap.org</code>, <code>eloqura.oeconomia.io</code>). Always access protocols through your bookmarks, never through search results or links. Google Ads at the top of search results are a common phishing vector.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`ts101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Understanding and Revoking Token Approvals
          ============================================================ */}
      <div className={`ts101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="ts101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="ts101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="ts101-lesson-header-text">
            <div className="ts101-lesson-title">Understanding and Revoking Token Approvals</div>
            <div className="ts101-lesson-meta"><span>8 min read</span><span>Permissions</span></div>
          </div>
          <div className="ts101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ts101-lesson-content">
          <div className="ts101-lesson-body">
            <h3>What Is a Token Approval?</h3>
            <p>
              Before a smart contract can spend your ERC-20 tokens, you must first <strong>approve</strong> it. This is a two-step process required by the ERC-20 standard: first you call <code>approve(spender, amount)</code> on the token contract, then the spender contract calls <code>transferFrom()</code> to move your tokens. This is similar to giving someone a signed check: you authorize a specific amount, and they can cash it.
            </p>
            <p>
              When you swap tokens on a DEX like Uniswap or Eloqura, MetaMask first asks you to approve the router contract to spend your tokens. You might see a prompt saying "Give permission to access your USDC." This is the approval step. Only after approving can the DEX execute the swap.
            </p>

            <h3>The Danger of Unlimited Approvals</h3>
            <p>
              For convenience, many dApps request <strong>unlimited approval</strong> (the maximum uint256 value: approximately 1.15 x 10^77 tokens). This means you only need to approve once, and the contract can spend any amount of that token from your wallet forever. This is fine for trusted, audited contracts, but it becomes a serious vulnerability if the contract is later exploited or was malicious from the start.
            </p>
            <p>
              If a contract with unlimited approval is hacked, the attacker can drain <strong>all</strong> of that token from every wallet that approved it. This has happened many times in DeFi history, resulting in hundreds of millions in losses.
            </p>

            <div className="ts101-data-block">
              <div className="ts101-data-section-label">Token Approval Flow</div>
              <div className="ts101-data-row"><span className="ts101-data-label">Step 1</span><span className="ts101-data-value">User calls approve(DEX_Router, amount) on the token contract</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">Step 2</span><span className="ts101-data-value">Token contract stores: allowance[user][DEX_Router] = amount</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">Step 3</span><span className="ts101-data-value">DEX Router calls transferFrom(user, pool, swapAmount)</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">Step 4</span><span className="ts101-data-value green">Token contract checks: swapAmount {"\u2264"} allowance? If yes, transfer executes</span></div>
              <div className="ts101-data-row"><span className="ts101-data-label">Risk</span><span className="ts101-data-value red">If unlimited: contract can drain all your tokens at any time</span></div>
            </div>

            <h3>How to Check and Revoke Approvals</h3>
            <p>
              You should periodically review your token approvals and revoke any that are no longer needed. Two popular tools for this are:
            </p>
            <p>
              <strong>Revoke.cash</strong> is the most popular approval management tool. Connect your wallet, and it shows every approval you have ever granted, the spender address, the approved amount, and a one-click "Revoke" button. Revoking an approval sets the allowance back to zero.
            </p>
            <p>
              <strong>Etherscan Token Approval Checker</strong> (etherscan.io/tokenapprovalchecker) provides a similar interface directly on Etherscan, showing all your outstanding approvals with revoke functionality.
            </p>

            <div className="ts101-info-box amber">
              <div className="ts101-info-box-label">Best Practice</div>
              <p>
                When possible, approve only the <strong>exact amount</strong> needed for each transaction instead of unlimited approval. Some wallets (like MetaMask) let you edit the approval amount before confirming. If a dApp requests unlimited approval, consider approving only what you need. After completing your transaction, revoke the approval if you do not plan to use the protocol again soon.
              </p>
            </div>

            <div className="ts101-info-box blue">
              <div className="ts101-info-box-label">Revoking Costs Gas</div>
              <p>
                Each revoke transaction requires a small gas fee (it is an on-chain transaction that updates the allowance mapping). On Ethereum mainnet, this might cost $1-5 depending on gas prices. On Sepolia testnet, it is free (testnet ETH). On Layer 2s like Arbitrum, it costs fractions of a cent.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`ts101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Red Flags in DeFi Projects
          ============================================================ */}
      <div className={`ts101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="ts101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="ts101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="ts101-lesson-header-text">
            <div className="ts101-lesson-title">Red Flags in DeFi Projects</div>
            <div className="ts101-lesson-meta"><span>7 min read</span><span>Due Diligence</span></div>
          </div>
          <div className="ts101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ts101-lesson-content">
          <div className="ts101-lesson-body">
            <h3>Developing Your Scam Radar</h3>
            <p>
              Not every new DeFi project is a scam, but the space is full of them. Learning to identify red flags early can save you from devastating losses. The key is to develop a checklist of warning signs and to approach every new project with <strong>healthy skepticism</strong> until it proves itself legitimate.
            </p>
            <p>
              Scam projects follow predictable patterns. They rely on urgency ("limited time!"), unrealistic promises ("guaranteed returns!"), and social proof manipulation (fake followers, fake partnerships). Once you learn to spot these patterns, they become obvious.
            </p>

            <div className="ts101-three-col">
              <div className="ts101-col-card">
                <h4>Red Flags</h4>
                <p>Anonymous team with no track record. Unverified contracts. No audit. Unrealistic APY (1000%+). No locked liquidity. Pressure to invest quickly. Contract with mint or admin drain functions. Copied whitepaper.</p>
              </div>
              <div className="ts101-col-card">
                <h4>Yellow Flags</h4>
                <p>Pseudonymous team (common but riskier). Single audit from unknown firm. Low liquidity. Recently launched (under 3 months). Heavy influencer marketing. Token concentrated in few wallets. Roadmap with no deadlines.</p>
              </div>
              <div className="ts101-col-card">
                <h4>Green Flags</h4>
                <p>Doxxed team with public profiles. Multiple audits from reputable firms (Trail of Bits, OpenZeppelin). Locked liquidity with time locks. Active GitHub with regular commits. Community governance. Transparent treasury.</p>
              </div>
            </div>

            <h3>Unrealistic APY: The Biggest Red Flag</h3>
            <p>
              If a DeFi protocol is offering <strong>1,000%, 10,000%, or 100,000% APY</strong>, it is almost certainly unsustainable and likely a scam. In legitimate DeFi, yield comes from real economic activity: trading fees, borrowing interest, or protocol incentives. These typically range from <strong>2-30% APY</strong> for stable strategies and up to <strong>50-100% APY</strong> for high-risk, short-term incentive programs.
            </p>
            <p>
              Extremely high APY usually means the protocol is paying you in its own newly minted tokens, which are rapidly losing value due to inflation. The APY looks high in token terms, but your actual USD value is declining. This is sometimes called a "death spiral."
            </p>

            <div className="ts101-info-box">
              <div className="ts101-info-box-label">The "Too Good to Be True" Test</div>
              <p>
                If a project promises returns that seem unrealistic, ask: where does the yield come from? In legitimate DeFi, yield is always backed by real economic activity (trading fees, borrowing demand, protocol revenue). If the project cannot explain the source of yield clearly, or if the explanation is "tokenomics" without specifics, it is likely a Ponzi scheme where early investors are paid with later investors' money.
              </p>
            </div>

            <h3>Liquidity Lock and Ownership</h3>
            <p>
              A <strong>liquidity lock</strong> means the project has deposited its initial liquidity pool tokens into a time-locked contract that prevents withdrawal for a set period (often 6-12 months or longer). This makes rug pulls significantly harder because the team cannot simply drain the pool. Check for liquidity locks on platforms like Team.Finance or Unicrypt.
            </p>
            <p>
              Also check <strong>contract ownership</strong>. If the deployer wallet still has admin privileges (ability to mint, pause, blacklist, or change fees), the project is more centralized and the owner could potentially abuse those functions. The safest contracts either renounce ownership or transfer it to a multi-signature wallet or DAO.
            </p>

            <div className="ts101-info-box red">
              <div className="ts101-info-box-label">Due Diligence Checklist</div>
              <p>
                Before investing in any DeFi project: (1) Who is the team? (2) Is the contract verified on Etherscan? (3) Has it been audited? By whom? (4) Is liquidity locked? For how long? (5) What is the token distribution? (6) Where does the yield come from? (7) Can the owner mint, pause, or drain? (8) How long has the project been live? If you cannot answer these questions, do not invest.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`ts101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Tools for Checking Contract Safety
          ============================================================ */}
      <div className={`ts101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="ts101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="ts101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="ts101-lesson-header-text">
            <div className="ts101-lesson-title">Tools for Checking Contract Safety</div>
            <div className="ts101-lesson-meta"><span>7 min read</span><span>Tools</span></div>
          </div>
          <div className="ts101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="ts101-lesson-content">
          <div className="ts101-lesson-body">
            <h3>Your Safety Toolkit</h3>
            <p>
              The DeFi ecosystem has developed an array of tools to help users evaluate the safety of tokens and smart contracts before interacting. No single tool catches everything, but using a combination of these gives you strong protection. Think of them as layers of defense: the more layers you check, the safer you are.
            </p>

            <h3>Block Explorers: Etherscan</h3>
            <p>
              <strong>Etherscan</strong> (etherscan.io) is the primary tool for verifying contracts on Ethereum. For any contract address, Etherscan shows whether the source code is verified, the contract's transaction history, token holders, and read/write functions. A <strong>verified contract</strong> (green checkmark) means the published Solidity source code matches the deployed bytecode, allowing anyone to read and audit the code.
            </p>
            <p>
              Key things to check on Etherscan: Is the contract verified? Does the creator wallet hold a large percentage of tokens? Are there suspicious functions like <code>mint()</code>, <code>pause()</code>, or <code>blacklist()</code> with admin-only access? How many unique holders does the token have?
            </p>

            <h3>Try It: Phishing URL Detector</h3>
            <div className="ts101-phishing-game">
              <div className="ts101-phishing-title">Can You Spot the Phishing URL?</div>
              <div className="ts101-phishing-score">
                <span className="ts101-phishing-score-correct">Correct: {phishingScore.correct}</span>
                <span className="ts101-phishing-score-wrong">Wrong: {phishingScore.wrong}</span>
                <span className="ts101-phishing-score-remaining">Remaining: {Math.max(0, PHISHING_URLS.length - phishingIndex - (phishingAnswered ? 0 : 0))}</span>
              </div>
              {!phishingGameDone ? (
                <>
                  <div className="ts101-phishing-url-display">
                    <div className="ts101-phishing-url-text">{currentPhishingUrl.url}</div>
                  </div>
                  <div className="ts101-phishing-buttons">
                    <button
                      className="ts101-phishing-btn legit"
                      onClick={() => handlePhishingAnswer(false)}
                      disabled={phishingAnswered}
                    >
                      Legitimate
                    </button>
                    <button
                      className="ts101-phishing-btn phishing"
                      onClick={() => handlePhishingAnswer(true)}
                      disabled={phishingAnswered}
                    >
                      Phishing!
                    </button>
                  </div>
                  {phishingAnswered && (
                    <>
                      <div className={`ts101-phishing-feedback ${phishingLastCorrect ? "correct" : "wrong"}`}>
                        {phishingLastCorrect ? "Correct! " : "Wrong! "}{currentPhishingUrl.explanation}
                      </div>
                      {phishingIndex < PHISHING_URLS.length - 1 && (
                        <button className="ts101-phishing-next" onClick={nextPhishingUrl}>
                          Next URL {"\u2192"}
                        </button>
                      )}
                      {phishingIndex === PHISHING_URLS.length - 1 && (
                        <button className="ts101-phishing-next" onClick={nextPhishingUrl}>
                          See Results
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                <div className={`ts101-phishing-complete ${phishingScore.correct >= 4 ? "good" : "bad"}`}>
                  {phishingScore.correct >= 4
                    ? `Excellent! You scored ${phishingScore.correct}/${PHISHING_URLS.length}. You have a sharp eye for phishing URLs!`
                    : `You scored ${phishingScore.correct}/${PHISHING_URLS.length}. Review the lesson material and try to develop a sharper eye for URL differences.`}
                </div>
              )}
            </div>

            <h3>Token Safety Scanners</h3>
            <p>
              Several automated tools analyze token contracts for common scam patterns. These tools check for honeypot mechanisms (can you sell the token after buying?), hidden mint functions, blacklist capabilities, high buy/sell taxes, and other red flags.
            </p>

            <div className="ts101-compare-grid">
              <div className="ts101-compare-card">
                <h4>Token Scanners</h4>
                <ul>
                  <li>TokenSniffer.com: Scam score + contract analysis</li>
                  <li>GoPlus Security: Honeypot detection API</li>
                  <li>De.Fi Scanner: Contract risk assessment</li>
                  <li>RugDoc.io: DeFi project reviews</li>
                </ul>
              </div>
              <div className="ts101-compare-card">
                <h4>Approval Managers</h4>
                <ul>
                  <li>Revoke.cash: View and revoke all approvals</li>
                  <li>Etherscan Approval Checker: Official tool</li>
                  <li>Rabby Wallet: Built-in approval management</li>
                  <li>De.Fi Shield: Automated approval monitoring</li>
                </ul>
              </div>
            </div>

            <div className="ts101-info-box green">
              <div className="ts101-info-box-label">Your Safety Checklist</div>
              <p>
                Before interacting with any new contract: (1) Check if it is verified on Etherscan. (2) Run it through TokenSniffer. (3) Verify the address from official sources. (4) Check liquidity and holder distribution. (5) Review your approvals monthly with Revoke.cash. Building these habits into your routine dramatically reduces your risk of falling victim to scams.
              </p>
            </div>

            <div className="ts101-info-box cyan">
              <div className="ts101-info-box-label">Oeconomia Explorer: Built-In Safety</div>
              <p>
                The Oeconomia Explorer provides protocol-aware transaction decoding. When you view a transaction, the explorer identifies which protocol it interacted with, decodes the function call, and shows you exactly what happened. This transparency helps you verify that transactions did what you expected and identify any suspicious activity on contracts you interact with.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`ts101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
