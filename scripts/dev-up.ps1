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

Write-Host "Starting local VaultLore services (Postgres + Redis)..."
Invoke-Compose -ComposeArgs @("-f", "docker-compose.local.yml", "up", "-d")

Write-Host "Applying database migrations..."
pnpm db:migrate

Write-Host "Seeding database..."
pnpm db:seed

Write-Host "Local development stack is ready."
