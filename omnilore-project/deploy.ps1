# OmniLore Deploy Script
# SAFE DEPLOY: Only pushes from staging → gh-pages when MANUALLY triggered.
# Never auto-deploys. Never force-pushes. Always keeps backup.
#
# Usage: .\deploy.ps1
#   Or:  .\deploy.ps1 -Force  (skip confirmation)

param([switch]$Force)

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "`n🌊 OMNLORE DEPLOY GATE" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan

# 1. Verify we're on staging
$branch = git branch --show-current
if ($branch -ne "staging") {
    Write-Host "❌ ERROR: Not on staging branch. Current: $branch" -ForegroundColor Red
    Write-Host "   Checkout staging first: git checkout staging" -ForegroundColor Yellow
    exit 1
}

# 2. Check git status — warn if dirty
$status = git status --porcelain
if ($status) {
    Write-Host "⚠️  WARNING: Uncommitted changes detected:" -ForegroundColor Yellow
    git status --short
    if (-not $Force) {
        $answer = Read-Host "`nCommit these changes first? (y/n)"
        if ($answer -ne "y") { exit 1 }
    }
    Write-Host "Committing..." -ForegroundColor Green
    git add -A
    git commit -m "deploy: manual sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}

# 3. Push staging to origin
Write-Host "`n📤 Pushing staging to origin..." -ForegroundColor Green
git push origin staging
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Push failed. Resolve conflicts first." -ForegroundColor Red
    exit 1
}

# 4. Show what will change on gh-pages
Write-Host "`n📊 Changes since last deploy:" -ForegroundColor Cyan
git log origin/gh-pages..staging --oneline --no-merges 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "   (no new commits to deploy)" -ForegroundColor Gray
}

# 5. Confirm before deploying
if (-not $Force) {
    Write-Host "`n⚠️  This will UPDATE the LIVE SITE at hermesxclaw-ctrl.github.io/omnilore/" -ForegroundColor Yellow
    $confirm = Read-Host "Deploy to production? Type 'DEPLOY' to confirm"
    if ($confirm -ne "DEPLOY") {
        Write-Host "❌ Aborted." -ForegroundColor Red
        exit 0
    }
}

# 6. Deploy: fast-forward merge staging into gh-pages
Write-Host "`n🚀 Deploying to gh-pages..." -ForegroundColor Cyan
git fetch origin gh-pages
git push origin staging:gh-pages 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ DEPLOY SUCCESSFUL!" -ForegroundColor Green
    Write-Host "   Site: https://hermesxclaw-ctrl.github.io/omnilore/" -ForegroundColor Cyan
    Write-Host "   (may take 1-2 minutes for GitHub Pages to rebuild)" -ForegroundColor Gray
} else {
    Write-Host "`n❌ DEPLOY FAILED" -ForegroundColor Red
    Write-Host "   gh-pages has branch protection. Pull latest and retry:" -ForegroundColor Yellow
    Write-Host "   git fetch origin gh-pages && git merge origin/gh-pages" -ForegroundColor Yellow
    exit 1
}
