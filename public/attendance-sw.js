const CACHE='namo-attendance-v1';
const STATIC=['/attendance.html','/attendance.css?v=20260904-1','/attendance-app.js?v=20260904-1','/attendance-icon.svg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(STATIC)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;if(new URL(r.url).pathname.startsWith('/api/'))return;e.respondWith(fetch(r).then(resp=>{const clone=resp.clone();caches.open(CACHE).then(c=>c.put(r,clone)).catch(()=>{});return resp}).catch(()=>caches.match(r).then(x=>x||caches.match('/attendance.html'))))});
