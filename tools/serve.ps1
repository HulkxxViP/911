# ============================================================================
# tools/serve.ps1 — LAN server launcher for the HULK PSx Jailbreak Host
# ----------------------------------------------------------------------------
# Prefers Node (tools/serve.js, which also does raw-TCP payload pushing).
# Falls back to a plain Python 3 static server (no payload-push endpoint).
# Usage:  powershell -ExecutionPolicy Bypass -File tools\serve.ps1
# ============================================================================

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

Write-Host "[HULK] Starting LAN server for $Root" -ForegroundColor Green

# 1) Node preferred
$node = Get-Command node -ErrorAction SilentlyContinue
if ($node) {
    Write-Host "[HULK] Using Node.js server (full payload-push support)." -ForegroundColor Green
    & node (Join-Path $PSScriptRoot "serve.js")
    exit $LASTEXITCODE
}

# 2) Python fallback (static only)
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) { $python = Get-Command python3 -ErrorAction SilentlyContinue }
if ($python) {
    Write-Host "[HULK] Using Python static server (no payload-push)." -ForegroundColor Yellow
    Push-Location $Root
    & $python.Source -m http.server 8090
    Pop-Location
    exit $LASTEXITCODE
}

Write-Host "[HULK] ERROR: Neither Node.js nor Python is available." -ForegroundColor Red
Write-Host "Install Node.js, or use: npx http-server -p 8090" -ForegroundColor Yellow
exit 1