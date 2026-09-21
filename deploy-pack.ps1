# ==============================================================================
# SCRIPT ĐÓNG GÓI TRỌN GÓI DỰ ÁN VBACE ENGLISH (FRONTEND + BACKEND) CHO SOMEE & AZURE
# ==============================================================================

$ErrorActionPreference = "Stop"

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   BAT DAU DONG GOI VBACE ENGLISH CHO SOMEE & AZURE   " -ForegroundColor Yellow
Write-Host "=======================================================`n" -ForegroundColor Cyan

$rootDir = $PSScriptRoot
if (-not $rootDir) { $rootDir = Get-Location }

$frontendDir = Join-Path $rootDir "Frontend"
$backendProj = Join-Path $rootDir "Backend\VBaceEnglish.Api\VBaceEnglish.Api.csproj"
$publishDir = Join-Path $rootDir "publish_output"
$zipFile = Join-Path $rootDir "VBaceEnglish_Deploy_Package.zip"

# 1. BUILD FRONTEND & DONG BO VAO WWWROOT
Write-Host "[1/4] Dang build Frontend va dong bo vao Backend wwwroot..." -ForegroundColor Green
Set-Location $frontendDir
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[LOI] Build Frontend that bai!" -ForegroundColor Red
    exit 1
}
Set-Location $rootDir

# Copy truc tiep bang lenh he dieu hanh, khong dung file js trung gian
$backendWwwroot = Join-Path $rootDir "Backend\VBaceEnglish.Api\wwwroot"
if (-not (Test-Path $backendWwwroot)) { New-Item -ItemType Directory -Path $backendWwwroot -Force | Out-Null }
Copy-Item -Path "$frontendDir\dist\*" -Destination $backendWwwroot -Recurse -Force

# 2. XOA THU MUC PUBLISH CU NEU CO
if (Test-Path $publishDir) {
    Write-Host "`n[2/4] Don dep thu muc publish cu..." -ForegroundColor Green
    Remove-Item -Path $publishDir -Recurse -Force
}

# 3. PUBLISH BACKEND ASP.NET CORE WEB API
Write-Host "`n[3/4] Dang bien dich va publish Backend Web API sang Release..." -ForegroundColor Green
dotnet publish $backendProj -c Release -o $publishDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[LOI] Publish Backend that bai!" -ForegroundColor Red
    exit 1
}

# 4. KIEM TRA CAC TEP THIET YEU
Write-Host "`n[4/4] Kiem tra cac tep tin thiet yeu trong goi publish..." -ForegroundColor Green

$indexHtml = Join-Path $publishDir "wwwroot\index.html"
$webConfig = Join-Path $publishDir "web.config"
$appSettings = Join-Path $publishDir "appsettings.json"

if (-not (Test-Path $indexHtml)) {
    Write-Host "[CANH BAO] Khong tim thay wwwroot\index.html! Dang copy thu cong..." -ForegroundColor Yellow
    Copy-Item -Path (Join-Path $frontendDir "dist\*") -Destination (Join-Path $publishDir "wwwroot") -Recurse -Force
}

# Dam bao web.config luon co mat cho Somee IIS
$sourceWebConfig = Join-Path $rootDir "Backend\VBaceEnglish.Api\web.config"
if (Test-Path $sourceWebConfig) {
    Copy-Item -Path $sourceWebConfig -Destination $webConfig -Force
}

# NEN THANH TEP ZIP CHO SOMEE / AZURE
if (Test-Path $zipFile) {
    Remove-Item -Path $zipFile -Force
}
Write-Host "Dang nen thanh tep zip: VBaceEnglish_Deploy_Package.zip..." -ForegroundColor Cyan
Compress-Archive -Path "$publishDir\*" -DestinationPath $zipFile -Force

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "  DA DONG GOI HOAN TAT THANH CONG 100%! " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "1. Thu muc deploy day du: $publishDir" -ForegroundColor White
Write-Host "2. Tep zip san sang upload: $zipFile" -ForegroundColor Yellow
Write-Host "   -> Ban co the upload file zip nay truc tiep len Somee File Manager hoac Azure!`n" -ForegroundColor White
