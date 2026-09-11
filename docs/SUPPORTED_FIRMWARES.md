# Supported Firmwares — HULK PSx Jailbreak Host

Status as of **September 2026**. Public scene state changes often; re-check
before trusting a chain on a new firmware.

## PS4

| Firmware | Chain | Status |
|----------|-------|--------|
| 5.05 → 6.72 | WebKit + kernel (HEN-era) | ✅ Jailbreakable |
| 7.00 → 7.55 | WebKit + LPE | ✅ Jailbreakable |
| 7.60 → 7.61 | WebKit + LPE | ✅ Jailbreakable |
| 8.00 → 8.55 | WebKit + kernel | ✅ Jailbreakable |
| 9.00 | WebKit + kex (PPPwn-style) | ✅ Jailbreakable |
| 9.03 → 9.60 | Vue userland + kernel | ⚠️ Userland path (browser WebKit was patched after 9.00) |
| 10.00 → 12.02 | Vue + Lapse / Netctrl | ✅ Jailbreakable |
| 12.50 → 13.00 | Vue + Netctrl | ✅ Jailbreakable |
| 13.02 → 13.52 | — | ❌ No public kernel exploit (community waiting) |

**13.52 is a patch release** (June 16, 2026): Sony fixed the BD-J userland
bug and the exFAT upcase-table kernel bug reported via HackerOne. Do **not**
upgrade past your current jailbreakable firmware.

## PS5 (all via Y2JB — modded YouTube WebKit)

| Firmware | Chain | Status |
|----------|-------|--------|
| 4.03 → 5.50 | Y2JB userland + UMTX2 | ✅ Jailbreakable |
| 5.51 → 6.99 | — | ❌ No public route (project-specific coverage gap) |
| 7.00 → 10.01 | Y2JB + Lapse / SlopKit | ✅ Jailbreakable |
| 10.20 → 12.70 | Y2JB + P2JB | ✅ Jailbreakable (slow — "Patience to Jailbreak", 10–50 min) |
| 13.00 → 13.40 | Y2JB userland only | ❌ No public kernel exploit yet |

**PS5 13.00+:** Sony patched the P2JB kernel bug in 13.00. Userland (Y2JB)
still runs there — homebrew/emulators possible via Luac0re-entry games — but
no full kernel jailbreak is public.

## Tethered reality

Every public chain on both consoles is **tethered**: after a full power cycle
the console must be re-exploited. This host caches all payloads on the device
so re-triggering is instant and offline, but it cannot (and no web page can)
make the jailbreak survive a reboot. Anyone claiming a permanent/cached-full
jailbreak from a host page is either mistaken or selling something.

## Sources consulted

- karo218/ps4-exploit-host firmware matrix
- Vuemony/vue-after-free (userland 5.05–13.04; Lapse ≤12.02; Netctrl ≤13.00)
- matem6/P2JB-Y2JB-Porting and Gezine/Y2JB (PS5 9.00–12.70)
- Blog/forum coverage of PS4 13.52 patch (June 2026) and PS5 P2JB 12.70
- Reddit r/PS4Mods, r/ps4homebrew, r/PS5_Jailbreak state-of-scene posts