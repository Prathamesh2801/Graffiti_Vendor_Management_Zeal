import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { BASE_URL } from "../../../../config";
import { getImages } from "../../../utils/indexedDB";

/* ── Helpers ── */
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolveImageUrl(path) {
  if (!path) return null;

  // 🔥 1. Handle blob URLs (offline images)
  if (path.startsWith("blob:")) {
    return path;
  }

  // 🔥 2. Handle full URLs (already correct)
  if (path.startsWith("http")) {
    return path;
  }

  // 🔥 3. Handle relative paths from server
  const clean = path.replace(/^\.\.\//, "");

  return `${BASE_URL}/${clean}`;
}

/* ── Status badge ── */
const STATUS = {
  Pending: {
    bg: "rgba(247,201,72,0.12)",
    border: "rgba(247,201,72,0.4)",
    text: "#9a6e00",
    dot: "#e8b800",
  },
  Approved: {
    bg: "rgba(39,174,96,0.1)",
    border: "rgba(39,174,96,0.3)",
    text: "#1d7a46",
    dot: "#27ae60",
  },
  Rejected: {
    bg: "rgba(201,42,42,0.1)",
    border: "rgba(201,42,42,0.3)",
    text: "#a62e06",
    dot: "#c92a2a",
  },
  Failed: {
    bg: "rgba(201,42,42,0.1)",
    border: "rgba(201,42,42,0.3)",
    text: "#c92a2a",
    dot: "#c92a2a",
  },
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.Pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.text,
        fontFamily: "var(--font-display)",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.dot }}
      />
      {status}
    </span>
  );
}

/* ── Location display ── */
function LocationChip({ location }) {
  if (!location || location === "Vendor")
    return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
  const [lat, lng] = location.replace(" (cached)", "").split(",");
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-70"
      style={{ color: "var(--color-complement)", fontFamily: "monospace" }}
      onClick={(e) => e.stopPropagation()}
    >
      📍 {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
    </a>
  );
}

/* ── Image lightbox ── */
function Lightbox({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,20,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.img
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        src={src}
        alt="Wall image"
        className="max-w-full max-h-[88vh] rounded-2xl object-contain"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}
        onClick={(e) => e.stopPropagation()}
      />
      <button
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
        style={{
          background: "rgba(255,255,255,0.15)",
          backdropFilter: "blur(4px)",
        }}
        onClick={onClose}
      >
        ×
      </button>
    </motion.div>
  );
}

