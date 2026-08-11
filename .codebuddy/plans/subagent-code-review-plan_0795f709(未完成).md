---
name: subagent-code-review-plan
overview: 为德州扑克训练平台制定一套基于子代理协作模式的完整代码评审计划，按功能模块划分评审单元，明确每个评审子代理的职责范围、输入输出与协作接口，制定统一的bug排查流程与优化建议框架，规定输出格式与汇总机制，最终整合为一份结构清晰、可直接执行的评审报告。
---

I now have excellent context on the established patterns for these review/fix plan documents. The user's request is to create a **code review plan document** based on sub-agent collaboration. This is a documentation deliverable (like `dashboard-review-2026-08-10.md` and `desktop-tablet-fix-plan.md`).

Since this is a planning task for creating a review plan document, I'll produce the plan that outlines how to create this comprehensive code review plan. The deliverable will be a markdown document at the workspace root, following the existing conventions.

This is a documentation task (not UI, not code changes in the plan phase). Let me construct the plan:

**Key design decisions:**

1. Deliverable: a markdown review plan document at workspace root, e.g. `code-review-plan.md`
2. Reuse the existing sub-agent architecture: map 10 feature modules → the existing `<feature-dir>-dev` agents, plus platform-dev (base layer) and ui-ux-dev
3. Define sub-agent input/output/collaboration interfaces
4. Define unified bug-triage process (logic errors, boundary conditions, exception handling, resource leaks, concurrency safety)
5. Define optimization framework (performance, maintainability, readability, extensibility, coupling)
6. Define output format and aggregation mechanism

Since this task itself is about creating a plan document (which requires the sub-agent collaboration mechanism to be documented), I should structure the plan so that the actual deliverable document is created with all these sections.

The extensions available: subagents code-explorer, ui-visual-validator, context-manager; skills like wcag-audit-patterns, lsp-code-analysis; MCP Context7.

For creating a review plan, the relevant extensions would be:

- code-explorer (to verify file/module facts)
- lsp-code-analysis (for code navigation during review)
- wcag-audit-patterns (for a11y review dimension)
- ui-visual-validator (for visual review)

Let me construct the plan. The output format must be the `<plan_result>` XML. No `<design>` tag since this is a documentation task (not UI).

Let me write the todolist:

1. Create the review plan document skeleton (scope, review units by module)
2. Define sub-agent responsibilities, input/output/collaboration interfaces
3. Define unified bug-triage process covering the 5 problem types
4. Define optimization framework covering the 5 dimensions
5. Define output format and aggregation mechanism
6. Verify facts with code-explorer and finalize

Let me structure this properly.

Now let me write the plan result.

<plan_result>
<req>

## 用户需求

基于子代理协作模式，为整个德州扑克训练平台制定一份**完整的代码评审计划**，按功能模块划分评审单元。该计划作为一份可执行文档交付（工作区根目录 markdown 文件，与既有 `dashboard-review-2026-08-10.md` / `desktop-tablet-fix-plan.md` 同约定），内容须覆盖用户明确要求的五个部分：

## 核心内容

- **评审单元划分**：以 10 个功能模块 + 共享/基础层为评审单元
- **评审子代理指定与职责范围**：为每个评审单元指定独立评审子代理，明确其审查范围边界
- **输入/输出与协作接口**：明确各子代理的输入（审查材料/门禁基线）、输出（交接单/问题清单）与相互协作方式
- **统一 bug 排查流程**：覆盖逻辑错误、边界条件、异常处理、资源泄漏、并发安全五类常见问题
- **优化建议框架**：覆盖性能、可维护性、可读性、可扩展性、模块间耦合度五个维度
- **输出格式与汇总机制**：规定统一的问题条目格式与分级（P0/P1/P2/P3）、各子代理产出如何汇总为最终可执行的评审报告

## 补充约束

- 评审计划须复用项目既有的 `.claude/agents/` 子代理架构（模块命名 `<feature-dir>-dev` 对齐），不另起新架构
- 遵循项目质量门禁：`pnpm verify`（typecheck + lint + test）、单文件 ≤300 行、TypeScript strict、禁止 any、i18n 双语对称、模块间禁止直接引用、五级反馈与选项排序等治理规范
- 本任务仅产出评审计划文档，不实际执行代码修改
</req>

<tech>

## 技术栈

纯文档交付（markdown，无新依赖），评审方法基于项目既有子代理架构与门禁工具链。评审执行阶段（非本次计划阶段）复用现有技术栈：React 19 + TypeScript 7(strict) + Zustand 5 + i18next + Tailwind CSS 4。

