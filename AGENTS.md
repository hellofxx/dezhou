# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

> 项目级 AI 代理指导文件。本文件在会话开始时自动加载，约束所有 AI 代理在本仓库内的行为。
> 子代理配置位于 `.claude/agents/`（物理源文件，入库；`.qoder/agents/` 为 Junction 链接指向该目录，Qoder 兼容读取），详细产品规格见 `docs/PRD.md`，技术设计见 `docs/TDD.md`，版本演进见 `docs/CHANGELOG.md`。深度知识库见 `.qoder/repowiki/`（详见下文「知识库（repowiki）」章节）。

---

## 项目概述

德州扑克训练平台（Poker Training Platform）——纯前端、零后端依赖的德州扑克系统性训练工具。通过交互式练习、即时反馈与数据可视化，帮助各层级扑克玩家提升决策能力。PWA 支持，离线可用，中英双语。

## 环境与命令

- **操作系统**：Windows
- **Shell**：PowerShell 7.x（禁止输出 bash/sh/zsh 语法；路径用反斜杠 `\`；环境变量 `$env:VAR`；命令串联用 `;` 或 `&&`）
- **包管理器**：pnpm（`package.json` 的 `devEngines.packageManager` 已锁定，禁止改用 npm/yarn；pnpm 具体版本以 `package.json` 的 `packageManager` 字段为唯一事实源）
- **Node 版本**：以 `.nvmrc` 为唯一事实源

常用命令：

```powershell
pnpm dev            # 启动开发服务器
pnpm build          # tsc -b && vite build
pnpm preview        # 预览生产构建
pnpm typecheck      # 仅类型检查（CI 门禁，等价于 node node_modules/typescript/bin/tsc --noEmit）
pnpm lint           # eslint src（规则清单见「质量门禁」）
pnpm test           # vitest run（全部单元测试）
```

运行部分测试：

```powershell
pnpm test src/i18n/localeParity.test.ts   # 运行单个测试文件（路径过滤）
pnpm test --project unit                  # 仅 Node 环境测试（src/**/*.test.ts）
pnpm test --project component             # 仅 jsdom 组件测试（src/**/*.test.tsx）
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
├── features/      # 10 个业务模块（自包含，清单以目录实际内容为准）
│   ├── range-trainer/
│   ├── pot-odds/
│   ├── gto-simulator/
│   ├── hand-history/
│   ├── progress/        # 跨模块状态中枢
│   ├── onboarding/
│   ├── puzzle-trainer/
│   ├── strategy-academy/
│   ├── theory-academy/  # 理论学习（与 strategy-academy 并列，理论→实践闭环）
│   └── help-center/     # 平台使用教程（纯静态模块，豁免 store.ts）
├── shared/        # 跨模块共享层（≥2 模块使用才放入；以下子目录注释为示例非穷举，以目录实际内容为准）
│   ├── types/     # poker / position / action / elo / mentor / decisionFeedback
│   ├── components/  # Card / EmptyState / LoadingState / ResultSummary
│   │   └── (子目录划分：ui/ shadcn 基础组件、business/ 业务组件、feedback/ 反馈类组件；具体以目录实际内容为准)
│   ├── utils/     # pokerMath / deck / elo / shareCard（纯函数）
│   ├── constants/ # mentorStyles
│   └── stores/    # trainingEvents（事件总线）/ debugMode（调试解锁开发者选项）
├── i18n/          # config.ts + moduleRegistry.ts + preload.ts + locales/{zh,en}/<module>.json
└── styles/        # globals.css（CSS 变量）
```

每个 feature 模块自包含：`components/` / `hooks/` / `utils/` / `data/` / `store.ts` / `types.ts` / `index.ts`。

**模块最小结构约定**：每个 feature 模块**至少**必须包含 `components/`、`store.ts`、`types.ts`、`index.ts`。`hooks/`、`utils/`、`data/`、`constants.ts`、`parsers/`、`workers/` 为按需目录，在模块无需相应代码时可省略。无状态需求的纯静态模块可豁免 `store.ts`（当前仅 help-center，其代理文件已同步声明）。此约定确保 AI 代理在探索新模块时能以最少的文件查询确认模块结构。

### 关键约束

- **模块间禁止直接引用**：必须通过 `shared/` 层或 `trainingEvents` 事件总线；唯一例外为 progress（跨模块状态中枢，各模块引用其公开 API 属设计内）；允许边清单以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源（当前快照：全部 feature 仅允许 → progress；hand-history / help-center / progress 无出边）
- **shared/ 层准入门槛**：被 ≥2 个模块使用才可放入；单模块使用的代码留在模块内
- **跨模块状态集中管理**：Streak / ELO / SRS / Emotion / Mentor 五大系统统一在 `src/features/progress/store.ts`（persist version 以该文件配置为准），禁止分散到各 feature store
- **QuickDrill 状态归属**：`quickDrillBest`（快速训练最佳记录，由 `submitQuickDrillResult()` 维护）与 `quickDrillStreak`（连续天数计数器，由 `recordQuickDrillCompletion()` 维护，连续 7 天触发 `awardStreakFreeze(1)`）均位于 progress store
- **文件语义归属登记**：新增文件必须直接放入语义归属模块，避免物理位置与语义归属分裂；已存在分裂时以**实际消费方实证归属**（唯一消费方所在模块即归属方），并把归属结论同步到相关模块代理与 `platform-dev`（案例：`src/features/hand-history/workers/gtoWorker.ts` 实证归属 hand-history，唯一消费方为本模块 `utils/gtoDeviation.ts`）
## 编码规范

> 完整规范见 `docs/AI_GUIDE.md` §编码规范；子代理侧单源约束见 §子代理共享基线条款 §全局约束（禁止在此重述）。React 渲染约定（数组不可变 / 条件渲染 / Effect 治理 / 组件定义 / 事件监听）见下文：

### React 渲染约定

- **数组不可变性**：排序/反转/删除链优先用不可变 API（`toSorted()` / `toReversed()` / `toSpliced()`），禁止对源数组原地 `.sort()`；`map`/`filter` 已返回新数组可接 `.sort()`，但统一改 `toSorted()` 以保持语义一致
- **条件渲染**：条件为数值/字符串等非布尔值时用三元（`count > 0 ? <X/> : null`），禁止 `count && <X/>`（会渲染 `0`/空串）；布尔条件可用 `&&`
- **Effect 治理**：可由 props/state 派生的值禁止用 `useEffect` + `setState` 回写（渲染期直接计算）；交互触发的副作用（提交/跳转/播放音效）放事件处理器，不用 state + Effect 建模
- **组件定义**：禁止在组件内部定义组件（导致每次渲染重挂载与状态丢失），内部子组件提取到模块级并经 props 传值
- **事件监听器**：`addEventListener` 必须在 `useEffect` 内注册并 cleanup；滚动/触摸类监听须传 `{ passive: true }`

## 状态管理（摘要，详见 docs/AI_GUIDE.md）

- Zustand + persist → localStorage；牌局大数据用 IndexedDB
- 禁止裸调 `localStorage.getItem/setItem`，所有持久化经 zustand persist 中间件（自动版本化 + migrate）
- 每个 store 必须有 name 与 version；persist version 以 store 代码为唯一事实源
- "记录完成" action 必须幂等（同日均不重复计数）

## 国际化（摘要，详见 docs/AI_GUIDE.md）

- 默认中文（zh），支持 zh/en；新增 key 必须同时更新双语，缺一不可
- key 命名：`<module>.<context>.<field>`；静态 key 一律 camelCase（如 `selectVariant` / `rulesDifference`）；kebab-case 仅用于与枚举值/路由参数一一对应的动态 key（如 `variant.name.short-deck`）
- 模块注册表 `src/i18n/moduleRegistry.ts` 为唯一契约源：模块增删须同步 `I18nModuleKey` / `ALL_MODULES` / `loadModule`（/ `CORE_MODULES` / `FEATURE_GROUPS`）

## UI/UX 设计系统（摘要，详见 docs/AI_GUIDE.md）

- 四层色彩 token（`--felt-*` / `--ivory-*` / `--brass-*` / `--walnut-*`，globals.css 为唯一权威）
- 暗色默认，禁止硬编码颜色；WCAG 2.1 AA
- 反霓虹硬约束：禁 Tailwind 霓虹类 / 纯黑白，由 designTokenGuard.test.ts 守卫
- 设计契约权威源：poker-ui-demo/DESIGN_LANGUAGE.md

## 路由与代码分割

- 路由配置：`src/app/routes.tsx`
- 所有路由页面必须用 `React.lazy()` + `<LazyWrapper>` 包裹
- 页面 chunk 与该路由所需 i18n 模块并行加载（`lazyPage` 用 `Promise.all([loader(), preloadI18n(keys)])`），core 模块幂等跳过不重复加载
- 布局：`AppLayout`（主导航 + OnboardingGate）/ `BlankLayout`（无导航，用于 onboarding）
- 移动端 < 768px 显示底部 `MobileNav`

## 构建与离线

- **分包策略**：`vite.config.ts` 通过 `manualChunks` 对大型数据文件与 vendor 库进行手动分包，提升并行加载与缓存效率（具体规则以 `vite.config.ts` 实际配置为唯一事实源）
- **Service Worker 离线缓存**：`public/sw.js` 带 `APP_VERSION` 查询参数缓存静态资源，激活时清理旧版本缓存，支持离线访问（版本号机制以 `public/sw.js` 实际实现为准）
- **路径基准**：路由 `basename` 使用 `import.meta.env.BASE_URL`，自动适配 GitHub Pages 子路径部署

## 跨模块复用系统

### 五级反馈

- `DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder'`
- 阈值数值以 `shared/types/decisionFeedback.ts` 的 `GRADE_THRESHOLDS` 常量为唯一事实源
- 评级函数：`calculateGrade(evLoss)`（`shared/types/decisionFeedback.ts`）
- 边界归入更严重等级（具体边界规则见 `calculateGrade` 实现）
- 所有训练模块的答题反馈必须复用此系统，禁止自定义评级
- `buildDecisionFeedback` 内部统一调用 `calculateGrade(evLoss)`，禁止用 `isCorrect` 掩盖真实 EV 损失

