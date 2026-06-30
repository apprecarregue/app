const CACHE = 'recarregue-v2';
const STATIC = [
  'manifest.json', 'icon-192.png', 'icon-512.png',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Instala: cacheia só assets estáticos (não o HTML)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(STATIC.map(u => c.add(new Request(u, {mode:'no-cors'}))))
    )
  );
  self.skipWaiting();
});

// Ativa: limpa caches antigos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: HTML sempre da rede (nunca cacheado), assets do cache
self.addEventListener('fetch', e => {
  const {request} = e;
  // HTML: network-first — garante que a versão mais recente sempre carrega
  if (request.destination === 'document' || request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  // Assets: cache-first
  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request))
  );
});
