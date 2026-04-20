import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  getSubmissions,
  updateSubmissionStatus,
  updateImageStatus,
} from "../../../api/submissionApi";
import { getUserFromStorage } from "../../../utils/userRoleLocalStorage";
import { BASE_URL } from "../../../../config";

// ─── Status config — all colors from your CSS vars ───────────────────────────
const STATUS_META = {
  Approved: {
    badge: {
      bg: "rgba(39,174,96,0.12)",
      color: "var(--color-success)",
      border: "rgba(39,174,96,0.3)",
    },
    dot: "var(--color-success)",
    btn: {
      bg: "rgba(39,174,96,0.12)",
      color: "var(--color-success)",
      border: "rgba(39,174,96,0.3)",
      hoverBg: "rgba(39,174,96,0.25)",
    },
    cardBorder: "rgba(39,174,96,0.25)",
    strip: "var(--color-success)",
  },
  Rejected: {
    badge: {
      bg: "rgba(201,42,42,0.12)",
      color: "var(--color-error)",
      border: "rgba(201,42,42,0.3)",
    },
    dot: "var(--color-error)",
    btn: {
      bg: "rgba(201,42,42,0.12)",
      color: "var(--color-error)",
      border: "rgba(201,42,42,0.3)",
      hoverBg: "rgba(201,42,42,0.25)",
    },
    cardBorder: "rgba(201,42,42,0.25)",
    strip: "var(--color-error)",
  },
  Pending: {
    badge: {
      bg: "rgba(247,201,72,0.15)",
      color: "#8a6800",
      border: "rgba(247,201,72,0.4)",
    },
    dot: "var(--color-warning)",
    btn: {
      bg: "rgba(247,201,72,0.15)",
      color: "#8a6800",
      border: "rgba(247,201,72,0.4)",
      hoverBg: "rgba(247,201,72,0.3)",
    },
    cardBorder: "rgba(247,201,72,0.25)",
    strip: "var(--color-warning)",
  },
};

const STATUS_OPTIONS = ["Approved", "Rejected", "Pending"];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.Pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide"
      style={{
        background: m.badge.bg,
        color: m.badge.color,
        border: `1px solid ${m.badge.border}`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: m.dot }}
      />
      {status}
    </span>
  );
}

// ─── Status Action Button ─────────────────────────────────────────────────────
function StatusBtn({ status, onClick, disabled, small }) {
  const m = STATUS_META[status] || STATUS_META.Pending;
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`font-semibold border rounded-lg transition-all cursor-pointer disabled:opacity-50 ${small ? "text-[10px] py-0.5 px-1.5" : "text-xs py-1 px-3"}`}
      style={{
        background: m.btn.bg,
        color: m.btn.color,
        borderColor: m.btn.border,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.currentTarget.style.background = m.btn.hoverBg;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = m.btn.bg;
      }}
    >
      {disabled ? "…" : status}
    </button>
  );
}

// ─── Image Lightbox ───────────────────────────────────────────────────────────
function ImageLightbox({ src, onClose }) {
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <motion.div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(26,26,46,0.92)", backdropFilter: "blur(8px)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.88, opacity: 0 }}
        transition={{ type: "spring", damping: 22 }}
        className="relative max-w-4xl max-h-[88vh] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt="wall"
          className="rounded-2xl object-contain max-h-[82vh] max-w-full shadow-2xl"
          style={{ border: "1px solid var(--color-border)" }}
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white cursor-pointer"
          style={{ background: "var(--color-primary)" }}
        >
          ✕
        </button>
        <p
          className="text-center mt-2 text-xs"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Press Esc or click outside to close
        </p>
      </motion.div>
    </motion.div>
  );
}

