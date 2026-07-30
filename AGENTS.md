# AGENTS.md

> 项目级 AI 代理指导文件。本文件在会话开始时自动加载，约束所有 AI 代理在本仓库内的行为。
> 子代理配置位于 `.qoder/agents/`，详细产品规格见 `docs/PRD.md`，技术设计见 `docs/TDD.md`，版本演进见 `docs/CHANGELOG.md`。

---

## 项目概述

德州扑克训练平台（Poker Training Platform）——纯前端、零后端依赖的德州扑克系统性训练工具。通过交互式练习、即时反馈与数据可视化，帮助各层级扑克玩家提升决策能力。PWA 支持，离线可用，中英双语。

## 环境与命令

- **操作系统**：Windows
- **Shell**：PowerShell 7.x（禁止输出 bash/sh/zsh 语法；路径用反斜杠 `\`；环境变量 `$env:VAR`；命令串联用 `;` 或 `&&`）
- **包管理器**：pnpm（`package.json` 的 `devEngines.packageManager` 已锁定，禁止改用 npm/yarn）
- **Node 版本**：见 `.nvmrc` 或 `package.json` engines（如无则使用 LTS）

常用命令：

```powershell
pnpm dev            # 启动开发服务器
pnpm build          # tsc -b && vite build
pnpm preview        # 预览生产构建
pnpm typecheck      # 仅类型检查（CI 门禁，等价于 node node_modules/typescript/bin/tsc --noEmit）
```

> 注：`pnpm tsc` 因 `devEngines` 校验可能失败，`typecheck` script 已直接调用 `node node_modules/typescript/bin/tsc`。

## 技术栈

React 19 + Vite 8 + TypeScript 7（strict）+ Tailwind CSS 4 + shadcn/ui + Zustand 5（persist）+ React Router v7（lazy）+ i18next 26 + Recharts 3 + framer-motion 12 + IndexedDB（牌局大数据）。

禁止引入新依赖除非确有必要；引入前须评估 bundle 体积影响并更新 `package.json`。

## 代码组织

### Feature-First 模块化

```
src/
├── app/           # 路由配置（routes.tsx）
├── layouts/       # AppLayout / BlankLayout / MobileNav
├── features/      # 9 个业务模块（自包含）
│   ├── range-trainer/
│   ├── pot-odds/
│   ├── gto-simulator/
│   ├── hand-history/
│   ├── progress/        # 跨模块状态中枢
│   ├── onboarding/
│   ├── puzzle-trainer/
│   ├── strategy-academy/
│   └── theory-academy/  # 理论学习（与 strategy-academy 并列，理论→实践闭环）
├── shared/        # 跨模块共享层（≥2 模块使用才放入）
│   ├── types/     # poker / position / action / elo / mentor / decisionFeedback
│   ├── components/  # Card / EmptyState / LoadingState / ResultSummary
│   ├── utils/     # pokerMath / deck / elo / shareCard（纯函数）
│   ├── constants/ # mentorStyles
│   └── stores/    # trainingEvents（事件总线）/ debugMode（调试解锁开发者选项）
├── i18n/          # config.ts + locales/zh.json + locales/en.json
└── styles/        # globals.css（CSS 变量）
```

每个 feature 模块自包含：`components/` / `hooks/` / `utils/` / `data/` / `store.ts` / `types.ts` / `index.ts`。

### 关键约束

- **模块间禁止直接引用**：必须通过 `shared/` 层或 `trainingEvents` 事件总线
- **shared/ 层准入门槛**：被 ≥2 个模块使用才可放入；单模块使用的代码留在模块内
- **跨模块状态集中管理**：Streak / ELO / SRS / Emotion / Mentor 五大系统统一在 `src/features/progress/store.ts`（persist version 以该文件配置为准），禁止分散到各 feature store
- **唯一例外**：puzzle-trainer store 持有 `quickDrillBest`（快速训练最佳记录，独立持久化）；`quickDrillStreak` 连续天数计数器位于 progress store，由 `recordQuickDrillCompletion()` 维护并在连续 7 天时触发 `awardStreakFreeze(1)`

## 编码规范

### TypeScript

- `strict: true` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters`
- 路径别名：`@/*` → `./src/*`
- 禁止 `any`；必要时用 `unknown` + 类型守卫
- 公共 API 必须有显式返回类型

### 命名

| 类别 | 约定 | 示例 |
|---|---|---|
| 组件 | PascalCase.tsx | `RangeGrid.tsx` |
| Hook | camelCase.ts（use 前缀） | `useQuizEngine.ts` |
| 工具 | camelCase.ts | `rangeParser.ts` |
| 路由 | kebab-case | `/pot-odds/quiz` |
| i18n key | 模块前缀 + camelCase | `range.quiz.correct` |

