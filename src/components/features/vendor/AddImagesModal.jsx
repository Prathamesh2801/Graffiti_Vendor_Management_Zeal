import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  ImagePlus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Images,
} from "lucide-react";
import { addMoreImages } from "../../../api/vendorApi";

export default function AddImagesModal({ record, onClose, onUploaded }) {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef(null);

  const addFiles = useCallback((files) => {
    const valid = Array.from(files).filter((f) => f.type.startsWith("image/"));
    setImages((prev) => {
      const existingNames = new Set(prev.map((f) => f.name + f.size));
      return [
        ...prev,
        ...valid.filter((f) => !existingNames.has(f.name + f.size)),
      ];
    });
  }, []);

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  /* ── Drag handlers ── */
  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!images.length) return;
    setLoading(true);
    setStatus(null);
    setErrorMsg("");

    try {
      const res = await addMoreImages({ uniqueId: record.ID, images });
      if (!res?.Status) throw new Error(res?.Message || "Upload failed");

      setStatus("success");
      setTimeout(() => {
        onUploaded();
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || "Upload failed. Please try again.");
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        {/* Modal Card */}
        <motion.div
          key="modal"
          className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
          }}
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.97 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
        >
          {/* ── Header ── */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: "var(--color-border)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-primary) 14%, transparent)",
                }}
              >
                <Images size={17} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <h2
                  className="font-display font-bold text-base uppercase tracking-wide leading-none"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  Add Images
                </h2>
                <p
                  className="text-xs mt-0.5 font-body"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  ID:{" "}
                  <span
                    className="font-mono font-semibold"
                    style={{ color: "var(--color-primary)" }}
                  >
                    {record.ID}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-all hover:opacity-60"
              style={{ color: "var(--color-text-muted)" }}
              disabled={loading}
            >
              <X size={17} />
            </button>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5 space-y-4">
            {/* Drop Zone */}
            <motion.div
              className="relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden"
              style={{
                borderColor: isDragging
                  ? "var(--color-primary)"
                  : "var(--color-border)",
                background: isDragging
                  ? "color-mix(in srgb, var(--color-primary) 6%, transparent)"
                  : "var(--color-bg)",
              }}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              animate={{ scale: isDragging ? 1.01 : 1 }}
              transition={{ duration: 0.15 }}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
              <div className="flex flex-col items-center justify-center py-8 gap-3 pointer-events-none select-none">
                <motion.div
                  animate={{ y: isDragging ? -4 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background:
                      "color-mix(in srgb, var(--color-primary) 12%, transparent)",
                  }}
                >
                  <ImagePlus
                    size={22}
                    style={{ color: "var(--color-primary)" }}
                  />
                </motion.div>
                <div className="text-center">
                  <p
                    className="text-sm font-display font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {isDragging
                      ? "Drop to add images"
                      : "Drag & drop images here"}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    or{" "}
                    <span
                      className="font-semibold underline underline-offset-2"
                      style={{ color: "var(--color-primary)" }}
                    >
                      browse files
                    </span>{" "}
                    · PNG, JPG, JPEG
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Preview Grid */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-xs font-display font-semibold uppercase tracking-widest"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                      selected
                    </span>
                    <button
                      onClick={() => setImages([])}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:opacity-80"
                      style={{
                        color: "#ef4444",
                        background: "rgba(239,68,68,0.09)",
                      }}
                    >
                      <Trash2 size={11} /> Clear all
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                    <AnimatePresence>
                      {images.map((file, i) => (
                        <motion.div
                          key={file.name + file.size}
                          className="relative group rounded-xl overflow-hidden aspect-square"
                          style={{ border: "1px solid var(--color-border)" }}
                          initial={{ opacity: 0, scale: 0.85 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.18, delay: i * 0.03 }}
                          layout
                        >
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center">
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage(i);
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-white/90 shadow"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <X size={12} className="text-red-500" />
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Status feedback */}
            <AnimatePresence>
              {status === "success" && (
                <motion.div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-body"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    color: "#10b981",
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <CheckCircle2 size={16} />
                  <span className="font-semibold">
                    Images uploaded successfully!
                  </span>
                </motion.div>
              )}
              {status === "error" && (
                <motion.div
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-body"
                  style={{
                    background: "rgba(239,68,68,0.09)",
                    color: "#ef4444",
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <AlertCircle size={16} />
                  <span>{errorMsg}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div
            className="flex gap-3 px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider border transition-all hover:opacity-80 disabled:opacity-40"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                background: "transparent",
              }}
            >
              Cancel
            </button>

            <motion.button
              onClick={handleUpload}
              disabled={loading || !images.length || status === "success"}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-display font-semibold uppercase tracking-wider text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--color-primary)" }}
              whileHover={!loading && images.length ? { opacity: 0.9 } : {}}
              whileTap={!loading && images.length ? { scale: 0.98 } : {}}
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload {images.length > 0 ? `(${images.length})` : ""}
                </>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
