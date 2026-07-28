# 变更日志（CHANGELOG）

> 本文件归档德州扑克训练平台的所有执行历史与版本演进。
> PRD.md 与 TDD.md 仅保留当前规格，历史决策与落地细节统一汇集于此。

---

## 待办（Backlog）

- **trainingEvents.emit 存量缺口（部分完成）**（登记于 2026-07-28）：pot-odds / puzzle-trainer 已在 v2.0 补全 emit；hand-history 经评估为复盘分析工具（非交互式训练），标注为合理豁免，无需 emit。剩余缺口已清零。

---

## v2.0 — 2026-07-28（全面功能排查与质量保证修复）

> 对全平台进行系统性功能排查，修复跨模块集成缺口、状态管理缺陷、类型安全问题、UI/UX 硬编码残留，并补全测试覆盖。

### 跨模块集成修复

- **trainingEvents.emit 合规补全**：pot-odds（`PotOddsQuizPage`）和 puzzle-trainer（`PuzzleRush` / `DailyPuzzle` / `ThemeDrill`）补全 `trainingEvents.emit` 调用；hand-history 经评估为复盘分析工具（非交互式训练），标注为合理豁免
- **shouldDownshiftDifficulty 接入**：puzzle-trainer 三种模式（Rush / Daily / ThemeDrill）接入自适应难度降级 API，连续答错 ≥3 次显示降级提示（`puzzle.common.downshiftHint` i18n key）
- **relatedLessonId 反馈闭环确认**：pot-odds 已合规（`useOddsCalculation.ts` 调用 `buildOddsFeedback` 时携带 `relatedLessonId`）

### 状态管理修复

- **IndexedDB 单例重构**（hand-history）：`openDB()` 重构为 `getDB()` 单例模式，避免重复打开数据库连接；添加 try-catch 错误分类 + `dbError` 字段 + i18n 错误消息（`handHistory.dbError.quotaExceeded` / `.unavailable` / `.generic`）
- **strategy-academy persist v1→v2**：`practiceResults` 添加 cap 200 限制（`.slice(-200)`），migrate 函数对老数据执行裁剪；同时补齐 v0→v1 迁移（`firstAttemptScores` / `lastAttemptScores` 默认值注入）
- **progress store addRecord 去重**：添加 `record.id` 去重检查，防止事件总线重复 emit 导致训练记录重复

### 类型安全

- **消除全部 any 类型**：4 处 any 已替换——`gtoDeviation.ts` Worker 分析结果定义 `WorkerAnalyzeResult` 接口替代 any；3 个 Recharts formatter 回调通过类型推断消除 any

### 测试覆盖

- **新增 6 个纯函数测试文件**：`strategyCompare.test.ts` / `statsAggregator.test.ts` / `streakCalc.test.ts` / `parsers/common.test.ts` / `deck.test.ts` / `handClassifier.test.ts`，共 73 个测试用例
- 总测试从 14 文件 51 用例增至 18 文件 124 用例

### UI/UX 修复

- **模块级 ErrorBoundary**：Dashboard / AcademyHome / GTOSimulatorHome 三个核心路由包裹 ErrorBoundary，文案 i18n 化（`common.errorBoundary.*` keys）
- **HandStatsPanel memo 优化**：`chartData` 和 `feedbacks` 使用 `useMemo`，避免不必要的重渲染
- **manifest.json 色彩修正**：`theme_color` 改为 `#15301f`（--felt），`background_color` 改为 `#0e1a14`（--felt-deep），与 CSS 变量保持一致
- **globals.css 去硬编码**：组件类区域 60+ 处硬编码 HEX 色值替换为 CSS 变量引用，消除主题色泄漏

### i18n 新增 keys

- `common.errorBoundary.*`（title / subtitle / reset）
- `handHistory.dbError.*`（quotaExceeded / unavailable / generic）
- `puzzle.common.downshiftHint`

### 基础设施

- **GTO Worker 健康检查**：`useGTOWorker` 新增 `onerror` 监听 + 10 秒超时降级标记 dead + 一次性重建机制（`rebuildWorker`）；重建失败后永久使用 fallback，避免无限重试
- **pot-odds index.ts 导出补全**：从 3 项扩展为完整公共导出
- **TrainingRecord.module 类型扩展**：新增 `'puzzle-trainer'`（已合入）；`'hand-history'` 待后续补入（当前 hand-history 为复盘工具，不产生 TrainingRecord）

### 已知遗留

- `TrainingRecord.module` 联合类型尚未包含 `'hand-history'`，待 hand-history 模块产生训练记录时补入

### 数据迁移

- strategy-academy store persist version 升级 **v1 → v2**（practiceResults cap 200 裁剪）
- progress store persist version 无变更（addRecord 去重为运行时逻辑，不影响持久化 shape）

---

## v1.9.3 — 2026-07-28（AGENTS.md 硬性规则接入执行面）

> 模块隔离 / i18n 双语 / 禁 any 三条硬性规则此前仅靠自觉，本次接入 lint 与测试执行面。

### Lint 门禁（最小可行集）

- 新增 `eslint.config.js`（flat config），仅启用两条规则：`no-restricted-imports`（features 模块隔离，别名 + 相对路径双形式拦截）与 `@typescript-eslint/no-explicit-any`
- 当前模块间依赖图快照固化为 `ALLOWED_CROSS_IMPORTS` 允许边清单（progress 中枢属设计内，其余 peer 边为存量债务，收紧时只删不加），新增跨模块边一律变红
- 新增 `pnpm lint` script；接入部署工作流（构建前强制）与 pre-commit 钩子
- 依赖：`eslint` + `typescript-eslint`（仅 devDependencies，零 bundle 影响）；typescript-eslint 尚不支持 TS 7.0，通过 `.pnpmfile.cjs` 为 lint 工具链侧载 TS 6.0.3（官方并行方案，不影响 typecheck/build 的 TS 7）

### i18n 双语对称测试

- 新增 `src/i18n/localeParity.test.ts`：比对 zh.json 与 en.json 扁平化键集合，任一侧缺键即失败，随 `pnpm test` 执行

### 附带修复（lint 基线清零）

