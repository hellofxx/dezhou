# 证据索引（Evidence Index）

配套 `pokerlab.structurizr.dsl` / `10-modules-dependency.dot` / `20-training-data-flow.dot` / `30-progress-hub.dot` / `business-architecture.md`。

- 采集时间：2026-08-30；基线：工作树 @ `c966912`（含 85 项未提交改动）
- 采集手段：直接读文件 + `grep` 提取 `@/features/*`、`@/shared/*` import 计数 + 两个 Explore 子代理分头盘点模块内部
- 置信度定义：`high` = 代码/配置/文档直接证据；`medium` = 多个间接信号一致；`low` = 仅凭命名或目录结构推断；`unknown` = 待查
- 说明：本索引的 `sourceRefs` 为 `路径:行` 形式，可直接跳转核对

## 1. 节点证据

### L1 / L2

| 节点 ID | 标签 | 置信度 | sourceRefs |
|---|---|---|---|
| `learner` | 扑克学员 | high | `docs/PRD.md`；`src/features/onboarding/`（单人偏好采集，无账号体系） |
| `pokerRoomExport` | 扑克室手牌历史文件 | high | `src/features/hand-history/parsers/{pokerstars,gg-poker,partypoker}.ts`；`components/HandImporter` |
| `githubPages` | GitHub Pages | high | `vite.config.ts:8`（`base:'/dezhou/'`）；`src/app/routes.tsx:124`；`.github/workflows/deploy.yml:66,79` |
| `browserRuntime` | 浏览器运行时 | high | `src/main.tsx:40-47`；`src/features/hand-history/store.ts:17-34`；`utils/gtoDeviation.ts:133` |
| `pokerlab.spa` | SPA 应用 | high | `src/main.tsx:30-37`；`package.json:28-48`（无服务端依赖）；`vite.config.ts` |
| `pokerlab.sw` | Service Worker | high | `public/sw.js`；`src/main.tsx:43` |
| `pokerlab.gtoWorker` | GTO Web Worker | high | `src/features/hand-history/workers/gtoWorker.ts`；`utils/gtoDeviation.ts:133` |
| `pokerlab.local` | localStorage | high | 5 处 persist 配置（见 §3） |
| `pokerlab.indexeddb` | IndexedDB | high | `hand-history/store.ts:13-24`；`progress/utils/recordDatabase.ts:16-26`；`progress/utils/indexedDB.ts:1-18` |

### L3 组件（10 feature + 装配层 + shared）

| 节点 | 置信度 | sourceRefs（代表） |
|---|---|---|
| 装配层 bootstrap | high | `src/main.tsx:10,13-27,30-37,40-47`；`src/App.tsx` |
| 路由与代码分割 | high | `src/app/routes.tsx:17-32,35-67,77-125`；`src/i18n/preload.ts` |
| i18n 运行时 | high | `src/i18n/moduleRegistry.ts:9,47,86,102,153`；`config.ts`；`locales/{zh,en}` 各 32 文件 |
| 设计系统 | high | `src/styles/globals.css`（236 个 CSS 变量）；`src/designTokenGuard.test.ts`；`poker-ui-demo/DESIGN_LANGUAGE.md` |
| progress 中枢 | high | `src/features/progress/store.ts`（995 行；persist :972-973；MIGRATIONS :122-290） |
| range-trainer | high | `types.ts:11,17,39`；`constants.ts`（17 预设）；`store.ts:52`；`hooks/useQuizEngine.ts` |
| pot-odds | high | `types.ts:3,12,18,26,46`；`data/quizQuestions.ts`（19 题）；`constants.ts`（8 听牌）；`store.ts:24` |
| gto-simulator | high | `types.ts:8,24,53,58,66,74,84,95`；`data/preflop-ranges.json`（4015 行 / 11 spot）；`data/postflop-ranges.json`；`utils/scenarioGenerator.ts:125`；`store.ts:61` |
| puzzle-trainer | high | `types.ts:12,35,47,71,77,125,157,173`；`data/puzzleBank.ts`（3631 行 / 205 题 / 10 主题）；`store.ts:63,71,106`；`persist v3 :126-127` |
| strategy-academy | high | `types.ts:20,38,45,71,104,164,173,204,247,313,330,342,356`；`data/lessons/variants/standard/index.ts:42-58`（9 节点 / 75 课）；`data/learningTracks.ts`（6 轨）；`store.ts:471-516` |
| theory-academy | high | `types.ts:8-11,25,31,40,60,68`；`data/levels/variants/standard/standardLevel1-9.ts`（32 章 160 题）；`store.ts:154-171` |
| hand-history | high | `types.ts:18,28,34,69,78,89`；`parsers/common.ts`（detectFormat/normalizeToAmounts）；`store.ts:13-24,255` |
| onboarding | high | `components/OnboardingFlow.tsx:13-19,30-32,68-72`；`data/placementQuestions.ts`；`PlacementTestStep.tsx:60-79` |
| help-center | high | 目录仅 `components/ data/ index.ts types.ts`（**无 store.ts**）；`data/helpContent.ts:8,138,147,157`（9/6/6/8） |
| shared 层 | high | `src/shared/{types,utils,components,stores,hooks,constants,data}` 实测清单见 `business-architecture.md` §7 |
| 共享内核 `calculateGrade` | high | `src/shared/types/decisionFeedback.ts:15,38-43,49` |

