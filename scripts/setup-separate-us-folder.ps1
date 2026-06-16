# SparkStage US - Setup Separate Folder Script
# This script helps configure the copied sparkstageus folder

param(
    [string]$SourceFolder = "C:\SparkDoku\sparkstage",
    [string]$TargetFolder = "C:\SparkDoku\sparkstageus"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  SparkStage US - Separate Folder Setup" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if target folder exists
if (-not (Test-Path $TargetFolder)) {
    Write-Host "[X] Error: Target folder not found: $TargetFolder" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please copy the folder first:" -ForegroundColor Yellow
    Write-Host "  Copy-Item -Recurse $SourceFolder $TargetFolder" -ForegroundColor White
    exit 1
}

Write-Host "[OK] Target folder found: $TargetFolder" -ForegroundColor Green
Write-Host ""

# Navigate to target folder
Set-Location $TargetFolder

Write-Host "Step 1: Clean up Git history..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
if (Test-Path ".git") {
    Remove-Item -Recurse -Force .git
    Write-Host "[OK] Old git history removed" -ForegroundColor Green
} else {
    Write-Host "[!] No .git folder found (already clean)" -ForegroundColor Yellow
}

git init
git branch -M main
Write-Host "[OK] New git repository initialized" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Update package.json..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    $packageJson.name = "sparkstage-us"
    $packageJson.description = "SparkStage US Version with Stripe payments"
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"
    Write-Host "[OK] Root package.json updated" -ForegroundColor Green
} else {
    Write-Host "[!] package.json not found" -ForegroundColor Yellow
}

if (Test-Path "frontend\package.json") {
    $frontendPackage = Get-Content "frontend\package.json" | ConvertFrom-Json
    $frontendPackage.name = "sparkstage-us-frontend"
    $frontendPackage | ConvertTo-Json -Depth 10 | Set-Content "frontend\package.json"
    Write-Host "[OK] Frontend package.json updated" -ForegroundColor Green
}
Write-Host ""

Write-Host "Step 3: Installing dependencies..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host "Installing root dependencies..." -ForegroundColor White
npm install
Write-Host ""

Write-Host "Installing frontend dependencies..." -ForegroundColor White
Set-Location frontend
npm install
Write-Host ""

Write-Host "Installing Stripe packages..." -ForegroundColor White
npm install @stripe/stripe-js@^2.4.0 @stripe/react-stripe-js@^2.4.0
Write-Host ""

Set-Location ..
Write-Host "[OK] All dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 4: Setting up environment file..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
if (Test-Path ".env.us-example") {
    if (Test-Path ".env.local") {
        Write-Host "[!] .env.local already exists" -ForegroundColor Yellow
        $overwrite = Read-Host "Overwrite with US template? (y/n)"
        if ($overwrite -eq "y") {
            Copy-Item .env.us-example .env.local -Force
            Write-Host "[OK] .env.local created from US template" -ForegroundColor Green
        } else {
            Write-Host "[!] Keeping existing .env.local" -ForegroundColor Yellow
        }
    } else {
        Copy-Item .env.us-example .env.local
        Write-Host "[OK] .env.local created from US template" -ForegroundColor Green
    }
} else {
    Write-Host "[!] .env.us-example not found" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Step 5: Update dev port to 5174..." -ForegroundColor Yellow
Write-Host "----------------------------------------"
if (Test-Path "vite.config.ts") {
    $viteConfig = Get-Content "vite.config.ts" -Raw
    
    if ($viteConfig -notmatch "port:\s*5174") {
        # Add server port config if not exists
        if ($viteConfig -match "export default defineConfig\(\{") {
            $viteConfig = $viteConfig -replace "export default defineConfig\(\{", @"
export default defineConfig({
  server: {
    port: 5174
  },
"@
            Set-Content "vite.config.ts" $viteConfig
            Write-Host "[OK] Dev port set to 5174 in vite.config.ts" -ForegroundColor Green
        }
    } else {
        Write-Host "[!] Port already set to 5174" -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Create new Supabase project (US region)" -ForegroundColor White
Write-Host "   https://supabase.com/dashboard" -ForegroundColor DarkGray
Write-Host ""
Write-Host "2. Update .env.local with US Supabase credentials:" -ForegroundColor White
Write-Host "   notepad .env.local" -ForegroundColor DarkGray
Write-Host ""
Write-Host "3. Link to US Supabase project:" -ForegroundColor White
Write-Host "   supabase link --project-ref [US-PROJECT-REF]" -ForegroundColor DarkGray
Write-Host ""
Write-Host "4. Update database migrations (DOKU -> Stripe):" -ForegroundColor White
Write-Host "   Edit files in: supabase\migrations\" -ForegroundColor DarkGray
Write-Host ""
Write-Host "5. Push migrations to US database:" -ForegroundColor White
Write-Host "   npm run supabase:db:push" -ForegroundColor DarkGray
Write-Host ""
Write-Host "6. Set Supabase secrets:" -ForegroundColor White
Write-Host "   supabase secrets set STRIPE_SECRET_KEY=sk_test_xxxxx" -ForegroundColor DarkGray
Write-Host "   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx" -ForegroundColor DarkGray
Write-Host ""
Write-Host "7. Start development server:" -ForegroundColor White
Write-Host "   npm run dev  (runs on http://localhost:5174)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  - SEPARATE_FOLDER_SETUP.md (detailed guide)" -ForegroundColor Cyan
Write-Host "  - QUICKSTART_ID.md (step-by-step Indonesian)" -ForegroundColor Cyan
Write-Host "  - DATABASE_STRATEGY.md (database separation)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Current folder: $TargetFolder" -ForegroundColor DarkGray
Write-Host ""
