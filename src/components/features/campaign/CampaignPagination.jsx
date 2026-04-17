import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CampaignPagination({ page, limit, total, onPrev, onNext }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = Math.min((page - 1) * limit + 1, total);
  const to = Math.min(page * limit, total);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl border"
      style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
    >
      <span className="text-xs font-body" style={{ color: "var(--color-text-muted)" }}>
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </span>

      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={onPrev}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold uppercase tracking-wider border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:opacity-80 active:scale-[0.97]"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          <ChevronLeft size={13} /> Prev
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let p;
            if (totalPages <= 5) p = i + 1;
            else if (page <= 3) p = i + 1;
            else if (page >= totalPages - 2) p = totalPages - 4 + i;
            else p = page - 2 + i;

            return (
              <span
                key={p}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-xs font-display font-semibold transition-all"
                style={{
                  background: p === page ? "var(--color-primary)" : "transparent",
                  color: p === page ? "white" : "var(--color-text-muted)",
                }}
              >
                {p}
              </span>
            );
          })}
        </div>

        <button
          disabled={page * limit >= total}
          onClick={onNext}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-semibold uppercase tracking-wider border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:opacity-80 active:scale-[0.97]"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          Next <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
