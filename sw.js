// Precache list is injected at build time (see vite.config.ts).
const CACHE = 'vbc-1795284540300';
const AI_CACHE = 'vbc-ai-runtime'; // ONNX runtime wasm, cached on first use of the on-device AI (kept across app updates)
const FILES = ["./","./assets/App-BeT9EB5v.js","./assets/App-BJKNQuPj.css","./assets/index-ChjZvOTq.css","./assets/index-DN-i45pN.js","./assets/modelWorker-B5AuwULX.js","./assets/ort-wasm-simd-threaded.asyncify-DXIbolS2.mjs","./icon-192.png","./icon-512.png","./index.html","./manifest.json","./rules.json"];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== AI_CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Model downloads (huggingface.co etc.) and any other cross-origin request go straight to the network, untouched.
  // The model files are stored by the model library in its own Cache API cache ('transformers-cache'), not here.
  if (url.origin !== self.location.origin) return;
  if (/ort-wasm.*\.wasm$/.test(url.pathname)) {
    e.respondWith(caches.open(AI_CACHE).then(async (c) => (await c.match(e.request)) || fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; })));
    return;
  }
  if (/\/rules\.json$/.test(url.pathname)) { // versioned rules: network first so an update is seen, cached copy offline
    e.respondWith(fetch(e.request).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put('./rules.json', r.clone())); return r; }).catch(() => caches.match('./rules.json').then((h) => h || Response.error())));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request).catch(() =>
    e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
});
