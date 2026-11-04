/* Service Worker ON!: cache-first para os arquivos do próprio jogo.
   >>> A CADA PUBLICAÇÃO com mudança de arquivo, aumente a versão em CACHE_NAME. <<< */
const CACHE_NAME = 'hanafudaon-v4';

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./manifest.json",
  "./on.css",
  "./on.js",
  "./hanafuda.css",
  "./hanafuda.js",
  "./colorido.css",
  "./nucleo.js",
  "./captura.js",
  "./jogos-captura.js",
  "./kabu.js",
  "./robo.js",
  "./robo-worker.js",
  "./textos.js",
  "./mesa.js",
  "./javinhas.js",
  "./assets/favicon.ico",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png",
  "./assets/qrpix.png",
  "./hanafuda/preta/00.svg",
  "./hanafuda/preta/01.svg",
  "./hanafuda/preta/02.svg",
  "./hanafuda/preta/03.svg",
  "./hanafuda/preta/04.svg",
  "./hanafuda/preta/05.svg",
  "./hanafuda/preta/06.svg",
  "./hanafuda/preta/07.svg",
  "./hanafuda/preta/08.svg",
  "./hanafuda/preta/09.svg",
  "./hanafuda/preta/10.svg",
  "./hanafuda/preta/11.svg",
  "./hanafuda/preta/12.svg",
  "./hanafuda/preta/13.svg",
  "./hanafuda/preta/14.svg",
  "./hanafuda/preta/15.svg",
  "./hanafuda/preta/16.svg",
  "./hanafuda/preta/17.svg",
  "./hanafuda/preta/18.svg",
  "./hanafuda/preta/19.svg",
  "./hanafuda/preta/20.svg",
  "./hanafuda/preta/21.svg",
  "./hanafuda/preta/22.svg",
  "./hanafuda/preta/23.svg",
  "./hanafuda/preta/24.svg",
  "./hanafuda/preta/25.svg",
  "./hanafuda/preta/26.svg",
  "./hanafuda/preta/27.svg",
  "./hanafuda/preta/28.svg",
  "./hanafuda/preta/29.svg",
  "./hanafuda/preta/30.svg",
  "./hanafuda/preta/31.svg",
  "./hanafuda/preta/32.svg",
  "./hanafuda/preta/33.svg",
  "./hanafuda/preta/34.svg",
  "./hanafuda/preta/35.svg",
  "./hanafuda/preta/36.svg",
  "./hanafuda/preta/37.svg",
  "./hanafuda/preta/38.svg",
  "./hanafuda/preta/39.svg",
  "./hanafuda/preta/40.svg",
  "./hanafuda/preta/41.svg",
  "./hanafuda/preta/42.svg",
  "./hanafuda/preta/43.svg",
  "./hanafuda/preta/44.svg",
  "./hanafuda/preta/45.svg",
  "./hanafuda/preta/46.svg",
  "./hanafuda/preta/47.svg",
  "./hanafuda/preta/verso.svg",
  "./hanafuda/vermelha/00.svg",
  "./hanafuda/vermelha/01.svg",
  "./hanafuda/vermelha/02.svg",
  "./hanafuda/vermelha/03.svg",
  "./hanafuda/vermelha/04.svg",
  "./hanafuda/vermelha/05.svg",
  "./hanafuda/vermelha/06.svg",
  "./hanafuda/vermelha/07.svg",
  "./hanafuda/vermelha/08.svg",
  "./hanafuda/vermelha/09.svg",
  "./hanafuda/vermelha/10.svg",
  "./hanafuda/vermelha/11.svg",
  "./hanafuda/vermelha/12.svg",
  "./hanafuda/vermelha/13.svg",
  "./hanafuda/vermelha/14.svg",
  "./hanafuda/vermelha/15.svg",
  "./hanafuda/vermelha/16.svg",
  "./hanafuda/vermelha/17.svg",
  "./hanafuda/vermelha/18.svg",
  "./hanafuda/vermelha/19.svg",
  "./hanafuda/vermelha/20.svg",
  "./hanafuda/vermelha/21.svg",
  "./hanafuda/vermelha/22.svg",
  "./hanafuda/vermelha/23.svg",
  "./hanafuda/vermelha/24.svg",
  "./hanafuda/vermelha/25.svg",
  "./hanafuda/vermelha/26.svg",
  "./hanafuda/vermelha/27.svg",
  "./hanafuda/vermelha/28.svg",
  "./hanafuda/vermelha/29.svg",
  "./hanafuda/vermelha/30.svg",
  "./hanafuda/vermelha/31.svg",
  "./hanafuda/vermelha/32.svg",
  "./hanafuda/vermelha/33.svg",
  "./hanafuda/vermelha/34.svg",
  "./hanafuda/vermelha/35.svg",
  "./hanafuda/vermelha/36.svg",
  "./hanafuda/vermelha/37.svg",
  "./hanafuda/vermelha/38.svg",
  "./hanafuda/vermelha/39.svg",
  "./hanafuda/vermelha/40.svg",
  "./hanafuda/vermelha/41.svg",
  "./hanafuda/vermelha/42.svg",
  "./hanafuda/vermelha/43.svg",
  "./hanafuda/vermelha/44.svg",
  "./hanafuda/vermelha/45.svg",
  "./hanafuda/vermelha/46.svg",
  "./hanafuda/vermelha/47.svg",
  "./hanafuda/vermelha/verso.svg"
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Outros domínios (ex.: lista de jogos da hub) passam direto: quem pede cuida do offline.
  if (url.origin !== location.origin) return;
  // jogos.json (hub) é sempre buscado na rede primeiro: a lista precisa ficar atualizada
  if (url.pathname.endsWith('/jogos.json')) { event.respondWith(networkFirst(req)); return; }
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const fresh = await fetch(req);
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (e) {
    return (await cache.match(req, { ignoreSearch: true })) || Response.error();
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE_NAME);
  const hit = await cache.match(req, { ignoreSearch: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    // arquivo que não estava na lista (ex.: ícone de um jogo novo na hub): guarda para o offline
    if (res.ok && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (e) {
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  }
}