### 反馈闭环

- **正向反馈（训练→课程）**：所有训练模块（range-trainer / pot-odds / gto-simulator / puzzle-trainer）的答题反馈必须携带 `relatedLessonId`，wrong/blunder 级别在反馈卡片显示"去复习"链接
- 推导工具函数：
  - range-trainer：`inferRelatedLessonId(position, actionType)`
  - GTO：根据 `scenario.street` 推导（preflop→`l4-gto-basics`, flop→`l3-cbet`, turn/river→`l3-multistreet`）
  - puzzle-trainer：`inferPuzzleLessonId(theme)`
- **反向反馈（数据→难度）**：`progress.shouldDownshiftDifficulty()`（无参调用）是自适应难度的**唯一入口**，禁止各模块自行判定
- 数据源：`progress.emotion.consecutiveWrongCount`（由 `recordAnswer(isCorrect)` 维护，全局计数；触发阈值以 `progress/store.ts` 的 `shouldDownshiftDifficulty` 实现为准）

### 位置渐进解锁

- 常量 `POSITION_UNLOCK_THRESHOLDS` 定义于 `range-trainer/constants.ts`
- 阈值数值（UTG / HJ / CO / BTN / SB / BB）以该常量定义为唯一事实源，文档不维护数值副本
- 工具函数 `isPositionUnlocked(position, preflopElo): boolean`
- 调用方：`RangeSelector` 组件渲染时过滤锁定位置
- 阈值变更规则：调整时在 `docs/CHANGELOG.md` 记录（子代理文件不维护数值副本，无需同步数值）

