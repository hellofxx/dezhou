$ErrorActionPreference = 'Stop'
Write-Host '=== dist/fonts ==='
Get-ChildItem 'c:/Users/24533/Desktop/dezhou/dist/fonts/*.woff2' | ForEach-Object {
  Write-Host ($_.Name + ' ' + $_.Length)
}
Write-Host '=== CSS font refs ==='
$css = Get-ChildItem 'c:/Users/24533/Desktop/dezhou/dist/assets/index-*.css' | Select-Object -First 1
Write-Host ("css file: " + $css.Name)
$matches = [regex]::Matches((Get-Content -Raw $css.FullName), 'url\([^)]*fonts/[^)]*\)')
foreach ($m in $matches) { Write-Host $m.Value }