### 文件大小

单文件 ≤ 200 行（课程内容数据文件可放宽）。超过时拆分为子组件 / 工具函数 / 数据文件。

### 函数设计

- 工具函数必须是纯函数（便于测试）
- 副作用（emit 事件 / 写 store）集中在 hook 或 store action
- 计算逻辑与渲染逻辑分离

## 状态管理

### Zustand + persist

- 全局状态用 `create()` + `persist()` 中间件，持久化到 `localStorage`
- 大数据（牌局）用 IndexedDB
- 每个 store 必须有 `name` 与 `version` 字段

persist `version` 数值以各 store 代码中的 `persist` 配置为唯一事实源，本文档不维护数值副本：

| Store | version 事实源 | name |
|---|---|---|
| progress | `src/features/progress/store.ts` | poker-training-progress |
| puzzle-trainer | `src/features/puzzle-trainer/store.ts` | puzzle-trainer-store |
| strategy-academy | `src/features/strategy-academy/store.ts` | strategy-academy-progress |
| theory-academy | `src/features/theory-academy/store.ts` | theory-academy-progress |

### Persist Version 升级硬性规则

1. 递增 `version`
2. 编写 `migrate(persistedState, fromVersion)` 函数
3. migrate 必须防御性合并默认值（`{ ...DEFAULT_X, ...persisted.x }`），不触碰已有字段
4. 老用户数据零丢失，首次加载自动迁移
5. persist version 数值以 store 代码为唯一事实源，文档与子代理文件不维护数值副本（无需同步数值）
6. 在 `docs/CHANGELOG.md` 的"数据迁移"小节记录

### 幂等性

`recordTrainingDay()` / `recordQuickDrillCompletion()` / `markDailyCompleted()` 等"记录完成"action 必须幂等（同一日重复调用不重复计数）。

## 路由与代码分割

- 路由配置：`src/app/routes.tsx`
- 所有路由页面必须用 `React.lazy()` + `<LazyWrapper>` 包裹
- 布局：`AppLayout`（主导航 + OnboardingGate）/ `BlankLayout`（无导航，用于 onboarding）
- 移动端 < 768px 显示底部 `MobileNav`

## 国际化

- 默认中文（zh），支持 zh / en
- 翻译文件：`src/i18n/locales/zh.json` + `src/i18n/locales/en.json`
- **硬性要求**：新增 i18n key 时必须同时更新 zh 与 en，缺一不可
- key 命名：`<module>.<context>.<field>`

## UI/UX 设计系统

- **色彩**：四层架构（牌桌绿 `--felt-*` / 象牙白 `--ivory-*` / 黄铜金 `--brass-*` / 胡桃木 `--walnut-*`），通过 CSS 变量定义于 `src/styles/globals.css`
- **字体**：Fraunces（serif 标题）/ Inter Tight（sans 正文）/ JetBrains Mono（mono 数字）
- **主题**：暗色为默认，禁止硬编码颜色值
- **响应式**：桌面 ≥1024px / 平板 768-1023px / 移动 <768px
- **可访问性**：遵循 WCAG 2.1 AA，交互元素必须有 `aria-label`，对比度 ≥4.5:1

## 跨模块复用系统

### 五级反馈

- `DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder'`
- 阈值数值以 `shared/types/decisionFeedback.ts` 的 `GRADE_THRESHOLDS` 常量为唯一事实源
- 评级函数：`calculateGrade(evLoss)`（`shared/types/decisionFeedback.ts`）
- 边界归入更严重等级（具体边界规则见 `calculateGrade` 实现）
- 所有训练模块的答题反馈必须复用此系统，禁止自定义评级
- `buildDecisionFeedback` 内部统一调用 `calculateGrade(evLoss)`，禁止用 `isCorrect` 掩盖真实 EV 损失

### 反馈闭环（v1.8 新增）

- **正向反馈（训练→课程）**：所有训练模块（range-trainer / pot-odds / gto-simulator / puzzle-trainer）的答题反馈必须携带 `relatedLessonId`，wrong/blunder 级别在反馈卡片显示"去复习"链接
- 推导工具函数：
  - range-trainer：`inferRelatedLessonId(position, actionType)`
  - GTO：根据 `scenario.street` 推导（preflop→`l4-gto-basics`, flop→`l3-cbet`, turn/river→`l3-multistreet`）
  - puzzle-trainer：`inferPuzzleLessonId(theme)`
- **反向反馈（数据→难度）**：`progress.shouldDownshiftDifficulty()`（无参调用）是自适应难度的**唯一入口**，禁止各模块自行判定
- 数据源：`progress.emotion.consecutiveWrongCount`（由 `recordAnswer(isCorrect)` 维护，全局计数；触发阈值以 `progress/store.ts` 的 `shouldDownshiftDifficulty` 实现为准）

