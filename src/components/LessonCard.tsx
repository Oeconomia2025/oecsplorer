// ============================================================
// Oeconomia Explorer — LessonCard (Coursera-style)
// ============================================================

import { Link } from "react-router-dom";
import type { Lesson } from "@/data/lessons";
import { getCategoryById } from "@/data/lessons";

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: "#10B981",
  Intermediate: "#F59E0B",
  Advanced: "#EF4444",
};

export default function LessonCard({ lesson }: { lesson: Lesson }) {
  const category = getCategoryById(lesson.category);
  const diffColor = DIFFICULTY_COLORS[lesson.difficulty] || "#6B7280";

  return (
    <Link
      to={`/learn/${lesson.slug}`}
      className="group rounded-xl border border-bd-primary bg-th-surface hover:border-bd-secondary hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col"
    >
      {/* Gradient header */}
      <div
        className="relative h-36 flex items-center justify-center overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${lesson.gradient[0]}, ${lesson.gradient[1]})`,
        }}
      >
        {/* Radial highlight overlay */}
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

        {/* Difficulty badge (top-right) */}
        <span
          className="absolute top-3 right-3 px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide"
          style={{
            backgroundColor: `${diffColor}22`,
            color: "#fff",
            border: `1px solid ${diffColor}55`,
            backdropFilter: "blur(4px)",
          }}
        >
          {lesson.difficulty}
        </span>

        {/* Centered icon or logo */}
        {lesson.logoUrl ? (
          <img
            src={lesson.logoUrl}
            alt=""
            className="relative w-14 h-14 rounded-full object-contain drop-shadow-lg"
          />
        ) : (
          <span className="relative text-5xl drop-shadow-lg select-none">
            {lesson.icon}
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category badge */}
        {category && (
          <span
            className="inline-flex items-center self-start px-2 py-0.5 rounded-md text-xs font-medium mb-2"
            style={{
              backgroundColor: `${category.color}18`,
              color: category.color,
              border: `1px solid ${category.color}30`,
            }}
          >
            {category.label}
          </span>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold text-tx-primary group-hover:text-accent-link-hover transition-colors line-clamp-2 mb-1.5">
          {lesson.title}
        </h3>

        {/* Meta */}
        <p className="text-xs text-tx-muted mt-auto">
          {lesson.type} · {lesson.readingTime} min read
        </p>
      </div>
    </Link>
  );
}
