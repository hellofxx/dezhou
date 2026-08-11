---
name: subagent-code-review-plan
overview: 为德州扑克训练平台制定一份基于子代理协作模式的完整代码评审计划，按功能模块划分评审单元并充分并行化（解除串行依赖、分批并行、异步裁决），明确各评审子代理的职责范围、输入输出与协作接口，制定统一的bug排查流程与优化建议框架，规定输出格式与汇总机制，最终整合为一份结构清晰、可直接执行的评审报告。
todos:
  - id: create-plan-skeleton
    content: 在工作区根目录创建代码评审计划文档骨架：评审单元划分 + 4 并行批次（A 平台/B 核心/C 训练/D 轻量）+ 严重度分级
    status: completed
  - id: define-parallel-collab
    content: 定义并行协作机制：共享只读基线包、异步裁决队列、单点汇总收口，解除平台先行阻塞
    status: completed
    dependencies:
      - create-plan-skeleton
  - id: define-subagent-interfaces
    content: 为 12 个评审子代理定义职责范围、输入（基线包/契约表）、输出交接单与协作接口
    status: completed
    dependencies:
      - define-parallel-collab
  - id: define-bug-triage
    content: 制定统一 bug 排查流程，覆盖逻辑/边界/异常/资源泄漏/并发五类及项目特有检查点
    status: completed
    dependencies:
      - create-plan-skeleton
  - id: define-optimization-framework
    content: 制定优化建议框架，覆盖性能/可维护/可读/可扩展/耦合五维度并映射项目治理规范
    status: completed
    dependencies:
      - create-plan-skeleton
  - id: define-aggregation
    content: 规定交接单统一格式、跨模块去重裁决与平台单点汇总为单一可执行评审报告的机制
    status: completed
    dependencies:
      - define-subagent-interfaces
      - define-bug-triage
      - define-optimization-framework
  - id: verify-and-finalize
    content: 用 [subagent:code-explorer] 核对模块目录与门禁事实，复核 wcag/lsp 审查要点后定稿文档
    status: completed
    dependencies:
      - define-parallel-collab
      - define-aggregation
---

## 用户需求

基于子代理协作模式，为整个德州扑克训练平台制定一份**完整的代码评审计划**，按功能模块划分评审单元。细化要求：**考虑并行、提升效率**——解除串行阻塞、分批并行、通过异步机制提升整体评审吞吐。该计划作为一份可执行文档交付（markdown，与既有 `dashboard-review-2026-08-10.md` / `docs/analysis/*.md` 同约定）。

## 核心内容

- **评审单元划分**：以 10 个功能模块 + 平台/共享层 + 视觉层为评审单元
- **评审子代理指定与职责范围**：复用既有 `.claude/agents/` 架构（`<feature-dir>-dev`），明确各子代理审查边界
- **输入/输出与协作接口**：明确各子代理输入（审查材料/门禁基线/契约登记表）、输出（交接单）与协作方式
- **并行协作模式**：平台与模块批次同时启动、模块按规模分组并行、跨模块边界问题走异步裁决队列、唯一串行收口为平台汇总
- **统一 bug 排查流程**：覆盖逻辑错误、边界条件、异常处理、资源泄漏、并发安全五类
- **优化建议框架**：覆盖性能、可维护性、可读性、可扩展性、模块间耦合度五维度
- **输出格式与汇总机制**：统一交接单格式 + 严重度分级（P0-P3）+ 单点汇总为可执行评审报告

## 补充约束

- 复用既有子代理架构，不另起评审体系
- 遵循项目门禁：`pnpm verify`、单文件 ≤300 行、TS strict、禁 any、i18n 双语对称、模块间禁止直接引用、五级反馈与选项排序治理
- 仅产出评审计划文档，不实际执行代码修改

## 技术栈

纯文档交付（markdown，无新依赖）。评审执行阶段复用项目既有技术栈与工具链：TypeScript 7 strict、Zustand 5、i18next、Tailwind CSS 4，以及既有子代理编排架构。

## 实施方法（核心策略：并行优先）

### 1. 评审单元映射

复用既有 `.claude/agents/` 子代理，按模块规模与跨模块耦合度将 12 个评审单元划分为 **4 个并行批次**（Batch A-D），批间无强依赖、可同时启动：