- `HandRankingDrill.tsx`：`t: (key, opts?: any)` 改为 `TFunction`（真实 any，原 disable 注释错位未生效）
- `gtoWorker.ts` / `StreakTracker.tsx`：移除失效的 eslint-disable 注释（分别为无 any 可压、引用未安装的 react-hooks 插件规则）

### 数据迁移

- 无 persist version 变更

---

## v1.9.2 — 2026-07-28（课程引用修复与对手画像 Drill 落地）

> 修复学习路径与概念图中的悬空课程 ID 引用，并完成 P2-1.8 对手画像 Drill 的组件落地（此前仅有题库无课程/组件，本土路径无法 100% 完成）。

### 悬空引用修复

- **learningTracks.ts**（track-cash-game / track-tournament / track-gto）：`l2-3bet`→`l2-3bet-basics`、`l2-4bet`→`l2-4bet-strategy`、`l3-check-raise`→`l3-checkraise`、`l7-deep-stack`→`l7-deepstack`、`l4-range-reading`→`l4-range-thinking`、`l6-push-fold`→`l6-pushfold`、`l4-opponent-exploit`→`l4-opponent-reading`；不存在的 `l4-mental-game` 映射为 `l5-tilt`
- **conceptNodes.ts**：同系列 ID 同步修正；不存在的 `l5-discipline` 映射为 `mental-tilt-recognition`
- 影响：修复前这些课程永远无法计入路径完成度，「继续学习」与概念卡片会导航到不存在的课程页

### 对手画像 Drill（P2-1.8 落地）

- 新增课程 `opp-drill`（`data/localLessons/oppDrill.ts`，并入 LOCAL_LESSONS，本土路径 16→17 课），修复 localTrack 中的悬空引用
- 新增 `OpponentDrill` 组件（+ `OpponentStatsPanel` / `OpponentDrillResult` 子组件）：消费既有 `OPPONENT_DRILL_QUESTIONS` 8 题，两阶段作答（先判对手类型再选剥削策略），两问全对才计答对
- `DrillComponentName` 联合类型新增 `'OpponentDrill'`，`DrillLessonRouter` 注册懒加载分支；i18n 新增 `drills.opponent.*`（zh/en 同步）

### 数据迁移

- 无 persist version 变更（旧悬空 ID 从未可完成，completedLessons 中不存在历史脏数据，无需迁移）

---

## v1.9.1 — 2026-07-28（质量门禁机械化）

> 补齐验证层：引入最小测试框架 + 首批冒烟测试 + typecheck 机械触发点，结束“零测试、零机械执行”状态。

### 测试基础设施

- **引入 vitest**（经用户确认）：仅 devDependencies，不进生产 bundle（构建产物与引入前逐 chunk 一致）；新增 `pnpm test`（vitest run）与独立 `vitest.config.ts`（Node 环境 + `@` 别名，不加载 react/tailwind 插件）
- **首批冒烟测试（37 项）**：
  - 纯函数：`pokerMath.test.ts`（底池赔率/EV/2-4 法则/短牌）、`elo.test.ts`（ELO 变化/段位/K 因子/升级）、`decisionFeedback.test.ts`（GRADE_THRESHOLDS 与 calculateGrade 边界归入更严重等级）
  - store migrate：progress（v0→v8 全链路）/ puzzle-trainer（v1→v2）/ strategy-academy（v0→v1），通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移、无需 jsdom
  - 新增测试专用共享桩 `shared/utils/localStorageStub.ts`（三个模块的 migrate 测试复用）
  - 坑位记录：zustand v5 persist 默认 storage 引用 `window.localStorage`（非全局 `localStorage`），Node 环境测试必须同时 stub `window`，否则 persist 静默跳过 hydrate/migrate

### 机械触发点

- **pre-commit hook**（经用户确认，`.git/hooks/pre-commit`）：提交前自动运行 `pnpm typecheck`，失败即阻止提交；已验证可拦截 TS2322 类型错误。注：hook 不随 git 克隆分发，新环境需手动复制

### 数据迁移

- 无 persist version 变更（本次仅新增测试覆盖现有 migrate，未改动任何 store）

---

## v1.9 — 2026-07-28（课程体系扩展与游戏化系统升级）

> 基础架构重构（courses.ts 拆分为 levels/ 目录 9 文件 + barrel 导出）、L4 拆分为 L4A/L4B、新增 4 门课程 + 16 个 Drill、成就系统 / 冻结卡碎片 / 进步回放三大游戏化功能上线、GTO Worker 批量分析、构建优化（主 chunk 1204 kB → 291 kB）。

### 基础架构

- **courses.ts 拆分**：拆分为 `data/levels/` 目录（9 个独立文件 + barrel 导出），原 `courses.ts` 保留为 re-export 兼容层
- **L4 拆分**：Level 4 拆分为 L4A（范围与 EV 思维）和 L4B（GTO 与博弈论），共 9 个 Level 节点
- **L7/L8 解锁条件修正**：L7 需完成 L3 + L5（`prerequisiteLevelIds: ['l3', 'l5']`），L8 需完成 L4B（`prerequisiteLevelIds: ['l4b']`）
- **LevelInfo 扩展**：新增 `id` 和 `prerequisiteLevelIds` 字段

### 课程内容

- **新增 4 门课程**：3-Bet 底池翻后策略、单挑策略、软件工具入门、线上 vs 线下差异
- **L2-L8 Drill 扩展**：每级新增 2 个 Drill（共 16 个），新增 `ChoiceDrillRenderer` 通用组件
- **题库补充**：所有课程 quiz/practice 补充至 ≥5 题

### 反馈与复习

- **PracticeDrill "去复习" 链接**：wrong/blunder 级别添加跳转按钮
- **学习路径横向推荐**：`relatedTrackIds` 字段支持跨路径推荐
- **本土化路径前置条件**：需完成 L1-L3（`prerequisiteLevelIds`）+ 内容去重交叉引用

### 游戏化系统

- **成就系统**：22 个成就（学习 / 连续 / 技能 / 里程碑 4 类），`AchievementWall` 展示墙
- **冻结卡碎片系统**：训练 30% / 速训 20% 概率掉落，5 片合成 1 张
- **进步回放**：`ProgressReplay` 对比首次 vs 最近表现