### 答题选项排序治理

- 所有选择题型训练的选项呈现顺序必须经过统一排序处理，禁止按题库数据原序直接渲染（防"正确答案位置固定"作弊）
- 分流规则（产品规格见 `docs/PRD.md` 5.26，技术设计见 `docs/TDD.md` 5.9）：动作类选项语义固定排序（消极→激进）；纯数值选项单调排列；文字陈述类按 `hash(题目id)` 种子洗牌；认证考试用会话随机种子
- 共享工具：`shared/utils/seededShuffle.ts`（判定与排序规则以该文件实现为唯一事实源）；各模块接入实现：puzzle-trainer `utils/optionOrder.ts`、strategy-academy `utils/quizShuffle.ts`、pot-odds `utils/quizOrder.ts`、theory-academy `utils/quizOrder.ts`
- 硬性约束：源题库静态数据不手改重排，顺序处理在出口/渲染前用纯函数完成；i18n-key 型题库须在 `t()` 解析后重排，且顺序不得随语言变化；重排必须同步重映射正确答案标识；新增/扩充题库时必须经由所在模块的排序出口，并确保分布守卫测试（正确答案索引占比上限断言）覆盖新题
- 每日谜题契约不变：同一天所有用户看到相同题目与相同选项顺序

### 导师人格化