## 实施方法（核心策略）

### 评审单元映射

评审计划复用项目成熟的子代理架构，将评审单元与既有 `.claude/agents/` 一一映射，避免另建评审体系：

| 评审单元 | 评审子代理（映射既有代理） | 审查范围 |
| --- | --- | --- |
| 平台/共享层 | `platform-dev` | src/app、src/layouts、src/shared、src/i18n、src/styles、构建配置、persist 迁移、事件总线、调试解锁门禁 |
| 视觉/设计语言 | `ui-ux-dev` | 四层色彩 token、响应式、可访问性、动效规范、设计契约（DESIGN_LANGUAGE.md） |
| range-trainer | `range-trainer-dev` | 范围训练、位置渐进解锁、选项排序 |
| pot-odds | `pot-odds-dev` | 赔率计算、EV 计算、选项排序 |
| gto-simulator | `gto-simulator-dev` | GTO 模拟、反馈评级、预翻范围表 |
| hand-history | `hand-history-dev` | 牌局复盘、IndexedDB、gtoWorker 阈值复制 |
| progress | `progress-dev` | 五大系统、跨模块状态中枢、统计图表、Dashboard |
| onboarding | `onboarding-dev` | 新手引导、OnboardingGate |
| puzzle-trainer | `puzzle-trainer-dev` | 三模式、每日谜题契约、quickDrillBest |
| strategy-academy | `strategy-academy-dev` | 课程、Drill、QuickDrill、选项排序、学习轨道 |
| theory-academy | `theory-academy-dev` | 理论课程、章末小测、理论→实践桥接 |
| help-center | `help-center-dev` | 帮助教程、FAQ、纯静态模块 |


### 协作模式

采用「先平台后模块、再汇总复核」的串行+并行结合机制：

1. **platform-dev 先行**：先审查共享层/基础设施（shared 准入、persist、事件总线、i18n 结构），产出跨模块基线问题，供各模块引用，避免重复。
2. **各模块并行/串行**：feature 子代理按交接顺序审查各自模块，输出交接单；跨模块触点问题（五级反馈、选项排序、反馈闭环）交由 platform-dev 统一裁决。
3. **ui-ux-dev 视觉复核**：对涉及 UI 的问题做设计语言/可访问性合规复核（wcag-audit-patterns + ui-visual-validator）。
4. **platform-dev 汇总收尾**：收集全部交接单，去重合并跨模块问题，产出一份可直接执行的评审报告。

### 各子代理输入/输出/协作接口

- **输入**：审查范围文件清单、项目门禁基线（AGENTS.md 全局约束、既有评审报告历史问题类型）、跨模块契约登记表。
- **输出**：统一格式的交接单——`问题ID | 严重度 | 文件:行号 | 问题类型 | 根因分析 | 修复建议(含代码) | 跨模块影响 | 验证方式`。
- **协作接口**：通过共享的「问题登记表」与「跨模块裁决队列」衔接；模块间问题须标注是否涉及 shared 层准入门槛或跨模块契约，交由 platform-dev 汇总裁决。

## 统一 bug 排查流程（五类）

1. **逻辑错误**：核对控制流/条件分支/状态机/幂等性（"记录完成" action 同日均不重复）、选项排序重映射正确答案、五级反馈 `calculateGrade(evLoss)` 边界归属。
2. **边界条件**：空数据/稀疏数据、每日重置/跨日数据污染（dailyQuestionsDate===today 防御）、阈值边界（difficulty 判定与建议口径统一）、单位混用（averageTime 毫秒/秒）、0 除、lastIndexOf/-1 越界、noUncheckedIndexedAccess。
3. **异常处理**：i18n `t()` 兜底失效（缺 key 返回 key 字符串）、persist migrate 防御性合并、IndexedDB 失败降级、ErrorBoundary、网络离线降级（Service Worker）。
4. **资源泄漏**：组件卸载后异步 setState、事件监听/IntersectionObserver/rAF 清理、定时器清理、Worker 终止、IndexedDB 事务/游标关闭、framer-motion 卸载动画残留。
5. **并发安全**：前端纯客户端场景聚焦——Zustand 状态原子更新、事件总线订阅去重、同一日多作答并发计数、scroll spy 与 click 反馈打架（ignoreScrollUntil ref）、migrate 幂等、每日谜题同契约。

## 优化建议框架（五维度）

