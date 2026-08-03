const CACHE_NAME = 'haritham-v1';
const OFFLINE_URL = '/offline';

const PRECACHE_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Handle navigation requests (page loads)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedOfflinePage = await cache.match(OFFLINE_URL);
        if (cachedOfflinePage) {
          return cachedOfflinePage;
        }
        // Fallback HTML if cache match is unavailable
        return new Response(
          `<!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline — Haritham Garden</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; background: #FAF8F5; color: #1c382b; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; text-align: center; }
              .card { background: white; border-radius: 24px; padding: 32px; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); border: 1px solid #e7e5e4; }
              .icon { width: 64px; height: 64px; background: #1c382b; color: white; border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 32px; margin-bottom: 20px; }
              h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px 0; color: #1c382b; }
              p { font-size: 14px; color: #78716c; line-height: 1.6; margin: 0 0 24px 0; }
              button { background: #1c382b; color: white; border: none; border-radius: 9999px; padding: 12px 28px; font-size: 14px; font-weight: 600; cursor: pointer; transition: transform 0.1s; }
              button:active { transform: scale(0.96); }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">🌿</div>
              <h1>You're Offline</h1>
              <p>Check your internet connection to continue browsing nursery-fresh plants from Haritham Garden.</p>
              <button onclick="window.location.reload()">Retry Connection</button>
            </div>
          </body>
          </html>`,
          { headers: { 'Content-Type': 'text/html' } }
        );
      })
    );
    return;
  }

  // Network-first strategy for static assets
  event.respondWith(
    fetch(event.request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return cache.match(event.request);
    })
  );
});
