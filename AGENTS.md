# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

> 项目级 AI 代理指导文件。本文件在会话开始时自动加载，约束所有 AI 代理在本仓库内的行为。
> 执行层由全栈开发组插件代理承担（派单 / 会诊 / 实现下沉，见 §Agent 协作），项目内职责只以**文件所有权**表达；详细产品规格见 `docs/PRD.md`，技术设计见 `docs/TDD.md`，版本演进见 `docs/CHANGELOG.md`。深度知识库见 `.qoder/repowiki/`（本机自动生成、不入库；详见下文「知识库（repowiki）」章节）。

---

## 项目概述

德州扑克训练平台（Poker Training Platform）——纯前端、零后端依赖的德州扑克系统性训练工具。通过交互式练习、即时反馈与数据可视化，帮助各层级扑克玩家提升决策能力。PWA 支持，离线可用，中英双语。

## 任务导航（先读什么 / 归谁所有）

> 任务路由见本表；模块 owner / 入口 / store / i18n / 允许跨模块引用的机器事实见 [`docs/agents/MODULE_MAP.md`](docs/agents/MODULE_MAP.md)（由 `pnpm agents:map` 从代码生成，不要手改）。所有权规则见 §Agent 协作。

| 任务 | 先读 | 文件所有权 / 模块 |
|---|---|---|
| UI / 视觉 / 响应式 | `DESIGN.md` + `src/guards/README.md` | `src/shared/components/**`、`src/layouts/**`、`src/styles/**` |
| 新模块 / 路由 / 跨模块协调 | 本文 §代码组织 + 本文 §操作指南「新增模块」 + `src/app/routes.tsx` | `src/app/**`、`eslint.config.js`、`src/shared/**`、`docs/agents/MODULE_MAP.md` |
| store / persist / 五大系统 | `docs/TDD.md` §16「状态管理」 + `src/features/progress/AGENTS.md` | `src/features/progress/**` |
| i18n key / 双语同步 | `docs/TDD.md` §16「国际化」 + `src/i18n/moduleRegistry.ts` | `src/i18n/**` + 各模块 `locales/` |
| 守卫 / 质量门禁 / 新增守卫 | `src/guards/README.md` + 本文 §操作指南「新增守卫」 + 本文 §质量门禁 | `src/guards/**`、`scripts/**`、`vitest.config.ts` |
| 测试 / 新增或修改测试 | `docs/TDD.md` §18「测试体系」 + 本文 §操作指南「新增或修改测试」 | 被测模块 + `e2e/**`；基础设施 `vitest.config.ts` |
| 架构决策 | [`docs/DECISIONS.md`](docs/DECISIONS.md) | `docs/**`、`README.md`、`AGENTS.md` |
| 文档全貌与阅读顺序 | [`docs/README.md`](docs/README.md) | `docs/**`、`README.md`、`AGENTS.md` |

## 环境与命令

