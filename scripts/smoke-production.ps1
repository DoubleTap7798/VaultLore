Param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$Email,

  [Parameter(Mandatory = $true)]
  [string]$Password,

  [Parameter(Mandatory = $true)]
  [string]$FrontImagePath,

  [string]$BackImagePath,
  [string]$CategoryHint = "sports-cards"
)

$ErrorActionPreference = "Stop"

Write-Host "[1/6] Health check"
$health = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/health"
$health | ConvertTo-Json -Depth 6

Write-Host "[2/6] Register (or login fallback)"
$body = @{ email = $Email; password = $Password } | ConvertTo-Json
try {
  $register = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/auth/register" -ContentType "application/json" -Body $body
  $accessToken = $register.accessToken
  $refreshToken = $register.refreshToken
} catch {
  $login = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/auth/login" -ContentType "application/json" -Body $body
  $accessToken = $login.accessToken
  $refreshToken = $login.refreshToken
}

Write-Host "[3/6] Auth refresh"
$refreshBody = @{ refreshToken = $refreshToken } | ConvertTo-Json
$null = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/auth/refresh" -ContentType "application/json" -Body $refreshBody

Write-Host "[4/6] Upload scan images"
if (-not (Test-Path $FrontImagePath)) {
  throw "Front image not found: $FrontImagePath"
}

$uploadParams = @{
  Uri = "$ApiBaseUrl/uploads/card-scan"
  Method = "Post"
  Headers = @{ Authorization = "Bearer $accessToken" }
  Form = @{
    front = Get-Item $FrontImagePath
    categoryHint = $CategoryHint
  }
}

if ($BackImagePath -and (Test-Path $BackImagePath)) {
  $uploadParams.Form.back = Get-Item $BackImagePath
}

$upload = Invoke-RestMethod @uploadParams
$jobId = $upload.jobId
Write-Host "Queued job: $jobId"

Write-Host "[5/6] Poll scan job"
$scanResult = $null
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 2
  $scanResult = Invoke-RestMethod -Method Get -Uri "$ApiBaseUrl/cards/scan/$jobId" -Headers @{ Authorization = "Bearer $accessToken" }
  Write-Host "Status: $($scanResult.status)"
  if ($scanResult.status -eq "completed") { break }
}

if ($scanResult.status -ne "completed") {
  throw "Scan job did not complete in time"
}

Write-Host "[6/6] Forgot password enqueue"
$forgotBody = @{ email = $Email } | ConvertTo-Json
$forgot = Invoke-RestMethod -Method Post -Uri "$ApiBaseUrl/auth/forgot-password" -ContentType "application/json" -Body $forgotBody
$forgot | ConvertTo-Json -Depth 6

Write-Host "Smoke test completed successfully"
$scanResult | ConvertTo-Json -Depth 8
