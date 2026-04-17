import { AlertTriangle, X } from "lucide-react";

export default function DeleteConfirmModal({ campaign, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--color-bg-card)", border: "1px solid var(--color-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.12)" }}>
              <AlertTriangle size={16} style={{ color: "#ef4444" }} />
            </div>
            <h3 className="font-display font-bold text-base uppercase tracking-wide" style={{ color: "var(--color-text-primary)" }}>
              Delete Campaign
            </h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg transition-all hover:opacity-70" style={{ color: "var(--color-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-sm font-body" style={{ color: "var(--color-text-secondary)" }}>
            Are you sure you want to delete{" "}
            <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>
              "{campaign?.name}"
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t" style={{ borderColor: "var(--color-border)" }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-display font-semibold uppercase tracking-wider border transition-all hover:opacity-80"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl text-sm font-display font-semibold uppercase tracking-wider text-white transition-all hover:opacity-90 active:scale-[0.98]"
            style={{ background: "#ef4444" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
