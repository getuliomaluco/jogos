param(
  [string]$ClientPath = "E:\\remote-client",
  [string]$ServerPath = "\\\\192.168.0.104\\getulio\\build3.1"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$clientSrc = Join-Path $repoRoot "client"
$serverSrc = Join-Path $repoRoot "server"
$configSrc = Join-Path $repoRoot "config.env"

function Copy-Tree {
  param(
    [string]$Source,
    [string]$Destination,
    [string[]]$ExcludeDirs = @()
  )

  if (!(Test-Path $Source)) {
    throw "Source not found: $Source"
  }

  New-Item -ItemType Directory -Force -Path $Destination | Out-Null

  $excludeArgs = @()
  if ($ExcludeDirs.Count -gt 0) {
    $excludeArgs = @("/XD") + $ExcludeDirs
  }

  robocopy $Source $Destination *.* /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NC /NS $excludeArgs | Out-Null
  if ($LASTEXITCODE -ge 8) {
    throw "Robocopy failed with code $LASTEXITCODE"
  }
}

Write-Host "Sync client -> $ClientPath"
Copy-Tree -Source $clientSrc -Destination $ClientPath

Write-Host "Sync server -> $ServerPath"
Copy-Tree -Source $serverSrc -Destination $ServerPath -ExcludeDirs @("venv")

if (Test-Path $configSrc) {
  Write-Host "Sync config.env -> $ServerPath"
  Copy-Item $configSrc (Join-Path $ServerPath "config.env") -Force
}

Write-Host "OK. Next steps on Linux:"
Write-Host "  bash /home/getulio/build3.1/install.sh"
Write-Host "  bash /home/getulio/build3.1/server/setup_systemd.sh"
Write-Host "  python3 /home/getulio/build3.1/server.py --port 8888 --verbose"
