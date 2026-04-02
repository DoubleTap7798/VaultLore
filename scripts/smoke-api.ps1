param(
  [string]$ApiBaseUrl = "http://127.0.0.1:4000/v1",
  [string]$Email = "collector@vaultlore.app",
  [string]$Password = "Password123!",
  [int]$MaxPollAttempts = 20,
  [int]$PollSeconds = 1
)

$ErrorActionPreference = "Stop"

function Invoke-JsonRequest {
  param(
    [string]$Method,
    [string]$Url,
    [object]$Body,
    [hashtable]$Headers
  )

  $jsonBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 8 } else { $null }

  try {
    if ($null -eq $jsonBody) {
      return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers
    }

    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $Headers -Body $jsonBody -ContentType "application/json"
  } catch {
    $statusCode = $null
    if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
      $statusCode = [int]$_.Exception.Response.StatusCode
    }

    if ($null -ne $statusCode) {
      throw "Request failed: $Method $Url -> HTTP $statusCode. If this is auth or collection, ensure Postgres and Redis are running via 'pnpm local:up'."
    }

    throw
  }
}

Write-Host "[smoke] Checking API health at $ApiBaseUrl/health ..."
try {
  $health = Invoke-JsonRequest -Method "GET" -Url "$ApiBaseUrl/health" -Body $null -Headers @{}
} catch {
  throw "API is not reachable at $ApiBaseUrl. Start the server first with 'pnpm dev:server'."
}

if ($health.status -ne "ok") {
  throw "Unexpected health response. Expected status='ok'."
}

Write-Host "[smoke] Logging in as $Email ..."
$auth = Invoke-JsonRequest -Method "POST" -Url "$ApiBaseUrl/auth/login" -Body @{
  email = $Email
  password = $Password
} -Headers @{}

if (-not $auth.accessToken -or -not $auth.refreshToken) {
  throw "Login did not return access/refresh tokens."
}

$authHeaders = @{
  authorization = "Bearer $($auth.accessToken)"
}

Write-Host "[smoke] Verifying authenticated profile and collection endpoints ..."
$me = Invoke-JsonRequest -Method "GET" -Url "$ApiBaseUrl/users/me" -Body $null -Headers $authHeaders
$collection = Invoke-JsonRequest -Method "GET" -Url "$ApiBaseUrl/collection" -Body $null -Headers $authHeaders

if (-not $me.id -or -not $me.email) {
  throw "users/me response is missing core fields."
}

if ($null -eq $collection.items) {
  throw "collection response missing items."
}

Write-Host "[smoke] Creating scan job ..."
$scanEnqueue = Invoke-JsonRequest -Method "POST" -Url "$ApiBaseUrl/cards/scan" -Body @{
  categoryHint = "basketball"
} -Headers $authHeaders

if (-not $scanEnqueue.jobId) {
  throw "Scan enqueue did not return jobId."
}

Write-Host "[smoke] Polling scan job $($scanEnqueue.jobId) for completion ..."
$scanStatus = $null
for ($attempt = 1; $attempt -le $MaxPollAttempts; $attempt++) {
  Start-Sleep -Seconds $PollSeconds
  $scanStatus = Invoke-JsonRequest -Method "GET" -Url "$ApiBaseUrl/cards/scan/$($scanEnqueue.jobId)" -Body $null -Headers $authHeaders

  Write-Host "[smoke] Attempt ${attempt}/${MaxPollAttempts}: status=$($scanStatus.status)"

  if ($scanStatus.status -eq "completed") {
    break
  }

  if ($scanStatus.status -eq "failed") {
    throw "Scan job failed."
  }
}

if ($scanStatus.status -ne "completed") {
  throw "Timed out waiting for scan completion. Ensure 'pnpm dev:worker' is running."
}

Write-Host "[smoke] Verifying market endpoint ..."
$market = Invoke-JsonRequest -Method "GET" -Url "$ApiBaseUrl/market/home" -Body $null -Headers @{}
if ($null -eq $market.topMovers -or $market.topMovers.Count -lt 1) {
  throw "market/home did not return topMovers."
}

Write-Host "[smoke] Logging out ..."
$logout = Invoke-JsonRequest -Method "POST" -Url "$ApiBaseUrl/auth/logout" -Body @{
  refreshToken = $auth.refreshToken
} -Headers @{}

if (-not $logout.success) {
  throw "Logout did not return success=true."
}

Write-Host "[smoke] PASS"
Write-Host "[smoke] User: $($me.email)"
Write-Host "[smoke] Collection count: $($collection.items.Count)"
Write-Host "[smoke] Scan confidence: $($scanStatus.confidence)"
Write-Host "[smoke] Top mover: $($market.topMovers[0].title)"