- 三种风格：`strict-math` / `old-school` / `encouraging`
- 模板：`MENTOR_FEEDBACK_TEMPLATES`（`shared/constants/mentorStyles.ts`）
- 渲染：`renderMentorFeedback(mentorStyle, grade, params)`
- QuizCard / GTOFeedback 优先调用，缺省时降级到 i18n

### 事件总线

- 实现：`src/shared/stores/trainingEvents.ts`
- feature 模块完成训练后必须 `trainingEvents.emit(event)`，progress store 自动订阅更新统计（hand-history 为复盘分析工具而非交互式训练，属合理豁免，见其 store.ts 顶部说明与 `docs/CHANGELOG.md`）
- 五大系统的"记录"action 在答题/反馈环节同步调用（不走事件总线）：Streak / ELO / SRS / Emotion 直接记录，Mentor 经 `renderMentorFeedback` 渲染反馈文案

### 调试解锁（开发者选项）

- 实现：`src/shared/stores/debugMode.ts`（独立 persist store，不并入 progress store）；激活码常量 `DEBUG_UNLOCK_CODE` 以该文件为唯一事实源（文档与子代理文件不维护数值副本）
- 激活后全局旁路门禁（共 9 处）：strategy-academy 的 `isLevelUnlocked`/`isLevelEntryUnlocked`、strategy-academy `ConceptGraph` 本土课节点解锁（`isLocalLessonUnlocked`）、CourseView 本土课与课程级门禁、strategy-academy `LearningTracksView` 轨道前置、range-trainer `RangeSelector` 位置解锁、range-trainer `QuizConfig` 位置解锁、progress `SessionLimitGuard` 每日题量上限、theory-academy store 的 `isTheoryLevelUnlocked`、theory-academy `TheoryChapterView` 章节 URL 直达门禁；短路有两种接法——store/纯逻辑用 `isDebugUnlockActive()`、组件内用 `useDebugModeStore((s) => s.unlockAll)`，新增门禁时须同步接入
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
- **版本注记惯例**：AGENTS.md 与子代理文件只描述当前事实，禁止留存 "(vX.X 新增)" / "(YYYY-MM 新增)" 类批注；演进历史一律记录于 `docs/CHANGELOG.md`

### 文档维护原则·单点事实源

凡涉及代码事实的（module list/version number/test count/file existence），应以实际代码为唯一事实源，禁止硬编码数值。AGENTS.md/TDD.md/子智能体文件应仅描述"当前事实"与"访问路径"，避免维护随时间漂移的值域或版本快照。历史演进信息统一记录于 `docs/CHANGELOG.md`。

示例：`TDD.md` §9.4 persist version 表不再硬编码版本号，改为"以 store.ts persist 配置为唯一事实源"引用策略；`features`模块列表采用"以 src/features/目录为准"动态引用而非静态枚举。

## 知识库（repowiki）

### Qoder 平台使用（推荐）
- **位置**：`.qoder/repowiki/`（自动维护，无需手动操作）
- **生成与维护**：通过 Qoder IDE 的 `/knowledge` 命令触发增量更新
- **检索方式**：开发时 Agent 会自动加载相关模块知识到上下文
- **详情指南**：参考 `docs/knowledge-guide.md`

### 子代理规范
- 子代理文件（`.claude/agents/*.md`）描述行为约束与工作流，**禁止复制知识库中的描述性内容**
- 模块能力与实现细节详见对应知识卡片，通过 Qoder 自动检索获取
- 知识库与代码事实可能不一致时，以代码为唯一事实源

