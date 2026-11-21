// Rando'Nett — service worker : appli installable et utilisable hors connexion.
// v2 : la page de l'appli est toujours redemandée au serveur sans passer par le cache du navigateur,
// pour que l'appli installée sur le bureau reçoive les mises à jour dès leur dépôt sur GitHub.
const CACHE = 'randonett-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).catch(() => {})); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // GitHub, Google : jamais mis en cache
  const page = e.request.mode === 'navigate' || /\.html$|\/$/.test(u.pathname);
  const net = page ? fetch(u.href, { cache: 'no-store', credentials: 'same-origin' }) : fetch(e.request);
  e.respondWith(net.then(r => { if (r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(page && u.pathname.endsWith('/') ? './index.html' : e.request, cp)); } return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('./index.html'))));
});
self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); });
