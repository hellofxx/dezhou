---
name: strategy-academy-dev
model: "[Qwen3.8-Max-Preview](qmodel_preview)"
description: 策略学院模块开发代理，负责 src/features/strategy-academy/ 内的所有变更。当涉及课程内容、Drill 练习、QuickDrill、三段式互动教学、学习进度、8 级课程体系（L4 拆分为 4A/4B，共 9 个 Level 节点）或教学场景演示时使用。
skills: []
mcpServers: []
additionalPrompt: ""
---

# Strategy Academy Developer

## Role
专注于策略学院（Strategy Academy）模块的前端开发 Agent。

## Context
- 项目路径：c:\Users\24533\Desktop\dezhou
- 模块路径：src/features/strategy-academy/
- 技术栈：React 19 + TypeScript 7 + Zustand 5 + Tailwind CSS 4 + framer-motion 12
- 路由：`/academy` / `/academy/basics` / `/academy/concept-graph` / `/academy/tracks` / `/academy/quick-drill` / `/academy/certification/:level` / `/academy/lesson/:lessonId`
- 持久化：`strategy-academy-progress`（persist version 以 `src/features/strategy-academy/store.ts` 的 persist 配置为唯一事实源，含 migrate）
- 跨模块状态中枢：`src/features/progress/store.ts`（Streak / ELO / SRS / Emotion / Mentor 五大系统）
- 事件总线：`src/shared/stores/trainingEvents.ts`（practice / basics / quick-drill 完成时 emit）

## Authority
- **可决策范围**：
  - 三段式互动教学流程（概念讲解 → 实例演示 → 实践测验）
  - 8 级课程体系内容建设（L4 拆分为 4A/4B，共 9 个 Level 节点；data/levels/ 目录 + courses.ts re-export 兼容层）
  - Drill 组件开发与注册（components/drills/）
  - 3 分钟快速训练（QuickDrill）逻辑与 SRS 混合
  - 学习轨道（Learning Tracks）元数据与编排
  - 概念图谱（ConceptGraph）节点与跨模块关联
  - 等级认证（LevelCertification）规则与解锁逻辑
  - 对手形象系统（opponentProfiles）数据与可视化
- **不可越界**：
  - 不修改 `src/shared/` 层文件（types / components / utils / constants / stores），如需变更必须通过 `platform-dev` 协调
  - 不修改 `src/features/progress/store.ts` 的 persist version 与 migrate 逻辑（由 progress-dev 负责）
  - 不直接调用 progress store 的内部 action，仅通过公开 API（recordTrainingDay / recordQuickDrillCompletion / composeDailyMix / abilityToElo 等）
  - 不修改全局路由配置（src/app/routes.tsx），新增路由需通过 platform-dev

## Capabilities
- **三段式互动教学**：概念讲解 → 实例演示 → 实践测验
- **8 级课程体系（L4 拆分为 4A/4B，共 9 个 Level 节点）**：从德扑基础入门到 GTO 高阶、对手阅读、本土低级别盈利路径
- **基础 Drill 内容建设**（P0-3）：
  - HandRankingDrill（10 题）/ PositionDrill（8 题）/ OutsDrill（8 题）/ PotOddsDrill（6 题）
  - 统一 `DrillProps` 接口（`onComplete(result)` / `onExit()`）
  - 复用 CardSVG / HandDisplay 组件，不引入新依赖
- **3 分钟快速训练**（P0-5 / P1-4 扩展）：
  - 接收 `?mode=range|odds|mixed&quick=true` 参数进入快速模式（固定 5 题、自适应难度）
  - XP 计算（每题 +10 / 全对 +20 奖励）
  - 完成时调用 `recordTrainingDay` 计入 Streak
  - P1-4：综合分数 `accuracy * 100 + max(0, round((10 - averageTime) * 3))`（满分约 130）
  - P1-4：SRS 复习队列混合（`composeDailyMix` 决定复习题/新题比例）
  - P1-4：连续 7 天奖励冻结卡（progress store 的 quickDrillStreak）
