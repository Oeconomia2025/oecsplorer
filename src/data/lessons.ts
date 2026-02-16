// ============================================================
// Oeconomia Explorer — Learn Curriculum Data
// ============================================================

import { PROTOCOLS } from "@/utils/constants";

// -- Types ------------------------------------------------------------------

export type CategoryId =
  | "crypto-fundamentals"
  | "wallets-security"
  | "web3-defi"
  | "smart-contracts"
  | "oeconomia-pantheon"
  | "protocol-deep-dives";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type LessonType = "Article" | "Guide" | "Deep Dive";

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
}

export interface Lesson {
  slug: string;
  title: string;
  category: CategoryId;
  difficulty: Difficulty;
  type: LessonType;
  readingTime: number; // minutes
  description: string;
  gradient: [string, string]; // [from, to] colors
  icon?: string; // emoji
  logoUrl?: string; // protocol/token logo URL
  topics: string[];
}

// -- Categories -------------------------------------------------------------

export const CATEGORIES: Category[] = [
  { id: "crypto-fundamentals", label: "Crypto Fundamentals", color: "#F59E0B" },
  { id: "wallets-security", label: "Wallets & Security", color: "#10B981" },
  { id: "web3-defi", label: "Web3 & DeFi", color: "#3B82F6" },
  { id: "smart-contracts", label: "Smart Contracts", color: "#8B5CF6" },
  { id: "oeconomia-pantheon", label: "Oeconomia Pantheon", color: "#da1cfe" },
  { id: "protocol-deep-dives", label: "Protocol Deep Dives", color: "#11c4fe" },
];

// -- Lessons ----------------------------------------------------------------

