/* ============================================================================
   HULK PSx Jailbreak Host — Central configuration
   ----------------------------------------------------------------------------
   Edit this file to customize the host: branding, GitHub links, payload
   sources and the firmware matrix. Everything on the page reads from here.

   NOTE ON EXPLOIT FILES:
   This host is an *assembler + cache layer*. The actual WebKit/kernel chain
   files are open-source community research (theflow, karo218, flatz, SiSTRo,
   Gezine, matem6, ...). Place them under exploits/ or point STAGE_URL_OVERRIDE
   at a mirror. See exploits/README.md and docs/SUPPORTED_FIRMWARES.md.
   ============================================================================ */

var HOST = {

  /* --- branding (used all over the UI) --- */
  brand: {
    title: "HULK PSx Jailbreak Host",
    shortTitle: "HULK PSx",
    author: "Hulk",
    version: "1.0.0",
    tagline: "Auto-detect \u00b7 One-Click Chains \u00b7 GoldHEN Cached On Device",
    githubUser: "hulkxxvip",
    githubRepo: "HulkxxViP/911",
    pagesUrl: "https://hulkxxvip.github.io/911/",
    year: 2026
  },

  /* --- GoldHEN / payload source --- */
  goldhen: {
    repo: "GoldHEN/GoldHEN",
    apiLatest: "https://api.github.com/repos/GoldHEN/GoldHEN/releases/latest",
    // When the release has no assets (source-only), fall back to the latest
    // commit tarball — the updater tool resolves this too.
    fallbackUrl: "https://github.com/GoldHEN/GoldHEN/archive/refs/heads/main.zip",
    localDir: "payloads/"
  },

  /* --- payload mode: local (payloads/ folder) or remote base URL --- */
  payloadMode: "local",          // "local" | "remote"
  remotePayloadBase: "",         // e.g. "https://example.com/ps4/payloads/"

  /* ------------------------------------------------------------------
     PS4 firmware matrix.
     chain values:
       "webkit"   -> in-browser WebKit + kernel chain (classic hosts)
       "vue"      -> PS Vue userland + kernel (Lapse / Netctrl) over LAN
       "waiting"  -> NO public jailbreak yet (userland only or nothing)
     ------------------------------------------------------------------ */
  ps4: {
    ranges: [
      { low: "5.05", high: "6.72", chain: "webkit", chainName: "WebKit + kernel (HEN-era)", status: "full" },
      { low: "7.00", high: "7.55", chain: "webkit", chainName: "WebKit + LPE", status: "full" },
      { low: "7.60", high: "7.61", chain: "webkit", chainName: "WebKit + LPE", status: "full" },
      { low: "8.00", high: "8.55", chain: "webkit", chainName: "WebKit + kernel", status: "full" },
      { low: "9.00", high: "9.00", chain: "webkit", chainName: "WebKit + kex (PPPwn-style)", status: "full" },
      { low: "9.03", high: "9.60", chain: "vue", chainName: "Vue userland + kernel", status: "userland" },
      { low: "10.00", high: "12.02", chain: "vue", chainName: "Vue + Lapse / Netctrl", status: "full" },
      { low: "12.50", high: "13.00", chain: "vue", chainName: "Vue + Netctrl", status: "full" },
      { low: "13.02", high: "13.52", chain: "waiting", chainName: "No public kernel exploit yet", status: "waiting" }
    ],
    /* Per-firmware stage overrides. Two forms:
       1. MIRROR (recommended): a verified community chain page that auto-runs
          on load. The JAILBREAK button hands the console browser to it:
            { type: "mirror", url: "https://...", chainName: "...", status: "full" }
       2. STAGE FILES: local userland.js/kernel.js under exploits/ (or a remote
          urlTemplate) for chains that support split-stage loading.
       When an override exists it takes precedence over the generic loader. */
    stageOverride: {
      /* PS4 9.00 — PSFree (CVE-2022-22620) + Lapse kernel.
         Self-contained app, auto-runs on page load (verified live 2026-09). */
      "9.00": { type: "mirror", url: "https://bekahen.github.io/900/", chainName: "PSFree + Lapse kernel (mirror)", status: "full" }
    },
    /* Payload file names looked up inside payloads/ (or remote base). */
    payloads: {
      goldhenBin: "goldhen.bin",        // PS4 GoldHEN (fake-signed)
      goldhenJson: "payloads.json",     // optional payload map
      henBin: "hen.bin"                 // classic HEN fallback
    }
  },

  /* ------------------------------------------------------------------
     PS5 matrix — everything runs via Y2JB (modded YouTube / WebKit).
     Kernel stage: Lapse (<=10.01), Poopsploit/SlopKit (7.00-12.00),
     P2JB (9.60-12.70, slow "patience to jailbreak").
     ------------------------------------------------------------------ */
  ps5: {
    ranges: [
      { low: "4.03", high: "5.50", chain: "umtx", chainName: "Y2JB userland + UMTX2", status: "full" },
      { low: "5.51", high: "6.99", chain: "waiting", chainName: "No public route (project-specific)", status: "waiting" },
      { low: "7.00", high: "10.01", chain: "lapse", chainName: "Y2JB + Lapse / SlopKit", status: "full" },
      { low: "10.20", high: "12.70", chain: "p2jb", chainName: "Y2JB + P2JB (50 min patience)", status: "full" },
      { low: "13.00", high: "13.40", chain: "waiting", chainName: "Y2JB userland only \u2014 no public KEX", status: "waiting" }
    ],
    stageOverride: {},
    /* Y2JB / P2JB payload files served by tools/serve over LAN. */
    payloads: {
      p2jbJs: "p2jb.js",                // kernel exploit payload (Gezine/matem6)
      elfldr: "elfldr_1320_v5.elf",     // ELF loader
      kstuff: "kstuff_payload.elf"      // optional kstuff
    }
  },

  /* --- cache tuning --- */
  cache: {
    swName: "hulk-psx-host-v1",
    payloadTtlMs: 1000 * 60 * 60 * 24 * 7   // cached payload refresh window
  },

  /* --- LAN server defaults (tools/serve.*) --- */
  lan: {
    host: "0.0.0.0",
    port: 8090,
    pushPort: 9021          // Y2JB / netcatGUI listener default
  }
};

/* --- build version list helpers (used by detect + ui) --- */
function fwList(ranges) {
  var out = [];
  for (var i = 0; i < ranges.length; i++) out.push(ranges[i]);
  return out;
}

function normalizeFw(v) {
  v = String(v || "").replace(/^v/, "").trim();
  if (!v) return "";
  var m = v.match(/^(\d+)\.(\d+)/);
  if (!m) return v;
  var major = parseInt(m[1], 10), minor = parseInt(m[2], 10);
  return major + "." + (minor < 10 ? "0" + minor : minor);
}

function fwToNum(v) { return parseFloat(v); }