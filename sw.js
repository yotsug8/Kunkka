// © 2026 Admiral8Dota. Все права защищены — см. LICENSE.
// Service worker: офлайн-игра и быстрые обновления.
// Страница, стили и скрипты — сначала сеть (новая версия видна сразу, без рассинхрона
// HTML и JS), картинки и музыка — сначала кеш. CACHE и список ASSETS проставляет `npm run apply`
// из config.js и темы: новая версия получает свой кеш.
const CACHE = 'kunka-v1.14.0';
const ASSETS = [
  './',
  './manifest.json',
  './config.js',
  './css/style.css',
  './js/game.js',
  './js/pwa.js',
  './themes/kunka/theme.js',
  './themes/kunka/img/kunka.jpg',
  './themes/kunka/img/kunka_open.jpg',
  './themes/kunka/img/kunka_choke.jpg',
  './themes/kunka/img/grapes.png',
  './themes/kunka/img/grapes_green.png',
  './themes/kunka/img/grapes_gold.png',
  './themes/kunka/img/rum.png',
  './themes/kunka/img/sea_bg.jpg',
  './themes/kunka/img/cd_1.png',
  './themes/kunka/img/cd_2.png',
  './themes/kunka/img/cd_3.png',
  './themes/kunka/icons/favicon.ico',
  './themes/kunka/icons/favicon.png',
  './themes/kunka/icons/icon-192.png',
  './themes/kunka/icons/icon-512.png',
  './themes/kunka/audio/music.mp3',
  './themes/kunka/audio/touch.mp3'
];

self.addEventListener('install', e => {
  // cache:'reload' — мимо HTTP-кеша браузера, чтобы не закешировать старую версию
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== CACHE + '-fonts').map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function networkFirst(req, key) {
  return fetch(req, { cache: 'no-cache' }).then(r => {
    if (r.status === 200) caches.open(CACHE).then(c => c.put(key || req, r.clone()));
    return r;
  }).catch(() => caches.match(key || req, { ignoreSearch: true }).then(r => r || Response.error()));
}

function cacheFirst(req) {
  if (req.headers.has('range')) return rangeFromCache(req);
  return caches.open(CACHE).then(c =>
    c.match(req).then(cached => {
      const net = fetch(req).then(r => {
        if (r.status === 200) c.put(req, r.clone());
        return r;
      }).catch(() => cached);
      return cached || net;
    })
  );
}

// Музыку браузер запрашивает кусками (заголовок Range). Safari на iOS не играет аудио,
// если на такой запрос пришёл весь файл, поэтому из кеша отдаём ровно запрошенный кусок (206).
function rangeFromCache(req) {
  return caches.match(req.url).then(cached => {
    if (!cached) return fetch(req);
    return cached.arrayBuffer().then(buf => {
      const size = buf.byteLength;
      const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range').trim());
      if (!m || (!m[1] && !m[2])) return new Response(buf, { status: 200, headers: cached.headers });
      let start, end;
      if (m[1]) { start = +m[1]; end = m[2] ? Math.min(+m[2], size - 1) : size - 1; }
      else { start = Math.max(0, size - +m[2]); end = size - 1; }   // bytes=-N: последние N байт
      if (start >= size || start > end) {
        return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
      }
      return new Response(buf.slice(start, end + 1), {
        status: 206,
        headers: {
          'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
          'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
          'Content-Length': String(end - start + 1),
          'Accept-Ranges': 'bytes'
        }
      });
    });
  });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;           // запросы к таблице рекордов не трогаем
  const url = new URL(req.url);

  // Google Fonts — кеш, если есть, иначе сеть
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(
      caches.open(CACHE + '-fonts').then(c =>
        c.match(req).then(cached => cached || fetch(req).then(r => {
          if (r.ok || r.type === 'opaque') c.put(req, r.clone());   // ошибку сервера шрифтов не кешируем
          return r;
        }))
      )
    );
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') { e.respondWith(networkFirst(req, './')); return; }
  if (req.destination === 'script' || req.destination === 'style' || url.pathname.endsWith('manifest.json')) {
    e.respondWith(networkFirst(req));
    return;
  }
  e.respondWith(cacheFirst(req));
});
