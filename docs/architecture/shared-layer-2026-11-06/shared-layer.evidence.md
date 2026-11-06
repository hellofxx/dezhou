# shared 层引用现状 · 证据索引

> 状态：Snapshot · 证据基线 2026-11-06 · 工作树（采集时存在并发写入；随后并发提交落库，src 引用计数复核不变）。
> 配套图源：[`10-shared-consumers.dot`](10-shared-consumers.dot) · [`20-shared-internals.dot`](20-shared-internals.dot) · [`30-shared-runtime-channels.dot`](30-shared-runtime-channels.dot)
> 配套表：[`shared-fanin-appendix.md`](shared-fanin-appendix.md)（88 个文件逐条）· 可读总结：[`shared-layer.summary.md`](shared-layer.summary.md)
> 置信度：`high` = 代码/配置直接证据；`medium` = 多个间接信号一致；`low` = 命名或结构推断；`unknown` = 待查。

## 0. 采集方法与口径

- 范围：`src/**/*.ts(x)`，排除 `.d.ts`、`node_modules`、`dist`。共 **1128** 个源文件（含 449 个测试文件）。
- 解析：`@/` 别名 + 相对路径 + `index.ts` barrel + 静态 `import/export from` + 动态 `import()`；注释先剥离。解析逻辑与 [`src/test-utils/admissionGraph.ts`](../../../src/test-utils/admissionGraph.ts) 对齐。
- **边** = `importer 文件 → 解析后的目标文件` 去重后的文件对；同一对文件多次 import 只计 1 条。不是 import 语句数。
- **直接消费者** = 直接 import 该 shared 文件的 feature 模块 / shell 组；**传递消费者** = 沿 shared 内部 import 反向闭包累计后的模块集合（准入守卫口径，[`admissionGraph.ts:226-279`](../../../src/test-utils/admissionGraph.ts)）。
- 测试文件不计入生产消费者；`shell` 指 `main.tsx` / `App.tsx` / `app/` / `layouts/`（`i18n/` 实测 0 条 shared 入边）。
- 运行：一次性扫描脚本 `.archive/arch-model-2026-11-06/scan.mjs`（`.archive/` 已忽略，不入库）；结果 `scan-result.json` 同目录。
- 代码为唯一事实源；本文件数值是 2026-11-06 快照。

## 1. 结构计数（high）

| 事实 | 数值 | 来源 |
|---|---:|---|
| feature 模块 | 10 | `src/features/` 目录；`docs/agents/MODULE_MAP.md` |
| 懒加载路由条目 / 已声明 URL | 44 / 44 | `docs/agents/MODULE_MAP.md`（由 `src/app/routes.tsx` 生成） |
| feature 生产源文件 | 568 | 本次扫描 |
| shared 生产源文件 | 88 | 本次扫描（另有 45 个 shared 测试文件） |
| shared 子域 | 14 | `src/shared/AGENTS.md` §目录结构 + 实测 |
| feature → shared 直接入边 | 634 | 本次扫描 |
| shell → shared 直接入边 | 16 | 本次扫描 |
| **shared 直接入边合计** | **650** | 本次扫描 |
| shared 内部直接边 | 104（跨子域 82 + 子域内自引 22） | 本次扫描 |
| shared → feature 入边 | **0** | 本次扫描 + `eslint.config.js:63-75` 硬约束 |
| feature → feature 入边 | 44，全部指向 `progress` | 本次扫描 + `eslint.config.js:25-36` |

持久化 store（用于理解 shared `debugMode` 与各模块边界，来源 `docs/agents/MODULE_MAP.md` 与代码）：progress `v18`、strategy-academy `v8`、theory-academy `v5`、puzzle-trainer `v3`、shared/debugMode `v1`（[`debugMode.ts:45-48`](../../../src/shared/stores/debugMode.ts)）。

## 2. 消费方节点（high）

| 模块 / shell | 直接入边 | 唯一 shared 文件 | 结构特征 |
|---|---:|---:|---|
| `strategy-academy` | 145 | 41 | 最大消费者；utils 56 / types 24 / components 53 |
| `progress` | 111 | 29 | 逻辑与 UI 并重；utils 43 / ui 30 / runtime 10 |
| `theory-academy` | 111 | 34 | 契约与逻辑均衡；types 35 / utils 37 |
| `gto-simulator` | 82 | 27 | 契约型：types 44 / constants 4 |
| `range-trainer` | 60 | 25 | types 27 / ui 10 / utils 10 |
| `hand-history` | 39 | 14 | 契约型：types 28 / utils 5；无 runtime 边 |
| `puzzle-trainer` | 37 | 21 | ui 18 / utils 12 / feedback 7 |
| `pot-odds` | 29 | 19 | ui 14 / utils 7 / types 6 |
| `onboarding` | 15 | 7 | ui 6 / types 5；依赖面最窄的训练模块 |
| `help-center` | 5 | 4 | 仅 motion / BackLink / button / EmptyState |
| shell（main / App / routes / layouts） | 16 | 10 | ErrorBoundary / LoadingState / BackLink / tooltip / cn / motion |