### 位置渐进解锁（v1.8 新增）

- 常量 `POSITION_UNLOCK_THRESHOLDS` 定义于 `range-trainer/constants.ts`
- 阈值数值（UTG / HJ / CO / BTN / SB / BB）以该常量定义为唯一事实源，文档不维护数值副本
- 工具函数 `isPositionUnlocked(position, preflopElo): boolean`
- 调用方：`RangeSelector` 组件渲染时过滤锁定位置
- 阈值变更规则：调整时在 `docs/CHANGELOG.md` 记录（子代理文件不维护数值副本，无需同步数值）

### 答题选项排序治理（2026-07 新增）

- 所有选择题型训练的选项呈现顺序必须经过统一排序处理，禁止按题库数据原序直接渲染（防"正确答案位置固定"作弊）
- 分流规则（产品规格见 `docs/PRD.md` 5.26，技术设计见 `docs/TDD.md` 5.9）：动作类选项语义固定排序（消极→激进）；纯数值选项单调排列；文字陈述类按 `hash(题目id)` 种子洗牌；认证考试用会话随机种子
- 共享工具：`shared/utils/seededShuffle.ts`（判定与排序规则以该文件实现为唯一事实源）；各模块接入实现：puzzle-trainer `utils/optionOrder.ts`、strategy-academy `utils/quizShuffle.ts`、pot-odds `utils/quizOrder.ts`
- 硬性约束：源题库静态数据不手改重排，顺序处理在出口/渲染前用纯函数完成；i18n-key 型题库须在 `t()` 解析后重排，且顺序不得随语言变化；重排必须同步重映射正确答案标识；新增/扩充题库时必须经由所在模块的排序出口，并确保分布守卫测试（正确答案索引占比上限断言）覆盖新题
- 每日谜题契约不变：同一天所有用户看到相同题目与相同选项顺序

### 导师人格化

- 三种风格：`strict-math` / `old-school` / `encouraging`
- 模板：`MENTOR_FEEDBACK_TEMPLATES`（`shared/constants/mentorStyles.ts`）
- 渲染：`renderMentorFeedback(mentorStyle, grade, params)`
- QuizCard / GTOFeedback 优先调用，缺省时降级到 i18n

### 事件总线

- 实现：`src/shared/stores/trainingEvents.ts`
- feature 模块完成训练后必须 `trainingEvents.emit(event)`，progress store 自动订阅更新统计（v2.0 已全量合规：pot-odds / puzzle-trainer 已补全 emit；hand-history 为复盘分析工具而非交互式训练，属合理豁免，见其 store.ts 顶部说明与 `docs/CHANGELOG.md`）
- Streak / ELO / SRS / Emotion 的"记录"action 在答题时同步调用（不走事件总线）

### 调试解锁（开发者选项，2026-07 新增）

- 实现：`src/shared/stores/debugMode.ts`（独立 persist store，不并入 progress store）；激活码常量 `DEBUG_UNLOCK_CODE` 以该文件为唯一事实源（文档与子代理文件不维护数值副本）
- 激活后全局旁路门禁（共 5 处）：strategy-academy 的 `isLevelUnlocked`/`isLevelEntryUnlocked`、CourseView 本土课与课程级门禁、range-trainer `RangeSelector` 位置解锁、strategy-academy `LearningTracksView` 轨道前置、progress `SessionLimitGuard` 每日题量上限；新增门禁时应同步接入 `isDebugUnlockActive()` 短路
- 产品规格见 `docs/PRD.md` 5.6.6，技术设计见 `docs/TDD.md` 5.9；onboarding 不纳入解锁范围

## 文档维护（三层职责分离）

| 文档 | 职责 | 更新时机 |
|---|---|---|
| `docs/PRD.md` | 产品规格（What / Why） | 功能需求变更时 |
| `docs/TDD.md` | 技术设计（How） | 架构 / 数据模型 / 模块设计变更时 |
| `docs/CHANGELOG.md` | 执行历史与版本演进 | 每次版本发布时 |

- PRD 不含技术实现细节（文件路径 / store actions / persist version）
- TDD 不含执行历史
- 子代理修改代码时必须同步更新对应文档

## 质量门禁

- **类型检查**：`pnpm typecheck`（即 `node node_modules/typescript/bin/tsc --noEmit`）必须 exit code 0
- **Lint**：`pnpm lint`（即 `eslint src`）必须 exit code 0，仅启用两条规则：
  - `no-restricted-imports`：锁定 features 模块间直接引用，允许边清单以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源（收紧时只删不加）
  - `@typescript-eslint/no-explicit-any`：禁止 any
  - 注：lint 工具链通过 `.pnpmfile.cjs` 侧载 TS 6 API（typescript-eslint 尚不支持 TS 7.0），不影响 typecheck/build 使用的 TS 7
