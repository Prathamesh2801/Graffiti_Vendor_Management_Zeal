let deferredPrompt = null;

export const initPwaPromptListener = () => {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log("🔥 PWA install prompt captured globally");
  });
};

export const getPrompt = () => deferredPrompt;

export const clearPrompt = () => {
  deferredPrompt = null;
};