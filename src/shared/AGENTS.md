# src/shared AGENTS.md

本目录为跨模块共享层。以下为本地约束，与根 AGENTS.md 配套（根文件为总入口，本文件为就近增强）。

## 准入门槛（硬约束）

- 只有被 **≥2 个模块**使用的代码才允许放入 shared/；单模块使用的代码必须留在该模块内（口径：feature 模块与 shell 层各计一个消费者，shared→shared 边沿 import 图传递到不动点）
- **准入守卫**：`src/shared/admission-guard.test.ts`（分析器在 `src/test-utils/admissionGraph.ts`）—— 0 生产消费者直接失败；1 生产消费者失败，只有登记在「只降不升 baseline」时才允许存在（当前 baseline 为空，新增单消费者代码即红）；baseline 双向校验（文件消失但条目还在 → 失败）
- **`components/ui/**` 豁免 ≥2**（vendored shadcn 基础件按组件族整体使用），但仍禁止 0 消费
- **测试桩例外**：`utils/localStorageStub.ts`（Node 环境 persist 测试的 `window.localStorage` 桩）与 `utils/persistShape.ts`（persist 形状断言助手）按**测试消费者**计数豁免；两者不得被生产代码引用，也不得登记 baseline
- 模块间禁止直接引用：eslint no-restricted-imports 锁定，允许边清单以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源（收紧时只删不加）；shared 禁止 import `@/features/*`
- 新增 / 回迁判定：已在 shared 的文件若被拆到单一消费方，一律回迁该模块（`shared` 不做「可能将来会用」的预留）

## 目录结构

```text
src/shared/
├─ components/
│  ├─ ui/            # vendored shadcn 基础件（button / card / dialog / input /
│  │                 # progress / select / toast / tooltip）；豁免 ≥2，禁 0 消费
│  ├─ poker/         # Card / CardBack / CardSVG / Chip / HandDisplay / PositionBadge /
│  │                 # VariantGlyph / VariantToggle / OpponentGlyph
│  ├─ quiz/          # QuizCard + quizCardModel（range-trainer / onboarding 专用）
│  ├─ feedback/      # DecisionAnalysis / GradeIcon / MobileFeedbackSheet /
│  │                 # RelatedLessonChip / TryAgainButton / EmptyState / LoadingState /
│  │                 # ComparisonView / ResultHeader / ResultActions
│  ├─ academy/       # 学院共享组件（见下）+ ContentBlocks + index.ts（唯一 facade）
│  ├─ data-display/  # ProgressBar / ProgressRing / StatCard / StatPair
│  ├─ system/        # ErrorBoundary（全局错误兜底整页视图）
│  └─ layout/        # BackLink（返回入口统一；应用外壳级布局在 src/layouts/）
├─ constants/        # app / headsUpRules / mentorStyles / poker
├─ data/             # opponentProfiles（对手画像，gto-simulator / strategy-academy 消费）
├─ hooks/            # useIsMobile / useRovingGridNav
├─ stores/           # trainingEvents（事件总线）/ debugMode（调试解锁）/
│                    # achievementRegistry / academyDataSourceRegistry / theoryDataSourceRegistry
├─ types/            # academy / academyDataSource / achievementDataSource / action / common /
│                    # decisionFeedback / elo / mentor / opponent / poker / position / quiz /
│                    # theoryDataSource / training / variantRules
└─ utils/            # 纯函数（见下）
```

### 关键文件

