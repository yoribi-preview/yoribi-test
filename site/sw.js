const SCOPE = self.registration.scope;
const APP_VERSION = '1.4.3-candidate';
const CACHE_PREFIX = 'birthday-circle-shell-' + encodeURIComponent(new URL(SCOPE).pathname) + '-';
const CACHE_NAME = CACHE_PREFIX + '9b79089bfd59b125';
const PRECACHE = ["./assets/index-CLnP4Ojj.js","./assets/index-CvkN3kCB.css","./fonts/zen-maru-gothic/METADATA.pb","./fonts/zen-maru-gothic/OFL.txt","./fonts/zen-maru-gothic/SOURCE.json","./fonts/zen-maru-gothic/ZenMaruGothic-Bold.ttf","./fonts/zen-maru-gothic/ZenMaruGothic-Medium.ttf","./fonts/zen-maru-gothic/ZenMaruGothic-Regular.ttf","./icons/apple-touch-icon.png","./icons/favicon-48.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./manifest.webmanifest"];
let retired=false;
const appUrl = (path) => new URL(path, SCOPE).href;
const allowedPaths = new Set(PRECACHE.map((path) => new URL(path, SCOPE).pathname));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE.map(appUrl)))
    .then(()=>retired?caches.delete(CACHE_NAME):undefined));
  // 利用者が更新ボタンを押すまでは現在の画面を強制置換しません。
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    if(retired){await caches.delete(CACHE_NAME);return;}
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if(event.data?.type==='YORIBI_WINDOWS')event.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(clients=>{
    const own=clients.filter(client=>client.url.startsWith(SCOPE)&&client.id!==event.source?.id);
    event.ports[0]?.postMessage({otherWindows:own.length});
  }));
  if(event.data?.type==='YORIBI_STOP'){retired=true;event.ports[0]?.postMessage({stopped:true});return;}
  if(retired)return;
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CACHE_NAME') event.ports[0]?.postMessage({ cacheName: CACHE_NAME, appVersion: APP_VERSION });
});

self.addEventListener('fetch', (event) => {
  if(retired)return;
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () =>
      (await caches.open(CACHE_NAME)).match(appUrl('./index.html'))
      || Response.error()));
    return;
  }
  if (!allowedPaths.has(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return (await cache.match(request)) || fetch(request);
  })());
});