| 批次 | 评审单元 | 子代理 | 审查范围 | 规模/耦合 |
| --- | --- | --- | --- | --- |
| Batch A（平台层，独立启动） | 平台/共享层 | `platform-dev` | src/app、src/layouts、src/shared、src/i18n、src/styles、构建配置、persist 迁移、事件总线、调试解锁门禁 | 大/高耦合 |
| Batch A（平台层，独立启动） | 视觉/设计语言 | `ui-ux-dev` | 四层色彩 token、响应式、可访问性（wcag-audit-patterns）、动效规范、设计契约 | 横切 |
| Batch B（业务核心，并行） | progress | `progress-dev` | 五大系统、跨模块状态中枢、Dashboard、统计图表 | 大/高耦合 |
| Batch B（业务核心，并行） | strategy-academy | `strategy-academy-dev` | 课程、Drill、QuickDrill、选项排序、学习轨道 | 大/中 |
| Batch B（业务核心，并行） | theory-academy | `theory-academy-dev` | 理论课程、章末小测、理论→实践桥接 | 大/中 |
| Batch B（业务核心，并行） | range-trainer | `range-trainer-dev` | 范围训练、位置渐进解锁、选项排序 | 中/中 |
| Batch C（训练模块，并行） | gto-simulator | `gto-simulator-dev` | GTO 模拟、反馈评级、预翻范围表 | 中/中 |
| Batch C（训练模块，并行） | pot-odds | `pot-odds-dev` | 赔率计算、EV 计算、选项排序 | 小/低 |
| Batch C（训练模块，并行） | puzzle-trainer | `puzzle-trainer-dev` | 三模式、每日谜题契约、quickDrillBest | 中/低 |
| Batch C（训练模块，并行） | hand-history | `hand-history-dev` | 牌局复盘、IndexedDB、gtoWorker 阈值复制 | 中/中 |
| Batch D（轻量模块，并行） | onboarding | `onboarding-dev` | 新手引导、OnboardingGate | 小/低 |
| Batch D（轻量模块，并行） | help-center | `help-center-dev` | 帮助教程、FAQ、纯静态模块 | 小/低 |


### 2. 并行协作机制（核心）

```
Batch A ── platform-dev ──┐
         └─ ui-ux-dev  ──┤  并行启动，无互阻塞
Batch B ── progress ─────┤
         ├─ strategy ────┤
         ├─ theory ──────┤
         └─ range ───────┤
Batch C ── gto/pot-odds ─┤  可 Batch B 完成或与 B 同时进行
         ├─ puzzle ──────┤
         └─ hand-history ┤
Batch D ── onboarding ───┤
         └─ help-center ─┘
              │  全部交接单产出
              ▼
platform-dev 汇总 ── 去重裁决 ── 最终评审报告   ← 唯一串行收口
```

- **解除平台先行阻塞**：`platform-dev` 不再作为前置串行依赖。各模块子代理基于**共享只读基线包**（AGENTS.md 全局约束 + 契约登记表 + 历史问题类型清单）独立审查，无需等待平台产出。
- **批内并行**：同一批次内子代理相互独立，可同时运行；批间可重叠（Batch C 不需等 Batch B 完成）。
- **异步裁决队列**：模块子代理发现跨模块边界问题（五级反馈、选项排序、shared 准入、事件总线）时，仅需写入**共享问题登记表**并标记「待平台裁决」，不阻塞自身交接单产出；`platform-dev` 汇总阶段统一裁决去重。
- **唯一串行收口**：所有批次交接单产出后，由 `platform-dev` 单点收集、去重、按严重度排序、标注责任代理与回归门禁，整合为单一可执行评审报告。避免多代理同时写同一文档导致冲突。

### 3. 各子代理输入/输出/协作接口

- **输入（只读共享基线包）**：审查范围文件清单、AGENTS.md 全局约束、跨模块契约登记表、历史问题类型清单（如 averageTime 单位、framer-motion variant、i18n 硬编码、阈值口径）。
- **输出（交接单，写入共享登记表）**：统一字段 `问题ID | 严重度 | 文件:行号 | 问题类型 | 根因分析 | 修复建议(ORIGINAL/NEW) | 跨模块影响 | 验证方式`。
- **协作接口**：通过共享问题登记表衔接；模块间问题标注跨模块影响并推入裁决队列；涉及 shared 层准入门槛或契约变更的问题，最终由 platform-dev 裁定。