## 2. 边证据

### 跨模块 import（与白名单双证一致）

| 边 | 类型 | 置信度 | sourceRefs |
|---|---|---|---|
| range-trainer → progress | depends-on (import) | high | `useQuizEngine.ts:7`、`RangeQuizPage.tsx:31`、`QuizCard` 使用处；`eslint.config.js:33` |
| pot-odds → progress | 同上 | high | `useOddsCalculation.ts:6`、`PotOddsQuizPage.tsx:21`；`eslint.config.js:30` |
| gto-simulator → progress | 同上 | high | `useGTOComparison.ts:13`、`GTOSessionPage.tsx:21`；`eslint.config.js:26` |
| puzzle-trainer → progress | 同上 | high | `usePuzzleSession.ts:13`（4 处）；`eslint.config.js:32` |
| strategy-academy → progress | 同上 | high | `store.ts`（4 处）；`eslint.config.js:34` |
| theory-academy → progress | 同上 | high | `store.ts`（2 处）；`eslint.config.js:35` |
| onboarding → progress | 同上 | high | `store`（9 处）+ `types`；`eslint.config.js:29` |
| hand-history → ∅ / help-center → ∅ / progress → ∅ | 无出边 | high | `grep` 实测无 `@/features/<other>`；`eslint.config.js:27,28,31` |

**结论**：代码实测的跨模块边集合与 `ALLOWED_CROSS_IMPORTS`（`eslint.config.js:25-36`）**逐条相等**，且该文件注释称"其余 peer 边为存量债务"，但当前快照中**已无 peer 边**。

### 事件总线

| 边 | 置信度 | sourceRefs |
|---|---|---|
| 6 模块 → trainingEvents.emit | high | `RangeQuizPage.tsx:47`、`PotOddsQuizPage.tsx:217`、`GTOSessionPage.tsx:158`、`usePuzzleSession.ts:70`（+`utils/trainingRecord.ts:12`）、`strategy-academy/store.ts`、`theory-academy/store.ts:79-94` |
| trainingEvents → progress 订阅 | high | `progress/store.bootstrap.ts:49-53`；`shared/stores/trainingEvents.ts:13-27`（订阅者异常隔离） |
| hand-history 豁免 emit | high | `hand-history/store.ts:7-10` 注释明确记为豁免 |
| help-center 豁免 emit | high | 全模块无 `trainingEvents` 引用（grep 实测） |

### 依赖倒置注册表

| 边 | 置信度 | sourceRefs |
|---|---|---|
| strategy-academy → registerAcademyDataSource | high | `strategy-academy/store.bootstrap.ts:24-43` |
| strategy/puzzle/theory → registerAchievementSource | high | 各自 `store.bootstrap.ts`（theory :12-25） |
| progress/store.ts → getAchievementSources | high | `progress/store.ts:41`（注释 :39-40）、消费 :1036-1105 |
| progress/utils → getAcademyDataSource | high | `progress/utils/dailyTrainingPlan.ts:10,93`；`components/replay/ProgressReplay.tsx:7,27` |
| main.tsx → 触发 4 个 bootstrap | high | `main.tsx:10,15-17,22-24`；`academyDataSourceRegistry.ts:3-5` 注释说明注册时机 |

### 数据流与持久化

| 边 | 类型 | 置信度 | sourceRefs |
|---|---|---|---|
| progress → `poker-training-progress` | writes | high | `store.ts:972-973`（v15）、`partialize :987`、MIGRATIONS :122-290 |
| academy / theory / puzzle → localStorage | writes | high | `strategy-academy/store.ts:471-472`(v5)、`theory-academy/store.ts:154-155`(v3)、`puzzle-trainer/store.ts:126-127`(v3) |
| shared/debugMode → localStorage | writes | high | `shared/stores/debugMode.ts:46-47`（v1） |
| progress.addRecord → `poker-training-records` | writes | high | `store.ts:455,471-472,484,492,986`；`utils/recordDatabase.ts:16-26`；`store.bootstrap.ts:33,68` |
| hand-history → `hand-history-db` | reads/writes | high | `hand-history/store.ts:13-24`（store `hands`，keyPath `id`；HH-06 游标分批 200） |
| progress.handHistoryBackup → `hand-history-db` | reads/writes | high | `progress/utils/handHistoryBackup.ts:11-24`（**同名库第二个 opener**） |
| progress → `poker-training` | [low] | **low** | `progress/utils/indexedDB.ts:1-18` 定义 `records`/`hands`，仅 `progress/index.ts:5` 导出；未见内部 import |
| hand-history → gtoWorker | calls (async) | high | `utils/gtoDeviation.ts:133`（`new Worker(..., {type:'module'})`） |

