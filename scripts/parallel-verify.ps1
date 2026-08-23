#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Parallel Verify Runner for PokerLab
.DESCRIPTION
    并行运行 typecheck、lint、test 三条质量门禁，
    各自独立捕获 exit code，并支持分级重试。

    退出码捕获方式：在 Job 内读取 $LASTEXITCODE 并随结果对象返回。
    不可依赖 Job.State（原生命令非零退出不会置 State=Failed），
    也不可解析输出文本（pnpm 对 test 脚本的失败输出为
    "[ELIFECYCLE] Test failed."，不含 exit code）。

    重试策略（超时值为安全网，按需在 $commands 表调整）：
    - typecheck / lint：重试 1 次（超时 300s）
    - test：重试 2 次（超时 900s，flaky 测试常见）
#>

$ErrorActionPreference = 'Stop'
$workspaceRoot = Split-Path -Parent $PSScriptRoot

$commands = @(
    @{ Name = 'typecheck'; Cmd = 'pnpm typecheck'; MaxRetries = 1; Timeout = 300 }
    @{ Name = 'lint';      Cmd = 'pnpm lint';      MaxRetries = 1; Timeout = 300 }
    @{ Name = 'test';      Cmd = 'pnpm test';      MaxRetries = 2; Timeout = 900 }
)

# 启动单个验证 Job：输出与 $LASTEXITCODE 打包为结果对象返回
function New-VerifyJob {
    param([hashtable]$Config)

    Start-Job -ScriptBlock {
        param($c, $root)
        Push-Location $root
        try {
            $output = @(Invoke-Expression $c 2>&1 | ForEach-Object { "$_" })
            $code = $LASTEXITCODE
            if ($null -eq $code) { $code = 0 }
        } catch {
            $output = @("Job 内命令执行异常: $($_.Exception.Message)")
            $code = 1
        } finally {
            Pop-Location
        }
        [pscustomobject]@{ Output = $output; ExitCode = [int]$code }
    } -ArgumentList $Config.Cmd, $workspaceRoot
}

# 等待 Job 完成（含超时判定），归一化为 @{ Name; Code; Output } 结果对象
function Complete-VerifyJob {
    param($Job, [hashtable]$Config)

    if ($null -eq (Wait-Job -Job $Job -Timeout $Config.Timeout)) {
        Stop-Job -Job $Job
        Remove-Job -Job $Job -Force
        return [pscustomobject]@{
            Name   = $Config.Name
            Code   = -1
            Output = @("TIMEOUT (>$($Config.Timeout)s)")
        }
    }

    $payload = Receive-Job -Job $Job -ErrorAction SilentlyContinue
    Remove-Job -Job $Job -Force

    # Job 脚本块意外失败时 Receive-Job 返回 $null（内部已 try/catch，此为兜底）
    $code   = if ($null -ne $payload -and $null -ne $payload.ExitCode) { [int]$payload.ExitCode } else { 1 }
    $output = if ($null -ne $payload -and $payload.Output) { @($payload.Output) } else { @('(no output)') }

    return [pscustomobject]@{ Name = $Config.Name; Code = $code; Output = $output }
}

function Write-ResultOutput {
    param([pscustomobject]$Result, [string]$Label)

    Write-Host "--- [$Label] ---"
    if ($Result.Output) { $Result.Output | ForEach-Object { Write-Host $_ } }
}

Write-Host "═══ Parallel Verify ═══" -ForegroundColor Cyan
Write-Host "Workspace: $workspaceRoot`n"

$sw = [System.Diagnostics.Stopwatch]::StartNew()

# ── Phase 1: 初次并行执行（Start-Job 异步启动，全部启动后再逐个等待收尾）
Write-Host "▸ Phase 1: Initial run (parallel)" -ForegroundColor Yellow

$pending = [ordered]@{}
foreach ($config in $commands) {
    $pending[$config.Name] = @{ Config = $config; Job = New-VerifyJob $config }
}

$final = [ordered]@{}
foreach ($entry in $pending.Values) {
    $result = Complete-VerifyJob $entry.Job $entry.Config
    $final[$entry.Config.Name] = $result
    Write-ResultOutput $result $result.Name
}

# ── Phase 2: 失败命令分级重试（串行，逐个打印重试输出）
$failedNow = @($final.Values | Where-Object { $_.Code -ne 0 })
if ($failedNow.Count -gt 0) {
    Write-Host "`n▸ Phase 2: Retry $($failedNow.Count) failed command(s)" -ForegroundColor Yellow

    foreach ($config in $commands) {
        if ($final[$config.Name].Code -eq 0) { continue }

        for ($attempt = 1; $attempt -le $config.MaxRetries; $attempt++) {
            Write-Host "`n  ↻ Retry $($config.Name) (attempt $attempt/$($config.MaxRetries))" -ForegroundColor DarkYellow
            $job = New-VerifyJob $config
            $result = Complete-VerifyJob $job $config
            $final[$config.Name] = $result
            Write-ResultOutput $result "$($config.Name) retry $attempt"
            if ($result.Code -eq 0) { break }
        }
    }
}

# ── Phase 3: 汇总（以最终结果为准：初败重试成功的计入通过）
$sw.Stop()
$passedCount = @($final.Values | Where-Object { $_.Code -eq 0 }).Count
$failedList  = @($final.Values | Where-Object { $_.Code -ne 0 })

Write-Host "`n═══ Summary ═══" -ForegroundColor Cyan
Write-Host "  Passed: $passedCount/$($commands.Count)"
Write-Host "  Time:   $($sw.Elapsed.TotalSeconds.ToString('0.0'))s"

if ($failedList.Count -eq 0) {
    Write-Host "  Result: ✅ ALL PASSED" -ForegroundColor Green
    exit 0
}

$names = ($failedList | ForEach-Object { "$($_.Name) (exit $($_.Code))" }) -join ', '
Write-Host "  Result: ❌ FAILED ($names)" -ForegroundColor Red
exit 1
