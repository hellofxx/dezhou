# src/shared AGENTS.md

本目录为跨模块共享层。以下为本地约束，与根 AGENTS.md 配套（根文件为总入口，本文件为就近增强）。

## 准入门槛（硬约束）

- 只有被 ≥2 个模块使用的代码才允许放入 shared/；单模块使用的代码必须留在该模块内
- 模块间禁止直接引用：eslint no-restricted-imports 锁定，允许边清单以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源（收紧时只删不加）

## 分层职责

- `types/`：跨模块类型（poker / position / action / elo / mentor / decisionFeedback）
- `components/` 分层：
  - `poker/`：扑克领域组件（Card / CardBack / CardSVG / Chip / SuitIcon / HandDisplay / PositionBadge）
  - `feedback/`：反馈与状态组件（FeedbackGrade / ResultSummary / EmptyState / LoadingState）
  - `layout/`：布局组件（TableRail / LiveDot）
  - `business/`：业务组件（CasinoPlaque / ErrorBoundary / FreezeChip / GameVariantSelector / MottoEngraved）
  - `ui/`：shadcn 基础组件（button / dialog / input / select / tabs / toast / tooltip / progress / card）
- `utils/`：纯函数（cn / deck / elo / formatters / handRanking / pokerMath / seededShuffle / shareCard / soundManager）
- `constants/`：跨模块常量（app / mentorStyles / poker）
- `stores/`：trainingEvents（事件总线）/ debugMode（调试解锁，激活码以代码为唯一事实源）
- `hooks/`：跨模块共享 hook

## 修改规则

- 工具函数必须是纯函数（便于测试）；计算逻辑与渲染逻辑分离，副作用集中在 hook 或 store action
- 修改 shared/ 影响所有模块：变更后必须运行 `pnpm verify`，并同步检查受影响模块与事件总线接线
