// ============================================================
// Oeconomia Explorer — Protocol ABI Decoder
// ============================================================
// Decodes raw blockchain transactions into human-readable
// protocol-specific actions across all 5 Oeconomia protocols.
// ============================================================

import { ethers } from "ethers";

// -- Types ------------------------------------------------------------------

export type ProtocolId =
  | "oeconomia"
  | "alluria"
  | "eloqura"
  | "artivya"
  | "iridescia"
  | "unknown";

export interface DecodedTransaction {
  protocol: ProtocolId;
  actionType: string;         // Human-readable: "Minted ALUD", "Token Swap", etc.
  functionName: string;       // Raw function name from ABI
  decodedArgs: Record<string, unknown>;
  decodedEvents: DecodedEvent[];
}

export interface DecodedEvent {
  name: string;
  args: Record<string, unknown>;
}

// -- Action Classification Maps ---------------------------------------------

const ACTION_LABELS: Record<string, Record<string, string>> = {
  oeconomia: {
    stake:              "Stake",
    unstake:            "Unstake",
    stakeOEC:           "Stake",
    unstakeOEC:         "Unstake",
    getReward:          "Get Reward",
    withdraw:           "Withdraw",
    earlyWithdraw:      "Early Withdraw",
    vote:               "Governance Vote",
    createProposal:     "Create Proposal",
    executeProposal:    "Execute Proposal",
    claimRewards:       "Claim Rewards",
    delegateVotes:      "Delegate Votes",
    transfer:           "Transfer",
    transferFrom:       "Transfer",
    approve:            "Approve",
  },
  alluria: {
    openVault:          "Opened Alluria Vault",
    closeVault:         "Closed Alluria Vault",
    mintALUD:           "Minted ALUD",
    repayDebt:          "Repaid ALUD Debt",
    addCollateral:      "Added Vault Collateral",
    withdrawCollateral: "Withdrew Vault Collateral",
    liquidate:          "Liquidation Executed",
    depositToSP:        "Stability Pool Deposit",
    withdrawFromSP:     "Stability Pool Withdrawal",
    claimCollGains:     "Claimed Liquidation Gains",
  },
  eloqura: {
    // Uniswap V2 style
    swapExactTokensForTokens:              "Token Swap",
    swapTokensForExactTokens:              "Token Swap",
    swapExactETHForTokens:                 "ETH → Token Swap",
    swapTokensForExactETH:                 "Token → ETH Swap",
    swapExactTokensForETH:                 "Token → ETH Swap",
    swapExactTokensForTokensSupportingFeeOnTransferTokens: "Token Swap",
    swapExactETHForTokensSupportingFeeOnTransferTokens:    "ETH → Token Swap",
    swapExactTokensForETHSupportingFeeOnTransferTokens:    "Token → ETH Swap",
    addLiquidity:                          "Added Liquidity",
    addLiquidityETH:                       "Added ETH Liquidity",
    removeLiquidity:                       "Removed Liquidity",
    removeLiquidityETH:                    "Removed ETH Liquidity",
    removeLiquidityETHWithPermit:          "Removed ETH Liquidity",
    removeLiquidityWithPermit:             "Removed Liquidity",
    // Uniswap V3 SwapRouter
    exactInputSingle:                      "V3 Swap (Exact In)",
    exactOutputSingle:                     "V3 Swap (Exact Out)",
    exactInput:                            "V3 Multi-hop Swap",
    exactOutput:                           "V3 Multi-hop Swap",
    multicall:                             "V3 Multicall",
    "multicall(uint256,bytes[])":          "V3 Multicall",
    "multicall(bytes32,bytes[])":          "V3 Multicall",
    "multicall(bytes[])":                  "V3 Multicall",
    selfPermit:                            "Token Permit",
    selfPermitAllowed:                     "Token Permit",
    selfPermitAllowedIfNecessary:          "Token Permit",
    selfPermitIfNecessary:                 "Token Permit",
    unwrapWETH9:                           "Unwrap WETH",
    unwrapWETH9WithFee:                    "Unwrap WETH",
    refundETH:                             "Refund ETH",
    sweepToken:                            "Sweep Token",
    sweepTokenWithFee:                     "Sweep Token",
    // Uniswap V3 NonfungiblePositionManager
    mint:                                  "V3 Position Created",
    increaseLiquidity:                     "V3 Liquidity Increased",
    decreaseLiquidity:                     "V3 Liquidity Decreased",
    collect:                               "V3 Fees Collected",
    burn:                                  "V3 Position Burned",
    // Uniswap Universal Router
    execute:                               "Universal Router Swap",
    // Common ERC-20
    transfer:                              "Transfer",
    transferFrom:                          "Transfer",
    approve:                               "Token Approval",
    // Bridge
    bridgeTokens:                          "Cross-Chain Bridge",
    claimBridgedTokens:                    "Claimed Bridged Tokens",
    // Yield
    optimizeYield:                         "Yield Optimization",
    compoundRewards:                       "Rewards Compounded",
  },
  artivya: {
    placeOrder:          "Order Placed",
    cancelOrder:         "Order Cancelled",
    fillOrder:           "Order Filled",
    listNFT:             "NFT Listed",
    delistNFT:           "NFT Delisted",
    buyNFT:              "NFT Purchased",
    acceptOffer:         "NFT Offer Accepted",
    makeOffer:           "NFT Offer Made",
    setRoyalty:          "Royalty Updated",
    claimRoyalties:      "Royalties Claimed",
  },
  iridescia: {
    deployContract:      "Contract Deployed",
    useTemplate:         "Template Instantiated",
    registerTemplate:    "Template Registered",
    verifyContract:      "Contract Verified",
    runAudit:            "Security Audit Triggered",
  },
};

