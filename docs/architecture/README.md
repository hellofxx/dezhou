# docs/architecture · 当前态架构模型（Snapshot）

> 状态：Snapshot · 证据基线 2026-08-30 @ `c966912`。代码已演进，依赖本模型前先按 `00-evidence.md` §5 复核。
> 刷新触发：跨模块边 / 路由 / 持久化变更后，或每季度；最近复核 2026-11-04。
> 本目录只保留当前态模型；历史评审、补救计划与 UI/UX 执行记录已归档到 [`../history/architecture/`](../history/architecture/)。

`system-modeler`（架构场景）+ `c4model` / `graphviz`（图源格式）产出，回答一个问题：
**PokerLab 现在是什么架构，由哪些部分组成，边界与跨模块关系如何。**

## 阅读顺序

| 顺序 | 文件 | 层级 | 回答的问题 |
|---|---|---|---|
| 1 | [`business-architecture.md`](business-architecture.md) | 全层 | 系统边界、业务能力、领域实体、四条跨模块通道、数据与生命周期、分模块细节、未知项 |
| 2 | [`pokerlab.structurizr.dsl`](pokerlab.structurizr.dsl) | L1→L3 | 三张 C4 视图：`Context`（学员 / 外部文件 / Pages / 浏览器）、`Containers`（SPA / SW / Worker / localStorage / IndexedDB）、`Components`（10 模块 + 中枢 + shared） |
| 3 | [`10-modules-dependency.dot`](10-modules-dependency.dot) | L3 依赖 | 谁依赖谁；四条跨模块通道（import 白名单 / 事件总线 / 注册表倒置 / shared 层）分别在哪 |
| 4 | [`20-training-data-flow.dot`](20-training-data-flow.dot) | 流程 | 学员答完一道题后，数据经过哪些函数、落到哪、谁读 |
| 5 | [`30-progress-hub.dot`](30-progress-hub.dot) | 细节 | progress 中枢的对外写接口面、五大子系统、注册表、落盘分路与读侧 |
| 6 | [`00-evidence.md`](00-evidence.md) | 证据 | 每个节点 / 边的 `路径:行` 出处、置信度、假设、未知项与复核命令 |

## 决策记录

- [`../adr/README.md`](../adr/README.md) — 架构决策记录（ADR）：纯前端本地优先、Feature-first 边界、progress 单中枢。

## 历史评审与计划

- [`../history/architecture/architecture-review-2026-08-30.md`](../history/architecture/architecture-review-2026-08-30.md) — R1–R11 架构评审
- [`../history/architecture/module-boundary-review-2026-09-21.md`](../history/architecture/module-boundary-review-2026-09-21.md) — 模块边界与依赖审查（A1/A2 等 P0 已修复）
- [`../history/architecture/remediation-plan-2026-09.md`](../history/architecture/remediation-plan-2026-09.md) — 补救切片 S1–S13
- [`../history/architecture/ui-ux-phase2-plan-2026-11.md`](../history/architecture/ui-ux-phase2-plan-2026-11.md) — UI/UX Phase 2 执行记录
- [`../history/README.md`](../history/README.md) — 全部历史文档索引

## 查看图形

- **推荐**：在 Qoder 中直接打开 `.dsl`（Structurizr DSL viewer）或 `.dot`（Graphviz DOT viewer）预览。
- 本机未安装 graphviz。若要导出图片：

```powershell
dot -Tsvg docs/architecture/10-modules-dependency.dot -o docs/architecture/10-modules-dependency.svg
dot -Tsvg docs/architecture/20-training-data-flow.dot   -o docs/architecture/20-training-data-flow.svg
dot -Tsvg docs/architecture/30-progress-hub.dot         -o docs/architecture/30-progress-hub.svg
```

`.dsl` 可用任意 Structurizr 兼容工具渲染；本仓库以 `.dsl` / `.dot` 文本为事实源，导出的 SVG/PNG 是派生物，不要手改后回流。

## 基线与更新方式

- 证据基线：工作树 @ `c966912`（含 85 项未提交改动），采集于 2026-08-30。
- **模型反映工作树，不是 HEAD**。要与提交对齐，在干净工作区重跑采集。
- 代码变更后如何刷新：按 `00-evidence.md` §5 的复核命令重跑（跨模块边、persist name/version、事件总线两侧、结构计数），有差异时改图源文本，**不要改导出的图片**。
- 关键不变量：本模型中「跨模块 import 边」应与 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 逐条相等；若 `pnpm test` 的 `src/guards/eslintCrossImports.test.ts` 变红，本目录的依赖图即为过期信号。
- 文档中的数值（文件数、题目数、路由数、persist version）为**采集时点快照**；仓库自身约定以代码为唯一事实源，长期数值请回读代码。
