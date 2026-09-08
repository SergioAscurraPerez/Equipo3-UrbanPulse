$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $PSScriptRoot

$apps = @(
    @{ Name = "mf-dashboard"; Path = Join-Path $repoRoot "mf-dashboard"; Port = 5175 },
    @{ Name = "mf-mapa-urbano"; Path = Join-Path $repoRoot "mf-mapa-urbano"; Port = 5174 },
    @{ Name = "frontend (host)"; Path = Join-Path $repoRoot "src\frontend"; Port = 3000 }
)

foreach ($app in $apps) {
    if (-not (Test-Path (Join-Path $app.Path "node_modules"))) {
        Write-Host "== Instalando dependencias de $($app.Name) =="
        Push-Location $app.Path
        npm install
        Pop-Location
    }
}

foreach ($app in $apps) {
    Write-Host "== Levantando $($app.Name) en el puerto $($app.Port) =="
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$($app.Path)'; npm run dev"
}

Write-Host ""
Write-Host "Se abrieron 3 ventanas de PowerShell, una por cada app."
Write-Host "Cuando terminen de iniciar, abre http://localhost:3000 en el navegador."
Write-Host "Para detenerlas, cierra cada ventana o presiona Ctrl+C en cada una."
