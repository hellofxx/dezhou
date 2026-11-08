// Service Worker for 德州扑克训练平台
// 根据 sw.js 自身部署位置动态推导 BASE：
//   开发环境（/sw.js）     -> BASE = '/'
//   GitHub Pages（/dezhou/sw.js） -> BASE = '/dezhou/'
// 因此开发与部署通用，无需为不同环境改代码。
const BASE = self.location.pathname.replace(/\/sw\.js$/, '') + '/';

// 从注册 URL 查询参数读取缓存版本号（由 main.tsx 在注册时传入 APP_VERSION）
const CACHE_VERSION = new URLSearchParams(self.location.search).get('v') || '1';

// 构建期由 scripts/sw-precache-plugin.ts 注入全量预缓存清单与清单 hash。
// dev 直接服务本模板时两个占位符均为 undefined：空清单 + 'dev' hash 降级，
// 不报错，也不会污染生产缓存（缓存名不同）。
const PRECACHE_MANIFEST = self.__PRECACHE_MANIFEST__ || [];
const MANIFEST_HASH = self.__MANIFEST_HASH__ || 'dev';

// 缓存名同时含版本号与清单 hash：同版本重部署（产物清单变化）也会生成新缓存名，
// 且注入后的 sw.js 字节差异本身就会触发浏览器的 SW 更新检测（与 ?v= 无关）。
const CACHE_NAME = 'poker-training-' + CACHE_VERSION + '-' + MANIFEST_HASH;
// meta 缓存跨版本常驻，记录「当前激活的缓存名」，activate 据此保留当前 + 上一版。
const META_CACHE = 'poker-training-meta';
const META_CURRENT_KEY = BASE + '.sw-meta-current';

// App shell 三件套：install 时强制绕过 HTTP 缓存拉新，防止把 CDN 旧 HTML 写进新缓存。
const STATIC_ASSETS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
];

// 全量清单分批串行 addAll：每批 32 条，失败重试一次，仍失败则抛出使 install 失败，
// 浏览器会在下次导航时重试安装。不容忍 404：容忍缺资源等于复现离线白屏。
const PRECACHE_BATCH_SIZE = 32;

async function addBatchWithRetry(cache, urls) {
  try {
    await cache.addAll(urls);
  } catch {
    // 唯一一次重试；再失败由调用方抛出，终止本次 install
    await cache.addAll(urls);
  }
}

async function precacheAll() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(STATIC_ASSETS.map((url) => new Request(url, { cache: 'reload' })));
  const rest = PRECACHE_MANIFEST.filter((url) => !STATIC_ASSETS.includes(url));
  for (let i = 0; i < rest.length; i += PRECACHE_BATCH_SIZE) {
    await addBatchWithRetry(cache, rest.slice(i, i + PRECACHE_BATCH_SIZE));
  }
}

// Install: 全量预缓存（首次打开后后台下载，任何课程 / 训练页离线可用）。
// 不主动跳过等待阶段：新 SW 等旧标签页全部关闭后才激活，旧标签页在此期间
// 始终由旧 SW + 旧缓存服务，部署后懒加载旧 chunk 不会因缓存被删而失败。
self.addEventListener('install', (event) => {
  event.waitUntil(precacheAll());
});

// Activate: 把当前缓存名写入 meta，删除除「当前 / 上一版 / meta」外的所有
// poker-training-* 缓存。保留上一版为回滚部署兜底（配额代价见 ADR-0004）。
// 不立即接管旧标签页：激活时旧标签页已全部关闭，新版本由新 SW 统一服务。
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const meta = await caches.open(META_CACHE);
      const previousResponse = await meta.match(META_CURRENT_KEY);
      const previous = previousResponse ? await previousResponse.text() : '';
      await meta.put(META_CURRENT_KEY, new Response(CACHE_NAME));
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('poker-training-') &&
              key !== CACHE_NAME &&
              key !== previous &&
              key !== META_CACHE
          )
          .map((key) => caches.delete(key))
      );
    })()
  );
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
          // 仅成功响应才回写 shell 缓存，防止把 Pages 404 响应缓存成离线首页
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(BASE + 'index.html', clone));
          }
          return response;
        })
        .catch(() => caches.match(BASE + 'index.html').then((r) => r || new Response('Offline', { status: 503 })))
    );
    return;
  }

  // Hashed static assets (Vite output: /assets/xxx-hash.js|css): cache-first (immutable)
  if (url.pathname.startsWith(BASE + 'assets/')) {
    event.respondWith(
      // ignoreVary：模块脚本请求带 Origin 头，而 addAll 预缓存的请求没有；
      // 服务器响应带 Vary: Origin（vite preview / Pages CDN）时不忽略会离线 miss。
      // 本分支只缓存同源 immutable 哈希资产，忽略 Vary 是安全的。
      caches.match(event.request, { ignoreVary: true }).then((cached) => {
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

  // 自托管字体已迁移至 src/fonts/，由 Vite 打包为哈希资产，走上方 assets/ 规则（离线能力不变）

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