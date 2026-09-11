# HULK PSx Jailbreak Host — Payloads

This folder holds the payload binaries that the host serves and caches
(GoldHEN `goldhen.bin`, `payloads.json`, PS5 `p2jb.js` / `elfldr`, ...).

## How to populate it

**One command:**

```powershell
powershell -ExecutionPolicy Bypass -File tools\update-goldhen.ps1
```

or (Git Bash / WSL / Linux):

```bash
bash tools/update-goldhen.sh
```

This queries the official [GoldHEN](https://github.com/GoldHEN/GoldHEN) GitHub
release API and downloads every binary asset into this folder. The host page
picks them up automatically via `js/goldhen.js` and caches them on the device.

## Manual placement

You can also drop files here by hand. The host looks up these names
(see `js/config.js` below the matrix):

| File | Used by |
|------|---------|
| `goldhen.bin` | PS4 — fake-signed GoldHEN payload |
| `payloads.json` | PS4 — payload manifest (optional) |
| `hen.bin` | PS4 — classic HEN fallback |
| `p2jb.js` | PS5 — P2JB kernel payload (Gezine / matem6 port) |
| `elfldr_1320_v5.elf` | PS5 — ELF loader for Y2JB 1.3/1.4 flows |
| `kstuff_payload.elf` | PS5 — optional kstuff |

**Note on binary payloads in git:** `*.bin` / `*.elf` are git-ignored by
default (`.gitignore`) because they are large. Either:
- fetch them with the update scripts on the machine that serves the host, or
- force-add them if you want them hosted on GitHub Pages (`git add -f payloads/*.bin`).