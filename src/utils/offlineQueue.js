// Single owner of the vendor offline queue in localStorage.
// Item shape: { id, code, geoLocation, timestamp, imageCount, imageIds, status, error }
//   status: "ready" (waiting to upload) | "failed" (server rejected — user must edit)
// Image blobs are stored separately in IndexedDB under item.imageIds.
const KEY = "vendor_offline_queue";

export function readQueue() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

// Read-modify-write against the *current* stored queue, so items added
// while a sync is running are never overwritten by a stale snapshot.
export function updateQueue(fn) {
  const next = fn(readQueue());
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export const enqueue = (item) => updateQueue((q) => [...q, item]);
export const removeFromQueue = (id) => updateQueue((q) => q.filter((i) => i.id !== id));
export const patchQueueItem = (id, patch) =>
  updateQueue((q) => q.map((i) => (i.id === id ? { ...i, ...patch } : i)));