### 技术分析

- **GTO Worker 批量分析**：新增 `batchAnalyze` 批量分析接口
- **GtoDeviationPanel**：集成到手牌回放
- **Puzzle Rush 连对验证**：连对 5 题 +10 秒验证通过

### 构建优化

- **manualChunks 分包**：`vite.config.ts` 添加 `manualChunks` 配置，主 chunk 从 1204 kB 降至 291 kB
- **动态 import 优化**：提取为辅助函数（`getAcademyStore()`），消除 INEFFECTIVE_DYNAMIC_IMPORT 警告

### 数据迁移

- progress store persist version 升级 **v6 → v7**（成就系统）→ **v8**（冻结卡碎片）

---

## v1.8 — 2026-07-27（排组打法逻辑排查与修复）

> 系统性排查范围训练与策略训练中的排组打法逻辑，4 阶段共修复 29 个问题（10 P0 + 13 P1 + 6 P2），建立规范的初学者入门训练体系。
> 排查报告归档于 `.trae/documents/排组打法逻辑排查/`，总览见 [排组打法逻辑排查总览.md](../.trae/documents/排组打法逻辑排查/排组打法逻辑排查总览.md)。

### 阶段一：单个基础排组逻辑校验

- **范围嵌套关系修复**（P0）：HJ Open 范围补齐 18 张缺失手牌（55/44/33/22 + A7s/A5s/A4s/A3s/K9s/Q9s/T8s/65s/54s + ATo/KJo/QJo/JTo/T9o），修复 UTG ⊄ HJ 嵌套违反
- **GTO 频率表与预置范围一致性**（P1）：以 `preflop-ranges.json` 为权威数据源，对齐 HJ Open 范围
- **rangeParser 裸手牌展开**（P1）：`parseRange("KQ")` 现自动展开为 `KQs` + `KQo`

### 阶段二：组合排组联动逻辑校验

- **HJ ⊄ CO 范围嵌套修复**（P0）：`co-open` 补齐 `T9o`
- **`resolveSpotKey` 重构**（P0）：未覆盖场景返回 `null`，避免错误降级为 `open`
- **BB 防御范围对齐 GTO**（P1）：
  - `bb-3bet-vs-btn` 删除 6 张非价值 3bet 手牌（A5s-A2s/K9s/Q8s），仅保留 AA-TT + AKs/AQs/AJs + AKo/AQo
  - `bb-call-vs-btn` 补齐 KQs/KQo/A7o/A5o-A2o，删除重复手牌
- **HU BTN open 扩展**：99 hands (58.6%) → 127 hands (75.1%)，符合 GTO ~75% 标准

### 阶段三：排组与策略打法适配校验

- **EV 计算回归 GTO 标准**（P0）：`calculateEVFromAction` 移除硬编码 `foldEquity = 0.3`，改为标准公式 `eq×(pot+r) - (1-eq)×r`
- **Calling Station 剥削逻辑修正**（P0）：fold-0.05, raise+0.15, call 归一化（原逻辑 fold 不变与策略矛盾）
- **手牌难度分类 169 全覆盖**（P0）：56 手 → 169 手（STRONG 15 + INTERMEDIATE 54 + ADVANCED 100，三类互斥无重复）
- **PREFLOP_EQUITY 169 全覆盖**（P1）：58 手 → 169 手（PokerStove/Equilab 公开胜率表）
- **isOptimal 阈值统一**（P1）：0.3 → 0.5，与 `correct` 阈值一致
- **l2-bb-defense 补 HJ 防御频率**（P1）：补齐 `vs HJ Open 35-40%`
- **calculateGrade 边界值修正**（P1）：`<2` → `≤2`，`<5` → `≤5`，边界归入更严重等级
- **buildDecisionFeedback 统一分级**（P2）：统一使用 `calculateGrade(evLoss)`，避免 isCorrect 掩盖真实 EV 损失

### 阶段四：整体范围训练体系流畅性校验

#### 反馈闭环贯通（4 P0）

- **range-trainer 接入 relatedLessonId**：新增 `inferRelatedLessonId`，由 position+actionType 推导课程 ID
- **GTO 模拟器接入 relatedLessonId**：根据 `scenario.street` 推导（preflop→l4-gto-basics, flop→l3-cbet, turn/river→l3-multistreet）
- **range-trainer 接入自适应难度**：progress store 新增 `shouldDownshiftDifficulty` API，连续答错 ≥3 次显示降级提示
- **pot-odds 接入五级反馈 + 自适应难度**：`PotOddsQuizPage` 接入 `buildOddsFeedback` + 降级提示

#### 一致性与新手路径（7 P1）

- **CourseView 双层门禁**：Level 解锁检查 + prerequisite 解锁检查，防止 URL 绕过（`mental-tilt-recognition` 例外）
- **puzzle-trainer 接入课程联动**：`inferPuzzleLessonId` 映射 10 个主题到课程 ID，PuzzleCard 显示"去复习"链接
- **range-trainer 位置渐进解锁**：`POSITION_UNLOCK_THRESHOLDS`（UTG=0/HJ=800/CO=1000/BTN=1200/SB=1500/BB=1800），RangeSelector 锁定未解锁位置
- **QuickDrill 自动降级**：连续答错 ≥3 次自动降级（不低于 beginner）
- **GTO/puzzle 降级提示**：连续答错时显示 banner
- **dailyPlan 职责区分**：两个 `generateDailyPlan` 添加注释明确职责（学院焦点 vs 跨模块推荐）

#### 数据清理（3 P2）

- **ABILITY_LESSON_MAP 修正**：5 个错误 lesson ID 全部修正（`l2-3bet`→`l2-3bet-basics` 等）
- **课程 prerequisite 字段**：`Lesson` 类型新增 `prerequisites?: string[]`，`l2-4bet-strategy`/`l2-squeeze` 声明依赖 `l2-3bet-basics`
- **TiltWarning 三选项**："我知道了"（仅关闭）+"学习情绪管理"（跳转 mental-tilt-recognition）+"休息一下"（返回 Dashboard）

### 修改文件清单

