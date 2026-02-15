// ============================================================
// Reusable Pagination Controls
// ============================================================

interface PaginationProps {
  total: number;
  limit: number;
  offset: number;
  onPageChange: (offset: number) => void;
}

export function Pagination({ total, limit, offset, onPageChange }: PaginationProps) {
  if (total <= limit) return null;

  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);

  const goTo = (page: number) => {
    const clamped = Math.max(1, Math.min(page, totalPages));
    onPageChange((clamped - 1) * limit);
  };

  // Build page numbers to show: always show first, last, current, and neighbors
  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: "var(--bd-primary)" }}>
      <span className="text-xs" style={{ color: "var(--tx-muted)" }}>
        {offset + 1}–{Math.min(offset + limit, total)} of {total.toLocaleString()}
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="px-2 py-1 rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "var(--tx-secondary)" }}
        >
          Prev
        </button>
        {pages.map((p, i) =>
          p === "..." ? (
            <span key={`dots-${i}`} className="px-1 text-xs" style={{ color: "var(--tx-muted)" }}>...</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(p)}
              className="min-w-[28px] px-1.5 py-1 rounded text-xs font-medium transition-colors"
              style={
                p === currentPage
                  ? { background: "var(--accent-gold)", color: "#000" }
                  : { color: "var(--tx-secondary)" }
              }
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="px-2 py-1 rounded text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ color: "var(--tx-secondary)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
