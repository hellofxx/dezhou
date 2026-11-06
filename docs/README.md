# 文档索引

> 单一入口。默认只读 **Current**；其余状态仅供追溯。
>
> - **Current**：唯一事实源，随代码同步。
> - **Generated**：由脚本生成，禁止手改。
> - **Historical**：当时快照，不维护、不作为决策依据；位于 `history/` 与 `changelog/`。
> - **Archive**：`.archive/` 仅本地保留（已忽略），不可作为事实源。

## 先读

| 文档 | 状态 | 用途 |
|---|---|---|
| [`../README.md`](../README.md) | Current | 人类入口：快速开始、命令、部署 |
| [`../AGENTS.md`](../AGENTS.md) | Current | AI 代理唯一约束源：任务路由、架构约束、质量门禁 |
| [`../DESIGN.md`](../DESIGN.md) | Current | UI/UX 设计契约（唯一权威） |

## Current specs

| 文档 | 用途 | 更新时机 |
|---|---|---|
| [`PRD.md`](./PRD.md) | 产品规格（What / Why） | 功能需求变更 |
| [`TDD.md`](./TDD.md) | 技术设计（How） | 架构 / 数据模型 / 模块设计变更 |
| [`AI_GUIDE.md`](./AI_GUIDE.md) | 编码 / 状态 / i18n / UI 详细规范 | 工程规范变更 |
| [`testing/README.md`](./testing/README.md) | 测试体系（分层 / 命名 / 执行矩阵） | 测试流程变更 |
| [`adr/README.md`](./adr/README.md) | 架构决策记录（ADR） | 难以回退的架构决策 |
| [`how-to/README.md`](./how-to/README.md) | 贡献者操作指南（新增模块 / 守卫 / 测试） | 工作流变更 |
| [`ops/DEPLOY_CHECKLIST.md`](./ops/DEPLOY_CHECKLIST.md) | GitHub Pages 部署与回滚 | 发布流程变更 |
| [`agents/README.md`](./agents/README.md) | 代理文档索引（模板 / 生成物） | 代理体系变更 |
| [`knowledge-guide.md`](./knowledge-guide.md) | 知识库使用与回退 | 知识库策略变更 |

## 生成物（勿手改）

- [`agents/MODULE_MAP.md`](./agents/MODULE_MAP.md) — `pnpm agents:map` 生成；`pnpm agents:map:check` 校验。

## Snapshot（参考，不保证当前）

- [`architecture/README.md`](./architecture/README.md) — 当前态架构模型，证据基线 2026-08-30；刷新触发见该文件。

## 历史（只追溯，不作为事实源）

- [`CHANGELOG.md`](./CHANGELOG.md) — 当月变更（倒序；跨月后归档）
- [`changelog/`](./changelog/) — 按月归档（截至 2026-10）
- [`history/README.md`](./history/README.md) — 一次性评审、计划、诊断报告索引

## 维护规则

- 新增文档先判断状态；Current 文档必须进入本索引，Historical 文档只进 `history/README.md`。
- `CHANGELOG.md` 只保留当月变更；跨月时将上月条目整体移入 `changelog/YYYY-MM.md`，并同步更新本索引与 `CHANGELOG.md` 头部归档声明。
- 一次性报告 / 计划完成后从 Current 目录移入 `history/`，并在 `history/README.md` 登记。
- 代码事实（文件数、版本号、路由数）不在文档中硬编码；以代码 / 生成物为准。
- 代理角色文件只写职责与边界增量，不复制 `AGENTS.md`、`docs/AI_GUIDE.md`、`DESIGN.md` 或知识库正文。
- 文档链接、索引覆盖与状态声明由 `pnpm docs:check` 校验（`pnpm verify` 已包含）。
