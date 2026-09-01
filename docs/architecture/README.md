# docs/architecture · PokerLab 当前态架构模型

`system-modeler`（架构场景）+ `c4model` / `graphviz`（图源格式）产出，回答一个问题：
**PokerLab 现在是什么架构，由哪些部分组成，边界与跨模块关系如何。**

本目录含两类产物：**当前态模型**（1–6，回答"架构是什么"）与**架构评审**（7–9，回答"是否足够健康、该怎么改"）。图语法是否过期、模型与代码是否漂移属 `architecture-health`。

## 阅读顺序

| 顺序 | 文件 | 层级 | 回答的问题 |
|---|---|---|---|
| 1 | [`business-architecture.md`](business-architecture.md) | 全层 | 主报告：系统边界、业务能力、领域实体、四条跨模块通道、数据与生命周期、分模块细节、未知项 |
| 2 | [`pokerlab.structurizr.dsl`](pokerlab.structurizr.dsl) | L1→L3 | 三张 C4 视图：`Context`（学员/外部文件/Pages/浏览器）、`Containers`（SPA/SW/Worker/localStorage/IndexedDB）、`Components`（10 模块 + 中枢 + shared） |
| 3 | [`10-modules-dependency.dot`](10-modules-dependency.dot) | L3 依赖 | 谁依赖谁；四条跨模块通道（import 白名单 / 事件总线 / 注册表倒置 / shared 层）分别在哪 |
| 4 | [`20-training-data-flow.dot`](20-training-data-flow.dot) | 流程 | 学员答完一道题后，数据经过哪些函数、落到哪、谁读 |
| 5 | [`30-progress-hub.dot`](30-progress-hub.dot) | 细节 | progress 中枢的对外写接口面、五大子系统、注册表、落盘分路与读侧 |
| 6 | [`00-evidence.md`](00-evidence.md) | 证据 | 每个节点/边的 `路径:行` 出处、置信度、假设、未知项与复核命令 |
| 7 | [`architecture-review.md`](architecture-review.md) | 评审 | 证据化风险 R1–R11：严重度、置信度、影响路径，每条带验收标准 |
| 8 | [`remediation-plan.md`](remediation-plan.md) | 评审 | 补救切片 S1–S13、波次顺序、归属代理、依赖关系与"不要做什么" |
| 9 | [`risk-map.dot`](risk-map.dot) | 评审 | 三个风险簇如何沿路径传到学员不可再生的学习进度数据 |

## 查看图形

- **推荐**：在 Qoder 中直接打开 `.dsl`（Structurizr DSL viewer）或 `.dot`（Graphviz DOT viewer）预览。
- 本机未安装 graphviz。若要导出图片：

```powershell
# 需先安装 graphviz 并让 dot 在 PATH 中
dot -Tsvg docs/architecture/10-modules-dependency.dot -o docs/architecture/10-modules-dependency.svg
dot -Tsvg docs/architecture/20-training-data-flow.dot   -o docs/architecture/20-training-data-flow.svg
dot -Tsvg docs/architecture/30-progress-hub.dot         -o docs/architecture/30-progress-hub.svg
```

`.dsl` 可用任意 Structurizr 兼容工具渲染；本仓库以 `.dsl` / `.dot` 文本为事实源，导出的 SVG/PNG 是派生物，不要手改后回流。

## 基线与更新方式

- 证据基线：工作树 @ `c966912`（含 85 项未提交改动），采集于 2026-08-30。
- **模型反映工作树，不是 HEAD**。要与提交对齐，在干净工作区重跑采集。
- 代码变更后如何刷新：按 `00-evidence.md` §5 的复核命令重跑（跨模块边、persist name/version、事件总线两侧、结构计数），有差异时改图源文本，**不要改导出的图片**。
- 关键不变量：本模型中"跨模块 import 边"应与 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 逐条相等；若 `pnpm test` 的 `src/eslintCrossImports.test.ts` 变红，本目录的依赖图即为过期信号。
- 文档中的数值（文件数、题目数、路由数、persist version）为**采集时点快照**；仓库自身约定以代码为唯一事实源，长期数值请回读代码。
