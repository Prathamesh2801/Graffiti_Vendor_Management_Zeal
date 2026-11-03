import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPrompt, clearPrompt, PWA_PROMPT_EVENT } from "../../../utils/pwaPrompt";

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

// "Add to home screen" banner: native prompt on Android/desktop, instructions on iOS.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(getPrompt);
  const [showInstall, setShowInstall] = useState(() => !!getPrompt());
  const [showIOSInstall, setShowIOSInstall] = useState(shouldShowIOSInstall);

  useEffect(() => {
    const onReady = () => {
      setDeferredPrompt(getPrompt());
      setShowInstall(true);
    };
    window.addEventListener(PWA_PROMPT_EVENT, onReady);
    return () => window.removeEventListener(PWA_PROMPT_EVENT, onReady);
  }, []);

  useEffect(() => {
    if (showIOSInstall) localStorage.setItem(IOS_LAST_SHOWN, Date.now().toString());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- record "shown" once, on mount

  return (
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
                      clearPrompt(); // a prompt can only be used once
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
  );
}
