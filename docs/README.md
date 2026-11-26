# 文档索引

> 状态：Current · 最后复核：2026-11-26

> 单一入口。默认只读 **Current**；**Generated** 勿手改；更早的历史从 git 历史追溯，本地 `.archive/` 仅作备份，不入库、不作事实源。

## 先读

| 文档 | 状态 | 用途 |
|---|---|---|
| [`../README.md`](../README.md) | Current | 人类入口：快速开始、命令、部署与回滚 |
| [`../AGENTS.md`](../AGENTS.md) | Current | AI 代理唯一约束源：任务路由、架构约束、操作指南、质量门禁 |
| [`../CONTRIBUTING.md`](../CONTRIBUTING.md) | Current | 贡献流程入口（指向约束、命令与文档变更） |
| [`../SECURITY.md`](../SECURITY.md) | Current | 安全策略与漏洞报告 |
| [`../DESIGN.md`](../DESIGN.md) | Current | UI/UX 设计契约（唯一权威） |

## Current

| 文档 | 用途 | 更新时机 |
|---|---|---|
| [`PRD.md`](./PRD.md) | 产品规格（What / Why） | 功能需求变更 |
| [`TDD.md`](./TDD.md) | 技术设计（How；§16 工程规范、§17 课程区 IA、§18 测试体系） | 架构 / 数据模型 / 模块 / IA / 测试流程变更 |
| [`DECISIONS.md`](./DECISIONS.md) | 架构决策记录（ADR，只追加） | 难以回退的架构决策 |

## Generated（勿手改）

- [`agents/MODULE_MAP.md`](./agents/MODULE_MAP.md) — `pnpm agents:map` 生成；`pnpm agents:map:check` 校验。

## Historical

- [`CHANGELOG.md`](./CHANGELOG.md) — 当月变更（倒序）；跨月记录从 git 历史追溯，不再在仓库内分层归档。

## 维护规则

- 默认只读 Current；一次性报告 / 计划不入库，完成后归档到本地 `.archive/` 或从 git 历史追溯，Current 文档不保留执行历史。
- 新增 / 修改文档必须在文件头声明 `状态：... · 最后复核：YYYY-MM-DD`；Current 文档复核日期不得早于该文件最后一次提交。
- Current 文档必须登记到本索引；Historical 只保留 `CHANGELOG.md`，更早记录以 git 历史为准。
- 代码事实（文件数、版本号、路由数、测试数）不在文档中硬编码；以代码 / 生成物为准。
- 文档只写职责与边界增量，不复制 `AGENTS.md`、`TDD.md`、`DESIGN.md` 或知识库正文。
- `pnpm docs:check` 校验本地链接、内联代码中的仓库路径、标题锚点、`pnpm` 脚本、孤儿文档、索引覆盖、状态声明与文件头最后复核日期；历史记录的断链与路径只告警。
- 新增跨模块能力、阈值或持久化契约时，改代码与测试即可；只有需要解释「为什么」时写入 `DECISIONS.md`。