/* ── Record card ── */
function RecordCard({ record, index, onEdit, onSubmit }) {
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const [offlineImages, setOfflineImages] = useState([]);

  useEffect(() => {
    if (record.isOffline && record.imageIds) {
      getImages(record.imageIds).then(setOfflineImages);
    }
  }, [record]);

  const images = record.isOffline
    ? offlineImages.map((file) => ({
        Wall_Image: URL.createObjectURL(file),
        Status: "Pending",
      }))
    : record.Campaign_Images || [];
  const overallStatus = record.Status;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.35,
          ease: [0.22, 1, 0.36, 1],
          delay: index * 0.06,
        }}
        className="rounded-2xl border overflow-hidden transition-shadow hover:shadow-md"
        style={{
          background: "var(--color-bg-card)",
          borderColor: "var(--color-border)",
        }}
      >
        {/* Status stripe */}
        <div
          className="h-1 w-full"
          style={{
            background:
              overallStatus === "Approved"
                ? "var(--color-success)"
                : overallStatus === "Rejected"
                  ? "var(--color-error)"
                  : "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
          }}
        />

        <div className="p-5 ">
          {/* Top row */}
          <div className="flex  items-start justify-between gap-3 mb-4">
            <div className="min-w-0 ">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-primary)",
                }}
              >
                Graffiti Code
              </p>
              <p
                className="text-lg font-black leading-none truncate"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-secondary)",
                }}
              >
                {record.code || record.ID}
              </p>
            </div>

            <StatusBadge status={overallStatus} />
          </div>

          {/* Meta grid */}
          <div
            className="grid grid-cols-2 gap-x-4 gap-y-2.5 mb-4 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <div>
              <p
                className="font-bold uppercase tracking-wider mb-0.5"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-muted)",
                  fontSize: "10px",
                }}
              >
                Submitted
              </p>
              <p style={{ fontFamily: "var(--font-body)" }}>
                {formatDate(record.Created_AT)}
              </p>
            </div>
            <div>
              <p
                className="font-bold uppercase tracking-wider mb-0.5"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-muted)",
                  fontSize: "10px",
                }}
              >
                Last Updated
              </p>
              <p style={{ fontFamily: "var(--font-body)" }}>
                {formatDate(record.Updated_AT)}
              </p>
            </div>
            <div>
              <p
                className="font-bold uppercase tracking-wider mb-0.5"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-muted)",
                  fontSize: "10px",
                }}
              >
                Images
              </p>
              <p style={{ fontFamily: "var(--font-body)" }}>
                {images.length} wall image{images.length !== 1 ? "s" : ""}
              </p>
            </div>
            {record.isOffline && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onEdit(record)}
                  className="text-xs bg-yellow-500 text-white px-2 py-1 rounded"
                >
                  Edit
                </button>

                <button
                  onClick={() => {
                    console.log("🟢 Submit button clicked in UI:", record);
                    onSubmit(record);
                  }}
                  className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                >
                  Submit
                </button>
                  {record.error && (
              <p className="text-xs text-red-500 mt-2">❌ {record.error}</p>
            )}
              </div>
            )}

          
            <div>
              <p
                className="font-bold uppercase tracking-wider mb-0.5"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-muted)",
                  fontSize: "10px",
                }}
              >
                Location
              </p>
              <LocationChip location={record.Location} />
            </div>
          </div>

          {/* Image thumbnails (first 3 + expand) */}
          {images.length > 0 && (
            <div className="flex gap-2 mb-3">
              {images.slice(0, expanded ? images.length : 3).map((img, i) => (
                <motion.button
                  key={i}
                  type="button"
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setLightbox(resolveImageUrl(img.Wall_Image))}
                  className="relative rounded-xl overflow-hidden flex-shrink-0 group"
                  style={{
                    width: 72,
                    height: 72,
                    background: "var(--color-bg-secondary)",
                  }}
                >
                  <img
                    src={resolveImageUrl(img.Wall_Image)}
                    alt={`Wall ${i + 1}`}
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(26,26,46,0.45)" }}
                  >
                    <span className="text-white text-lg">🔍</span>
                  </div>
                  {/* Per-image status */}
                  <div className="absolute bottom-1 left-1">
                    <StatusBadge status={img.Status} />
                  </div>
                </motion.button>
              ))}

              {!expanded && images.length > 3 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setExpanded(true)}
                  className="rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black"
                  style={{
                    width: 72,
                    height: 72,
                    background: "var(--color-primary-50)",
                    color: "var(--color-primary)",
                    border: "1.5px dashed var(--color-primary-light)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  +{images.length - 3}
                </motion.button>
              )}
            </div>
          )}

          {/* Expand/collapse per-image details */}
          {images.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-opacity hover:opacity-70"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {expanded ? "▲ Collapse" : "▼ Image Details"}
            </button>
          )}

          {/* Expanded per-image details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 flex flex-col gap-2">
                  {images.map((img, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: "var(--color-bg)",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <img
                        src={resolveImageUrl(img.Wall_Image)}
                        alt={`Wall ${i + 1}`}
                        className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-xs font-bold mb-0.5"
                          style={{
                            fontFamily: "var(--font-display)",
                            color: "var(--color-text-secondary)",
                          }}
                        >
                          Image {i + 1}
                        </p>
                        <LocationChip location={img.Geo_Location} />
                      </div>
                      <StatusBadge status={img.Status} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <Lightbox src={lightbox} onClose={() => setLightbox(null)} />
        )}
      </AnimatePresence>
    </>
  );
}

/* ── Main component ── */
export default function SubmissionList({
  onNewSubmission,
  onEdit,
  onSubmit,
  syncedIds,
  records,
  loading,
  error,
}) {
  const [filter, setFilter] = useState("All");

  const getOfflineRecords = () => {
    const queue = JSON.parse(
      localStorage.getItem("vendor_offline_queue") || "[]",
    );

    return queue
      .filter((item) => !syncedIds.includes(item.id))
      .map((item) => ({
        ID: item.id,
        code: item.code,
        Campaign_ID: item.code,
        Created_AT: item.timestamp,
        Updated_AT: item.timestamp,
        Status:
          item.status === "ready"
            ? "Pending"
            : item.status === "failed"
              ? "Failed"
              : "Draft",
        Location: item.geoLocation,
        Campaign_Images: [],
        isOffline: true,
        imageIds: item.imageIds,
        error: item.error,
      }));
  };

  const combinedRecords = [...getOfflineRecords(), ...records];

  const statuses = ["All", "Pending", "Approved", "Rejected"];
  const filtered =
    filter === "All"
      ? combinedRecords
      : combinedRecords.filter((r) => r.Status === filter);

  // Summary counts
  const counts = combinedRecords.reduce((acc, r) => {
    acc[r.Status] = (acc[r.Status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-5">
      {/* Summary pills */}
      {records.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {[
            {
              label: "Total",
              count: records.length,
              color: "var(--color-secondary)",
            },
            { label: "Pending", count: counts.Pending || 0, color: "#9a6e00" },
            {
              label: "Approved",
              count: counts.Approved || 0,
              color: "var(--color-success)",
            },
            {
              label: "Rejected",
              count: counts.Rejected || 0,
              color: "var(--color-error)",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
                fontFamily: "var(--font-display)",
                color: "var(--color-text-secondary)",
              }}
            >
              <span
                className="text-lg font-black"
                style={{ color: s.color, fontFamily: "var(--font-display)" }}
              >
                {s.count}
              </span>
              <span className="uppercase tracking-wider">{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      {records.length > 0 && (
        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "var(--color-bg-secondary)" }}
        >
          {statuses.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className="flex-1 h-8 rounded-lg text-xs font-bold uppercase tracking-wider transition-all"
              style={{
                fontFamily: "var(--font-display)",
                background:
                  filter === s ? "var(--color-bg-card)" : "transparent",
                color:
                  filter === s
                    ? "var(--color-primary)"
                    : "var(--color-text-muted)",
                boxShadow:
                  filter === s ? "0 1px 4px rgba(26,26,46,0.1)" : "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <motion.div
            className="w-10 h-10 rounded-full border-2 border-t-transparent"
            style={{
              borderColor: "var(--color-primary-light)",
              borderTopColor: "var(--color-primary)",
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            Loading submissions…
          </p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">⚠️</span>
          <p className="text-sm" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            // onClick={fetchRecords}
            className="h-9 px-5 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--color-primary)",
            }}
          >
            Retry
          </motion.button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && records.length === 0 && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: "var(--color-primary-50)" }}
          >
            📋
          </div>
          <div>
            <p
              className="font-bold text-base mb-1"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-primary)",
              }}
            >
              No submissions yet
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Start by creating your first campaign submission.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onNewSubmission}
            className="h-10 px-6 rounded-xl text-sm font-bold uppercase tracking-wider text-white"
            style={{
              fontFamily: "var(--font-display)",
              background: "var(--color-primary)",
              boxShadow: "0 4px 14px rgba(232,66,10,0.28)",
            }}
          >
            + New Submission
          </motion.button>
        </div>
      )}

      {/* Records list */}
      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-4">
          {filtered.map((record, i) => (
            <RecordCard
              key={record.ID}
              index={i}
              record={record}
              onEdit={onEdit}
              onSubmit={onSubmit}
            />
          ))}
        </div>
      )}

      {/* No results for filter */}
      {!loading && !error && records.length > 0 && filtered.length === 0 && (
        <div
          className="text-center py-10 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          No {filter.toLowerCase()} submissions found.
        </div>
      )}
    </div>
  );
}