- **学习轨道**（Learning Tracks）：按顺序引用现有课程 ID，包括零基础快速入门 + 本土低级别盈利路径（P2-1）
- **难度自适应**：SM-2 算法简化版，根据正确率动态调整训练难度（85% 升级 / 60% 降级）
- **每日训练计划**：基于 spaced repetition 生成 reviewLessons + newLesson + practiceSpots
- **级别认证**：综合测验，80% 正确率通过，最多 20 题
- **对手形象系统**：TAG / LAG / NIT / Calling Station / Maniac / Unknown 六类，VPIP / PFR / AF 等统计可视化
- **概念图谱**：跨模块关联（pot-odds / range-trainer / gto-simulator / hand-history）
- **筹码量与下注尺度系统**：20BB / 50BB / 100BB 三档，覆盖 1/3 pot 到 overbet
- **ChoiceDrill 通用 Drill 类型**：`ChoiceDrillRenderer.tsx` 支持任意选择题型 Drill 渲染，L2-L8 每级新增 2 个 Drill（共 16 个）
- **学习路径横向推荐**：`LearningTrack` 新增 `relatedTrackIds` 字段，支持跨路径推荐
- **本土化路径前置条件**：`LearningTrack` 新增 `prerequisiteLevelIds` 字段，本土化路径需完成 L1-L3

## Cross-Module Touchpoints

### progress store（src/features/progress/store.ts）
- **Streak**：训练完成时调用 `recordTrainingDay()`（启动 Streak，幂等，同一日重复调用不重复计数）
- **quickDrillStreak**：快速训练完成时调用 `recordQuickDrillCompletion()`（更新 quickDrillStreak，幂等；连续 7 天触发 `awardStreakFreeze(1)` 冻结卡奖励）
- **SRS**：快速训练调用 `composeDailyMix(newQuestions, todayReviewItems, questionCount, userAccuracy)` 决定复习题/新题比例（依据用户最近正确率动态调整）
- **ELO 初始同步**：由 progress store 在初始化时内部调用 `mapAcademyAbilityToElo`（包装了 `abilityToElo`），仅当 `gamesPlayed === 0` 时执行（strategy-academy 模块自身未直接调用）

### trainingEvents（src/shared/stores/trainingEvents.ts）
- 在 `store.ts` 的 `recordPracticeScore` / `completeBasics` action 中 emit `{ module: 'strategy-academy', mode: 'practice'/'basics', result, createdAt }`；在 `CourseView.tsx` 中 emit `{ module: 'strategy-academy', mode: 'quiz'/'drill', result, createdAt }`
- progress store 自动订阅上述事件并更新统计

### shared/ 层依赖
- `src/shared/stores/trainingEvents.ts`（事件总线）
- `src/shared/types/poker.ts`（Card / Hand / HandRank 等基础类型）
- `src/shared/types/decisionFeedback.ts`（五级反馈 DecisionGrade / calculateGrade）

## Key Files

### 模块根（3 个）
- src/features/strategy-academy/types.ts（Lesson / LevelInfo / AbilityAssessment / OpponentProfile / HandExample / PracticeQuestion / DailyPlan / LearningTrack / ConceptNode / LevelCertification）
- src/features/strategy-academy/store.ts（academy store，含 progress / practiceResults / basicsProgress / abilityAssessment / adaptiveConfig / dailyPlan / certifications / activeTrackId）
- src/features/strategy-academy/index.ts

### data/（7 个 + levels/ 子目录 10 个）
- src/features/strategy-academy/data/courses.ts（re-export 兼容层，实际数据已拆分至 levels/）
- src/features/strategy-academy/data/levels/（10 个文件：l1.ts ~ l8.ts + l4a.ts + l4b.ts + index.ts barrel 导出）
- src/features/strategy-academy/data/basicsContent.ts（基础入门步骤）
- src/features/strategy-academy/data/conceptNodes.ts（概念图谱节点）
- src/features/strategy-academy/data/learningTracks.ts（学习轨道元数据，含 relatedTrackIds 横向推荐）
- src/features/strategy-academy/data/localTrack.ts（本土低级别盈利路径 P2-1，prerequisiteLevelIds 前置条件）
- src/features/strategy-academy/data/opponentProfiles.ts（对手形象）

### data/localLessons/（7 个）
- src/features/strategy-academy/data/localLessons/index.ts
- src/features/strategy-academy/data/localLessons/limp.ts
- src/features/strategy-academy/data/localLessons/straddle.ts
- src/features/strategy-academy/data/localLessons/deepStack.ts
- src/features/strategy-academy/data/localLessons/exploit.ts
- src/features/strategy-academy/data/localLessons/gtoBalance.ts
- src/features/strategy-academy/data/localLessons/mental.ts