- **环境**：Windows + PowerShell 7.x（禁止 bash/sh/zsh）；Node 以 `.nvmrc` 为准；pnpm 版本以 `package.json` 的 `packageManager` 为准，禁止 npm/yarn。
- **路径 / 变量**：路径用 `\`，环境变量 `$env:VAR`，命令串联用 `;` 或 `&&`。

```powershell
pnpm dev / build / preview
pnpm typecheck / lint / test / test:unit / test:component / test:guards / test:watch / test:coverage
pnpm verify / verify:parallel
pnpm size:check / repo:check / docs:check
pnpm typecheck:e2e / test:e2e / verify:e2e
pnpm agents:map / agents:map:check
```

> `pnpm tsc` 可能因 `devEngines` 校验失败；`typecheck` 已直接调用 `node node_modules/typescript/bin/tsc`。单测过滤：`pnpm test src/path/file.test.ts`；项目过滤：`pnpm test --project unit|component`。

## 技术栈

React 19 + Vite 8 + TypeScript 7（strict）+ Tailwind CSS 4 + shadcn/ui + Zustand 5（persist）+ React Router 7（lazy）+ i18next 26 + Recharts 3 + framer-motion 12 + IndexedDB。禁止新增依赖除非确有必要，并评估 bundle 体积。

## 代码组织

```text
src/
├─ app/routes.tsx        # lazyPage：页面 + i18n 并行加载
├─ layouts/              # AppLayout / BlankLayout / MobileNav
├─ features/             # 10 个自包含模块（components / hooks / utils / data / store.ts / types.ts / index.ts）
├─ shared/               # ≥2 模块使用
│                        #   components/{ui,poker,quiz,feedback,academy,data-display,system,layout}
│                        #   constants / data / hooks / stores / types / utils
├─ i18n/ guards/ styles/ fonts/ test-utils/
└─ main.tsx / App.tsx
```

- 每个 feature 至少包含 `components/`、`store.ts`、`types.ts`、`index.ts`；`hooks/`、`utils/`、`data/` 按需。纯静态模块可豁免 `store.ts`，须在模块 `AGENTS.md` 或 `index.ts` 头注释声明。
- 模块清单以 `src/features/` 实际目录为准；新增模块见 §操作指南「新增模块」。
- shared 各语义域的职责、关键文件与导入规则见 [`src/shared/AGENTS.md`](src/shared/AGENTS.md)。

### 关键约束

- **模块间禁止直接引用**：只允许 `shared/`、`progress` 公开 API 或 `trainingEvents`；允许边以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源（收紧只删不加）。
- **shared/ 准入**：被 ≥2 个模块使用才可放入；单消费者代码留在模块内。由 `src/shared/admission-guard.test.ts`（import 图 + 传递闭包）硬校验，规则见 §质量门禁「shared 准入」。
- **跨模块状态集中 progress**：Streak / ELO / SRS / Emotion / Mentor 五大系统与 QuickDrill 状态（`quickDrillBest` / `quickDrillStreak`）统一在 `src/features/progress/store.ts`，禁止分散。
- **文件语义归属**：新文件直接放入语义归属模块；已分裂时以唯一消费方为归属方，并同步模块 `AGENTS.md` 与 §跨模块能力归属登记表。

## 工程约束（摘要）

| 主题 | 硬约束 | 详情 |
|---|---|---|
| 编码 / React | TS strict + no any；数组不可变（`toSorted` 等）；条件渲染用三元；禁止 Effect 回写派生值；禁止组件内定义组件；监听器 cleanup + passive | `docs/TDD.md` §16「编码规范」 |
| 状态 | zustand persist；禁止裸调 localStorage；每个 store 有 name + version；记录完成 action 幂等 | `docs/TDD.md` §16「状态管理」 |
| i18n | zh/en 缺一不可；key 命名 `<module>.<context>.<field>`；课程内容双轨、复习状态存 key | `docs/TDD.md` §16「国际化」 |
| UI/UX | 四层色彩 token；暗色默认；WCAG 2.1 AA；反霓虹；设计契约以 `DESIGN.md` 为准 | `DESIGN.md` + `docs/TDD.md` §16「UI/UX 设计系统」 |
| 文件大小 | **课程内容数据文件不做行数限制**（策略 lessons/variants、localLessons、basicsContent；理论 levels/variants 的 Level / chapters / quizBank / blocks / 章节推荐）；**共享组件 `src/shared/components/**` 不做行数限制**；其余逻辑 / UI / 常量文件 ≤300 行、>400 行失败；非课程超大文件逐文件 allowlist 只减不增；CSS ≤800 行 | `src/guards/line-count-guard.test.ts` |

## 路由、构建与离线

- 页面必须 `React.lazy()` + `<LazyWrapper>`；`lazyPage` 用 `Promise.all([loader(), preloadI18n(keys)])` 并行加载页面与 i18n。
- 布局：`AppLayout`（主导航 + OnboardingGate）/ `BlankLayout`（无导航）；<768px 显示 `MobileNav`。
- 分包规则以 `vite.config.ts` 的 `manualChunks` 为准；Service Worker 以 `public/sw.js` 模板 + 构建期注入的全量预缓存清单与 hash 为准（`scripts/sw-precache-plugin.ts`，决策记录见 [`docs/DECISIONS.md`](docs/DECISIONS.md) 的 ADR-0004）；路由 `basename` 使用 `import.meta.env.BASE_URL`。
- **版本信息**：`vite.config.ts` 以 `define` 注入 `__APP_BUILD_INFO__` —— `package.json` 语义版本 + 部署序号（CI `GITHUB_RUN_NUMBER`，每次部署 patch +1，不回写仓库）+ 构建时刻；侧边栏展示版本与更新时间，禁止在组件内硬编码版本号。

## 跨模块复用契约（摘要）

| 契约 | 单一事实源 | 关键要求 |
|---|---|---|
| 五级反馈 | `shared/types/decisionFeedback.ts` | `calculateGrade` 唯一评级；EV 未标定不得渲染徽章 |
| 反馈闭环 | progress + 各 trainer | 反馈携带 `relatedLessonId`；`shouldDownshiftDifficulty()` 唯一入口 |
| 位置解锁 | `range-trainer/constants.ts` | `isPositionUnlocked`；阈值不在文档复制 |
| 选项排序 | `shared/utils/optionOrder.ts`（策略编排）+ `shared/utils/seededShuffle.ts`（随机与数值判定底座） | 各模块只留薄包装出口，禁止另写排序 / 洗牌；重映射正确答案；每日谜题顺序稳定 |
| 结果页装配 | `shared/components/feedback/ResultSlip.tsx` / `ResultHeader.tsx` / `ResultActions.tsx` | 结果纸条统一壳层（overlay / page）+ 标题默认 h2（壳层持有唯一 h1）+ 动作组唯一实现；材质外壳留在模块 |
| 返回入口 | `shared/components/layout/BackLink.tsx` + `shared/utils/courseBack.ts` | BackLink：`to` / `historyBack` 与文本·胶囊·按钮三变体；icon-only 必填 `aria-label`；触摸目标 ≥44px。课程区**来源感知返回**：`hubFrom` / `theoryMapFrom` / `academyMapFrom` 携带 `courseFrom` state，`resolveCourseBack` 唯一解析返回目标（主线 `/lesson[#hub-stage-N]` / `/theory` / `/academy`，深链兜底 `/lesson`），模块内禁止另写来源判定（规则 R1–R10 见 `docs/TDD.md` §17） |
| 导师人格化 | `shared/constants/mentorStyles.ts` | `renderMentorFeedback`；缺省降级 i18n |
| 事件总线 | `shared/stores/trainingEvents.ts` | 训练后 emit；hand-history / help-center 豁免 |
| progress 公共入口 | `features/progress/index.ts` + `api.ts` / `api.types.ts` / `ui.ts` | 跨模块只经公共入口：业务读写走 `api`（`useProgressState` / `progressCommands`，弱项快照 `getLearningWeakness`）、展示走 `ui`、学院只读快照走 `useAcademyLearningStages` / `useAcademyProgressSnapshot`；禁止深引 `store` / `components/*` / `utils/*` / `types` / `data/*`（守卫 `src/guards/progressPublicApi.guard.test.ts`）。装配例外仅 `src/main.tsx` 的 `store.bootstrap` 与 `src/app/routes.tsx` 的页面 lazy import |
| 课程阶段/双泳道 | `shared/types/academyDataSource.ts` + `shared/types/theoryDataSource.ts` + `shared/utils/academyJourneyGroups.ts` | `AcademyLearningStage.theoryChapterIds` 由 strategy 生成；理论只读 `getLearningSnapshot` / `getChapterCatalog` 经现有 registry；`/lesson` 课程枢纽只做投影 + 单一变体切换命令（`TheoryDataSource.getActiveVariant` / `switchVariant`），不新增 store/registry、不改 persist。地图角色：`/academy`=实战地图、`/theory`=理论地图（`nav.academy` / `nav.theory` 单源文案），地图根只回课程主线，规则见 `docs/TDD.md` §17 |
| 掌握度/SRS 派生 | `strategy-academy/utils/academyMastery.ts`（枢纽掌握度，策略与理论投影共用）+ `shared/utils/academySrs.ts` | 首次成绩 `resolveFirstScore` 口径与理论复习判定 `isTheoryReviewItem`；禁止模块内另写第二套阈值/判定 |
| 理论数据源 | `shared/stores/theoryDataSourceRegistry.ts` | theory bootstrap 注册；progress 每日计划消费；禁止 progress import theory。可选 `getActiveVariant` / `switchVariant` 承接课程变体上下文，未实现时消费方降级 |
| 学习段快照 | `shared/types/academyDataSource.ts` + strategy-academy `store.bootstrap.ts` | `getLearningStagesSnapshot()` 按 `activeVariant` 缓存稳定引用（Level 序列 / 先修 / lessonIds）；progress 只经 `useAcademyLearningStages` 消费，禁止 import 学院 |
| 学院共享组件/纯函数 | `shared/components/academy/*`、`shared/utils/academy*` | 理论/策略各自薄包装消费；shared 禁止 import feature；两院行为/文案由包装层保持。阅读页双栏骨架同源：`AcademyReadingPlane`（主阅读列 768 + xl 学习导轨，导轨内容/文案由两院注入）。P2 学习工具同源：`AcademyBookmarksPanel` / `AcademyNotesPanel`（课时书签 / 纯文本笔记）与 `ContentIssueReportDialog`（内容纠错，mailto / 剪贴板降级，无后端）。变体规则卡同源：`AcademyVariantRuleCard`（理论 `TheoryVariantRuleCard` / 策略 `StrategyVariantRuleCard` 各做薄包装），单挑规则事实以 `shared/constants/headsUpRules.ts` 为单源。题库合并/抽题同源：`mergeQuizBank` / `drawByAttempt`，标准与单挑题库共用，禁止模块内另写合并/抽题逻辑。课程阅读页同源（2026-11）：`FormulaDerivation`（+ `formulaParse` 纯函数，公式推导编号步骤单源，单/双行简单公式保持 legacy DOM）/ `AcademyTakeawayCard`（+ `utils/academyTakeaway`，章末要点卡显式与自动装配共用）/ `AcademyPeek`（quiz 原文 peek 折叠壳，label/children 由消费者注入）/ `AcademyStickyCta`（移动 sticky CTA 单节点响应式容器，包装 ui/Button）；消费者均为 strategy-academy + theory-academy |
| 共享交互基础件 | `shared/components/ui/{button,input,textarea,progress}.tsx` + `ui/focusRing.ts` + `layout/SectionLabel.tsx` | shared 组件必须 dogfood：禁止手写 `<button>/<input>/<textarea>/<select>`（特化 allowlist 见 `src/guards/sharedPrimitiveUsage.guard.test.ts`）；focus ring / section label 单源；Button default/secondary 保持金属族，quiet/link 为结构变体。V1 已完成：`.btn-*` 入 `@layer components`、ghost/outline/destructive 收口、平铺主 CTA 收敛到 Button default |
| 调试解锁 | `shared/stores/debugMode.ts` | 9 处门禁；两种短路接法；onboarding 不纳入 |

> 完整契约（含各模块推导函数、阈值、9 处门禁清单与选项排序规则）见 `docs/TDD.md` §16「跨模块复用契约」。

- **策略学院 persist v8 清理（迁移记录，当前版本数值以 `store.ts` 为准）**：`abilityAssessment`、`firstAttemptScores` / `lastAttemptScores` 镜像与 legacy `attemptCertification` 已删除；`lessonAttempts` 为课后尝试唯一事实源，认证只走 `submitCertificationAttempt`，进步回放经 `AcademyDataSource.getLessonAttemptsSnapshot()` 读快照。

## 文档维护（状态与职责）

| 类型 | 文件 | 状态 |
|---|---|---|
| Current | `docs/README.md`、`README.md`、AGENTS、PRD、TDD、DESIGN、DECISIONS | 唯一事实源，随代码同步 |
| Generated | `docs/agents/MODULE_MAP.md` | `pnpm agents:map` 生成，勿手改 |
| Historical | `docs/CHANGELOG.md` | 只追溯，不作事实源；更早记录见 git 历史 |

- 默认只读 **Current**；一次性报告 / 计划不入库，完成后归档到本地 `.archive/` 或从 git 历史追溯，Current 文档不保留执行历史。
- 代码事实（模块数 / 版本号 / 测试数）不在文档硬编码；PRD 不含实现细节，TDD 不含执行历史。
- 每份文档在文件头声明状态与 `最后复核：YYYY-MM-DD`；Current 文档复核日期不得早于该文件最后一次提交。
- `pnpm docs:check` 校验本地链接、内联代码中的仓库路径、标题锚点、`pnpm` 脚本、索引覆盖、状态声明与新鲜度；历史记录的断链与路径只告警。`verify` 已包含。

## 知识库（repowiki）

- 位置与更新：`.qoder/repowiki/` 是 Qoder 自动生成的**本机知识缓存**，`.qoder/` 已忽略、**不入库**；`/knowledge` 更新，`/knowledge-plan` 配置预生成；开发时自动注入相关卡片。
- **知识库不是事实源**：与代码或 Current 文档冲突时以代码为准；不可用时直接读 `src/features/<module>/`。
- 模块 `AGENTS.md` 与文档禁止复制知识库描述性内容；模块事实以 `MODULE_MAP.md` + 代码为准。
- 使用：`/knowledge` 增量更新、`/knowledge-plan` 配置预生成、`/init` 首次生成；非 Qoder 环境按「本文件 → `docs/README.md` → 模块代码」顺序工作，本地笔记不入库、不作事实源。

## 质量门禁

- **唯一出口**：`pnpm verify` = `typecheck && lint && repo:check && docs:check && agents:map:check && test`；任一失败即中止；构建 `pnpm build`，体积 `pnpm size:check`。
- **typecheck / lint / test**：`tsc --noEmit`、`eslint src`（模块隔离 + 禁 any）、`vitest run` 必须 exit 0。
- **shared 准入**：`src/shared/admission-guard.test.ts`（分析器 `src/test-utils/admissionGraph.ts`）按 import 图 + 传递闭包判定 —— 0 生产消费者直接失败；1 生产消费者失败，仅 baseline 条目可临时存在（baseline 当前为空，只降不升且双向校验）；`components/ui/**` 豁免 ≥2 但仍禁 0 消费；`utils/localStorageStub` / `utils/persistShape` 按测试消费者计数豁免。
- **全局守卫**：i18n 双语对称、静态 key、颜色 token、CSS 颜色、行数棘轮、测试体系自检、文档检查、progress 公共入口（禁深引）；清单见 `src/guards/README.md`。
- **测试后缀**：`.test.ts` = unit（Node）；`.test.tsx` = component（jsdom）；禁止 `.spec.ts(x)` 与 `__tests__/`。persist store 必须有 `store.persist-shape.test.ts`（version > 1 还须 `store.migrate.test.ts`）。
- **仓库 / 地图 / 文档**：`repo:check`、`agents:map:check`、`docs:check` 已接入 verify、CI 与 pre-commit。`docs:check` 额外校验内联路径、锚点、`pnpm` 脚本、孤儿文档与文件头新鲜度；历史记录只告警。
- **E2E（Playwright）**：`pnpm typecheck:e2e`（`tsconfig.e2e.json`）→ `pnpm test:e2e`（`node e2e/require-build.mjs` 校验产物后跑根 `e2e/**/*.test.ts`）；用例只走真实 UI，禁止 `.only` / `.skip` / `.fixme` 与重试变绿（`src/guards/testSystem.guard.test.ts` 双向校验）。
- **浏览器发布门禁**：`pnpm verify:e2e` = `verify && build && size:check && test:e2e` —— 触及路由 / 布局 / 持久化 / 离线的变更必须在真实浏览器跑通该链后才可发布；仅 `pnpm verify` 不足以证明浏览器行为。
- **Feature PR Checklist**：同步所有权与插件技能（模块 `AGENTS.md` / 本文 §Agent 协作）；行为变更补测试（缺陷附回归锁）；课程/题库变更同批过内容守卫；UI/路由改浏览器验证；新增守卫登记 README；新增跨模块边登记白名单；persist schema 变更 version + migrate；`pnpm verify` 全绿。

## 提交粒度

- **逻辑单元独立提交**：每个逻辑单元（单一 feature 变更 / 单一修复 / 单一文档同步）独立成 commit，禁止多模块批量混装。
- **提交信息**：`type(scope): description`，scope 为模块目录名（如 `feat(strategy-academy): ...`、`docs(agents): ...`）。
- **范围**：仅约束新提交，不追溯历史；Surgical Changes 同样适用于提交范围。

## Agent 协作（全栈开发组插件代理 + 文件所有权）

> 项目不维护自带子代理文件。执行层由**全栈开发组插件代理**按技能派单：`fullstack-dev-group:delivery-team` 负责派单 / 会诊，`fullstack-dev-group:team-p8-full-stack` 承担编码与测试下沉，`fullstack-dev-group:design-diagrams` / `drawio` 出图，`fullstack-dev-group:qa-quality` / `test-case` 管质量与用例，`fullstack-dev-group:devops-pipeline` 管发布。项目内职责只以文件所有权表达，规则如下。

### 文件所有权（事实源）

- **模块树即所有权**：`src/features/<module>/**` 归该模块；`src/shared/**` 为跨模块层；`src/app/`、`src/layouts/`、`src/i18n/`、`src/guards/`、`src/styles/`、`scripts/` 为平台层；`docs/**`、`README.md` 为文档层。机器事实（入口 / store / i18n / 允许跨模块引用）见 [`docs/agents/MODULE_MAP.md`](docs/agents/MODULE_MAP.md)。
- **单一写者**：同一文件同一时间只允许一个执行者修改；跨模块变更先定接口契约与唯一写者，再并行。
- **shared/ 准入**：被 ≥2 个模块使用才可放入；触碰 `src/shared/**` 须由平台视角复核，feature 侧不得自行扩大写域。
- **禁止越界**：模块间禁止直接引用（只允许 `shared/`、`progress` 公开 API 或 `trainingEvents`）；允许边以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源。
- **就近约束**：模块级红线写在 `src/features/<module>/AGENTS.md` 或 `src/shared/AGENTS.md`，不得与本文冲突。

### 新增页面/组件标准路径（Workflow 单源）

1. 在 `src/features/<module>/components/` 创建 `PascalCase.tsx`（按模块最小结构约定）
2. 若引入新文案，同时更新 `src/i18n/locales/zh/<module>.json` 与 `en/<module>.json`（双语缺一不可，key 命名 `<module>.<context>.<field>`）
3. 若新增测试，按 `vitest.config.ts` 双项目选后缀（规则见 §质量门禁「测试后缀速查」，禁止在此重述）
4. 运行 `pnpm verify` 确保门禁通过（唯一事实源为 `package.json` 的 `verify` script）
5. 若新增路由页面，在 `src/app/routes.tsx` 用 `React.lazy()` + `<LazyWrapper>` 注册（平台层文件）
6. 若涉及全局视觉 / 共享组件 / 布局 / 导航 / 主题色，由 `src/shared/components/**` 与 `src/layouts/**` 所有者复核（质量清单以 `DESIGN.md` 为准）

### 操作指南（How-to）

> 原 how-to 指南已合并到本节；详细规则见 §质量门禁、`src/guards/README.md` 与 `docs/TDD.md` §18。

#### 新增模块

1. 建 `src/features/<module>/`：至少 `components/`、`store.ts`、`types.ts`、`index.ts`；纯静态模块可豁免 store 并在模块 `AGENTS.md` 或 `index.ts` 头注释声明。
2. 实现只改本模块；跨模块走 `shared/`、progress 公开 API 或 `trainingEvents`；新增 shared 须满足 ≥2 模块消费。
3. i18n：同步 `src/i18n/moduleRegistry.ts` 的 `I18nModuleKey` / `ALL_MODULES` / `FEATURE_GROUPS`；新增 zh/en locale；仅首屏必需才加入 `CORE_MODULES`。
4. 路由：在 `src/app/routes.tsx` 用 `React.lazy()` + `<LazyWrapper>` 注册；平台层文件先确认唯一写者。
5. 测试：按下方「新增或修改测试」执行；persist store 必须有 `store.persist-shape.test.ts`（version > 1 还需 `store.migrate.test.ts`）。
6. 机器地图：运行 `pnpm agents:map` 并提交 `docs/agents/MODULE_MAP.md`。
7. 变更记录：`docs/CHANGELOG.md`；难以回退的架构决策写入 `docs/DECISIONS.md`。

验收：`pnpm agents:map` + `pnpm verify`；模块最小结构、双语、懒加载与地图同步全绿。

#### 新增守卫

1. 判定归属：跨模块 / 全仓契约 → `src/guards/<name>.guard.test.ts`；单模块 → 模块内；i18n 资源 → `src/i18n/`。
2. 断言必须带 `file:line` 或具体条目；必须自检扫描面（文件数 / 条目数下限），防止路径失效时空跑通过。
3. 在 `src/guards/README.md` 登记；`testSystem.guard.test.ts` 双向校验文件与清单。
4. 白名单 / 棘轮只减不加；豁免先在设计文档登记依据；禁止 skip、放宽断言或静默 catch。
5. 运行 `pnpm test src/guards/<name>.guard.test.ts`、`pnpm test:guards`、`pnpm verify`。

#### 新增或修改测试

1. 选后缀：`.test.ts` = unit（Node）；`.test.tsx` = component（jsdom）；禁止 `.spec.ts(x)` 与 `__tests__/`。
2. 按变更类型补：纯函数边界、store 形状 / 迁移、组件正常 / 空 / 错、IndexedDB、守卫；缺陷先写复现用例（修复前失败）。
3. 确定性：假时钟、固定种子、stub 存储；禁止真实网络与真实 sleep。
4. E2E：真实生产构建、真实 UI、零噪声；禁止 `.only` / `.skip` / 重试变绿；先 `pnpm typecheck:e2e` 再 `pnpm test:e2e`。
5. 完整分层、执行矩阵与责任见 `docs/TDD.md` §18；提交前 `pnpm verify`。

### 跨模块能力归属登记表

> 单一事实源：所有"非本模块独属"的跨模块能力在此登记，以持有文件表达归属；新增 / 变更跨模块能力时须同步更新本表。

| 能力 | 持有文件 / 模块 | 消费方 / 说明 |
|---|---|---|
| QuickDrill / composeDailyMix / quickDrillStreak / awardStreakFreeze | `src/features/progress/store.ts` + `src/features/progress/utils/`（composeDailyMix） | 状态与逻辑定义于 progress store（quickDrillBest / quickDrillStreak / awardStreakFreeze / recordQuickDrillCompletion / submitQuickDrillResult）；strategy-academy（QuickDrill 界面）与 puzzle-trainer 为消费方 |
| 训练弱项回流 | `src/features/progress/utils/learningWeakness.ts`（经 progress 公共入口导出） | puzzle-trainer 在训练明细写 `topic` / `relatedLessonId`；progress 派生近 30 天弱项课程；strategy-academy QuickDrill 优先抽题。谜题不直接写 ELO / SRS |
| 五大系统集成（Streak / ELO / SRS / Emotion / Mentor）统一提交入口 | `src/features/progress/**`（经 `index.ts` / `api.ts` 公共入口） | 全部 trainer 经 progress 公开 API 提交训练结果（禁止各模块自写集成） |
| trainingEvents emit / 订阅 | `src/shared/stores/trainingEvents.ts`（总线实现）+ 各模块自 emit | hand-history、help-center 合理豁免 emit |
| 调试解锁（9 处门禁） | `src/shared/stores/debugMode.ts` | 全局旁路，清单见 `docs/TDD.md` §16「调试解锁」 |
| 阈值 / 评级源 | `src/features/range-trainer/constants.ts` / `src/shared/types/decisionFeedback.ts` | 位置解锁以 constants.ts；GRADE_THRESHOLDS 以 decisionFeedback.ts；worker 拷贝须 parity |
| 每日计划生成（双源已消歧） | `src/features/strategy-academy/**` 持 `generateDailyPlan`（academy 内部）/ `src/features/progress/**` 持 `generateCrossModuleDailyPlan`（跨模块日训） | 两者命名已区分，禁止混用 |
| 理论数据源 registry | `src/shared/stores/theoryDataSourceRegistry.ts`（注册）+ `src/features/progress/**`（消费） | 每日计划/下一章；theory bootstrap 注册，progress 只消费接口，不 import theory |
| 课程变体上下文 | `src/shared/types/theoryDataSource.ts`（契约 `getActiveVariant` / `switchVariant`）+ `src/features/strategy-academy/**`（CourseHub canonical 切换入口） | theory bootstrap 注册实现（读理论 `activeVariant`、经理论既有 action 切换）；枢纽为唯一切换命令发出方，地图与执行页只读当前变体；未实现可选方法时消费方降级为只读展示，不新增 store / 不改 persist |
| 变体规则卡（单挑） | `src/shared/types/variantRules.ts` / `constants/headsUpRules.ts` / `utils/academyVariantRules.ts` / `components/academy/AcademyVariantRuleCard.tsx` | 消费方 theory-academy / strategy-academy 各做薄包装（变体判定 + `variant.headsUpRules.*` 字面量 key 翻译）；shared 不读 store、不拼路由 |
| 课程区来源感知返回 | `src/shared/utils/courseBack.ts`（平台层持有）+ `src/layouts/navSections.ts` / `AppLayout.tsx` / `MobileNav.tsx`（课程激活 / 展宽） | 消费方 strategy-academy（CourseView / 阶段卡）与 theory-academy（TheoryChapterView / 章节导轨）；`courseFrom` state 与 `resolveCourseBack` 是唯一来源判定，模块内禁止另写返回推断；返回控件仍走 `shared/components/layout/BackLink` |

### 边界与协作流程

- **按技能派单**：架构、排期、评审与跨模块裁决走组长视角；编码 / 单测下沉 `team-p8-full-stack`；图、质量、用例、发布各走对应插件技能。技能只提供执行能力，不改变本仓库的文件所有权。
- **先读再改**：检查工作区已有改动，读根约束、模块就近 `AGENTS.md` 与任务入口；知识卡只作导航，冲突时以代码和 Current 文档为准。
- **明确写域**：给出目标、独占文件、禁止改动区、依赖与验收命令，并说明是只读审查还是实施；执行方可凭证据驳回错误前提。
- **单一写者 / 先契约后并行**：模块源码与该模块双语文案由该模块所有者修改；共享组件、共同 locale、registry、配置与生成物须先指定唯一写者；跨模块变更先定接口契约，各方按互斥文件执行。
- **越界处理**：需要修改所有权之外的文件时，先报告目标文件、原因与影响面，确认唯一写者后再改，不自行扩大写域。
- **分层验证**：执行方跑本批次定向检查；全部写者结束后统一复核实际 diff、同步文档 / 生成物并跑 `pnpm verify`；UI 与浏览器发布门禁按 §质量门禁执行，不能用单测代替。
- **跨模块变更**：评估影响 → 更新 TDD → 升级 persist version + migrate（如涉及）→ 通知受影响模块所有者 → 视觉复核（如涉及）→ 更新 CHANGELOG → `pnpm verify`。
- **交付口径**：返回「改动文件与结果 / 验证命令及退出码 / 未测与阻塞」三段简报，不粘全文；超时不等于通过，中断先核对已落盘修改。默认不 commit / push，破坏性动作按授权处理。

## 行为准则

以下为当前生效摘要（原全文已删除，可从 git 历史追溯）：

- **Think Before Coding**：不做沉默假设，不确定先问
- **Simplicity First**：最少代码解决问题，不写投机性代码，不为单次使用做抽象
- **Surgical Changes**：只碰必须碰的，不"顺便改进"无关代码，遵循已有风格
- **Goal-Driven Execution**：定义成功标准，循环验证

检验标准：每一行改动都应能直接追溯到用户的需求。
