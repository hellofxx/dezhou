# AGENTS.md

This file provides guidance to Qoder (qoder.com) when working with code in this repository.

> 项目级 AI 代理指导文件。本文件在会话开始时自动加载，约束所有 AI 代理在本仓库内的行为。
> 子代理配置位于 `.claude/agents/`（物理源文件，入库；`.qoder/agents/` 为 Junction 链接指向该目录，Qoder 兼容读取），详细产品规格见 `docs/PRD.md`，技术设计见 `docs/TDD.md`，版本演进见 `docs/CHANGELOG.md`。深度知识库见 `.qoder/repowiki/`（本机自动生成、不入库；详见下文「知识库（repowiki）」章节）。

---

## 项目概述

德州扑克训练平台（Poker Training Platform）——纯前端、零后端依赖的德州扑克系统性训练工具。通过交互式练习、即时反馈与数据可视化，帮助各层级扑克玩家提升决策能力。PWA 支持，离线可用，中英双语。

## 任务导航（先读什么 / 找哪个代理）

> 任务路由见本表；模块 owner / 入口 / store / i18n / 允许跨模块引用的机器事实见 [`docs/agents/MODULE_MAP.md`](docs/agents/MODULE_MAP.md)（由 `pnpm agents:map` 从代码生成，不要手改）。

| 任务 | 先读 | 负责代理 |
|---|---|---|
| UI / 视觉 / 响应式 | `DESIGN.md` + `src/guards/README.md` | `ui-ux-dev` |
| 新模块 / 路由 / 跨模块协调 | 本文 §代码组织 + [`add-a-feature-module.md`](docs/how-to/add-a-feature-module.md) + `src/app/routes.tsx` | `platform-dev` |
| store / persist / 五大系统 | `docs/AI_GUIDE.md` §状态管理 + `src/features/progress/AGENTS.md` | `progress-dev` |
| i18n key / 双语同步 | `docs/AI_GUIDE.md` §国际化 + `src/i18n/moduleRegistry.ts` | 对应 feature dev |
| 守卫 / 质量门禁 / 新增守卫 | `src/guards/README.md` + [`add-a-guard.md`](docs/how-to/add-a-guard.md) + 本文 §质量门禁 | `platform-dev` |
| 测试 / 新增或修改测试 | [`docs/testing/README.md`](docs/testing/README.md) + [`add-or-update-tests.md`](docs/how-to/add-or-update-tests.md) | 对应 feature dev；基础设施 `platform-dev` |
| 文档全貌与阅读顺序 | [`docs/README.md`](docs/README.md) | `platform-dev` |

## 环境与命令

