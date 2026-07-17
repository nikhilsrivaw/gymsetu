/*
 * GymSetu service worker — minimal and deliberately conservative.
 *
 * Purpose: make the Android "install app" prompt fire reliably, and give the
 * shell a basic offline cache. It is NOT a full offline app.
 *
 * SAFETY (this runs on a live app people are using):
 *  - It ONLY ever caches content-hashed, immutable files (/_expo/*, /assets/*,
 *    /icons/*). Those can never go stale — a new build ships new filenames.
 *  - It NEVER caches navigations or index.html. index.html names the current
 *    bundle hash, so caching it would pin users to a deleted bundle and break
 *    every future deploy. Navigations always hit the network.
 *  - Cross-origin and non-GET requests pass straight through, untouched — the
 *    Supabase API is never intercepted.
 * Bump CACHE to invalidate old asset caches on a breaking change.
 */
const CACHE = 'gymsetu-assets-v1';
const IMMUTABLE = /\/(_expo|assets|icons)\//;

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Drop caches from older versions.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // never touch the API / cross-origin
  if (!IMMUTABLE.test(url.pathname)) return;             // navigations & everything else: normal network

  // Cache-first for immutable assets: instant repeat loads, safe because the
  // filename changes whenever the content does.
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req);
    if (hit) return hit;
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  })());
});
