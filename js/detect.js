/* ============================================================================
   detect.js — auto-detect console + firmware from the browser User-Agent
   ----------------------------------------------------------------------------
   PS4 web browser UA examples:
     Mozilla/5.0 (PlayStation 4 5.05) AppleWebKit/605.1.15 ...
     Mozilla/5.0 (PlayStation 4 11.00) AppleWebKit/605.1.15 ...
   PS5 UA (rarely a browseable browser, but Y2JB/remote contexts may expose one):
     Mozilla/5.0 (PlayStation 5 10.01) AppleWebKit/605.1.15 ...

   Strategy:
     1. Match "PlayStation 4" / "PlayStation 5" and parse the firmware right
        after it.
     2. Fall back to manual override selects (user picks console + fw).
     3. Return { console: 'ps4'|'ps5'|null, fw: '9.00'|''|null }
   ES5-compatible: runs on the PS4's Safari-era engine.
   ============================================================================ */

var Detect = (function () {

  function detectConsole() {
    var ua = navigator.userAgent || "";
    if (/PlayStation 5/i.test(ua)) return "ps5";
    if (/PlayStation 4/i.test(ua)) return "ps4";
    // also match PSVR/remote names that carry the console tag
    if (/PS5/i.test(ua)) return "ps5";
    if (/PS4/i.test(ua)) return "ps4";
    return null;
  }

  function detectFirmware(consoleType) {
    var ua = navigator.userAgent || "";
    var re;
    if (consoleType === "ps5") re = /PlayStation 5[)\s]([\d.]+)/i;
    else if (consoleType === "ps4") re = /PlayStation 4[)\s]([\d.]+)/i;
    else re = /PlayStation [45][)\s]([\d.]+)/i;
    var m = ua.match(re);
    if (m && m[1]) return normalizeFw(m[1]);
    // broader fallback: any x.yy token in the UA platform section
    m = ua.match(/(?:\(|\s)(\d+\.\d+)/);
    if (m && (consoleType === "ps4" || consoleType === "ps5")) return normalizeFw(m[1]);
    return "";
  }

  /* Resolve the chain entry for a console+firmware using HOST matrix ranges. */
  function resolveChain(consoleType, fw) {
    if (!consoleType || !fw) return null;
    var ranges = consoleType === "ps4" ? HOST.ps4.ranges : HOST.ps5.ranges;
    var n = fwToNum(fw);
    for (var i = 0; i < ranges.length; i++) {
      var r = ranges[i];
      if (n >= fwToNum(r.low) && n <= fwToNum(r.high)) {
        // explicit per-fw override wins (respect its status: full/userland/waiting)
        var overrideMap = consoleType === "ps4" ? HOST.ps4.stageOverride : HOST.ps5.stageOverride;
        if (overrideMap && overrideMap[fw]) {
          var ov = overrideMap[fw];
          return {
            low: r.low, high: r.high, chain: "override",
            chainName: ov.chainName || "Custom chain",
            status: ov.status || r.status,
            override: ov
          };
        }
        return { low: r.low, high: r.high, chain: r.chain, chainName: r.chainName, status: r.status };
      }
    }
    return null; // unknown firmware
  }

  function isJailbreakable(chain) {
    return !!(chain && chain.status === "full");
  }

  return {
    detectConsole: detectConsole,
    detectFirmware: detectFirmware,
    resolveChain: resolveChain,
    isJailbreakable: isJailbreakable
  };
})();