`help-center` 的 4 个文件：`utils/motion.ts`、`components/layout/BackLink.tsx`、`components/ui/button.tsx`、`components/feedback/EmptyState.tsx`。`onboarding` 的 7 个：button / cn / types(poker, quiz, position) / QuizCard / optionOrder。

## 3. shared 子域（high）

| 子域 | 生产文件 | 直接入边（feature + shell） | feature 模块数 | 备注 |
|---|---:|---:|---:|---|
| `utils/` | 17 | 195 | 10 | 最大枢纽；`cn` / `motion` 各 10 个直接消费者 |
| `types/` | 15 | 189 | 9 | 9 个模块中仅 `help-center` 未直接引用 |
| `components/ui/` | 8 | 71 | 9 | vendored shadcn；`button` 直接 6 / 传递 11 |
| `components/feedback/` | 10 | 45 | 9 | 五级反馈与结果页装配 |
| `stores/` | 5 | 31 | 7 | 事件总线 + 3 registry + debugMode |
| `components/layout/` | 1 | 29 | 7 | 仅 `BackLink`，却覆盖 8 个消费者（含 shell） |
| `components/poker/` | 9 | 25 | 5 | 牌面/位置可视化，无 help/onboarding |
| `constants/` | 4 | 19 | 5 | `poker` 4 / `app` 6（含 shell） |
| `components/academy/` | 9 | 17 | 2 | 唯一 barrel；仅两院消费 |
| `components/data-display/` | 4 | 14 | 6 | ProgressBar/Ring、StatCard/Pair |
| `hooks/` | 2 | 6 | 5 | useIsMobile / useRovingGridNav |
| `data/` | 1 | 4 | 2 | opponentProfiles |
| `components/system/` | 1 | 3 | 0 | ErrorBoundary 仅被 shell 消费 |
| `components/quiz/` | 2 | 2 | 2 | onboarding / range-trainer 专用 |

### 四层聚合（直接入边）

| 层 | 构成 | 入边（feature + shell） | 消费模块 |
|---|---|---:|---|
| 契约 contracts | `types/` + `constants/` | 208 | 9 个模块 + shell |
| 纯逻辑 logic | `utils/` + `hooks/` + `data/` | 205 | 10 个模块 + shell |
| 组件 ui | `components/*`（44 文件） | 206 | 10 个模块 + shell |
| 运行时 runtime | `stores/` | 31 | 7 个模块 |

三个静态支柱几乎等量（208 / 205 / 206），运行时通道只占 31 条，但语义最重（见 §6）。

### 模块 × 四层矩阵（直接入边）

| 模块 | contracts | logic | ui | runtime | 合计 |
|---|---:|---:|---:|---:|---:|
| strategy-academy | 26 | 58 | 53 | 8 | 145 |
| progress | 18 | 43 | 40 | 10 | 111 |
| theory-academy | 39 | 37 | 29 | 6 | 111 |
| gto-simulator | 48 | 20 | 13 | 1 | 82 |
| range-trainer | 31 | 11 | 15 | 3 | 60 |
| hand-history | 28 | 5 | 6 | 0 | 39 |
| puzzle-trainer | 4 | 13 | 18 | 2 | 37 |
| pot-odds | 6 | 8 | 14 | 1 | 29 |
| onboarding | 5 | 4 | 6 | 0 | 15 |
| help-center | 0 | 2 | 3 | 0 | 5 |
| shell | 3 | 4 | 9 | 0 | 16 |
| **合计** | **208** | **205** | **206** | **31** | **650** |

## 4. 核心 fan-in（high）

`直接` = 直接外部消费者数；`传递` = 含 shared 内部组合后的生产消费者数。