// ─── Submission Card ──────────────────────────────────────────────────────────
function SubmissionCard({
  record,
  isAdmin,
  onUpdateSubmission,
  onUpdateImage,
  index,
}) {
  const [expanded, setExpanded] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState(null);
  const [updatingSub, setUpdatingSub] = useState(false);
  const [updatingImgId, setUpdatingImgId] = useState(null);

  const meta = STATUS_META[record.Status] || STATUS_META.Pending;
  const images = record.Campaign_Images || [];
  const preview = images[0];
  const fix = (p) => p?.replace(/\.\.\//g, "/") || "";

  const doUpdateSub = async (newStatus) => {
    setUpdatingSub(true);
    try {
      const res = await updateSubmissionStatus({
        uniqueId: record.ID,
        status: newStatus,
      });
      if (res.Status) {
        toast.success(`Marked as ${newStatus}`);
        onUpdateSubmission(record.ID, newStatus);
      } else toast.error(res.Message || "Update failed");
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdatingSub(false);
    }
  };

  const doUpdateImg = async (img, newStatus) => {
    setUpdatingImgId(img.ID);
    try {
      const res = await updateImageStatus({
        imageId: img.ID,
        campaignId: record.Campaign_ID,
        status: newStatus,
      });
      if (res.Status) {
        toast.success(`Image #${img.ID} → ${newStatus}`);
        onUpdateImage(record.ID, img.ID, newStatus);
      } else toast.error(res.Message || "Update failed");
    } catch {
      toast.error("Failed to update image");
    } finally {
      setUpdatingImgId(null);
    }
  };

  return (
    <>
      <AnimatePresence>
        {lightboxSrc && (
          <ImageLightbox
            src={lightboxSrc}
            onClose={() => setLightboxSrc(null)}
          />
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.28 }}
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-bg-card)",
          border: `1px solid ${meta.cardBorder}`,
          boxShadow: "0 1px 4px rgba(26,26,46,0.06)",
        }}
      >
        {/* Status colour strip */}
        <div className="h-1 w-full" style={{ background: meta.strip }} />

        {/* Card body */}
        <div className="p-4 flex items-start gap-4">
          {/* Thumbnail */}
          <div
            className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer relative group"
            style={{ border: "1px solid var(--color-border)" }}
            onClick={() =>
              preview && setLightboxSrc(BASE_URL + fix(preview.Wall_Image))
            }
          >
            {preview ? (
              <>
                <img
                  src={BASE_URL + fix(preview.Wall_Image)}
                  alt="thumb"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src =
                      "https://placehold.co/64x64/eceae4/9898aa?text=IMG";
                  }}
                />
                {images.length > 1 && (
                  <span
                    className="absolute bottom-0 right-0 text-[9px] px-1 py-0.5 rounded-tl-md font-mono font-bold text-white"
                    style={{ background: "rgba(26,26,46,0.75)" }}
                  >
                    +{images.length - 1}
                  </span>
                )}
              </>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-xs"
                style={{
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-muted)",
                }}
              >
                N/A
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusBadge status={record.Status} />
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                style={{
                  background: "var(--color-bg-secondary)",
                  color: "var(--color-text-muted)",
                }}
              >
                {record.ID}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="font-bold text-sm uppercase tracking-wide"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                }}
              >
                {record.User_ID}
              </span>
              <span style={{ color: "var(--color-border-strong)" }}>·</span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {images.length} image{images.length !== 1 ? "s" : ""}
              </span>
            </div>

            <p
              className="text-xs mt-0.5 truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              📍{" "}
              {record.Location === "Vendor"
                ? "Manual / Vendor"
                : record.Location}
            </p>
            <p
              className="text-[11px] mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Updated{" "}
              {new Date(record.Updated_AT).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {record.Updated_BY && (
                <>
                  {" "}
                  by{" "}
                  <strong style={{ color: "var(--color-text-secondary)" }}>
                    {record.Updated_BY}
                  </strong>
                </>
              )}
            </p>
          </div>

          {/* Right side: admin action + expand */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {/* ── Admin: whole-submission status buttons ── */}
            {isAdmin && (
              <div className="flex gap-1.5 flex-wrap justify-end">
                {STATUS_OPTIONS.filter((s) => s !== record.Status).map((s) => (
                  <StatusBtn
                    key={s}
                    status={s}
                    disabled={updatingSub}
                    onClick={() => doUpdateSub(s)}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setExpanded((v) => !v)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              {expanded ? "▲ Collapse" : "▼ View Images"}
            </button>
          </div>
        </div>

        {/* ── Expanded image grid ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.26 }}
              className="overflow-hidden"
            >
              <div
                className="px-4 pb-4 pt-3"
                style={{ borderTop: "1px solid var(--color-border)" }}
              >
                <p
                  className="text-[10px] uppercase tracking-widest font-bold mb-3"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Wall Images ({images.length})
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
                  {images.map((img) => (
                    <div key={img.ID} className="group">
                      {/* Image tile */}
                      <div
                        className="aspect-square rounded-xl overflow-hidden cursor-zoom-in relative"
                        style={{ border: "1px solid var(--color-border)" }}
                        onClick={() =>
                          setLightboxSrc(BASE_URL + fix(img.Wall_Image))
                        }
                      >
                        <img
                          src={BASE_URL + fix(img.Wall_Image)}
                          alt={`img-${img.ID}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/200x200/eceae4/9898aa?text=IMG";
                          }}
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xl"
                          style={{ background: "rgba(26,26,46,0.3)" }}
                        >
                          🔍
                        </div>
                      </div>

                      {/* Image meta */}
                      <div className="mt-1.5 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <StatusBadge status={img.Status} />
                          <span
                            className="text-[10px] font-mono"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            #{img.ID}
                          </span>
                        </div>
                        {img.Placed_BY && (
                          <p
                            className="text-[10px]"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            By: <strong>{img.Placed_BY}</strong>
                          </p>
                        )}
                        <p
                          className="text-[10px] truncate"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          📍{" "}
                          {img.Geo_Location === "Vendor"
                            ? "Manual"
                            : img.Geo_Location}
                        </p>
                      </div>

                      {/* ── Admin: per-image status buttons ── */}
                      {isAdmin && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {STATUS_OPTIONS.filter((s) => s !== img.Status).map(
                            (s) => (
                              <StatusBtn
                                key={s}
                                status={s}
                                small
                                disabled={updatingImgId === img.ID}
                                onClick={() => doUpdateImg(img, s)}
                              />
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accentColor, loading }) {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-center"
      style={{
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        className="text-2xl font-bold"
        style={{ fontFamily: "var(--font-display)", color: accentColor }}
      >
        {loading ? "—" : value}
      </div>
      <div
        className="text-[10px] uppercase tracking-widest mt-0.5 font-semibold"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
    </div>
  );
}

// ─── Floating Bulk Bar ────────────────────────────────────────────────────────
function BulkBar({ count, onApproveAll, onRejectAll, onClear, loading }) {
  return (
    <motion.div
      initial={{ y: 72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 72, opacity: 0 }}
      transition={{ type: "spring", damping: 22 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
      style={{
        background: "var(--color-secondary)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <span className="text-sm font-semibold text-white/80">
        {count} selected
      </span>
      <div className="w-px h-5 bg-white/15" />
      <button
        onClick={onApproveAll}
        disabled={loading}
        className="px-4 py-1.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all disabled:opacity-50"
        style={{
          background: "rgba(39,174,96,0.2)",
          color: "#27ae60",
          borderColor: "rgba(39,174,96,0.35)",
        }}
      >
        ✓ Approve All
      </button>
      <button
        onClick={onRejectAll}
        disabled={loading}
        className="px-4 py-1.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all disabled:opacity-50"
        style={{
          background: "rgba(201,42,42,0.2)",
          color: "#c92a2a",
          borderColor: "rgba(201,42,42,0.35)",
        }}
      >
        ✕ Reject All
      </button>
      <button
        onClick={onClear}
        className="text-xs border rounded-xl px-3 py-1.5 cursor-pointer text-white/50 hover:text-white/80 transition-all"
        style={{ borderColor: "rgba(255,255,255,0.12)" }}
      >
        Clear
      </button>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function VendorSubmissions({ campaign, onBack }) {
  const user = getUserFromStorage();
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterUser, setFilterUser] = useState("All");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getSubmissions({ Campaign_ID: campaign.id });
      if (res.Status) setRecords(res.Records || []);
      else toast.error(res.Message || "Failed to load");
    } catch {
      toast.error("Failed to fetch submissions");
    } finally {
      setLoading(false);
    }
  }, [campaign.id]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Optimistic update helpers
  const applySubUpdate = (id, newStatus) =>
    setRecords((prev) =>
      prev.map((r) =>
        r.ID === id
          ? {
              ...r,
              Status: newStatus,
              Campaign_Images: r.Campaign_Images.map((img) => ({
                ...img,
                Status: newStatus,
              })),
            }
          : r,
      ),
    );

  const applyImgUpdate = (subId, imgId, newStatus) =>
    setRecords((prev) =>
      prev.map((r) =>
        r.ID === subId
          ? {
              ...r,
              Campaign_Images: r.Campaign_Images.map((img) =>
                img.ID === imgId ? { ...img, Status: newStatus } : img,
              ),
            }
          : r,
      ),
    );

  // Stats
  const stats = {
    total: records.length,
    approved: records.filter((r) => r.Status === "Approved").length,
    rejected: records.filter((r) => r.Status === "Rejected").length,
    pending: records.filter((r) => r.Status === "Pending").length,
    images: records.reduce((s, r) => s + (r.Campaign_Images?.length || 0), 0),
  };

  const uniqueUsers = [...new Set(records.map((r) => r.User_ID))].sort();

  const filtered = records.filter((r) => {
    if (filterStatus !== "All" && r.Status !== filterStatus) return false;
    if (filterUser !== "All" && r.User_ID !== filterUser) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.ID.toLowerCase().includes(q) ||
        r.User_ID.toLowerCase().includes(q) ||
        (r.Location || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Bulk select
  const toggleSelect = (id) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const selectAll = () => setSelected(new Set(filtered.map((r) => r.ID)));
  const clearSelect = () => setSelected(new Set());
  const allSelected = filtered.length > 0 && selected.size === filtered.length;
  const someSelected = selected.size > 0 && !allSelected;

  const bulkUpdate = async (newStatus) => {
    setBulkLoading(true);
    let ok = 0;
    await Promise.all(
      [...selected].map(async (id) => {
        try {
          const res = await updateSubmissionStatus({
            uniqueId: id,
            status: newStatus,
          });
          if (res.Status) {
            applySubUpdate(id, newStatus);
            ok++;
          }
        } catch {
          /* continue */
        }
      }),
    );
    toast.success(`${ok} submission${ok !== 1 ? "s" : ""} marked ${newStatus}`);
    clearSelect();
    setBulkLoading(false);
  };

  const inputStyle = {
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-primary)",
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
      }}
    >
      <div className="max-w-full px-4 sm:px-6 py-6">
        {/* ── Header ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-all"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-primary)";
              e.currentTarget.style.borderColor = "var(--color-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-secondary)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            ← Campaigns
          </button>

          <div
            className="w-px h-5"
            style={{ background: "var(--color-border-strong)" }}
          />

          <div>
            <h2
              className="text-2xl font-bold uppercase tracking-wide"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-primary)",
              }}
            >
              Vendor Submissions
            </h2>
            <p
              className="text-xs mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              Campaign:{" "}
              <strong style={{ color: "var(--color-text-secondary)" }}>
                {campaign.name}
              </strong>
              <span
                className="mx-1.5"
                style={{ color: "var(--color-border-strong)" }}
              >
                ·
              </span>
              <span className="font-mono">{campaign.id}</span>
            </p>
          </div>

          {/* Role indicator */}
          <span
            className="ml-auto px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest border"
            style={
              isAdmin
                ? {
                    background: "rgba(232,66,10,0.1)",
                    color: "var(--color-primary)",
                    borderColor: "rgba(232,66,10,0.3)",
                  }
                : {
                    background: "var(--color-bg-secondary)",
                    color: "var(--color-text-secondary)",
                    borderColor: "var(--color-border)",
                  }
            }
          >
            {isAdmin ? "Admin" : "Client"} View
          </span>
        </div>

        {/* ── Stats ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid grid-cols-2 sm:${isAdmin ? "grid-cols-5" : "grid-cols-2"} gap-3 mb-6`}
        >
          <StatCard
            label="Total"
            value={stats.total}
            accentColor="var(--color-text-primary)"
            loading={loading}
          />
          {isAdmin && (
            <StatCard
              label="Approved"
              value={stats.approved}
              accentColor="var(--color-success)"
              loading={loading}
            />
          )}
          {isAdmin && (
            <StatCard
              label="Rejected"
              value={stats.rejected}
              accentColor="var(--color-error)"
              loading={loading}
            />
          )}
          {isAdmin && (
            <StatCard
              label="Pending"
              value={stats.pending}
              accentColor="#8a6800"
              loading={loading}
            />
          )}
          <StatCard
            label="Images"
            value={stats.images}
            accentColor="var(--color-complement)"
            loading={loading}
          />
        </motion.div>

        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: "var(--color-text-muted)" }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by ID, user, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={(e) =>
                (e.target.style.borderColor = "var(--color-primary)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "var(--color-border)")
              }
            />
          </div>

          {isAdmin && (
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm cursor-pointer outline-none"
              style={inputStyle}
            >
              <option value="All">All Status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {isAdmin && (
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm cursor-pointer outline-none"
              style={inputStyle}
            >
              <option value="All">All Users</option>
              {uniqueUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={fetchSubmissions}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all disabled:opacity-50"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            ↺ Refresh
          </button>
        </div>

        {/* ── Admin bulk-select bar ── */}
        {isAdmin && filtered.length > 0 && (
          <div
            className="flex items-center gap-3 mb-4 px-4 py-2.5 rounded-xl flex-wrap"
            style={{
              background: "var(--color-bg-card)",
              border: "1px solid var(--color-border)",
            }}
          >
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={() => (allSelected ? clearSelect() : selectAll())}
              className="w-4 h-4 cursor-pointer rounded"
              style={{ accentColor: "var(--color-primary)" }}
            />
            <span
              className="text-xs font-semibold"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {allSelected
                ? `All ${filtered.length} selected`
                : someSelected
                  ? `${selected.size} of ${filtered.length} selected`
                  : `Select all ${filtered.length} submissions`}
            </span>

            {selected.size > 0 && (
              <>
                <div
                  className="w-px h-4"
                  style={{ background: "var(--color-border)" }}
                />
                <button
                  onClick={() => bulkUpdate("Approved")}
                  disabled={bulkLoading}
                  className="px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-all disabled:opacity-50"
                  style={{
                    background: "rgba(39,174,96,0.12)",
                    color: "var(--color-success)",
                    borderColor: "rgba(39,174,96,0.3)",
                  }}
                >
                  ✓ Approve Selected
                </button>
                <button
                  onClick={() => bulkUpdate("Rejected")}
                  disabled={bulkLoading}
                  className="px-3 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-all disabled:opacity-50"
                  style={{
                    background: "rgba(201,42,42,0.12)",
                    color: "var(--color-error)",
                    borderColor: "rgba(201,42,42,0.3)",
                  }}
                >
                  ✕ Reject Selected
                </button>
                <button
                  onClick={clearSelect}
                  className="ml-auto text-xs cursor-pointer underline underline-offset-2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Clear selection
                </button>
              </>
            )}
          </div>
        )}

        {/* ── Content ── */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.9, ease: "linear" }}
              className="w-9 h-9 rounded-full border-2"
              style={{
                borderColor: "var(--color-border)",
                borderTopColor: "var(--color-primary)",
              }}
            />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Loading submissions…
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="text-5xl opacity-25">📭</div>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No submissions found
            </p>
            {(search || filterStatus !== "All" || filterUser !== "All") && (
              <button
                onClick={() => {
                  setSearch("");
                  setFilterStatus("All");
                  setFilterUser("All");
                }}
                className="text-xs underline underline-offset-2 cursor-pointer"
                style={{ color: "var(--color-primary)" }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((record, i) => (
              <div key={record.ID} className="flex gap-3 items-start">
                {isAdmin && (
                  <div className="pt-[22px] flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={selected.has(record.ID)}
                      onChange={() => toggleSelect(record.ID)}
                      className="w-4 h-4 cursor-pointer rounded"
                      style={{ accentColor: "var(--color-primary)" }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <SubmissionCard
                    record={record}
                    isAdmin={isAdmin}
                    onUpdateSubmission={applySubUpdate}
                    onUpdateImage={applyImgUpdate}
                    index={i}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {selected.size > 0 && <div className="h-20" />}
      </div>

      {/* ── Floating Bulk Bar ── */}
      <AnimatePresence>
        {isAdmin && selected.size > 0 && (
          <BulkBar
            count={selected.size}
            onApproveAll={() => bulkUpdate("Approved")}
            onRejectAll={() => bulkUpdate("Rejected")}
            onClear={clearSelect}
            loading={bulkLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