#### 数据文件
- `src/features/range-trainer/constants.ts` — 范围预设 + 位置解锁阈值
- `src/features/strategy-academy/data/courses.ts` — 课程内容 + prerequisite 字段

#### 工具/Hook 文件
- `src/features/range-trainer/utils/rangeParser.ts` — 裸手牌展开
- `src/features/gto-simulator/utils/strategyCompare.ts` — EV 公式 + PREFLOP_EQUITY + Calling Station
- `src/features/gto-simulator/hooks/useGTOComparison.ts` — resolveSpotKey 重构
- `src/features/gto-simulator/hooks/useScenarioEngine.ts` — 手牌难度分类补齐
- `src/features/range-trainer/hooks/useQuizEngine.ts` — inferRelatedLessonId + 自适应难度
- `src/features/puzzle-trainer/hooks/usePuzzleEngine.ts` — inferPuzzleLessonId
- `src/features/strategy-academy/utils/dailyPlan.ts` — ABILITY_LESSON_MAP 修正

#### 类型文件
- `src/shared/types/decisionFeedback.ts` — calculateGrade 边界 + buildDecisionFeedback
- `src/features/strategy-academy/types.ts` — Lesson.prerequisites 字段
- `src/features/puzzle-trainer/types.ts` — PuzzleAnswerRecord.relatedLessonId

#### 组件文件
- `src/features/range-trainer/components/TrainingSession.tsx` — 降级提示
- `src/features/range-trainer/components/RangeSelector.tsx` — 位置渐进解锁
- `src/features/gto-simulator/components/GTOSessionPage.tsx` — relatedLessonId + 降级提示
- `src/features/pot-odds/components/PotOddsQuizPage.tsx` — 五级反馈 + 降级提示
- `src/features/puzzle-trainer/components/PuzzleCard.tsx` — "去复习"链接
- `src/features/strategy-academy/components/CourseView.tsx` — 双层门禁
- `src/features/strategy-academy/components/QuickDrill.tsx` — 自动降级
- `src/features/progress/components/TiltWarning.tsx` — 三选项

#### Store 文件
- `src/features/progress/store.ts` — shouldDownshiftDifficulty API + ProgressStore 类型扩展

### 验证

- 每阶段修复后均运行 `tsc --noEmit`，全部通过（exit code 0）
- 手牌分类脚本验证：169 手全覆盖，三类互斥无重复
- 范围嵌套关系验证：HJ ⊂ CO ⊂ BTN、BB 防御 ⊂ BTN open、3bet ⊂ open、4bet ⊂ 3bet

---

## v1.7 — 2026-07-25（P2-4 导师角色人格化）

### 新增

- **导师角色人格化**（P2-4）
  - 三种教练风格：`strict-math`（严谨数学派）/ `old-school`（老派牌手）/ `encouraging`（鼓励型教练）
  - 设置页"教练风格"卡片，3 张教练卡片可点击切换，当前选中项高亮（黄铜金边框 + ring）
  - `MENTOR_FEEDBACK_TEMPLATES` 提供每种风格 × 5 个 grade 的模板，支持 `{evLoss}` / `{correctAction}` 占位符替换
  - `renderMentorFeedback(mentorStyle, grade, params)` 简单字符串替换，不引入模板引擎
  - GTOFeedback / QuizCard 优先调用 `renderMentorFeedback`，缺省时降级到 i18n `feedback.message.*`
  - 颜色与图标仍由 `GRADE_DISPLAY_CONFIG` 统一控制

### 数据迁移

- progress store persist version 升级 **4 → 5**
- migrate 函数 v4 → v5 注入 `mentorStyle = DEFAULT_MENTOR`（仅新字段，不触碰 onboarding/streak/elo/quickDrillStreak 等已有字段）

### 文件位置

- `src/shared/types/mentor.ts` — `MentorStyle` / `MentorProfile` / `MentorFeedbackTemplate` 类型，`MENTOR_PROFILES` / `DEFAULT_MENTOR` 常量
- `src/shared/constants/mentorStyles.ts` — `MENTOR_FEEDBACK_TEMPLATES` 与 `renderMentorFeedback` 函数
- `src/features/progress/store.ts` — `mentorStyle` 状态字段与 `setMentorStyle` action（persist v5）
- `src/features/progress/components/SettingsPage.tsx` — 教练风格切换 UI
- `src/features/gto-simulator/components/GTOFeedback.tsx` / `src/features/range-trainer/components/QuizCard.tsx` — 文案渲染入口

### i18n

- `mentor.settings.*`（标题 / 提示 / 语气标签 / 已选中）
- `mentor.profiles.{style}.{name, description, voiceTone}`
- zh / en 双语齐全

---

## v1.6 — 2026-07-25（P1-4 / P2-5）

### 新增

#### 1. 3 分钟快速训练扩展（P1-4）

- **Best Record 持久化**：puzzle-trainer store 新增 `quickDrillBest: QuickDrillBestRecord | null`（bestScore / bestAccuracy / bestTime / achievedAt），与 `rushBest / dailyBest / themeBest` 解耦
- **综合分数公式**：`accuracy * 100 + max(0, round((10 - averageTime) * 3))`（满分约 130，时间奖励上限 30）
- **SRS 复习队列混合**：快速模式下调用 `composeDailyMix(newQuestions, todayReviewItems, questionCount, userAccuracy)` 决定复习题/新题比例；复习题通过 `reviewItemToPracticeQuestion` 转换（仅保留 `metadata.options` 选择题），放在新题之前作为热身
- **连续 7 天奖励**：progress store 新增 `quickDrillStreak` 与 `lastQuickDrillDate`（与 `streak` 子计数器独立），连续第 7 / 14 / 21 … 天触发 `awardStreakFreeze(1)`
- **幂等性**：`recordQuickDrillCompletion()` 在 `lastQuickDrillDate === today` 时直接返回当前状态，不重复 +1
- **结果面板扩展**：复习题数量（Sparkles 蓝色）→ 新纪录（Trophy 金色，仅 isNewRecord）→ 冻结卡奖励（Gift 绿色，仅 freezeRewarded）→ 当前连续天数（Zap 灰色）→ Streak 计入 ✓

#### 2. 情绪管理模块（P2-5）

