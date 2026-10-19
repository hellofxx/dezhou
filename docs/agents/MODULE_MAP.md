<!-- 由 scripts/generate-agent-map.mjs 生成；pnpm agents:map 重新生成；不要手改 -->

# 模块地图（MODULE_MAP）

> 由脚本从代码事实生成，内容随代码自动漂移校正：改完路由 / 模块 / i18n 注册表后运行 `pnpm agents:map`。
> 手改本文件会被 `pnpm agents:map:check`（CI `Agent Map Check` 与 pre-commit）判为不一致。

## 口径

- **负责代理**：`.claude/agents/<module>-dev.md` 是否存在（缺失记为 —）
- **入口组件**：`src/app/routes.tsx` 中首个 import 该模块的 lazy 声明组件
- **store**：模块 `store.ts` 是否存在及其 persist `version`（正则 `version:\s*(\d+)` 首个匹配）
- **i18n 模块**：由该模块各 lazy 声明所用的 `FEATURE_GROUPS` 分组 key 反查并集（去重排序）
- **测试数 / 组件数**：模块内 `*.test.ts(x)` 递归计数 / `components/` 下 `*.tsx` 递归计数
- **允许跨模块引用**：`eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS`（唯一事实源）

## 模块表

| 模块 | 负责代理 | 入口组件 | store | i18n 模块 | 测试数 | 允许跨模块引用 | 组件数 |
|---|---|---|---|---|---|---|---|
| `gto-simulator` | `gto-simulator-dev` | `GTOSimulatorHome` | `store.ts（无 persist）` | `feedback`, `gto` | 11 | `progress` | 10 |
| `hand-history` | `hand-history-dev` | `HandHistoryList` | `store.ts（无 persist）` | `common`, `handHistory` | 7 | — | 12 |
| `help-center` | `help-center-dev` | `HelpHome` | — | `help` | 3 | — | 9 |
| `onboarding` | `onboarding-dev` | `OnboardingFlow` | — | `onboarding` | 5 | `progress` | 9 |
| `pot-odds` | `pot-odds-dev` | `PotOddsPage` | `store.ts（无 persist）` | `potOdds` | 3 | `progress` | 8 |
| `progress` | `progress-dev` | `Dashboard` | `store.ts（persist v18）` | `achievements`, `common`, `dailyChallenge`, `dashboard`, `downswing`, `elo`, `leaderboard`, `mentor`, `mood`, `nav`, `progress`, `rankUp`, `review`, `sessionLimit`, `settings`, `spacedRepetition`, `streak`, `variant` | 28 | — | 44 |
| `puzzle-trainer` | `puzzle-trainer-dev` | `PuzzleHome` | `store.ts（persist v3）` | `feedback`, `puzzle` | 11 | `progress` | 13 |
| `range-trainer` | `range-trainer-dev` | `RangeTrainerHome` | `store.ts（无 persist）` | `common`, `feedback`, `rangeTrainer` | 8 | `progress` | 13 |
| `strategy-academy` | `strategy-academy-dev` | `AcademyHome` | `store.ts（persist v5）` | `academy`, `drills`, `gto`, `quickDrill`, `variant` | 32 | `progress` | 46 |
| `theory-academy` | `theory-academy-dev` | `TheoryHome` | `store.ts（persist v3）` | `academy`, `theory`, `variant` | 20 | `progress` | 18 |

## Lazy 路由表

> `lazyPage` / `lazyPageWithFeature` 声明，按源码顺序。组件与 URL 的配对以 router 配置为准，
> 本表只列声明本身，不做推断（URL 清单见下节）。

