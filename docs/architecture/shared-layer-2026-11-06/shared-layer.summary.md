# PokerLab 当前态架构模型 · shared 层引用现状

> 状态：Snapshot · 证据基线 2026-11-06 · 工作树（采集后出现并发提交，src 引用计数复核不变）。
> 回答的问题：**现在的代码里，10 个 feature 模块与应用外壳如何引用 `src/shared`，shared 内部又长成什么形状？**
> 图源：[`10-shared-consumers.dot`](10-shared-consumers.dot) · [`20-shared-internals.dot`](20-shared-internals.dot) · [`30-shared-runtime-channels.dot`](30-shared-runtime-channels.dot) ｜ 证据：[`shared-layer.evidence.md`](shared-layer.evidence.md) ｜ 全表：[`shared-fanin-appendix.md`](shared-fanin-appendix.md)

## 一句话结论

`src/shared` 不是一个松散的共用抽屉，而是一个**有准入门槛、无反向依赖、内部单向分层**的底座：88 个生产文件承接 **650 条直接 import 边**；`shared → feature` 实测 **0 条**；三个静态支柱（契约 208 / 逻辑 205 / 组件 206）几乎等量，运行时通道只占 31 条但承担事件总线、注册表倒置与调试开关。

## 1. 系统边界（current）

- **纯前端 SPA，零后端依赖**：Vite + React 19，构建产物发布到 GitHub Pages（`base=/dezhou/`）；无 API / 服务端进程 / 账号体系。
- **10 个 feature 模块 + 平台外壳**：44 条懒加载路由；外壳由 `main.tsx` / `App.tsx` / `app/routes.tsx` / `layouts/` 组成。
- **本地数据面**：`localStorage`（progress v18 / strategy v8 / theory v5 / puzzle v3 / debugMode v1）+ IndexedDB（训练记录、手牌库）；Service Worker 离线缓存；hand-history 另用 Web Worker 做 GTO 偏差计算。
- **启动顺序**：`main.tsx` 先启动 progress hydration 与事件订阅，再后台动态 import 三个学院 bootstrap；首屏只等 persist hydration，3 秒超时兜底渲染（`src/main.tsx:16-57`）。
- L1/L2 的系统上下文与容器图沿用父目录 [`../pokerlab.structurizr.dsl`](../pokerlab.structurizr.dsl)（C4 基线 2026-08-30）；本文与三张图只做 **L3/L4 的 shared 专项刷新**，不替换父模型的其余视图。

## 2. 谁在引用 shared

| 消费方 | 直接入边 | 唯一文件 | 画像 |
|---|---:|---:|---|
| strategy-academy | 145 | 41 | 最大消费者；逻辑 + UI 双重重仓 |
| progress | 111 | 29 | 逻辑/UI 并重，且是三个注册表的唯一读取方 |
| theory-academy | 111 | 34 | 契约与逻辑均衡 |
| gto-simulator | 82 | 27 | 契约型：一半入边是 `types/` |
| range-trainer | 60 | 25 | 类型与 UI 并重 |
| hand-history | 39 | 14 | 契约型；无运行时通道 |
| puzzle-trainer | 37 | 21 | 反馈组件 + 工具 |
| pot-odds | 29 | 19 | UI 型 |
| onboarding | 15 | 7 | 依赖面最窄的训练模块 |
| help-center | 5 | 4 | 仅 motion / BackLink / button / EmptyState |
| shell | 16 | 10 | ErrorBoundary / LoadingState / BackLink / tooltip / cn / motion |

模块画像的关键差异：

- **契约重**：gto-simulator（48/82）、hand-history（28/39）、range-trainer（31/60）——它们主要共享类型与常量，组件复用较少。
- **逻辑 + UI 重**：strategy-academy（58 + 53）、progress（43 + 40）、theory-academy（37 + 29）——学院与中枢把纯函数、反馈组件、布局件都当基础设施用。
- **UI 重**：pot-odds（14/29）、puzzle-trainer（18/37）——题型交互多，逻辑复用少。
- **最小面**：help-center 只碰 4 个文件、5 条边，是 shared 的最小消费者。

## 3. shared 的内部形状

