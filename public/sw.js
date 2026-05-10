// Minimal service worker for PWA installability + light caching of static assets.
// We never cache API responses (auth, leads, pitches) — those must always be fresh.

const CACHE_VERSION = 'leadhawk-v3'
const STATIC_CACHE = `${CACHE_VERSION}-static`

self.addEventListener('install', (event) => {
  // Pre-cache the home + offline shell so install is non-trivial
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(['/', '/app', '/logo-icon.png', '/favicon.ico']).catch(() => {})
    )
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Never intercept non-GET, API routes, auth callbacks, or cross-origin
  if (req.method !== 'GET') return
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/auth/')) return
  if (url.pathname.startsWith('/_next/data/')) return

  // Network-first for Next.js static chunks. Cache-first would serve stale
  // Turbopack bundles (stable filenames, changing content) after a dev restart.
  // In production, content-hashed filenames make network-first safe too.
  if (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/_next/dev/')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          caches.open(STATIC_CACHE).then((c) => c.put(req, clone))
          return res
        })
        .catch(() => caches.match(req))
    )
    return
  }

  // Network-only for HTML — never cache pages, otherwise stale HTML keeps
  // requesting CSS/JS bundle hashes that no longer exist after a deploy.
  // (Static assets remain cached above for offline-friendliness.)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req).catch(() => caches.match('/') || caches.match('/app'))
    )
  }
})
