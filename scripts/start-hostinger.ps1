$ErrorActionPreference = 'Stop'

$backendPath = Join-Path $PSScriptRoot '..\backend'
$adminPath = Join-Path $PSScriptRoot '..\apps\admin'
$envPath = Join-Path $backendPath '.env'

if (-not (Test-Path $envPath)) {
  throw "Missing backend/.env"
}

$config = @{}
Get-Content $envPath | ForEach-Object {
  if ($_ -match '^\s*([^#=]+)=(.*)\s*$') {
    $config[$matches[1].Trim()] = $matches[2].Trim()
  }
}

if ($config.SSH_TUNNEL_ENABLED -ne 'true') {
  throw 'SSH_TUNNEL_ENABLED must be true in backend/.env'
}

$sshArguments = @(
  '-N', '-T',
  '-o', 'ExitOnForwardFailure=yes',
  '-o', 'ServerAliveInterval=60',
  '-L', "$($config.SSH_LOCAL_PORT):$($config.SSH_REMOTE_HOST):$($config.SSH_REMOTE_PORT)",
  '-p', $config.SSH_PORT
)

if ($config.SSH_KEY_PATH) {
  $sshArguments += @('-i', $config.SSH_KEY_PATH)
}

$sshArguments += "$($config.SSH_USER)@$($config.SSH_HOST)"

Start-Process -FilePath 'ssh.exe' -ArgumentList $sshArguments
Start-Process -FilePath 'powershell.exe' -WorkingDirectory $backendPath -ArgumentList @('-NoExit', '-Command', 'npm run start:dev')
Start-Process -FilePath 'powershell.exe' -WorkingDirectory $adminPath -ArgumentList @('-NoExit', '-Command', 'npm run dev -- --host 0.0.0.0')

Write-Host 'Started SSH tunnel, backend, and admin app.'
Write-Host 'Admin: http://localhost:5173/'
Write-Host 'API:   http://localhost:3000/'