# setup-agent-junctions.ps1
# 重建 .qoder/{agents,skills} -> .claude/{agents,skills} Junction（Windows，无需管理员权限）
# 用途：.claude/agents/ 为子代理物理源文件（已入库），Qoder 通过 Junction 兼容读取。
# 用法：新环境 clone 后执行一次： pwsh -File scripts/setup-agent-junctions.ps1
$ErrorActionPreference = 'Stop'
$root   = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root '.claude\agents'
$link   = Join-Path $root '.qoder\agents'

if (-not (Test-Path -LiteralPath $target)) {
    Write-Error "目标目录不存在: $target（请先确认 .claude/agents/ 已存在）"
}
if (Test-Path -LiteralPath $link) {
    $item = Get-Item -LiteralPath $link -Force
    if ($item.LinkType -eq 'Junction') { Write-Host "Junction 已存在且有效: $link -> $($item.Target)" }
    else { Write-Error "路径已被占用（非 Junction）: $link" }
}
else {
    New-Item -ItemType Junction -Path $link -Target $target | Out-Null
    Write-Host "Junction 创建成功: $link -> $target"
}

# ---- skills junction ----
$skillTarget = Join-Path $root '.claude\skills'
$skillLink   = Join-Path $root '.qoder\skills'

if (-not (Test-Path -LiteralPath $skillTarget)) {
    Write-Warning "目标目录不存在: $skillTarget（跳过 skills junction）"
}
elseif (Test-Path -LiteralPath $skillLink) {
    $item = Get-Item -LiteralPath $skillLink -Force
    if ($item.LinkType -eq 'Junction') { Write-Host "Junction 已存在且有效: $skillLink -> $($item.Target)" }
    else { Write-Warning "路径已被占用（非 Junction）: $skillLink" }
}
else {
    New-Item -ItemType Junction -Path $skillLink -Target $skillTarget | Out-Null
    Write-Host "Junction 创建成功: $skillLink -> $skillTarget"
}
