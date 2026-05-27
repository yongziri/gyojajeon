const CACHE = 'vanished-sea-v4';
const PRECACHE = [
  './',
  './index.html',
  './vendor/phaser.min.js',
  './vendor/mqtt.min.js',
  './src/audio.js',
  './src/telemetry.js',
  './src/dialogue.js',
  './src/cases.js',
  './src/quizzes.js',
  './src/game.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/fonts/NeoDunggeunmoPro-Regular.ttf',
  './assets/fonts/PFStardust-Regular.ttf',
  './assets/fonts/PFStardust-Bold.ttf',
  './assets/fonts/PFStardust-ExtraBold.ttf'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
