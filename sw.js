const CACHE_NAME = 'skincare-cache-v3';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './manifest.webmanifest'
];

self.addEventListener('install',e=>{
  e.waitUntil(
    caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS))
  );
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))
    ))
  );
});

self.addEventListener('fetch',e=>{
  const req = e.request;
  if(req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then(res=>res || fetch(req).catch(()=>res))
  );
});
