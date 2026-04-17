export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const reg = await navigator.serviceWorker.ready;

    try {
      await reg.sync.register('sync-vendor-data');
      console.log('Background sync registered');
    } catch (err) {
      console.log('Background sync failed', err);
    }
  }
}