// ============================================================
// What is Web3 — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./web3.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "The Evolution: Web1 \u2192 Web2 \u2192 Web3", meta: "7 min read \u00b7 Foundations" },
  { num: 2, title: "Ownership and Self-Sovereignty", meta: "7 min read \u00b7 Concepts" },
  { num: 3, title: "Wallets as Identity: No More Usernames and Passwords", meta: "6 min read \u00b7 Identity" },
  { num: 4, title: "dApps vs. Traditional Web Apps", meta: "7 min read \u00b7 Technical" },
  { num: 5, title: "The Role of Tokens in Web3", meta: "7 min read \u00b7 Economics" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What is the key difference between Web2 and Web3?",
    options: [
      { letter: "A", text: "Web3 has faster loading speeds than Web2", correct: false },
      { letter: "B", text: "In Web3, users own their data and digital assets instead of platforms", correct: true },
      { letter: "C", text: "Web3 only works on mobile devices", correct: false },
      { letter: "D", text: "Web3 replaced all Web2 applications", correct: false },
    ],
    correctMsg: "Correct! Web3's defining shift is from platform-owned to user-owned \u2014 data, assets, and identity belong to you.",
    wrongMsg: "Not quite \u2014 the key difference is ownership. In Web3, users own their data and digital assets instead of platforms.",
  },
  2: {
    question: "How do you log into a Web3 application?",
    options: [
      { letter: "A", text: "By creating an account with your email and password", correct: false },
      { letter: "B", text: "By scanning a QR code sent to your phone", correct: false },
      { letter: "C", text: "By connecting your crypto wallet \u2014 no username or password needed", correct: true },
      { letter: "D", text: "By using a government-issued digital ID", correct: false },
    ],
    correctMsg: "Correct! Your wallet IS your login \u2014 one cryptographic key pair replaces all usernames and passwords.",
    wrongMsg: "Not quite \u2014 in Web3, you log in by connecting your crypto wallet. No username or password needed.",
  },
  3: {
    question: "What makes a dApp decentralized?",
    options: [
      { letter: "A", text: "It has a mobile app version", correct: false },
      { letter: "B", text: "Its backend logic runs on a blockchain via smart contracts", correct: true },
      { letter: "C", text: "It's open source on GitHub", correct: false },
      { letter: "D", text: "It doesn't require an internet connection", correct: false },
    ],
    correctMsg: "Correct! A dApp's defining feature is that its core logic runs on-chain through smart contracts, not on private servers.",
    wrongMsg: "Not quite \u2014 a dApp is decentralized because its backend logic runs on a blockchain via smart contracts.",
  },
  4: {
    question: "What is ENS in the context of Web3 identity?",
    options: [
      { letter: "A", text: "A type of cryptocurrency token", correct: false },
      { letter: "B", text: "A decentralized social media platform", correct: false },
      { letter: "C", text: "Ethereum Name Service \u2014 human-readable names (.eth) linked to wallet addresses", correct: true },
      { letter: "D", text: "An encryption standard for Web3 messages", correct: false },
    ],
    correctMsg: "Correct! ENS maps human-readable names like 'jason.eth' to long hexadecimal wallet addresses.",
    wrongMsg: "Not quite \u2014 ENS is the Ethereum Name Service, providing human-readable .eth names linked to wallet addresses.",
  },
  5: {
    question: "What role do tokens play in Web3?",
    options: [
      { letter: "A", text: "They are only used for speculation and trading", correct: false },
      { letter: "B", text: "They represent ownership, access, governance power, and digital assets", correct: true },
      { letter: "C", text: "They replace all traditional currencies", correct: false },
      { letter: "D", text: "They are required to access the internet", correct: false },
    ],
    correctMsg: "Correct! Tokens are the building blocks of Web3 \u2014 representing everything from governance votes to membership and ownership.",
    wrongMsg: "Not quite \u2014 tokens represent ownership, access, governance power, and digital assets across Web3 applications.",
  },
};

