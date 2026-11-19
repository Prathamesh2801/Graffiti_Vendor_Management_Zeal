import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, SquarePlus, Smartphone, X, Copy, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import {
  getPrompt,
  clearPrompt,
  installVariant,
  isSnoozed,
  snooze,
  BANNER_SNOOZE_KEY,
  AUTH_HINT_SNOOZE_KEY,
  PWA_PROMPT_EVENT,
  PWA_SHOW_EVENT,
} from "../../../utils/pwaPrompt";

// ─── Shared pieces ───────────────────────────────────────────────────────────

/** The 3 "Add to Home Screen" steps for iPhone / iPad. */
export function IosSteps() {
  const steps = [
    [<Share key="i" size={16} />, <>Tap <b>Share</b> in the browser toolbar</>],
    [<SquarePlus key="i" size={16} />, <>Scroll and choose <b>Add to Home Screen</b></>],
    [<span key="i" className="text-[11px] font-bold">Add</span>, <>Tap <b>Add</b>, then open the app from your Home Screen</>],
  ];
  return (
    <ol className="space-y-2">
      {steps.map(([icon, text], i) => (
        <li key={i} className="flex items-center gap-3 text-sm">
          <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-bg-surface text-primary">
            {icon}
          </span>
          <span className="text-text-secondary leading-snug">{text}</span>
        </li>
      ))}
    </ol>
  );
}

function CopyLinkButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href.split("#")[0]);
          toast.success("Link copied: paste it in Safari / Chrome");
        } catch {
          toast.error("Couldn't copy. Use the ⋯ menu → Open in browser");
        }
      }}
      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-[color:var(--color-border)] text-text-secondary bg-bg-card"
    >
      <Copy size={13} /> Copy link
    </button>
  );
}

const InAppText = () => (
  <p className="text-sm text-text-secondary leading-snug">
    This page is open inside another app (Instagram, Facebook…), which can't install apps or keep you
    signed in reliably. Tap the <b>⋯ / ⋮</b> menu → <b>Open in Safari / Chrome</b>.
  </p>
);

// ─── Bottom install card (inside the logged-in app, all roles) ───────────────
// Vendors: shows automatically unless snoozed ("Not now" = 3 days), never once installed,
// and once after the first submission. Admins/clients (mostly desktop): only on demand from
// the menu's "Install app"; it never pops up by itself for them.

export default function InstallPrompt({ vendor = true }) {
  const [prompt, setPrompt] = useState(getPrompt);
  const [open, setOpen] = useState(() => vendor && !!installVariant() && !isSnoozed(BANNER_SNOOZE_KEY));

  useEffect(() => {
    const onReady = () => {
      setPrompt(getPrompt());
      if (vendor && !isSnoozed(BANNER_SNOOZE_KEY)) setOpen(true);
    };
    const onShow = () => {
      setPrompt(getPrompt());
      if (installVariant()) setOpen(true);
    };
    const onInstalled = () => setOpen(false);
    window.addEventListener(PWA_PROMPT_EVENT, onReady);
    window.addEventListener(PWA_SHOW_EVENT, onShow);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener(PWA_PROMPT_EVENT, onReady);
      window.removeEventListener(PWA_SHOW_EVENT, onShow);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [vendor]);

  const variant = installVariant(); // re-evaluated each render (prompt state changes trigger it)
  const notNow = () => {
    snooze(BANNER_SNOOZE_KEY, 3);
    setOpen(false);
  };
  const installNative = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    clearPrompt(); // a captured prompt can only be used once
    setPrompt(null);
    if (outcome !== "accepted") snooze(BANNER_SNOOZE_KEY, 3);
    setOpen(false);
  };

  const title = { native: "Install the app", ios: "Add to your Home Screen", inapp: "Open in your browser" }[variant];

  return (
    <AnimatePresence>
      {open && variant && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 sm:p-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pointer-events-none"
          role="dialog"
          aria-label={title}
        >
          <div
            className="pointer-events-auto w-full max-w-md rounded-2xl bg-bg-card border border-[color:var(--color-border)] overflow-hidden"
            style={{ boxShadow: "0 12px 40px rgba(26,26,46,0.22)" }}
          >
            <div className="h-1" style={{ background: "linear-gradient(90deg, var(--color-primary), var(--color-accent))" }} />
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white bg-primary">
                  <Smartphone size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display text-base font-bold uppercase tracking-wide text-secondary leading-tight">
                    {title}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {variant === "inapp"
                      ? "Needed to install & work offline"
                      : vendor
                        ? "One-tap access · works offline · full screen"
                        : "Opens in its own window · one click from your taskbar / home screen"}
                  </p>
                </div>
                <button onClick={notNow} aria-label="Close" className="p-1.5 rounded-lg text-text-muted hover:bg-bg-surface">
                  <X size={16} />
                </button>
              </div>

              {variant === "ios" && (
                <>
                  <IosSteps />
                  <p className="text-xs text-text-muted">You'll sign in once inside the installed app.</p>
                </>
              )}
              {variant === "inapp" && <InAppText />}

              <div className="flex gap-2">
                {variant === "native" && (
                  <button
                    onClick={installNative}
                    className="flex-1 py-2.5 rounded-xl text-sm font-display font-bold uppercase tracking-wider text-white bg-primary hover:bg-primary-dark transition-colors"
                  >
                    Install
                  </button>
                )}
                {variant === "inapp" && <CopyLinkButton />}
                <button
                  onClick={notNow}
                  className={`${variant === "native" ? "" : "flex-1"} px-4 py-2.5 rounded-xl text-sm font-semibold border border-[color:var(--color-border)] text-text-secondary`}
                >
                  {variant === "ios" ? "Done" : "Not now"}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Login / Register hint ───────────────────────────────────────────────────
// Only where installing FIRST matters: iPhone Safari (the Home Screen app has its own
// storage, so signing in in Safari doesn't carry over) and in-app browsers. Android
// installs keep the Chrome login, so it gets the dashboard card instead.

export function AuthInstallHint() {
  const variant = installVariant();
  const [visible, setVisible] = useState(
    () => (variant === "ios" || variant === "inapp") && !isSnoozed(AUTH_HINT_SNOOZE_KEY),
  );
  const [expanded, setExpanded] = useState(false);
  if (!visible) return null;

  return (
    <div className="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-bg-card p-4 text-left">
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none">📲</span>
        <div className="flex-1 min-w-0">
          {variant === "ios" ? (
            <>
              <p className="text-sm font-semibold text-text-primary">On iPhone? Install the app first</p>
              <p className="text-xs text-text-secondary mt-0.5 leading-snug">
                Add it to your Home Screen, then sign in from there. Your login and offline work stay in
                the app.
              </p>
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
              >
                {expanded ? "Hide steps" : "Show me how"}
                <ChevronDown size={14} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
              </button>
              {expanded && (
                <div className="mt-3">
                  <IosSteps />
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-primary">Open this page in your browser</p>
              <div className="mt-1">
                <InAppText />
              </div>
              <div className="mt-2">
                <CopyLinkButton />
              </div>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={() => {
            snooze(AUTH_HINT_SNOOZE_KEY, 3);
            setVisible(false);
          }}
          className="p-1 rounded-lg text-text-muted hover:bg-bg-surface"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
