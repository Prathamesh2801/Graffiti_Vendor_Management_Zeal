import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import UploadForm from "../../components/features/vendor/UploadForm";
import SubmissionList from "../../components/features/vendor/SubmissionList";
import { uploadVendorImages } from "../../api/vendorApi";
import { getImages, deleteImages } from "../../utils/indexedDB";
import { getPrompt } from "../../utils/pwaPrompt";
const STEPS = ["campaign", "upload", "records"];

export default function VendorDashboard() {
  const [step, setStep] = useState("records");
  const [campaignCode, setCampaignCode] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(false);
  const [syncingNow, setSyncingNow] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [syncedIds, setSyncedIds] = useState([]);
  const { setVendorMeta } = useOutletContext();

  // Read user from localStorage (set by auth)
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const username = user?.username || "Vendor";

  useEffect(() => {
    setVendorMeta({
      isOnline,
      pendingSync,
      syncingNow,
    });
  }, [isOnline, pendingSync, syncingNow]);

  /* ── Network detection ── */
  useEffect(() => {
    const goOnline = async () => {
      setIsOnline(true);

      await syncOfflineQueue();

      // 🔥 trigger UI refresh
      setRefreshKey((prev) => prev + 1);
    };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      syncOfflineQueue();
    }
  }, [isOnline]);

  useEffect(() => {
    const queue = JSON.parse(
      localStorage.getItem("vendor_offline_queue") || "[]",
    );
    if (queue.length > 0) setPendingSync(true);
  }, []);

  // ===============  PWA Setup ========================

  useEffect(() => {
    const prompt = getPrompt();
    if (prompt) {
      setDeferredPrompt(prompt);
      setShowInstall(true);
    }
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  /* ── Sync offline queue when back online ── */

  const syncOfflineQueue = useCallback(async () => {
    const queue = JSON.parse(
      localStorage.getItem("vendor_offline_queue") || "[]",
    );

    console.log("🔄 SYNC START, queue snapshot:", queue);

    if (!queue.length) return;

    setSyncingNow(true);
    setPendingSync(true);

    const remaining = [];

    for (const item of queue) {
      console.log("🔄 SYNC ITEM:", item);

      if (item.status !== "ready") {
        console.log("⏭️ Skipping (not ready):", item);
        remaining.push(item);
        continue;
      }

      try {
        const images = await getImages(item.imageIds);

        console.log("🚀 API PAYLOAD:", {
          code: item.code,
          geoLocation: item.geoLocation,
          imageIds: item.imageIds,
          imageCount: images?.length,
        });

        const res = await uploadVendorImages({
          code: item.code,
          geoLocation: item.geoLocation,
          images,
        });

        console.log("✅ API RESPONSE:", res);

        // 🔥 CRITICAL CHECK
        if (!res?.Status) {
          console.error("❌ API LOGICAL ERROR:", res?.Message);

          // keep in queue
          remaining.push({
            ...item,
            error: res?.Message || "Invalid Code",
            status: "failed", // 🔥 NEW STATE
          });

          continue; // 🚨 STOP further execution
        }

        await deleteImages(item.imageIds);
        console.log("🧹 Deleted IndexedDB images for:", item.id);
      } catch (err) {
        console.error("❌ NETWORK ERROR:", err.message);

        remaining.push({
          ...item,
          status: "ready", // 🔥 still ready (retry later)
          error: "No Internet Connection",
        });
      }
    }

    console.log("📦 Remaining queue after sync:", remaining);

    localStorage.setItem("vendor_offline_queue", JSON.stringify(remaining));
    setPendingSync(remaining.length > 0);
    setSyncingNow(false);
  }, []);
  const handleCampaign = (e) => {
    e.preventDefault();
    if (!campaignCode.trim()) {
      setCampaignError("Graffiti code is required.");
      return;
    }
    setCampaignError("");
    setStep("upload");
  };

  const markAsReady = async (record) => {
    console.log("🟢 markAsReady received record:", record);

    const queue = JSON.parse(
      localStorage.getItem("vendor_offline_queue") || "[]",
    );

    console.log("📦 Queue BEFORE update:", queue);

    const updated = queue.map((item) =>
      item.id === record.ID
        ? { ...item, status: "ready", error: "null" }
        : item,
    );

    console.log("📦 Queue AFTER update:", updated);

    localStorage.setItem("vendor_offline_queue", JSON.stringify(updated));

    console.log("🚀 Calling syncOfflineQueue now...");
    await syncOfflineQueue();

    setRefreshKey((prev) => prev + 1);
  };

  const stepLabels = ["Graffiti", "Upload", "Records"];
  const stepIndex = STEPS.indexOf(step);

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      {showInstall && (
        <div className="flex justify-center px-4 pt-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <span className="text-sm font-semibold">
              Install app for better offline experience
            </span>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  await deferredPrompt.userChoice;
                  setShowInstall(false);
                }
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-lg text-white"
              style={{
                background: "var(--color-primary)",
              }}
            >
              Install
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* ── Step indicator ── */}
      <div className="flex justify-center pt-8 pb-0 px-4">
        <div className="flex items-center">
          {stepLabels.map((label, i) => {
            const active = stepIndex >= i;
            const current = stepIndex === i;
            return (
              <div key={label} className="flex items-center">
                <motion.div
                  className="flex items-center gap-2"
                  animate={{ opacity: active ? 1 : 0.35 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
                    style={
                      active
                        ? {
                            background: "var(--color-primary)",
                            color: "#fff",
                            fontFamily: "var(--font-display)",
                            boxShadow: current
                              ? "0 0 0 4px rgba(232,66,10,0.18)"
                              : "none",
                          }
                        : {
                            background: "var(--color-bg-secondary)",
                            color: "var(--color-text-muted)",
                            border: "1.5px solid var(--color-border-strong)",
                            fontFamily: "var(--font-display)",
                          }
                    }
                  >
                    {stepIndex > i ? "✓" : i + 1}
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-widest hidden sm:block"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: active
                        ? "var(--color-text-primary)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {label}
                  </span>
                </motion.div>
                {i < 2 && (
                  <div
                    className="mx-3 h-0.5 w-10 rounded-full transition-all duration-500"
                    style={{
                      background:
                        stepIndex > i
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main content ── */}
      <main className="flex justify-center px-4 py-8">
        <AnimatePresence mode="wait">
          {/* STEP: CAMPAIGN */}
          {step === "campaign" && (
            <motion.div
              key="campaign"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md"
            >
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
                    Step 1 of 2
                  </p>
                  <h1
                    className="text-4xl font-black leading-none mb-3"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--color-secondary)",
                    }}
                  >
                    Graffiti Code
                  </h1>
                  <p
                    className="text-sm leading-relaxed mb-8"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    Enter the graffiti code provided by your coordinator to
                    begin your wall image submission.
                  </p>

                  <form
                    onSubmit={handleCampaign}
                    className="flex flex-col gap-5"
                  >
                    <div className="flex flex-col gap-2">
                      <label
                        className="text-xs font-bold uppercase tracking-widest"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Graffiti Code
                      </label>
                      <input
                        className="h-12 px-4 rounded-xl text-sm outline-none transition-all duration-200 font-medium w-full"
                        style={{
                          background: "var(--color-bg)",
                          border: "1.5px solid var(--color-border-strong)",
                          color: "var(--color-text-primary)",
                          fontFamily: "var(--font-body)",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "var(--color-primary)";
                          e.target.style.boxShadow =
                            "0 0 0 3px rgba(232,66,10,0.1)";
                          e.target.style.background = "#fff";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor =
                            "var(--color-border-strong)";
                          e.target.style.boxShadow = "none";
                          e.target.style.background = "var(--color-bg)";
                        }}
                        type="text"
                        value={campaignCode}
                        onChange={(e) => setCampaignCode(e.target.value)}
                        autoFocus
                      />
                      <AnimatePresence>
                        {campaignError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs"
                            style={{ color: "var(--color-error)" }}
                          >
                            {campaignError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="h-12 rounded-xl text-sm uppercase tracking-widest text-white flex items-center justify-center gap-2 font-bold w-full"
                      style={{
                        background: "var(--color-primary)",
                        boxShadow: "0 4px 16px rgba(232,66,10,0.28)",
                        fontFamily: "var(--font-display)",
                      }}
                      type="submit"
                    >
                      Continue <span className="text-lg leading-none">→</span>
                    </motion.button>

                    <button
                      type="button"
                      onClick={() => setStep("records")}
                      className="text-sm font-semibold underline underline-offset-4 text-center"
                      style={{
                        color: "var(--color-text-muted)",
                        fontFamily: "var(--font-body)",
                      }}
                    >
                      View past submissions instead
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: UPLOAD */}
          {step === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-lg"
            >
              <UploadForm
                campaignCode={campaignCode}
                isOnline={isOnline}
                onBack={() => {
                  setEditingRecord(null);
                  setStep("campaign");
                }}
                onSubmitted={() => {
                  setEditingRecord(null);
                  setStep("records");
                }}
                editingRecord={editingRecord}
              />
            </motion.div>
          )}

          {/* STEP: RECORDS */}
          {step === "records" && (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-5xl"
            >
              <SubmissionList
                key={refreshKey}
                refreshKey={refreshKey}
                syncedIds={syncedIds}
                onNewSubmission={() => {
                  setEditingRecord(null);
                  setCampaignCode("");
                  setStep("campaign");
                }}
                onEdit={(record) => {
                  setEditingRecord(record);
                  setCampaignCode(record.code);
                  setStep("campaign");
                }}
                onSubmit={markAsReady}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
