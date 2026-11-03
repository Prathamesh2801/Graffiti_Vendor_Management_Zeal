// Offline image blobs, keyed by submission id. Queue metadata lives in offlineQueue.js.
const DB_NAME = "vendorDB";
const STORE_NAME = "images";

let dbPromise;
function openDB() {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = undefined; // allow retry
      reject(request.error);
    };
  });
  return dbPromise;
}

// Resolves when the transaction has committed (not just been queued).
async function run(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const req = fn(tx.objectStore(STORE_NAME));
    tx.oncomplete = () => resolve(req.result);
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

export const saveImages = (id, files) => run("readwrite", (s) => s.put(files, id));
export const getImages = async (id) => (await run("readonly", (s) => s.get(id))) || [];
export const deleteImages = (id) => run("readwrite", (s) => s.delete(id));
