// Service Worker for 德州扑克训练平台
// 根据 sw.js 自身部署位置动态推导 BASE：
//   开发环境（/sw.js）     -> BASE = '/'
//   GitHub Pages（/dezhou/sw.js） -> BASE = '/dezhou/'
// 因此开发与部署通用，无需为不同环境改代码。
const BASE = self.location.pathname.replace(/\/sw\.js$/, '') + '/';

// 从注册 URL 查询参数读取缓存版本号（由 main.tsx 在注册时传入 APP_VERSION）
const CACHE_VERSION = new URLSearchParams(self.location.search).get('v') || '1';
const CACHE_NAME = 'poker-training-' + CACHE_VERSION;
const STATIC_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
];

// Install: cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation requests (SPA): network-first with cached app-shell fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(BASE + 'index.html', clone));
          return response;
        })
        .catch(() => caches.match(BASE + 'index.html').then((r) => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Hashed static assets (Vite output: /assets/xxx-hash.js|css): cache-first (immutable)
  if (url.pathname.startsWith(BASE + 'assets/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Other same-origin GET: network-first, no caching (avoids stale modules after update)
  event.respondWith(
    fetch(event.request).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match(BASE + 'index.html').then((r) => r || new Response('Offline', { status: 503 }));
      }
      return new Response('Offline', { status: 503 });
    })
  );
});