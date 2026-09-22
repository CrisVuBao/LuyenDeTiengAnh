# ==============================================================================
# VBaceEnglish - Automated Deploy Package Builder
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " [VBaceEnglish] DONG GOI DU AN DEPLOY ROOT WEB API " -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$frontendDir = Join-Path $rootDir "Frontend"
$backendDir = Join-Path $rootDir "Backend\VBaceEnglish.Api"
$wwwrootDir = Join-Path $backendDir "wwwroot"
$publishDir = Join-Path $rootDir "publish_output"
$zipPath = Join-Path $rootDir "VBaceEnglish_Deploy_Package.zip"

# Buoc 1: Build Frontend (React + Vite)
Write-Host "`n[1/4] Bien dich Frontend Vite vao Backend wwwroot..." -ForegroundColor Yellow
Push-Location $frontendDir
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Loi khi bien dich Frontend Vite!"
    }
} finally {
    Pop-Location
}

# Kiem tra index.html trong wwwroot
$indexHtmlPath = Join-Path $wwwrootDir "index.html"
if (-not (Test-Path $indexHtmlPath)) {
    Write-Host "[Loi] Khong tim thay index.html trong $wwwrootDir" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Frontend da duoc build thanh cong vao wwwroot!" -ForegroundColor Green

# Buoc 2: Don dep thu muc publish cu
Write-Host "`n[2/4] Don dep thu muc publish cu..." -ForegroundColor Yellow
if (Test-Path $publishDir) {
    Remove-Item -Recurse -Force $publishDir
}
if (Test-Path $zipPath) {
    Remove-Item -Force $zipPath
}

# Buoc 3: Publish ASP.NET Core Web API (Release)
Write-Host "`n[3/4] Dang publish ASP.NET Core (.NET 10) Release..." -ForegroundColor Yellow
$projectPath = Join-Path $backendDir "VBaceEnglish.Api.csproj"
dotnet publish $projectPath -c Release -o $publishDir --nologo

if ($LASTEXITCODE -ne 0) {
    Write-Host "[Loi] Khi publish Backend .NET!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Backend .NET va wwwroot da duoc publish thanh cong!" -ForegroundColor Green

# Buoc 4: Nen thanh file ZIP deploy
Write-Host "`n[4/4] Dang nen toan bo thanh file VBaceEnglish_Deploy_Package.zip..." -ForegroundColor Yellow
Compress-Archive -Path "$publishDir\*" -DestinationPath $zipPath -Force

$zipFile = Get-Item $zipPath
$zipSizeMb = [math]::Round(($zipFile.Length / 1MB), 2)

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " HOAN THANH DONG GOI THANH CONG!" -ForegroundColor Green
Write-Host " File deploy: VBaceEnglish_Deploy_Package.zip ($zipSizeMb MB)" -ForegroundColor White
Write-Host " Vi tri: $zipPath" -ForegroundColor White
Write-Host " San sang tai len: MonsterASP.net, Somee.com hoac Azure!" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Green
