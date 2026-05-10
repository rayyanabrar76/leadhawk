// Minimal service worker for PWA installability + light caching of static assets.
// We never cache API responses (auth, leads, pitches) — those must always be fresh.

const CACHE_VERSION = 'leadhawk-v1'
const STATIC_CACHE = `${CACHE_VERSION}-static`

self.addEventListener('install', (event) => {
  // Pre-cache the home + offline shell so install is non-trivial
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(['/', '/logo-icon.png', '/favicon.ico']).catch(() => {})
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

  // Cache-first for hashed Next.js static assets (immutable)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            const clone = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(req, clone))
            return res
          })
      )
    )
    return
  }

  // Network-first for HTML pages — fall back to cache when offline
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone()
          caches.open(STATIC_CACHE).then((c) => c.put(req, clone))
          return res
        })
        .catch(() => caches.match(req).then((m) => m ?? caches.match('/')))
    )
  }
})
