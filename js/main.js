/* ============================================================================
   main.js — minimal boot: auto-detect + one button
   ----------------------------------------------------------------------------
   The page is deliberately bare: black screen, one code box, one JAILBREAK
   button. Auto-detection runs silently on load; the button runs the chain.

   Power feature (no UI, by design): force a console/firmware with the URL
     ?console=ps4&fw=9.00
   Useful for testing the chain mapping from a desktop browser.
   ES5-compatible (PS4 Safari-era engine).
   ============================================================================ */

(function () {

  var state = { consoleType: null, fw: "", chain: null };

  /* ---- hidden URL override: ?console=ps4&fw=9.00 ---- */
  function parseOverride() {
    var q = window.location.search || "";
    var out = { consoleType: null, fw: "" };
    if (q.indexOf("?") !== 0) return out;
    var pairs = q.slice(1).split("&");
    for (var i = 0; i < pairs.length; i++) {
      var kv = pairs[i].split("=");
      if (kv.length !== 2) continue;
      var k = decodeURIComponent(kv[0]).toLowerCase();
      var v = decodeURIComponent(kv[1]);
      if (k === "console") out.consoleType = (v.toLowerCase() === "ps5") ? "ps5" : "ps4";
      if (k === "fw") out.fw = v;
    }
    return out;
  }

  /* ---- auto-detect + resolve chain, print into the code box ---- */
  function performDetection() {
    var ov = parseOverride();
    var consoleType = ov.consoleType || Detect.detectConsole();
    var fw = ov.fw || Detect.detectFirmware(consoleType);

    if (!consoleType) {
      // fall back to the last known console saved during a previous run
      consoleType = CacheBox.loadSetting("lastConsole", null);
      fw = fw || CacheBox.loadSetting("lastFw", "");
    }

    if (!consoleType) {
      UI.status("NO CONSOLE DETECTED \u2014 open this page on your PS4/PS5 browser");
      UI.log("HULK PSx Jailbreak Host ready. Not running on a PlayStation.", "warn");
      UI.log("Tip: add ?console=ps4&fw=9.00 to the URL to force a console.", "sys");
      return;
    }

    state.consoleType = consoleType;
    state.fw = normalizeFw(fw || "");
    state.chain = Detect.resolveChain(consoleType, state.fw);

    var label = consoleType === "ps4" ? "PLAYSTATION 4" : "PLAYSTATION 5";

    if (!state.chain) {
      UI.status(label + " " + (state.fw || "?") + " \u2014 NOT IN MATRIX", "err");
      UI.log("Firmware " + (state.fw || "?") + " has no known chain on this host.", "warn");
      CacheBox.saveSetting("lastConsole", consoleType);
      return;
    }

    var jb = Detect.isJailbreakable(state.chain);
    UI.status(
      label + " " + state.fw + " \u2014 " + state.chain.chainName + (jb ? " [JAILBREAKABLE]" : " [WAITING]"),
      jb ? "ok" : "warn"
    );
    UI.log("Detected: " + label + " \u00b7 firmware " + state.fw, "ok");
    UI.log("Chain:    " + state.chain.chainName + " [" + state.chain.chain + "]", "info");
    UI.log(jb ? "Status:   Jailbreakable \u2014 press JAILBREAK." : "Status:   No public kernel exploit yet \u2014 userland only.", jb ? "ok" : "warn");

    Exploit.setLastFw(state.fw);
    CacheBox.saveSetting("lastConsole", consoleType);
    CacheBox.saveSetting("lastFw", state.fw);
  }

  /* ---- the single button ---- */
  function runJailbreak() {
    if (!state.chain) {
      UI.status("NOT READY \u2014 firmware unsupported", "err");
      UI.log("Cannot run: no jailbreakable chain for this firmware. Detection re-ran.", "err");
      performDetection();
      return;
    }
    UI.status("JAILBREAKING " + state.consoleType.toUpperCase() + " " + state.fw + " ...", "ok");
    UI.log("===== JAILBREAK RUN STARTED =====", "info");
    Exploit.run(state, {});
  }

  /* ---- boot ---- */
  function init() {
    UI.clearLog();
    UI.log(HOST.brand.title + " v" + HOST.brand.version + " \u2014 HULK ready.", "sys");
    UI.log("Author: " + HOST.brand.author + " \u00b7 " + HOST.brand.pagesUrl, "sys");

    var btn = document.getElementById("btnRun");
    if (btn) btn.addEventListener("click", runJailbreak);

    performDetection();

    // silent GoldHEN check (one line in the code box, no UI)
    GoldHen.checkLatest().then(function (info) {
      UI.log("GoldHEN latest: " + info.tag + " (" + info.assets.length + " assets)", "ok");
    }).catch(function () { /* offline / API blocked — payload cache still works */ });

    // service worker (modern browsers only — PS4 old engine skips it)
    if (navigator.serviceWorker && navigator.serviceWorker.register) {
      navigator.serviceWorker.register("service-worker.js").catch(function () {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();