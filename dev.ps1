param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$ViteArgs
)

$projectDir = $PSScriptRoot
$devDir = 'C:\WhensDay_modules'
$excludeDirs = @('node_modules', 'dist', '.git', '.claude')
$excludeFileExtensions = @('.ps1', '.cmd')

if (!(Test-Path "$devDir\node_modules\vite\bin\vite.js")) {
  Write-Host "Missing dependencies in $devDir. Install them there first." -ForegroundColor Red
  exit 1
}

function Sync-ProjectFiles {
  Write-Host '[sync] Syncing files...' -ForegroundColor Cyan
  robocopy $projectDir $devDir /E /XD $excludeDirs /XF *.ps1 *.cmd /NFL /NDL /NJH /NJS /NC /NS | Out-Null
  if ($LASTEXITCODE -gt 7) {
    Write-Host '[sync] Failed' -ForegroundColor Red
    exit 1
  }

  if (Test-Path "$projectDir\.env") {
    Copy-Item "$projectDir\.env" "$devDir\.env" -Force
  }

  Write-Host '[sync] Complete' -ForegroundColor Green
}

function Should-SkipPath($relativePath) {
  foreach ($dir in $excludeDirs) {
    if ($relativePath -like "$dir*" -or $relativePath -like "*\$dir\*") {
      return $true
    }
  }

  foreach ($extension in $excludeFileExtensions) {
    if ($relativePath.EndsWith($extension, [System.StringComparison]::OrdinalIgnoreCase)) {
      return $true
    }
  }

  return $false
}

function Sync-ChangedPath($sourcePath) {
  $relativePath = $sourcePath.Substring($projectDir.Length).TrimStart('\')
  if (!$relativePath -or (Should-SkipPath $relativePath)) {
    return
  }

  $destinationPath = Join-Path $devDir $relativePath

  if (Test-Path $sourcePath -PathType Container) {
    New-Item -ItemType Directory -Force -Path $destinationPath | Out-Null
    return
  }

  if (Test-Path $sourcePath -PathType Leaf) {
    $destinationDir = Split-Path -Parent $destinationPath
    if (!(Test-Path $destinationDir)) {
      New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
    }
    Copy-Item $sourcePath $destinationPath -Force -ErrorAction SilentlyContinue
    return
  }

  if (Test-Path $destinationPath) {
    Remove-Item $destinationPath -Force -Recurse -ErrorAction SilentlyContinue
  }
}

Sync-ProjectFiles

$watcher = New-Object System.IO.FileSystemWatcher($projectDir)
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true
$watcher.NotifyFilter = [IO.NotifyFilters]::FileName -bor [IO.NotifyFilters]::DirectoryName -bor [IO.NotifyFilters]::LastWrite

$action = {
  Sync-ChangedPath $Event.SourceEventArgs.FullPath
}

Register-ObjectEvent $watcher Created -SourceIdentifier 'WD_CREATED' -Action $action | Out-Null
Register-ObjectEvent $watcher Changed -SourceIdentifier 'WD_CHANGED' -Action $action | Out-Null
Register-ObjectEvent $watcher Renamed -SourceIdentifier 'WD_RENAMED' -Action $action | Out-Null
Register-ObjectEvent $watcher Deleted -SourceIdentifier 'WD_DELETED' -Action $action | Out-Null

Write-Host ''
Write-Host 'WHENSDAY dev server  -> http://localhost:5173' -ForegroundColor Magenta
Write-Host '(Ctrl+C to stop)' -ForegroundColor Gray
Write-Host ''

Push-Location $devDir
try {
  node "node_modules\vite\bin\vite.js" --config vite.config.mjs @ViteArgs
} finally {
  Pop-Location
  Unregister-Event 'WD_CREATED' -ErrorAction SilentlyContinue
  Unregister-Event 'WD_CHANGED' -ErrorAction SilentlyContinue
  Unregister-Event 'WD_RENAMED' -ErrorAction SilentlyContinue
  Unregister-Event 'WD_DELETED' -ErrorAction SilentlyContinue
  $watcher.Dispose()
  Write-Host "`n[done] Dev server stopped." -ForegroundColor Yellow
}
