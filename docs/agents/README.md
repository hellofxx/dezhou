# docs/agents — 代理文档索引

> 状态：Current · 最后复核：2026-11-04
> 根 [`AGENTS.md`](../../AGENTS.md) 是项目级唯一约束源与任务路由表；本目录存放代理清单、命名规则、工具权限、模板与生成物。

## 文件

- [`MODULE_MAP.md`](./MODULE_MAP.md) — **生成物**：模块表、lazy 路由表、已声明 URL、i18n 分组表。由 `scripts/generate-agent-map.mjs` 从代码事实生成，**不要手改**。
- [`TEMPLATE-dev.md`](./TEMPLATE-dev.md) — 新建 feature 代理的模板；复制为 `.claude/agents/<module>-dev.md`。

## 子代理清单

| 代理 | 类型 | 触发场景 |
|---|---|---|
| `platform-dev` | 基础层 | 脚手架 / 布局 / 路由 / shared 层 / 跨模块集成 |
| `ui-ux-dev` | 基础层 | 设计语言守护 / 全局视觉一致性 / 组件质感 / 布局与导航 / 响应式 / 可访问性 |
| `range-trainer-dev` | Feature | 范围训练模块内变更 |
| `pot-odds-dev` | Feature | 赔率计算器模块内变更 |
| `gto-simulator-dev` | Feature | GTO 模拟器模块内变更 |
| `hand-history-dev` | Feature | 牌局复盘模块内变更 |
| `progress-dev` | Feature | 跨模块状态 / Dashboard / 统计图表 |
| `onboarding-dev` | Feature | 新手引导流程 |
| `puzzle-trainer-dev` | Feature | Puzzle 三模式 |
| `strategy-academy-dev` | Feature | 课程 / Drill / QuickDrill |
| `theory-academy-dev` | Feature | 理论学院课程 / 章末小测 / 理论→实践桥接 |
| `help-center-dev` | Feature | 帮助中心教程内容 / 帮助页面 UI |

## 命名规范

子代理文件位于 `.claude/agents/`，命名遵循以下规则：

1. **格式**：统一 kebab-case（小写字母 + 连字符），禁止无连字符缩写（如 `uiux` → `ui-ux`）。
2. **Feature 代理**：命名为 `<feature-dir>-dev`，必须与 `src/features/<feature-dir>/` 目录名一一对应。
3. **跨模块基础代理**：使用描述性 scope 前缀，不带项目名前缀。
4. **文件名 = frontmatter `name`**：`.md` 文件名必须与 frontmatter 的 `name` 完全一致。
5. **后缀**：`-dev` 表示开发类代理（含设计守护）；新增非开发类代理再扩展后缀。
6. **模块-代理同步**：新建 feature 模块时，同名代理文件须在同一逻辑单元内创建（1:1 绑定）。
7. **frontmatter 字段顺序**：`name → description → tools → model → skills → mcpServers → additionalPrompt`。

## 工具权限

- **feature-dev 标准工具集（10 项）**：`Read / Glob / Grep / LSP / GetProblems / SearchReplace / Write / DeleteFile / Bash / GetTerminalOutput`。
- **只读复核型代理收窄**：移除 `DeleteFile`（`ui-ux-dev` / `help-center-dev` 各 9 项）；删除文件需求转交 `platform-dev` 协调。
- **声明规则**：`tools` 必须显式声明最小工具集，禁止通配符或省略（等同继承全部工具）；实际清单以各 agent 文件为事实源。

## 批量补测协作

一次补齐多个模块时，按模块拆分给对应 feature-dev 并行执行：子智能体只改本模块测试、只跑定向测试，禁止改 docs / config / package.json；主线负责覆盖率审计、全量 `pnpm test` / `pnpm verify`、MODULE_MAP 与文档同步。完整约束见 `docs/testing/README.md` §13。

## 生成与校验

```powershell
pnpm agents:map        # 重新生成 docs/agents/MODULE_MAP.md
pnpm agents:map:check  # 校验与代码事实一致（CI 与 pre-commit 门禁）
```

改动以下任一文件后必须重新生成，否则 `pnpm verify` 会在 `agents:map:check` 处失败：

- `src/features/` 下模块增删（目录 / `store.ts` 的 persist version）
- `src/app/routes.tsx`（`lazyPage` / `lazyPageWithFeature` 声明、`path:`）
- `src/i18n/moduleRegistry.ts`（`CORE_MODULES` / `FEATURE_GROUPS`）
- `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS`
- `.claude/agents/` 下 `<module>-dev.md` 的增删

## 相关入口

- 根 [`AGENTS.md`](../../AGENTS.md) — 任务路由、共享基线、跨模块能力归属、边界与协作流程
- [`docs/README.md`](../README.md) — 文档索引与状态约定
- [`docs/how-to/add-a-feature-module.md`](../how-to/add-a-feature-module.md) — 新增模块的完整步骤
- [`.claude/agents/`](../../.claude/agents/) — 各代理定义（文件名 = frontmatter `name`）