### 通用环境（非 Qoder）
如在使用其他 AI 开发工具，可手动参考 `docs/knowledge-guide.md` 中的替代方案说明。

## 质量门禁

- **类型检查**：`pnpm typecheck`（即 `node node_modules/typescript/bin/tsc --noEmit`）必须 exit code 0
- **Lint**：`pnpm lint`（即 `eslint src`）必须 exit code 0，仅启用两条规则：
  - `no-restricted-imports`：锁定 features 模块间直接引用，允许边清单以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源（收紧时只删不加）
  - `@typescript-eslint/no-explicit-any`：禁止 any
  - 注：lint 工具链通过 `.pnpmfile.cjs` 侧载 TS 6 API（typescript-eslint 尚不支持 TS 7.0），不影响 typecheck/build 使用的 TS 7
- **单元测试**：`pnpm test`（即 `vitest run`）必须 exit code 0，部署工作流在构建前强制执行。全局级守卫：i18n 双语键对称（`src/i18n/localeParity.test.ts`）、i18n 静态 key 引用（`src/i18n/staticKeyGuard.test.ts`，兜底 zh/en 双方都缺 key 的盲区）、UI 颜色合规（`src/designTokenGuard.test.ts` 全量扫描 src，禁霓虹调色板类 / 纯黑白类 / 纯黑白 hex）。模块级数据完整性守卫由各 feature 模块自持（课程结构 / 题库 id / 理论结构 / 选项排序分布等），`pnpm test` 全量运行时强制，清单以各模块实际测试文件为准
- **构建验证**：`pnpm build` 成功产出 `dist/`
- **测试后缀速查**（`vitest.config.ts` 双项目划分）：`.test.ts` = unit 项目，Node 环境（纯函数 / store migrate）；`.test.tsx` = component 项目，jsdom 环境（组件冒烟，setup 为 `src/setupTests.components.ts`）。新增测试须按内容选对后缀，Node 环境测 zustand persist migrate 需 stub `window.localStorage`
- **每次代码变更后必须运行 `pnpm verify`**（唯一事实源为 `package.json` 的 `verify` script，当前为 `typecheck && lint && test` 串行短路组合，任一失败即中止；另提供 `verify:parallel` 并行变体，独立捕获 exit code 并支持分级重试）
- **子智能体 tools 字段验证**：修改 `.claude/agents/*.md` 时建议运行 `node scripts/validate-agent-tools.ts` 校验 tools 字段合规性（可选但推荐，非强制门禁）

### Feature PR Checklist（建议补充到 CI 或模板）

提交含 feature 模块变更的 PR 时，开发者应自检以下项目：
- [ ] 对应子智能体文件的 Key Files / Cross-Module Touchpoints / Workflows已同步更新，确保与代码保持镜像一致
- [ ] 新增跨模块引用已在 `eslint.config.js`的 `ALLOWED_CROSS_IMPORTS`中登记，且`pnpm test` 守卫未变红
- [ ] 涉及数据模型/持久化 schema 变更时，persist version 已递增并编写 migrate 函数
- [ ] 涉及模块数量/版本计数/etc 事实性陈述时，文档采用"以代码为准"单源引用策略，而非硬编码数值
- [ ] `pnpm verify`全部通过（typecheck + lint + test）

## 提交粒度

- **逻辑单元独立提交**：每个逻辑单元（单一 feature 变更 / 单一修复 / 单一文档同步）独立成 commit，禁止将多模块批量变更合入单个 commit
- **提交信息注明模块前缀**：采用 `type(scope): description` 格式，scope 为所属模块目录名（如 `feat(strategy-academy): ...`、`fix(range-trainer): ...`、`docs(agents): ...`）
- **仅约束新提交**：本指引不追溯已有提交，禁止为满足粒度要求重写已有 git 历史
- 本节是「Surgical Changes」原则在版本控制层面的延伸：改动范围最小化，提交范围同样最小化

## Agent 协作

### 存放位置与跨工具兼容

