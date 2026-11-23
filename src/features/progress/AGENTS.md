# src/features/progress AGENTS.md

本目录是跨模块状态中枢。以下为本地约束，与根 AGENTS.md 配套（根文件为总入口，本文件为就近增强）。

## 职责

- 集中管理跨模块状态五大系统：Streak / ELO / SRS / Emotion / Mentor
- persist version 以 `store.ts` 的 persist 配置为唯一事实源（文档不维护数值副本）
- 订阅 `trainingEvents` 事件总线自动更新统计（训练模块 emit，本 store 订阅）

## 硬约束

- 跨模块状态禁止分散到各 feature store（`quickDrillBest` / `quickDrillStreak` 等 QuickDrill 状态亦集中于本 store）
- "记录完成" action 必须幂等：`recordTrainingDay()` / `recordQuickDrillCompletion()` 同日均不重复计数（puzzle-trainer 的每日谜题标记 `markDailyCompleted()` 归属其自身 store，同样须幂等）
- 自适应难度唯一入口：`shouldDownshiftDifficulty()`（无参调用），禁止各模块自行判定
- 数据迁移：递增 version + 编写 migrate（防御性合并默认值）+ CHANGELOG 记录，老用户数据零丢失
- `quickDrillStreak` 连续天数计数器位于本 store，由 `recordQuickDrillCompletion()` 维护，连续 7 天触发 `awardStreakFreeze(1)`

## 公共入口（跨模块契约）

- 对外只暴露三层，其它一律视为内部实现：
  - `index.ts`：聚合入口（再导出 `api` / `api.types`，外加复习项工具、每日训练推荐、成就数据、QuickDrill 混合工具，以及课程枢纽使用的 `useAcademyLearningStages` / `useAcademyProgressSnapshot` / `useAcademyLessonAttemptsSnapshot` 只读 hook）
  - `api.ts` + `api.types.ts`：读写契约 —— `useProgressState(selector)` 只返回 `ProgressReadModel` 白名单字段，`progressCommands` 只委托既有 action（业务规则仍在本模块）
  - `ui.ts`：布局级展示件（`OnboardingGate` / `TiltWarning` / `MilestoneCelebrationHost` / `ProgressPersistErrorNotice`）
  - `sessionLimit.ts`：训练页止损守卫（`SessionLimitGuard` / `useSessionLimitReached` / `useSessionLimitStatus`），独立入口避免被布局 eager 依赖拉入首屏
- 跨模块禁止深引 `store` / `store.bootstrap` / `components/*` / `utils/*` / `types` / `data/*`；需要新能力时在上述入口增补导出。守卫：`src/guards/progressPublicApi.guard.test.ts`（装配例外仅 `src/main.tsx` 的 `store.bootstrap` 与 `src/app/routes.tsx` 的页面 lazy import）。
- 新增 `ProgressReadModel` 字段或 `progressCommands` 命令即新增跨模块契约：先改 `api.types.ts`，再同步根 AGENTS.md 契约表与 TDD §5.5。

## 保存语义（记录保存结果）

- **提交后才算已保存**：`addRecord` 先写内存（UI 立即可读），随后落库；只有 `RecordPersistResult.ok === true`（`inserted` / `exists`）才是「已保存」。
- `persistRecord` 永不 reject，失败以 `{ ok: false, reason, retainedInMemory }` 形式返回（`reason` 为 `invalid`、`cancelled` 或 `failed`）并在内存保留；消费方不得把「进了内存」当「已落库」。
- 失败记录进入运行态 pending 队列；`retryPendingRecords()` 只重写 IndexedDB，不重新 emit 训练事件、不重新评分 / 计数。
- `deleteRecord` / `clearAllRecords` 先 `cancelPendingRecord` / `cancelAllPendingRecords`（在途结果变 `cancelled` 并补偿删除），再删库，防止旧待写任务把已删记录复活。

## 分源持久化状态

- `persistenceStatus.ts`（运行态、不进 persist）按 `localStorage` / `records` / `cleanup` 三源分治，失败带 `reason` / `operation` / `at`，records 源额外携带待重试条数。
- 代次语义：失败让该源代次 +1；成功可携带操作起始代次，代次已变则不清除，避免迟到的成功抹掉更新的失败。
- `ProgressPersistErrorNotice`（经 `ui` 入口）在 `AppLayout` 与 `BlankLayout` 各挂一次（两布局互斥，不会重复出现），提供重试 / 前往设置 / 下载当前数据（明示为部分备份）。
- `persistenceStatus` 不反向 import store：localStorage 重写动作由 store 通过 `setLocalStorageRetryHandler` 注册。

## legacy 桥接保护

- `store.bootstrap` 经 `legacyRecordsBridge` 迁移 v13 前遗留在 localStorage 的 records：迁移确认（IndexedDB 事务提交）前，persist 写回会继续保留原 key 中的旧 records；成功后移除旧字段并释放桥接，失败则保持桥接、上报 `records` 来源并允许下次 init 重试。桥接未完成时记录类破坏性操作保持关闭，禁止为过测试清库。
- `loadRecordsFromDatabase()` 用 `epoch` 屏障 + `removedIds` 过滤：延迟加载返回时若期间发生过清空 / 删除，旧快照作废、已删记录不回填；内存与库内合并以内存优先。
- 修改上述任一步骤必须同步 `store.bootstrap.test.ts` / `store.bootstrap.resilience.test.ts`，并在 CHANGELOG 记录数据风险面。

## 关键文件

- `store.ts`：五大系统 + persist（唯一事实源）
- `types.ts`：状态类型定义
- `utils/`：statsAggregator（统计聚合）/ streakCalc（连续天数）/ spacedRepetition（SRS）/ dailyTrainingMix / dailyTrainingPlan / indexedDB（牌局大数据）
- `components/`：Dashboard / ProgressPage / ModuleStatsPanel / StreakTracker / SessionLimitGuard 等 20+ 组件
- `data/achievements.ts`：成就定义
