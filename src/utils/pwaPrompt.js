// Android/desktop install prompt fires once, often before the vendor page mounts.
// Capture it globally and notify listeners instead of making them poll.
let deferredPrompt = null;
export const PWA_PROMPT_EVENT = "pwa-prompt-ready";

export const initPwaPromptListener = () => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.dispatchEvent(new Event(PWA_PROMPT_EVENT));
  });
};

export const getPrompt = () => deferredPrompt;

export const clearPrompt = () => {
  deferredPrompt = null;
};
