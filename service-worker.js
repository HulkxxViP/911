/* ============================================================================
   service-worker.js — caches the host shell so re-triggers work offline/instant
   Registration is optional: PS4's old engine skips it gracefully (see main.js).
   ============================================================================ */
var CACHE_NAME = "hulk-psx-host-v1";
var SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/config.js",
  "./js/detect.js",
  "./js/cache.js",
  "./js/goldhen.js",
  "./js/exploit.js",
  "./js/ui.js",
  "./js/main.js",
  "./manifest.json"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL);
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () { return self.clients.claim(); })
  );
});

/* Cache-first for shell assets; network-first for payloads (so GoldHEN
   updates propagate) with a cache fallback for offline use. */
self.addEventListener("fetch", function (event) {
  var req = event.request;
  if (req.method !== "GET") return;
  var url = req.url || "";

  var isPayload = url.indexOf("/payloads/") !== -1 ||
                  url.indexOf("/exploits/") !== -1 ||
                  url.indexOf("/cache/") !== -1 ||
                  url.indexOf("github") !== -1;

  if (isPayload) {
    event.respondWith(
      fetch(req).then(function (res) {
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        return caches.match(req).then(function (hit) { return hit || Response.error(); });
      })
    );
  } else {
    event.respondWith(
      caches.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res && res.ok && url.indexOf("http") === 0) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (c) { c.put(req, copy); });
          }
          return res;
        });
      })
    );
  }
});