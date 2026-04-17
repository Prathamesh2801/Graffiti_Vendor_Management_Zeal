import { RefreshCw, Search, Plus, Download, Filter, X, CalendarRange } from "lucide-react";
import { useState } from "react";

export default function CampaignToolbar({
  search, setSearch,
  dateFrom, setDateFrom,
  dateTo, setDateTo,
  limit, setLimit,
  onRefresh, onCreateClick, onExportAll,
  loading
}) {
  const [showFilter, setShowFilter] = useState(false);

  const hasActiveFilters = dateFrom || dateTo;

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="mb-5 space-y-3">
      {/* Row 1: Search + Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--color-text-muted)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, state, user…"
            className="w-full pl-9 pr-9 py-2.5 rounded-xl border text-sm font-body outline-none transition-all"
            style={{
              background: "var(--color-bg-card)",
              color: "var(--color-text-primary)",
              borderColor: "var(--color-border)",
            }}
            onFocus={e => e.target.style.borderColor = "var(--color-primary)"}
            onBlur={e => e.target.style.borderColor = "var(--color-border)"}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter toggle */}
          <button
            onClick={() => setShowFilter(f => !f)}
            className="relative flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider border transition-all"
            style={{
              background: showFilter || hasActiveFilters ? "var(--color-primary)" : "transparent",
              color: showFilter || hasActiveFilters ? "white" : "var(--color-text-secondary)",
              borderColor: showFilter || hasActiveFilters ? "var(--color-primary)" : "var(--color-border)",
            }}
          >
            <Filter size={14} />
            <span className="hidden sm:inline">Filter</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-white absolute -top-0.5 -right-0.5" />
            )}
          </button>

          {/* Refresh */}
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider border transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)", background: "transparent" }}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Per page */}
          <select
            value={limit}
            onChange={e => setLimit(Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl border text-sm font-body outline-none transition-all"
            style={{
              background: "var(--color-bg-card)",
              color: "var(--color-text-primary)",
              borderColor: "var(--color-border)",
            }}
          >
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
          </select>

          {/* Export */}
          <button
            onClick={onExportAll}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--color-secondary)" }}
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Create */}
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus size={14} />
            <span>New Campaign</span>
          </button>
        </div>
      </div>

      {/* Row 2: Date filters (collapsible) */}
      {showFilter && (
        <div
          className="flex flex-wrap gap-3 items-center px-4 py-3 rounded-xl border"
          style={{ background: "var(--color-bg-card)", borderColor: "var(--color-border)" }}
        >
          <CalendarRange size={15} style={{ color: "var(--color-primary)" }} />
          <span className="text-xs font-display font-semibold uppercase tracking-widest" style={{ color: "var(--color-text-secondary)" }}>
            Date Range
          </span>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex flex-col">
              <label className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>Start From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--color-bg)",
                  color: "var(--color-text-primary)",
                  borderColor: "var(--color-border)",
                }}
              />
            </div>
            <span className="text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>→</span>
            <div className="flex flex-col">
              <label className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>End By</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="px-3 py-1.5 rounded-lg border text-sm outline-none"
                style={{
                  background: "var(--color-bg)",
                  color: "var(--color-text-primary)",
                  borderColor: "var(--color-border)",
                }}
              />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all hover:opacity-80"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
              >
                <X size={11} /> Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
