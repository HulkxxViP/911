/* ============================================================================
   goldhen.js — GoldHEN release checker + payload loader
   ----------------------------------------------------------------------------
   Talks to the official GoldHEN GitHub API to report the latest version,
   then fetches/caches the payload payloads (goldhen.bin / payloads.json).
   Falls back gracefully when offline (uses whatever is cached).
   ============================================================================ */

var GoldHen = (function () {

  var state = {
    checkedAt: 0,
    tag: null,
    name: null,
    assets: [],
    cachedText: null
  };

  function cacheKey() { return "goldhen/latest.json"; }

  /* Fetch the latest release metadata via GitHub API (XHR = PS4-safe). */
  function checkLatest() {
    return new Promise(function (resolve, reject) {
      var onDone = function (data) {
        state.tag = data.tag_name || null;
        state.name = data.name || state.tag;
        state.assets = data.assets || [];
        state.checkedAt = Date.now();
        CacheBox.storeText(cacheKey(), JSON.stringify(state), 1000 * 60 * 60 * 12);
        resolve(cloneState());
      };

      // cached copy first (12h freshness enforced by storeText TTL)
      CacheBox.getText(cacheKey()).then(function (cached) {
        if (cached) {
          try {
            var c = JSON.parse(cached);
            if (c.tag) {
              state = c;
              resolve(cloneState());
              return;
            }
          } catch (e) {}
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", HOST.goldhen.apiLatest, true);
        xhr.timeout = 15000;
        xhr.setRequestHeader("Accept", "application/vnd.github+json");
        xhr.onreadystatechange = function () {
          if (xhr.readyState !== 4) return;
          if (xhr.status === 200) {
            try { onDone(JSON.parse(xhr.responseText)); }
            catch (e) { reject(new Error("Bad GitHub response")); }
          } else if (xhr.status === 403 || xhr.status === 429) {
            reject(new Error("GitHub rate limit (unauthenticated API). Cached data is still usable."));
          } else {
            reject(new Error("GitHub API HTTP " + xhr.status));
          }
        };
        xhr.onerror = function () { reject(new Error("Network error reaching GitHub API")); };
        xhr.ontimeout = function () { reject(new Error("GitHub API timeout")); };
        xhr.send();
      });
    });
  }

  function cloneState() {
    return {
      tag: state.tag, name: state.name, assets: state.assets.slice(),
      checkedAt: state.checkedAt, fromCache: !!CacheBox.getText // informational
    };
  }

  /* Download + cache goldhen.bin (and payloads.json if present) from the
     selected asset list, or a custom URL. */
  function fetchPayload(assetUrl, fileName) {
    var key = "goldhen/" + fileName;
    var url = assetUrl || HOST.goldhen.fallbackUrl;
    // binary fetch — reuse XHR with arraybuffer for modern engines,
    // text/base64 path is handled by the caller for PS4.
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open("GET", url, true);
      xhr.timeout = 60000;
      xhr.responseType = "arraybuffer";
      xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.status >= 200 && xhr.status < 300) {
          CacheBox.storeBinary(key, xhr.response);
          resolve({ ok: true, bytes: xhr.response.byteLength, fileName: fileName });
        } else reject(new Error("HTTP " + xhr.status + " for " + fileName));
      };
      xhr.onerror = function () { reject(new Error("Network error downloading " + fileName)); };
      xhr.ontimeout = function () { reject(new Error("Timeout downloading " + fileName)); };
      xhr.send();
    });
  }

  /* Resolve the right asset URL for a payload filename from release assets. */
  function assetUrlFor(name) {
    for (var i = 0; i < state.assets.length; i++) {
      if (state.assets[i].name === name) return state.assets[i].browser_download_url;
    }
    return null;
  }

  function uriFor(fileName) {
    if (HOST.payloadMode === "remote" && HOST.remotePayloadBase) {
      return HOST.remotePayloadBase.replace(/\/$/, "") + "/" + fileName;
    }
    // local mode: serve from the repo's payloads/ dir
    return HOST.brand.pagesUrl + "payloads/" + fileName;
  }

  return {
    checkLatest: checkLatest,
    fetchPayload: fetchPayload,
    assetUrlFor: assetUrlFor,
    uriFor: uriFor,
    getState: cloneState
  };
})();