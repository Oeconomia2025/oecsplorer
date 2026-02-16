// ============================================================
// Private Keys & Seed Phrases — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./privatekeys.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "Public Keys vs. Private Keys", meta: "7 min read \u00B7 Cryptography" },
  { num: 2, title: "What a Seed Phrase (Mnemonic) Is", meta: "7 min read \u00B7 Standards" },
  { num: 3, title: "How HD Wallets Derive Multiple Addresses", meta: "8 min read \u00B7 Technical" },
  { num: 4, title: "Storage Best Practices: Hardware Wallets, Paper Backups", meta: "8 min read \u00B7 Security" },
  { num: 5, title: "What Happens If You Lose Your Seed Phrase", meta: "6 min read \u00B7 Reality" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What is the relationship between a public key and a private key?",
    options: [
      { letter: "A", text: "They are the same key used for different purposes", correct: false },
      { letter: "B", text: "The public key is derived from the private key using one-way cryptography", correct: true },
      { letter: "C", text: "The private key is derived from the public key", correct: false },
      { letter: "D", text: "They are randomly generated independently of each other", correct: false },
    ],
    correctMsg: "Correct! The public key is mathematically derived from the private key using elliptic curve cryptography. This is a one-way function: you can always derive the public key from the private key, but you cannot reverse the process.",
    wrongMsg: "Not quite \u2014 the public key is derived from the private key using one-way cryptographic functions. It cannot be reversed.",
  },
  2: {
    question: "How many words are in a standard seed phrase?",
    options: [
      { letter: "A", text: "8 or 16 words", correct: false },
      { letter: "B", text: "12 or 24 words from a specific word list", correct: true },
      { letter: "C", text: "Any number of words you choose", correct: false },
      { letter: "D", text: "6 words plus a PIN code", correct: false },
    ],
    correctMsg: "Correct! The BIP-39 standard defines seed phrases as either 12 or 24 words, selected from a specific list of 2,048 English words. The words encode the entropy that generates all your keys.",
    wrongMsg: "Not quite \u2014 standard seed phrases are either 12 or 24 words, selected from the BIP-39 word list of 2,048 words.",
  },
  3: {
    question: "What does 'HD' stand for in HD wallets?",
    options: [
      { letter: "A", text: "High Definition", correct: false },
      { letter: "B", text: "Hard Drive", correct: false },
      { letter: "C", text: "Hierarchical Deterministic", correct: true },
      { letter: "D", text: "Hashed Distributed", correct: false },
    ],
    correctMsg: "Correct! HD stands for Hierarchical Deterministic. It means the wallet uses a tree-like structure where a single seed can deterministically generate an unlimited number of key pairs in a predictable, reproducible way.",
    wrongMsg: "Not quite \u2014 HD stands for Hierarchical Deterministic, referring to the tree-like structure used to derive multiple keys from a single seed.",
  },
  4: {
    question: "Which storage method is most secure for long-term holdings?",
    options: [
      { letter: "A", text: "MetaMask browser extension on your everyday laptop", correct: false },
      { letter: "B", text: "A mobile wallet app on your phone", correct: false },
      { letter: "C", text: "Hardware wallet stored in a secure location", correct: true },
      { letter: "D", text: "An exchange account with two-factor authentication", correct: false },
    ],
    correctMsg: "Correct! Hardware wallets (like Ledger or Trezor) keep your private keys on a dedicated device that never connects to the internet, making them nearly immune to remote attacks. Storing the device securely adds physical protection.",
    wrongMsg: "Not quite \u2014 hardware wallets stored in a secure location provide the best security for long-term holdings because private keys never touch an internet-connected device.",
  },
  5: {
    question: "Can you recover a wallet without the seed phrase or private key?",
    options: [
      { letter: "A", text: "Yes, by contacting Ethereum support", correct: false },
      { letter: "B", text: "Yes, by verifying your identity with MetaMask", correct: false },
      { letter: "C", text: "Yes, if you remember your MetaMask password", correct: false },
      { letter: "D", text: "No \u2014 there is no 'forgot password' in crypto", correct: true },
    ],
    correctMsg: "Correct! There is no central authority, no customer support, and no \"forgot password\" option in crypto. If you lose your seed phrase and private keys, your funds are permanently inaccessible. Self-custody means self-responsibility.",
    wrongMsg: "Not quite \u2014 there is no way to recover a wallet without the seed phrase or private key. Crypto is fully self-custodial with no password reset option.",
  },
};

