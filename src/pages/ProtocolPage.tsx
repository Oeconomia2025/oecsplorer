import { useParams, Link } from "react-router-dom";
import { PROTOCOLS } from "@/utils/constants";
import { ProtocolBadge, ProtocolIcon, EmptyState } from "@/components/shared";
import { truncateAddress, etherscanLink } from "@/utils/formatters";
import { CHAIN_ID } from "@/utils/constants";
import type { ProtocolId } from "@/utils/constants";

export default function ProtocolPage() {
  const { protocolId } = useParams<{ protocolId: string }>();
  const protocol = PROTOCOLS[protocolId as ProtocolId];

  if (!protocol) {
    return (
      <EmptyState
        title="Protocol not found"
        description={`"${protocolId}" is not a recognized Oeconomia protocol.`}
        icon="❌"
      />
    );
  }

  const contracts = Object.entries(protocol.contracts);
  const hasDeployed = contracts.some(([, addr]) => !addr.startsWith("0x00000"));

  return (
    <div className="space-y-6">
      {/* Protocol Header */}
      <div
        className="p-6 rounded-xl border"
        style={{
          borderColor: `${protocol.color}25`,
          background: `linear-gradient(135deg, ${protocol.color}10, ${protocol.color}03)`,
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <ProtocolIcon protocol={protocolId as ProtocolId} size="lg" />
          <div>
            <h1 className="text-xl font-bold text-tx-primary">{protocol.name}</h1>
            <span className="text-xs font-semibold" style={{ color: protocol.color }}>
              {protocol.shortName}
            </span>
          </div>
        </div>
        <p className="text-sm text-tx-tertiary mt-2 max-w-xl">{protocol.description}</p>
        <div className="flex items-center gap-3 mt-4">
          <ProtocolBadge protocol={protocolId as ProtocolId} size="md" />
          <span
            className="text-xs px-2.5 py-1 rounded-full"
            style={{
              background: hasDeployed ? "#22C55E18" : "#71717A18",
              color: hasDeployed ? "#22C55E" : "#71717A",
            }}
          >
            {hasDeployed ? "Deployed on Sepolia" : "Not yet deployed"}
          </span>
        </div>
      </div>

      {/* Contracts */}
      <div>
        <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
          Contracts ({contracts.length})
        </h2>
        <div className="space-y-2">
          {contracts.map(([label, address]) => {
            const isDeployed = !address.startsWith("0x00000");
            return (
              <div
                key={label}
                className="flex items-center justify-between p-4 rounded-xl border border-bd-primary bg-th-surface hover:border-bd-secondary transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isDeployed ? "#22C55E" : "#52525B" }}
                  />
                  <div>
                    <div className="text-sm font-medium text-tx-primary capitalize">
                      {label.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="text-xs font-mono text-tx-muted mt-0.5">{address}</div>
                  </div>
                </div>
                {isDeployed && (
                  <a
                    href={etherscanLink("address", address, CHAIN_ID)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent-link hover:text-accent-link-hover shrink-0"
                  >
                    Etherscan →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity (placeholder) */}
      <div>
        <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
          Recent Activity
        </h2>
        <EmptyState
          title={`No ${protocol.name} transactions indexed yet`}
          description={
            hasDeployed
              ? "Transactions will appear here once Alchemy webhooks are configured and the indexer starts processing events."
              : `${protocol.name} contracts haven't been deployed yet. Activity will be tracked once contracts are live.`
          }
          icon={protocol.icon}
          logoUrl={protocol.logo}
        />
      </div>
    </div>
  );
}