- **Tilt 前兆识别**：`TiltWarning.tsx` 监听 `emotion.consecutiveWrongCount`，从 <3 跨越到 >=3 时弹出 Dialog "要不要休息一下？"，提供"休息一下"（返回 Dashboard）与"继续训练"两个按钮；在 `AppLayout` 全局渲染一次
- **Session 止损**：`SessionLimitGuard.tsx` + `useSessionLimitReached` hook，达到每日题量上限（0/50/100/200 四档，0=无限）时禁止继续训练；在 `RangeQuizPage` / `PotOddsQuizPage` / `GTOSessionPage` / `QuickDrill` 组件开头检查
- **下风期检测**：`checkDownswing` action 取最近 3 天 `accuracyHistory`，判断严格递减则标记 `isDownswing=true`；`DownswingAlert.tsx` 仅在 isDownswing=true 时渲染，提供"查看应对指南"按钮跳转 `mental-tilt-recognition` 课程
- **情绪记录**：`MoodTracker.tsx` 提供"好 / 一般 / 差"三档情绪标记按钮，同步展示今日正确率与情绪关联文案（4 种情境）
- **数据采集**：答题时自动调用 `recordAnswer(isCorrect)`，更新 `consecutiveWrongCount` / `dailyQuestionsAnswered` / `dailyCorrect` / `dailyTotal` / `accuracyHistory`；accuracyHistory 仅保留最近 7 天

### 数据迁移

- puzzle-trainer store persist version 升级 **1 → 2**（migrate 函数注入 `quickDrillBest: null`）
- progress store persist version 升级 **5 → 6**（migrate 函数 v5→v6 防御性合并注入 emotion 默认值）

### 文件位置

- `src/features/progress/types.ts` — `EmotionState` 接口与 `DEFAULT_EMOTION_STATE` 常量
- `src/features/progress/store.ts` — `emotion` 状态字段与 `setTodayMood` / `recordAnswer` / `setDailyQuestionLimit` / `checkDownswing` / `resetDailyCounters` 共 5 个 actions（persist v6）
- `src/features/progress/components/TiltWarning.tsx` — Tilt 前兆 Dialog
- `src/features/progress/components/SessionLimitGuard.tsx` — Session 止损守卫与 hooks
- `src/features/progress/components/DownswingAlert.tsx` — 下风期提示卡片
- `src/features/progress/components/MoodTracker.tsx` — 今日情绪标记 + 正确率关联展示
- `src/layouts/AppLayout.tsx` — 全局渲染 TiltWarning
- `src/features/progress/components/SettingsPage.tsx` — 每日题量上限设置
- `src/features/progress/components/Dashboard.tsx` — 渲染 DownswingAlert 与 MoodTracker
- 各训练模块 hooks（`useQuizEngine` / `useOddsCalculation` / `useGTOComparison`）— 情绪记录器

### i18n

- `quickDrill.result.reviewIncluded` / `quickDrill.reviewQueueHint` / `quickDrill.newRecord` / `quickDrill.freezeReward` / `quickDrill.streak.{current, rewarded, broken}` 共 7 个新键
- `tilt.*`（4 项）/ `sessionLimit.*`（6 项）/ `downswing.*`（3 项）/ `mood.*`（10 项）共 23 个 key
- zh / en 双语齐全

---

## v1.5 — 2026-07-25（P1-3 SRS 落地）

### 新增

- **SM-2 算法与训练题打通**：range-trainer `useQuizEngine.recordSrsForAnswer` / pot-odds `useOddsSrsRecorder` / gto-simulator `useGtoSrsRecorder` 三个 hook 暴露记录器，答题后调用 `processReview` 更新复习项
- **题目 ID 规范**：`range:{position}:{hand}` / `odds:{questionId}` / `gto:{scenarioId}`，确保跨模块唯一
- **Quality 评分映射**：答对+用时<5秒→5；答对→4；答错→1（自评"记得"→5；"不记得"→1）
- **每日混合比例**：`composeDailyMix(newQuestions, reviewItems, totalCount, userAccuracy)`：默认 30% 复习 + 70% 新题；正确率 < 0.6 → 50% / < 0.4 → 70%；今日复习队列为空 → 全部用新题
- **SpacedRepetitionPanel 升级**：新增"开始复习"主 CTA（brass 色，含 PlayCircle 图标 + 剩余数量徽章）、今日进度条、双状态（"已完成" / "今天没有待复习的内容"）
- **ReviewSession 组件**：Dialog-based，三种渲染模式（多选题 / 自评 / 退化自评）+ 总结页（总题数 / 答对 / 正确率 / 用时）
- **Dashboard 集成**：新增 `reviewSessionOpen` 本地状态，通过 `onStartReview` 回调传递给 SpacedRepetitionPanel

### 文件位置

- `src/features/progress/utils/spacedRepetition.ts` — `ReviewItemMetadata` 接口（front / back / options / source / scenario）
- `src/features/progress/utils/dailyTrainingMix.ts` — `composeDailyMix` / `getReviewRatio`
- `src/features/progress/components/SpacedRepetitionPanel.tsx` — 升级后的复习面板
- `src/features/progress/components/ReviewSession.tsx` — Dialog-based 复习模式

### 数据迁移

- 无需升级 persist version（ReviewItem 仅扩展可选 `metadata` 字段，老数据自动回退到 `minimal` 自评模式）

### i18n

- `spacedRepetition.*` 扩展 9 个新键（title / allDone / allDoneMessage / emptyToday / progressLabel / lastReview / moreItems / totalItems / review）
- `review.*` 新命名空间（16 个键）
- zh / en 双语齐全

---

## v1.4 — 2026-07-25（P1-1 / P1-2）

### 新增

#### 1. 扑克谜题模式（P1-1）

- **三种模式**：
  - Puzzle Rush（限时冲刺）：3/5 分钟（URL 参数 `?duration=3|5`），3 条命，连对 5 题奖励 +10 秒，难度递增
  - Daily Puzzle（每日谜题）：基于日期种子（YYYYMMDD）从全题库抽取 8 题，所有人当天看到相同
  - Theme Drill（主题训练）：单主题 15 题专攻