/* ---- Mock key generation ---- */
function randomHex(length: number): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

function generateMockKeyPair() {
  const privateKey = "0x" + randomHex(64);
  // "Derive" a mock public key (just random, but visually different)
  const publicKey = "0x04" + randomHex(128);
  // "Derive" a mock address
  const address = "0x" + randomHex(40);
  return { privateKey, publicKey, address };
}

export default function PrivateKeysContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // Key Pair Visualizer state
  const [keyPair, setKeyPair] = useState(generateMockKeyPair);

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

  const regenerateKeyPair = useCallback(() => {
    setKeyPair(generateMockKeyPair());
  }, []);

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="pk101-quiz-section">
        <div className="pk101-quiz-title">Check Your Understanding</div>
        <div className="pk101-quiz-question">{q.question}</div>
        <div className="pk101-quiz-options">
          {q.options.map((opt) => {
            let cls = "pk101-quiz-option";
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
          <div className={`pk101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="pk101">
      {/* Progress bar */}
      <div className="pk101-progress">
        <div className="pk101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`pk101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="pk101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — Public Keys vs. Private Keys
          ============================================================ */}
      <div className={`pk101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="pk101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="pk101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="pk101-lesson-header-text">
            <div className="pk101-lesson-title">Public Keys vs. Private Keys</div>
            <div className="pk101-lesson-meta"><span>7 min read</span><span>Cryptography</span></div>
          </div>
          <div className="pk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="pk101-lesson-content">
          <div className="pk101-lesson-body">
            <h3>Asymmetric Cryptography Made Simple</h3>
            <p>
              At the heart of every cryptocurrency wallet is a concept called <strong>asymmetric cryptography</strong> (also known as public-key cryptography). Unlike a traditional password where a single secret unlocks everything, asymmetric cryptography uses a <strong>pair of mathematically linked keys</strong>: a private key and a public key. They are generated together, but serve very different purposes.
            </p>
            <p>
              Your <strong>private key</strong> is a random 256-bit number, typically displayed as a 64-character hexadecimal string. It is the ultimate proof of ownership. Whoever holds the private key controls the associated wallet and all its funds. It must be kept absolutely secret.
            </p>
            <p>
              Your <strong>public key</strong> is derived from the private key using elliptic curve cryptography (specifically the <strong>secp256k1</strong> curve). This is a one-way mathematical function: easy to compute in one direction (private {"\u2192"} public), but computationally impossible to reverse (public {"\u2192"} private). Your Ethereum <strong>address</strong> is then derived from the public key by taking the last 20 bytes of its Keccak-256 hash.
            </p>

            <h3>The Mailbox Analogy</h3>
            <p>
              Think of your <strong>public address</strong> as your mailbox. Anyone can see it, anyone can drop mail (send crypto) into it. But only the person with the <strong>key to the mailbox</strong> (your private key) can open it and access what is inside. You can freely share your address with the world. You must never share your private key with anyone.
            </p>

            <div className="pk101-compare-grid">
              <div className="pk101-compare-card">
                <h4>Public Key / Address</h4>
                <ul>
                  <li>Safe to share with anyone</li>
                  <li>Used to receive crypto</li>
                  <li>Derived from the private key (one-way)</li>
                  <li>Like an email address or bank account number</li>
                  <li>Visible on the blockchain for every transaction</li>
                </ul>
              </div>
              <div className="pk101-compare-card">
                <h4>Private Key</h4>
                <ul>
                  <li>Must be kept secret at all times</li>
                  <li>Used to sign (authorize) transactions</li>
                  <li>Cannot be derived from the public key</li>
                  <li>Like the password to your bank account</li>
                  <li>Never stored on the blockchain</li>
                </ul>
              </div>
            </div>

            <div className="pk101-info-box blue">
              <div className="pk101-info-box-label">How Signing Works</div>
              <p>
                When you send a transaction, your wallet uses the private key to create a <strong>digital signature</strong>. This signature proves you authorized the transaction without revealing the private key itself. Anyone can verify the signature using your public key, but they cannot forge it or extract your private key from it. This is the mathematical magic that makes blockchain security work.
              </p>
            </div>

            <div className="pk101-info-box red">
              <div className="pk101-info-box-label">The Golden Rule</div>
              <p>
                <strong>Not your keys, not your crypto.</strong> If someone else holds your private key (such as a centralized exchange), they control your funds. If they get hacked, go bankrupt, or freeze your account, your crypto is at risk. True ownership in crypto means holding your own private keys.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`pk101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — What a Seed Phrase (Mnemonic) Is
          ============================================================ */}
      <div className={`pk101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="pk101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="pk101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="pk101-lesson-header-text">
            <div className="pk101-lesson-title">What a Seed Phrase (Mnemonic) Is</div>
            <div className="pk101-lesson-meta"><span>7 min read</span><span>Standards</span></div>
          </div>
          <div className="pk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="pk101-lesson-content">
          <div className="pk101-lesson-body">
            <h3>From Random Numbers to Human-Readable Words</h3>
            <p>
              A private key is a 256-bit random number. In hexadecimal, it looks like: <code>a3f8b2c1e5d7...</code> (64 characters). This is nearly impossible for humans to memorize, transcribe accurately, or even verify at a glance. One wrong character means a completely different key and a lost wallet.
            </p>
            <p>
              The <strong>BIP-39 standard</strong> (Bitcoin Improvement Proposal 39) solved this problem by encoding the same randomness as a sequence of <strong>English words</strong>. Instead of 64 hexadecimal characters, you get 12 or 24 common English words like "apple river mountain silence..." that are much easier to write down, verify, and store.
            </p>
            <p>
              These words are selected from a specific list of exactly <strong>2,048 words</strong>. Each word maps to an 11-bit number (2^11 = 2,048). A 12-word phrase encodes 128 bits of entropy, and a 24-word phrase encodes 256 bits. The math is elegant: the same randomness, just represented differently.
            </p>

            <h3>One Seed, Infinite Keys</h3>
            <p>
              The critical insight is that a seed phrase does not map to a single private key. It is the <strong>root</strong> of an entire tree of keys. From one seed phrase, your wallet can derive millions of unique private keys, each with its own address. This is why you can have multiple accounts in MetaMask, all backed by the same seed phrase.
            </p>

            <div className="pk101-info-box">
              <div className="pk101-info-box-label">The 2,048 Word List</div>
              <p>
                The BIP-39 word list was carefully curated. No two words share the same first four letters (so "apple" and "apply" would not both appear). Words are common English words, easy to spell and recognize. This reduces transcription errors. The full list is publicly available and standardized across all BIP-39-compatible wallets (MetaMask, Ledger, Trezor, etc.).
              </p>
            </div>

            <div className="pk101-data-block">
              <div className="pk101-data-section-label">Seed Phrase Specifications</div>
              <div className="pk101-data-row"><span className="pk101-data-label">Word Count</span><span className="pk101-data-value">12 or 24 words</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">Word List Size</span><span className="pk101-data-value cyan">2,048 words</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">Entropy (12 words)</span><span className="pk101-data-value">128 bits</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">Entropy (24 words)</span><span className="pk101-data-value">256 bits</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">Possible Combinations (12)</span><span className="pk101-data-value purple">~3.4 x 10^38</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">Standard</span><span className="pk101-data-value green">BIP-39 (2013)</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">Languages Supported</span><span className="pk101-data-value">English, Japanese, Korean, Spanish, + more</span></div>
            </div>

            <div className="pk101-info-box purple">
              <div className="pk101-info-box-label">Order Matters</div>
              <p>
                The <strong>order of words in your seed phrase matters</strong>. "apple river mountain" is a completely different seed from "mountain river apple." When writing down your seed phrase, number each word. If you scramble the order, the seed produces entirely different keys and you will not be able to recover your wallet.
              </p>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`pk101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — How HD Wallets Derive Multiple Addresses
          ============================================================ */}
      <div className={`pk101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="pk101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="pk101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="pk101-lesson-header-text">
            <div className="pk101-lesson-title">How HD Wallets Derive Multiple Addresses</div>
            <div className="pk101-lesson-meta"><span>8 min read</span><span>Technical</span></div>
          </div>
          <div className="pk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="pk101-lesson-content">
          <div className="pk101-lesson-body">
            <h3>Hierarchical Deterministic Wallets</h3>
            <p>
              An <strong>HD wallet</strong> (Hierarchical Deterministic wallet, defined by the <strong>BIP-32</strong> and <strong>BIP-44</strong> standards) is a wallet that derives all of its keys from a single master seed. The word "hierarchical" means the keys are organized in a tree structure (like folders and subfolders). "Deterministic" means the same seed always produces the same tree of keys in the same order.
            </p>
            <p>
              This is incredibly powerful. With a single 12 or 24-word seed phrase, you can reconstruct an unlimited number of accounts across multiple blockchains. MetaMask's "Account 1," "Account 2," etc. are all derived from the same seed using different <strong>derivation paths</strong>.
            </p>

            <h3>Derivation Paths Explained</h3>
            <p>
              A <strong>derivation path</strong> is like a file path on your computer. It tells the wallet exactly how to navigate the key tree to arrive at a specific key. The standard Ethereum derivation path looks like: <code>m/44'/60'/0'/0/0</code>. Each number represents a level in the hierarchy.
            </p>

            <div className="pk101-data-block">
              <div className="pk101-data-section-label">HD Wallet Derivation Tree</div>
              <div className="pk101-data-row"><span className="pk101-data-label">m</span><span className="pk101-data-value">Master key (from your seed)</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">44'</span><span className="pk101-data-value cyan">BIP-44 purpose (multi-account)</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">60'</span><span className="pk101-data-value purple">Coin type (60 = Ethereum)</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">0'</span><span className="pk101-data-value">Account index</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">0</span><span className="pk101-data-value">Change (0 = external)</span></div>
              <div className="pk101-data-row"><span className="pk101-data-label">0</span><span className="pk101-data-value green">Address index (0, 1, 2, ...)</span></div>
            </div>

            <p>
              When you click "Create Account" in MetaMask, it increments the last number. Account 1 uses path <code>m/44'/60'/0'/0/0</code>, Account 2 uses <code>m/44'/60'/0'/0/1</code>, and so on. Each path produces a completely different private key and address, but they are all recoverable from the same seed.
            </p>

            <h3>Try It: Key Pair Visualizer</h3>
            <div className="pk101-keygen">
              <div className="pk101-keygen-title">Key Derivation Visualizer</div>
              <div className="pk101-keygen-chain">
                <div className="pk101-keygen-block highlight">
                  <div className="pk101-keygen-block-label private">Private Key (256-bit secret)</div>
                  <div className="pk101-keygen-block-value">{keyPair.privateKey}</div>
                </div>
                <div className="pk101-keygen-arrow">
                  {"\u2193"}
                  <span className="pk101-keygen-arrow-label">Elliptic Curve Multiplication (one-way)</span>
                </div>
                <div className="pk101-keygen-block">
                  <div className="pk101-keygen-block-label public">Public Key (512-bit, uncompressed)</div>
                  <div className="pk101-keygen-block-value">{keyPair.publicKey}</div>
                </div>
                <div className="pk101-keygen-arrow">
                  {"\u2193"}
                  <span className="pk101-keygen-arrow-label">Keccak-256 Hash {"\u2192"} Last 20 bytes</span>
                </div>
                <div className="pk101-keygen-block">
                  <div className="pk101-keygen-block-label address">Ethereum Address (160-bit)</div>
                  <div className="pk101-keygen-block-value">{keyPair.address}</div>
                </div>
              </div>
              <button className="pk101-keygen-btn" onClick={regenerateKeyPair}>
                Generate New Key Pair
              </button>
            </div>

            <div className="pk101-info-box cyan">
              <div className="pk101-info-box-label">Cross-Chain Compatibility</div>
              <p>
                Because derivation paths include a "coin type" field, the same seed phrase can generate keys for multiple blockchains. Ethereum uses coin type 60, Bitcoin uses 0, Solana uses 501. This is why a Ledger hardware wallet can manage Bitcoin, Ethereum, and dozens of other chains from a single seed phrase.
              </p>
            </div>

            <div className="pk101-info-box">
              <div className="pk101-info-box-label">Why This Matters</div>
              <p>
                HD wallets mean you only need to back up <strong>one thing</strong>: your seed phrase. No matter how many accounts you create, which networks you use, or how many transactions you make, that single seed phrase reconstructs everything. Lose it, and you lose access to all derived accounts simultaneously.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`pk101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Storage Best Practices
          ============================================================ */}
      <div className={`pk101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="pk101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="pk101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="pk101-lesson-header-text">
            <div className="pk101-lesson-title">Storage Best Practices: Hardware Wallets, Paper Backups</div>
            <div className="pk101-lesson-meta"><span>8 min read</span><span>Security</span></div>
          </div>
          <div className="pk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="pk101-lesson-content">
          <div className="pk101-lesson-body">
            <h3>The Security Spectrum</h3>
            <p>
              Not all wallets are created equal. The security of your crypto depends on <strong>how and where your private keys are stored</strong>. The spectrum ranges from "hot wallets" (always connected to the internet, convenient but vulnerable) to "cold storage" (completely offline, secure but less convenient). Your choice depends on how much value you are securing and how frequently you need access.
            </p>

            <div className="pk101-three-col">
              <div className="pk101-col-card">
                <h4>Hot Wallet</h4>
                <p>Browser extensions (MetaMask) and mobile apps. Keys stored on your device. Convenient for daily use but vulnerable to malware, phishing, and device theft. Best for small amounts you actively trade.</p>
              </div>
              <div className="pk101-col-card">
                <h4>Hardware Wallet</h4>
                <p>Dedicated physical devices (Ledger, Trezor). Keys generated and stored on the device, never exposed to your computer. Transactions must be physically confirmed on the device. Best for serious holdings.</p>
              </div>
              <div className="pk101-col-card">
                <h4>Paper / Metal Backup</h4>
                <p>Seed phrase written on paper or stamped into metal. Completely offline. Immune to hacking. Vulnerable to fire (paper), physical theft, and loss. Best as a backup for recovery, not daily use.</p>
              </div>
            </div>

            <h3>Hardware Wallet Deep Dive</h3>
            <p>
              A <strong>hardware wallet</strong> is a small physical device (typically USB-sized) that generates and stores your private keys in a secure chip. The key never leaves the device. When you want to sign a transaction, your computer sends the transaction data to the device, the device signs it internally, and sends back only the signature. Even if your computer is compromised with malware, the attacker cannot extract your private key.
            </p>
            <p>
              The two most popular hardware wallets are <strong>Ledger</strong> (uses a secure element chip, supports 5,000+ tokens) and <strong>Trezor</strong> (open-source firmware, strong community trust). Both work with MetaMask: you connect the device, and MetaMask uses it for signing instead of its built-in key storage.
            </p>

            <div className="pk101-compare-grid">
              <div className="pk101-compare-card">
                <h4>Ledger</h4>
                <ul>
                  <li>Secure Element chip (CC EAL5+)</li>
                  <li>Bluetooth option (Nano X)</li>
                  <li>Closed-source secure element</li>
                  <li>Ledger Live companion app</li>
                  <li>Price: $79-$149</li>
                </ul>
              </div>
              <div className="pk101-compare-card">
                <h4>Trezor</h4>
                <ul>
                  <li>Fully open-source firmware</li>
                  <li>Touchscreen (Model T/Safe 3)</li>
                  <li>No Bluetooth (USB only)</li>
                  <li>Shamir backup support (SLIP39)</li>
                  <li>Price: $69-$179</li>
                </ul>
              </div>
            </div>

            <div className="pk101-info-box green">
              <div className="pk101-info-box-label">Recommended Setup</div>
              <p>
                For the best security, use a <strong>hardware wallet for your main holdings</strong> and a <strong>MetaMask hot wallet with a small balance</strong> for daily DeFi interactions. Think of it like keeping walking-around cash in your pocket and your savings in a vault. Your hardware wallet's seed phrase should be written on paper (or metal) and stored in a safe or safety deposit box.
              </p>
            </div>

            <div className="pk101-info-box red">
              <div className="pk101-info-box-label">Never Do This</div>
              <p>
                Never type your seed phrase into any website. Never store it in a password manager, email, cloud drive, or notes app. Never take a photo or screenshot. Never share it on Discord, Telegram, or with "support" agents. Legitimate wallet companies and protocols will <strong>never</strong> ask for your seed phrase. If someone asks, it is a scam, 100% of the time.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`pk101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — What Happens If You Lose Your Seed Phrase
          ============================================================ */}
      <div className={`pk101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="pk101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="pk101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="pk101-lesson-header-text">
            <div className="pk101-lesson-title">What Happens If You Lose Your Seed Phrase</div>
            <div className="pk101-lesson-meta"><span>6 min read</span><span>Reality</span></div>
          </div>
          <div className="pk101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="pk101-lesson-content">
          <div className="pk101-lesson-body">
            <h3>No Recovery, No Reset, No Support</h3>
            <p>
              In traditional finance, if you forget your bank password, you call customer support, verify your identity, and get access back. In crypto, <strong>there is no customer support</strong>. There is no "Forgot Password" button. There is no company that can override the blockchain. If you lose your seed phrase and your private keys, your funds are <strong>permanently, irreversibly inaccessible</strong>. They still exist on the blockchain, visible to everyone, but no one can ever touch them again.
            </p>
            <p>
              This is the fundamental tradeoff of self-custody. You get absolute control over your assets, free from banks, governments, and corporations. But with that freedom comes absolute responsibility. Nobody can help you if you lose access.
            </p>

            <h3>Real Stories of Lost Crypto</h3>
            <p>
              These are not hypothetical scenarios. They have happened to real people, with real consequences, involving staggering amounts of money.
            </p>

            <div className="pk101-stats-row">
              <div className="pk101-stat-card"><div className="pk101-stat-value">$265M</div><div className="pk101-stat-label">Lost by James Howells (hard drive in landfill)</div></div>
              <div className="pk101-stat-card"><div className="pk101-stat-value">7,002 BTC</div><div className="pk101-stat-label">Locked forever on that drive</div></div>
              <div className="pk101-stat-card"><div className="pk101-stat-value">~20%</div><div className="pk101-stat-label">Of all Bitcoin is estimated lost forever</div></div>
            </div>

            <p>
              <strong>James Howells</strong> accidentally threw away a hard drive containing 7,002 Bitcoin in 2013. By 2024, those coins were worth over $265 million. He has spent years trying to get permission to excavate the landfill where the drive was dumped. Permission has been denied repeatedly. The coins sit untouched on the blockchain.
            </p>
            <p>
              <strong>Stefan Thomas</strong> lost the password to his IronKey hardware wallet containing 7,002 Bitcoin (a different person, coincidentally the same amount). The IronKey allows only 10 password attempts before permanently erasing itself. He has used 8 of 10 attempts. Two wrong guesses remain before over $200 million is locked forever.
            </p>

            <div className="pk101-info-box red">
              <div className="pk101-info-box-label">This Is Permanent</div>
              <p>
                An estimated <strong>3-4 million Bitcoin</strong> (worth hundreds of billions of dollars) are believed to be permanently lost due to forgotten passwords, lost seed phrases, destroyed hardware, and deceased holders who never shared their recovery information. These coins can never be recovered by anyone, ever. The same applies to ETH and all other cryptocurrency.
              </p>
            </div>

            <h3>The Oeconomia Perspective</h3>
            <p>
              Self-custody is a cornerstone of the Oeconomia philosophy. When you stake OEC tokens, provide liquidity on Eloqura, or take a loan on Alluria, <strong>you remain in full control of your assets</strong>. Your keys, your crypto. But this also means the responsibility is yours. Before you interact with any Oeconomia protocol, make sure your seed phrase is safely backed up and your wallet security is solid.
            </p>

            <div className="pk101-info-box green">
              <div className="pk101-info-box-label">Prevention Checklist</div>
              <p>
                Write your seed phrase on paper. Store it in a fireproof safe. Make a second copy and store it in a different physical location. Consider stamping it on metal for fire/water resistance. Test your backup by restoring the wallet on a different device before depositing significant funds. Set calendar reminders to periodically verify your backup is still accessible and legible.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`pk101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