### 结构证据（用于说明"不是运行时架构"）

| 事实 | 置信度 | sourceRefs |
|---|---|---|
| 34 路由 / 33 懒加载页面 | high | `src/app/routes.tsx:35-67`（33 个 `lazy` 声明）、`:82-108`（27 path + index）、`:113-120`（6 path） |
| 549 个 `src` 源文件；110 测试（88 unit + 22 component） | high | `find src`；`vitest.config.ts` 双项目 |
| 分包策略 | high | `vite.config.ts:25-51` |
| CI 串行门禁 + 体积检查 | high | `.github/workflows/deploy.yml:39-58` |

## 3. 假设与推断（已标注，不作为事实）

| 陈述 | 处理 |
|---|---|
| "单人本地使用、无账号体系" | **medium**：无任何 auth/session/用户实体依赖（`package.json` 依赖清单）+ i18n 与 progress 均为本地 persist；未在 PRD 中读到显式声明 |
| "门禁是体验约束而非安全边界" | **medium**：`shared/stores/debugMode.ts` 可短路 9 处门禁 + 全量数据在客户端；属于对既有证据的解释 |
| "`poker-training` 库为遗留" | **不采纳为事实**，标 low 并列验证任务（§4.1） |
| "hand-history 未 emit 是历史决策" | 采信其代码注释所述理由（非交互式训练），不推断额外动机 |
| 每日谜题"同一天所有用户同题同序" | **结构证据成立**（`utils/dateSeed.ts` + `dailyPuzzles.ts` 日期种子取 8 题），产品意图见 `docs/PRD.md`；未做运行时观测 |

## 4. 未知项 → 验证任务

| # | 未知 | 建议验证方式 |
|---|---|---|
| 4.1 | `poker-training`（stores `records`/`hands`）是否仍被任何路径使用 | 全局搜 `openDB\|saveToStore\|loadFromStore` 的调用方；确认是否为兼容旧数据的迁移出口，若无则可评估下线对老用户数据的影响 |
| 4.2 | 非持久化模块（range/pot-odds/gto）在中途刷新时是否留下训练记录 | 开 `DevTools → IndexedDB → poker-training-records`，答 3 题不点结束即刷新，比对条数 |
| 4.3 | `TrainingRecord.module` 联合含 `hand-history` 但无 emit | 决定是保留契约（未来复盘统计）还是收窄联合类型；同时核对文档 §跨模块协作 的豁免口径 |
| 4.4 | 五大系统之间的写入时序（同一题同时触发 ELO / Emotion / SRS / Streak）是否有事务性或补偿 | 读 `store.ts` 相关 action 是否有幂等与回滚；必要时做一次性埋点观测 |
| 4.5 | `hand-history-db` 被两个模块独立 open，版本升级时是否冲突 | 检查两处 `DB_VERSION` 与 `onupgradeneeded` 逻辑；若未来加字段需协调 |
| 4.6 | `shouldDownshiftDifficulty()` 的阈值与生效范围 | 以 `store.ts:902` 实现为唯一事实源，不在文档维护数值副本 |

## 5. 复核方法（如何重跑本证据）

```bash
# 跨模块边（应与 eslint.config.js ALLOWED_CROSS_IMPORTS 逐条相等）
for f in src/features/*/; do m=$(basename "$f"); echo "== $m"; \
  grep -rhoE "from '@/features/[^']+'" "$f" --include='*.ts*' | sort -u; done

# 所有 persist store 的 name / version
grep -rn "name: '" --include='*.ts' src/shared/stores src/features/*/store.ts | grep -A0 "name:"
grep -rn "version: [0-9]" --include='*.ts' src/shared/stores src/features/*/store.ts

# 事件总线的 emit 与 subscribe 两侧
grep -rln "trainingEvents" src/features src/shared

# 结构计数
grep -c "^const .* = lazy" src/app/routes.tsx
find src -name '*.test.ts' | wc -l ; find src -name '*.test.tsx' | wc -l
```
