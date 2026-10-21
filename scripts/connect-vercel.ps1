$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
if (-not $pnpm) { $pnpm = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm.cmd' }
Write-Host 'Complete Vercel CLI authorization using the new link shown below.'
& $pnpm dlx vercel@48.10.0 login
if ($LASTEXITCODE -eq 0) { Write-Host 'Vercel CLI login complete. Return to Codex.' -ForegroundColor Green }
Read-Host 'Press Enter to close'