- **性能**：重渲染优化（memo/useMemo）、列表 key、大数据 IndexedDB 分页/惰性加载、worker 线程、包体积/manualChunks、Recharts 渲染开销、避免 N+1 遍历。
- **可维护性**：单点事实源（常量/阈值/模块清单不硬编码数值）、单文件 ≤300 行、重复定义收敛到 shared（≥2 模块门槛）、motion 单源。
- **可读性**：命名规范、组件/函数职责单一、魔法数字命名、注释与 i18n 可读性。
- **可扩展性**：模块最小结构约定、shared 层准入、路由 lazy 分割、新增门禁接入调试解锁、持久化 schema 迁移路径。
- **模块间耦合度**：模块间禁止直接引用、trainingEvents 事件总线、跨模块状态集中 progress、选项排序/seededShuffle 统一出口。

## 严重度分级（汇总排序依据）

- **P0 必须修复**：功能错误/数据正确性/安全/阻断性 bug（如 framer-motion 状态名不匹配致不可见、单位混用致统计错误）。
- **P1 应当优化**：边界缺陷、i18n 缺失、视觉规范偏差（硬编码色值/动效字面量）、a11y 缺陷。
- **P2 建议改进**：可维护性/可读性/性能优化建议。
- **P3 可选/归档**：低风险、仅复核归档项。

## 输出格式与汇总机制

- **交接单模板**：见上文协作接口；每模块评审产出独立交接单。
- **汇总机制**：platform-dev 收集全部交接单 → 去重（跨模块重复问题合并到权威归属方）→ 按严重度 P0→P3 排序 → 标注责任智能体 + 复核门禁 → 输出单一可执行评审报告（`docs/analysis/` 或工作区根目录 markdown）。
- **回归验证**：每项修复建议附验证方式（`pnpm verify` / 特定测试文件 / Playwright 截图 / axe 冒烟）。

## 关键代码结构（契约级，不实现）

评审交接单统一字段（供所有子代理遵守）：

- `问题ID`（如 `PROG-01` / `P0-01`）、`严重度`（P0/P1/P2/P3）、`评审单元`、`文件路径:L行号`、`问题类型`（逻辑/边界/异常/泄漏/并发/性能/可维护/可读/可扩展/耦合/a11y）、`根因分析`、`修复建议`（含 ORIGINAL/NEW 代码对）、`跨模块影响`（是/否+涉及方）、`验证方式`。
</tech>

<extensions>

## Agent Extensions

### SubAgent

- **code-explorer**
- 用途：编写评审计划时核对各评审单元引用的模块目录、子代理文件与门禁规范的真实性，确保计划与代码库事实一致。
- 预期产出：全量引用核对清单，标注需修正的路径/事实差异。
- **ui-visual-validator**
- 用途：作为评审计划中「ui-ux-dev 视觉复核门禁」的执行方，对涉及 UI 的评审单元做截图级视觉/响应式/可访问性抽查。
- 预期产出：截图级视觉验证报告，供最终评审报告汇总。

### Skill

- **lsp-code-analysis**
- 用途：评审执行阶段语义级代码导航（找定义/引用/调用链/实现），用于定位跨模块触点与耦合问题。
- 预期产出：符号引用与调用链清单，支撑根因分析与跨模块影响判定。
- **wcag-audit-patterns**
- 用途：校准评审计划中 a11y/可访问性审查维度（aria、键盘可达、对比度）的 WCAG 2.2 合规准则。
- 预期产出：a11y 审查要点清单，写入评审计划文档。
</extensions>

<todolist>
<item id="create-plan-skeleton" deps="">在工作区根目录创建代码评审计划文档骨架（评审单元划分 + 平台先行/模块接力的协作模式 + 严重度分级）</item>
<item id="define-subagent-interfaces" deps="create-plan-skeleton">为 12 个评审子代理（platform/ui-ux + 10 模块）定义职责范围、输入、输出交接单与协作接口</item>
<item id="define-bug-triage" deps="create-plan-skeleton">制定统一 bug 排查流程，覆盖逻辑/边界/异常/资源泄漏/并发五类问题及项目特有检查点</item>
<item id="define-optimization-framework" deps="create-plan-skeleton">制定优化建议框架，覆盖性能/可维护/可读/可扩展/模块耦合五维度并映射项目治理规范</item>
<item id="define-aggregation" deps="define-subagent-interfaces">规定交接单统一输出格式、跨模块去重裁决与汇总为单一可执行评审报告的机制</item>
<item id="verify-and-finalize" deps="define-bug-triage,define-optimization-framework,define-aggregation">用 [subagent:code-explorer] 核对模块目录与门禁事实，复核 wcag/lsp 审查要点后定稿文档</item>
</todolist>
</plan_result>