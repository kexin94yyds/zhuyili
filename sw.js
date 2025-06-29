// Service Worker for Attention—Span—Tracker PWA
const CACHE_NAME = 'time-tracker-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/stopwatch.html',
  '/styles.css',
  '/annual_table_styles.css',
  '/combined.js',
  '/multi-stopwatch.js',
  '/export_import.js',
  '/manifest.json'
];

// 安装Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: 正在安装...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: 正在缓存文件...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: 安装完成');
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: 正在激活...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 删除旧缓存', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// 拦截请求 - 使用网络优先策略（开发时更方便）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // 检查响应是否有效
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 克隆响应用于缓存
        const responseToCache = response.clone();

        caches.open(CACHE_NAME)
          .then((cache) => {
            cache.put(event.request, responseToCache);
          });

        return response;
      })
      .catch(() => {
        // 网络失败时，尝试从缓存获取
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // 如果缓存也没有，返回离线页面
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// 处理后台同步
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: 执行后台同步');
    // 这里可以添加后台数据同步逻辑
  }
});

// 处理推送通知
self.addEventListener('push', (event) => {
  console.log('Service Worker: 收到推送消息');
  
  const options = {
            body: event.data ? event.data.text() : 'Attention—Span—Tracker有新消息',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: '打开应用'
      },
      {
        action: 'close',
        title: '关闭'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Attention—Span—Tracker', options)
  );
});

// 处理通知点击
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: 通知被点击');
  
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 