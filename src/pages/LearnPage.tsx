// ============================================================
// Oeconomia Explorer — Learn Page
// ============================================================

import { useState } from "react";
import { CATEGORIES, LESSONS } from "@/data/lessons";
import type { CategoryId } from "@/data/lessons";
import LessonCard from "@/components/LessonCard";

export default function LearnPage() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | "all">("all");

  const filtered =
    selectedCategory === "all"
      ? LESSONS
      : LESSONS.filter((l) => l.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <div
        className="rounded-xl p-8 text-center"
        style={{
          background: "linear-gradient(135deg, #da1cfe15 0%, #11c4fe15 50%, #F59E0B15 100%)",
          border: "1px solid var(--bd-primary)",
        }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold text-tx-primary mb-2">
          Learn Crypto, DeFi & the Oeconomia Pantheon
        </h1>
        <p className="text-sm text-tx-muted max-w-2xl mx-auto">
          From blockchain basics to protocol deep dives — master the skills you need
          to navigate crypto and the Oeconomia ecosystem.
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
            selectedCategory === "all"
              ? "bg-oec-gold/15 text-oec-gold border border-oec-gold/30"
              : "text-tx-muted hover:text-tx-secondary hover:bg-th-elevated"
          }`}
        >
          All ({LESSONS.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = LESSONS.filter((l) => l.category === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === cat.id ? "border" : "text-tx-muted hover:text-tx-secondary hover:bg-th-elevated"
              }`}
              style={
                selectedCategory === cat.id
                  ? { backgroundColor: `${cat.color}18`, color: cat.color, borderColor: `${cat.color}30` }
                  : undefined
              }
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((lesson) => (
          <LessonCard key={lesson.slug} lesson={lesson} />
        ))}
      </div>
    </div>
  );
}