- **Rush 分数公式**：`correctCount × 100 + floor(timeRemaining/1000) × 10 + lives × 200`
- **日期种子算法**：`utils/dateSeed.ts` 基于 **Mulberry32** 算法，提供 `getDateSeed` / `seededRandom` / `pickBySeed` / `shuffleBySeed` / `getDailyCompletionCount` / `getDailyKey`
- **状态管理**：独立 zustand store（`puzzle-trainer-store`），状态字段 `rushBest` / `dailyBest` / `themeBest` / `dailyCompleted`，不触碰 progress store 的 elo 字段
- **Puzzle 引擎**：`hooks/usePuzzleEngine.ts` 统一管理三种模式的题目流 / 计时 / 命 / 连对奖励
- **五级反馈复用**：根据 EV 损失自动评级（best/correct/inaccuracy/wrong/blunder）
- **路由**：`/puzzle`、`/puzzle/rush`、`/puzzle/daily`、`/puzzle/theme/:themeId`，均用 LazyWrapper 包裹

#### 2. ELO 能力分级体系（P1-2）

- **六段位**：新手 🌱 (0-500) / 入门 🎯 (500-800) / 进阶 ♠️ (800-1200) / 中级 ♥️ (1200-1600) / 高级 ♦️ (1600-2000) / 专家 ♣️ (2000-3000)
- **ELO 算法**：简化 ELO 公式 `E = 1 / (1 + 10^((diff*800 - rating + 400) / 400))`，`delta = K * (S - E)`
- **动态 K 因子**：新手 (<50 局) K=48 / 默认 K=32 / 高分 (>200 局且 overall>1600) K=24
- **维度对应**：preflop ← range-trainer；math ← pot-odds；postflop ← gto-simulator；handReading / mental 暂用映射占位
- **状态集成**：progress store 添加 `elo: EloRating` 与 `eloRankUp: RankUpEvent | null`；`updateElo(dimension, isCorrect, difficulty)` action 自动更新 overall、检测段位升级
- **数据迁移**：启动时通过 setTimeout + 动态 import 从 `strategy-academy/abilityAssessment` 同步初始 ELO（`abilityToElo`：0-100 → 300-1500 映射，仅当 `gamesPlayed===0` 时生效）
- **Dashboard 显示**：欢迎区下方新增段位徽章按钮，边框色随段位变化
- **五维雷达图升级**：`WeaknessAnalysis.tsx` 数据源从训练记录（0-100 正确率）切换为 ELO 五维分数（0-3000），维度标签更新为翻前 / 翻后 / 赔率数学 / 牌局阅读 / 心态一致性
- **段位升级庆祝**：`RankUpCelebration.tsx` 全屏 Dialog，含 emoji 大徽章 + 旧段位→新段位过渡展示 + CSS 彩纸粒子动画

### 数据迁移

- progress store persist version 升级 **2 → 3**（migrate 函数注入 ELO 默认值）

### 文件位置

- `src/features/puzzle-trainer/` — 完整模块目录
- `src/shared/types/elo.ts` — `EloRating` / `Rank` / `RANKS` / `DEFAULT_ELO` / `RankUpEvent`
- `src/shared/utils/elo.ts` — ELO 算法实现
- `src/features/progress/components/RankUpCelebration.tsx` — 段位升级庆祝
- `src/features/progress/components/Dashboard.tsx` — 段位徽章按钮集成
- `src/features/progress/components/WeaknessAnalysis.tsx` — 五维雷达图升级

### i18n

- `puzzle.*` 完整 i18n 树（themes / home / card / rush / daily / theme / result / common 八个子树）
- `elo.unit` / `elo.rankBadge.aria` / `elo.radar.*`
- `rankUp.title` / `rankUp.subtitle` / `rankUp.continue`
- zh / en 双语齐全

---

## v1.3 — 2026-07-25（P0 阶段全量落地）

### 新增

#### P0-1：新手引导流程（Onboarding）

- 5 步流程：Welcome / PlacementTest / FirstDrill / Celebration / GoalSetting
- `OnboardingGate` 组件在 `AppLayout` 中包裹 `<Outlet />`，未完成 onboarding 时自动重定向到 `/onboarding`
- 5 道定位题覆盖 4 个维度：handRanking(2题) / position(1题) / odds(1题) / range(1题)
- 答题正确率映射到 30-70 区间写入 `onboarding.initialAbility`
- 首次微训练最后一题强制从简单题库抽取，答错追加补救题
- 首胜庆祝调用 `recordTrainingDay()` 启动 Day 1 Streak
- persist version 升级至 **1**

#### P0-2：Streak 深度机制

- `StreakState` 包含 currentStreak / longestStreak / lastTrainingDate / streakFreezes / streakFreezeUsedToday / milestones / lastMilestoneCelebrated / streakStartDate / streakBrokenAt
- 新用户初始赠送 2 张冻结卡；老用户首次升级到 v2 migrate 时同样补发 2 张
- gap=2 天且冻结卡 >0 且今日未用时自动扣减 1 张，streak 继续 +1
- 里程碑：达成 3/7/30/100/365 天分别奖励 1/2/3/5/10 张冻结卡
- `StreakCelebration.tsx` 全屏 Dialog，CSS keyframes 动画（彩屑 / 烟花 / 光晕）
- 30 天及以上的庆典显示"分享"按钮，调用 `generateStreakShareCanvas` 生成 1080x1080 PNG
- Earn Back 机制：streak 断裂时记录 `streakBrokenAt`，24 小时内完成训练可恢复
- `StreakTracker` 在 20:00 后未训练时火焰变红闪烁
- persist version 升级 **1 → 2**（migrate 函数转换老 `lastTrainingDate` number 时间戳为 `streak.lastTrainingDate` YYYY-MM-DD string）

#### P0-3：基础 Drill 内容建设

- 4 个 Drill：HandRankingDrill（10题）/ PositionDrill（8题）/ OutsDrill（8题）/ PotOddsDrill（6题）
- 统一 `DrillProps` 接口：`onComplete(result: DrillResult)` / `onExit()`
- 复用现有 CardSVG / HandDisplay 组件，不引入新依赖
- 在 `courses.ts` 注册 4 个 drill 类型 lesson，`Lesson` 类型新增 `drillComponent?` 字段
- 在 `learningTracks.ts` 零基础快速入门 track 中按顺序插入 4 个 drill
- `DrillLessonRouter.tsx` 使用 `React.lazy` 懒加载 4 个 Drill 组件

