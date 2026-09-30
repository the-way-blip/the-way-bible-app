// Upgrade only the obsolete HTTP cache. Keep offline chapters and IndexedDB intact.
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.delete("supabase-api"));
});
