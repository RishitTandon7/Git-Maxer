# 🚀 GitHub Actions Cron Setup Script
# This script helps you set up unlimited FREE cron jobs

Write-Host "🎯 GitMaxer - Unlimited FREE Cron Jobs Setup" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Generate Secure Secret
Write-Host "📝 Step 1: Generating secure CRON_SECRET..." -ForegroundColor Yellow
$cronSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % { [char]$_ })
Write-Host "✅ Generated: $cronSecret" -ForegroundColor Green
Write-Host ""

# Step 2: Get Vercel URL
Write-Host "🌐 Step 2: Enter your Vercel deployment URL" -ForegroundColor Yellow
Write-Host "Example: https://git-maxer.vercel.app" -ForegroundColor Gray
$vercelUrl = Read-Host "Vercel URL (without /api/cron)"
$vercelCronUrl = "$vercelUrl/api/cron"
Write-Host ""

# Step 3: Display GitHub Secrets Instructions
Write-Host "🔐 Step 3: Add these secrets to GitHub" -ForegroundColor Yellow
Write-Host "Go to: https://github.com/rishittandon7/Git-Maxer/settings/secrets/actions" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add Secret #1:" -ForegroundColor White
Write-Host "  Name:  CRON_SECRET" -ForegroundColor Green
Write-Host "  Value: $cronSecret" -ForegroundColor Green
Write-Host ""
Write-Host "Add Secret #2:" -ForegroundColor White
Write-Host "  Name:  VERCEL_CRON_URL" -ForegroundColor Green
Write-Host "  Value: $vercelCronUrl" -ForegroundColor Green
Write-Host ""

# Step 4: Save to file for reference
$configFile = "f:\automatic contri\cron-config.txt"
@"
GitMaxer Cron Configuration
============================
Generated: $(Get-Date)

CRON_SECRET: $cronSecret
VERCEL_CRON_URL: $vercelCronUrl

GitHub Secrets:
1. Go to: https://github.com/rishittandon7/Git-Maxer/settings/secrets/actions
2. Add CRON_SECRET = $cronSecret
3. Add VERCEL_CRON_URL = $vercelCronUrl

Vercel Environment Variables:
1. Go to: https://vercel.com/[your-project]/settings/environment-variables
2. Add CRON_SECRET = $cronSecret

Next Steps:
1. Add the secrets to GitHub (see above)
2. Add CRON_SECRET to Vercel environment variables
3. Push changes: git push origin main
4. Check GitHub Actions: https://github.com/rishittandon7/Git-Maxer/actions
"@ | Out-File -FilePath $configFile -Encoding UTF8

Write-Host "💾 Configuration saved to: $configFile" -ForegroundColor Green
Write-Host ""

# Step 5: Offer to open GitHub
Write-Host "🚀 Step 4: Ready to add secrets to GitHub?" -ForegroundColor Yellow
$openGithub = Read-Host "Open GitHub secrets page? (y/n)"
if ($openGithub -eq 'y') {
    Start-Process "https://github.com/rishittandon7/Git-Maxer/settings/secrets/actions"
    Write-Host "✅ Opened GitHub in browser" -ForegroundColor Green
}
Write-Host ""

# Step 6: Git commands
Write-Host "📦 Step 5: Push changes to GitHub" -ForegroundColor Yellow
Write-Host "Run these commands:" -ForegroundColor Cyan
Write-Host ""
Write-Host 'cd "f:\automatic contri"' -ForegroundColor White
Write-Host 'git add .github/workflows/ *.md dashboard/vercel.json' -ForegroundColor White
Write-Host 'git commit -m "feat: Add unlimited FREE cron jobs via GitHub Actions"' -ForegroundColor White
Write-Host 'git push origin main' -ForegroundColor White
Write-Host ""

$pushNow = Read-Host "Execute git commands now? (y/n)"
if ($pushNow -eq 'y') {
    Set-Location "f:\automatic contri"
    git add .github/workflows/ *.md dashboard/vercel.json
    git commit -m "feat: Add unlimited FREE cron jobs via GitHub Actions"
    git push origin main
    Write-Host "✅ Changes pushed to GitHub!" -ForegroundColor Green
}
else {
    Write-Host "⏭️  Skipped git push. Run commands manually later." -ForegroundColor Yellow
}
Write-Host ""

# Step 7: Summary
Write-Host "🎉 Setup Complete!" -ForegroundColor Green
Write-Host "=================" -ForegroundColor Green
Write-Host ""
Write-Host "What you get:" -ForegroundColor Cyan
Write-Host "  ✅ UNLIMITED free cron jobs (GitHub Actions)" -ForegroundColor White
Write-Host "  ✅ Every 15 minutes execution capability" -ForegroundColor White
Write-Host "  ✅ 3 workflows already configured:" -ForegroundColor White
Write-Host "     - Main bot (every 15 min)" -ForegroundColor Gray
Write-Host "     - Hourly check (every hour)" -ForegroundColor Gray
Write-Host "     - Daily premium (midnight IST)" -ForegroundColor Gray
Write-Host "  ✅ Manual trigger option" -ForegroundColor White
Write-Host "  ✅ Full execution logs" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Add secrets to GitHub (if not done)" -ForegroundColor White
Write-Host "  2. Add CRON_SECRET to Vercel environment variables" -ForegroundColor White
Write-Host "  3. Check workflows: https://github.com/rishittandon7/Git-Maxer/actions" -ForegroundColor White
Write-Host ""
Write-Host "📖 Read more:" -ForegroundColor Cyan
Write-Host "  - UNLIMITED_CRON_SETUP.md" -ForegroundColor White
Write-Host "  - GITHUB_ACTIONS_SETUP.md" -ForegroundColor White
Write-Host "  - CLOUDFLARE_WORKERS_SETUP.md" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Developed by Rishit Tandon" -ForegroundColor Magenta