// -- ABI Fragments ----------------------------------------------------------
// Minimal ABI fragments for each protocol's key functions and events.
// Replace these with your full ABIs from compiled contracts.

const PROTOCOL_ABIS: Record<string, string[]> = {
  oeconomia: [
    // Real deployed staking contract (MultiPoolStakingAPR)
    "function stake(uint256 _packageId, uint256 _amount) external",
    "function unstake(uint256 _packageId) external",
    "function getReward(uint256 poolId) external",
    "function withdraw(uint256 poolId, uint256 amount) external",
    "function earlyWithdraw(uint256 poolId, uint256 amount) external",
    // Legacy / future governance functions
    "function stakeOEC(uint256 amount) external",
    "function unstakeOEC(uint256 amount) external",
    "function vote(uint256 proposalId, bool support) external",
    "function createProposal(string description, bytes[] calldatas) external returns (uint256)",
    "function executeProposal(uint256 proposalId) external",
    "function claimRewards() external",
    // ERC-20 functions (OEC token)
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    // Events from deployed staking contract
    "event Staked(uint256 indexed gameCounter, address indexed user, uint256 amount)",
    "event Unstaked(uint256 indexed gameCounter, address indexed user, uint256 amount)",
    // Legacy / future events
    "event GuardianStaked(address indexed guardian, uint256 amount)",
    "event GuardianUnstaked(address indexed guardian, uint256 amount)",
    "event VoteCast(address indexed voter, uint256 proposalId, bool support, uint256 weight)",
    "event ProposalCreated(uint256 indexed proposalId, address proposer, string description)",
    "event ProposalExecuted(uint256 indexed proposalId)",
  ],
  alluria: [
    "function openVault(uint256 aludAmount) external payable",
    "function closeVault() external",
    "function mintALUD(uint256 amount) external",
    "function repayDebt(uint256 amount) external",
    "function addCollateral() external payable",
    "function withdrawCollateral(uint256 amount) external",
    "function liquidate(address borrower) external",
    "function depositToSP(uint256 amount) external",
    "function withdrawFromSP(uint256 amount) external",
    "event VaultOpened(address indexed owner, uint256 collateral, uint256 debt)",
    "event VaultClosed(address indexed owner)",
    "event ALUDMinted(address indexed to, uint256 amount)",
    "event Liquidation(address indexed liquidated, uint256 collateral, uint256 debt)",
    "event StabilityPoolDeposit(address indexed depositor, uint256 amount)",
    "event StabilityPoolWithdrawal(address indexed depositor, uint256 amount)",
  ],
  eloqura: [
    // ── V2 Router ──
    "function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[])",
    "function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[])",
    "function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable returns (uint256[])",
    "function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) external returns (uint256[])",
    "function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external returns (uint256[])",
    "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external",
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) external payable",
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) external",
    "function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256, uint256, uint256)",
    "function addLiquidityETH(address token, uint256 amountTokenDesired, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external payable returns (uint256, uint256, uint256)",
    "function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) external returns (uint256, uint256)",
    "function removeLiquidityETH(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline) external returns (uint256, uint256)",
    "function removeLiquidityWithPermit(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256, uint256)",
    "function removeLiquidityETHWithPermit(address token, uint256 liquidity, uint256 amountTokenMin, uint256 amountETHMin, address to, uint256 deadline, bool approveMax, uint8 v, bytes32 r, bytes32 s) external returns (uint256, uint256)",
    // ── V3 SwapRouter ──
    "function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256)",
    "function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256)",
    "function exactInput((bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum)) external payable returns (uint256)",
    "function exactOutput((bytes path, address recipient, uint256 deadline, uint256 amountOut, uint256 amountInMaximum)) external payable returns (uint256)",
    "function multicall(uint256 deadline, bytes[] data) external payable returns (bytes[])",
    "function multicall(bytes32 previousBlockhash, bytes[] data) external payable returns (bytes[])",
    "function multicall(bytes[] data) external payable returns (bytes[])",
    "function selfPermit(address token, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable",
    "function selfPermitAllowed(address token, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external payable",
    "function selfPermitAllowedIfNecessary(address token, uint256 nonce, uint256 expiry, uint8 v, bytes32 r, bytes32 s) external payable",
    "function selfPermitIfNecessary(address token, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external payable",
    "function unwrapWETH9(uint256 amountMinimum, address recipient) external payable",
    "function unwrapWETH9WithFee(uint256 amountMinimum, address recipient, uint256 feeBips, address feeRecipient) external payable",
    "function refundETH() external payable",
    "function sweepToken(address token, uint256 amountMinimum, address recipient) external payable",
    "function sweepTokenWithFee(address token, uint256 amountMinimum, address recipient, uint256 feeBips, address feeRecipient) external payable",
    // ── Universal Router ──
    "function execute(bytes commands, bytes[] inputs, uint256 deadline) external payable",
    // ── Common ERC-20 functions ──
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    // ── Bridge ──
    "function bridgeTokens(address token, uint256 amount, uint256 destChainId, bytes32 recipient) external",
    // ── Events ──
    "event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)",
    "event Mint(address indexed sender, uint256 amount0, uint256 amount1)",
    "event Burn(address indexed sender, uint256 amount0, uint256 amount1, address indexed to)",
    "event BridgeInitiated(address indexed sender, uint256 amount, uint256 destChainId, bytes32 recipient)",
  ],
  artivya: [
    "function placeOrder(address tokenIn, address tokenOut, uint256 amountIn, uint256 price, bool isBuy) external returns (bytes32)",
    "function cancelOrder(bytes32 orderId) external",
    "function listNFT(address collection, uint256 tokenId, uint256 price) external",
    "function buyNFT(address collection, uint256 tokenId) external payable",
    "function makeOffer(address collection, uint256 tokenId) external payable",
    "function acceptOffer(bytes32 offerId) external",
    "event OrderPlaced(bytes32 indexed orderId, address indexed trader, address tokenIn, uint256 amountIn, uint256 price)",
    "event OrderFilled(bytes32 indexed orderId, address indexed filler, uint256 amountFilled)",
    "event OrderCancelled(bytes32 indexed orderId)",
    "event NFTListed(address indexed collection, uint256 indexed tokenId, address seller, uint256 price)",
    "event NFTSold(address indexed collection, uint256 indexed tokenId, address seller, address buyer, uint256 price)",
  ],
  iridescia: [
    "function deployContract(bytes bytecode, bytes32 salt) external returns (address)",
    "function useTemplate(uint256 templateId, bytes params) external returns (address)",
    "function registerTemplate(string name, bytes bytecode, string category) external returns (uint256)",
    "event ContractDeployed(address indexed deployer, address deployed, bytes32 salt)",
    "event TemplateUsed(uint256 indexed templateId, address indexed user, address deployed)",
    "event TemplateRegistered(uint256 indexed templateId, string name, address registrar)",
  ],
};

