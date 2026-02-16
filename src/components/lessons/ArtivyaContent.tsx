// ============================================================
// Artivya: NFT Marketplace & Trading — Interactive lesson content
// ============================================================

import { useState, useCallback } from "react";
import "./artivya.css";

/* ---- helpers ---- */
const LESSONS = [
  { num: 1, title: "Hybrid Trading: Order Book Meets AMM", meta: "8 min read \u00B7 Trading Models" },
  { num: 2, title: "The NFT Marketplace: Listing, Buying, and Bidding", meta: "10 min read \u00B7 Marketplace" },
  { num: 3, title: "Creator Royalties and Enforcement", meta: "8 min read \u00B7 Creator Economy" },
  { num: 4, title: "Collection-Level Analytics and Floor Prices", meta: "10 min read \u00B7 Analytics" },
  { num: 5, title: "Cross-Protocol Token Trading", meta: "8 min read \u00B7 Ecosystem" },
];

const QUIZ_DATA: Record<number, { question: string; options: { letter: string; text: string; correct: boolean }[]; correctMsg: string; wrongMsg: string }> = {
  1: {
    question: "What is hybrid trading?",
    options: [
      { letter: "A", text: "Trading both crypto and traditional stocks on the same platform", correct: false },
      { letter: "B", text: "Combining order book (limit orders) and AMM (liquidity pools) for both precision and guaranteed liquidity", correct: true },
      { letter: "C", text: "Trading between two different blockchains simultaneously", correct: false },
      { letter: "D", text: "A system that switches between manual and automated trading", correct: false },
    ],
    correctMsg: "Correct! Hybrid trading combines the precision of order books with the guaranteed liquidity of AMMs, giving traders the best of both worlds.",
    wrongMsg: "Not quite \u2014 hybrid trading combines order book (limit orders with precise price control) and AMM (liquidity pools with instant execution) in a single system.",
  },
  2: {
    question: "What token standards does Artivya support for NFTs?",
    options: [
      { letter: "A", text: "Only ERC-20 tokens", correct: false },
      { letter: "B", text: "ERC-721 (unique items) and ERC-1155 (semi-fungible/editions)", correct: true },
      { letter: "C", text: "Only ERC-721 tokens", correct: false },
      { letter: "D", text: "A custom Artivya-specific token standard", correct: false },
    ],
    correctMsg: "Correct! ERC-721 handles unique 1-of-1 items, while ERC-1155 handles editions and semi-fungible tokens \u2014 Artivya supports both.",
    wrongMsg: "Not quite \u2014 Artivya supports both ERC-721 (unique items) and ERC-1155 (semi-fungible editions).",
  },
  3: {
    question: "How are creator royalties enforced on Artivya?",
    options: [
      { letter: "A", text: "By asking buyers to voluntarily pay the creator", correct: false },
      { letter: "B", text: "Through a centralized royalty collection service", correct: false },
      { letter: "C", text: "Through smart contracts that automatically send royalty payments on every secondary sale", correct: true },
      { letter: "D", text: "By requiring creators to manually claim royalties each month", correct: false },
    ],
    correctMsg: "Correct! Smart contract-enforced royalties ensure creators automatically receive their percentage on every secondary sale, with no way to bypass the payment.",
    wrongMsg: "Not quite \u2014 Artivya uses smart contracts to automatically and irrevocably enforce royalty payments on every secondary sale.",
  },
  4: {
    question: "What is a 'floor price' for an NFT collection?",
    options: [
      { letter: "A", text: "The average price of all items in the collection", correct: false },
      { letter: "B", text: "The highest price ever paid for an item in the collection", correct: false },
      { letter: "C", text: "The lowest price at which any item in the collection is currently listed for sale", correct: true },
      { letter: "D", text: "The price set by the creator when the collection launched", correct: false },
    ],
    correctMsg: "Correct! The floor price is the lowest current listing price \u2014 the cheapest way to enter a collection. It's the most-watched metric for NFT investors.",
    wrongMsg: "Not quite \u2014 the floor price is the lowest price at which any item in the collection is currently listed for sale.",
  },
  5: {
    question: "How does Artivya connect to other Oeconomia protocols?",
    options: [
      { letter: "A", text: "It doesn't \u2014 Artivya operates independently", correct: false },
      { letter: "B", text: "Through a centralized bridge operated by the Oeconomia team", correct: false },
      { letter: "C", text: "Token trading uses Eloqura liquidity, and marketplace parameters are governed by ARTV and OEC holders", correct: true },
      { letter: "D", text: "By sharing the same database with other protocols", correct: false },
    ],
    correctMsg: "Correct! Artivya leverages Eloqura's deep liquidity for token trading, while governance of marketplace parameters is shared between ARTV token holders and OEC governance.",
    wrongMsg: "Not quite \u2014 Artivya integrates with Eloqura for token liquidity and uses OEC/ARTV governance for marketplace parameters.",
  },
};