/* ---- Timeline data for the interactive element ---- */
const TIMELINE_ERAS = [
  {
    id: "web1",
    era: "Web 1.0",
    label: "The Read Era",
    years: "1990s \u2013 early 2000s",
    description: "The first generation of the internet was essentially a digital library. Websites were static pages of text and images \u2014 you could read them, but you couldn't interact or contribute. Content was created by a small number of publishers, and users were passive consumers. There were no accounts, no profiles, no user-generated content.",
    characteristics: ["Static HTML pages", "Read-only content", "No user accounts", "One-way communication", "Publisher-controlled", "Minimal interactivity"],
    examples: ["GeoCities", "AltaVista", "Netscape", "Yahoo! Directory", "Early news sites"],
    transition: "The shift to Web2 happened when platforms realized the real value was in user-generated content and social connections.",
  },
  {
    id: "web2",
    era: "Web 2.0",
    label: "The Read-Write Era",
    years: "2000s \u2013 2020s",
    description: "Web2 transformed users from passive readers into active creators. Social media, blogs, and user-generated platforms exploded. Anyone could publish, share, and interact. But this power came with a catch: the platforms that enabled creation also owned everything you made. Your data, your content, your social graph, your digital identity \u2014 all controlled by corporations.",
    characteristics: ["User-generated content", "Social media platforms", "Cloud computing", "Mobile-first design", "Platform-controlled data", "Ad-driven revenue"],
    examples: ["Facebook / Meta", "Google", "Twitter / X", "YouTube", "Instagram", "TikTok"],
    transition: "Web3 emerged as a response to platform monopolies, data exploitation, and the realization that users should own what they create.",
  },
  {
    id: "web3",
    era: "Web 3.0",
    label: "The Read-Write-Own Era",
    years: "2020s \u2013 present",
    description: "Web3 adds the missing layer: ownership. Through blockchain technology, users can own their data, digital assets, financial instruments, and even governance power over the platforms they use. No single company controls your identity or can deplatform you. Your wallet is your passport to an interconnected ecosystem of decentralized applications.",
    characteristics: ["User-owned data", "Decentralized protocols", "Token-based economics", "Wallet-based identity", "Permissionless access", "Composable applications"],
    examples: ["Ethereum", "Uniswap", "Aave", "ENS", "OpenSea", "Oeconomia"],
    transition: "We are still in the early days of Web3 \u2014 infrastructure is being built, user experience is improving, and mainstream adoption is growing.",
  },
];

