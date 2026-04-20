import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImagePreviewGrid from "./ImagePreviewGrid";
import { getImages, saveImages } from "../../../utils/indexedDB";
import { registerBackgroundSync } from "../../../utils/registerSync";

/* ─────────────────────────────────────────────────
   Geolocation helper
   Strategy:
   1. Try navigator.geolocation (works offline via device GPS)
   2. On any error fall back to last known coords in localStorage
   3. If neither available, surface an error
───────────────────────────────────────────────── */
const GEO_CACHE_KEY = "vendor_last_geo";

function getGeoLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = `${pos.coords.latitude},${pos.coords.longitude}`;
        // Cache for offline fallback
        localStorage.setItem(GEO_CACHE_KEY, coords);
        resolve(coords);
      },
      (_err) => {
        // Attempt last-known offline fallback
        const cached = localStorage.getItem(GEO_CACHE_KEY);
        if (cached) {
          resolve(cached + " (cached)");
        } else {
          reject(
            new Error("Location unavailable. Please enable GPS and try again."),
          );
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 },
    );
  });
}

function enqueueOffline(item) {
  const queue = JSON.parse(
    localStorage.getItem("vendor_offline_queue") || "[]",
  );
  queue.push(item);
  localStorage.setItem("vendor_offline_queue", JSON.stringify(queue));
}

/* ─── Status pill ─── */
const GeoStatus = ({ status, coords, error, onFetch }) => {
  const cfg = {
    idle: {
      bg: "rgba(26,26,46,0.05)",
      border: "var(--color-border)",
      text: "var(--color-text-secondary)",
      icon: "🌐",
      label: "Location Required",
      detail: "Tap Allow to capture your GPS coordinates.",
    },
    fetching: {
      bg: "rgba(247,201,72,0.08)",
      border: "rgba(247,201,72,0.4)",
      text: "#9a6e00",
      icon: "⏳",
      label: "Fetching Location…",
      detail: "Allow location access in your browser prompt.",
    },
    ok: {
      bg: "rgba(39,174,96,0.07)",
      border: "rgba(39,174,96,0.3)",
      text: "var(--color-success)",
      icon: "📍",
      label: "Location Captured",
      detail: coords,
    },
    error: {
      bg: "rgba(201,42,42,0.06)",
      border: "rgba(201,42,42,0.3)",
      text: "var(--color-error)",
      icon: "⚠️",
      label: "Location Error",
      detail: error,
    },
  }[status];

  return (
    <div
      className="flex items-center gap-3 p-3.5 rounded-xl"
      style={{ background: cfg.bg, border: `1.5px solid ${cfg.border}` }}
    >
      <span className="text-xl flex-shrink-0 leading-none">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-bold uppercase tracking-wider leading-none mb-0.5"
          style={{ fontFamily: "var(--font-display)", color: cfg.text }}
        >
          {cfg.label}
        </p>
        <p
          className="text-xs truncate"
          style={{
            color:
              status === "ok"
                ? "var(--color-complement)"
                : "var(--color-text-muted)",
            fontFamily: status === "ok" ? "monospace" : "var(--font-body)",
            fontSize: status === "ok" ? "11px" : undefined,
          }}
        >
          {cfg.detail}
        </p>
      </div>
      {status !== "ok" && onFetch && (
        <button
          type="button"
          onClick={() => onFetch && onFetch()}
          disabled={status === "fetching"}
          className="flex-shrink-0 h-8 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white transition-all"
          style={{
            background:
              status === "fetching"
                ? "var(--color-text-muted)"
                : "var(--color-primary)",
            fontFamily: "var(--font-display)",
            cursor: status === "fetching" ? "not-allowed" : "pointer",
          }}
        >
          {status === "error" ? "Retry" : status === "fetching" ? "…" : "Allow"}
        </button>
      )}
    </div>
  );
};

