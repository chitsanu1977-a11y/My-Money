// เปลี่ยน VERSION ทุกครั้งที่อัพเดทแอป → บังคับให้ reload ทันที
const VERSION = '8';
const CACHE = 'ptpr-v' + VERSION;
const BASE = '/My-Money/';
const ASSETS = [BASE, BASE + 'index.html', BASE + 'manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      Promise.allSettled(ASSETS.map(url => cache.add(url)))
    )
  );
  self.skipWaiting(); // บังคับใช้ sw ใหม่ทันที ไม่รอปิดแท็บ
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim()) // บังคับทุก tab ใช้ sw ใหม่
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(BASE + 'index.html'));
    })
  );
});
