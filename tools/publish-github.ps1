# ============================================================================
# tools/publish-github.ps1 — publish this host to GitHub Pages
# ----------------------------------------------------------------------------
# Step 1 (choose ONE):
#   A) Install the GitHub CLI and log in:
#        winget install GitHub.cli
#        gh auth login
#      then run this script straight away.
#   B) Or create the empty repo in the browser first:
#        https://github.com/new  ->  name: 911
#      then run this script — it will only need to push.
#
# Step 2:
#   powershell -ExecutionPolicy Bypass -File tools\publish-github.ps1
# ============================================================================

$ErrorActionPreference = "Stop"
$RepoName = "911"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")

Push-Location $Root

if (-not (Test-Path ".git")) {
    Write-Host "[HULK] git init..." -ForegroundColor Green
    git init
    git branch -M main
}

# 1) Create remote (only if the repo does not exist yet)
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    if (Get-Command gh -ErrorAction SilentlyContinue) {
        Write-Host "[HULK] Creating GitHub repo with gh..." -ForegroundColor Green
        gh repo create $RepoName --public --source . --push
    } else {
        Write-Host "[HULK] gh CLI not installed."
        Write-Host "Please create the repo at https://github.com/new (name: $RepoName, Public, no README),"
        $user = Read-Host "then enter your GitHub username"
        git remote add origin "https://github.com/$user/$RepoName.git"
        git push -u origin main
    }
} else {
    Write-Host "[HULK] Remote already set: $remote" -ForegroundColor Green
    git push -u origin main
}

# 2) Enable GitHub Pages (deploy from main branch, root folder)
if (Get-Command gh -ErrorAction SilentlyContinue) {
    Write-Host "[HULK] Enabling GitHub Pages..." -ForegroundColor Green
    try {
        gh api -X POST "repos/$env:GITHUB_ACTOR/$RepoName/pages" `
            -f "source[branch]=main" -f "source[path]=/" 2>$null
    } catch {
        # demo-mode fallback: derive the owner from the remote URL
        $owner = (git remote get-url origin 2>$null) -replace ".*github.com[:/]([^/]+)/.*", '$1'
        if ($owner -and $owner -ne $RepoName) {
            gh api -X POST "repos/$owner/$RepoName/pages" `
                -f "source[branch]=main" -f "source[path]=/" 2>$null
        }
    }
}

Pop-Location
Write-Host ""
Write-Host "[HULK] Done. Your host will be live at:" -ForegroundColor Green
$owner2 = (git remote get-url origin 2>$null) -replace ".*github.com[:/]([^/]+)/.*", '$1'
Write-Host "      https://$owner2.github.io/$RepoName/" -ForegroundColor Cyan
Write-Host "Pages can take a minute or two to build."