- 子代理物理源文件位于 `.claude/agents/`（入库，Claude Code / VSCode 等原生兼容读取）
- `.qoder/agents/` 为 Windows Junction 链接，指向 `.claude/agents/`，Qoder 无感兼容读取
- 重建命令：`scripts/setup-agent-junctions.ps1`（新环境 clone 后执行一次；Junction 本身不入库）
- 新增 / 修改子代理统一在 `.claude/agents/` 下操作，禁止在 Junction 路径内重建文件

### 命名规范

子代理文件位于 `.claude/agents/`，命名遵循以下规则：

1. **格式**：统一使用 kebab-case（小写字母 + 连字符分隔），禁止无连字符缩写（如 `uiux` → `ui-ux`）
2. **Feature 模块代理**：命名为 `<feature-dir>-dev`，必须与 `src/features/<feature-dir>/` 目录名一一对应
3. **跨模块基础代理**：使用描述性 scope 前缀，不带项目名前缀（项目名冗余，所有代理均属于本项目）
4. **文件名 = frontmatter name**：`.md` 文件名必须与 frontmatter 中的 `name` 字段完全一致
5. **后缀约定**：`-dev` 表示开发类代理（含设计守护），后续如新增非开发类代理（如 review、qa）再扩展后缀
6. **模块-代理同步创建**：新建 feature 模块时，同名代理文件须在同一逻辑单元内创建（保持 1:1 绑定，防止"有模块无代理"漂移）
7. **frontmatter 字段顺序**：统一为 `name → description → tools → model → skills → mcpServers → additionalPrompt`

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
| `help-center-dev` | Feature | 帮助中心教程内容 / 帮助页面 UI |

### 子代理共享基线条款（单点事实源）

> 本段为所有 feature / 基础层 agent 文件**唯一共享基线**。各 agent 文件**禁止重述**以下内容，仅引用本段。变更全局规则只需改此处（同时遵循「子代理规范」禁止复制知识库描述性内容原则）。

#### 新增页面/组件标准路径（Workflow 单源）

1. 在 `src/features/<module>/components/` 创建 `PascalCase.tsx`（按模块最小结构约定）
2. 若引入新文案，同时更新 `src/i18n/locales/zh/<module>.json` 与 `en/<module>.json`（双语缺一不可，key 命名 `<module>.<context>.<field>`）
3. 若新增测试，按 `vitest.config.ts` 双项目选后缀（规则见 §质量门禁「测试后缀速查」，禁止在此重述）
4. 运行 `pnpm verify` 确保门禁通过（唯一事实源为 `package.json` 的 `verify` script）
5. 若新增路由页面，由 `platform-dev` 在 `src/app/routes.tsx` 用 `React.lazy()` + `<LazyWrapper>` 注册
6. 若涉及全局视觉 / 共享组件 / 布局 / 导航 / 主题色，由 `ui-ux-dev` 复核（质量清单以 `poker-ui-demo/DESIGN_LANGUAGE.md` 为准）

#### 全局约束（单源）

- TypeScript strict + noUncheckedIndexedAccess，禁止 any；路径别名 `@/*`
- 组件 PascalCase.tsx / Hook use 前缀 / 工具 camelCase / 路由 kebab-case
- 单文件 ≤ 300 行（硬约束；豁免见 docs/AI_GUIDE.md）
- 模块间禁止直接引用；跨模块状态集中 progress store；shared 准入门槛 ≥2 模块
- i18n 双语同步、key 命名规范；UI 四层色彩 token，禁硬编码 / 霓虹
- 每个 store 必须有 name + version；"记录完成" action 幂等
- 五级反馈 `calculateGrade(evLoss)` 唯一评级，禁止自定义
- 调试解锁 9 处门禁；选项排序治理（seededShuffle）
- React 渲染约定（数组不可变 `toSorted` / 条件渲染三元 / Effect 治理 / 组件定义 / 事件监听 passive）见 §编码规范

#### 基线 Quality Checklist

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0（no-restricted-imports + no-explicit-any）
- [ ] `pnpm test` 全量 exit 0（含 i18n 双语对称、designTokenGuard）
- [ ] 新增 key 双语齐备
- [ ] 涉及 persist schema 变更：version 递增 + migrate
- [ ] `pnpm verify` 通过

