// 泽雷特智能运维平台 - Service Worker
// 提供离线缓存和PWA安装能力
const CACHE_NAME = 'zltdata-ops-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/screens_ios-login.html',
  '/screens_ios-dashboard.html',
  '/screens_ios-alarms.html',
  '/screens_ios-inspection.html',
  '/screens_ios-tickets.html',
  '/screens_ios-products.html',
  '/screens_ios-profile.html',
  '/screens_android-dashboard.html',
  '/screens_android-alarms.html',
  '/app-icon-192.png',
  '/app-icon-512.png'
];

// Install: 预缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching core assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        // 某些文件可能不存在，继续即可
        console.warn('[SW] Partial cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: 清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: 缓存优先, 网络兜底
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      // 先返回缓存，同时后台更新
      const fetchPromise = fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
