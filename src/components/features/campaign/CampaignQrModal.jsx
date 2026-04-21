import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "qrcode";
import { FRONTEND_BASE_URL } from "../../../../config";

function buildGeoUrl(campaignId) {
  return `${FRONTEND_BASE_URL}/#/geo?Campaign_ID=${campaignId}`;
}

export default function CampaignQrModal({ campaign, onClose }) {
  const canvasRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const geoUrl = buildGeoUrl(campaign.id);

  // ── Draw QR onto canvas ──────────────────────────────────────────────────
  const drawQr = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      await QRCode.toCanvas(canvasRef.current, geoUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: "#1a1a2e",
          light: "#f9f7f4",
        },
        errorCorrectionLevel: "H",
      });
      setQrReady(true);
    } catch (err) {
      console.error("QR generation error:", err);
    }
  }, [geoUrl]);

  useEffect(() => {
    // Small delay so the modal animation settles before drawing
    const t = setTimeout(drawQr, 80);
    return () => clearTimeout(t);
  }, [drawQr]);

  // ── Keyboard close ───────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // ── Copy URL ─────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(geoUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* fallback: select input */
    }
  };

  // ── Download PNG ─────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!canvasRef.current || !qrReady) return;

    // Draw onto a larger canvas with padding + branding
    const size = 360;
    const padding = 40;
    const labelHeight = 64;
    const totalH = size + padding * 2 + labelHeight;

    const offscreen = document.createElement("canvas");
    offscreen.width = size + padding * 2;
    offscreen.height = totalH;
    const ctx = offscreen.getContext("2d");

    // Background
    ctx.fillStyle = "#f9f7f4";
    ctx.fillRect(0, 0, offscreen.width, totalH);

    // Subtle border radius effect via shadow
    ctx.shadowColor = "rgba(26,26,46,0.12)";
    ctx.shadowBlur = 24;

    // QR image centered
    ctx.drawImage(canvasRef.current, padding, padding, size, size);
    ctx.shadowBlur = 0;

    // Divider
    ctx.fillStyle = "rgba(26,26,46,0.08)";
    ctx.fillRect(padding, size + padding + 8, size, 1);

    // Campaign name label
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 15px monospace";
    ctx.textAlign = "center";
    ctx.fillText(campaign.name, offscreen.width / 2, size + padding + 32);

    // Campaign ID label
    ctx.fillStyle = "rgba(26,26,46,0.45)";
    ctx.font = "11px monospace";
    ctx.fillText(campaign.id, offscreen.width / 2, size + padding + 52);

    offscreen.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `QR_${campaign.name.replace(/\s+/g, "_")}_${campaign.id}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    });
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 z-[300] flex items-center justify-center p-4"
        style={{
          background: "rgba(26,26,46,0.72)",
          backdropFilter: "blur(6px)",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* Modal panel */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 24, stiffness: 300 }}
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            boxShadow: "0 24px 64px rgba(26,26,46,0.28)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent strip */}
          <div
            className="h-1 w-full"
            style={{
              background:
                "linear-gradient(90deg, var(--color-primary), var(--color-complement, #6c63ff))",
            }}
          />

          {/* Header */}
          <div
            className="flex items-start justify-between px-5 pt-5 pb-4"
            style={{ borderBottom: "1px solid var(--color-border)" }}
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-md"
                  style={{
                    background: "rgba(232,66,10,0.1)",
                    color: "var(--color-primary)",
                    border: "1px solid rgba(232,66,10,0.22)",
                  }}
                >
                  QR Code
                </span>
              </div>
              <h3
                className="font-bold text-lg uppercase tracking-wide leading-tight mt-1"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--color-text-primary)",
                }}
              >
                {campaign.name}
              </h3>
              <p
                className="text-[11px] font-mono mt-0.5"
                style={{ color: "var(--color-text-muted)" }}
              >
                {campaign.id}
              </p>
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all cursor-pointer flex-shrink-0 mt-0.5"
              style={{
                background: "var(--color-bg-secondary)",
                color: "var(--color-text-muted)",
                border: "1px solid var(--color-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--color-primary)";
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-bg-secondary)";
                e.currentTarget.style.color = "var(--color-text-muted)";
              }}
            >
              ✕
            </button>
          </div>

          {/* QR canvas area */}
          <div className="flex flex-col items-center px-5 py-6">
            {/* QR frame */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: qrReady ? 1 : 0.4, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="relative rounded-2xl p-3 shadow-inner"
              style={{
                background: "#f9f7f4",
                border: "2px solid var(--color-border)",
              }}
            >
              {/* Corner decorators */}
              {[
                "top-0 left-0",
                "top-0 right-0",
                "bottom-0 left-0",
                "bottom-0 right-0",
              ].map((pos, i) => (
                <span
                  key={i}
                  className={`absolute w-4 h-4 ${pos} m-1.5`}
                  style={{
                    borderColor: "var(--color-primary)",
                    borderStyle: "solid",
                    borderWidth:
                      i === 0
                        ? "2px 0 0 2px"
                        : i === 1
                          ? "2px 2px 0 0"
                          : i === 2
                            ? "0 0 2px 2px"
                            : "0 2px 2px 0",
                    borderRadius:
                      i === 0
                        ? "4px 0 0 0"
                        : i === 1
                          ? "0 4px 0 0"
                          : i === 2
                            ? "0 0 0 4px"
                            : "0 0 4px 0",
                  }}
                />
              ))}

              <canvas
                ref={canvasRef}
                style={{ display: "block", borderRadius: "8px" }}
              />

              {/* Scan overlay hint — fades out once ready */}
              {!qrReady && (
                <div
                  className="absolute inset-3 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(249,247,244,0.85)" }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="w-7 h-7 rounded-full border-2"
                    style={{
                      borderColor: "var(--color-border)",
                      borderTopColor: "var(--color-primary)",
                    }}
                  />
                </div>
              )}
            </motion.div>

            {/* Scan instruction */}
            <p
              className="text-[11px] mt-3 text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              Scan to open the Geo Viewer for this campaign
            </p>

            {/* URL copy row */}
            <div
              className="flex items-center gap-2 mt-4 w-full rounded-xl px-3 py-2.5"
              style={{
                background: "var(--color-bg-secondary)",
                border: "1px solid var(--color-border)",
              }}
            >
              <span
                className="flex-1 text-[11px] font-mono truncate"
                style={{ color: "var(--color-text-secondary)" }}
                title={geoUrl}
              >
                {geoUrl}
              </span>
              <button
                onClick={handleCopy}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex-shrink-0"
                style={{
                  background: copied
                    ? "rgba(39,174,96,0.12)"
                    : "var(--color-bg-card)",
                  color: copied
                    ? "var(--color-success)"
                    : "var(--color-text-secondary)",
                  borderColor: copied
                    ? "rgba(39,174,96,0.3)"
                    : "var(--color-border)",
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Footer actions */}
          <div
            className="flex gap-2.5 px-5 pb-5"
            style={{
              borderTop: "1px solid var(--color-border)",
              paddingTop: "1rem",
            }}
          >
            {/* Download QR */}
            <button
              onClick={handleDownload}
              disabled={!qrReady}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all cursor-pointer disabled:opacity-40"
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                borderColor: "var(--color-primary)",
              }}
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled)
                  e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              ⬇ Download PNG
            </button>

            {/* Open in new tab */}
            <a
              href={geoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all"
              style={{
                background: "var(--color-bg-secondary)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                textDecoration: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--color-primary)";
                e.currentTarget.style.color = "var(--color-primary)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--color-border)";
                e.currentTarget.style.color = "var(--color-text-secondary)";
              }}
            >
              📍 Open
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
