// /skincare-app/sw.js
const CACHE_NAME = "skincare-cache-v7";
const ASSETS = [
  "/skincare-app/",
  "/skincare-app/index.html",
  "/skincare-app/app.js",
  "/skincare-app/manifest.webmanifest?v=7",
  "/skincare-app/icon-192.png?v=7",
  "/skincare-app/icon-512.png?v=7"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  // 先网络，失败再缓存（保证页面更新）
  e.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(req, resClone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
