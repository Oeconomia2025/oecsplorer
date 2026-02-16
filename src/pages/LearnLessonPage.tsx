// ============================================================
// Oeconomia Explorer — Lesson Detail Page
// ============================================================

import { useParams, Link } from "react-router-dom";
import { getLessonBySlug, getLessonsByCategory, getCategoryById } from "@/data/lessons";
import { EmptyState } from "@/components/shared";
import LessonCard from "@/components/LessonCard";
import Bitcoin101Content from "@/components/lessons/Bitcoin101Content";
import BlockchainContent from "@/components/lessons/BlockchainContent";
import ConsensusContent from "@/components/lessons/ConsensusContent";
import EthereumContent from "@/components/lessons/EthereumContent";
import MetaMaskContent from "@/components/lessons/MetaMaskContent";
import PrivateKeysContent from "@/components/lessons/PrivateKeysContent";
import TxSafetyContent from "@/components/lessons/TxSafetyContent";
import Web3Content from "@/components/lessons/Web3Content";
import DefiContent from "@/components/lessons/DefiContent";
import YieldContent from "@/components/lessons/YieldContent";
import SmartContractsContent from "@/components/lessons/SmartContractsContent";
import ERC20Content from "@/components/lessons/ERC20Content";
import EtherscanContent from "@/components/lessons/EtherscanContent";
import OecDaoContent from "@/components/lessons/OecDaoContent";
import FiveProtocolsContent from "@/components/lessons/FiveProtocolsContent";
import GovernanceContent from "@/components/lessons/GovernanceContent";
import EloquraContent from "@/components/lessons/EloquraContent";
import AlluriaContent from "@/components/lessons/AlluriaContent";
import ArtivyaContent from "@/components/lessons/ArtivyaContent";
import IridesciaContent from "@/components/lessons/IridesciaContent";

const LESSON_COMPONENTS: Record<string, React.ComponentType> = {
  "bitcoin-101": Bitcoin101Content,
  "how-blockchain-works": BlockchainContent,
  "consensus-mechanisms": ConsensusContent,
  "ethereum-101": EthereumContent,
  "setting-up-metamask": MetaMaskContent,
  "private-keys-seed-phrases": PrivateKeysContent,
  "transaction-safety": TxSafetyContent,
  "what-is-web3": Web3Content,
  "defi-explained": DefiContent,
  "yield-farming": YieldContent,
  "what-are-smart-contracts": SmartContractsContent,
  "erc20-tokens": ERC20Content,
  "reading-etherscan": EtherscanContent,
  "oeconomia-dao": OecDaoContent,
  "five-protocols": FiveProtocolsContent,
  "governance-guardians": GovernanceContent,
  "eloqura-deep-dive": EloquraContent,
  "alluria-deep-dive": AlluriaContent,
  "artivya-deep-dive": ArtivyaContent,
  "iridescia-deep-dive": IridesciaContent,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#10B981",
  Intermediate: "#F59E0B",
  Advanced: "#EF4444",
};

export default function LearnLessonPage() {
  const { slug } = useParams<{ slug: string }>();
  const lesson = slug ? getLessonBySlug(slug) : undefined;

  if (!lesson) {
    return (
      <div>
        <Link
          to="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-accent-link hover:text-accent-link-hover mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learn
        </Link>
        <EmptyState
          icon="📚"
          title="Lesson not found"
          description="This lesson doesn't exist. Check the URL or go back to the Learn page."
        />
      </div>
    );
  }

  const category = getCategoryById(lesson.category);
  const diffColor = DIFFICULTY_COLORS[lesson.difficulty] || "#6B7280";

  // Related lessons: same category, exclude current, max 3
  const related = getLessonsByCategory(lesson.category)
    .filter((l) => l.slug !== lesson.slug)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Gradient hero */}
      <div
        className="relative rounded-xl h-48 flex items-center justify-center overflow-hidden mt-3"
        style={{
          background: `linear-gradient(135deg, ${lesson.gradient[0]}, ${lesson.gradient[1]})`,
        }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 30% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 80% 80%, rgba(0,0,0,0.2) 0%, transparent 50%)",
          }}
        />
        {lesson.logoUrl ? (
          <img
            src={lesson.logoUrl}
            alt=""
            className="relative w-20 h-20 rounded-full object-contain drop-shadow-lg"
          />
        ) : (
          <span className="relative text-7xl drop-shadow-lg select-none">{lesson.icon}</span>
        )}
      </div>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-3">
        {category && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
            style={{
              backgroundColor: `${category.color}18`,
              color: category.color,
              border: `1px solid ${category.color}30`,
            }}
          >
            {category.label}
          </span>
        )}
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide"
          style={{
            backgroundColor: `${diffColor}18`,
            color: diffColor,
            border: `1px solid ${diffColor}30`,
          }}
        >
          {lesson.difficulty}
        </span>
        <span className="text-xs text-tx-muted">{lesson.type}</span>
        <span className="text-xs text-tx-muted">·</span>
        <span className="text-xs text-tx-muted">{lesson.readingTime} min read</span>
        <Link
          to="/learn"
          className="inline-flex items-center gap-1.5 text-sm text-accent-link hover:text-accent-link-hover ml-auto"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Learn
        </Link>
      </div>

      {/* Title + description */}
      <div>
        <h1 className="text-2xl font-bold text-tx-primary mb-2">{lesson.title}</h1>
        <p className="text-sm text-tx-secondary leading-relaxed">{lesson.description}</p>
      </div>

      {/* What You'll Learn */}
      <div className="rounded-xl border border-bd-primary bg-th-surface p-6">
        <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-4">
          What You'll Learn
        </h2>
        <ul className="space-y-3">
          {lesson.topics.map((topic, i) => (
            <li key={i} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="none"
                stroke={lesson.gradient[0]}
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-tx-primary">{topic}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Lesson content */}
      {(() => {
        const Content = LESSON_COMPONENTS[lesson.slug];
        return Content ? (
          <Content />
        ) : (
          <EmptyState
            icon="📝"
            title="Lesson content coming soon"
            description="Full lesson content is being written. Check back soon for the complete article."
          />
        );
      })()}

      {/* Related lessons */}
      {related.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-tx-tertiary uppercase tracking-wider mb-3">
            Related Lessons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {related.map((r) => (
              <LessonCard key={r.slug} lesson={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
