#!/usr/bin/env bash
# ============================================================================
# update-goldhen.sh — fetch the latest GoldHEN release assets into payloads/
# Bash twin of update-goldhen.ps1 (for Git Bash / WSL / Linux).
# Usage: bash tools/update-goldhen.sh
# ============================================================================
set -euo pipefail

REPO="GoldHEN/GoldHEN"
API="https://api.github.com/repos/$REPO/releases/latest"
DEST="$(cd "$(dirname "$0")/.." && pwd)/payloads"
mkdir -p "$DEST"

echo "[HULK] Fetching latest GoldHEN release info..."
if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required." >&2; exit 1
fi

RELEASE="$(curl -fsSL -H "Accept: application/vnd.github+json" "$API" || true)"
if [ -z "$RELEASE" ]; then
  echo "[WARN] GitHub API failed; using tag fallback." >&2
  curl -fsSL -H "Accept: application/vnd.github+json" "https://api.github.com/repos/$REPO/tags?per_page=1" || true
  exit 1
fi

TAG="$(printf '%s' "$RELEASE" | grep -o '"tag_name": *"[^"]*"' | head -1 | sed 's/.*: *"//;s/"$//')"
echo "[HULK] Latest release: $TAG"

ASSETS="$(printf '%s' "$RELEASE" | grep -o '"browser_download_url": *"[^"]*"' | sed 's/.*: *"//;s/"$//')"
COUNT=0
if [ -n "$ASSETS" ]; then
  while IFS= read -r URL; do
    NAME="$(basename "$URL")"
    echo "  Downloading $NAME ..."
    curl -fsSL "$URL" -o "$DEST/$NAME"
    COUNT=$((COUNT+1))
  done <<< "$ASSETS"
else
  echo "[WARN] No binary assets; pulling repo tarball..."
  curl -fsSL "https://github.com/$REPO/archive/refs/heads/main.zip" -o "$DEST/goldhen-src.zip"
  COUNT=1
fi

echo "$TAG" > "$DEST/version.txt"
echo "[HULK] Done. $COUNT file(s) saved to payloads/ (release $TAG)."