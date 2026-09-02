# OJO: [System.Text.Encoding]::UTF8 antepone BOM (3 bytes) a lo primero que
# se manda por pipe a un proceso externo. Con eso, psql ve un carácter
# inválido al inicio del primer statement de cada .sql (p.ej. corrompe
# "CREATE EXTENSION IF NOT EXISTS vector;") y falla en silencio. Usamos un
# encoding UTF-8 SIN BOM para evitarlo.
$Utf8NoBom = New-Object System.Text.UTF8Encoding $false
$OutputEncoding = $Utf8NoBom
[Console]::OutputEncoding = $Utf8NoBom

$ErrorActionPreference = "Stop"

function Invoke-SqlFileWithoutBom {
    param([string]$Path)
    # Get-Content -Raw -Encoding UTF8 ya quita el BOM del archivo si lo tiene;
    # el TrimStart es un resguardo extra por si acaso.
    $content = Get-Content -Path $Path -Raw -Encoding UTF8
    $content = $content.TrimStart([char]0xFEFF)
    $content | docker exec -i urbanpulse-db psql -U urban_admin -d urbanpulse_db
}

Write-Host "== Aplicando migraciones =="
Get-ChildItem "database/migrations" -Filter "*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "-> $($_.Name)"
    Invoke-SqlFileWithoutBom -Path $_.FullName
}
Write-Host "== Aplicando seeders =="
Get-ChildItem "database/seeders" -Filter "*.sql" | Sort-Object Name | ForEach-Object {
    Write-Host "-> $($_.Name)"
    Invoke-SqlFileWithoutBom -Path $_.FullName
}
Write-Host "== Listo. Tablas actuales =="
docker exec -i urbanpulse-db psql -U urban_admin -d urbanpulse_db -c "\dt"