- **44 个组件文件 + 44 个非组件文件**，分 14 个子域。
- **内部 104 条边**：跨子域 82 条 + 子域内自引 22 条；方向恒定——`components/* → utils/types/constants`、`logic → types/constants`、`stores → types`，没有反向层级回边。
- **底座**：`types/`（15 文件，189 入边）与 `utils/`（17 文件，195 入边）是真正的地基；`constants/` 只 4 文件但被 5 个模块 + shell 使用。
- **最大的单文件枢纽**：`utils/cn.ts` 与 `utils/motion.ts` 各有 **10 个直接外部消费者**（9 个模块 + layouts）；`BackLink` 单文件覆盖 8 个消费者；`trainingEvents` 被 7 个消费者直接引用。
- **准入贴地飞行**：88 个文件里 **39 个恰好 2 个传递消费者**，3 个达到 11 个；除 2 个测试桩外没有 0 消费者文件，另有 1 个 ui 组件（tooltip）仅 shell 消费。这说明 shared 被持续回迁/清理过，没有明显「预留将来用」的沉积。

### 传递效应要分清

准入守卫统计的是**传递闭包**，不是直接 importer 数。几个典型：

| 文件 | 直接外部消费者 | 传递消费者 | 原因 |
|---|---:|---:|---|
| `components/ui/button.tsx` | 6 | 11 | 被 shared 内部组件继续组合 |
| `components/poker/CardBack.tsx` | 1 | 6 | 经 `Card` 传递 |
| `components/poker/CardSVG.tsx` | 0 | 5 | 仅经 `Card` 被引用 |
| `components/feedback/ComparisonView.tsx` | 0 | 5 | 仅经 `DecisionAnalysis` 被引用 |
| `types/training.ts` | 1 | 7 | 仅 progress 直引，经 `trainingEvents` 类型传递 |

因此「传递数高」不等于「每个模块都直接依赖它」；看真实耦合面时应以直接列为准。

## 4. 运行时通道（静态 import 之外）

| 通道 | 写侧 | 读侧 | 结论 |
|---|---|---|---|
| `trainingEvents` 事件总线 | 6 个训练模块 emit | progress 订阅 | 同步回调、单个订阅方异常隔离；hand-history / help-center 代码注释明确豁免 |
| `achievementRegistry` | strategy / puzzle / theory 注册 | progress 遍历 | 按 id upsert，读侧 8 处条件检查 |
| `academyDataSourceRegistry` | strategy-academy 注册 | progress 查询/订阅 | late-registration 自愈，避免 Dashboard 丢数据 |
| `theoryDataSourceRegistry` | theory-academy 注册 | progress 查询 | 每日计划/下一章推荐，禁止 progress import theory |
| `debugMode` | SettingsPage 激活/关闭 | progress / range / strategy / theory | 4 个模块、9 处门禁的全局旁路 |

这些通道是「行为证据」，与静态 import 图分图表达（[`30-shared-runtime-channels.dot`](30-shared-runtime-channels.dot)）。

## 5. 边界、未知与维护

- **本模型证明静态引用与可达性**，不证明运行时调用、bundle 归属或 tree-shaking 结果；体积结论需另跑 `pnpm build` + `pnpm size:check`。
- **barrel 粒度**：`components/academy/index.ts` 是唯一目录级 barrel；8 个学院组件都以「整组」形式被两院引用，单组件实际使用率未在本模型展开。
- **一处注释漂移**：`academyDataSourceRegistry.ts:2-3` 称 strategy / puzzle / theory 三方注册，实测仅 strategy-academy 调用 `registerAcademyDataSource`；puzzle / theory 注册的是成就源，theory 另有理论数据源。以调用点为准，注释与实现是否应统一待确认，当前不影响运行路径。
- **父快照未同步**：`docs/architecture/` 的 C4 与依赖图仍是 2026-08-30 基线（路由已从 33 增至 44，persist 版本已更新）；本专项视图不自动刷新父模型。
- **维护触发**：新增/删除 shared 文件、改变模块消费者、修改 `ALLOWED_CROSS_IMPORTS`、改事件总线/注册表接线后，按 [`shared-layer.evidence.md`](shared-layer.evidence.md) §9 复核并重跑 `pnpm test src/shared/admission-guard.test.ts`。

## 6. 怎么读这套产物

1. 先看 [`10-shared-consumers.dot`](10-shared-consumers.dot)：模块 → 四层，回答「谁用得多、用在哪一层」。
2. 再看 [`20-shared-internals.dot`](20-shared-internals.dot)：shared 内部谁托着谁，回答「底座与装配体」。
3. 需要行为视角时看 [`30-shared-runtime-channels.dot`](30-shared-runtime-channels.dot)：事件总线与注册表倒置。
4. 核对具体文件时查 [`shared-fanin-appendix.md`](shared-fanin-appendix.md)（88 行逐文件 fan-in）。
5. 需要完整系统上下文时回到父目录 [`../README.md`](../README.md) 的 C4 / 数据流 / progress 中枢视图（注意其基线日期）。
