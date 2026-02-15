import { TOKENS, PROTOCOLS, CHAIN_ID } from "@/utils/constants";
import { ProtocolBadge } from "@/components/shared";
import { etherscanLink } from "@/utils/formatters";
import type { ProtocolId } from "@/utils/constants";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params: unknown }) => Promise<unknown>;
    };
  }
}

async function addToWallet(token: typeof TOKENS[number]) {
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

export default function TokensPage() {
  const deployedTokens = TOKENS.filter((t) => !t.address.startsWith("0x00000"));
  const pendingTokens = TOKENS.filter((t) => t.address.startsWith("0x00000"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-tx-primary">Oeconomia Tokens</h1>
        <div className="flex items-center gap-1.5 text-xs text-tx-muted">
          <svg className="w-4 h-4 text-oec-gold" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Official Oeconomia DAO Token</span>
        </div>
      </div>

      {/* Deployed Tokens */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deployedTokens.map((token) => {
          const protocolConfig = PROTOCOLS[token.protocol as ProtocolId];
          return (
            <div
              key={token.address}
              className="p-5 rounded-xl border bg-th-surface hover:border-bd-secondary transition-colors"
              style={{ borderColor: `${token.color}25` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
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
                  <div>
                    <div className="text-sm font-semibold text-tx-primary flex items-center gap-1.5">
                      {token.symbol}
                      {token.official && (
                        <svg className="w-4 h-4 text-oec-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <title>Official Oeconomia DAO Token</title>
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs text-tx-muted">{token.name}</div>
                  </div>
                </div>
                <ProtocolBadge protocol={token.protocol} />
              </div>

              <div className="text-xs text-tx-faint font-mono mb-3 break-all">{token.address}</div>
              <div className="text-xs text-tx-muted mb-4">Decimals: {token.decimals}</div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => addToWallet(token)}
                  className="flex-1 text-xs px-3 py-2 rounded-lg font-medium transition-colors"
                  style={{
                    backgroundColor: `${token.color}18`,
                    color: token.color,
                    border: `1px solid ${token.color}30`,
                  }}
                >
                  Add to Wallet
                </button>
                <a
                  href={etherscanLink("address", token.address, CHAIN_ID)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs px-3 py-2 rounded-lg bg-btn-secondary-bg text-btn-secondary-text hover:opacity-80 transition-colors"
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
          );
        })}
      </div>

      {/* Pending Tokens */}
      {pendingTokens.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
            Coming Soon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingTokens.map((token) => (
              <div
                key={token.address}
                className="p-5 rounded-xl border border-bd-primary bg-th-surface opacity-60"
              >
                <div className="flex items-center gap-3 mb-3">
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
                  <div>
                    <div className="text-sm font-semibold text-tx-primary flex items-center gap-1.5">
                      {token.symbol}
                      {token.official && (
                        <svg className="w-4 h-4 text-oec-gold shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <title>Official Oeconomia DAO Token</title>
                          <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      )}
                    </div>
                    <div className="text-xs text-tx-muted">{token.name}</div>
                  </div>
                </div>
                <div className="text-xs text-tx-muted">Not yet deployed</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
