/* sw.js — service worker Kayuputih: cache cangkang aplikasi agar cepat & bisa dibuka offline */
const V = 'kp-v2', IMG = 'kp-img-v1';
const SHELL = ['./', 'index.html', 'login.html', 'member.html', 'admin.html', 'supervisor.html', 'style.css', 'login.css', 'member.css', 'admin.css', 'supervisor.css',
  'database.js', 'auth.js', 'components.js', 'charts.js', 'receipt.js', 'script.js', 'login.js', 'member.js', 'admin.js', 'supervisor.js', 'pwa.js',
  'logo.png', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => { })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V && x !== IMG).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return; const u = new URL(r.url);
  if (u.origin === location.origin) {
    if (r.mode === 'navigate') { e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match('index.html')))); return; }
    e.respondWith(caches.match(r).then(m => { const n = fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(x => x.put(r, c)); } return res; }).catch(() => m); return m || n; })); return;
  }
  if (r.destination === 'image' && /images\.unsplash\.com/.test(u.host)) {
    e.respondWith(caches.open(IMG).then(c => c.match(r).then(m => m || fetch(r).then(res => { c.put(r, res.clone()); c.keys().then(k => { if (k.length > 60) c.delete(k[0]); }); return res; }).catch(() => m))));
  }
});
