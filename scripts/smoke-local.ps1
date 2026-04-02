param(
  [string]$ApiBaseUrl = "http://127.0.0.1:4000/v1",
  [string]$Email = "collector@vaultlore.app",
  [string]$Password = "Password123!",
  [int]$StartupTimeoutSeconds = 45,
  [int]$MaxPollAttempts = 20,
  [int]$PollSeconds = 1
)

$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$smokeScriptPath = Join-Path $repoRoot "scripts/smoke-api.ps1"
$envFilePath = Join-Path $repoRoot ".env"

$serverLog = Join-Path $env:TEMP "vaultlore-smoke-server.log"
$serverErr = Join-Path $env:TEMP "vaultlore-smoke-server.err.log"
$workerLog = Join-Path $env:TEMP "vaultlore-smoke-worker.log"
$workerErr = Join-Path $env:TEMP "vaultlore-smoke-worker.err.log"

function Import-DotEnv {
  param(
    [string]$Path
  )

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content -Path $Path | ForEach-Object {
    $line = $_.Trim()

    if ($line.Length -eq 0 -or $line.StartsWith("#")) {
      return
    }

    $splitIndex = $line.IndexOf("=")
    if ($splitIndex -lt 1) {
      return
    }

    $key = $line.Substring(0, $splitIndex).Trim()
    $value = $line.Substring($splitIndex + 1).Trim()

    if ($value.StartsWith('"') -and $value.EndsWith('"')) {
      $value = $value.Substring(1, $value.Length - 2)
    }

    [Environment]::SetEnvironmentVariable($key, $value, "Process")
    Set-Item -Path "Env:$key" -Value $value
  }
}

function Set-DefaultEnvIfMissing {
  param(
    [string]$Key,
    [string]$Value
  )

  $existing = [Environment]::GetEnvironmentVariable($Key, "Process")
  if ([string]::IsNullOrWhiteSpace($existing)) {
    [Environment]::SetEnvironmentVariable($Key, $Value, "Process")
    Set-Item -Path "Env:$Key" -Value $Value
  }
}

function Start-BackgroundService {
  param(
    [string]$Label,
    [string]$Command,
    [string]$OutLog,
    [string]$ErrLog
  )

  Write-Host "[smoke-local] Starting $Label ..."
  $process = Start-Process `
    -FilePath "powershell" `
    -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $Command) `
    -WorkingDirectory $repoRoot `
    -WindowStyle Hidden `
    -PassThru `
    -RedirectStandardOutput $OutLog `
    -RedirectStandardError $ErrLog

  return $process
}

function Stop-BackgroundService {
  param(
    [string]$Label,
    [System.Diagnostics.Process]$Process
  )

  if ($null -eq $Process) {
    return
  }

  try {
    if (-not $Process.HasExited) {
      Write-Host "[smoke-local] Stopping $Label (PID $($Process.Id)) ..."
      Stop-Process -Id $Process.Id -Force
    }
  } catch {
    Write-Host "[smoke-local] Warning: failed to stop $Label cleanly: $($_.Exception.Message)"
  }
}

function Print-LogTail {
  param(
    [string]$Label,
    [string]$Path,
    [int]$Lines = 30
  )

  if (-not (Test-Path $Path)) {
    return
  }

  Write-Host "[smoke-local] Last ${Lines} lines from $Label log ($Path):"
  Get-Content -Path $Path -Tail $Lines | ForEach-Object { Write-Host $_ }
}

$serverProcess = $null
$workerProcess = $null

try {
  Import-DotEnv -Path $envFilePath

  Set-DefaultEnvIfMissing -Key "NODE_ENV" -Value "development"
  Set-DefaultEnvIfMissing -Key "DATABASE_URL" -Value "postgres://postgres:postgres@localhost:5432/vaultlore"
  Set-DefaultEnvIfMissing -Key "REDIS_URL" -Value "redis://localhost:6379"
  Set-DefaultEnvIfMissing -Key "JWT_SECRET" -Value "vaultlore-local-dev-jwt-secret-change-me"
  Set-DefaultEnvIfMissing -Key "EXPO_PUBLIC_API_URL" -Value "http://localhost:4000/v1"
  Set-DefaultEnvIfMissing -Key "NEXT_PUBLIC_API_URL" -Value "http://localhost:4000/v1"

  $serverProcess = Start-BackgroundService -Label "API server" -Command "pnpm dev:server" -OutLog $serverLog -ErrLog $serverErr
  $workerProcess = Start-BackgroundService -Label "worker" -Command "pnpm dev:worker" -OutLog $workerLog -ErrLog $workerErr

  $healthUrl = "$ApiBaseUrl/health"
  $ready = $false

  Write-Host "[smoke-local] Waiting for API readiness at $healthUrl ..."
  for ($attempt = 1; $attempt -le $StartupTimeoutSeconds; $attempt++) {
    Start-Sleep -Seconds 1

    if ($serverProcess.HasExited) {
      throw "API server exited early (code $($serverProcess.ExitCode))."
    }

    try {
      $health = Invoke-RestMethod -Method "GET" -Uri $healthUrl
      if ($health.status -eq "ok") {
        $ready = $true
        break
      }
    } catch {
      # Keep polling until timeout.
    }
  }

  if (-not $ready) {
    throw "Timed out waiting for API readiness after $StartupTimeoutSeconds seconds."
  }

  Write-Host "[smoke-local] Running smoke suite ..."
  & $smokeScriptPath `
    -ApiBaseUrl $ApiBaseUrl `
    -Email $Email `
    -Password $Password `
    -MaxPollAttempts $MaxPollAttempts `
    -PollSeconds $PollSeconds

  Write-Host "[smoke-local] PASS"
} catch {
  Write-Host "[smoke-local] FAIL: $($_.Exception.Message)"
  Print-LogTail -Label "server stdout" -Path $serverLog
  Print-LogTail -Label "server stderr" -Path $serverErr
  Print-LogTail -Label "worker stdout" -Path $workerLog
  Print-LogTail -Label "worker stderr" -Path $workerErr
  throw
} finally {
  Stop-BackgroundService -Label "worker" -Process $workerProcess
  Stop-BackgroundService -Label "API server" -Process $serverProcess
}
