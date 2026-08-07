# Agent 文件一致性检查脚本

Write-Host "=== Agent 文件一致性检查 ===" -ForegroundColor Cyan
Write-Host ""

$agentsDir = ".claude\agents"
$errors = @()
$warnings = @()

# 1. 检查文件存在性
Write-Host "【检查 1】文件清单和命名规范" -ForegroundColor Yellow
$expectedAgents = @(
    "platform-dev.md",
    "ui-ux-dev.md", 
    "range-trainer-dev.md",
    "pot-odds-dev.md",
    "gto-simulator-dev.md",
    "hand-history-dev.md",
    "puzzle-trainer-dev.md",
    "theory-academy-dev.md",
    "onboarding-dev.md",
    "help-center-dev.md",
    "strategy-academy-dev.md",
    "progress-dev.md"
)

foreach ($agent in $expectedAgents) {
    $path = Join-Path $agentsDir $agent
    if (Test-Path $path) {
        Write-Host "✓ $agent" -ForegroundColor Green
    } else {
        Write-Host "✗ $agent - 不存在!" -ForegroundColor Red
        $errors += "Missing: $agent"
    }
}

Write-Host ""
Write-Host "【检查 2】文件名与 frontmatter name 一致性" -ForegroundColor Yellow
foreach ($agent in $expectedAgents) {
    $path = Join-Path $agentsDir $agent
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        $match = [regex]::Match($content, '(?m)^name:\s*(.+)')
        if ($match.Success) {
            $name = $match.Groups[1].Value.Trim()
            $expectedName = $agent -replace '\.md$', ''
            if ($name -eq $expectedName) {
                Write-Host "✓ $agent: name='$name'" -ForegroundColor Green
            } else {
                Write-Host "✗ $agent: name='$name' ≠ filename='$expectedName'" -ForegroundColor Red
                $errors += "Name mismatch in $agent: '$name' vs '$expectedName'"
            }
        } else {
            Write-Host "✗ $agent: 无 frontmatter name" -ForegroundColor Red
            $errors += "No name in frontmatter for $agent"
        }
    }
}

Write-Host ""
Write-Host "【检查 3】标准章节存在性" -ForegroundColor Yellow
$requiredSections = @("## Role", "## Context", "## Authority", "## Capabilities", "## Cross-Module Touchpoints", "## Key Files", "## Workflows", "## Constraints", "## Quality Checklist")

foreach ($agent in $expectedAgents) {
    $path = Join-Path $agentsDir $agent
    if (Test-Path $path) {
        $content = Get-Content $path
        $missingSections = @()
        foreach ($section in $requiredSections) {
            if (-not $content -match [regex]::Escape($section)) {
                $missingSections += $section
            }
        }
        
        if ($missingSections.Count -eq 0) {
            Write-Host "✓ $agent: 所有章节完整" -ForegroundColor Green
        } else {
            Write-Host "✗ $agent: 缺少 $($missingSections -join ', ')" -ForegroundColor Yellow
            $warnings += "Missing sections in $agent: $($missingSections -join ', ')"
        }
    }
}

Write-Host ""
Write-Host "【检查 4】行数字统计" -ForegroundColor Yellow
foreach ($agent in $expectedAgents) {
    $path = Join-Path $agentsDir $agent
    if (Test-Path $path) {
        $lines = (Get-Content $path).Count
        if ($lines -le 200) {
            Write-Host "$agent - $lines 行 (合理范围)" -ForegroundColor Green
        } else {
            Write-Host "$agent - $lines 行 (偏长!)" -ForegroundColor Yellow
            $warnings += "$agent is too long ($lines lines)"
        }
    }
}

# 总结报告
Write-Host ""
Write-Host "=== 检查结果汇总 ===" -ForegroundColor Cyan
if ($errors.Count -eq 0) {
    Write-Host "✓ 所有检查通过!" -ForegroundColor Green
} else {
    Write-Host "✗ 发现 $($errors.Count) 个错误:" -ForegroundColor Red
    $errors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($warnings.Count -gt 0) {
    Write-Host "⚠ 发现 $($warnings.Count) 个警告:" -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "=== 推荐操作 ===" -ForegroundColor Cyan
Write-Host "1. 如有错误，请参考 docs/agents-guide/子智能体文件标准化规范.md"
Write-Host "2. 可运行 pnpm verify 进行最终验证"
