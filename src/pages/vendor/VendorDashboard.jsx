import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import UploadForm from "../../components/features/vendor/UploadForm";
import SubmissionList from "../../components/features/vendor/SubmissionList";
import { uploadVendorImages, getVendorRecords } from "../../api/vendorApi";
import { getImages, deleteImages } from "../../utils/indexedDB";
import { getPrompt } from "../../utils/pwaPrompt";
import AddImagesModal from "../../components/features/vendor/AddImagesModal";
const STEPS = ["campaign", "upload"];

const isIos = () =>
  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const isInStandaloneMode = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const IOS_PROMPT_KEY = "ios_install_seen";
const IOS_LAST_SHOWN = "ios_install_last";

const shouldShowIOSInstall = () => {
  if (!isIos()) return false;
  if (isInStandaloneMode()) return false;

  const hasSeen = localStorage.getItem(IOS_PROMPT_KEY);
  const lastShown = localStorage.getItem(IOS_LAST_SHOWN);

  // ❌ user dismissed permanently
  if (hasSeen === "true") return false;

  // ⏱️ show again after 3 days if not dismissed
  if (lastShown) {
    const diff = Date.now() - Number(lastShown);
    const threeDays = 3 * 24 * 60 * 60 * 1000;

    if (diff < threeDays) return false;
  }

  return true;
};