- **环境**：Windows + PowerShell 7.x（禁止 bash/sh/zsh）；Node 以 `.nvmrc` 为准；pnpm 版本以 `package.json` 的 `packageManager` 为准，禁止 npm/yarn。
- **路径 / 变量**：路径用 `\`，环境变量 `$env:VAR`，命令串联用 `;` 或 `&&`。

```powershell
pnpm dev / build / preview
pnpm typecheck / lint / test / test:unit / test:component / test:guards / test:watch / test:coverage
pnpm verify / verify:parallel
pnpm size:check / repo:check / docs:check
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
├─ shared/               # ≥2 模块使用：components / constants / data / hooks / stores / types / utils
├─ i18n/ guards/ styles/ fonts/ test-utils/
└─ main.tsx / App.tsx
```

- 每个 feature 至少包含 `components/`、`store.ts`、`types.ts`、`index.ts`；`hooks/`、`utils/`、`data/` 按需。纯静态模块可豁免 `store.ts`，须在代理文件声明。
- 模块清单以 `src/features/` 实际目录为准；新增模块见 [`docs/how-to/add-a-feature-module.md`](docs/how-to/add-a-feature-module.md)。

### 关键约束

- **模块间禁止直接引用**：只允许 `shared/`、`progress` 公开 API 或 `trainingEvents`；允许边以 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 为唯一事实源（收紧只删不加）。
- **shared/ 准入**：被 ≥2 个模块使用才可放入；单消费者代码留在模块内。
- **跨模块状态集中 progress**：Streak / ELO / SRS / Emotion / Mentor 五大系统与 QuickDrill 状态（`quickDrillBest` / `quickDrillStreak`）统一在 `src/features/progress/store.ts`，禁止分散。
- **文件语义归属**：新文件直接放入语义归属模块；已分裂时以唯一消费方为归属方，并同步模块代理与 `platform-dev`。

## 工程约束（摘要）

| 主题 | 硬约束 | 详情 |
|---|---|---|
| 编码 / React | TS strict + no any；数组不可变（`toSorted` 等）；条件渲染用三元；禁止 Effect 回写派生值；禁止组件内定义组件；监听器 cleanup + passive | `docs/AI_GUIDE.md` §编码规范 |
| 状态 | zustand persist；禁止裸调 localStorage；每个 store 有 name + version；记录完成 action 幂等 | `docs/AI_GUIDE.md` §状态管理 |
| i18n | zh/en 缺一不可；key 命名 `<module>.<context>.<field>`；课程内容双轨、复习状态存 key | `docs/AI_GUIDE.md` §国际化 |
| UI/UX | 四层色彩 token；暗色默认；WCAG 2.1 AA；反霓虹；设计契约以 `DESIGN.md` 为准 | `DESIGN.md` + `docs/AI_GUIDE.md` §UI/UX |
| 文件大小 | 单文件 ≤300 行；>400 行失败；逐文件 allowlist 只减不增；CSS ≤800 行 | `src/guards/line-count-guard.test.ts` |

## 路由、构建与离线

- 页面必须 `React.lazy()` + `<LazyWrapper>`；`lazyPage` 用 `Promise.all([loader(), preloadI18n(keys)])` 并行加载页面与 i18n。
- 布局：`AppLayout`（主导航 + OnboardingGate）/ `BlankLayout`（无导航）；<768px 显示 `MobileNav`。
- 分包规则以 `vite.config.ts` 的 `manualChunks` 为准；Service Worker 以 `public/sw.js` 为准；路由 `basename` 使用 `import.meta.env.BASE_URL`。

## 跨模块复用契约（摘要）

| 契约 | 单一事实源 | 关键要求 |
|---|---|---|
| 五级反馈 | `shared/types/decisionFeedback.ts` | `calculateGrade` 唯一评级；EV 未标定不得渲染徽章 |
| 反馈闭环 | progress + 各 trainer | 反馈携带 `relatedLessonId`；`shouldDownshiftDifficulty()` 唯一入口 |
| 位置解锁 | `range-trainer/constants.ts` | `isPositionUnlocked`；阈值不在文档复制 |
| 选项排序 | `shared/utils/seededShuffle.ts` | 经模块排序出口；重映射正确答案；每日谜题顺序稳定 |
| 导师人格化 | `shared/constants/mentorStyles.ts` | `renderMentorFeedback`；缺省降级 i18n |
| 事件总线 | `shared/stores/trainingEvents.ts` | 训练后 emit；hand-history / help-center 豁免 |
| 调试解锁 | `shared/stores/debugMode.ts` | 9 处门禁；两种短路接法；onboarding 不纳入 |

> 完整契约（含各模块推导函数、阈值、9 处门禁清单与选项排序规则）见 `docs/AI_GUIDE.md` §跨模块复用契约。

## 文档维护（状态与职责）

| 类型 | 文件 | 状态 |
|---|---|---|
| Current | `docs/README.md`、PRD、TDD、AI_GUIDE、testing、adr、how-to、ops、DESIGN | 唯一事实源，随代码同步 |
| Generated | `docs/agents/MODULE_MAP.md` | `pnpm agents:map` 生成，勿手改 |
| Snapshot | `docs/architecture/` | 参考模型，刷新触发见其 README |
| Historical | `docs/CHANGELOG.md`、`docs/changelog/`、`docs/history/` | 只追溯，不作事实源 |

- 默认只读 **Current**；一次性报告 / 计划完成后移入 `docs/history/` 并在 `docs/history/README.md` 登记。
- 代码事实（模块数 / 版本号 / 测试数）不在文档硬编码；PRD 不含实现细节，TDD 不含执行历史；文档状态 / 索引 / 链接由 `pnpm docs:check` 校验（`verify` 已包含）。

## 知识库（repowiki）

- 位置与更新：`.qoder/repowiki/` 是 Qoder 自动生成的**本机知识缓存**，`.qoder/` 已忽略、**不入库**；`/knowledge` 更新，`/knowledge-plan` 配置预生成；开发时自动注入相关卡片。
- **知识库不是事实源**：与代码或 Current 文档冲突时以代码为准；不可用时直接读 `src/features/<module>/`。
- 子代理文件禁止复制知识库描述性内容；模块事实以 `MODULE_MAP.md` + 代码为准。详见 `docs/knowledge-guide.md`。

## 质量门禁

- **唯一出口**：`pnpm verify` = `typecheck && lint && repo:check && docs:check && agents:map:check && test`；任一失败即中止；构建 `pnpm build`，体积 `pnpm size:check`。
- **typecheck / lint / test**：`tsc --noEmit`、`eslint src`（模块隔离 + 禁 any）、`vitest run` 必须 exit 0。
- **全局守卫**：i18n 双语对称、静态 key、颜色 token、CSS 颜色、行数棘轮、测试体系自检、文档检查；清单见 `src/guards/README.md`。
- **测试后缀**：`.test.ts` = unit（Node）；`.test.tsx` = component（jsdom）；禁止 `.spec.ts(x)` 与 `__tests__/`。persist store 必须有 `store.persist-shape.test.ts`（version > 1 还须 `store.migrate.test.ts`）。
- **仓库 / 地图 / 文档**：`repo:check`、`agents:map:check`、`docs:check` 已接入 verify、CI 与 pre-commit。
- **Feature PR Checklist**：同步代理文件；行为变更补测试（缺陷附回归锁）；课程/题库变更同批过内容守卫；UI/路由改浏览器验证；新增守卫登记 README；新增跨模块边登记白名单；persist schema 变更 version + migrate；`pnpm verify` 全绿。

## 提交粒度

- **逻辑单元独立提交**：每个逻辑单元（单一 feature 变更 / 单一修复 / 单一文档同步）独立成 commit，禁止多模块批量混装。
- **提交信息**：`type(scope): description`，scope 为模块目录名（如 `feat(strategy-academy): ...`、`docs(agents): ...`）。
- **范围**：仅约束新提交，不追溯历史；Surgical Changes 同样适用于提交范围。

## Agent 协作

### 存放与模板

- 子代理物理源文件位于 `.claude/agents/`（入库）；`.qoder/agents/` 为 Junction 指向该目录；重建用 `scripts/setup-agent-junctions.ps1`。
- 新增 / 修改统一在 `.claude/agents/` 操作，禁止在 Junction 路径重建；新建 feature 代理用 [`docs/agents/TEMPLATE-dev.md`](docs/agents/TEMPLATE-dev.md)。
- 代理命名、清单、工具权限与批量补测协作见 [`docs/agents/README.md`](docs/agents/README.md) 与 `docs/testing/README.md` §13。

### 子代理共享基线条款（单点事实源）

> 本段为所有 feature / 基础层 agent 文件**唯一共享基线**。各 agent 文件**禁止重述**以下内容，仅引用本段。变更全局规则只需改此处（同时遵循「子代理规范」禁止复制知识库描述性内容原则）。

#### 新增页面/组件标准路径（Workflow 单源）

1. 在 `src/features/<module>/components/` 创建 `PascalCase.tsx`（按模块最小结构约定）
2. 若引入新文案，同时更新 `src/i18n/locales/zh/<module>.json` 与 `en/<module>.json`（双语缺一不可，key 命名 `<module>.<context>.<field>`）
3. 若新增测试，按 `vitest.config.ts` 双项目选后缀（规则见 §质量门禁「测试后缀速查」，禁止在此重述）
4. 运行 `pnpm verify` 确保门禁通过（唯一事实源为 `package.json` 的 `verify` script）
5. 若新增路由页面，由 `platform-dev` 在 `src/app/routes.tsx` 用 `React.lazy()` + `<LazyWrapper>` 注册
6. 若涉及全局视觉 / 共享组件 / 布局 / 导航 / 主题色，由 `ui-ux-dev` 复核（质量清单以 `DESIGN.md` 为准）

#### 全局约束（单源）

- TS strict + noUncheckedIndexedAccess，禁 any；`@/*`；组件 PascalCase / Hook use / 工具 camelCase / 路由 kebab-case。
- 单文件 ≤300 行；模块间禁止直接引用；跨模块状态集中 progress；shared 准入门槛 ≥2 模块。
- i18n 双语同步；UI 四层色彩 token，禁硬编码 / 霓虹。
- 每个 store 必须有 name + version；"记录完成" action 幂等。
- 五级反馈 `calculateGrade(evLoss)` 唯一评级；调试解锁 9 处门禁；选项排序治理（seededShuffle）。
- React 渲染约定见 `docs/AI_GUIDE.md` §React 渲染约定。

#### 基线 Quality Checklist

- [ ] `pnpm typecheck` / `pnpm lint` / `pnpm test` 全量 exit 0（含 i18n 对称、designTokenGuard）
- [ ] 新增 key 双语齐备；persist schema 变更 version 递增 + migrate
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
| 调试解锁（9 处门禁） | `platform-dev` 协调 | 全局旁路，清单见 `docs/AI_GUIDE.md` §调试解锁 |
| 阈值 / 评级源 | `range-trainer-dev` / `shared/types/decisionFeedback.ts` | 位置解锁以 constants.ts；GRADE_THRESHOLDS 以 decisionFeedback.ts；worker 拷贝须 parity |
| 每日计划生成（双源已消歧） | `strategy-academy-dev` 持 `generateDailyPlan`（academy 内部）/ `progress-dev` 持 `generateCrossModuleDailyPlan`（跨模块日训） | 两者命名已区分，禁止混用 |

### 边界与协作流程

- 子代理只能修改本模块文件；触碰 `shared/` 须遵循 Authority 声明，默认经 `platform-dev` 协调；跨模块变更必须经 `platform-dev` 评估。
- 子代理文件的 `## Constraints` 不得与本 AGENTS.md 冲突。
- 跨模块变更：评估影响 → 更新 TDD → 升级 persist version + migrate（如涉及）→ 通知模块代理 → `ui-ux-dev` 视觉复核（如涉及）→ 更新 CHANGELOG → `pnpm verify`。

## 行为准则

以下为当前生效摘要（原全文已删除，可从 git 历史追溯）：

- **Think Before Coding**：不做沉默假设，不确定先问
- **Simplicity First**：最少代码解决问题，不写投机性代码，不为单次使用做抽象
- **Surgical Changes**：只碰必须碰的，不"顺便改进"无关代码，遵循已有风格
- **Goal-Driven Execution**：定义成功标准，循环验证

检验标准：每一行改动都应能直接追溯到用户的需求。
