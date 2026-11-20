# docs/agents — 代理协作指南

> 状态：Current · 最后复核：2026-11-16
> 根 [AGENTS.md](../../AGENTS.md) 是全局约束、任务路由与跨模块能力归属的单一事实源；本页约定派单、文件所有权与交付方式。

## 文件与维护

- [MODULE_MAP.md](./MODULE_MAP.md)：从代码生成的模块、路由、i18n 与依赖地图，不手改。
- [TEMPLATE-dev.md](./TEMPLATE-dev.md)：新增 feature 代理模板。
- [.claude/agents/](../../.claude/agents/)：项目代理物理源文件；只在此修改，`.qoder/agents/` 是兼容链接。
- `builtin/` 中无职责正文的运行配置不套用 feature 模板；不借正文整理调整其模型或权限。

## 分工

| 代理 | 主责 | 交接边界 |
|---|---|---|
| `platform-dev` | 启动、路由、构建、共享契约、registry、跨模块集成 | 不接管 feature 业务或 progress store；视觉交 UI |
| `ui-ux-dev` | 设计、主题、响应式、可访问性与视觉复核 | feature 组件默认由模块代理实现；共享/布局先确认单写者 |
| `progress-dev` | 五大系统、训练公共 API、QuickDrill 状态、统计、设置、OnboardingGate、总线实现 | 各 trainer 的题目与流程交各模块；共享变更经平台协调 |
| `range-trainer-dev` | 范围网格、位置解锁、翻前测验 | 共享解析器归平台；频率对齐 GTO 数据 |
| `pot-odds-dev` | 赔率/EV 数学、输入图表、赔率测验 | 数学留本模块；共享排序与评级归平台 |
| `gto-simulator-dev` | 策略数据、Spot、多步场景、策略矩阵 | 翻前频率变更协同范围模块；不持有复盘 Worker |
| `hand-history-dev` | 导入、回放、标注、IndexedDB、复盘 Worker | 豁免训练事件，不调用训练评分 |
| `puzzle-trainer-dev` | Rush / Daily / Theme Drill、本地最佳与每日标记 | QuickDrill 界面归策略，连续奖励状态归 progress |
| `onboarding-dev` | 引导步骤、定位、首训、偏好采集 | Gate/持久化归 progress，路由布局归平台 |
| `strategy-academy-dev` | 策略课、Drill、认证、学习工具、QuickDrill 界面 | 五大系统归 progress；两院基础件归平台 |
| `theory-academy-dev` | 理论章节、变体、小测、演练、实践桥接 | 策略课变更交策略代理；两院基础件归平台 |
| `help-center-dev` | 教程、快速上手、FAQ、帮助页面 | 静态模块；导航交平台，设置入口交 progress |

## 派单与交付

1. **先读再改**：检查工作区已有改动，读根约束、模块就近 AGENTS（如有）与任务相关入口；知识卡只作导航，冲突时以代码和 Current 文档为准。
2. **明确任务**：主代理给出目标、独占文件、禁止改动区、依赖和验收命令，并说明是只读审查还是实施；子代理可用证据驳回错误前提。
3. **单一写者**：模块源码和本任务对应的双语文案由 owner 修改。共享组件、共同 locale、registry、配置、生成物由主代理明确唯一写者；同文件不并行编辑。
4. **先契约后并行**：跨模块由平台评估并确定接口，各 owner 按互斥文件执行；需要越界时报告 `NEEDS-DECISION`、具体文件与原因，等待协调，不自行扩大权限。
5. **分层验证**：子代理跑本批次定向检查；全部写者结束后，主代理复核实际 diff、同步文档/生成物并跑 `pnpm verify`。UI 与浏览器发布门禁按根 AGENTS.md 执行，不能用单测代替。
6. **如实交付**：返回“改动文件与结果 / 验证命令及退出码 / 未测与阻塞”三段简报，不粘全文。超时不等于通过；中断先核对已落盘修改，不盲目重跑、覆盖或回退。
7. **保留用户控制**：子代理默认不 commit/push，不改变模型、工具、权限或用户已有工作；删除等破坏性动作按授权要求处理。

批量补测只分配本模块测试文件，子代理不改 docs/config/package；主代理统一覆盖率、全量验证与地图同步，详见 [测试规范](../testing/README.md) §13。

## 定义规范

- 文件名与 frontmatter `name` 一致，使用 kebab-case；feature 使用 `<feature-dir>-dev`，与模块一一对应。
- frontmatter 顺序：`name → description → tools → model → skills → mcpServers → additionalPrompt`；description 简述触发条件、主责和关键交接，不列易漂移的数量。
- 正文只保留 `Role / Context / Authority / Constraints / Quality Checklist` 五段，通常含配置头约 60–100 行；优先保留独有红线，不为压行数牺牲正确性。
- Context 指向少量先读入口；Authority 区分默认写域与交接对象；Constraints 写独有约束；Checklist 写本域可验证结果。
- 全局基线和协作协议只引用，不复制技术栈、完整目录、阈值、版本、历史批次或假设中的重试/批处理实现。
- 新增能力只在归属或约束变化时更新代理；普通文件增删、题量或版本变化不复制到代理正文。

## 工具与模型

- `tools` 显式声明，实际配置以各代理 frontmatter 为准；正文精简不改变工具或模型。
- 开发工具集为 Read、Glob、Grep、LSP、GetProblems、SearchReplace、Write、DeleteFile、Bash、GetTerminalOutput。
- `ui-ux-dev`、`help-center-dev` 不含 DeleteFile，但仍可编辑/新建，不能称为“只读代理”；也不能借 Bash 绕过删除限制。
- 新代理从相近职责配置核对可用工具与模型，不猜模型标识；工具存在不代表可以越过任务授权。

## 生成与校验

```powershell
pwsh -NoProfile -File scripts/check-agents-consistency.ps1
node scripts/validate-agent-tools.ts
pnpm docs:check
pnpm agents:map:check
```

一致性脚本检查文件、名称和五段结构，缺失时返回非零；工具检查验证工具清单及模块引用。以上定向检查不能替代项目完整门禁。

只有地图输入变化才运行 `pnpm agents:map`：模块增删、persist 版本、路由、i18n 分组、允许依赖、组件/测试数量或 feature 代理增删。仅改代理正文无需重生成；若已有其他任务修改地图，先协调其写者。

相关入口：[根约束](../../AGENTS.md) · [文档索引](../README.md) · [新增模块流程](../how-to/add-a-feature-module.md)
