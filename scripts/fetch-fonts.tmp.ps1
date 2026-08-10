$ErrorActionPreference = 'Stop'
$dest = 'c:/Users/24533/Desktop/dezhou/public/fonts'
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

$fraunces = "https://fonts.gstatic.com/s/fraunces/v38/6NU78FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WBq8U_9v0c2Wa0KxC9TeA.woff2"
$interTight = "https://fonts.gstatic.com/s/intertight/v9/NGSwv5HMAFg6IuGlBNMjxLsH8ag.woff2"
$jetBrains = "https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbv2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKwBNntkaToggR7BYRbKPxDcwg.woff2"

Write-Host "downloading Fraunces..."
curl.exe -s -L -A $ua -o "$dest/fraunces-latin-wght.woff2" $fraunces
Write-Host "downloading Inter Tight..."
curl.exe -s -L -A $ua -o "$dest/inter-tight-latin-wght.woff2" $interTight
Write-Host "downloading JetBrains Mono..."
curl.exe -s -L -A $ua -o "$dest/jetbrains-mono-latin-wght.woff2" $jetBrains

Get-ChildItem $dest | Select-Object Name, Length