| shared 文件 | 直接 | 传递 | 读法 |
|---|---:|---:|---|
| `utils/cn.ts` | 10 | 11 | 9 模块 + shell；仅 help-center 未直接引 |
| `utils/motion.ts` | 10 | 11 | 10 个模块 + shell 全部直接引 |
| `components/ui/button.tsx` | 6 | 11 | 直接 6 模块，经 shared 组件放大到 11 |
| `components/layout/BackLink.tsx` | 8 | 8 | 7 模块 + shell；单文件子域 |
| `types/common.ts` | 6 | 8 | 共享基础类型 |
| `types/poker.ts` | 6 | 8 | 牌面/动作基础类型 |
| `stores/trainingEvents.ts` | 7 | 7 | 6 训练模块 emit + progress 订阅 |
| `constants/poker.ts` | 4 | 7 | 经 shared 类型/工具组合放大 |
| `types/decisionFeedback.ts` | 6 | 7 | 五级评级唯一入口 |
| `types/training.ts` | 1 | 7 | 仅 progress 直引；经 trainingEvents 传递到 7 模块 |
| `components/feedback/LoadingState.tsx` | 6 | 6 | 含 `app/routes.tsx` |
| `components/feedback/GradeIcon.tsx` | 4 | 6 | 反馈图标 |
| `components/feedback/MobileFeedbackSheet.tsx` | 4 | 6 | 含 `layouts/` |
| `components/ui/card.tsx` | 5 | 6 | 5 模块 + 组合放大 |
| `constants/app.ts` | 6 | 6 | 含 main / layouts |
| `utils/spacedRepetition.ts` | 6 | 6 | SRS 纯函数 |
| `utils/seededShuffle.ts` | 4 | 6 | 随机底座 |
| `utils/toLocalDateKey.ts` | 2 | 6 | 经 progress/strategy 放大 |
| `components/poker/CardBack.tsx` | 1 | 6 | 仅 progress 直引，经 Card 传递 |
| `components/feedback/ComparisonView.tsx` | 0 | 5 | 仅经 DecisionAnalysis 被引用 |
| `components/poker/CardSVG.tsx` | 0 | 5 | 仅经 Card 被引用 |

完整 88 行见 [`shared-fanin-appendix.md`](shared-fanin-appendix.md)。

**传递放大效应**：shared 内部组合是常态，因此「传递消费者数」高于「直接消费者数」的条目集中在组件装配体与类型契约上。典型：`button` 6→11、`CardBack` 1→6、`CardSVG` 0→5、`ComparisonView` 0→5、`types/training` 1→7。准入守卫按传递闭包判定，这是有意的口径（避免共享组件内部的单点被误判为单消费者）。

## 5. `components/ui/` 逐件（high）

| 组件 | 直接外部消费者 | 消费者 |
|---|---:|---|
| `button.tsx` | 6 | help-center, onboarding, pot-odds, progress, puzzle-trainer, range-trainer（经 shared 内部组合后传递消费者 11） |
| `card.tsx` | 5 | gto-simulator, pot-odds, progress, puzzle-trainer, range-trainer |
| `dialog.tsx` | 4 | progress, strategy-academy, theory-academy, shell:layouts |
| `toast.tsx` | 3 | strategy-academy, theory-academy, shell:main（经 App） |
| `input.tsx` | 2 | pot-odds, theory-academy |
| `progress.tsx` | 2 | puzzle-trainer, range-trainer |
| `select.tsx` | 2 | progress, range-trainer |
| `tooltip.tsx` | 1 | shell:layouts（[`AppLayout.tsx:21`](../../../src/layouts/AppLayout.tsx)） |

`tooltip` 是唯一低于「≥2」的 ui 组件；`components/ui/**` 被 AGENTS.md 豁免 ≥2 门槛，但仍要求至少 1 个消费者，当前满足。

## 6. 运行时通道与注册表（high）

| 通道 | shared 文件 | 写入方 | 读取方 | 关键 sourceRefs |
|---|---|---|---|---|
| 训练事件总线 | `stores/trainingEvents.ts` | range / pot-odds / gto / puzzle / strategy / theory 共 6 个 emit 模块 | progress 订阅 | `RangeQuizPage.tsx:47`、`PotOddsQuizPage.tsx:218`、`GTOSessionPage.tsx:158`、`usePuzzleSession.ts:70`、`strategy-academy/store.ts:239,347` + `completeCourse.ts:58,76`、`theory-academy/store.ts:116`、`progress/store.bootstrap.ts:59` |
| 成就数据源注册 | `stores/achievementRegistry.ts` | strategy / puzzle / theory | progress | 注册 `store.bootstrap.ts:19` / `:11` / `:16`；读取 `progress/store.ts:1057-1126` |
| 学院数据源注册 | `stores/academyDataSourceRegistry.ts` | strategy-academy | progress | 注册 [`strategy-academy/store.bootstrap.ts:51`](../../../src/features/strategy-academy/store.bootstrap.ts)；读取 [`useAcademyDataSource.ts:26`](../../../src/features/progress/hooks/useAcademyDataSource.ts)、[`dailyTrainingPlan.ts:123`](../../../src/features/progress/utils/dailyTrainingPlan.ts) |
| 理论数据源注册 | `stores/theoryDataSourceRegistry.ts` | theory-academy | progress | 注册 [`theory-academy/store.bootstrap.ts:67`](../../../src/features/theory-academy/store.bootstrap.ts)；读取 [`theoryPlanRecommendations.ts:66`](../../../src/features/progress/utils/theoryPlanRecommendations.ts) |
| 调试解锁 | `stores/debugMode.ts` | progress SettingsPage 激活/关闭 | progress / range / strategy / theory | [`debugMode.ts:32-58`](../../../src/shared/stores/debugMode.ts)；消费点见 §6.1 |

