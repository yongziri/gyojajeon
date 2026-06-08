const CACHE = 'vanished-sea-v211';
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
  './src/stages.js',
  './src/strings.js',
  './src/game.js',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/flag_un.png',
  './assets/icons/flag_uzbekistan.png',
  './assets/icons/flag_ukraine.png',
  './assets/icons/flag_palestine.png',
  './assets/fonts/MonaS12TextKR.woff2',
  './assets/fonts/MonaS12-Bold.woff2',
  './assets/fonts/MonaS12.woff2',
  './assets/audio/Mandate_of_Peace.mp3',
  './assets/audio/bgm_intro.mp3',
  './assets/audio/bgm_aralsea.mp3',
  './assets/audio/bgm_ukraine.mp3',
  './assets/audio/bgm_palestine.mp3',
  './assets/audio/bgm_investigation.mp3',
  './assets/audio/bgm_caseselect.mp3'
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

  const p = url.pathname;
  // 코드·HTML·매니페스트 + 자주 교체되는 이미지 → network-first.
  //   온라인이면 항상 최신을 받고(새로고침 1번이면 즉시 반영), 캐시도 갱신.
  //   오프라인이면 캐시로 폴백 → 학교 오프라인 환경에서도 동작.
  const isCode = req.mode === 'navigate' ||
                 /\.(js|html)$/.test(p) || p.endsWith('/') ||
                 p.endsWith('/manifest.webmanifest');
  const isLiveImg = p.includes('/assets/portraits/') ||
                    p.includes('/assets/photos/');
  if (isCode || isLiveImg) {
    e.respondWith(
      fetch(req).then((resp) => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // 폰트·아이콘·오디오 등 잘 안 바뀌는 자산 → cache-first (빠름)
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