- **单元测试**：`pnpm test`（即 `vitest run`）必须 exit code 0，部署工作流在构建前强制执行；i18n 双语键对称由 `src/i18n/localeParity.test.ts` 覆盖；策略学院课程数据完整性（id 唯一 / 牌面合法 / 引用无悬空 / native order 无重复 / Drill 接线）由 `src/features/strategy-academy/data/curriculumIntegrity.test.ts` 覆盖
- **构建验证**：`pnpm build` 成功产出 `dist/`
- 每次代码变更后必须运行类型检查、`pnpm lint` 与 `pnpm test`

## 提交粒度

- **逻辑单元独立提交**：每个逻辑单元（单一 feature 变更 / 单一修复 / 单一文档同步）独立成 commit，禁止将多模块批量变更合入单个 commit
- **提交信息注明模块前缀**：采用 `type(scope): description` 格式，scope 为所属模块目录名（如 `feat(strategy-academy): ...`、`fix(range-trainer): ...`、`docs(agents): ...`）
- **仅约束新提交**：本指引不追溯已有提交，禁止为满足粒度要求重写已有 git 历史
- 本节是「Surgical Changes」原则在版本控制层面的延伸：改动范围最小化，提交范围同样最小化

## Agent 协作

### 命名规范

子代理文件位于 `.qoder/agents/`，命名遵循以下规则：

1. **格式**：统一使用 kebab-case（小写字母 + 连字符分隔），禁止无连字符缩写（如 `uiux` → `ui-ux`）
2. **Feature 模块代理**：命名为 `<feature-dir>-dev`，必须与 `src/features/<feature-dir>/` 目录名一一对应
3. **跨模块基础代理**：使用描述性 scope 前缀，不带项目名前缀（项目名冗余，所有代理均属于本项目）
4. **文件名 = frontmatter name**：`.md` 文件名必须与 frontmatter 中的 `name` 字段完全一致
5. **后缀约定**：`-dev` 表示开发类代理（含设计守护），后续如新增非开发类代理（如 review、qa）再扩展后缀

### 子代理清单

| 代理 | 类型 | 触发场景 |
|---|---|---|
| `platform-dev` | 基础层 | 脚手架 / 布局 / 路由 / shared 层 / 跨模块集成 |
| `ui-ux-dev` | 基础层 | 设计语言守护 / 全局视觉一致性 / 组件质感 / 布局与导航 / 响应式 / 可访问性 |
| `range-trainer-dev` | Feature | 范围训练模块内变更 |
| `pot-odds-dev` | Feature | 赔率计算器模块内变更 |
| `gto-simulator-dev` | Feature | GTO 模拟器模块内变更 |
| `hand-history-dev` | Feature | 牌局复盘模块内变更 |
| `progress-dev` | Feature | 跨模块状态 / Dashboard / 统计图表 |
| `onboarding-dev` | Feature | 新手引导流程 |
| `puzzle-trainer-dev` | Feature | Puzzle 三模式 |
| `strategy-academy-dev` | Feature | 课程 / Drill / QuickDrill |
| `theory-academy-dev` | Feature | 理论学院课程 / 章末小测 / 理论→实践桥接 |

### 边界约束

- 子代理只能修改本模块文件 + 必要的 `shared/` 文件
- 跨模块变更必须通过 `platform-dev` 协调
- 子代理文件的 `## Constraints` 章节不得与本 AGENTS.md 冲突

### 跨模块变更协作流程

1. 在 `platform-dev` 评估影响范围
2. 更新 `docs/TDD.md` 的架构图与跨模块系统章节
3. 升级 progress store persist version + 编写 migrate（如涉及状态变更）
4. 通知受影响 feature 模块的子代理更新其文件
5. 涉及全局样式/共享组件/布局/导航/主题色变更时，通知 `ui-ux-dev` 做视觉一致性复核（质量清单以 `poker-ui-demo/DESIGN_LANGUAGE.md` 当前版本为准）
6. 更新 `docs/CHANGELOG.md`
7. 运行 `pnpm typecheck` 验证

## 行为准则

继承自 `claude.md`：

- **Think Before Coding**：不做沉默假设，不确定先问
- **Simplicity First**：最少代码解决问题，不写投机性代码，不为单次使用做抽象
- **Surgical Changes**：只碰必须碰的，不"顺便改进"无关代码，遵循已有风格
- **Goal-Driven Execution**：定义成功标准，循环验证

检验标准：每一行改动都应能直接追溯到用户的需求。