| # | 组件 | import 路径 | i18n 分组 key |
|---|---|---|---|
| 1 | `Dashboard` | `@/features/progress/components/dashboard/Dashboard` | `/` |
| 2 | `RangeTrainerHome` | `@/features/range-trainer/components/RangeTrainerHome` | `/range-trainer` |
| 3 | `RangeLearnPage` | `@/features/range-trainer/components/RangeLearnPage` | `/range-trainer/learn` |
| 4 | `RangeQuizPage` | `@/features/range-trainer/components/RangeQuizPage` | `/range-trainer/quiz` |
| 5 | `PotOddsPage` | `@/features/pot-odds/components/PotOddsPage` | `/pot-odds` |
| 6 | `PotOddsQuizPage` | `@/features/pot-odds/components/PotOddsQuizPage` | `/pot-odds/quiz` |
| 7 | `GTOSimulatorHome` | `@/features/gto-simulator/components/GTOSimulatorHome` | `/gto-simulator` |
| 8 | `GTOResultPage` | `@/features/gto-simulator/components/GTOResultPage` | `/gto-simulator/result/:sessionId` |
| 9 | `GTOSessionPage` | `@/features/gto-simulator/components/GTOSessionPage` | `/gto-simulator/session/:scenarioId` |
| 10 | `HandHistoryList` | `@/features/hand-history/components/HandHistoryList` | `/hand-history` |
| 11 | `HandImportPage` | `@/features/hand-history/components/HandImportPage` | `/hand-history/import` |
| 12 | `HandReplayPage` | `@/features/hand-history/components/HandReplayPage` | `/hand-history/:handId` |
| 13 | `ProgressPage` | `@/features/progress/components/replay/ProgressPage` | `/progress` |
| 14 | `SettingsPage` | `@/features/progress/components/settings/SettingsPage` | `/settings` |
| 15 | `RangeStatsPage` | `@/features/progress/components/stats/RangeStatsPage` | `/progress/range` |
| 16 | `GTOStatsPage` | `@/features/progress/components/stats/GTOStatsPage` | `/progress/gto` |
| 17 | `LeaderboardPage` | `@/features/progress/components/achievement/Leaderboard` | `/leaderboard` |
| 18 | `AcademyHome` | `@/features/strategy-academy/components/AcademyHome` | `/academy` |
| 19 | `CourseView` | `@/features/strategy-academy/components/CourseView` | `/academy/lesson/:lessonId` |
| 20 | `BasicsIntro` | `@/features/strategy-academy/components/BasicsIntro` | `/academy/basics` |
| 21 | `ConceptGraphView` | `@/features/strategy-academy/components/ConceptGraphView` | `/academy/concept-graph` |
| 22 | `LearningTracksView` | `@/features/strategy-academy/components/LearningTracksView` | `/academy/tracks` |
| 23 | `QuickDrill` | `@/features/strategy-academy/components/QuickDrill` | `/academy/quick-drill` |
| 24 | `LevelCertification` | `@/features/strategy-academy/components/LevelCertification` | `/academy/certification/:level` |
| 25 | `OnboardingFlow` | `@/features/onboarding/components/OnboardingFlow` | `/onboarding` |
| 26 | `PuzzleHome` | `@/features/puzzle-trainer/components/PuzzleHome` | `/puzzle` |
| 27 | `PuzzleRush` | `@/features/puzzle-trainer/components/PuzzleRush` | `/puzzle/rush` |
| 28 | `DailyPuzzle` | `@/features/puzzle-trainer/components/DailyPuzzle` | `/puzzle/daily` |
| 29 | `ThemeDrill` | `@/features/puzzle-trainer/components/ThemeDrill` | `/puzzle/theme/:themeId` |
| 30 | `TheoryHome` | `@/features/theory-academy/components/TheoryHome` | `/theory` |
| 31 | `TheoryChapterView` | `@/features/theory-academy/components/TheoryChapterView` | `/theory/chapter/:chapterId` |
| 32 | `TheoryFlaggedReview` | `@/features/theory-academy/components/TheoryFlaggedReview` | `/theory` |
| 33 | `HelpHome` | `@/features/help-center/components/HelpHome` | `/help` |
| 34 | `HelpArticle` | `@/features/help-center/components/HelpArticle` | `/help/article/:articleId` |

## 已声明的 URL 路径

> 从 router 配置提取的 `path:` 字符串与 `index` 路由（源码顺序去重，含 AppLayout 与 BlankLayout 两个分支），共 34 条。