#### P0-4：反馈机制三级分类（已升级为五级，见 v2-2）

- 初版：`DecisionGrade = 'optimal' | 'acceptable' | 'error'`
- `GRADE_THRESHOLDS`：optimal:0 / acceptable:0.5 / error:1.5（BB/100）
- 后续在 P2-2 阶段升级为五级

#### P0-5：首页"3 分钟快速训练"入口

- Dashboard 顶部欢迎区下方新增渐变 CTA 卡片（brass-dark → brass → brass-bright）
- 三个入口：range / odds / mixed，跳转 `/academy/quick-drill?mode=${mode}&quick=true`
- `QuickDrill.tsx` 接收 `quick=true` 参数进入快速模式（固定 5 题、自适应难度）
- 今日已完成时显示 "✓ 今日已完成" 徽章
- 完成时调用 `recordTrainingDay` 计入 Streak，新增 XP 计算（每题 +10 / 全对 +20 奖励）

### 数据迁移

- progress store persist version 升级 **0 → 1 → 2**

### 文件位置

- `src/features/onboarding/` — 完整模块目录
- `src/features/progress/components/OnboardingGate.tsx`
- `src/features/progress/components/StreakCelebration.tsx`
- `src/features/progress/components/StreakTracker.tsx`
- `src/shared/utils/shareCard.ts` — `generateStreakShareCanvas`
- `src/shared/types/decisionFeedback.ts` — `DecisionGrade` / `DecisionFeedback` / `GRADE_THRESHOLDS` / `calculateGrade` / `GRADE_DISPLAY_CONFIG`
- `src/features/strategy-academy/components/drills/` — 4 个 Drill + 题库 + DrillLessonRouter
- `src/features/progress/components/Dashboard.tsx` — 快速训练入口
- `src/features/strategy-academy/components/QuickDrill.tsx` — 快速模式

---

## v1.2 — 2026-07-24（UI/UX 设计规范升级）

### 变更

- 更新 UI/UX 设计规范：经典德州扑克主题色彩体系
  - 四层色彩架构：牌桌绿呢面 / 象牙白 / 黄铜金 / 胡桃木
  - 字体规范：Fraunces (serif) / Inter Tight (sans-serif) / JetBrains Mono (monospace)
  - 设计原则：沉浸感、信息层级、克制装饰、对比度保障、响应优先

---

## v1.1 — 2026-07-24（策略学院与跨模块优化）

### 新增

- **策略学院模块**（Strategy Academy）：三段式互动教学（概念讲解 → 实例演示 → 实践测验），德扑基础入门、GTO 课程、对手阅读课程、知识图谱、等级解锁
- **对手形象系统**（Opponent Profiles）：TAG / LAG / NIT / Calling Station 四种典型形象，VPIP / PFR / AF 等核心数据可视化，策略建议
- **每日训练计划 / 间隔复习 / 难度自适应**：基于用户进度和弱项智能推荐，SM-2 间隔重复算法，根据正确率动态调整训练难度
- **筹码量与下注尺度系统**：支持 20BB/50BB/100BB 不同有效筹码量，覆盖 1/3 pot / 1/2 pot / 3/4 pot / pot / overbet 等常见尺度
- **跨模块一致性优化**：Toast 提示系统（基于 sonner）、统一空状态组件、统一加载骨架屏、训练结果页统一（ResultSummary）、键盘快捷键

---

## v1.0 — 2026-07-20（初始版本）

### 新增

- 初始版本创建：包含产品概述、目标指标、用户调研、竞品分析、功能需求（5 大模块 + 高级功能）、非功能需求、用户旅程、设计约束、版本规划
- 五大核心训练模块：
  - 手牌范围训练（学习模式 + 测验模式 + 13×13 网格 + 5 个位置预设）
  - 底池赔率计算器（赔率计算 + EV 分析 + Outs 速查 + 胜率图表）
  - GTO 决策模拟器（场景训练 + Spot 练习 + GTO 反馈 + 结果页面）
  - 历史牌局复盘（多平台导入 + 逐步回放 + 街道时间轴 + 标注系统 + 搜索筛选）
  - 进度追踪（Dashboard + 正确率趋势 + 打卡日历 + 能力雷达图 + 成就系统）
- 高级功能：每日挑战、排行榜、PWA 支持、国际化（中/英）

---

## v2-2 反馈机制五级分类升级 — 2026-07-25

### 变更

将 P0-4 的三级分类（optimal / acceptable / error）升级为五级（对标 GTO Wizard）：

- **新五级**：`DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder'`
- **新阈值**：best:0 / correct:0.5 / inaccuracy:2 / wrong:5 / blunder:Infinity（BB/100）
- **新显示配置**：best 深绿 🌟 / correct 浅绿 ✅ / inaccuracy 黄 🟡 / wrong 橙 🟠 / blunder 红 🔴
- **向后兼容**：`migrateGrade(oldGrade)` 将旧三级值映射为 'best' / 'correct' / 'wrong'；旧 i18n key 保留并标记 deprecated
- **构造助手**：`buildDecisionFeedback({ isCorrect, evLoss?, correctAction, explanation?, relatedLessonId? })` 用于不持有 evLoss 的调用方
- **GTO 反馈**：`GTOFeedback.tsx` 新增 `feedback?: DecisionFeedback | null` 可选 props；提供时优先使用五级显示，否则降级为旧二元显示
- **Range 反馈**：`QuizCard.tsx` 新增 `decisionFeedback?: DecisionFeedback | null` 可选 props；五级反馈样式与 GTOFeedback 一致
- **最后一题简单 + 补救机制**：range-trainer / pot-odds / gto-simulator 三个模块均在题目序列生成时将末题替换为最简单题；末题答错且未用过补救时追加一道简单题（`rescueUsed: boolean` 避免无限循环）
- **结果记录**：`TrainingResult.lastQuestionCorrect` 记录最终题是否答对（含补救题）

---

## v2-1 本土低级别盈利路径 — 2026-07-25（P2-1）

