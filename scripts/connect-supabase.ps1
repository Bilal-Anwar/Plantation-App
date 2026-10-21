$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath (Split-Path -Parent $PSScriptRoot)
$pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue).Source
if (-not $pnpm) { $pnpm = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm.cmd' }
Write-Host 'Supabase setup: log in in the browser, then enter its verification code HERE (not in chat).'
& $pnpm dlx supabase login --agent no --output-format text
if ($LASTEXITCODE -ne 0) { throw 'Supabase sign-in failed.' }
& $pnpm dlx supabase db query --project-ref zwvaegxckrfbxeaivzes --file supabase/schema.sql --agent no --output-format text
if ($LASTEXITCODE -ne 0) { throw 'Database setup failed.' }
Write-Host 'Create your real email/password user in Supabase Dashboard > Authentication > Users if needed.'
$ownerEmail = Read-Host 'Email of the real Supabase Auth user to make farm owner'
if ([string]::IsNullOrWhiteSpace($ownerEmail)) { throw 'Email required.' }
$safeEmail = $ownerEmail.Trim().Replace("'", "''")
$bootstrap = @"
do `$`$ declare owner_id uuid; begin
select id into strict owner_id from auth.users where lower(email)=lower('$safeEmail');
insert into public.farm_members(user_id,name,role,active) values (owner_id,'Bilal Anwar','super_admin',true)
on conflict(user_id) do update set role='super_admin',active=true;
end `$`$;
"@
New-Item -ItemType Directory -Force supabase/.temp | Out-Null
$bootstrap | Set-Content supabase/.temp/owner.sql
try {
  & $pnpm dlx supabase db query --project-ref zwvaegxckrfbxeaivzes --file supabase/.temp/owner.sql --agent no --output-format text
  if ($LASTEXITCODE -ne 0) { throw 'Owner setup failed: ensure that email exists in Supabase Authentication.' }
  'Database and farm owner configured' | Set-Content supabase/.temp/setup-complete.txt
} finally { Remove-Item -LiteralPath supabase/.temp/owner.sql -ErrorAction SilentlyContinue }
Write-Host 'Setup complete. Return to Codex.' -ForegroundColor Green
Read-Host 'Press Enter to close'