- `/`
- `/range-trainer`
- `/pot-odds`
- `/gto-simulator`
- `/gto-simulator/result/:sessionId`
- `/hand-history`
- `/hand-history/import`
- `/progress`
- `/progress/range`
- `/progress/gto`
- `/leaderboard`
- `/settings`
- `/academy`
- `/academy/basics`
- `/academy/concept-graph`
- `/academy/tracks`
- `/academy/quick-drill`
- `/academy/certification/:level`
- `/academy/lesson/:lessonId`
- `/theory`
- `/theory/chapter/:chapterId`
- `/theory/review`
- `/puzzle`
- `/puzzle/rush`
- `/puzzle/daily`
- `/puzzle/theme/:themeId`
- `/help`
- `/help/article/:articleId`
- `/onboarding`
- `/range-trainer/learn`
- `/range-trainer/quiz`
- `/pot-odds/quiz`
- `/gto-simulator/session/:scenarioId`
- `/hand-history/:handId`

## i18n 分组表

> `CORE_MODULES`（启动静态注入）与 `FEATURE_GROUPS`（路由→模块分组）的 key→模块映射，
> 事实源为 `src/i18n/moduleRegistry.ts`。

| 分组 key | 类型 | i18n 模块 |
|---|---|---|
| `CORE_MODULES` | core（启动静态注入） | `nav`, `common`, `dashboard`, `academy`, `variant`, `tilt`, `streak`, `feedback` |
| `/` | feature（随路由并行加载） | `dashboard`, `nav`, `achievements`, `progress`, `dailyChallenge`, `spacedRepetition`, `downswing`, `mood`, `rankUp`, `review` |
| `/settings` | feature（随路由并行加载） | `settings`, `mentor`, `sessionLimit`, `variant`, `streak` |
| `/leaderboard` | feature（随路由并行加载） | `leaderboard` |
| `/range-trainer/learn` | feature（随路由并行加载） | `rangeTrainer`, `common` |
| `/range-trainer/quiz` | feature（随路由并行加载） | `rangeTrainer`, `feedback` |
| `/range-trainer` | feature（随路由并行加载） | `rangeTrainer` |
| `/pot-odds/quiz` | feature（随路由并行加载） | `potOdds` |
| `/pot-odds` | feature（随路由并行加载） | `potOdds` |
| `/gto-simulator/session/:scenarioId` | feature（随路由并行加载） | `gto`, `feedback` |
| `/gto-simulator/result/:sessionId` | feature（随路由并行加载） | `gto`, `feedback` |
| `/gto-simulator` | feature（随路由并行加载） | `gto`, `feedback` |
| `/hand-history/:handId` | feature（随路由并行加载） | `handHistory` |
| `/hand-history/import` | feature（随路由并行加载） | `handHistory` |
| `/hand-history` | feature（随路由并行加载） | `handHistory`, `common` |
| `/progress/range` | feature（随路由并行加载） | `progress`, `common` |
| `/progress/gto` | feature（随路由并行加载） | `progress`, `common` |
| `/progress` | feature（随路由并行加载） | `progress`, `dashboard`, `common`, `achievements`, `elo` |
| `/academy/quick-drill` | feature（随路由并行加载） | `quickDrill`, `academy` |
| `/academy/basics` | feature（随路由并行加载） | `academy` |
| `/academy/concept-graph` | feature（随路由并行加载） | `academy` |
| `/academy/tracks` | feature（随路由并行加载） | `academy` |
| `/academy/certification/:level` | feature（随路由并行加载） | `academy` |
| `/academy/lesson/:lessonId` | feature（随路由并行加载） | `academy`, `drills`, `gto` |
| `/academy` | feature（随路由并行加载） | `academy`, `variant` |
| `/theory/chapter/:chapterId` | feature（随路由并行加载） | `theory`, `academy` |
| `/theory` | feature（随路由并行加载） | `theory`, `variant` |
| `/puzzle/theme/:themeId` | feature（随路由并行加载） | `puzzle`, `feedback` |
| `/puzzle/rush` | feature（随路由并行加载） | `puzzle`, `feedback` |
| `/puzzle/daily` | feature（随路由并行加载） | `puzzle`, `feedback` |
| `/puzzle` | feature（随路由并行加载） | `puzzle` |
| `/help/article/:articleId` | feature（随路由并行加载） | `help` |
| `/help` | feature（随路由并行加载） | `help` |
| `/onboarding` | feature（随路由并行加载） | `onboarding` |

## 生成统计

- 模块数：10（自检阈值 = 10）
- lazy 声明数：34（自检阈值 >= 21）
- agent 文件数：12（自检阈值 >= 10）
- 已声明 URL 数：34
