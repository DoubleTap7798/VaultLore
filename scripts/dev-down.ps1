$ErrorActionPreference = "Stop"

function Invoke-Compose {
	param(
		[string[]]$ComposeArgs
	)

	if (Get-Command docker-compose -ErrorAction SilentlyContinue) {
		docker-compose @ComposeArgs
		return
	}

	if (Get-Command docker -ErrorAction SilentlyContinue) {
		docker compose @ComposeArgs
		return
	}

	throw "Neither 'docker-compose' nor 'docker compose' is available. Install Docker Desktop and ensure it is on PATH."
}

Write-Host "Stopping local VaultLore services..."
Invoke-Compose -ComposeArgs @("-f", "docker-compose.local.yml", "down")

Write-Host "Local development stack stopped."
