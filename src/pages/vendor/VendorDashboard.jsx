import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useOutletContext } from "react-router-dom";
import UploadForm from "../../components/features/vendor/UploadForm";
import SubmissionList from "../../components/features/vendor/SubmissionList";
import AddImagesModal from "../../components/features/vendor/AddImagesModal";
import InstallPrompt from "../../components/features/vendor/InstallPrompt";
import { getVendorRecords } from "../../api/vendorApi";
import { patchQueueItem } from "../../utils/offlineQueue";
import { useOfflineSync } from "../../hooks/useOfflineSync";

const RECORDS_CACHE_KEY = "vendor_records_cache";
const STEP_ORDER = ["campaign", "upload", "records"];
const stepLabels = ["Graffiti", "Upload"];

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
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    filter: "blur(4px)",
    transition: { duration: 0.25 },
  }),
};

// Vendor flow: records list → enter graffiti code → upload images.
// Offline queue + sync live in useOfflineSync; this component only orchestrates steps.
export default function VendorDashboard() {
  const [step, setStep] = useState("records");
  const [direction, setDirection] = useState(1);
  const [campaignCode, setCampaignCode] = useState("");
  const [campaignError, setCampaignError] = useState("");
  const [editingRecord, setEditingRecord] = useState(null);
  const [addImageRecord, setAddImageRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { setVendorMeta } = useOutletContext();
  const { queue, isOnline, syncing, sync, refresh } = useOfflineSync();

  const goToStep = (nextStep) => {
    if (step === "records" && nextStep === "upload") return;
    setDirection(STEP_ORDER.indexOf(nextStep) > STEP_ORDER.indexOf(step) ? 1 : -1);
    setStep(nextStep);
  };

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVendorRecords();
      if (data?.Status && Array.isArray(data.Records)) {
        setRecords(data.Records);
        localStorage.setItem(RECORDS_CACHE_KEY, JSON.stringify(data.Records));
      }
    } catch (err) {
      if (err.response?.status === 401) return; // AuthContext already logged us out
      const cached = localStorage.getItem(RECORDS_CACHE_KEY);
      if (cached) setRecords(JSON.parse(cached));
      else setError("No offline data available.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Upload whatever is queued, then pull fresh server records if anything went up.
  const syncAndRefresh = useCallback(async () => {
    if (await sync()) await fetchRecords();
  }, [sync, fetchRecords]);

  useEffect(() => {
    setVendorMeta({ isOnline, syncingNow: syncing });
  }, [isOnline, syncing, setVendorMeta]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Runs on mount (if online) and on every offline → online transition.
  useEffect(() => {
    if (isOnline) syncAndRefresh();
  }, [isOnline, syncAndRefresh]);

  const handleCampaign = (e) => {
    e.preventDefault();
    if (!campaignCode.trim()) {
      setCampaignError("Graffiti code is required.");
      return;
    }
    setCampaignError("");
    goToStep("upload");
  };

  // "Submit" on an offline card: mark ready again and try to upload.
  const markAsReady = async (record) => {
    patchQueueItem(record.ID, {
      code: record.code,
      status: "ready",
      error: null,
      geoLocation: record.Location || record.geoLocation,
    });
    refresh();
    await syncAndRefresh();
  };

  const stepIndex = step === "campaign" ? 0 : step === "upload" ? 1 : -1;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text-primary)",
        fontFamily: "var(--font-body)",
      }}
    >
      <InstallPrompt />

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
                  refresh();
                  await syncAndRefresh();
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
                records={records}
                queue={queue}
                loading={loading}
                error={error}
                onRetry={fetchRecords}
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