### 新增

- **学习轨道**：`track-local-cn` 本土低级别盈利路径，6 模块 16 课，预计 8-10 小时
- **模块 1 Limp 局应对**（3 课）：国内最常见桌型
- **模块 2 Ante/Straddle**（2 课）：BTN Straddle、UTG Straddle、Ante 结构的翻前范围调整
- **模块 3 深筹码调整**（2 课）：500BB+ 深筹的隐含赔率、同花连牌策略、反向隐含赔率陷阱
- **模块 4 玩家剥削**（4 课）：跟注站 / Maniac / Nit / LAG 四类对手的针对性剥削策略
- **模块 5 GTO 与剥削平衡**（2 课）：何时坚守 GTO、何时偏离、基于统计偏差的具体偏离策略
- **模块 6 情绪管理**（3 课）：Tilt 识别、止损纪律、Session 管理与长期盈利心态
- **对手画像训练 Drill**：8 道判断题，根据 VPIP/PFR/AF 等统计判断对手类型并选择应对策略
- **本土化内容**：所有文案使用中文，结合国内实战场景

### 文件位置

- `src/features/strategy-academy/data/localTrack.ts` — 学习轨道定义
- `src/features/strategy-academy/data/localLessons/` — 6 个模块 16 课内容
- `src/features/strategy-academy/data/opponentProfiles.ts` — 扩展对手画像训练 Drill（`OPPONENT_DRILL_QUESTIONS`）

---

## v2-3 主题 Drill 扩展 — 2026-07-25（P2-3）

### 变更

将 Puzzle 模式的主题训练从 5 主题扩展到 10 主题：

| 主题 | 题量 | 分类 |
|---|---|---|
| 翻前 RFI | 30 | 翻前 |
| 大盲防守 | 25 | 翻前 |
| 3Bet 策略 | 20 | 翻前 |
| C-Bet 持续下注 | 20 | 翻后 |
| 同花听牌 | 20 | 翻后 |
| 河牌价值下注 | 20 | 河牌 |
| 诈唬时机 | 15 | 河牌 |
| 短筹码策略 | 20 | 锦标赛 |
| ICM 基础 | 15 | 锦标赛 |
| 多人底池 | 20 | 翻后 |

- 共 205 题，难度分布约 40% 简单 / 40% 中等 / 20% 难
- `PuzzleHome.tsx` 主题训练入口由扁平网格改为按 `PUZZLE_CATEGORIES` 分组展示（翻前 / 翻后 / 河牌 / 锦标赛 4 组）
- 每个主题卡片显示名称、题量、难度标识（基于题目平均难度映射初级 / 中级 / 高级）、最佳正确率

---

## Persist 版本演进时间线

| 时间 | Store | 版本变更 | 触发原因 |
|---|---|---|---|
| 2026-07-20 | progress | (initial) | v1.0 初始版本 |
| 2026-07-25 | progress | 0 → 1 | P0-1 新手引导（注入 onboarding 默认值） |
| 2026-07-25 | progress | 1 → 2 | P0-2 Streak 深度机制（lastTrainingDate 转 YYYY-MM-DD） |
| 2026-07-25 | progress | 2 → 3 | P1-2 ELO 能力分级（注入 elo 默认值） |
| 2026-07-25 | progress | 3 → 4 | P1-4 快速训练扩展（quickDrillStreak / lastQuickDrillDate） |
| 2026-07-25 | progress | 4 → 5 | P2-4 导师角色人格化（mentorStyle） |
| 2026-07-25 | progress | 5 → 6 | P2-5 情绪管理（emotion） |
| 2026-07-25 | puzzle-trainer | 1 → 2 | P1-4 快速训练 Best Record（quickDrillBest，name=`puzzle-trainer-store`） |
| 2026-07-28 | progress | 6 → 7 | v1.9 成就系统（achievements） |
| 2026-07-28 | progress | 7 → 8 | v1.9 冻结卡碎片（freezeFragments） |
| 2026-07-28 | strategy-academy | 1 → 2 | v2.0 practiceResults cap 200 裁剪 + v0→v1 进步回放得分默认值 |

---

## P0 阶段验收清单（已交付）

- [x] 新用户首次访问自动进入 Onboarding 流程
- [x] 定位测试 5 道题完成后给出初始能力评估
- [x] 首次微训练 3-5 题，最后一题确保答对
- [x] 首胜庆祝动画，Day 1 Streak 启动
- [x] 每日目标设定（5/10/20 分钟）
- [x] Streak 冻结卡机制（初始 2 张）
- [x] 3/7 天里程碑全屏庆典
- [x] 晚间 Streak 即将熄灭提醒
- [x] 4 个零基础 Drill 可正常使用
- [x] 零基础学习路径已更新
- [x] 反馈从二元升级为三级分类（后续升级为五级）
- [x] 训练最后一题确保简单题
- [x] 首页"3 分钟快速训练"入口
- [x] 完成训练自动计入 Streak

## P1 阶段验收清单（已交付）

- [x] Puzzle Rush 3/5 分钟限时模式正常工作
- [x] 连对奖励时间、答错扣命机制正常
- [x] 每日谜题基于日期种子，当天题目固定
- [x] 主题训练按知识点分类（已扩展至 10 主题）
- [x] Best Record 记录和展示
- [x] ELO 评分系统正常更新
- [x] 六段位徽章正确显示
- [x] 段位升级庆祝动画
- [x] 五维雷达图使用 ELO 分数
- [x] SRS 复习队列自动调度
- [x] 复习题目自动从队列抽取
- [x] "今日待复习"提示正常显示
- [x] 导航栏有谜题模式入口

## P2 阶段验收清单（已交付）

- [x] "本土低级别盈利路径"完整上线（6 模块 16 课）
- [x] Limp 局、Straddle、深筹策略课程内容完成
- [x] 4 类对手画像训练 Drill 可用
- [x] 反馈升级为五级分类 + 详细解释
- [x] 主题 Drill 扩展到 10 主题
- [x] 导师角色可选（3 种风格）
- [x] Tilt 识别提示
- [x] 情绪记录功能
- [x] 所有课程配有练习题
- [x] 中文内容全部经过本土化校验
