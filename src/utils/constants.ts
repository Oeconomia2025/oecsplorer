// ============================================================
// Oeconomia Explorer — Protocol Constants
// ============================================================
// Replace placeholder addresses with your deployed contracts.
// These are referenced by the decoder, webhooks, and frontend.
// ============================================================

export const CHAIN_ID = 11155111; // Sepolia testnet
export const CHAIN_NAME = "Sepolia";

// ------------------------------------------------------------
// Protocol Definitions
// ------------------------------------------------------------
export type ProtocolId = "oeconomia" | "alluria" | "eloqura" | "artivya" | "iridescia";

export interface ProtocolConfig {
  id: ProtocolId;
  name: string;
  shortName: string; // OEC, ALUR, ELOQ, ARTV, IRID
  color: string;
  icon: string;
  logo?: string; // URL to protocol logo image
  description: string;
  contracts: Record<string, string>; // label → address
}

export const PROTOCOLS: Record<ProtocolId, ProtocolConfig> = {
  oeconomia: {
    id: "oeconomia",
    name: "Oeconomia",
    shortName: "OEC",
    color: "#C9A84C",
    icon: "⚡",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo.png",
    description: "Governance hub — Guardian staking, proposals, treasury, cross-protocol coordination",
    contracts: {
      oecToken:         "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba",
      guardianStaking:  "0x4a4da37c9a9f421efe3feb527fc16802ce756ec3",
      faucet:           "0x2e490a627c67b9e70cace4905348395559ef3411",
    },
  },
  alluria: {
    id: "alluria",
    name: "Alluria",
    shortName: "ALUR",
    color: "#3B82F6",
    icon: "🏦",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUR.png",
    description: "Lending protocol — ETH-collateralized vaults, ALUD stablecoin minting, liquidations",
    contracts: {
      vaultManager:     "0x0000000000000000000000000000000000000010", // TODO: replace
      stabilityPool:    "0x0000000000000000000000000000000000000011", // TODO: replace
      aludToken:        "0x0000000000000000000000000000000000000012", // TODO: replace
      priceFeed:        "0x0000000000000000000000000000000000000013", // TODO: replace
    },
  },
  eloqura: {
    id: "eloqura",
    name: "Eloqura",
    shortName: "ELOQ",
    color: "#8B5CF6",
    icon: "🔄",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/Eloqura.png",
    description: "DEX/AMM — Uniswap V2/V3 swaps, liquidity pools, cross-chain bridge, yield optimization",
    contracts: {
      routerV2:         "0x3f42823d998EE4759a95a42a6e3bB7736B76A7AE",
      factoryV2:        "0x1a4C7849Dd8f62AefA082360b3A8D857952B3b8e",
      weth:             "0x34b11F6b8f78fa010bBCA71bC7FE79dAa811b89f",
      limitOrders:      "0x983C3a8aae77f795897fF836c94f4Dd839590567",
      routerV3:         "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E", // Uniswap V3
      factoryV3:        "0x0227628f3F023bb0B980b67D528571c95c6DaC1c", // Uniswap V3
      quoterV3:         "0xEd1f6473345F45b75F8179591dd5bA1888cf2FB3", // Uniswap V3
    },
  },
  artivya: {
    id: "artivya",
    name: "Artivya",
    shortName: "ARTV",
    color: "#EC4899",
    icon: "🎨",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/With%20Border/Art%20no%20Border2.png",
    description: "Hybrid trading — order book + AMM, NFT marketplace, creator tools, royalty management",
    contracts: {
      exchange:         "0x0000000000000000000000000000000000000030", // TODO: replace
      orderBook:        "0x0000000000000000000000000000000000000031", // TODO: replace
      nftMarketplace:   "0x0000000000000000000000000000000000000032", // TODO: replace
      royaltyManager:   "0x0000000000000000000000000000000000000033", // TODO: replace
    },
  },
  iridescia: {
    id: "iridescia",
    name: "Iridescia",
    shortName: "IRID",
    color: "#10B981",
    icon: "🛠",
    description: "Developer infrastructure — contract deployment, templates, security frameworks",
    contracts: {
      contractFactory:  "0x0000000000000000000000000000000000000040", // TODO: replace
      templateRegistry: "0x0000000000000000000000000000000000000041", // TODO: replace
      securityModule:   "0x0000000000000000000000000000000000000042", // TODO: replace
    },
  },
};

// ------------------------------------------------------------
// Token Definitions
// ------------------------------------------------------------
export interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  protocol: ProtocolId;
  color: string;
  logo?: string; // URL to token logo image
}

export const TOKENS: TokenConfig[] = [
  {
    symbol: "OEC",
    name: "Oeconomia",
    address: "0x2b2fb8df4ac5d394f0d5674d7a54802e42a06aba",
    decimals: 18,
    protocol: "oeconomia",
    color: "#C9A84C",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/images/OEC%20Logo.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    decimals: 6,
    protocol: "eloqura",
    color: "#2775CA",
  },
  {
    symbol: "LINK",
    name: "Chainlink",
    address: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    decimals: 18,
    protocol: "eloqura",
    color: "#375BD2",
  },
  {
    symbol: "WETH",
    name: "Wrapped Ether (Eloqura)",
    address: "0x34b11F6b8f78fa010bBCA71bC7FE79dAa811b89f",
    decimals: 18,
    protocol: "eloqura",
    color: "#627EEA",
  },
  {
    symbol: "ALUD",
    name: "Alluria Dollar",
    address: "0x0000000000000000000000000000000000000012", // Not yet deployed
    decimals: 18,
    protocol: "alluria",
    color: "#3B82F6",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUD.png",
  },
  {
    symbol: "ALUR",
    name: "Alluria Reward",
    address: "0x0000000000000000000000000000000000000014", // Not yet deployed
    decimals: 18,
    protocol: "alluria",
    color: "#60A5FA",
    logo: "https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/ALUR.png",
  },
];

// ------------------------------------------------------------
// Derived Lookups (used by decoder)
// ------------------------------------------------------------

/** Map every contract address → protocol id */
export function buildAddressToProtocolMap(): Record<string, ProtocolId> {
  const map: Record<string, ProtocolId> = {};
  for (const [protocolId, config] of Object.entries(PROTOCOLS)) {
    for (const address of Object.values(config.contracts)) {
      map[address.toLowerCase()] = protocolId as ProtocolId;
    }
  }
  return map;
}

/** All contract addresses for a given protocol */
export function getProtocolAddresses(protocolId: ProtocolId): string[] {
  return Object.values(PROTOCOLS[protocolId].contracts);
}

/** All contract addresses across all protocols */
export function getAllContractAddresses(): string[] {
  return Object.values(PROTOCOLS).flatMap((p) => Object.values(p.contracts));
}
