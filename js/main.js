/* ============================================================================
   main.js — boot + event wiring
   ============================================================================ */

(function () {

  function $(id) { return document.getElementById(id); }

  var state = {
    consoleType: null,   // "ps4" | "ps5" | null
    fw: "",              // normalized firmware, e.g. "9.00"
    chain: null          // resolved chain object
  };

  /* ---------- detection + UI sync ---------- */
  function performDetection(manual) {
    var consoleType = manual ? manual.consoleType : Detect.detectConsole();
    var fw = manual && manual.fw ? normalizeFw(manual.fw) : Detect.detectFirmware(consoleType);

    if (!consoleType) {
      $("detConsole").textContent = "-- (not detected)";
      $("detFirmware").textContent = "--";
      $("detStatus").textContent = "Use manual override below";
      $("detChain").textContent = "--";
      UI.log("No PlayStation console detected in the User-Agent. Use the manual override.", "warn");
      return;
    }

    state.consoleType = consoleType;
    state.fw = fw;

    $("detConsole").textContent = consoleType === "ps4" ? "PlayStation 4" : "PlayStation 5";
    $("detFirmware").textContent = fw || "unknown";

    var chain = Detect.resolveChain(consoleType, fw);
    state.chain = chain;

    if (!chain) {
      $("detStatus").textContent = "Firmware not in matrix";
      $("detStatus").style.color = "var(--amber)";
      $("detChain").textContent = "--";
      UI.log("Firmware " + (fw || "?") + " is not in the support matrix.", "warn");
      return;
    }

    $("detChain").textContent = chain.chainName +
      (Detect.isJailbreakable(chain) ? "" : " (no public KEX yet)");

    $("detStatus").textContent = Detect.isJailbreakable(chain) ? "JAILBREAKABLE" : "Not yet";
    $("detStatus").style.color = Detect.isJailbreakable(chain) ? "var(--green)" : "var(--red)";

    UI.log("Detected: " + consoleType.toUpperCase() + " " + fw + " -> " + chain.chainName + " [" + chain.chain + "]", "ok");
    Exploit.setLastFw(fw);

    // persist last known state
    CacheBox.saveSetting("lastConsole", consoleType);
    CacheBox.saveSetting("lastFw", fw);
  }

  /* ---------- manual override population ---------- */
  function populateOverrideFws() {
    var sel = $("ovFirmware");
    if (!sel) return;
    var base = state.consoleType === "ps5" ? HOST.ps5.ranges : HOST.ps4.ranges;
    var seen = {};
    sel.innerHTML = '<option value="">-- Firmware --</option>';
    if (!state.consoleType) return;
    for (var i = 0; i < base.length; i++) {
      (function (r) {
        [r.low, r.high].forEach(function (v) {
          if (!seen[v]) {
            seen[v] = true;
            var opt = document.createElement("option");
            opt.value = v;
            opt.textContent = v;
            sel.appendChild(opt);
          }
        });
      })(base[i]);
    }
    // tag the endpoints
  }

  /* ---------- run ---------- */
  function runJailbreak() {
    if (!state.consoleType || !state.fw) {
      UI.log("Cannot run: no console/firmware detected. Use the manual override.", "err");
      return;
    }
    UI.hideBanner();
    UI.log("===== JAILBREAK RUN STARTED =====", "info");
    Exploit.run(state, {});
  }

  /* ---------- GoldHEN ---------- */
  function checkGoldhen() {
    var statusEl = $("goldhenStatus");
    var resEl = $("goldhenResult");
    statusEl.textContent = "Checking GitHub API...";
    resEl.className = "goldhen-result hidden";
    GoldHen.checkLatest().then(function (info) {
      statusEl.textContent = "Latest release: " + (info.tag || "unknown");
      resEl.className = "goldhen-result";
      var html = '<div class="gh-ver">' + UI.escapeHtml(info.tag || "n/a") + "</div>";
      html += "<div>" + UI.escapeHtml(info.name || "") + "</div>";
      html += "<div>Assets found: " + info.assets.length + "</div>";
      for (var i = 0; i < info.assets.length && i < 25; i++) {
        html += '<div><code>' + UI.escapeHtml(info.assets[i].name) + "</code></div>";
      }
      if (!info.assets.length) {
        html += '<div class="notice notice-warn">No binary assets in this release — use tools/update-goldhen.ps1 which falls back to the repo tarball.</div>';
      }
      resEl.innerHTML = html;
      UI.log("GoldHEN latest: " + info.tag, "ok");
    }).catch(function (err) {
      statusEl.textContent = err.message;
      UI.log("GoldHEN check failed: " + err.message, "err");
    });
  }

  /* ---------- PS5 LAN push helpers ---------- */
  function pushToPs5(fileKey) {
    var ip = $("ps5Ip").value.trim();
    var port = parseInt($("ps5Port").value || HOST.lan.pushPort, 10);
    if (!ip) { UI.log("Enter the PS5 IP address first.", "err"); return; }
    var fileName = HOST.ps5.payloads[fileKey];
    var url = GoldHen.uriFor(fileName);
    UI.log("Pushing " + fileName + " to " + ip + ":" + port + " ...", "info");
    // Cross-origin caveat: the LAN server (tools/serve.js) exposes a POST
    // endpoint /push?host=IP&port=PORT&file=NAME that performs the raw TCP
    // push. If this page is served from the same origin (localhost:8090),
    // the push is same-origin. Otherwise the user runs it from the server.
    var xhr = new XMLHttpRequest();
    var endpoint = HOST.brand.pagesUrl + "push?host=" + encodeURIComponent(ip) +
      "&port=" + port + "&file=" + encodeURIComponent(fileName);
    xhr.open("POST", endpoint, true);
    xhr.timeout = 30000;
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;
      if (xhr.status >= 200 && xhr.status < 300) {
        UI.log("Push request accepted: " + xhr.responseText, "ok");
      } else {
        UI.log("Push failed (HTTP " + xhr.status + "). Run tools/serve.js on the same LAN and retry.", "err");
      }
    };
    xhr.onerror = function () {
      UI.log("Cannot reach LAN server. Start it: node tools/serve.js", "err");
    };
    xhr.send();
  }

  /* ---------- cache status ---------- */
  function refreshCacheStatus() {
    var el = $("cacheStatus");
    if (!el) return;
    var api = CacheBox.supportsCacheApi() ? "Cache API available" : "Cache API unavailable (using localStorage)";
    var ls = true;
    try { window.localStorage.setItem("hulkpsx:probe", "1"); window.localStorage.removeItem("hulkpsx:probe"); }
    catch (e) { ls = false; }
    el.innerHTML = api + "<br>localStorage: " + (ls ? "available" : "blocked");
  }

  /* ---------- boot ---------- */
  function init() {
    UI.bindTabs();
    UI.renderFwMap();

    // restore last settings
    state.consoleType = CacheBox.loadSetting("lastConsole", null);
    state.fw = CacheBox.loadSetting("lastFw", "");

    // restore source mode radio + remote url
    var mode = CacheBox.loadSetting("payloadMode", HOST.payloadMode);
    var radios = document.getElementsByName("srcMode");
    for (var i = 0; i < radios.length; i++) {
      radios[i].checked = (radios[i].value === mode);
    }
    if (mode === "remote") $("remoteUrlRow").className = "form-row";
    var remote = CacheBox.loadSetting("remotePayloadBase", HOST.remotePayloadBase);
    if (remote && $("remoteUrl")) $("remoteUrl").value = remote;

    // events
    $("btnAutoDetect").addEventListener("click", function () { performDetection(); });
    $("ovConsole").addEventListener("change", function () {
      var v = $("ovConsole").value;
      if (!v) { state.consoleType = null; populateOverrideFws(); return; }
      state.consoleType = v;
      populateOverrideFws();
    });
    $("ovFirmware").addEventListener("change", function () {
      var v = $("ovFirmware").value;
      if (!v) { state.fw = ""; return; }
      performDetection({ consoleType: state.consoleType || "ps4", fw: v });
    });
    $("btnRun").addEventListener("click", runJailbreak);
    $("btnClearCache").addEventListener("click", function () {
      CacheBox.clearAll();
      UI.log("Cached payloads cleared.", "warn");
      refreshCacheStatus();
    });
    $("btnClearCache2").addEventListener("click", function () {
      CacheBox.clearAll();
      UI.log("Cached payloads cleared.", "warn");
      refreshCacheStatus();
    });
    $("btnCheckGoldhen").addEventListener("click", checkGoldhen);
    $("btnPushP2JB").addEventListener("click", function () { pushToPs5("p2jbJs"); });
    $("btnPushElf").addEventListener("click", function () { pushToPs5("elfldr"); });
    $("btnSaveSettings").addEventListener("click", function () {
      var mode2 = "local";
      for (var j = 0; j < radios.length; j++) if (radios[j].checked) mode2 = radios[j].value;
      CacheBox.saveSetting("payloadMode", mode2);
      HOST.payloadMode = mode2;
      if (mode2 === "remote") HOST.remotePayloadBase = $("remoteUrl").value.trim();
      CacheBox.saveSetting("remotePayloadBase", HOST.remotePayloadBase);
      UI.log("Settings saved (payload mode: " + mode2 + ").", "ok");
    });
    $("btnClearLog").addEventListener("click", function () {
      var c = $("logConsole");
      if (c) { c.innerHTML = ""; }
      UI.log("Log cleared.", "info");
    });

    // auto detect on load
    performDetection();

    // service worker (modern browsers only — PS4 old engine just skips it)
    if (navigator.serviceWorker && navigator.serviceWorker.register) {
      navigator.serviceWorker.register("service-worker.js").then(function () {
        UI.log("Service worker registered — host shell cached for offline use.", "ok");
      }).catch(function (err) {
        UI.log("Service worker unavailable: " + err.message, "warn");
      });
    }

    refreshCacheStatus();
    UI.log("HULK PSx Jailbreak Host ready. Detection auto-ran.", "info");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();