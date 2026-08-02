/* Omnilore service worker — app shell caching.
   Strategy:
   - Navigation requests (HTML): network-first, fall back to cache.
   - Static assets (css/js/svg/manifest): cache-first, refresh in background.
   - Entity images (remote): stale-while-revalidate, capped cache.
   Version the cache names to roll updates. */
'use strict';

var VERSION = 'omnilore-v2.0.0';
var SHELL_CACHE = VERSION + '-shell';
var IMG_CACHE = VERSION + '-images';
var IMG_LIMIT = 120;

var SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/logo.svg',
  './assets/omnilore-core.js',
  './assets/pathways.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function (cache) { return cache.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (key) {
        if (key.indexOf(VERSION) !== 0) return caches.delete(key);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

function trimImageCache(cache) {
  return cache.keys().then(function (keys) {
    if (keys.length <= IMG_LIMIT) return;
    return cache.delete(keys[0]).then(function () { return trimImageCache(cache); });
  });
}

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  // HTML navigations: network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Remote entity imagery: stale-while-revalidate with a cap
  if (url.origin !== location.origin && /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(url.pathname)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(function (cache) {
        return cache.match(req).then(function (hit) {
          var network = fetch(req).then(function (res) {
            if (res && (res.ok || res.type === 'opaque')) {
              cache.put(req, res.clone()).then(function () { return trimImageCache(cache); });
            }
            return res;
          }).catch(function () { return hit; });
          return hit || network;
        });
      })
    );
    return;
  }

  // Same-origin static assets: cache-first
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res && res.ok && /assets|manifest|\.js$|\.css$/.test(url.pathname)) {
            var copy = res.clone();
            caches.open(SHELL_CACHE).then(function (c) { c.put(req, copy); });
          }
          return res;
        });
      })
    );
  }
});
