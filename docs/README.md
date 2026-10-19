# 文档索引

> Agent 先读 Current specs，再按任务取 Agents / Architecture；不要默认通读 archive。

## Current specs

- [`PRD.md`](./PRD.md) — 产品规格（What / Why）
- [`TDD.md`](./TDD.md) — 技术设计（How）
- [`CHANGELOG.md`](./CHANGELOG.md) — 当前变更记录（倒序，仅保留近月内容）
- [`AI_GUIDE.md`](./AI_GUIDE.md) — 编码与工程实践指南
- [`../DESIGN.md`](../DESIGN.md) — UI/UX 设计语言规范（仓库根，唯一设计契约源）

## Agents

- [`agents/behavior.md`](./agents/behavior.md) — 行为准则历史全文（项目级唯一权威是根 `AGENTS.md`）
- [`agents/README.md`](./agents/README.md) — 任务路由表（任务 → 先读什么 → 找哪个代理）
- [`agents/MODULE_MAP.md`](./agents/MODULE_MAP.md) — 生成物：模块 / lazy 路由 / i18n 分组事实地图（`pnpm agents:map`，勿手改）

## Architecture

- [`architecture/`](./architecture/) — 模块边界评审、依赖图（dot）与架构证据材料

## Ops

- [`ops/`](./ops/) — 部署清单与 CI / GitHub Actions 排障记录

## History / reports

- [`changelog/`](./changelog/) — 按月归档的历史变更（2026-08 及更早）
- [`AGENT_OPTIMIZATION_REPORT.md`](./AGENT_OPTIMIZATION_REPORT.md) — 代理体系优化报告
- [`DESIGN_OPTIMIZATION_PLAN.md`](./DESIGN_OPTIMIZATION_PLAN.md) — 设计优化计划

## Archive

- `.archive/` 仅本地保留（已在根 `.gitignore` 忽略），其内容通过 git 历史可追溯，**不作为当前事实源**。
