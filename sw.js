const CACHE = 'kunkka-v3';
const ASSETS = [
  './',
  './manifest.json',
  './favicon.png',
  './favicon.ico',
  './kunka.png',
  './kunka_choke.png',
  './kunka_open.png',
  './grapes.png',
  './grapes_gold.png',
  './grapes_green.png',
  './rum.png',
  './sea_bg.png',
  './cd_1.png',
  './cd_2.png',
  './cd_3.png',
  './music.mp3'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Google Fonts — сеть с запасным кешем
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) {
    e.respondWith(
      caches.open(CACHE + '-fonts').then(c =>
        c.match(e.request).then(cached => {
          const net = fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; });
          return cached || net;
        })
      )
    );
    return;
  }
  // Локальные ресурсы — кеш прежде всего, фоновое обновление
  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(e.request).then(cached => {
        const net = fetch(e.request).then(r => {
          if (r.ok) c.put(e.request, r.clone());
          return r;
        }).catch(() => cached);
        return cached || net;
      })
    )
  );
});
