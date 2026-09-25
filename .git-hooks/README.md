# Git Hooks

本项目包含自动化质量门禁钩子（Hooks）。

## 安装 Pre-commit Hook

项目使用 [`.git-hooks/pre-commit`](./pre-commit) 作为 git hook，包含**两条阻断式门禁**：任意 `.ts/.tsx/.js/.jsx` 变更触发 ESLint，`.claude/agents/*-dev.md` 变更触发代理工具校验。

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

### 门禁 1：ESLint（阻断式）

- **触发条件**：暂存区（index vs HEAD）包含 `.ts` / `.tsx` / `.js` / `.jsx` 变更
- **验证内容**：`pnpm lint`，即 `no-restricted-imports`（模块间越界引用）+ `@typescript-eslint/no-explicit-any`
- **包管理器解析顺序**：PATH 上的 `pnpm` → `corepack pnpm`（按 `package.json` 的 `packageManager` 取锁定版本）→ `$APPDATA` 下的 `eslint.cmd`
- **fail-closed**：以上三者都找不到时 `exit 1` 中止提交。**「门禁没能跑起来」不等于「门禁通过了」**——此前该分支 `exit 0`，导致 pnpm 不在 hook PATH 上时静默放行，是 2026-09 连续 5 次「盲改豁免清单」提交直达 CI 的根因。

### 门禁 2：Agent tools 校验（阻断式）

- **触发条件**：暂存区包含 `.claude/agents/*-dev.md` 变更
- **验证内容**：`tools` 字段是否匹配预设工具集定义
- **执行级别**：错误阻塞、警告放行（`exit 1` 拦截；非 0/1 的意外退出码同样按失败处理）
- **验证脚本**：调用 `node scripts/validate-agent-tools.ts`

> 本 hook 只跑 `pnpm lint`（秒级），**不替代** `pnpm verify`。AGENTS.md §质量门禁要求每次代码变更后完整运行 `pnpm verify`（typecheck + lint + test），typecheck 与 test 仍需自行执行或依赖 CI。

### 输出示例

```bash
🔍 Running quality gate checks...
⚠️ Linting source files...
   (pnpm 不在 PATH，改用 corepack 解析 packageManager 锁定的版本)
✅ ESLint passed.

⚠️ Detecting changes to agent files...
✓ No agent file changes detected, skipping validation.
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

- [`scripts/validate-agent-tools.ts`](../scripts/validate-agent-tools.ts) — 验证脚本实现
- [`docs/agent-tools-guard-design.md`](../docs/agent-tools-guard-design.md) — Agent Tools Guard 设计规格
- [`AGENTS.md`](../AGENTS.md) — Feature PR Checklist 章节
