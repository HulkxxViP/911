# ============================================================================
# update-goldhen.ps1 — fetch the latest GoldHEN release assets into payloads/
# ----------------------------------------------------------------------------
# Queries the official GoldHEN GitHub release API and downloads every binary
# asset (goldhen.bin, payloads.json, ...) into the payloads/ folder.
# Usage:  powershell -ExecutionPolicy Bypass -File tools\update-goldhen.ps1
# ============================================================================

$ErrorActionPreference = "Stop"
$Repo = "GoldHEN/GoldHEN"
$Api  = "https://api.github.com/repos/$Repo/releases/latest"
$Dest = Join-Path $PSScriptRoot "..\payloads"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

Write-Host "[HULK] Fetching latest GoldHEN release info..." -ForegroundColor Green
try {
    $Headers = @{ "Accept" = "application/vnd.github+json" }
    $Release = Invoke-RestMethod -Uri $Api -Headers $Headers -TimeoutSec 30
} catch {
    Write-Warning "GitHub API failed: $($_.Exception.Message)"
    Write-Host "Falling back to latest tag lookup..." -ForegroundColor Yellow
    $Tags = Invoke-RestMethod -Uri "https://api.github.com/repos/$Repo/tags?per_page=1" -Headers @{ "Accept" = "application/vnd.github+json" } -TimeoutSec 30
    Write-Host "Latest tag: $($Tags[0].name)"
    exit 1
}

$Tag = $Release.tag_name
Write-Host "Latest release: $Tag" -ForegroundColor Green

$Downloaded = 0
if ($Release.assets -and $Release.assets.Count -gt 0) {
    foreach ($Asset in $Release.assets) {
        $Name = $Asset.name
        $Url  = $Asset.browser_download_url
        $Out  = Join-Path $Dest $Name
        Write-Host "  Downloading $Name ..." -ForegroundColor Cyan
        Invoke-WebRequest -Uri $Url -OutFile $Out -TimeoutSec 120
        $Downloaded++
    }
} else {
    Write-Host "No binary assets on this release; pulling repo tarball..." -ForegroundColor Yellow
    $Tarball = "https://github.com/$Repo/archive/refs/heads/main.zip"
    $Out = Join-Path $Dest "goldhen-src.zip"
    Invoke-WebRequest -Uri $Tarball -OutFile $Out -TimeoutSec 120
    Write-Host "  Saved source tarball to $Out"
    $Downloaded++
}

# Persist the resolved version so the host page can show it
$VersionFile = Join-Path $Dest "version.txt"
Set-Content -Path $VersionFile -Value $Tag -Encoding UTF8

Write-Host ""
Write-Host "[HULK] Done. $Downloaded file(s) saved to payloads/ (release $Tag)." -ForegroundColor Green
Write-Host "Run: git add payloads/ && git commit -m 'Update GoldHEN to $Tag'"