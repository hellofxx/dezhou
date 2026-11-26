# 贡献指南

> 状态：Current · 最后复核：2026-11-26

本文件只提供入口与最短路径；规则正文以 [`AGENTS.md`](./AGENTS.md)、[`docs/README.md`](./docs/README.md) 与 [`docs/TDD.md`](./docs/TDD.md) §18 为准。

## 先读什么

1. [`README.md`](./README.md) — 项目定位、命令、部署入口。
2. [`AGENTS.md`](./AGENTS.md) — 硬约束、任务路由、质量门禁、文件所有权。
3. [`docs/README.md`](./docs/README.md) — Current / Generated / Snapshot / Historical 文档索引。

按任务类型继续读：

| 任务 | 继续阅读 |
|---|---|
| UI / 视觉 / 响应式 | [`DESIGN.md`](./DESIGN.md) |
| 新模块 / 路由 / 跨模块 | `AGENTS.md` §代码组织 + §操作指南「新增模块」 |
| 测试 / 守卫 | [`docs/TDD.md`](./docs/TDD.md) §18 + `AGENTS.md` §操作指南「新增守卫」 |
| 课程 / 题库内容 | `AGENTS.md` §国际化 + `docs/PRD.md` 内容规格 |
| 部署 / 发布 | [`README.md`](./README.md) §部署与回滚 |

## 本地启动

```powershell
pnpm install
pnpm dev
```

Node 版本以 `.nvmrc` 为准，pnpm 版本以 `package.json` 的 `packageManager` 为准；禁止 npm / yarn。

## 提交前

```powershell
pnpm verify
```

涉及路由、布局、持久化或离线行为时，还必须在真实浏览器跑通：

```powershell
pnpm verify:e2e
```

文档变更至少运行：

```powershell
pnpm docs:check
```

路由 / 模块 / i18n 注册表变更后运行：

```powershell
pnpm agents:map
```

## 提交与 PR

- 一个逻辑单元一个 commit，信息格式 `type(scope): description`（scope 为模块目录名）。
- PR 使用 [`.github/PULL_REQUEST_TEMPLATE.md`](./.github/PULL_REQUEST_TEMPLATE.md) 的清单，逐项如实勾选。
- 默认不直接 push 到 `main`；发布由 `main` 的部署流水线完成。
- 缺陷修复附回归测试；课程 / 题库变更同批通过内容守卫。

## 文件所有权

- `src/features/<module>/**` 归该模块；`src/shared/**`、`src/app/**`、`src/layouts/**`、`src/i18n/**`、`src/guards/**`、`scripts/**` 为平台层。
- 模块间禁止直接引用；允许边以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源。
- `shared/` 只接收 ≥2 个模块使用的代码；跨模块状态集中在 progress，并只经公共入口访问。

## 文档变更

- 新增文档先在 [`docs/README.md`](./docs/README.md) 判断状态并登记。
- 文件头必须写 `状态：... · 最后复核：YYYY-MM-DD`；Current 文档的复核日期不得早于最后一次提交。
- 一次性报告 / 计划不入库，归档到本地 `.archive/` 或从 git 历史追溯；`CHANGELOG` 只保留当月变更。
- 不复制 `AGENTS.md`、`docs/TDD.md`、`DESIGN.md` 的正文；只写增量与指针。

安全问题请不要开公开 Issue，按 [`SECURITY.md`](./SECURITY.md) 报告。