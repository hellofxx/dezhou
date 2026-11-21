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
| `gto-simulator` | `gto-simulator-dev` | `GTOSimulatorHome` | `store.ts（无 persist）` | `feedback`, `gto` | 26 | `progress` | 21 |
| `hand-history` | `hand-history-dev` | `HandHistoryList` | `store.ts（无 persist）` | `common`, `handHistory` | 28 | — | 23 |
| `help-center` | `help-center-dev` | `HelpHome` | — | `help` | 4 | — | 10 |
| `onboarding` | `onboarding-dev` | `OnboardingFlow` | — | `onboarding`, `rangeTrainer` | 9 | `progress` | 12 |
| `pot-odds` | `pot-odds-dev` | `OddsStation` | `store.ts（无 persist）` | `potOdds` | 16 | `progress` | 18 |
| `progress` | `progress-dev` | `JourneyHome` | `store.ts（persist v18）` | `achievements`, `common`, `dailyChallenge`, `dashboard`, `downswing`, `elo`, `leaderboard`, `mood`, `nav`, `progress`, `rankUp`, `review`, `spacedRepetition`, `theory` | 70 | — | 84 |
| `puzzle-trainer` | `puzzle-trainer-dev` | `PuzzleStation` | `store.ts（persist v3）` | `feedback`, `puzzle` | 24 | `progress` | 18 |
| `range-trainer` | `range-trainer-dev` | `DrillHub` | `store.ts（无 persist）` | `common`, `feedback`, `rangeTrainer` | 13 | `progress` | 19 |
| `strategy-academy` | `strategy-academy-dev` | `LessonRoute` | `store.ts（persist v8）` | `academy`, `drills`, `gto`, `quickDrill`, `theory`, `variant` | 120 | `progress` | 122 |
| `theory-academy` | `theory-academy-dev` | `TheoryHome` | `store.ts（persist v5）` | `academy`, `theory`, `variant` | 78 | `progress` | 65 |

## Lazy 路由表

> `lazyPage` / `lazyPageWithFeature` 声明，按源码顺序。组件与 URL 的配对以 router 配置为准，
> 本表只列声明本身，不做推断（URL 清单见下节）。

