// sw.js  v3
const CACHE_NAME = 'skincare-v3-' + Date.now();
const STATIC_ASSETS = [
  './',
  './index.html',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest'
];

// 立刻接管，避免旧 SW 持续占用
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(STATIC_ASSETS).catch(()=>{}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// 对 index.html 和 app.js 走“网络优先”，其他静态资源走“缓存优先”
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin && (url.pathname.endsWith('/index.html') || url.pathname.endsWith('/app.js'))) {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(event.request, { cache: 'no-store' });
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, fresh.clone());
          return fresh;
        } catch (e) {
          const cached = await caches.match(event.request);
          return cached || new Response('offline', { status: 503 });
        }
      })()
    );
    return;
  }

  // 其他资源：缓存优先，网络兜底
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const res = await fetch(event.request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(event.request, res.clone());
        return res;
      } catch (e) {
        return new Response('offline', { status: 503 });
      }
    })()
  );
});
