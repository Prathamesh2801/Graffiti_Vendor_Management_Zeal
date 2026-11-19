// PWA install helpers shared by the dashboard banner, the login/register hint and the menu.
//
// Platform facts this is built around:
// - Chrome / Edge (Android AND desktop Windows/Mac) fire `beforeinstallprompt` (once, often before
//   React mounts) → we keep it and show our own "Install" button. The installed app shares the
//   browser's storage/login. Desktop browsers also show their own install icon in the address bar.
// - iPhone has no install API: the user must use Share → Add to Home Screen, and the
//   home-screen app gets SEPARATE storage from Safari (login + offline queue don't carry
//   over) → on iPhone we nudge installing *before* signing in.
// - In-app browsers (Instagram, Facebook, Android WebViews…) can't install at all.

let deferredPrompt = null;
export const PWA_PROMPT_EVENT = "pwa-prompt-ready"; // Android prompt captured
export const PWA_SHOW_EVENT = "pwa-install-show"; // "show the install card now" (menu / nudge)

const INSTALLED_KEY = "pwa_installed";
const NUDGED_KEY = "pwa_install_nudged";
export const BANNER_SNOOZE_KEY = "pwa_install_snooze_until";
export const AUTH_HINT_SNOOZE_KEY = "pwa_auth_hint_snooze_until";

export const initPwaPromptListener = () => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event(PWA_PROMPT_EVENT));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    localStorage.setItem(INSTALLED_KEY, "1");
  });
};

export const getPrompt = () => deferredPrompt;
export const clearPrompt = () => {
  deferredPrompt = null;
};

export const isIos = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPadOS reports "Mac"

export const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;

// ponytail: user-agent sniffing is best effort. WhatsApp opens links in Chrome Custom Tabs /
// SFSafariViewController, which look like the real browser and can't be detected.
export const isInAppBrowser = () =>
  /FBAN|FBAV|Instagram|Line\/|Snapchat|LinkedInApp|GSA\/|; wv\)/i.test(navigator.userAgent);

export const isInstalled = () => isStandalone() || localStorage.getItem(INSTALLED_KEY) === "1";

/** Which install help applies right now: "native" (browser install prompt: Android / desktop Chrome
 *  & Edge) | "ios" | "inapp" | null (nothing to offer, e.g. installed or Firefox desktop). */
export function installVariant() {
  if (isInstalled()) return null;
  if (isInAppBrowser()) return "inapp";
  if (isIos()) return "ios";
  return deferredPrompt ? "native" : null;
}

export const isSnoozed = (key) => Date.now() < Number(localStorage.getItem(key) || 0);
export const snooze = (key, days = 3) =>
  localStorage.setItem(key, String(Date.now() + days * 24 * 60 * 60 * 1000));

/** Ask the dashboard install card to open (ignores the snooze — the user asked). */
export const requestInstallPrompt = () => window.dispatchEvent(new Event(PWA_SHOW_EVENT));

/** One gentle reminder after the vendor's first saved submission — never repeated. */
export function nudgeInstallOnce() {
  if (localStorage.getItem(NUDGED_KEY) || !installVariant()) return;
  localStorage.setItem(NUDGED_KEY, "1");
  requestInstallPrompt();
}