export const LESSONS: Lesson[] = [
  // Crypto Fundamentals (4)
  {
    slug: "bitcoin-101",
    title: "Bitcoin 101: Digital Gold",
    category: "crypto-fundamentals",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 8,
    description:
      "Understand the origins of Bitcoin, why it was created, and how it introduced the world to decentralized digital currency. Learn about mining, halving cycles, and why people call it 'digital gold'.",
    gradient: ["#F59E0B", "#D97706"],
    icon: "₿",
    topics: [
      "What Bitcoin is and why it was created",
      "How Bitcoin mining works",
      "The halving cycle and supply cap of 21 million",
      "Why Bitcoin is called 'digital gold'",
      "How to read a Bitcoin transaction",
    ],
  },
  {
    slug: "how-blockchain-works",
    title: "How Blockchain Works",
    category: "crypto-fundamentals",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 10,
    description:
      "Dive into the foundational technology behind all cryptocurrencies. Learn what blocks, chains, and nodes are, how transactions get confirmed, and why blockchains are considered tamper-proof.",
    gradient: ["#F59E0B", "#92400E"],
    icon: "🔗",
    topics: [
      "Blocks, chains, and the append-only ledger",
      "How transactions are validated by nodes",
      "Hash functions and cryptographic security",
      "Decentralization vs. centralized databases",
      "Public vs. private blockchains",
    ],
  },
  {
    slug: "consensus-mechanisms",
    title: "Consensus Mechanisms: PoW vs PoS",
    category: "crypto-fundamentals",
    difficulty: "Intermediate",
    type: "Article",
    readingTime: 12,
    description:
      "Explore the two dominant ways blockchains reach agreement. Compare Proof of Work (used by Bitcoin) with Proof of Stake (used by Ethereum), their trade-offs, and energy implications.",
    gradient: ["#D97706", "#92400E"],
    icon: "⚖️",
    topics: [
      "What consensus means in a decentralized network",
      "Proof of Work: miners, hash power, and energy cost",
      "Proof of Stake: validators, staking, and slashing",
      "Comparing security, speed, and decentralization",
      "Emerging mechanisms: DPoS, PoA, and beyond",
    ],
  },
  {
    slug: "ethereum-101",
    title: "Ethereum 101: The World Computer",
    category: "crypto-fundamentals",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 10,
    description:
      "Learn how Ethereum expanded on Bitcoin's vision by adding programmable smart contracts. Understand gas, the EVM, and why Ethereum is the backbone of DeFi, NFTs, and DAOs.",
    gradient: ["#6366F1", "#4338CA"],
    icon: "💎",
    topics: [
      "How Ethereum differs from Bitcoin",
      "Smart contracts and the EVM",
      "What gas is and how fees work",
      "Ethereum's transition to Proof of Stake",
      "The ecosystem: DeFi, NFTs, and DAOs",
    ],
  },

  // Wallets & Security (3)
  {
    slug: "setting-up-metamask",
    title: "Setting Up MetaMask",
    category: "wallets-security",
    difficulty: "Beginner",
    type: "Guide",
    readingTime: 6,
    description:
      "A step-by-step walkthrough for installing MetaMask, creating your first wallet, and connecting to the Sepolia testnet. The essential starting point for interacting with any Oeconomia protocol.",
    gradient: ["#10B981", "#059669"],
    icon: "🦊",
    topics: [
      "Installing MetaMask on Chrome or Firefox",
      "Creating a wallet and securing your seed phrase",
      "Adding the Sepolia testnet network",
      "Getting testnet ETH from a faucet",
      "Connecting MetaMask to a dApp",
    ],
  },
  {
    slug: "private-keys-seed-phrases",
    title: "Private Keys & Seed Phrases",
    category: "wallets-security",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 8,
    description:
      "Your private key is your identity on the blockchain. Learn what private keys and seed phrases are, how they relate to each other, and the best practices for keeping them safe.",
    gradient: ["#059669", "#047857"],
    icon: "🔑",
    topics: [
      "Public keys vs. private keys",
      "What a seed phrase (mnemonic) is",
      "How HD wallets derive multiple addresses",
      "Storage best practices: hardware wallets, paper backups",
      "What happens if you lose your seed phrase",
    ],
  },
  {
    slug: "transaction-safety",
    title: "Transaction Safety & Avoiding Scams",
    category: "wallets-security",
    difficulty: "Intermediate",
    type: "Guide",
    readingTime: 10,
    description:
      "The crypto space has real risks. Learn how to identify phishing sites, fake token approvals, rug pulls, and social engineering attacks — and how to protect yourself.",
    gradient: ["#10B981", "#065F46"],
    icon: "🛡️",
    topics: [
      "Common scam types: phishing, rug pulls, fake airdrops",
      "How to verify contract addresses before interacting",
      "Understanding and revoking token approvals",
      "Red flags in DeFi projects",
      "Tools for checking contract safety",
    ],
  },

  // Web3 & DeFi (3)
  {
    slug: "what-is-web3",
    title: "What is Web3?",
    category: "web3-defi",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 7,
    description:
      "Web3 is the vision of a user-owned internet. Understand the evolution from Web1 (read) to Web2 (read-write) to Web3 (read-write-own), and how crypto wallets become your digital identity.",
    gradient: ["#3B82F6", "#2563EB"],
    icon: "🌐",
    topics: [
      "The evolution: Web1 → Web2 → Web3",
      "Ownership and self-sovereignty",
      "Wallets as identity: no more usernames and passwords",
      "dApps vs. traditional web apps",
      "The role of tokens in Web3",
    ],
  },
  {
    slug: "defi-explained",
    title: "DeFi Explained: Finance Without Banks",
    category: "web3-defi",
    difficulty: "Intermediate",
    type: "Article",
    readingTime: 12,
    description:
      "Decentralized Finance replaces banks, brokers, and exchanges with smart contracts. Learn about lending, borrowing, swapping, and earning yield — all without intermediaries.",
    gradient: ["#2563EB", "#1D4ED8"],
    icon: "🏦",
    topics: [
      "What DeFi is and why it matters",
      "Lending and borrowing protocols",
      "Decentralized exchanges (DEXs) and AMMs",
      "Stablecoins and their role in DeFi",
      "Risks: impermanent loss, smart contract bugs, liquidation",
    ],
  },
  {
    slug: "yield-farming",
    title: "Yield Farming & Liquidity Provision",
    category: "web3-defi",
    difficulty: "Advanced",
    type: "Deep Dive",
    readingTime: 15,
    description:
      "Go deeper into how liquidity pools work, how AMMs price assets, and how yield farming rewards are calculated. Understand impermanent loss, LP tokens, and strategies for maximizing returns.",
    gradient: ["#1D4ED8", "#1E3A8A"],
    icon: "🌱",
    topics: [
      "How AMMs and the constant product formula work",
      "Providing liquidity: LP tokens and pool shares",
      "Impermanent loss: what it is and when it matters",
      "Yield farming: staking LP tokens for rewards",
      "Comparing single-sided vs. dual-sided liquidity",
    ],
  },

  // Smart Contracts (3)
  {
    slug: "what-are-smart-contracts",
    title: "What Are Smart Contracts?",
    category: "smart-contracts",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 8,
    description:
      "Smart contracts are self-executing programs on the blockchain. Learn what they are, how they work, and why they're the building blocks of DeFi, DAOs, and NFTs.",
    gradient: ["#8B5CF6", "#7C3AED"],
    icon: "📜",
    topics: [
      "What a smart contract is",
      "How contracts are deployed and executed",
      "Solidity: the language of Ethereum contracts",
      "Immutability and upgradability patterns",
      "Real-world examples: tokens, DEXs, lending",
    ],
  },
  {
    slug: "erc20-tokens",
    title: "ERC-20 Tokens: The Standard",
    category: "smart-contracts",
    difficulty: "Intermediate",
    type: "Article",
    readingTime: 10,
    description:
      "ERC-20 is the standard that makes tokens interoperable. Learn about the token interface, how transfers and approvals work, and how OEC, ELOQ, and other Oeconomia tokens follow this standard.",
    gradient: ["#7C3AED", "#6D28D9"],
    icon: "🪙",
    topics: [
      "The ERC-20 interface: balanceOf, transfer, approve",
      "How token transfers work under the hood",
      "Allowances and the approve/transferFrom pattern",
      "Token metadata: name, symbol, decimals",
      "How OEC and ELOQ implement ERC-20",
    ],
  },
  {
    slug: "reading-etherscan",
    title: "Reading Etherscan Like a Pro",
    category: "smart-contracts",
    difficulty: "Intermediate",
    type: "Guide",
    readingTime: 12,
    description:
      "Etherscan is the window into the blockchain. Learn how to read transaction details, decode input data, check contract verification, and use Etherscan as a debugging tool.",
    gradient: ["#6D28D9", "#5B21B6"],
    icon: "🔍",
    topics: [
      "Navigating transaction details: from, to, value, gas",
      "Decoding input data and event logs",
      "Checking if a contract is verified",
      "Reading token transfers and internal transactions",
      "Using Etherscan's read/write contract interface",
    ],
  },

  // Oeconomia Pantheon (3)
  {
    slug: "oeconomia-dao",
    title: "Oeconomia DAO: The Big Picture",
    category: "oeconomia-pantheon",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 8,
    description:
      "Meet the Oeconomia DAO — a decentralized organization with five specialized protocols, Guardian staking governance, and the OEC token at its center. This is where it all starts.",
    gradient: ["#da1cfe", "#9333EA"],
    logoUrl: PROTOCOLS.oeconomia.logo,
    topics: [
      "What the Oeconomia DAO is and its mission",
      "The OEC token: utility, governance, and staking",
      "How the five protocols work together",
      "Guardian staking and governance power",
      "The roadmap: from Sepolia testnet to mainnet",
    ],
  },
  {
    slug: "five-protocols",
    title: "The Five Protocols of the Pantheon",
    category: "oeconomia-pantheon",
    difficulty: "Beginner",
    type: "Article",
    readingTime: 10,
    description:
      "A tour of Oeconomia's five protocols: Eloqura (DEX), Alluria (lending), Artivya (NFTs), Iridescia (dev tools), and the OEC governance hub. Understand what each one does and how they connect.",
    gradient: ["#9333EA", "#7C3AED"],
    icon: "🏛️",
    topics: [
      "Eloqura: swaps, pools, and automated market making",
      "Alluria: lending, vaults, and the ALUD stablecoin",
      "Artivya: NFT marketplace and creator tools",
      "Iridescia: developer infrastructure and templates",
      "How protocols share liquidity and governance",
    ],
  },
  {
    slug: "governance-guardians",
    title: "Governance & Guardians: Staking for Power",
    category: "oeconomia-pantheon",
    difficulty: "Intermediate",
    type: "Deep Dive",
    readingTime: 15,
    description:
      "Dive deep into Oeconomia's Guardian staking system. Learn how staking OEC grants governance power, how proposals are created and voted on, and the tier system from Initiate to Sovereign.",
    gradient: ["#da1cfe", "#6D28D9"],
    icon: "⚡",
    topics: [
      "The Guardian staking contract and tier system",
      "Staking mechanics: lock periods and multipliers",
      "Governance power: how votes are weighted",
      "Creating and voting on proposals",
      "Guardian tiers: Initiate, Warden, Sentinel, Archon, Sovereign",
    ],
  },

  // Protocol Deep Dives (4)
  {
    slug: "eloqura-deep-dive",
    title: "Eloqura: Swaps, Pools & AMM",
    category: "protocol-deep-dives",
    difficulty: "Intermediate",
    type: "Deep Dive",
    readingTime: 15,
    description:
      "A comprehensive look at Eloqura, Oeconomia's DEX protocol. Learn how its AMM works, how to provide liquidity, how swap routing finds the best price, and its integration with Uniswap V3.",
    gradient: ["#ae65fc", "#7C3AED"],
    logoUrl: PROTOCOLS.eloqura.logo,
    topics: [
      "How the Eloqura AMM prices tokens",
      "Providing liquidity and earning fees",
      "Swap routing: finding the best price across pools",
      "Uniswap V3 integration and concentrated liquidity",
      "Limit orders and advanced trading features",
    ],
  },
  {
    slug: "alluria-deep-dive",
    title: "Alluria: Lending, Vaults & ALUD",
    category: "protocol-deep-dives",
    difficulty: "Intermediate",
    type: "Deep Dive",
    readingTime: 14,
    description:
      "Explore Alluria, Oeconomia's lending protocol. Understand how ETH-collateralized vaults work, how the ALUD stablecoin is minted and maintained, and the liquidation mechanism that keeps the system solvent.",
    gradient: ["#834841", "#5C3330"],
    logoUrl: PROTOCOLS.alluria.logo,
    topics: [
      "How vaults work: depositing collateral, minting ALUD",
      "Collateralization ratios and health factors",
      "The liquidation mechanism",
      "ALUD: Oeconomia's native stablecoin",
      "Stability pool and liquidation rewards",
    ],
  },
  {
    slug: "artivya-deep-dive",
    title: "Artivya: NFT Marketplace & Trading",
    category: "protocol-deep-dives",
    difficulty: "Intermediate",
    type: "Deep Dive",
    readingTime: 12,
    description:
      "Discover Artivya, Oeconomia's NFT and hybrid trading protocol. Learn about the order book + AMM model, NFT marketplace features, creator royalties, and how it bridges traditional and decentralized trading.",
    gradient: ["#11c4fe", "#0891B2"],
    logoUrl: PROTOCOLS.artivya.logo,
    topics: [
      "Hybrid trading: order book meets AMM",
      "The NFT marketplace: listing, buying, and bidding",
      "Creator royalties and enforcement",
      "Collection-level analytics and floor prices",
      "Cross-protocol token trading",
    ],
  },
  {
    slug: "iridescia-deep-dive",
    title: "Iridescia: Developer Infrastructure",
    category: "protocol-deep-dives",
    difficulty: "Advanced",
    type: "Deep Dive",
    readingTime: 14,
    description:
      "A technical deep dive into Iridescia, Oeconomia's developer infrastructure protocol. Learn about contract deployment tools, security frameworks, templates, and how it enables rapid development on the Oeconomia ecosystem.",
    gradient: ["#c4956a", "#92400E"],
    logoUrl: PROTOCOLS.iridescia.logo,
    topics: [
      "Contract deployment tools and templates",
      "The security framework: audits and monitoring",
      "Template registry for common contract patterns",
      "Developer SDKs and integration guides",
      "Building on Oeconomia: getting started",
    ],
  },
];

// -- Helpers ----------------------------------------------------------------

export function getLessonBySlug(slug: string): Lesson | undefined {
  return LESSONS.find((l) => l.slug === slug);
}

export function getLessonsByCategory(categoryId: CategoryId): Lesson[] {
  return LESSONS.filter((l) => l.category === categoryId);
}

export function getCategoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
