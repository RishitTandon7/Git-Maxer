# Razorpay Environment Variables Setup Script
# This script helps you add Razorpay credentials to .env.local

$envFile = "F:\automatic contri\dashboard\.env.local"

# Razorpay credentials
$razorpayKeyId = "NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_Rxq9o4Kicc1f3V"
$razorpaySecret = "RAZORPAY_KEY_SECRET=6njwAIIYZ5xw1HBm5l9Zu75D"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Razorpay Setup for GitMaxer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path $envFile) {
    Write-Host "Found .env.local file" -ForegroundColor Green
    
    # Read current content
    $content = Get-Content $envFile -Raw
    
    # Check if Razorpay keys already exist
    if ($content -match "NEXT_PUBLIC_RAZORPAY_KEY_ID") {
        Write-Host "Razorpay keys already exist in .env.local" -ForegroundColor Yellow
        Write-Host ""
        $overwrite = Read-Host "Do you want to update them? (y/n)"
        
        if ($overwrite -eq "y" -or $overwrite -eq "Y") {
            # Remove old keys
            $content = $content -replace "NEXT_PUBLIC_RAZORPAY_KEY_ID=.*", $razorpayKeyId
            $content = $content -replace "RAZORPAY_KEY_SECRET=.*", $razorpaySecret
            Set-Content -Path $envFile -Value $content
            Write-Host "Updated Razorpay credentials" -ForegroundColor Green
        }
        else {
            Write-Host "Skipped updating credentials" -ForegroundColor Yellow
        }
    }
    else {
        # Append new keys
        Add-Content -Path $envFile -Value "`n# Razorpay Live Credentials"
        Add-Content -Path $envFile -Value $razorpayKeyId
        Add-Content -Path $envFile -Value $razorpaySecret
        Write-Host "Added Razorpay credentials to .env.local" -ForegroundColor Green
    }
}
else {
    Write-Host ".env.local not found!" -ForegroundColor Red
    Write-Host "Please create the file manually and add the credentials." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Verify your .env.local file" -ForegroundColor White
Write-Host "2. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "3. Test payment at: http://localhost:3000/pricing" -ForegroundColor White
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Razorpay credentials:" -ForegroundColor Green
Write-Host "  Key ID: rzp_live_Rxq9o4Kicc1f3V" -ForegroundColor White
Write-Host "  Payment Link: https://razorpay.me/@rishittandon" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
