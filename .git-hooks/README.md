# Git Hooks

本项目包含自动化质量门禁钩子（Hooks）。

## 安装 Pre-commit Hook

项目使用 [`scripts/pre-commit`](./scripts/pre-commit) 作为 git hook，仅在检测到 `.claude/agents/*.md` 变更时触发代理工具校验。

### Windows 安装（PowerShell）

```powershell
# 初始化并启用 hooks
git config core.hooksPath .git-hooks

# 或者手动复制
Copy-Item -Path ".git-hooks\pre-commit" -Destination ".git/hooks\pre-commit" -Force
```

### Linux/macOS 安装

```bash
# 初始化并启用 hooks
git config core.hooksPath .git-hooks

# 或者手动链接
ln -s ../.git-hooks/pre-commit .git/hooks/
```

## 功能说明

- **触发条件**：仅当提交包含 `.claude/agents/*.md` 文件变更时生效
- **验证内容**：检查 `tools` 字段是否匹配预设工具集定义
- **执行级别**：警告级非阻塞（通过则 exit 0）
- **验证脚本**：调用 `node scripts/validate-agent-tools.ts`

### 输出示例

```bash
⚠️ Detecting changes to agent files...
🔍 Running agent tools validation...

Found 12 agent files.

✅ .claude\agents\gto-simulator-dev.md
✅ .claude\agents\hand-history-dev.md
...
==================================================
✅ Validation PASSED
```

## 跳过 Hook

如需临时跳过验证（不推荐）：

```bash
# Git bash/PowerShell
git commit --no-verify -m "message"

# 或使用 alias
git cm -m "message"
```

## 参考文档

- [`scripts/validate-agent-tools.ts`](./scripts/validate-agent-tools.ts) — 验证脚本实现
- [`docs/agent-tools-guard-design.md`](./docs/agent-tools-guard-design.md) — Agent Tools Guard 设计规格
- [`AGENTS.md`](../AGENTS.md) — Feature PR Checklist 章节
