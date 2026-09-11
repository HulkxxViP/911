/* ============================================================================
   cache.js — the "load once, cached on device" layer
   ----------------------------------------------------------------------------
   Hierarchy (best available first):
     1. Cache Storage API (modern browsers / PS5 webviews, service worker assist)
     2. IndexedDB-free localStorage blob cache (works on PS4 Safari-era engine,
        which has no Cache API)
     3. In-memory fallback for the same page session

   What is cached:
     - the host shell (via service-worker.js when registered)
     - fetched payload binaries/JSON (GoldHEN, plains, stage files)
     - user settings + last firmware
   ES5-compatible core (var/function). Modern bits are feature-detected.
   ============================================================================ */

var CacheBox = (function () {

  var LS_PREFIX = "hulkpsx:";
  var memoryCache = {};

  function lsGet(key) {
    try { return window.localStorage.getItem(LS_PREFIX + key); } catch (e) { return null; }
  }
  function lsSet(key, val) {
    try { window.localStorage.setItem(LS_PREFIX + key, val); return true; } catch (e) { return false; }
  }
  function lsDel(key) {
    try { window.localStorage.removeItem(LS_PREFIX + key); } catch (e) {}
  }

  function supportsCacheApi() {
    return !!(window.caches && window.fetch && typeof window.caches.open === "function");
  }

  /* store a text payload across all viable layers */
  function storeText(key, text, ttlMs) {
    var ttl = ttlMs || HOST.cache.payloadTtlMs;
    var entry = { v: text, ts: Date.now(), exp: ttl };
    memoryCache[key] = entry;
    lsSet(key, JSON.stringify(entry)); // PS4-capable
    if (supportsCacheApi()) {
      var req = new Request(HOST.brand.pagesUrl + "cache/" + key + ".txt");
      window.caches.open(HOST.cache.swName).then(function (c) {
        return c.put(req, new Response(text, { headers: { "Content-Type": "text/plain" } }));
      }).catch(function () {});
    }
  }

  function storeBinary(key, arrayBufferOrBlob) { // eslint-disable-line no-unused-vars
    // Binary caching for modern browsers (PS5 webview / desktop test).
    // The PS4 path stores binary as base64 via fetch payloads instead.
    if (supportsCacheApi() && arrayBufferOrBlob) {
      var blob = arrayBufferOrBlob instanceof Blob
        ? arrayBufferOrBlob
        : new Blob([arrayBufferOrBlob]);
      var req = new Request(HOST.brand.pagesUrl + "cache/" + key + ".bin");
      window.caches.open(HOST.cache.swName).then(function (c) {
        return c.put(req, new Response(blob, { headers: { "Content-Type": "application/octet-stream" } }));
      }).catch(function () {});
    }
  }

  function getCacheApiText(key) {
    if (!supportsCacheApi()) return Promise.resolve(null);
    return window.caches.open(HOST.cache.swName).then(function (c) {
      return c.match(HOST.brand.pagesUrl + "cache/" + key + ".txt");
    }).then(function (res) {
      return res ? res.text() : null;
    }).catch(function () { return null; });
  }

  /* read text: memory -> localStorage -> Cache API */
  function getText(key) {
    return new Promise(function (resolve) {
      var mem = memoryCache[key];
      if (mem) { resolve(expired(mem) ? null : mem.v); return; }
      var raw = lsGet(key);
      if (raw) {
        try {
          var parsed = JSON.parse(raw);
          if (!expired(parsed)) { memoryCache[key] = parsed; resolve(parsed.v); return; }
          lsDel(key);
        } catch (e) { lsDel(key); }
      }
      getCacheApiText(key).then(function (t) {
        if (t !== null && t !== undefined) {
          storeText(key, t); // promote back to memory
          resolve(t);
        } else resolve(null);
      });
    });
  }

  function expired(entry) {
    return !entry || !entry.ts || (Date.now() - entry.ts) > entry.exp;
  }

  /* fetch a URL through network, then cache the text result */
  function fetchAndCacheText(url, key) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest(); // XHR works on PS4 engine + everywhere
      xhr.open("GET", url, true);
      xhr.timeout = 20000;
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          storeText(key || url, xhr.responseText);
          resolve(xhr.responseText);
        } else {
          reject(new Error("HTTP " + xhr.status + " for " + url));
        }
      };
      xhr.onerror = function () { reject(new Error("Network error for " + url)); };
      xhr.ontimeout = function () { reject(new Error("Timeout for " + url)); };
      xhr.send();
    });
  }

  /* fetch with cache-first semantics: try cached, then network */
  function loadText(url, key) {
    return getText(key || url).then(function (cached) {
      if (cached !== null && cached !== undefined) {
        return { from: "cache", text: cached };
      }
      return fetchAndCacheText(url, key || url).then(function (t) {
        return { from: "network", text: t };
      });
    });
  }

  /* settings persistence */
  function saveSetting(key, val) { lsSet("setting:" + key, JSON.stringify(val)); }
  function loadSetting(key, fallback) {
    var raw = lsGet("setting:" + key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) { return fallback; }
  }
  function clearAll() {
    memoryCache = {};
    try {
      var keys = [];
      for (var i = 0; i < window.localStorage.length; i++) {
        var k = window.localStorage.key(i);
        if (k && k.indexOf(LS_PREFIX) === 0) keys.push(k);
      }
      for (var j = 0; j < keys.length; j++) window.localStorage.removeItem(keys[j]);
    } catch (e) {}
    if (supportsCacheApi()) {
      window.caches.delete(HOST.cache.swName).catch(function () {});
    }
  }

  return {
    storeText: storeText,
    storeBinary: storeBinary,
    getText: getText,
    loadText: loadText,
    fetchAndCacheText: fetchAndCacheText,
    saveSetting: saveSetting,
    loadSetting: loadSetting,
    clearAll: clearAll,
    supportsCacheApi: supportsCacheApi
  };
})();