| # | 组件 | import 路径 | i18n 分组 key |
|---|---|---|---|
| 1 | `JourneyHome` | `@/features/progress/components/path/JourneyHome` | `/` |
| 2 | `LessonRoute` | `@/features/strategy-academy/components/LessonRoute` | `/lesson/:lessonId` |
| 3 | `CourseHub` | `@/features/strategy-academy/components/CourseHub` | `/lesson` |
| 4 | `DrillHub` | `@/features/range-trainer/components/DrillHub` | `/drill` |
| 5 | `RangeStation` | `@/features/range-trainer/components/RangeTrainerHome` | `/drill/range` |
| 6 | `OddsStation` | `@/features/pot-odds/components/PotOddsPage` | `/drill/odds` |
| 7 | `PuzzleStation` | `@/features/puzzle-trainer/components/PuzzleHome` | `/drill/puzzle` |
| 8 | `QuickDrill` | `@/features/strategy-academy/components/QuickDrill` | `/quick` |
| 9 | `ProgressPage` | `@/features/progress/components/replay/ProgressPage` | `/progress` |
| 10 | `RangeStatsPage` | `@/features/progress/components/stats/RangeStatsPage` | `/progress/range` |
| 11 | `GTOStatsPage` | `@/features/progress/components/stats/GTOStatsPage` | `/progress/gto` |
| 12 | `LeaderboardPage` | `@/features/progress/components/achievement/Leaderboard` | `/leaderboard` |
| 13 | `AcademyHome` | `@/features/strategy-academy/components/AcademyHome` | `/academy` |
| 14 | `BasicsIntro` | `@/features/strategy-academy/components/BasicsIntro` | `/academy/basics` |
| 15 | `LearningTracksView` | `@/features/strategy-academy/components/LearningTracksView` | `/academy/tracks` |
| 16 | `ConceptGraphView` | `@/features/strategy-academy/components/ConceptGraphView` | `/academy/concept-graph` |
| 17 | `StrategySearchPage` | `@/features/strategy-academy/components/StrategySearchPage` | `/academy/search` |
| 18 | `PlacementTestPage` | `@/features/strategy-academy/components/PlacementTestPage` | `/academy/placement` |
| 19 | `LevelCheckpointPage` | `@/features/strategy-academy/components/LevelCheckpointPage` | `/academy/checkpoint/:level` |
| 20 | `LevelCertification` | `@/features/strategy-academy/components/LevelCertification` | `/academy/certification/:level` |
| 21 | `StrategyBookmarksPage` | `@/features/strategy-academy/components/StrategyBookmarksPage` | `/academy/bookmarks` |
| 22 | `StrategyBibliographyPage` | `@/features/strategy-academy/components/StrategyBibliographyPage` | `/academy/bibliography` |
| 23 | `GTOSimulatorHome` | `@/features/gto-simulator/components/GTOSimulatorHome` | `/gto-simulator` |
| 24 | `GTOResultPage` | `@/features/gto-simulator/components/GTOResultPage` | `/gto-simulator/result/:sessionId` |
| 25 | `GTOSessionPage` | `@/features/gto-simulator/components/GTOSessionPage` | `/gto-simulator/session/:scenarioId` |
| 26 | `HandHistoryList` | `@/features/hand-history/components/HandHistoryList` | `/hand-history` |
| 27 | `HandImportPage` | `@/features/hand-history/components/HandImportPage` | `/hand-history/import` |
| 28 | `HandReplayPage` | `@/features/hand-history/components/HandReplayPage` | `/hand-history/:handId` |
| 29 | `TheoryHome` | `@/features/theory-academy/components/TheoryHome` | `/theory` |
| 30 | `TheoryChapterView` | `@/features/theory-academy/components/TheoryChapterView` | `/theory/chapter/:chapterId` |
| 31 | `TheoryFlaggedReview` | `@/features/theory-academy/components/TheoryFlaggedReview` | `/theory` |
| 32 | `TheoryPlacementPage` | `@/features/theory-academy/components/TheoryPlacementPage` | `/theory/placement` |
| 33 | `TheoryCheckpointPage` | `@/features/theory-academy/components/TheoryCheckpointPage` | `/theory/checkpoint/:levelId` |
| 34 | `TheoryGlossaryPage` | `@/features/theory-academy/components/TheoryGlossaryPage` | `/theory/glossary` |
| 35 | `TheorySearchPage` | `@/features/theory-academy/components/TheorySearchPage` | `/theory/search` |
| 36 | `TheoryBibliographyPage` | `@/features/theory-academy/components/TheoryBibliographyPage` | `/theory/bibliography` |
| 37 | `PuzzleRush` | `@/features/puzzle-trainer/components/PuzzleRush` | `/puzzle/rush` |
| 38 | `DailyPuzzle` | `@/features/puzzle-trainer/components/DailyPuzzle` | `/puzzle/daily` |
| 39 | `ThemeDrill` | `@/features/puzzle-trainer/components/ThemeDrill` | `/puzzle/theme/:themeId` |
| 40 | `HelpHome` | `@/features/help-center/components/HelpHome` | `/help` |
| 41 | `HelpArticle` | `@/features/help-center/components/HelpArticle` | `/help/article/:articleId` |
| 42 | `OnboardingFlow` | `@/features/onboarding/components/OnboardingFlow` | `/onboarding` |
| 43 | `RangeLearnPage` | `@/features/range-trainer/components/RangeLearnPage` | `/range-trainer/learn` |
| 44 | `RangeQuizPage` | `@/features/range-trainer/components/RangeQuizPage` | `/range-trainer/quiz` |
| 45 | `PotOddsQuizPage` | `@/features/pot-odds/components/PotOddsQuizPage` | `/pot-odds/quiz` |

## 已声明的 URL 路径

> 从 router 配置提取的 `path:` 字符串与 `index` 路由（源码顺序去重，含 AppLayout 与 BlankLayout 两个分支），共 51 条。

