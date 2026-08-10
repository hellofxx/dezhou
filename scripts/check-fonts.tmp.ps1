$ErrorActionPreference = 'Stop'
Get-ChildItem 'c:/Users/24533/Desktop/dezhou/public/fonts/*.woff2' | ForEach-Object {
  $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
  $magic = [System.Text.Encoding]::ASCII.GetString($bytes[0..3])
  Write-Host ($_.Name + ' -> ' + $magic + ' (size ' + $_.Length + ')')
}