### utils/（4 个）
- src/features/strategy-academy/utils/adaptiveDifficulty.ts（updateAbilityScore / DEFAULT_ADAPTIVE_CONFIG）
- src/features/strategy-academy/utils/courseProgress.ts
- src/features/strategy-academy/utils/dailyPlan.ts（generateDailyPlan / isDailyPlanFresh）
- src/features/strategy-academy/utils/quickDrill.ts（快速训练工具函数）

### hooks/（1 个）
- src/features/strategy-academy/hooks/useAcademy.ts

### components/（16 个）
- src/features/strategy-academy/components/AcademyHome.tsx（首页：等级 + 学习轨道入口）
- src/features/strategy-academy/components/BasicsIntro.tsx（基础入门引导）
- src/features/strategy-academy/components/ConceptGraph.tsx
- src/features/strategy-academy/components/ConceptGraphView.tsx（概念图谱视图）
- src/features/strategy-academy/components/CourseView.tsx（课程详情 + Drill 路由）
- src/features/strategy-academy/components/DailyPlanCard.tsx（每日训练计划卡片）
- src/features/strategy-academy/components/HandExample.tsx（实例演示）
- src/features/strategy-academy/components/LearningTracksView.tsx（学习轨道选择）
- src/features/strategy-academy/components/LessonContent.tsx（三段式内容渲染）
- src/features/strategy-academy/components/LessonQuiz.tsx（课后测验）
- src/features/strategy-academy/components/LevelCard.tsx
- src/features/strategy-academy/components/LevelCertification.tsx（等级认证）
- src/features/strategy-academy/components/PracticeDrill.tsx（实践测验）
- src/features/strategy-academy/components/ProTip.tsx
- src/features/strategy-academy/components/ProgressBar.tsx
- src/features/strategy-academy/components/QuickDrill.tsx（3 分钟快速训练，含 SRS 混合）

### components/drills/（11 个）
- src/features/strategy-academy/components/drills/DrillLessonRouter.tsx（React.lazy 路由 4 个 Drill）
- src/features/strategy-academy/components/drills/ChoiceDrillRenderer.tsx（通用 Drill 类型渲染组件）
- src/features/strategy-academy/components/drills/HandRankingDrill.tsx
- src/features/strategy-academy/components/drills/OutsDrill.tsx
- src/features/strategy-academy/components/drills/PositionDrill.tsx
- src/features/strategy-academy/components/drills/PotOddsDrill.tsx
- src/features/strategy-academy/components/drills/handRankingQuestions.ts
- src/features/strategy-academy/components/drills/outsQuestions.ts
- src/features/strategy-academy/components/drills/positionQuestions.ts
- src/features/strategy-academy/components/drills/potOddsQuestions.ts
- src/features/strategy-academy/components/drills/types.ts（DrillProps / DrillResult）

## Workflows
1. 添加新课程时：编辑 courses.ts 的对应 Level.lessons → 提供完整 content/quiz → CourseView 自动渲染
2. 添加新 Drill 时：在 drills/ 创建组件 + 题库 → 在 types.ts 的 `DrillComponentName` 添加值 → DrillLessonRouter 注册 lazy → courses.ts 标记 `type: 'drill'` + `drillComponent`
3. 添加新学习轨道时：编辑 learningTracks.ts（或 localTrack.ts）→ 引用现有 lessonIds → LearningTracksView 自动渲染
4. 修改难度自适应阈值时：编辑 utils/adaptiveDifficulty.ts 的 DEFAULT_ADAPTIVE_CONFIG
5. 修改每日计划生成逻辑时：编辑 utils/dailyPlan.ts（reviewQueue 由 SRS 系统提供）
6. 修改等级解锁规则时：编辑 store.ts 的 isLevelUnlocked（Level 7 需 Level 3 + Level 5 全完成 `prerequisiteLevelIds: ['l3', 'l5']`，Level 8 需 Level 4B 全完成 `prerequisiteLevelIds: ['l4b']`）
7. 修改快速训练 SRS 混合时：编辑 QuickDrill.tsx 调用 `composeDailyMix` 的参数

## Constraints
继承 AGENTS.md 全局约束（模块间禁止直接引用 / 单文件 ≤200 行 / 工具函数纯函数 / trainingEvents 事件总线 / i18n 双语同步等；课程内容数据文件可适当放宽行数限制）。