export default function UploadForm({
  campaignCode,
  isOnline,
  onBack,
  onSubmitted,
  editingRecord,
}) {
  const [images, setImages] = useState([]); // { id, file, preview }
  const [dragOver, setDragOver] = useState(false);
  const [geoStatus, setGeoStatus] = useState("idle");
  const [geoCoords, setGeoCoords] = useState(null);
  const [geoError, setGeoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef(null);
  const isEditMode = !!editingRecord;

  /* ── Geo ── */
  const fetchGeo = useCallback(async () => {
    setGeoStatus("fetching");
    setGeoError("");
    try {
      const coords = await getGeoLocation();
      setGeoCoords(coords);
      setGeoStatus("ok");
    } catch (err) {
      setGeoStatus("error");
      setGeoError(err.message || "Location access denied.");
    }
  }, []);

  useEffect(() => {
    if (editingRecord?.imageIds) {
      getImages(editingRecord.imageIds).then((files) => {
        const mapped = files.map((file) => ({
          id: `${Date.now()}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
        }));
        setImages(mapped);
      });
    }
  }, [editingRecord]);

  useEffect(() => {
    if (editingRecord) {
      // 🔥 FIX FIELD NAME HERE
      const location = editingRecord.geoLocation || editingRecord.Location;

      if (location) {
        setGeoCoords(location);
        setGeoStatus("ok");
      }
    }
  }, [editingRecord]);

  /* ── File handling ── */
  const addFiles = (files) => {
    // 🔒 BLOCK adding images in edit mode
    if (isEditMode) return;

    const accepted = Array.from(files).filter((f) =>
      f.type.startsWith("image/"),
    );
    const newItems = accepted.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...newItems]);
  };

  const removeImage = (id) => {
    // 🔒 BLOCK removing images in edit mode
    if (isEditMode) return;

    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!geoCoords) return;
    if (images.length === 0) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      const submissionId = editingRecord
        ? editingRecord.ID
        : `sub_${Date.now()}`;

      const base = {
        id: submissionId,
        code: campaignCode,
        geoLocation: geoCoords,
        timestamp: new Date().toISOString(),
        imageCount: images.length,
      };

      // 🔴 OFFLINE OR ONLINE → SAME FLOW (QUEUE ONLY)

      if (editingRecord) {
        const queue = JSON.parse(
          localStorage.getItem("vendor_offline_queue") || "[]",
        );

        const updated = queue.map((item) =>
          item.id === editingRecord.ID
            ? {
                ...item,
                code: campaignCode,
                geoLocation: geoCoords,
                status: "ready",
                error: null,
              }
            : item,
        );

        localStorage.setItem("vendor_offline_queue", JSON.stringify(updated));
      } else {
        await saveImages(
          submissionId,
          images.map((i) => i.file),
        );

        enqueueOffline({
          ...base,
          imageIds: submissionId,
          status: "ready",
        });
      }

      // 🔥 ALWAYS RESET FIRST
      setSubmitting(false);

      // 🔥 THEN NAVIGATE
      onSubmitted({
        ...base,
        status: "Pending",
      });
    } catch (err) {
      console.error("❌ SUBMIT ERROR:", err);

      setSubmitError("Something went wrong. Try again.");
      setSubmitting(false); // 🔥 CRITICAL
    }
  };

  const canSubmit = images.length > 0 && geoCoords && !submitting;

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
      }}
    >
      <div
        className="h-1.5 w-full"
        style={{
          background:
            "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
        }}
      />

      <div className="p-8">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-2"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-primary)",
          }}
        >
          Step 2 of 2
        </p>
        <h2
          className="text-4xl font-black leading-none mb-1"
          style={{
            fontFamily: "var(--font-display)",
            color: "var(--color-secondary)",
          }}
        >
          {isEditMode ? "Fix Submission" : "Upload Images"}
        </h2>

        {isEditMode && (
          <p className="text-xs text-yellow-600 font-semibold">
            ⚠️ You are editing a failed submission
          </p>
        )}
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: "var(--color-text-secondary)" }}
        >
          Campaign:{" "}
          <span
            className="font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {campaignCode}
          </span>
          {" · "}Upload your wall images. At least 1 required.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Geo strip */}
          <GeoStatus
            status={geoStatus}
            coords={geoCoords}
            error={geoError}
            onFetch={isEditMode ? null : fetchGeo}
          />

          {/* Drop zone */}
          <motion.div
            className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer select-none transition-colors duration-200 outline-none"
            style={{
              borderColor: dragOver
                ? "var(--color-primary)"
                : "var(--color-border-strong)",
              background: dragOver
                ? "var(--color-primary-50)"
                : "var(--color-bg)",
            }}
            animate={dragOver ? { scale: 1.01 } : { scale: 1 }}
            onDragOver={(e) => {
              if (isEditMode) return;
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              if (isEditMode) return;
              onDrop(e);
            }}
            onClick={() => {
              if (!isEditMode) fileInputRef.current?.click();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && !isEditMode && fileInputRef.current?.click()
            }
            whileHover={{ borderColor: "var(--color-primary)" }}
          >
            <motion.div
              animate={
                dragOver ? { scale: 1.15, rotate: 5 } : { scale: 1, rotate: 0 }
              }
              transition={{ type: "spring", stiffness: 300 }}
            >
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect
                  x="4"
                  y="8"
                  width="40"
                  height="32"
                  rx="6"
                  stroke="var(--color-primary-light)"
                  strokeWidth="2.5"
                />
                <circle
                  cx="15"
                  cy="20"
                  r="3.5"
                  stroke="var(--color-primary-light)"
                  strokeWidth="2.5"
                />
                <path
                  d="M4 32l10-10 8 8 6-6 16 14"
                  stroke="var(--color-primary-light)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M33 15v8M29 19h8"
                  stroke="var(--color-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </motion.div>
            <div className="text-center">
              <p
                className="font-bold text-sm"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                }}
              >
                {isEditMode
                  ? "Images are locked in edit mode"
                  : "Drop images here or click to browse"}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {images.length} added · JPG, PNG, WEBP · Min 1 image
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              disabled={isEditMode} // 🔒 important
              onChange={(e) => addFiles(e.target.files)}
            />
          </motion.div>

          {/* Preview grid */}
          <AnimatePresence>
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <ImagePreviewGrid
                  images={images}
                  onRemove={isEditMode ? null : removeImage}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Offline notice */}
          <AnimatePresence>
            {!isOnline && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl text-sm"
                style={{
                  background: "rgba(247,201,72,0.1)",
                  border: "1px solid rgba(247,201,72,0.35)",
                  color: "var(--color-text-secondary)",
                }}
              >
                <span className="text-lg flex-shrink-0 leading-none">📵</span>
                <span className="text-xs leading-relaxed">
                  You're offline. Your submission will be saved locally and
                  automatically synced when your connection is restored.
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {submitError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-xs text-center px-4 py-3 rounded-xl"
                style={{
                  color: "var(--color-error)",
                  background: "rgba(201,42,42,0.07)",
                  border: "1px solid rgba(201,42,42,0.2)",
                }}
              >
                {submitError}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onBack}
              disabled={submitting}
              className="h-12 px-5 rounded-xl font-bold text-sm uppercase tracking-wider flex-shrink-0"
              style={{
                fontFamily: "var(--font-display)",
                background: "transparent",
                border: "1.5px solid var(--color-border-strong)",
                color: "var(--color-text-secondary)",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              ← Back
            </motion.button>

            <motion.button
              type="submit"
              whileHover={canSubmit ? { scale: 1.02, y: -1 } : {}}
              whileTap={canSubmit ? { scale: 0.98 } : {}}
              disabled={!canSubmit}
              className="h-12 flex-1 rounded-xl font-bold text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-opacity"
              style={{
                fontFamily: "var(--font-display)",
                background: canSubmit
                  ? "var(--color-primary)"
                  : "var(--color-text-muted)",
                boxShadow: canSubmit
                  ? "0 4px 16px rgba(232,66,10,0.28)"
                  : "none",
                cursor: canSubmit ? "pointer" : "not-allowed",
              }}
            >
              {submitting ? (
                <>
                  <motion.span
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.7,
                      ease: "linear",
                    }}
                  />
                  Submitting…
                </>
              ) : isEditMode ? (
                <>Update & Resubmit</>
              ) : isOnline ? (
                <>
                  Submit <span className="text-lg leading-none">→</span>
                </>
              ) : (
                <>Save Offline 💾</>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}
