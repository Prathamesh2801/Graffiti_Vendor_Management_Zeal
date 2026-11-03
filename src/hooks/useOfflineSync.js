import { useState, useEffect, useRef, useCallback } from "react";
import { uploadVendorImages } from "../api/vendorApi";
import { getImages, deleteImages } from "../utils/indexedDB";
import { readQueue, removeFromQueue, patchQueueItem } from "../utils/offlineQueue";

/**
 * Vendor offline queue + network status.
 * Every submission (online or offline) goes into the queue first; sync() uploads
 * "ready" items one by one. Exposes `queue` as React state so the UI re-renders
 * without remount hacks.
 */
export function useOfflineSync() {
  const [queue, setQueue] = useState(readQueue);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  // A ref, not state: state is stale inside closures, so two callers
  // (online event + submit) could both start uploading the same items.
  // ponytail: per-tab lock only; two open tabs could still double-upload. Use navigator.locks if that matters.
  const lock = useRef(false);

  const refresh = useCallback(() => setQueue(readQueue()), []);

  /** Uploads all ready items. Resolves to the number uploaded successfully. */
  const sync = useCallback(async () => {
    if (lock.current) return 0;
    lock.current = true;
    setSyncing(true);
    let uploaded = 0;

    try {
      // "syncing" = legacy status from the old implementation; treat as ready.
      const pending = readQueue().filter((i) => i.status === "ready" || i.status === "syncing");

      for (const item of pending) {
        try {
          const images = await getImages(item.imageIds);
          const res = await uploadVendorImages({
            code: item.code,
            geoLocation: item.geoLocation,
            images,
          });

          if (res?.Status) {
            removeFromQueue(item.id);
            await deleteImages(item.imageIds);
            uploaded++;
          } else {
            patchQueueItem(item.id, { status: "failed", error: res?.Message || "Invalid Code" });
          }
        } catch (err) {
          const serverMessage = err?.response?.data?.Message || err?.response?.data?.message;
          if (serverMessage) {
            patchQueueItem(item.id, { status: "failed", error: serverMessage });
          } else {
            // Network failure: keep it ready and stop — the rest would fail too.
            patchQueueItem(item.id, { status: "ready", error: "No Internet Connection" });
            break;
          }
        }
        refresh();
      }
    } finally {
      lock.current = false;
      setSyncing(false);
      refresh();
    }
    return uploaded;
  }, [refresh]);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return { queue, isOnline, syncing, sync, refresh };
}