export default function Web3Content() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Timeline interactive state
  const [activeEra, setActiveEra] = useState<string>("web1");

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

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="w3101-quiz-section">
        <div className="w3101-quiz-title">Check Your Understanding</div>
        <div className="w3101-quiz-question">{q.question}</div>
        <div className="w3101-quiz-options">
          {q.options.map((opt) => {
            let cls = "w3101-quiz-option";
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
          <div className={`w3101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  const currentEra = TIMELINE_ERAS.find((e) => e.id === activeEra) || TIMELINE_ERAS[0];

  return (
    <div className="w3101">
      {/* Progress bar */}
      <div className="w3101-progress">
        <div className="w3101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`w3101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="w3101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — The Evolution: Web1 → Web2 → Web3
          ============================================================ */}
      <div className={`w3101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="w3101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="w3101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="w3101-lesson-header-text">
            <div className="w3101-lesson-title">The Evolution: Web1 {"\u2192"} Web2 {"\u2192"} Web3</div>
            <div className="w3101-lesson-meta"><span>7 min read</span><span>Foundations</span></div>
          </div>
          <div className="w3101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="w3101-lesson-content">
          <div className="w3101-lesson-body">
            <h3>Three Generations of the Internet</h3>
            <p>
              The internet has evolved through three distinct phases, each fundamentally changing the relationship between users and the digital world. Understanding this evolution is essential to grasping why Web3 matters and what problems it solves.
            </p>
            <p>
              <strong>Web1 (1990s)</strong> was the "read-only" web. Websites were static pages created by a small number of publishers. Users could browse and read, but couldn't contribute or interact. It was like a digital library \u2014 enormous and useful, but entirely one-directional. There were no logins, no social profiles, and no user-generated content.
            </p>
            <p>
              <strong>Web2 (2000s\u20132020s)</strong> introduced the "read-write" web. Suddenly, anyone could create content \u2014 blog posts, videos, social media updates, reviews. Platforms like Facebook, YouTube, and Twitter became the infrastructure for human connection and expression. But this era introduced a fundamental tension: <strong>the platforms that empowered users also captured all the value</strong>. Your data, content, and social connections belonged to corporations, not to you.
            </p>
            <p>
              <strong>Web3 (2020s\u2013present)</strong> adds the final layer: "read-write-own." Through blockchain technology, users can truly own their digital assets, data, and identity. No single company controls your account. No platform can unilaterally delete your content or deplatform you. Your wallet is your identity, your tokens are your assets, and smart contracts replace corporate intermediaries.
            </p>

            <h3>Explore the Timeline</h3>
            <div className="w3101-timeline">
              <div className="w3101-timeline-tabs">
                {TIMELINE_ERAS.map((era) => (
                  <div
                    key={era.id}
                    className={`w3101-timeline-tab${activeEra === era.id ? " active" : ""}`}
                    onClick={() => setActiveEra(era.id)}
                  >
                    <div className="w3101-timeline-tab-era">{era.era}</div>
                    <div className="w3101-timeline-tab-label">{era.label}</div>
                    <div className="w3101-timeline-tab-years">{era.years}</div>
                  </div>
                ))}
              </div>
              <div className="w3101-timeline-detail" key={currentEra.id}>
                <h4>{currentEra.era}: {currentEra.label}</h4>
                <p>{currentEra.description}</p>
                <div className="w3101-timeline-chars">
                  {currentEra.characteristics.map((ch, i) => (
                    <div key={i} className="w3101-timeline-char">{"\u2192"} {ch}</div>
                  ))}
                </div>
                <div className="w3101-timeline-examples">
                  {currentEra.examples.map((ex, i) => (
                    <span key={i} className="w3101-timeline-tag">{ex}</span>
                  ))}
                </div>
                <p style={{ marginTop: 14, fontStyle: "italic", opacity: 0.8 }}>{currentEra.transition}</p>
              </div>
            </div>

            <div className="w3101-info-box blue">
              <div className="w3101-info-box-label">The Core Insight</div>
              <p>
                Each web era expanded what users could do. Web1 let you <strong>read</strong>. Web2 let you <strong>read and write</strong>. Web3 lets you <strong>read, write, and own</strong>. Ownership is the revolution \u2014 it means value flows to creators and users, not just platforms and shareholders.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`w3101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — Ownership and Self-Sovereignty
          ============================================================ */}
      <div className={`w3101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="w3101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="w3101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="w3101-lesson-header-text">
            <div className="w3101-lesson-title">Ownership and Self-Sovereignty</div>
            <div className="w3101-lesson-meta"><span>7 min read</span><span>Concepts</span></div>
          </div>
          <div className="w3101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="w3101-lesson-content">
          <div className="w3101-lesson-body">
            <h3>What Does It Mean to "Own" Something Digitally?</h3>
            <p>
              In the physical world, ownership is intuitive. You own your house, your car, the cash in your wallet. Nobody can take them without your permission (or legal process). But in the digital world of Web2, <strong>"ownership" is an illusion</strong>. You don't own your social media profile \u2014 the platform does. You don't own your game items \u2014 the developer does. You don't own your digital purchases \u2014 you have a license that can be revoked.
            </p>
            <p>
              Web3 changes this fundamentally. When you hold a token in your crypto wallet, you <strong>truly own it</strong>. No company issued you a license. No terms of service can revoke it. No server shutdown can delete it. Your private key is the sole proof of ownership, enforced by mathematics and a global network of computers.
            </p>
            <p>
              This concept is called <strong>self-sovereignty</strong> \u2014 the idea that you are the ultimate authority over your own digital identity, assets, and data. You don't need permission from any institution to hold, transfer, or use what's yours.
            </p>

            <h3>Web2 vs. Web3 Ownership</h3>
            <div className="w3101-compare-grid">
              <div className="w3101-compare-card">
                <h4>Web2: Platform Owns Your Data</h4>
                <ul>
                  <li>Platform controls your account and can ban you</li>
                  <li>Your data is stored on corporate servers</li>
                  <li>Content can be deleted or censored at will</li>
                  <li>Digital purchases are licenses, not property</li>
                  <li>Monetization rules are set by the platform</li>
                  <li>Data is sold to advertisers without your control</li>
                </ul>
              </div>
              <div className="w3101-compare-card">
                <h4>Web3: You Own Your Data</h4>
                <ul>
                  <li>Your wallet is your identity \u2014 no one can ban it</li>
                  <li>Assets live on a public, decentralized blockchain</li>
                  <li>Content stored on IPFS or Arweave is permanent</li>
                  <li>Tokens are true property you can transfer freely</li>
                  <li>You choose how to monetize your creations</li>
                  <li>Data is controlled by your private key</li>
                </ul>
              </div>
            </div>

            <div className="w3101-info-box green">
              <div className="w3101-info-box-label">Digital Property Rights</div>
              <p>
                Think of Web3 ownership like the deed to a house. The blockchain is the land registry \u2014 a public, tamper-proof record that proves you own something. Your private key is the signature that authorizes transfers. No notary, no bank, no government agency needed. This is <strong>property rights enforced by code</strong>, accessible to anyone on Earth with an internet connection.
              </p>
            </div>

            <div className="w3101-info-box purple">
              <div className="w3101-info-box-label">Why This Matters Globally</div>
              <p>
                Over <strong>1.4 billion adults</strong> worldwide lack access to banking services. Many live in countries with unreliable property registries or authoritarian governments that can seize assets. Web3 self-sovereignty gives these people a way to own, save, and transact \u2014 needing nothing but a smartphone and an internet connection. It's not just a technology upgrade; it's a <strong>human rights upgrade</strong>.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`w3101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Wallets as Identity: No More Usernames and Passwords
          ============================================================ */}
      <div className={`w3101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="w3101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="w3101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="w3101-lesson-header-text">
            <div className="w3101-lesson-title">Wallets as Identity: No More Usernames and Passwords</div>
            <div className="w3101-lesson-meta"><span>6 min read</span><span>Identity</span></div>
          </div>
          <div className="w3101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="w3101-lesson-content">
          <div className="w3101-lesson-body">
            <h3>Your Wallet Is Your Login</h3>
            <p>
              In Web2, every app requires a separate account. You manage dozens \u2014 sometimes hundreds \u2014 of username-password combinations. Each platform holds a copy of your identity, creating a fragmented mess of accounts, data breaches, and forgotten passwords. When a platform is hacked, your credentials are exposed. When a service shuts down, your account vanishes.
            </p>
            <p>
              In Web3, your <strong>crypto wallet</strong> serves as your universal identity. When you visit a dApp (decentralized application), you don't create an account. You click "Connect Wallet," approve the connection, and you're in. The dApp reads your wallet address from the blockchain to know who you are, what tokens you hold, what NFTs you own, and what history you have. <strong>One wallet, every application.</strong>
            </p>
            <p>
              This is possible because your identity is a <strong>public-private key pair</strong>. Your public key (wallet address) is your identity. Your private key (held in your wallet) proves that identity. When you "sign in," you're cryptographically signing a message that proves you control that address \u2014 without ever sharing a password or personal information.
            </p>

            <h3>ENS: Human-Readable Web3 Identity</h3>
            <p>
              Wallet addresses are long hexadecimal strings like <code>0x7a3b...4f2e</code> \u2014 not exactly memorable. The <strong>Ethereum Name Service (ENS)</strong> solves this by mapping human-readable names to blockchain addresses. Instead of sharing your hex address, you share <code>jason.eth</code>. ENS names work across wallets, dApps, and even as decentralized website addresses.
            </p>
            <p>
              ENS names are themselves NFTs \u2014 you truly own them. They can point to your wallet address, your website, your social profiles, and even your email. Think of it as a <strong>decentralized DNS</strong> for the entire Web3 ecosystem.
            </p>

            <div className="w3101-stats-row">
              <div className="w3101-stat-card"><div className="w3101-stat-value">3,000+</div><div className="w3101-stat-label">dApps on Ethereum alone</div></div>
              <div className="w3101-stat-card"><div className="w3101-stat-value">1 Wallet</div><div className="w3101-stat-label">to access all of them</div></div>
              <div className="w3101-stat-card"><div className="w3101-stat-value">2M+</div><div className="w3101-stat-label">ENS names registered</div></div>
            </div>

            <div className="w3101-info-box cyan">
              <div className="w3101-info-box-label">Portable Reputation</div>
              <p>
                Because your wallet address carries your entire on-chain history \u2014 every transaction, every token, every governance vote \u2014 it becomes a <strong>portable reputation</strong>. DeFi protocols can see your borrowing history. DAOs can verify your governance participation. NFT communities can confirm your membership. Your reputation travels with you across every platform, and no single entity can erase it.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`w3101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — dApps vs. Traditional Web Apps
          ============================================================ */}
      <div className={`w3101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="w3101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="w3101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="w3101-lesson-header-text">
            <div className="w3101-lesson-title">dApps vs. Traditional Web Apps</div>
            <div className="w3101-lesson-meta"><span>7 min read</span><span>Technical</span></div>
          </div>
          <div className="w3101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="w3101-lesson-content">
          <div className="w3101-lesson-body">
            <h3>What Makes an App "Decentralized"?</h3>
            <p>
              A <strong>dApp</strong> (decentralized application) is an application where the core business logic runs on a blockchain through smart contracts, rather than on a company's private servers. The frontend might look identical to a traditional web app \u2014 the difference is what happens behind the scenes.
            </p>
            <p>
              When you use a traditional app like Venmo to send money, your request goes to Venmo's servers, which update Venmo's private database. Venmo decides if the transaction is valid, Venmo can freeze your account, and Venmo takes a cut. When you use a dApp like Uniswap to swap tokens, your transaction goes directly to a smart contract on Ethereum. The <strong>blockchain</strong> validates it, no one can freeze your wallet, and the fees go to liquidity providers \u2014 not a corporation.
            </p>
            <p>
              The key insight: <strong>a dApp's frontend can be normal web technology</strong> (React, HTML, CSS). It's the backend that makes it decentralized. Instead of calling a corporate API, the frontend calls smart contract functions on the blockchain. Instead of a database, state is stored in the contract's on-chain storage.
            </p>

            <h3>The Spectrum of Decentralization</h3>
            <div className="w3101-three-col">
              <div className="w3101-col-card">
                <h4>Traditional App</h4>
                <p>Frontend and backend on company servers. Company controls all data, logic, and access. Examples: banks, social media, streaming. The company can change rules, prices, or shut down the service at any time.</p>
              </div>
              <div className="w3101-col-card">
                <h4>Hybrid dApp</h4>
                <p>Frontend hosted traditionally (e.g., Netlify), but core logic runs on smart contracts. Some off-chain services for speed. Most current dApps work this way. Examples: Uniswap, Aave, Oeconomia protocols.</p>
              </div>
              <div className="w3101-col-card">
                <h4>Fully Decentralized</h4>
                <p>Frontend on IPFS/Arweave, backend on-chain, governance by DAO. Truly unstoppable \u2014 no single point of failure. Rare today due to UX tradeoffs. Even if the team disappears, the app continues running.</p>
              </div>
            </div>

            <div className="w3101-info-box orange">
              <div className="w3101-info-box-label">Why Hybrid Is the Standard</div>
              <p>
                Most dApps today are hybrid \u2014 and that's intentional. Fully decentralized frontends are slower and harder to update. A practical dApp uses traditional hosting for the interface (fast, familiar UX) and blockchain for the <strong>critical logic</strong>: asset custody, trading, lending, governance. The smart contracts are the trust layer; the frontend is the convenience layer. This is how Eloqura, Alluria, and all Oeconomia protocols are architected.
              </p>
            </div>

            <div className="w3101-info-box">
              <div className="w3101-info-box-label">Censorship Resistance</div>
              <p>
                Because smart contracts live on a decentralized blockchain, <strong>no government or corporation can shut them down</strong>. Even if a dApp's website is taken down, the smart contracts continue running. Anyone can build a new frontend to interact with the same contracts. This is why DeFi protocols survived regulatory pressure \u2014 the code lives forever on-chain.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`w3101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — The Role of Tokens in Web3
          ============================================================ */}
      <div className={`w3101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="w3101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="w3101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="w3101-lesson-header-text">
            <div className="w3101-lesson-title">The Role of Tokens in Web3</div>
            <div className="w3101-lesson-meta"><span>7 min read</span><span>Economics</span></div>
          </div>
          <div className="w3101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="w3101-lesson-content">
          <div className="w3101-lesson-body">
            <h3>Tokens: The Building Blocks of Web3</h3>
            <p>
              Tokens are the fundamental units of value in Web3. But they're far more than just "cryptocurrency." Tokens represent <strong>programmable value</strong> \u2014 they can embody anything from currency and ownership stakes to access passes and voting rights. They're what make Web3 economics work.
            </p>
            <p>
              At the technical level, a token is simply a smart contract that tracks balances. The <strong>ERC-20</strong> standard defines fungible tokens (where each unit is interchangeable, like dollars), while <strong>ERC-721</strong> defines non-fungible tokens (where each unit is unique, like a house deed). These two standards power the vast majority of Web3 applications.
            </p>

            <h3>Types of Tokens</h3>
            <div className="w3101-data-block">
              <div className="w3101-data-section-label">Token Categories in Web3</div>
              <div className="w3101-data-row"><span className="w3101-data-label">Utility Tokens</span><span className="w3101-data-value">Access services, pay fees, fuel protocols (e.g., ETH, ELOQ)</span></div>
              <div className="w3101-data-row"><span className="w3101-data-label">Governance Tokens</span><span className="w3101-data-value purple">Vote on proposals, steer protocol direction (e.g., OEC, UNI)</span></div>
              <div className="w3101-data-row"><span className="w3101-data-label">Stablecoins</span><span className="w3101-data-value green">Pegged to fiat currencies for stability (e.g., USDC, ALUD)</span></div>
              <div className="w3101-data-row"><span className="w3101-data-label">LP Tokens</span><span className="w3101-data-value cyan">Represent share of a liquidity pool (e.g., ELOQ-LP)</span></div>
              <div className="w3101-data-row"><span className="w3101-data-label">NFTs</span><span className="w3101-data-value orange">Unique digital assets: art, memberships, identity (ERC-721)</span></div>
              <div className="w3101-data-row"><span className="w3101-data-label">Wrapped Tokens</span><span className="w3101-data-value amber">Cross-chain bridges: WETH, WBTC</span></div>
            </div>

            <h3>Governance Tokens: Democracy on the Blockchain</h3>
            <p>
              <strong>Governance tokens</strong> give holders voting power over a protocol's future. This is direct democracy applied to software \u2014 token holders propose changes, vote on them, and the results are executed automatically by smart contracts. No board of directors, no CEO making unilateral decisions. The community decides.
            </p>
            <p>
              The amount of governance power you have typically scales with how many tokens you hold and how long you've committed to the protocol (through staking). This creates alignment: those with the most at stake have the most say in the protocol's direction.
            </p>

            <h3>NFTs: Identity and Membership</h3>
            <p>
              NFTs have evolved far beyond digital art. They now serve as <strong>membership passes</strong> (token-gated communities), <strong>identity credentials</strong> (proof of attendance, certifications), <strong>gaming assets</strong> (items that work across games), and <strong>real-world asset representations</strong> (deeds, tickets, licenses). The common thread: each NFT is provably unique and provably owned.
            </p>

            <div className="w3101-info-box green">
              <div className="w3101-info-box-label">Oeconomia Connection</div>
              <p>
                The Oeconomia ecosystem showcases the full spectrum of token utility. <strong>OEC</strong> is the governance token \u2014 stake it as a Guardian to vote on proposals and earn rewards. <strong>ELOQ</strong> is the utility token powering the Eloqura DEX \u2014 used for trading fee discounts and liquidity incentives. <strong>ALUD</strong> is a stablecoin minted through Alluria's lending protocol. Together, these tokens form an interconnected economy where each serves a distinct, essential purpose.
              </p>
            </div>

            <div className="w3101-info-box amber">
              <div className="w3101-info-box-label">The Token Economy</div>
              <p>
                Tokens enable entirely new business models. Instead of a company selling shares on a stock exchange, a protocol distributes governance tokens to its users. Instead of a subscription fee, users stake tokens for access. Instead of advertising revenue, protocols earn from transaction fees distributed to token holders. This is the <strong>ownership economy</strong> \u2014 where users are also stakeholders.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`w3101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