### 6.1 debugMode 消费点（4 个模块）

- progress：`SessionLimitGuard.tsx:45`、`SettingsPage.tsx:102-104`
- range-trainer：`QuizConfig.tsx:94`、`RangeSelector.tsx:43`
- strategy-academy：`ConceptGraph.tsx:309`、`CourseView.tsx:69`、`LearningTracksView.tsx:36`、`store.ts:56`
- theory-academy：`TheoryChapterView.tsx:44`、`TheoryLearningPaths.tsx:32`、`store.ts:11`

与 AGENTS.md 的「9 处门禁」口径一致（组件/Store 消费点聚合为 4 个模块依赖边，不代表只有 4 处判定）。

### 6.2 豁免

- `hand-history`：`hand-history/store.ts:7-10` 注释明确豁免 `trainingEvents.emit`（非交互式训练）。
- `help-center`：`help-center/index.ts:4` 注释明确豁免 emit（静态教程）。
- 两者仍正常使用 shared 的 UI / 类型 / 工具，不改变静态依赖图。

## 7. 准入与守卫事实（high）

- 守卫实现：[`src/shared/admission-guard.test.ts`](../../../src/shared/admission-guard.test.ts)。规则：0 生产消费者失败；1 生产消费者失败（`components/ui/**` 豁免 ≥2）；baseline 为空且只降不升（`ZERO_CONSUMER_BASELINE` / `ONE_CONSUMER_BASELINE`，[:26-35](../../../src/shared/admission-guard.test.ts)）。
- 测试桩例外：`utils/localStorageStub.ts` / `utils/persistShape.ts` 按测试消费者计数，禁止生产引用，禁止登记 baseline（`admission-guard.test.ts:26-29`）。
- 当前 88 个生产文件的传递消费者分布：

| 传递消费者数 | 文件数 | 说明 |
|---:|---:|---|
| 0 | 2 | 两个测试桩（按设计） |
| 1 | 1 | `components/ui/tooltip.tsx`（ui 豁免；shell:layouts） |
| 2 | 39 | 准入下限，集中在 academy / 两院数据源 / quiz 等 |
| 3 | 11 | |
| 4 | 7 | |
| 5 | 9 | |
| 6 | 9 | |
| 7 | 4 | |
| 8 | 3 | |
| 11 | 3 | `cn` / `motion` / `button` |

- 39 个「恰好 2 消费者」文件主要是：`components/academy/*`（9）、两院数据类型与数据源（`academy*` / `theoryDataSource` / `variantRules`）、`components/data-display` 的 ProgressBar/Ring/StatPair、`components/quiz/*`，以及少量双消费工具（`deck` / `handClassifier` / `headsUpRules` / `opponentProfiles`）。
- `eslint.config.js` 自证：`shared` 层禁止 `@/features/`；feature 间只允许 `ALLOWED_CROSS_IMPORTS` 中的 7 条「模块 → progress」边（[:25-36](../../../eslint.config.js)、[:63-75](../../../eslint.config.js)）。本次扫描结果与白名单逐条相等。

## 8. 假设、未知与验证任务

