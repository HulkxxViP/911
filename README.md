# HULK PSx Jailbreak Host

An auto-detecting **PS4 + PS5 jailbreak host** built for the homebrew and
console-security-research community. Open it on your console (or serve it over
your LAN) and it:

1. **Auto-detects** the console (PS4 / PS5) and firmware version from the
   browser User-Agent,
2. **Loads the correct WebKit chain** for that firmware from the matrix,
3. **Injects GoldHEN** (latest release, fetched from the official repo),
4. **Caches everything on the device** — exploit stages, payloads, settings —
   so re-triggering is instant and works offline.

---

## ⚠️ Read this first (honest facts)

- **Tethered reality:** every public PS4/PS5 jailbreak must be re-run after a
  full reboot. No web page can change that — it is a platform/kernel reality.
  What this host *does* give you is **one-time downloads**: after the first
  load, all chain files + GoldHEN + settings are cached on the console, so
  every re-trigger is instant and works with the internet off.
- **Research / education only.** Use on consoles you own. Jailbreaking voids
  your warranty, may violate the console's terms of service, and carries a
  small account-ban risk online. Stay offline after jailbreaking.
- **13.52 warning:** PS4 13.52 (June 2026) is a security-patch release. If
  you are on a jailbreakable firmware, **do not update**. Same for PS5 13.00+:
  the P2JB kernel bug is patched there.
- See [`docs/SUPPORTED_FIRMWARES.md`](docs/SUPPORTED_FIRMWARES.md) for the
  full, current matrix.

---

## Features

| Feature | Where |
|---------|-------|
| **Minimal one-button UI** — pure black, glowing **HULK** brand, terminal code box, single JAILBREAK button | `index.html` + `css/style.css` |
| PS4/PS5 + firmware auto-detection (silent, runs on load) | `js/detect.js` (UA parsing, ES5-safe for PS4 Safari) |
| Firmware → chain matrix | `js/config.js` (fully editable) |
| One-click chain runner with 4-stage terminal progress | `js/exploit.js` + code box |
| On-device caching (Cache API + localStorage) | `js/cache.js` + `service-worker.js` |
| GoldHEN release checker + payload updater | `js/goldhen.js` + `tools/update-goldhen.*` |
| PS5 Y2JB + P2JB workflow + LAN push | `tools/serve.js` (raw-TCP payload push) |
| Hidden URL override for testing: `?console=ps4&fw=9.00` | `js/main.js` |

---

## Quick start (local)

```bash
# 1. Fetch the latest GoldHEN payloads (PS4 + PS5 assets)
powershell -ExecutionPolicy Bypass -File tools\update-goldhen.ps1
# or: bash tools/update-goldhen.sh

# 2. Serve on your LAN so the console can open it
node tools/serve.js
# -> Host page : http://<your-PC-IP>:8090/
```

Open `http://<your-PC-IP>:8090/` in the PS4's web browser (or any browser to
test detection). The PS5 tab covers the Y2JB workflow.

> The `serve.js` server also exposes a raw-TCP **payload push** endpoint
> (`POST /push?host=<console-ip>&port=9021&file=goldhen.bin`) — the browser
> cannot open raw TCP sockets, so this is how GoldHEN/P2JB actually reaches
> the console for the Vue / Y2JB methods.

## Wiring the real chain files

The host is the **assembler + cache layer**; the firmware-specific chain
stages come from the community projects:

- PS4 browser chains: `karo218/ps4-exploit-host`, `halvahs/ps4exploit`
- PS4 Vue/Netctrl: `Vuemony/vue-after-free`
- PS5 Y2JB/P2JB: `Gezine/Y2JB`, `matem6/P2JB-Y2JB-Porting`, `theflow0/p2jb`

Drop them into `exploits/<console>/<chain>/userland.js` + `kernel.js`, or set
per-firmware overrides in `js/config.js`. Full details in
[`exploits/README.md`](exploits/README.md).

---

## Customizing (your name, links, version)

Everything the page shows is driven by `js/config.js`:

```js
brand: {
  title: "HULK PSx Jailbreak Host",
  author: "Hulk",
  version: "1.0.0",
  githubUser: "hulkxxvip",
  githubRepo: "hulkxxvip/ps4-ps5-jailbreak-host",
  pagesUrl: "https://hulkxxvip.github.io/ps4-ps5-jailbreak-host/",
  ...
}
```

Change the title/author to yours, bump the version, wire your repo, done.

---

## Publishing to GitHub Pages

```bash
git init
git add .
git commit -m "HULK PSx Jailbreak Host v1.0.0"
git branch -M main

# create the repo (needs a GitHub account + PAT or gh CLI)
gh repo create ps4-ps5-jailbreak-host --public --source . --push
# or, without gh:
git remote add origin https://github.com/<YOU>/ps4-ps5-jailbreak-host.git
git push -u origin main

# enable Pages (repo -> Settings -> Pages -> deploy from branch: main, /
```

The default `pagesUrl` in `js/config.js` already assumes
`https://<user>.github.io/ps4-ps5-jailbreak-host/`.

> **Note on payloads in git:** `*.bin` / `*.elf` are git-ignored (they're
> large). To host GoldHEN itself on GitHub Pages, run the updater and
> `git add -f payloads/` — or keep serving payloads from the LAN server and
> let Pages host only the shell. See `payloads/README.md`.

---

## Project layout

```
index.html             Host page (ES5-compatible so PS4's old browser runs it)
css/style.css          Dark gaming theme
js/config.js           ★ BRAND + firmware matrix + payload sources (edit me)
js/detect.js           Console/firmware auto-detection
js/cache.js            On-device cache layer (Cache API + localStorage)
js/goldhen.js          GoldHEN release check + payload loader
js/exploit.js          4-stage chain runner
js/ui.js               Minimal terminal UI (code box logger)
js/main.js             Boot: silent auto-detect + single JAILBREAK button
service-worker.js      Offline shell cache (optional, modern browsers)
manifest.json          PWA manifest
payloads/              GoldHEN + PS5 payloads (populate via tools/update-*)
exploits/              Chain stage files (wire in from community repos)
tools/update-goldhen.ps1 / .sh   Fetch latest GoldHEN release
tools/serve.js         LAN server + payload push (Node)
tools/serve.ps1        LAN launcher (Node preferred, Python fallback)
docs/SUPPORTED_FIRMWARES.md      Full firmware status matrix
```

---

## Credits & license

- **Host shell:** MIT — your name goes here, `LICENSE`.
- **GoldHEN:** by the GoldHEN project (SiSTRo & team) — its own license.
- **Chains/userland:** karo218, halvahs, theflow0, flatz, ViperFUD, Vuemony,
  Gezine, matem6, SiSTR0 and the wider scene — their licenses apply.
- Not affiliated with Sony Interactive Entertainment.

Built for research, archiving and the love of the scene. Keep the credits, and
stay on your current firmware. 💚