- `components/academy/`（7 个共享组件 + 内容块）：`AcademyBridgeCard` / `AcademyMasteryCard` / `AcademyVariantRuleCard` / `AcademySearchShell` / `AcademyBookmarksPanel` / `AcademyNotesPanel` / `ContentIssueReportDialog` / `ContentBlocks`（`LabeledBlock` / `AsciiMonoText` / `FormulaBlock`）；`index.ts` 汇总全部公开导出
- `components/data-display/`：`ProgressBar`（线性进度）、`ProgressRing`（环形进度，`valueMax` / `variant` / `center` / `ariaLabel`）、`StatCard`（统计卡，`size` / `layout` / `surface` / `accent`）、`StatPair`（`<dl>` 成对指标）
- `components/feedback/`：`ResultHeader`（结果页标题，`headingLevel` 决定 h1/h2，可挂 `ring` 槽）、`ResultActions`（结果页动作组，`row` / `stack`）、`DecisionAnalysis`（五级反馈渲染）、`MobileFeedbackSheet`（移动端底部反馈 Sheet）、`RelatedLessonChip`（「去复习」链接）、`GradeIcon` / `ComparisonView` / `EmptyState` / `LoadingState` / `TryAgainButton`
- `components/poker/`：牌面与变体可视化（`VariantToggle` 归此域，不再游离根目录）
- `components/layout/BackLink`：返回入口统一件（`to` / `historyBack` / 文本·胶囊·按钮三变体，icon-only 必填 `aria-label`，触摸目标 ≥44px）
- `components/system/ErrorBoundary`：全站错误兜底，脱离布局渲染（`<h1>` 在 `pageHeadingGuard` allowlist 登记）
- `utils/`：`cn` / `formatters` / `toLocalDateKey` / `handClassifier` / `rangeParser` / `deck` / `seededShuffle`（随机与数值判定底座）/ `optionOrder`（选项排序策略唯一实现）/ `academyMastery` / `academyQuizBank` / `academyQuizDraw` / `academySrs` / `academyVariantRules` / `motion` / `spacedRepetition` / `localStorageStub` / `persistShape`
- `stores/`：`trainingEvents`（训练事件总线）、`debugMode`（调试解锁，唯一独立 persist store）、`achievementRegistry` / `academyDataSourceRegistry` / `theoryDataSourceRegistry`（注册表）

> 已迁出本层的常见误解项：`pokerMath` 在 `pot-odds/utils/`；`sanitizeReviewLabel` 在 `progress/utils/`；`ResultSummary` 在 `gto-simulator/components/`；`TableRail` 在 `src/layouts/`；`moduleLabels` / `useModuleLabel` / `useAcademyDataSource` / `ability` 在 `progress/`。本层不存在 `elo` / `handRanking` / `shareCard` / `soundManager` / `quizOrder` 工具与 `utils/index.ts` barrel。

## 导入规则

- **深路径导入**：组件、工具、类型、常量一律写全路径（`@/shared/components/poker/Card`、`@/shared/utils/cn`、`@/shared/types/poker`）
- **唯一 facade 例外**：`@/shared/components/academy` 保留 barrel —— 理论 / 策略两院按组消费，行为与文案由各自薄包装保持；新增学院组件必须同时补 `index.ts` 导出
- 不新增其他目录级 barrel / `index.ts`（`utils/index.ts` 已删除，勿恢复）；`types` 也不做汇总 barrel
- shared 内部引用用相对路径（同层工具间），跨层用 `@/shared/*` 别名

## 修改规则

- 工具函数必须是纯函数（便于测试）；计算逻辑与渲染逻辑分离，副作用集中在 hook 或 store action
- **行数豁免**：`components/**`（跨模块装配体保持单文件内聚）不做行数限制；`utils` / `types` / `constants` / `stores` 仍受 ≤300 行目标、>400 行失败约束（口径见 `docs/AI_GUIDE.md` §文件大小与 `src/guards/line-count-guard.test.ts`）
- 修改 shared/ 影响所有模块：变更后必须运行 `pnpm verify`（含 `admission-guard.test.ts`），并同步检查受影响模块、事件总线接线与注册表
- 新增共享项的登记顺序：根 AGENTS.md §跨模块复用契约 + `docs/AI_GUIDE.md` §跨模块复用契约 + `docs/TDD.md` 对应章节，然后才落代码

> 组件级 a11y 测试工具在 `src/test-utils/`（不在 shared 运行时层）；全局不变式守卫在 `src/guards/`（清单见 `src/guards/README.md`）。