| # | 陈述 | 置信度 | 处理 / 验证 |
|---|---|---|---|
| 8.1 | 「import 图 ≠ 运行时调用图」 | — | 本模型只证明静态引用与可达性；不做 bundle / tree-shaking / 运行时 trace。需要体积结论时另跑 `pnpm build` + `pnpm size:check`。 |
| 8.2 | barrel 粒度：`components/academy/index.ts` 使 8 个组件都以「整组」形式被两院引用 | high（结构）/ unknown（单组件实际使用） | 若要精确到组件级，需读两院包装层的具体导入；本模型只到 barrel 层。 |
| 8.3 | `academyDataSourceRegistry.ts:2-3` 注释称 strategy / puzzle / theory 三方注册，实测仅 strategy-academy 调用 `registerAcademyDataSource` | high（调用点） | **注释漂移**：puzzle / theory 注册的是成就源；theory 另有理论数据源。以调用点为准；注释与实现是否应统一，待维护者确认，不影响当前运行路径。 |
| 8.4 | `components/ui/tooltip.tsx` 仅 `AppLayout` 一个消费者 | high | ui 豁免 ≥2 是 AGENTS.md 明示规则；是否需要保留由 UI 负责人确认。 |
| 8.5 | 测试覆盖：88 个 shared 文件中 67 个至少有一个测试消费者；45 个 shared 测试文件 | high（结构） | 覆盖率高不代表行覆盖率；`pnpm test:coverage` 才能给数值。 |
| 8.6 | 父目录 `docs/architecture/` 的 C4 / 依赖图仍是 2026-08-30 基线（例如路由 33 → 现 44、persist 版本更新） | high | 本专项视图不自动刷新父模型；跨模块边 / 路由 / 持久化变更后按父 README §基线与更新方式复核。 |
| 8.7 | `shared → feature` 为 0 是静态事实 | high | eslint 硬约束 + 本次扫描双证；当前扫描覆盖 `@/` 与相对路径，其他解析路径是否绕过 lint 属未验证范围。 |

## 9. 复核命令

```powershell
# 1) 准入守卫（0 / 1 消费者、baseline、测试桩）
pnpm test src/shared/admission-guard.test.ts

# 2) shared → feature 应为空
Get-ChildItem src/shared -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern '@/features/' -SimpleMatch

# 3) 跨模块边（应与 eslint.config.js ALLOWED_CROSS_IMPORTS 逐条相等）
Get-ChildItem src/features -Directory | ForEach-Object {
  $hits = Get-ChildItem $_.FullName -Recurse -Include *.ts,*.tsx |
    Select-String -Pattern "from '@/features/"
  if ($hits) {
    Write-Output "== $($_.Name)"
    $hits | ForEach-Object { $_.Line.Trim() } | Sort-Object -Unique
  }
}

# 4) 运行时通道两侧
Get-ChildItem src/features -Recurse -Include *.ts,*.tsx |
  Select-String -Pattern 'trainingEvents|registerAchievementSource|registerAcademyDataSource|registerTheoryDataSource|useDebugModeStore'

# 5) 渲染图源（本机未安装 graphviz；Qoder 可直接预览 .dot）
dot -Tsvg docs/architecture/shared-layer-2026-11-06/10-shared-consumers.dot `
  -o docs/architecture/shared-layer-2026-11-06/10-shared-consumers.svg
```

一次性扫描脚本未入库（`.archive/` 已忽略）：`node .archive/arch-model-2026-11-06/scan.mjs`；若目录被清理，按上述命令 + `admissionGraph.ts` 口径重建。

## 10. 代表 sourceRefs

| 主题 | 路径 |
|---|---|
| 准入门槛 / 目录 / 导入规则 | `src/shared/AGENTS.md:5-12, 55-61` |
| 准入守卫与 baseline | `src/shared/admission-guard.test.ts:26-35, 60-144` |
| 消费者传递闭包 | `src/test-utils/admissionGraph.ts:226-279` |
| 模块隔离白名单 | `eslint.config.js:25-36` |
| shared 禁 import feature | `eslint.config.js:63-75` |
| 模块 / 路由 / persist 版本 | `docs/agents/MODULE_MAP.md` |
| 事件总线 | `src/shared/stores/trainingEvents.ts:12-28`；`src/features/progress/store.bootstrap.ts:59` |
| 成就注册表 | `src/shared/stores/achievementRegistry.ts:14-33` |
| 学院数据源注册表 | `src/shared/stores/academyDataSourceRegistry.ts:12-37` |
| 理论数据源注册表 | `src/shared/stores/theoryDataSourceRegistry.ts` |
| 调试解锁 | `src/shared/stores/debugMode.ts:32-58` |
| 五级评级 | `src/shared/types/decisionFeedback.ts:15, 38-56` |
| academy barrel | `src/shared/components/academy/index.ts:1-38` |
| shell 消费 | `src/main.tsx:5`、`src/App.tsx:4-5`、`src/app/routes.tsx:5-6`、`src/layouts/AppLayout.tsx:5-21` |
