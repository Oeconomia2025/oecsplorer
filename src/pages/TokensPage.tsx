import { useNavigate } from "react-router-dom";
import { TOKENS, PROTOCOLS, CHAIN_ID } from "@/utils/constants";
import { ProtocolBadge, CopyButton } from "@/components/shared";
import { etherscanLink } from "@/utils/formatters";
import type { ProtocolId, TokenConfig } from "@/utils/constants";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: unknown }) => Promise<unknown>;
    };
  }
}

async function addToWallet(token: TokenConfig) {
  if (!window.ethereum) {
    alert("MetaMask or a compatible wallet is required to add tokens.");
    return;
  }
  try {
    await window.ethereum.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20",
        options: {
          address: token.address,
          symbol: token.symbol,
          decimals: token.decimals,
          image: token.logo || "",
        },
      },
    });
  } catch {
    // user rejected or error
  }
}

const isDeployed = (t: TokenConfig) => !t.address.startsWith("0x00000");

function DeployedTokenCard({ token, onClick }: { token: TokenConfig; onClick?: () => void }) {
  const protocolConfig = PROTOCOLS[token.protocol as ProtocolId];
  return (
    <div
      className="px-5 py-4 rounded-xl border bg-th-surface hover:border-bd-secondary transition-colors cursor-pointer"
      style={{ borderColor: `${token.color}25` }}
      onClick={onClick}
    >
      <div
        className="grid items-center gap-x-4"
        style={{ gridTemplateColumns: "40px 200px 90px 40px auto 30px auto" }}
      >
        {/* Logo */}
        {token.logo ? (
          <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full object-contain" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: `${token.color}20`, color: token.color }}
          >
            {token.symbol.slice(0, 2)}
          </div>
        )}

        {/* Name / Symbol */}
        <div>
          <div className="text-sm font-semibold text-tx-primary flex items-center gap-1.5">
            {token.symbol}
            {token.official && token.symbol !== "WETH" && (
              <svg className="w-4 h-4 text-oec-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <title>Official Oeconomia DAO Token</title>
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
          </div>
          <div className="text-xs text-tx-muted">{token.name}</div>
        </div>

        {/* Badge */}
        <div>
          {token.official ? (
            <ProtocolBadge protocol="oeconomia" />
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: "#627EEA18",
                color: "#627EEA",
                border: "1px solid #627EEA30",
              }}
            >
              <img
                src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png"
                alt="ETH"
                className="w-4 h-4 rounded-full object-contain"
              />
              <span>SEP</span>
            </span>
          )}
        </div>

        {/* Spacer */}
        <div />

        {/* Contract Address + Decimals stacked */}
        <div>
          <div className="text-xs text-tx-faint font-mono truncate">{token.address}</div>
          <div className="text-xs text-tx-muted">Decimals: {token.decimals}</div>
        </div>

        {/* Copy */}
        <div onClick={(e) => e.stopPropagation()}>
          <CopyButton text={token.address} />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => addToWallet(token)}
            className="text-xs px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap"
            style={{
              backgroundColor: `${token.official ? "#da1cfe" : token.color}18`,
              color: token.official ? "#da1cfe" : token.color,
              border: `1px solid ${token.official ? "#da1cfe" : token.color}30`,
            }}
          >
            Add to Wallet
          </button>
          <a
            href={etherscanLink("address", token.address, CHAIN_ID)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 text-xs px-4 py-2 rounded-lg bg-btn-secondary-bg text-btn-secondary-text hover:opacity-80 transition-colors whitespace-nowrap"
          >
            <img
              src="https://pub-37d61a7eb7ae45898b46702664710cb2.r2.dev/Etherscan.png"
              alt="Etherscan"
              className="w-3.5 h-3.5 object-contain"
            />
            Etherscan
          </a>
        </div>
      </div>
    </div>
  );
}

function PendingTokenCard({ token, onClick }: { token: TokenConfig; onClick?: () => void }) {
  return (
    <div
      className="px-5 py-4 rounded-xl border border-bd-primary bg-th-surface opacity-60 cursor-pointer hover:opacity-75 transition-opacity"
      onClick={onClick}
    >
      <div
        className="grid items-center gap-x-4"
        style={{ gridTemplateColumns: "40px 200px 90px 40px auto 30px auto" }}
      >
        {/* Logo */}
        {token.logo ? (
          <img src={token.logo} alt={token.symbol} className="w-10 h-10 rounded-full object-contain" />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
            style={{ backgroundColor: `${token.color}20`, color: token.color }}
          >
            {token.symbol.slice(0, 2)}
          </div>
        )}

        {/* Name / Symbol */}
        <div>
          <div className="text-sm font-semibold text-tx-primary flex items-center gap-1.5">
            {token.symbol}
            {token.official && token.symbol !== "WETH" && (
              <svg className="w-4 h-4 text-oec-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <title>Official Oeconomia DAO Token</title>
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
          </div>
          <div className="text-xs text-tx-muted">{token.name}</div>
        </div>

        {/* Badge */}
        <div>
          {token.official ? (
            <ProtocolBadge protocol="oeconomia" />
          ) : (
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium"
              style={{
                backgroundColor: "#627EEA18",
                color: "#627EEA",
                border: "1px solid #627EEA30",
              }}
            >
              <img
                src="https://assets.coingecko.com/coins/images/279/standard/ethereum.png"
                alt="ETH"
                className="w-4 h-4 rounded-full object-contain"
              />
              <span>SEP</span>
            </span>
          )}
        </div>

        {/* Spacer */}
        <div />

        {/* Coming Soon - spans remaining columns */}
        <span className="text-xs text-tx-muted col-span-3">Not yet deployed — Coming Soon</span>
      </div>
    </div>
  );
}

export default function TokensPage() {
  const navigate = useNavigate();

  // Custom token order
  const ORDER = ["OEC", "ELOQ", "ALUR", "ALUD", "WETH", "USDC"];
  const allTokens = [
    ...ORDER.map((s) => TOKENS.find((t) => t.symbol === s)!).filter(Boolean),
    ...TOKENS.filter((t) => !ORDER.includes(t.symbol)),
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-tx-primary">Tracked Tokens</h1>
        <div className="flex items-center gap-1.5 text-xs text-tx-muted">
          <svg className="w-4 h-4 text-oec-gold" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Official Oeconomia DAO Token</span>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {allTokens.map((token) =>
          isDeployed(token) ? (
            <DeployedTokenCard key={token.address} token={token} onClick={() => navigate(`/token/${token.address}`)} />
          ) : (
            <PendingTokenCard key={token.address} token={token} onClick={() => navigate(`/token/${token.address}`)} />
          )
        )}
      </div>
    </div>
  );
}