各 feature agent 文件以一行引用取代上述明细：
`> 全局约束、标准路径与基线 Quality Checklist 见 AGENTS.md §子代理共享基线条款（禁止在此重述）。`

### 跨模块能力归属登记表

> 单一事实源：所有"非本模块独属"的跨模块能力在此登记，避免各 agent 文件口头澄清"这不归我"。新增 / 变更跨模块能力时须同步更新本表。

| 能力 | Owner agent | 消费方 / 说明 |
|---|---|---|
| QuickDrill / composeDailyMix / quickDrillStreak / awardStreakFreeze | `progress-dev` | 状态与逻辑定义于 progress store（quickDrillBest / quickDrillStreak / awardStreakFreeze / recordQuickDrillCompletion / submitQuickDrillResult）与 progress/utils（composeDailyMix）；strategy-academy（QuickDrill 界面）与 puzzle-trainer 为消费方 |
| 五大系统集成（Streak / ELO / SRS / Emotion / Mentor）统一提交入口 | `progress-dev` | 全部 trainer 经 progress store 公开 API 提交训练结果（契约见 progress-dev；禁止各模块自写集成） |
| trainingEvents emit / 订阅 | `progress-dev`（总线实现）+ 各模块自 emit | hand-history、help-center 合理豁免 emit |
| 调试解锁（9 处门禁） | `platform-dev` 协调 | 全局旁路，清单见 AGENTS.md §调试解锁 |
| 位置渐进解锁阈值 | `range-trainer-dev` | 阈值常量以 range-trainer/constants.ts 为准 |
| GRADE_THRESHOLDS 源 | `shared/types/decisionFeedback.ts` | hand-history/workers/gtoWorker.ts 为 worker 隔离拷贝，须 parity 测试守护（见 §质量门禁） |
| 每日计划生成（双源已消歧） | `strategy-academy-dev` 持 `generateDailyPlan`（academy 内部）/ `progress-dev` 持 `generateCrossModuleDailyPlan`（跨模块日训） | 两者命名已区分，禁止混用 |

### 工具权限分配

- **feature-dev 标准工具集（10 项）**：`Read / Glob / Grep / LSP / GetProblems / SearchReplace / Write / DeleteFile / Bash / GetTerminalOutput`
- **只读复核型代理收窄**：移除 `DeleteFile`（先例：ui-ux-dev、help-center-dev），删除文件需求转交 `platform-dev` 协调
- **声明规则**：`tools` 字段必须显式声明最小工具集，禁止通配符与省略声明（等同继承全部工具）；文件名必须与 frontmatter `name` 字段一致；实际工具清单以各 agent 文件为事实源（当前收窄清单：ui-ux-dev / help-center-dev 各 9 项）

### 边界约束

- 子代理只能修改本模块文件；触碰 `shared/` 层须遵循各自代理文件 Authority 声明（默认经 `platform-dev` 协调）
- 跨模块变更必须通过 `platform-dev` 协调
- 子代理文件的 `## Constraints` 章节不得与本 AGENTS.md 冲突

### 跨模块变更协作流程

1. 在 `platform-dev` 评估影响范围
2. 更新 `docs/TDD.md` 的架构图与跨模块系统章节
3. 升级 progress store persist version + 编写 migrate（如涉及状态变更）
4. 通知受影响 feature 模块的子代理更新其文件
5. 涉及全局样式/共享组件/布局/导航/主题色变更时，通知 `ui-ux-dev` 做视觉一致性复核（质量清单以 `poker-ui-demo/DESIGN_LANGUAGE.md` 当前版本为准）
6. 更新 `docs/CHANGELOG.md`
7. 运行 `pnpm verify` 验证

## 行为准则

继承自 `claude.md`：

- **Think Before Coding**：不做沉默假设，不确定先问
- **Simplicity First**：最少代码解决问题，不写投机性代码，不为单次使用做抽象
- **Surgical Changes**：只碰必须碰的，不"顺便改进"无关代码，遵循已有风格
- **Goal-Driven Execution**：定义成功标准，循环验证

检验标准：每一行改动都应能直接追溯到用户的需求。