export default function VendorDashboard() {
  const [step, setStep] = useState("records");
  const [direction, setDirection] = useState(1);
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
  const [showIOSInstall, setShowIOSInstall] = useState(false);
  const [addImageRecord, setAddImageRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const goToStep = (nextStep) => {
    if (step === "records" && nextStep === "upload") return;

    const order = ["campaign", "upload", "records"];
    const currentIndex = order.indexOf(step);
    const nextIndex = order.indexOf(nextStep);

    setDirection(nextIndex > currentIndex ? 1 : -1);
    setStep(nextStep);
  };

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
    const interval = setInterval(() => {
      const prompt = getPrompt();
      if (prompt) {
        setDeferredPrompt(prompt);
        setShowInstall(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /* ── Sync offline queue when back online ── */

  const syncOfflineQueue = useCallback(async () => {
    if (syncingNow) {
      console.log("⛔ Sync already running, skipping...");
      return;
    }

    const queue = JSON.parse(
      localStorage.getItem("vendor_offline_queue") || "[]",
    );

    console.log("🔄 SYNC START, queue snapshot:", queue);

    if (!queue.length) return;

    setSyncingNow(true);
    setPendingSync(true);

    const updatedQueue = [...queue]; // 🔥 clone safely
    const remaining = [];

    // 🔥 mark all "ready" → "syncing" BEFORE processing
    for (let i = 0; i < updatedQueue.length; i++) {
      if (updatedQueue[i].status === "ready") {
        updatedQueue[i] = {
          ...updatedQueue[i],
          status: "syncing",
        };
      }
    }

    // 🔥 persist immediately (VERY IMPORTANT)
    localStorage.setItem("vendor_offline_queue", JSON.stringify(updatedQueue));

    for (const item of updatedQueue) {
      if (item.status !== "syncing") {
        remaining.push(item);
        continue;
      }

      try {
        const images = await getImages(item.imageIds);

        const res = await uploadVendorImages({
          code: item.code,
          geoLocation: item.geoLocation,
          images,
        });

        // ❌ INVALID CODE
        if (!res?.Status) {
          remaining.push({
            ...item,
            status: "failed",
            error: res?.Message || "Invalid Code",
          });
          continue;
        }

        // ✅ SUCCESS → DELETE COMPLETELY
        await deleteImages(item.imageIds);

        // 🔥 track success
        setSyncedIds((prev) =>
          prev.includes(item.id) ? prev : [...prev, item.id],
        );
      } catch (err) {
        console.error("❌ FULL ERROR:", err);

        const serverMessage =
          err?.response?.data?.Message || err?.response?.data?.message;

        if (serverMessage) {
          remaining.push({
            ...item,
            status: "failed",
            error: serverMessage,
          });
        } else {
          remaining.push({
            ...item,
            status: "ready",
            error: "No Internet Connection",
          });
        }
      }
    }

    console.log("📦 Remaining queue after sync:", remaining);

    localStorage.setItem("vendor_offline_queue", JSON.stringify(remaining));

    setPendingSync(remaining.length > 0);
    setSyncingNow(false);

    // 🔥 UI refresh AFTER everything
    setRefreshKey((prev) => prev + 1);
  }, [syncingNow]);

  const handleCampaign = (e) => {
    e.preventDefault();
    if (!campaignCode.trim()) {
      setCampaignError("Graffiti code is required.");
      return;
    }
    setCampaignError("");
    goToStep("upload");
  };

  const markAsReady = async (record) => {
    console.log("🟢 markAsReady received record:", record);

    const queue = JSON.parse(
      localStorage.getItem("vendor_offline_queue") || "[]",
    );

    console.log("📦 Queue BEFORE update:", queue);
    const updated = queue.map((item) =>
      item.id === record.ID
        ? {
            ...item,
            code: record.code,
            status: "ready",
            error: null,
            geoLocation: record.Location || record.geoLocation,
          }
        : item,
    );

    console.log("📦 Queue AFTER update:", updated);

    localStorage.setItem("vendor_offline_queue", JSON.stringify(updated));

    console.log("🚀 Calling syncOfflineQueue now...");
    await syncOfflineQueue();

    setRefreshKey((prev) => prev + 1);
  };

  const stepLabels = ["Graffiti", "Upload"];
  const stepIndex = step === "campaign" ? 0 : step === "upload" ? 1 : -1;

  useEffect(() => {
    if (shouldShowIOSInstall()) {
      setShowIOSInstall(true);
      localStorage.setItem(IOS_LAST_SHOWN, Date.now().toString());
    }
  }, []);

  // ======================  Records  ==============================

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getVendorRecords();

      if (data?.Status && Array.isArray(data.Records)) {
        setRecords(data.Records);

        localStorage.setItem(
          "vendor_records_cache",
          JSON.stringify(data.Records),
        );
      }
    } catch (err) {
      const cached = localStorage.getItem("vendor_records_cache");

      if (cached) {
        setRecords(JSON.parse(cached));
      } else {
        setError("No offline data available.");
      }
    } finally {
      setLoading(false);
    }
  };

  const pageVariants = {
    initial: (direction) => ({
      x: direction > 0 ? 80 : -80,
      opacity: 0,
      filter: "blur(6px)",
    }),

    animate: {
      x: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      },
    },

    exit: (direction) => ({
      x: direction > 0 ? -80 : 80,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        duration: 0.25,
      },
    }),
  };
  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <AnimatePresence>
        {(showInstall || showIOSInstall) && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-4 left-0 right-0 z-50 flex justify-center px-2"
          >
            <div
              className="rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.92)",
                borderColor: "var(--color-border)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(232,66,10,0.10)",
              }}
            >
              {/* Top accent bar */}
              <div
                className="h-1 w-full"
                style={{
                  background:
                    "linear-gradient(90deg, var(--color-primary), var(--color-accent))",
                }}
              />

              <div className="px-4 pt-3 pb-4 flex flex-col gap-3">
                {/* Title row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-sm"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-primary), var(--color-accent))",
                      }}
                    >
                      📲
                    </div>
                    <div>
                      <p
                        className="text-sm font-bold leading-tight"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--color-secondary)",
                        }}
                      >
                        Install App
                      </p>
                      <p
                        className="text-[11px] leading-tight"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Add to your home screen
                      </p>
                    </div>
                  </div>

                  {/* Dismiss X */}
                  <button
                    onClick={() => {
                      setShowInstall(false);
                      setShowIOSInstall(false);
                    }}
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs transition-colors"
                    style={{
                      color: "var(--color-text-muted)",
                      background: "var(--color-bg-secondary)",
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* Description */}
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  Get faster access and offline support by installing this app
                  on your device.
                </p>

                {/* ACTIONS — Android/Desktop */}
                {!isIos() && deferredPrompt && (
                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        deferredPrompt.prompt();
                        await deferredPrompt.userChoice;
                        setShowInstall(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
                      style={{
                        background: "var(--color-primary)",
                        fontFamily: "var(--font-display)",
                        boxShadow: "0 4px 12px rgba(232,66,10,0.28)",
                      }}
                    >
                      Install Now
                    </motion.button>

                    <button
                      onClick={() => setShowInstall(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold border"
                      style={{
                        color: "var(--color-text-muted)",
                        borderColor: "var(--color-border-strong)",
                        background: "var(--color-bg)",
                      }}
                    >
                      Later
                    </button>
                  </div>
                )}

                {/* iOS Instructions */}
                {isIos() && !isInStandaloneMode() && showIOSInstall && (
                  <>
                    <div
                      className="text-xs text-center leading-relaxed py-2 px-3 rounded-xl"
                      style={{
                        background: "var(--color-bg-secondary)",
                        color: "var(--color-text-secondary)",
                      }}
                    >
                      Tap <b>Share</b> 📤 then <b>Add to Home Screen</b> ＋
                    </div>

                    <button
                      onClick={() => {
                        localStorage.setItem(IOS_PROMPT_KEY, "true");
                        setShowIOSInstall(false);
                      }}
                      className="text-[11px] text-center font-semibold uppercase tracking-wider"
                      style={{
                        color: "var(--color-text-muted)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      Got it
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================  Header ================================= */}
      <div className="flex items-center justify-between px-4 pt-6">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-primary)",
            }}
          >
            {step === "records" ? "My Submissions" : "Vendor Panel"}
          </p>

          <h2
            className="text-3xl font-black leading-none"
            style={{
              fontFamily: "var(--font-display)",
              color: "var(--color-secondary)",
            }}
          >
            {step === "records" && "Records"}
            {step === "campaign" && "Graffiti Code"}
            {step === "upload" && "Upload Images"}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* 🔄 Refresh ONLY for records */}
          {step === "records" && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={fetchRecords}
              disabled={loading}
              className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border"
              style={{
                fontFamily: "var(--font-display)",
                color: "var(--color-text-secondary)",
                borderColor: "var(--color-border-strong)",
                background: "var(--color-bg-card)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              <motion.span
                animate={loading ? { rotate: 360 } : {}}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
              >
                ↻
              </motion.span>
              Refresh
            </motion.button>
          )}

          {/* ➕ New submission */}
          {step === "records" && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => {
                setCampaignCode("");
                setEditingRecord(null);
                goToStep("campaign");
              }}
              className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
              style={{
                fontFamily: "var(--font-display)",
                background: "var(--color-primary)",
                boxShadow: "0 4px 12px rgba(232,66,10,0.25)",
              }}
            >
              + New
            </motion.button>
          )}
          {step !== "records" && (
            <motion.button
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => {
                setCampaignCode("");
                setEditingRecord(null);
                goToStep("records");
              }}
              className="h-9 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white"
              style={{
                fontFamily: "var(--font-display)",
                background: "var(--color-primary)",
                boxShadow: "0 4px 12px rgba(232,66,10,0.25)",
              }}
            >
              Records
            </motion.button>
          )}
        </div>
      </div>
      {/* ===================================================================== */}

      {/* ── Step indicator ── */}
      {(step === "campaign" || step === "upload") && (
        <div className="flex justify-center pt-8 pb-0 px-4">
          <div className="flex items-center">
            {stepLabels.map((label, i) => {
              const active = stepIndex >= i;
              const current = stepIndex === i;
              return (
                <div key={label} className="flex items-center">
                  <motion.div
                    className="flex items-center gap-2"
                    animate={{
                      opacity: active ? 1 : 0.35,
                      scale: current ? 1.1 : 1,
                    }}
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
                  {i < 1 && (
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
      )}

      {/* ── Main content ── */}

      <main className="flex justify-center px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          {/* STEP: CAMPAIGN */}
          {step === "campaign" && (
            <motion.div
              key="campaign"
              custom={direction}
              variants={pageVariants}
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
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: UPLOAD */}
          {step === "upload" && (
            <motion.div
              key="upload"
              custom={direction}
              variants={pageVariants}
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
                  goToStep("campaign");
                }}
                onSubmitted={async () => {
                  setEditingRecord(null);
                  goToStep("records");

                  // 🔥 run sync
                  await syncOfflineQueue();

                  // 🔥 fetch fresh records from server
                  await fetchRecords();

                  // 🔥 force UI refresh
                  setRefreshKey((prev) => prev + 1);
                }}
                editingRecord={editingRecord}
              />
            </motion.div>
          )}

          {/* STEP: RECORDS */}
          {step === "records" && (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-5xl"
            >
              <SubmissionList
                key={refreshKey}
                records={records}
                loading={loading}
                error={error}
                refreshKey={refreshKey}
                syncedIds={syncedIds}
                onNewSubmission={() => {
                  setEditingRecord(null);
                  setCampaignCode("");
                  goToStep("campaign");
                }}
                onEdit={(record) => {
                  setEditingRecord(record);
                  setCampaignCode(record.code);
                  goToStep("campaign");
                }}
                onSubmit={markAsReady}
                onAddImages={(record) => setAddImageRecord(record)}
              />
            </motion.div>
          )}

          {addImageRecord && (
            <AddImagesModal
              record={addImageRecord}
              onClose={() => setAddImageRecord(null)}
              onUploaded={() => {
                fetchRecords(); // refresh API data
              }}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