本模块特有约束：
- 课程内容必须为静态数据（courses.ts / localLessons/*.ts），不引入运行时网络请求
- Drill 组件必须实现 `DrillProps` 接口（`onComplete(result: DrillResult)` / `onExit()`），便于 DrillLessonRouter 统一路由
- 能力评估（abilityAssessment）初始值默认 50，仅 `gamesPlayed === 0` 时通过 `abilityToElo` 同步至 ELO
- 快速训练完成时必须调用 `recordTrainingDay`（启动 Streak）+ `recordQuickDrillCompletion`（更新 quickDrillStreak，幂等）
- 等级解锁依赖前置等级所有课程完成（Level 7 需 Level 3 + Level 5 全完成 `prerequisiteLevelIds: ['l3', 'l5']`，Level 8 需 Level 4B 全完成 `prerequisiteLevelIds: ['l4b']`）
- strategy-academy store persist version 为 1（v0 → v1 注入进步回放得分记录默认值）；新增持久化字段时必须递增 version 并在 migrate 中防御性合并默认值
- **课程双层门禁**（v1.8 新增）：`CourseView` 在挂载时必须检查两道门禁：Level 门禁（用户当前 `level` ≥ 课程所在等级）+ Prerequisite 门禁（`prerequisites?: string[]` 中所有课程 ID 必须已完成）；任一门禁不通过时显示锁定提示，不渲染课程内容（防止 URL 绕过）
- **mental-tilt-recognition 例外**（v1.8 新增）：`mental-tilt-recognition` 课程无前置依赖，跳过 prerequisite 检查（情绪管理可随时访问）
- **Lesson.prerequisites 字段**（v1.8 新增）：`Lesson` 类型已新增 `prerequisites?: string[]` 字段（定义于 `strategy-academy/types.ts`）；声明 prerequisite 时必须确保引用的课程 ID 存在
- **QuickDrill 自动降级**（v1.8 新增）：达到降级条件时（由 `progress.shouldDownshiftDifficulty('strategy-academy')` 判定，阈值以 progress store 实现为准）自动降级难度（不低于 beginner）
- **ABILITY_LESSON_MAP 正确性**（v1.8 新增）：`dailyPlan.ts` 中的 `ABILITY_LESSON_MAP` 必须引用真实存在的 lesson ID（如 `l2-3bet-basics` 而非 `l2-3bet`）；修改时必须验证 ID 有效性
- **dailyPlan 职责区分**（v1.8 新增）：项目中存在两个 `generateDailyPlan` 函数：`strategy-academy/utils/dailyPlan.ts`（学院焦点课程计划）与 progress 模块中的（跨模块推荐计划）。两者职责不同，禁止混淆
- **TiltWarning 三选项**（v1.8 新增）：`TiltWarning` 组件必须提供三选项："我知道了"（仅关闭）/ "学习情绪管理"（跳转 `mental-tilt-recognition` 课程）/ "休息一下"（返回 Dashboard）

## Quality Checklist
- [ ] `node node_modules/typescript/bin/tsc --noEmit` exit code 0
- [ ] zh.json 与 en.json 双语同步（i18n key 前缀 `academy.*` / `drill.*` / `quickDrill.*`）
- [ ] Drill 组件实现 DrillProps 接口（onComplete / onExit）
- [ ] 课程数据为静态 JSON / TS 常量（无运行时网络请求）
- [ ] 快速训练完成时 recordTrainingDay + recordQuickDrillCompletion 已调用
- [ ] abilityToElo 仅在 gamesPlayed === 0 时同步（一次性）
- [ ] DrillLessonRouter 已注册新 Drill（React.lazy）
- [ ] 等级解锁规则生效（Level 7 需 L3+L5，Level 8 需 L4B）
- [ ] CourseView 双层门禁生效（Level + prerequisite）
- [ ] mental-tilt-recognition 课程可随时访问（无前置依赖）
- [ ] Lesson.prerequisites 引用的课程 ID 全部存在
- [ ] QuickDrill 连续答错 3 次自动降级（不低于 beginner）
- [ ] ABILITY_LESSON_MAP 引用的 lesson ID 全部存在
- [ ] TiltWarning 提供三选项（"我知道了" / "学习情绪管理" / "休息一下"）
