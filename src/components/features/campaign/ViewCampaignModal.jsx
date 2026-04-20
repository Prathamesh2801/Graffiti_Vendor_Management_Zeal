import { X, Calendar, MapPin, LayoutGrid, Users, Pencil } from "lucide-react";

export default function ViewCampaignModal({
  campaign: c,
  onClose,
  onEdit,

  onViewSubmissions,
}) {
  if (!c) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-6 py-4 border-b"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div>
            <div
              className="text-xs font-display font-semibold uppercase tracking-widest mb-1"
              style={{ color: "var(--color-primary)" }}
            >
              Campaign Details
            </div>
            <h3
              className="font-display font-bold text-xl"
              style={{ color: "var(--color-text-primary)" }}
            >
              {c.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:opacity-70 mt-0.5"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {c.description && (
            <p
              className="text-sm font-body"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {c.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              icon={<MapPin size={14} />}
              label="State"
              value={c.state}
            />
            <InfoCard
              icon={<LayoutGrid size={14} />}
              label="Walls"
              value={c.walls}
            />
            <InfoCard
              icon={<Calendar size={14} />}
              label="Start Date"
              value={c.startDate}
              mono
            />
            <InfoCard
              icon={<Calendar size={14} />}
              label="End Date"
              value={c.endDate}
              mono
            />
          </div>

          {/* Assigned Users */}
          <div
            className="rounded-xl p-3.5 border"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg)",
            }}
          >
            <div className="flex items-center gap-2 mb-2.5">
              <Users size={14} style={{ color: "var(--color-primary)" }} />
              <span
                className="text-xs font-display font-semibold uppercase tracking-widest"
                style={{ color: "var(--color-text-secondary)" }}
              >
                Assigned Users ({(c.assignedUsers || []).length})
              </span>
            </div>
            {(c.assignedUsers || []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {c.assignedUsers.map((u) => (
                  <span
                    key={u}
                    className="inline-block px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background:
                        "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {u}
                  </span>
                ))}
              </div>
            ) : (
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                No users assigned
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex justify-end gap-3 px-6 py-4 border-t"
          style={{ borderColor: "var(--color-border)" }}
        >
          <button
            onClick={onViewSubmissions}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                 bg-indigo-500/15 text-indigo-400 border border-indigo-500/30
                 hover:bg-indigo-500/25 transition-all"
          >
            {/* simple camera / image icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828
                 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0
                 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Vendor Submissions
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-display font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-display font-semibold uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "var(--color-secondary)" }}
          >
            <Pencil size={13} /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value, mono }) {
  return (
    <div
      className="rounded-xl p-3 border"
      style={{
        borderColor: "var(--color-border)",
        background: "var(--color-bg)",
      }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: "var(--color-primary)" }}>{icon}</span>
        <span
          className="text-xs font-display font-semibold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
      </div>
      <div
        className={`text-sm font-semibold ${mono ? "font-mono" : ""}`}
        style={{ color: "var(--color-text-primary)" }}
      >
        {value || "—"}
      </div>
    </div>
  );
}