- `/`
- `/lesson/:lessonId`
- `/lesson`
- `/drill`
- `/drill/range`
- `/drill/odds`
- `/drill/puzzle`
- `/quick`
- `/progress`
- `/progress/range`
- `/progress/gto`
- `/leaderboard`
- `/settings`
- `/help`
- `/help/article/:articleId`
- `/academy`
- `/academy/basics`
- `/academy/tracks`
- `/academy/concept-graph`
- `/academy/search`
- `/academy/placement`
- `/academy/checkpoint/:level`
- `/academy/certification/:level`
- `/academy/bookmarks`
- `/academy/bibliography`
- `/gto-simulator`
- `/gto-simulator/result/:sessionId`
- `/hand-history`
- `/hand-history/import`
- `/theory`
- `/theory/chapter/:chapterId`
- `/theory/review`
- `/theory/placement`
- `/theory/checkpoint/:levelId`
- `/theory/glossary`
- `/theory/search`
- `/theory/bibliography`
- `/puzzle/rush`
- `/puzzle/daily`
- `/puzzle/theme/:themeId`
- `/academy/lesson/:lessonId`
- `/academy/quick-drill`
- `/range-trainer`
- `/pot-odds`
- `/puzzle`
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
| `CORE_MODULES` | core（启动静态注入） | `nav`, `common`, `dashboard`, `variant`, `tilt`, `streak`, `feedback`, `mentor` |
| `/` | feature（随路由并行加载） | `dashboard`, `nav`, `achievements`, `progress`, `dailyChallenge`, `spacedRepetition`, `downswing`, `mood`, `rankUp`, `review`, `theory` |
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
| `/progress` | feature（随路由并行加载） | `progress`, `dashboard`, `common`, `achievements`, `elo`, `leaderboard`, `dailyChallenge`, `mood` |
| `/drill/range` | feature（随路由并行加载） | `rangeTrainer` |
| `/drill/odds` | feature（随路由并行加载） | `potOdds` |
| `/drill/puzzle` | feature（随路由并行加载） | `puzzle` |
| `/lesson/:lessonId` | feature（随路由并行加载） | `academy`, `drills`, `gto`, `theory` |
| `/lesson` | feature（随路由并行加载） | `academy`, `theory` |
| `/drill` | feature（随路由并行加载） | `rangeTrainer` |
| `/quick` | feature（随路由并行加载） | `quickDrill`, `academy` |
| `/academy/basics` | feature（随路由并行加载） | `academy` |
| `/academy/concept-graph` | feature（随路由并行加载） | `academy` |
| `/academy/tracks` | feature（随路由并行加载） | `academy` |
| `/academy/search` | feature（随路由并行加载） | `academy` |
| `/academy/placement` | feature（随路由并行加载） | `academy` |
| `/academy/checkpoint/:level` | feature（随路由并行加载） | `academy` |
| `/academy/bookmarks` | feature（随路由并行加载） | `academy` |
| `/academy/bibliography` | feature（随路由并行加载） | `academy` |
| `/academy/certification/:level` | feature（随路由并行加载） | `academy`, `theory` |
| `/academy/lesson/:lessonId` | feature（随路由并行加载） | `academy`, `drills`, `gto`, `theory` |
| `/academy` | feature（随路由并行加载） | `academy`, `variant`, `theory` |
| `/theory/chapter/:chapterId` | feature（随路由并行加载） | `theory`, `academy` |
| `/theory` | feature（随路由并行加载） | `theory`, `academy`, `variant` |
| `/theory/placement` | feature（随路由并行加载） | `theory` |
| `/theory/checkpoint/:levelId` | feature（随路由并行加载） | `theory` |
| `/theory/glossary` | feature（随路由并行加载） | `theory` |
| `/theory/search` | feature（随路由并行加载） | `theory` |
| `/theory/bibliography` | feature（随路由并行加载） | `theory` |
| `/puzzle/theme/:themeId` | feature（随路由并行加载） | `puzzle`, `feedback` |
| `/puzzle/rush` | feature（随路由并行加载） | `puzzle`, `feedback` |
| `/puzzle/daily` | feature（随路由并行加载） | `puzzle`, `feedback` |
| `/puzzle` | feature（随路由并行加载） | `puzzle` |
| `/help/article/:articleId` | feature（随路由并行加载） | `help` |
| `/help` | feature（随路由并行加载） | `help` |
| `/onboarding` | feature（随路由并行加载） | `onboarding`, `rangeTrainer` |

## 生成统计

- 模块数：10（自检阈值 = 10）
- lazy 声明数：45（自检阈值 >= 21）
- agent 文件数：12（自检阈值 >= 10）
- 已声明 URL 数：51
