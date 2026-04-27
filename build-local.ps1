$projectDir = $PSScriptRoot
$tempDir = 'C:\WhensDay_temp'
$modulesDir = 'C:\WhensDay_modules'
$excludeDirs = @('node_modules', '.git', 'dist', '.claude')

Write-Host "Mirroring source files to $tempDir..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null
robocopy $projectDir $tempDir /E /XD $excludeDirs /NFL /NDL /NJH /NJS /NC /NS | Out-Null
if ($LASTEXITCODE -gt 7) {
  Write-Host 'Source sync failed.' -ForegroundColor Red
  exit 1
}

if (Test-Path "$projectDir\.env") {
  Copy-Item "$projectDir\.env" "$tempDir\.env" -Force
}

if (!(Test-Path "$modulesDir\node_modules")) {
  Write-Host "Missing dependency cache at $modulesDir\node_modules" -ForegroundColor Red
  exit 1
}

if (!(Test-Path "$tempDir\node_modules")) {
  cmd /c "mklink /J ""$tempDir\node_modules"" ""$modulesDir\node_modules""" 2>&1 | Out-Null
}

Push-Location $tempDir
try {
  Write-Host 'Building...' -ForegroundColor Cyan
  node "node_modules\vite\bin\vite.js" build
  if ($LASTEXITCODE -ne 0) {
    Write-Host 'Build failed.' -ForegroundColor Red
    exit $LASTEXITCODE
  }
} finally {
  Pop-Location
}

Write-Host 'Copying dist to project...' -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "$projectDir\dist" | Out-Null
robocopy "$tempDir\dist" "$projectDir\dist" /MIR /NFL /NDL /NJH /NJS /NC /NS | Out-Null
if ($LASTEXITCODE -gt 7) {
  Write-Host 'Failed to copy dist back to project.' -ForegroundColor Red
  exit 1
}

Write-Host 'Build complete! dist/ is ready.' -ForegroundColor Green
