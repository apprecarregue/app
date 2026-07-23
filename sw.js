const CACHE = 'recarregue-v18';
const STATIC = [
  'manifest.json', 'icon-192.png', 'icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(STATIC.map(u => c.add(new Request(u, {mode:'no-cors'}))))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({type:'window'}).then(cls=>cls.forEach(c=>c.postMessage({type:'SW_UPDATED'}))))
  );
});

self.addEventListener('fetch', e => {
  const {request} = e;
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(fetch(request).catch(() => caches.match(request)));
    return;
  }
  e.respondWith(caches.match(request).then(cached => cached || fetch(request)));
});

// Agendamento de notificações — recebe da página e dispara via SW (funciona no Android)
const _scheduledNotifs = {};
self.addEventListener('message', e => {
  if (!e.data || e.data.type !== 'SCHEDULE_NOTIF') return;
  const { id, title, body, icon, tag, delayMs } = e.data;
  if (delayMs <= 0 || delayMs > 24 * 60 * 60 * 1000) return;
  if (_scheduledNotifs[id]) clearTimeout(_scheduledNotifs[id]);
  _scheduledNotifs[id] = setTimeout(() => {
    self.registration.showNotification(title, { body, icon, tag, badge: './icon-192.png' });
    delete _scheduledNotifs[id];
  }, delayMs);
});