### 4. 统一 bug 排查流程（五类）

1. **逻辑错误**：控制流/条件分支/状态机/幂等性（"记录完成" action 同日均不重复）、选项排序重映射正确答案、五级反馈 `calculateGrade(evLoss)` 边界归属。
2. **边界条件**：空/稀疏数据、每日重置跨日污染（dailyQuestionsDate===today 防御）、阈值口径统一、单位混用（averageTime 毫秒/秒）、0 除、lastIndexOf/-1 越界、noUncheckedIndexedAccess。
3. **异常处理**：i18n `t()` 兜底失效（缺 key 返回 key 字符串）、persist migrate 防御性合并、IndexedDB 失败降级、ErrorBoundary、离线降级。
4. **资源泄漏**：卸载后异步 setState、监听器/IO/rAF 清理、定时器清理、Worker 终止、IndexedDB 事务/游标、framer-motion 卸载残留。
5. **并发安全**：Zustand 原子更新、事件总线订阅去重、同日多作答并发计数、scroll spy 与 click 打架（ignoreScrollUntil）、migrate 幂等、每日谜题同契约。

### 5. 优化建议框架（五维度）

- **性能**：memo/useMemo 重渲染、列表 key、IndexedDB 分页惰性、worker 线程、包体积/manualChunks、Recharts 开销、避免 N+1 遍历。
- **可维护性**：单点事实源（常量/阈值/清单不硬编码数值）、单文件 ≤300 行、重复定义收敛 shared（≥2 模块门槛）、motion 单源。
- **可读性**：命名规范、职责单一、魔法数字命名、注释/i18n 可读性。
- **可扩展性**：模块最小结构约定、shared 准入、路由 lazy 分割、新增门禁接入调试解锁、persist 迁移路径。
- **模块间耦合度**：模块间禁止直接引用、trainingEvents 事件总线、跨模块状态集中 progress、选项排序/seededShuffle 统一出口。

### 6. 严重度分级（汇总排序依据）

- **P0 必须修复**：功能错误/数据正确性/安全/阻断性（如 framer-motion 状态名不匹配致不可见、单位混用致统计错误）。
- **P1 应当优化**：边界缺陷、i18n 缺失、视觉规范偏差（硬编码色值/动效字面量）、a11y 缺陷。
- **P2 建议改进**：可维护性/可读性/性能优化建议。
- **P3 可选/归档**：低风险、仅复核归档项。

### 7. 输出格式与汇总机制

- **交接单模板**：统一字段见上文，各子代理产出独立交接单到共享登记表。
- **汇总机制**：platform-dev 收集全部交接单 → 去重（跨模块重复合并到权威归属方）→ 按严重度 P0→P3 排序 → 标注责任代理 + 回归门禁 → 输出单一可执行评审报告（工作区根目录或 `docs/analysis/`）。
- **回归验证**：每项修复建议附验证方式（`pnpm verify` / 特定测试文件 / Playwright 截图 / axe 冒烟）。

## Agent Extensions

### SubAgent

- **code-explorer**
- 用途：评审计划定稿阶段核对各评审单元引用的模块目录、子代理文件与门禁规范的真实性，确保计划与代码库事实一致。
- 预期产出：全量引用核对清单，标注需修正的路径/事实差异。
- **ui-visual-validator**
- 用途：作为评审计划中「ui-ux-dev 视觉复核」的执行方，对涉及 UI 的评审单元做截图级视觉/响应式/可访问性抽查。
- 预期产出：截图级视觉验证报告，供最终评审报告汇总。

### Skill

- **lsp-code-analysis**
- 用途：评审执行阶段语义级代码导航（找定义/引用/调用链/实现），用于定位跨模块触点与耦合问题，支撑根因分析。
- 预期产出：符号引用与调用链清单，支撑跨模块影响判定。
- **wcag-audit-patterns**
- 用途：校准评审计划中 a11y/可访问性审查维度（aria、键盘可达、对比度）的 WCAG 2.2 合规准则。
- 预期产出：a11y 审查要点清单，写入评审计划文档。