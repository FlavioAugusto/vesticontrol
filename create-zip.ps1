$src  = "D:\SISTEMAS APP\SITE DE MARCELO OFICIA\app"
$dest = "D:\SISTEMAS APP\SITE DE MARCELO OFICIA\deploy-infinitepay.zip"
if (Test-Path $dest) { Remove-Item $dest -Force }

# Cria arquivo de build ID para quebrar cache do Docker
$buildId = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$buildIdFile = "$src\.build-id"
Set-Content -Path $buildIdFile -Value $buildId

$files = Get-ChildItem -Path $src -Recurse -File | Where-Object {
    $_.FullName -notlike '*\node_modules\*' -and
    $_.FullName -notlike '*\.next\*' -and
    $_.FullName -notlike '*\.git\*' -and
    $_.Name -ne '.env.local'
}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open($dest, 'Create')
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($src.Length + 1)
    $entry = $zip.CreateEntry($relativePath, 'Optimal')
    $stream = $entry.Open()
    $bytes  = [System.IO.File]::ReadAllBytes($file.FullName)
    $stream.Write($bytes, 0, $bytes.Length)
    $stream.Close()
}
$zip.Dispose()

# Remove o arquivo temporário
Remove-Item $buildIdFile -Force

Write-Host "ZIP criado: $dest"
Write-Host "Arquivos: $($files.Count)"
Write-Host "Build ID: $buildId"