// -- Common ABI (ERC-20 Transfer, Approval, etc.) --------------------------

const COMMON_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
];

const commonInterface = new ethers.Interface(COMMON_ABI);

// -- Decoder Class ----------------------------------------------------------

export class ProtocolDecoder {
  private interfaces: Record<string, ethers.Interface>;
  private addressToProtocol: Record<string, string>;

  constructor(contractAddressMap: Record<string, string>) {
    // Build ethers interfaces from ABI fragments
    this.interfaces = {};
    for (const [protocol, abi] of Object.entries(PROTOCOL_ABIS)) {
      this.interfaces[protocol] = new ethers.Interface(abi);
    }

    // Store the address → protocol mapping (lowercase)
    this.addressToProtocol = {};
    for (const [address, protocol] of Object.entries(contractAddressMap)) {
      this.addressToProtocol[address.toLowerCase()] = protocol;
    }
  }

  /**
   * Decode a transaction receipt into a human-readable protocol action
   */
  decode(tx: {
    to: string;
    input: string;
    value?: string;
    logs?: Array<{ address: string; topics: string[]; data: string }>;
  }): DecodedTransaction {
    const protocol = this.addressToProtocol[tx.to?.toLowerCase()] || "unknown";

    if (protocol === "unknown") {
      return {
        protocol: "unknown",
        actionType: "Unknown Transaction",
        functionName: "unknown",
        decodedArgs: {},
        decodedEvents: [],
      };
    }

    const iface = this.interfaces[protocol];
    let functionName = "unknown";
    let decodedArgs: Record<string, unknown> = {};

    // Decode the function call
    try {
      const parsed = iface.parseTransaction({ data: tx.input, value: tx.value || "0" });
      if (parsed) {
        functionName = parsed.name;
        // Extract named args only (filter out numeric indices)
        decodedArgs = Object.fromEntries(
          Object.entries(parsed.args.toObject()).filter(([key]) => isNaN(Number(key)))
        );
      }
    } catch {
      // Function not in ABI — could be a proxy or unknown method
    }

    // Decode event logs
    const decodedEvents: DecodedEvent[] = [];
    if (tx.logs) {
      for (const log of tx.logs) {
        // Try decoding with the protocol's interface first
        try {
          const parsed = iface.parseLog({ topics: log.topics, data: log.data });
          if (parsed) {
            decodedEvents.push({
              name: parsed.name,
              args: Object.fromEntries(
                Object.entries(parsed.args.toObject()).filter(([key]) => isNaN(Number(key)))
              ),
            });
            continue;
          }
        } catch {
          // Not from this protocol's ABI
        }

        // Try common ERC-20 interface (Transfer, Approval)
        try {
          const parsed = commonInterface.parseLog({ topics: log.topics, data: log.data });
          if (parsed) {
            decodedEvents.push({
              name: parsed.name,
              args: Object.fromEntries(
                Object.entries(parsed.args.toObject()).filter(([key]) => isNaN(Number(key)))
              ),
            });
            continue;
          }
        } catch {
          // Not a common event
        }

        // Try other protocol interfaces (cross-protocol events)
        for (const [otherProto, otherIface] of Object.entries(this.interfaces)) {
          if (otherProto === protocol) continue;
          try {
            const parsed = otherIface.parseLog({ topics: log.topics, data: log.data });
            if (parsed) {
              decodedEvents.push({
                name: `${otherProto}:${parsed.name}`,
                args: Object.fromEntries(
                  Object.entries(parsed.args.toObject()).filter(([key]) => isNaN(Number(key)))
                ),
              });
              break;
            }
          } catch {
            // Not from this interface either
          }
        }
      }
    }

    // Classify into human-readable action
    let actionType = ACTION_LABELS[protocol]?.[functionName];

    if (!actionType && functionName !== "unknown") {
      // Function was parsed but not in our labels — make camelCase readable
      // e.g. "exactInputSingle" → "Exact Input Single"
      actionType = functionName
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (c) => c.toUpperCase())
        .trim();
    }

    if (!actionType && decodedEvents.length > 0) {
      // Couldn't parse function but we have events — infer from the primary event
      const eventLabels: Record<string, string> = {
        Transfer: "Transfer",
        Approval: "Approve",
        Swap: "Token Swap",
        Mint: "Liquidity Added",
        Burn: "Liquidity Removed",
        Staked: "Stake",
        Unstaked: "Unstake",
      };
      for (const evt of decodedEvents) {
        const baseName = evt.name.includes(":") ? evt.name.split(":")[1] : evt.name;
        if (eventLabels[baseName]) {
          actionType = eventLabels[baseName];
          break;
        }
      }
    }

    if (!actionType) {
      actionType = "Contract Interaction";
    }

    return {
      protocol: protocol as ProtocolId,
      actionType,
      functionName,
      decodedArgs,
      decodedEvents,
    };
  }

  /**
   * Quick check: does this address belong to an Oeconomia protocol?
   */
  isOeconomiaContract(address: string): boolean {
    return address.toLowerCase() in this.addressToProtocol;
  }

  /**
   * Get the protocol for a contract address
   */
  getProtocol(address: string): ProtocolId {
    return (this.addressToProtocol[address.toLowerCase()] as ProtocolId) || "unknown";
  }
}
