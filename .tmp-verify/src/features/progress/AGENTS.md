# src/features/progress AGENTS.md

本目录是跨模块状态中枢。以下为本地约束，与根 AGENTS.md 配套（根文件为总入口，本文件为就近增强）。

## 职责

- 集中管理跨模块状态五大系统：Streak / ELO / SRS / Emotion / Mentor
- persist version 以 `store.ts` 的 persist 配置为唯一事实源（文档与子代理文件不维护数值副本）
- 订阅 `trainingEvents` 事件总线自动更新统计（训练模块 emit，本 store 订阅）

## 硬约束

- 跨模块状态禁止分散到各 feature store（`quickDrillBest` / `quickDrillStreak` 等 QuickDrill 状态亦集中于本 store）
- "记录完成" action 必须幂等：`recordTrainingDay()` / `recordQuickDrillCompletion()` 同日均不重复计数（puzzle-trainer 的每日谜题标记 `markDailyCompleted()` 归属其自身 store，同样须幂等）
- 自适应难度唯一入口：`shouldDownshiftDifficulty()`（无参调用），禁止各模块自行判定
- 数据迁移：递增 version + 编写 migrate（防御性合并默认值）+ CHANGELOG 记录，老用户数据零丢失
- `quickDrillStreak` 连续天数计数器位于本 store，由 `recordQuickDrillCompletion()` 维护，连续 7 天触发 `awardStreakFreeze(1)`

## 关键文件

- `store.ts`：五大系统 + persist（唯一事实源）
- `types.ts`：状态类型定义
- `utils/`：statsAggregator（统计聚合）/ streakCalc（连续天数）/ spacedRepetition（SRS）/ dailyTrainingMix / dailyTrainingPlan / indexedDB（牌局大数据）
- `components/`：Dashboard / ProgressPage / StatsOverview / StreakTracker / SessionLimitGuard 等 20+ 组件
- `data/achievements.ts`：成就定义