export default function ArtivyaContent() {
  const [activeLesson, setActiveLesson] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizAnswers, setQuizAnswers] = useState<Map<number, boolean>>(new Map());

  // NFT Auction Simulator state
  const [bidAmount, setBidAmount] = useState("");
  const [bids, setBids] = useState<{ bidder: string; amount: number }[]>([]);
  const [auctionEnded, setAuctionEnded] = useState(false);
  const bidderNames = ["You", "CryptoWhale.eth", "ArtCollector42", "NFTHunter.eth", "DiamondHands"];

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

  // Auction functions
  const currentHighBid = bids.length > 0 ? bids[bids.length - 1].amount : 0.5;
  const minBid = currentHighBid + 0.1;

  const placeBid = useCallback(() => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount < minBid || auctionEnded) return;
    const newBids = [...bids, { bidder: "You", amount }];
    // Simulate a counter-bid from another user
    if (newBids.length < 5 && !auctionEnded) {
      const counterBidder = bidderNames[Math.floor(Math.random() * (bidderNames.length - 1)) + 1];
      const counterAmount = parseFloat((amount + 0.05 + Math.random() * 0.3).toFixed(2));
      newBids.push({ bidder: counterBidder, amount: counterAmount });
    }
    setBids(newBids);
    setBidAmount("");
  }, [bidAmount, minBid, bids, auctionEnded]);

  const endAuction = useCallback(() => {
    setAuctionEnded(true);
  }, []);

  const resetAuction = useCallback(() => {
    setBids([]);
    setAuctionEnded(false);
    setBidAmount("");
  }, []);

  const winner = bids.length > 0 ? bids[bids.length - 1] : null;
  const royaltyRate = 0.075;

  /* ---- Quiz renderer ---- */
  const renderQuizWithSelection = (quizNum: number) => {
    const q = QUIZ_DATA[quizNum];
    const answered = quizAnswers.has(quizNum);
    const wasCorrect = quizAnswers.get(quizNum);
    return (
      <div className="av101-quiz-section">
        <div className="av101-quiz-title">Check Your Understanding</div>
        <div className="av101-quiz-question">{q.question}</div>
        <div className="av101-quiz-options">
          {q.options.map((opt) => {
            let cls = "av101-quiz-option";
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
          <div className={`av101-quiz-feedback ${wasCorrect ? "correct" : "wrong"}`}>
            {wasCorrect ? q.correctMsg : q.wrongMsg}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="av101">
      {/* Progress bar */}
      <div className="av101-progress">
        <div className="av101-progress-steps">
          {LESSONS.map((l) => (
            <div
              key={l.num}
              className={`av101-progress-step${completed.has(l.num) ? " completed" : ""}${activeLesson === l.num ? " active" : ""}`}
              onClick={() => setActiveLesson(l.num)}
            />
          ))}
        </div>
        <div className="av101-progress-label">
          <span>{completed.size} of 5 complete</span>
          <span>{Math.round((completed.size / 5) * 100)}%</span>
        </div>
      </div>

      {/* ============================================================
          LESSON 1 — Hybrid Trading: Order Book Meets AMM
          ============================================================ */}
      <div className={`av101-lesson${activeLesson === 1 ? " active" : ""}${completed.has(1) ? " completed" : ""}`}>
        <div className="av101-lesson-header" onClick={() => toggleLesson(1)}>
          <div className="av101-lesson-number">{completed.has(1) ? "\u2713" : "01"}</div>
          <div className="av101-lesson-header-text">
            <div className="av101-lesson-title">Hybrid Trading: Order Book Meets AMM</div>
            <div className="av101-lesson-meta"><span>8 min read</span><span>Trading Models</span></div>
          </div>
          <div className="av101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="av101-lesson-content">
          <div className="av101-lesson-body">
            <h3>Two Trading Models, One Platform</h3>
            <p>
              Traditional exchanges (Coinbase, Binance, the NYSE) use <strong>order books</strong> — a list of buy and sell orders at specific prices. Buyers say "I'll pay $100" and sellers say "I'll sell for $101," and when orders match, a trade happens. This gives traders precise control but requires someone on the other side of every trade. If nobody wants to sell at your price, your order sits unfilled.
            </p>
            <p>
              <strong>AMMs (Automated Market Makers)</strong>, like those powering Eloqura, use liquidity pools instead. There's always a price available because the algorithm calculates it from pool reserves. You can trade instantly at any time, but you don't control the exact execution price — it's determined by the formula and your trade size. AMMs guarantee liquidity but sacrifice precision.
            </p>
            <p>
              Artivya combines both approaches into a <strong>hybrid trading engine</strong>. For tokens that benefit from precise pricing (like ARTV governance tokens), the order book provides limit orders and stop-losses. For tokens that need guaranteed instant execution, the AMM pools handle swaps. The router automatically selects the best execution venue for each trade.
            </p>

            <div className="av101-compare-grid">
              <div className="av101-compare-card">
                <h4>Order Book</h4>
                <ul>
                  <li>Set exact buy/sell prices (limit orders)</li>
                  <li>Support for stop-loss and take-profit</li>
                  <li>No price impact on orders (fixed price)</li>
                  <li>Requires counterparty to fill the order</li>
                  <li>May sit unfilled if no match exists</li>
                  <li>Familiar to traditional traders</li>
                </ul>
              </div>
              <div className="av101-compare-card">
                <h4>AMM (Liquidity Pools)</h4>
                <ul>
                  <li>Instant execution at algorithmic price</li>
                  <li>Always available liquidity (no counterparty needed)</li>
                  <li>Price impact on large trades</li>
                  <li>Simple UX: just specify amount and swap</li>
                  <li>24/7 availability without market makers</li>
                  <li>Native to DeFi and decentralized exchanges</li>
                </ul>
              </div>
            </div>

            <div className="av101-info-box green">
              <div className="av101-info-box-label">Why Hybrid Is Better</div>
              <p>
                Neither model alone is perfect. Order books can have <strong>thin liquidity</strong> for less popular tokens, leaving traders unable to execute. AMMs always provide a price, but the <strong>price impact</strong> can be severe for large trades. Artivya's hybrid approach means traders always have options: use the order book for precision, or use the AMM for guaranteed fills. The system routes each trade to the venue that offers the best outcome.
              </p>
            </div>

            <div className="av101-info-box cyan">
              <div className="av101-info-box-label">How the Router Decides</div>
              <p>
                When you submit a trade, Artivya's router checks both the order book and AMM pools simultaneously. It compares the <strong>effective price</strong> (including fees and slippage) from each venue and executes through whichever provides the best rate. For some trades, it may even split the order across both venues to minimize price impact. This happens in a single transaction, so the user experience is seamless.
              </p>
            </div>

            {renderQuizWithSelection(1)}
            <button className={`av101-complete-btn${completed.has(1) ? " done" : ""}`} onClick={() => markComplete(1)}>
              {completed.has(1) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 2 — The NFT Marketplace
          ============================================================ */}
      <div className={`av101-lesson${activeLesson === 2 ? " active" : ""}${completed.has(2) ? " completed" : ""}`}>
        <div className="av101-lesson-header" onClick={() => toggleLesson(2)}>
          <div className="av101-lesson-number">{completed.has(2) ? "\u2713" : "02"}</div>
          <div className="av101-lesson-header-text">
            <div className="av101-lesson-title">The NFT Marketplace: Listing, Buying, and Bidding</div>
            <div className="av101-lesson-meta"><span>10 min read</span><span>Marketplace</span></div>
          </div>
          <div className="av101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="av101-lesson-content">
          <div className="av101-lesson-body">
            <h3>Token Standards: ERC-721 and ERC-1155</h3>
            <p>
              Artivya supports two NFT token standards. <strong>ERC-721</strong> is the original NFT standard — each token is completely unique with its own token ID. One-of-one digital art, unique collectibles, and domain names all use ERC-721. <strong>ERC-1155</strong> is a more flexible standard that supports both unique items and <strong>editions</strong> — multiple copies of the same item (like prints of a photograph or copies of a game item). A single ERC-1155 contract can manage thousands of different item types efficiently.
            </p>

            <h3>The Listing Process</h3>
            <p>
              Listing an NFT for sale on Artivya is a two-step process. First, you <strong>approve the marketplace contract</strong> to transfer your NFT on your behalf. This is a one-time approval per collection. Second, you create a listing by specifying the <strong>price</strong>, <strong>currency</strong> (ETH, ALUD, ARTV), and optional <strong>auction parameters</strong>. The listing is stored on-chain, and your NFT remains in your wallet until sold — it's not custodial.
            </p>

            <div className="av101-data-block">
              <div className="av101-data-section-label">Listing Flow Step-by-Step</div>
              <div className="av101-data-row"><span className="av101-data-label">Step 1</span><span className="av101-data-value">Connect wallet to Artivya</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Step 2</span><span className="av101-data-value">Approve marketplace contract (one-time per collection)</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Step 3</span><span className="av101-data-value">Choose NFT, set price, select currency</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Step 4</span><span className="av101-data-value">Optionally enable auction (English or Dutch)</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Step 5</span><span className="av101-data-value">Sign listing transaction (gas fee applies)</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Step 6</span><span className="av101-data-value green">NFT is live on the marketplace!</span></div>
            </div>

            <h3>Auction Types</h3>
            <p>
              Artivya supports two auction formats. <strong>English auctions</strong> start at a low price and bidders compete upward — the highest bidder wins when the timer expires. This is the classic auction format and tends to work well for rare, highly desired items. <strong>Dutch auctions</strong> start at a high price that decreases over time until someone buys — this creates urgency and works well for editions or items where the seller wants to discover the market price.
            </p>

            <div className="av101-info-box purple">
              <div className="av101-info-box-label">Metadata and IPFS Storage</div>
              <p>
                NFTs on Artivya store their metadata (name, description, image URL, attributes) using <strong>IPFS (InterPlanetary File System)</strong> — a decentralized storage network. Unlike regular web servers, IPFS content is addressed by its hash, meaning the content can never be changed or taken down once uploaded. This ensures your NFT's artwork and metadata are <strong>permanent and immutable</strong>, even if the original creator's website goes offline.
              </p>
            </div>

            <h3>Try It: NFT Auction Simulator</h3>
            <div className="av101-auction">
              <div className="av101-auction-title">Interactive English Auction</div>
              <div className="av101-auction-layout">
                <div className="av101-auction-nft">
                  <div className="av101-auction-nft-image">{"🎨"}</div>
                  <div className="av101-auction-nft-name">Cosmic Horizon #042</div>
                  <div className="av101-auction-nft-collection">Oeconomia Genesis Collection</div>
                </div>
                <div className="av101-auction-panel">
                  <div className="av101-auction-current">
                    <div className="av101-auction-current-label">{auctionEnded ? "Winning Bid" : "Current Highest Bid"}</div>
                    <div className="av101-auction-current-value">{(bids.length > 0 ? bids[bids.length - 1].amount : 0.5).toFixed(2)} ETH</div>
                  </div>
                  {!auctionEnded && (
                    <>
                      <div className="av101-auction-bid-row">
                        <input
                          type="number"
                          className="av101-auction-input"
                          placeholder={`Min: ${minBid.toFixed(2)} ETH`}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          step="0.1"
                        />
                        <button className="av101-auction-btn" onClick={placeBid} disabled={!bidAmount || parseFloat(bidAmount) < minBid}>
                          Bid
                        </button>
                      </div>
                      {bids.length >= 2 && (
                        <button className="av101-auction-btn end" onClick={endAuction}>End Auction</button>
                      )}
                    </>
                  )}
                  <div className="av101-auction-history">
                    <div className="av101-auction-history-title">Bid History ({bids.length} bids)</div>
                    {bids.length === 0 && <div style={{ fontSize: "0.75rem", color: "var(--tx-muted)" }}>No bids yet. Starting price: 0.50 ETH</div>}
                    {[...bids].reverse().map((b, i) => (
                      <div key={i} className="av101-auction-bid-entry">
                        <span className="av101-auction-bid-bidder">{b.bidder}</span>
                        <span className="av101-auction-bid-amount">{b.amount.toFixed(2)} ETH</span>
                      </div>
                    ))}
                  </div>
                  {auctionEnded && winner && (
                    <div className="av101-auction-winner">
                      <div className="av101-auction-winner-title">Auction Complete!</div>
                      <div className="av101-auction-winner-detail">Winner: <strong>{winner.bidder}</strong></div>
                      <div className="av101-auction-winner-detail">Final Price: <strong>{winner.amount.toFixed(2)} ETH</strong></div>
                      <div className="av101-auction-winner-detail">Creator Royalty (7.5%): <strong>{(winner.amount * royaltyRate).toFixed(4)} ETH</strong></div>
                      <div className="av101-auction-winner-detail">Seller Receives: <strong>{(winner.amount * (1 - royaltyRate)).toFixed(4)} ETH</strong></div>
                      <button className="av101-auction-btn" onClick={resetAuction} style={{ marginTop: 12, width: "100%" }}>Reset Auction</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {renderQuizWithSelection(2)}
            <button className={`av101-complete-btn${completed.has(2) ? " done" : ""}`} onClick={() => markComplete(2)}>
              {completed.has(2) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 3 — Creator Royalties and Enforcement
          ============================================================ */}
      <div className={`av101-lesson${activeLesson === 3 ? " active" : ""}${completed.has(3) ? " completed" : ""}`}>
        <div className="av101-lesson-header" onClick={() => toggleLesson(3)}>
          <div className="av101-lesson-number">{completed.has(3) ? "\u2713" : "03"}</div>
          <div className="av101-lesson-header-text">
            <div className="av101-lesson-title">Creator Royalties and Enforcement</div>
            <div className="av101-lesson-meta"><span>8 min read</span><span>Creator Economy</span></div>
          </div>
          <div className="av101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="av101-lesson-content">
          <div className="av101-lesson-body">
            <h3>Perpetual Creator Revenue</h3>
            <p>
              One of the most revolutionary aspects of NFTs is <strong>smart contract-enforced royalties</strong>. When a creator mints an NFT on Artivya, they set a royalty percentage (typically 5-10%) that applies to every secondary sale for the lifetime of the token. This isn't a gentleman's agreement — it's code enforced by the smart contract. Every time the NFT changes hands on Artivya, the royalty is automatically deducted and sent to the creator's wallet.
            </p>
            <p>
              In the traditional art world, an artist sells a painting once and never benefits from subsequent sales, no matter how much the value appreciates. A painting bought for $5,000 might sell at auction for $5 million, and the original artist receives nothing. NFT royalties fix this broken model — the creator participates in the <strong>ongoing value</strong> of their work.
            </p>

            <div className="av101-data-block">
              <div className="av101-data-section-label">Royalty Flow Example (7.5% Royalty)</div>
              <div className="av101-data-row"><span className="av101-data-label">Creator mints NFT</span><span className="av101-data-value">Sets 7.5% royalty at mint time</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Primary sale</span><span className="av101-data-value">Collector A buys for 1.0 ETH {"\u2192"} Creator gets 1.0 ETH</span></div>
              <div className="av101-data-row"><span className="av101-data-label">1st resale</span><span className="av101-data-value">Collector B buys for 2.5 ETH {"\u2192"} Creator gets 0.1875 ETH</span></div>
              <div className="av101-data-row"><span className="av101-data-label">2nd resale</span><span className="av101-data-value">Collector C buys for 5.0 ETH {"\u2192"} Creator gets 0.375 ETH</span></div>
              <div className="av101-data-row"><span className="av101-data-label">3rd resale</span><span className="av101-data-value green">Collector D buys for 10.0 ETH {"\u2192"} Creator gets 0.75 ETH</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Total creator revenue</span><span className="av101-data-value green">2.3125 ETH from a 1.0 ETH original sale</span></div>
            </div>

            <h3>Traditional Art vs NFT Art</h3>
            <div className="av101-compare-grid">
              <div className="av101-compare-card">
                <h4>Traditional Art</h4>
                <ul>
                  <li>Creator earns from first sale only</li>
                  <li>No revenue from secondary market</li>
                  <li>Provenance tracked manually (galleries, certificates)</li>
                  <li>Counterfeiting is a constant problem</li>
                  <li>Limited audience (physical gallery visitors)</li>
                </ul>
              </div>
              <div className="av101-compare-card">
                <h4>NFT Art (Artivya)</h4>
                <ul>
                  <li>Creator earns perpetual royalties on every resale</li>
                  <li>Royalties enforced automatically by smart contract</li>
                  <li>Provenance is blockchain-verifiable and permanent</li>
                  <li>Authenticity guaranteed by cryptographic ownership</li>
                  <li>Global audience from day one (internet-native)</li>
                </ul>
              </div>
            </div>

            <div className="av101-info-box blue">
              <div className="av101-info-box-label">EIP-2981: Royalty Standard</div>
              <p>
                Artivya implements <strong>EIP-2981</strong>, the NFT royalty standard. This standardized interface allows any marketplace to query a token's royalty information (recipient and percentage) using a consistent method. This means royalties set on Artivya are readable by other marketplaces that support the standard, creating a more interoperable ecosystem where creators' royalties are respected across platforms.
              </p>
            </div>

            <div className="av101-info-box orange">
              <div className="av101-info-box-label">The Royalty Enforcement Challenge</div>
              <p>
                Some marketplaces have chosen to make royalties optional, undermining creator revenue. Artivya takes a <strong>creator-first approach</strong> — royalties are mandatory and non-negotiable on the platform. The smart contract enforces them at the protocol level, so there's no way to execute a sale without paying the royalty. This commitment attracts high-quality creators who want certainty in their revenue model.
              </p>
            </div>

            {renderQuizWithSelection(3)}
            <button className={`av101-complete-btn${completed.has(3) ? " done" : ""}`} onClick={() => markComplete(3)}>
              {completed.has(3) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 4 — Collection-Level Analytics and Floor Prices
          ============================================================ */}
      <div className={`av101-lesson${activeLesson === 4 ? " active" : ""}${completed.has(4) ? " completed" : ""}`}>
        <div className="av101-lesson-header" onClick={() => toggleLesson(4)}>
          <div className="av101-lesson-number">{completed.has(4) ? "\u2713" : "04"}</div>
          <div className="av101-lesson-header-text">
            <div className="av101-lesson-title">Collection-Level Analytics and Floor Prices</div>
            <div className="av101-lesson-meta"><span>10 min read</span><span>Analytics</span></div>
          </div>
          <div className="av101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="av101-lesson-content">
          <div className="av101-lesson-body">
            <h3>Understanding Floor Price</h3>
            <p>
              The <strong>floor price</strong> is the lowest price at which any item in an NFT collection is currently listed for sale. It's the single most important metric for NFT investors because it represents the <strong>minimum cost to enter a collection</strong>. If the Oeconomia Genesis Collection has 10,000 items and the cheapest one listed is 0.5 ETH, the floor price is 0.5 ETH.
            </p>
            <p>
              Floor prices fluctuate based on market sentiment, collection news, and overall crypto market conditions. A rising floor indicates growing demand — more buyers than sellers pushing prices up. A falling floor suggests weakening interest. Tracking floor price trends over time gives a much clearer picture than looking at any single data point.
            </p>

            <h3>Collection Metrics That Matter</h3>
            <div className="av101-data-block">
              <div className="av101-data-section-label">Example: Oeconomia Genesis Collection Stats</div>
              <div className="av101-data-row"><span className="av101-data-label">Floor Price</span><span className="av101-data-value green">0.52 ETH</span></div>
              <div className="av101-data-row"><span className="av101-data-label">24h Volume</span><span className="av101-data-value">42.5 ETH</span></div>
              <div className="av101-data-row"><span className="av101-data-label">7d Volume</span><span className="av101-data-value">285.3 ETH</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Total Supply</span><span className="av101-data-value">10,000 items</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Unique Holders</span><span className="av101-data-value purple">3,847 wallets</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Listed</span><span className="av101-data-value amber">12.3% (1,230 items)</span></div>
              <div className="av101-data-row"><span className="av101-data-label">Holder Ratio</span><span className="av101-data-value">38.5% unique ownership</span></div>
            </div>

            <h3>What to Check Before Buying</h3>
            <div className="av101-three-col">
              <div className="av101-col-card">
                <h4>Ownership Distribution</h4>
                <p>Check how many unique holders a collection has relative to total supply. If 80% of items are held by 10 wallets, it's a concentration risk — those wallets could dump and crash the floor.</p>
              </div>
              <div className="av101-col-card">
                <h4>Volume Trends</h4>
                <p>Look at trading volume over 7 and 30 days. Increasing volume suggests growing interest. Declining volume with rising floor could indicate artificial price support that won't last.</p>
              </div>
              <div className="av101-col-card">
                <h4>Creator History</h4>
                <p>Research the creator's track record. Have they launched successful projects before? Do they have an active community? Are they transparent about their roadmap and team?</p>
              </div>
            </div>

            <div className="av101-info-box amber">
              <div className="av101-info-box-label">The Listed Ratio Signal</div>
              <p>
                The percentage of items listed for sale is a powerful signal. If only <strong>5-10% of a collection is listed</strong>, holders are confident and not looking to sell — bullish. If <strong>30%+ is listed</strong>, many holders want out — bearish. Combined with volume data, the listed ratio tells you whether a collection's holders believe in its long-term value or are looking for an exit.
              </p>
            </div>

            {renderQuizWithSelection(4)}
            <button className={`av101-complete-btn${completed.has(4) ? " done" : ""}`} onClick={() => markComplete(4)}>
              {completed.has(4) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          LESSON 5 — Cross-Protocol Token Trading
          ============================================================ */}
      <div className={`av101-lesson${activeLesson === 5 ? " active" : ""}${completed.has(5) ? " completed" : ""}`}>
        <div className="av101-lesson-header" onClick={() => toggleLesson(5)}>
          <div className="av101-lesson-number">{completed.has(5) ? "\u2713" : "05"}</div>
          <div className="av101-lesson-header-text">
            <div className="av101-lesson-title">Cross-Protocol Token Trading</div>
            <div className="av101-lesson-meta"><span>8 min read</span><span>Ecosystem</span></div>
          </div>
          <div className="av101-lesson-toggle">{"\u25BC"}</div>
        </div>
        <div className="av101-lesson-content">
          <div className="av101-lesson-body">
            <h3>Artivya Within the Oeconomia Ecosystem</h3>
            <p>
              Artivya doesn't exist in isolation — it's a <strong>deeply integrated component</strong> of the Oeconomia ecosystem. Token trading on Artivya leverages <strong>Eloqura's liquidity pools</strong> for instant swaps. When you buy an NFT with ALUD but only have ETH, the swap happens seamlessly through Eloqura under the hood. This cross-protocol composability is what makes DeFi powerful — each protocol strengthens the others.
            </p>
            <p>
              The <strong>ARTV token</strong> serves as the governance token for Artivya marketplace parameters. ARTV holders vote on listing fees, royalty enforcement policies, featured collections, and marketplace upgrades. But ARTV governance doesn't operate in a vacuum — major decisions also require alignment with <strong>OEC governance</strong>, ensuring the marketplace operates in harmony with the broader Oeconomia ecosystem.
            </p>

            <h3>How the Protocols Connect</h3>
            <div className="av101-info-box green">
              <div className="av101-info-box-label">Oeconomia Connection</div>
              <p>
                <strong>Artivya + Eloqura:</strong> Token swaps within the marketplace route through Eloqura's AMM pools. When you list an NFT for sale in ALUD and a buyer pays in ETH, Eloqura handles the conversion automatically. This means Artivya never needs its own DEX infrastructure — it leverages Eloqura's deep liquidity.<br /><br />
                <strong>Artivya + Alluria:</strong> ALUD earned from NFT sales can be used as collateral in Alluria vaults, or ALUD minted from vaults can be used to purchase NFTs. The stablecoin creates a bridge between lending and marketplace activity.<br /><br />
                <strong>Artivya + OEC Governance:</strong> OEC stakers have voice in cross-protocol decisions that affect the marketplace, such as fee structures that impact Eloqura's liquidity or ALUD integration parameters.
              </p>
            </div>

            <h3>NFT-Backed Tokens and Fractionalization</h3>
            <p>
              An emerging use case is <strong>NFT fractionalization</strong> — splitting a high-value NFT into many fungible tokens that can be traded on Eloqura like any other ERC-20. If a rare NFT is worth 100 ETH, fractionalization could create 10,000 tokens each representing 1/10,000 ownership. This democratizes access to high-value NFTs and creates liquid markets for previously illiquid assets.
            </p>

            <div className="av101-stats-row">
              <div className="av101-stat-card"><div className="av101-stat-value">$12M+</div><div className="av101-stat-label">Cross-Protocol Volume</div></div>
              <div className="av101-stat-card"><div className="av101-stat-value">4</div><div className="av101-stat-label">Integrated Protocols</div></div>
              <div className="av101-stat-card"><div className="av101-stat-value">24/7</div><div className="av101-stat-label">Trading Availability</div></div>
            </div>

            <div className="av101-info-box purple">
              <div className="av101-info-box-label">The Composability Advantage</div>
              <p>
                DeFi's superpower is <strong>composability</strong> — protocols can build on top of each other like LEGO blocks. An NFT listed on Artivya can be fractionalized into tokens traded on Eloqura, collateralized in Alluria to mint ALUD, and governed by OEC stakers. Each layer adds value, and the whole ecosystem becomes greater than the sum of its parts. This is why protocol interoperability matters more than any single feature.
              </p>
            </div>

            {renderQuizWithSelection(5)}
            <button className={`av101-complete-btn${completed.has(5) ? " done" : ""}`} onClick={() => markComplete(5)}>
              {completed.has(5) ? "\u2713 Completed" : "Mark Lesson Complete \u2192"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
