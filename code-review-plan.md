# 全项目代码评审计划（子代理协作 · 并行模式）

**计划日期**：2026-08-11  
**驱动技能**：`@command://cr`（基于子代理协作模式）  
**评审目标**：为整个德州扑克训练平台按功能模块划分评审单元，通过多子代理并行协作，产出一份结构清晰、可直接执行的代码评审报告。

---

## 一、评审单元划分与并行批次

### 1.1 评审单元总览（12 个单元 × 子代理 × 范围）

复用项目既有 `.claude/agents/` 子代理架构（命名对齐 `<feature-dir>-dev`），不另起评审体系。每个评审单元由**独立评审子代理**负责，职责范围按模块边界划定，互不越界、互不覆盖。

| 评审单元 | 评审子代理 | 审查范围 |
| --- | --- | --- |
| 平台/共享层 | `platform-dev` | `src/app`、`src/layouts`、`src/shared`、`src/i18n`、`src/styles`、构建配置、persist 迁移、事件总线、调试解锁门禁 |
| 视觉/设计语言 | `ui-ux-dev` | 四层色彩 token、响应式、可访问性、动效规范、设计契约（DESIGN_LANGUAGE.md） |
| progress | `progress-dev` | 五大系统（Streak/ELO/SRS/Emotion/Mentor）、跨模块状态中枢、Dashboard、统计图表 |
| strategy-academy | `strategy-academy-dev` | 课程、Drill、QuickDrill、选项排序、学习轨道 |
| theory-academy | `theory-academy-dev` | 理论课程、章末小测、理论→实践桥接 |
| range-trainer | `range-trainer-dev` | 范围训练、位置渐进解锁、选项排序 |
| gto-simulator | `gto-simulator-dev` | GTO 模拟、反馈评级、预翻范围表 |
| pot-odds | `pot-odds-dev` | 赔率计算、EV 计算、选项排序 |
| puzzle-trainer | `puzzle-trainer-dev` | 三模式、每日谜题契约、quickDrillBest |
| hand-history | `hand-history-dev` | 牌局复盘、IndexedDB、gtoWorker 阈值复制 |
| onboarding | `onboarding-dev` | 新手引导、OnboardingGate |
| help-center | `help-center-dev` | 帮助教程、FAQ、纯静态模块 |

### 1.2 四个并行批次（Batch A-D）

按**模块规模**与**跨模块耦合度**将 12 个评审单元划分为 4 个并行批次。**批间无强依赖、可同时启动**，批内子代理相互独立可并行运行，最大化吞吐。

| 批次 | 评审单元 | 子代理 | 规模/耦合 | 说明 |
| --- | --- | --- | --- | --- |
| **Batch A · 平台层** | 平台/共享层 | `platform-dev` | 大/高耦合 | 与 B/C/D 同批启动，不作前置串行依赖 |
| **Batch A · 平台层** | 视觉/设计语言 | `ui-ux-dev` | 横切 | 全局视觉一致性复核 |
| **Batch B · 业务核心** | progress | `progress-dev` | 大/高耦合 | 四模块独立并行 |
| **Batch B · 业务核心** | strategy-academy | `strategy-academy-dev` | 大/中 | |
| **Batch B · 业务核心** | theory-academy | `theory-academy-dev` | 大/中 | |
| **Batch B · 业务核心** | range-trainer | `range-trainer-dev` | 中/中 | |
| **Batch C · 训练模块** | gto-simulator | `gto-simulator-dev` | 中/中 | 可与其他批重叠 |
| **Batch C · 训练模块** | pot-odds | `pot-odds-dev` | 小/低 | |
| **Batch C · 训练模块** | puzzle-trainer | `puzzle-trainer-dev` | 中/低 | |
| **Batch C · 训练模块** | hand-history | `hand-history-dev` | 中/中 | |
| **Batch D · 轻量模块** | onboarding | `onboarding-dev` | 小/低 | 可顺带承接 Batch A overflow |
| **Batch D · 轻量模块** | help-center | `help-center-dev` | 小/低 | |

---

## 二、严重度分级（汇总排序依据）

所有评审子代理在判定问题时统一采用四级严重度，作为最终报告排序与执行优先级依据：

| 级别 | 定义 | 典型示例 |
| --- | --- | --- |
| **P0 必须修复** | 功能错误、数据正确性、安全、阻断性 bug | framer-motion 状态名不匹配致元素不可见；averageTime 单位混用致统计错误 |
| **P1 应当优化** | 边界缺陷、i18n 缺失、视觉规范偏差、a11y 缺陷 | 阈值口径不一致；硬编码色值/动效字面量；aria 缺失 |
| **P2 建议改进** | 可维护性、可读性、性能优化建议 | 重复定义收敛、单点事实源、memo 化 |
| **P3 可选/归档** | 低风险、仅复核归档项 | 命名微调、注释补充 |

---

## 三、并行协作机制（核心）

### 3.1 协作流水线总览

```
                    ┌─ platform-dev ─┐
  Batch A（同批启动） ┤               ├─┐
                    └─ ui-ux-dev  ──┘ │
  Batch B（并行）  ── progress ────────┤
                  ├─ strategy-academy─┤  共享只读基线包一次性分发
                  ├─ theory-academy ─┤  （无互阻塞，批间可重叠）
                  └─ range-trainer ──┤
  Batch C（并行）  ── gto-simulator ──┤
                  ├─ pot-odds ───────┤
                  ├─ puzzle-trainer ─┤
                  └─ hand-history ───┤
  Batch D（并行）  ── onboarding ─────┤
                  └─ help-center ────┘
                        │  全部交接单产出
                        ▼
  platform-dev 汇总 ── 去重裁决 ── 最终评审报告  ← 唯一串行收口
```

### 3.2 解除平台先行阻塞

`platform-dev` 不再作为前置串行依赖。所有子代理在开工时基于**共享只读基线包**独立审查，无需等待平台层产出：

- **共享只读基线包**（开工时一次性分发，内容见 §4.1）：AGENTS.md 全局约束 + 跨模块契约登记表 + 历史问题类型清单。
- 各模块子代理依据基线包 + 自身模块源码即可独立完成审查，不产生跨代理等待。

### 3.3 批内并行与批间重叠

- **批内并行**：同一批次内子代理相互独立，可同时运行。
- **批间重叠**：Batch C 不需要等 Batch B 完成；Batch D 可作为弹性容量，Batch A/B/C 若有 overflow 可被 D 承接。
- 实际调度由主代理决定并发上限（建议同时最多运行 4-6 个评审子代理，避免上下文窗口饱和）。

### 3.4 异步裁决队列

模块子代理发现**跨模块边界问题**（五级反馈、选项排序、shared 层准入门槛、事件总线、跨模块状态）时：

- **不阻塞自身交接单产出**：仅将问题写入共享问题登记表，并标记 `[待平台裁决]`。
- `platform-dev` 在汇总阶段统一裁决归属与去重，避免各模块重复判定同一共享问题。

### 3.5 唯一串行收口

所有批次交接单产出后，由 `platform-dev` **单点**收集、去重、按严重度排序、标注责任代理与回归门禁，整合为单一可执行评审报告。**禁止多代理同时写同一汇总文档**，规避写冲突。

---

## 四、子代理输入 / 输出 / 协作接口

### 4.1 统一输入（共享只读基线包）

每个评审子代理开工前注入以下只读材料：

| 输入项 | 说明 |
| --- | --- |
| 审查范围文件清单 | 该评审单元对应的 `src/features/<module>/*` 或共享/基础层路径 |
| AGENTS.md 全局约束 | 单文件 ≤300 行、TS strict、禁 any、i18n 双语对称、模块间禁止直接引用、五级反馈、选项排序治理、调试解锁门禁 |
| 跨模块契约登记表 | AGENTS.md《跨模块能力归属登记表》及进度 store persist 契约 |
| 历史问题类型清单 | 见 §5.2（averageTime 单位、framer-motion variant、i18n 硬编码、阈值口径等高频复发点） |

### 4.2 统一输出（交接单，写入共享问题登记表）

每个子代理产出的交接单字段**完全统一**（供汇总阶段直接拼接）：

```
问题ID | 严重度 | 文件:行号 | 问题类型 | 根因分析 | 修复建议(ORIGINAL/NEW) | 跨模块影响 | 验证方式
```

- `问题ID`：`<模块前缀>-NN`（如 `PROG-01`、`GTO-03`），前缀见下表。
- `问题类型`：逻辑 / 边界 / 异常 / 泄漏 / 并发 / 性能 / 可维护 / 可读 / 可扩展 / 耦合 / a11y。
- `跨模块影响`：`是/否` + 涉及方；为「是」时同时推入裁决队列。

| 评审子代理 | 问题ID 前缀 |
| --- | --- |
| platform-dev | `PLAT-` |
| ui-ux-dev | `UI-` |
| progress-dev | `PROG-` |
| strategy-academy-dev | `ACAD-` |
| theory-academy-dev | `THY-` |
| range-trainer-dev | `RNG-` |
| gto-simulator-dev | `GTO-` |
| pot-odds-dev | `ODDS-` |
| puzzle-trainer-dev | `PZL-` |
| hand-history-dev | `HH-` |
| onboarding-dev | `OB-` |
| help-center-dev | `HELP-` |

### 4.3 协作接口

- **共享问题登记表**：所有子代理写入交接单的统一位置；`platform-dev` 只读汇总。
- **裁决队列**：`跨模块影响=是` 的问题写入此队列，汇总阶段由 platform-dev 统一裁决归属与去重。
- **跨模块契约变更**：涉及 shared 层准入门槛、persist version、选项排序出口变更时，必须在交接单显式标注，最终由 platform-dev 裁定。

### 4.4 各子代理模块特有审查重点（职责范围细化）

每个评审子代理除遵循统一 bug 排查流程（§5）与优化框架（§6）外，重点核查本模块的**高频复发点与特有契约**：

| 评审子代理 | 模块特有审查重点 |
| --- | --- |
| `platform-dev` | persist migrate 防御性合并、事件总线 emit/订阅、调试解锁 9 处门禁、shared 层准入门槛（≥2 模块）、i18n 结构、路由 lazy 分割、manualChunks 分包、Service Worker 版本缓存 |
| `ui-ux-dev` | 四层色彩 token（`--felt-*`/`--ivory-*`/`--brass-*`/`--walnut-*`）、反霓虹守卫、`--stable-ivory` 满色填充文字、响应式断点（1024/768/640）、动效单源 `motion.ts`、WCAG 2.2 AA 对比度 |
| `progress-dev` | 五大系统"记录"action 幂等（同日均不重复）、`shouldDownshiftDifficulty()` 唯一入口、`quickDrillStreak` 连续 7 天触发 `awardStreakFreeze`、persist version 单一事实源、Dashboard 时间筛选基于全量 records |
| `strategy-academy-dev` | quizShuffle 重映射正确答案、`inferRelatedLessonId`、位置/轨道/课程多级解锁、QuickDrill/composeDailyMix、概念图本地课解锁 |
| `theory-academy-dev` | TheoryQuiz 空题库 StrictMode 双跑防护、`isTheoryLevelUnlocked`、URL 直达门禁、理论→实践桥接、章末小测状态机 |
| `range-trainer-dev` | `POSITION_UNLOCK_THRESHOLDS` 单一事实源、`isPositionUnlocked`、选项排序、平均时间单位（毫秒） |
| `gto-simulator-dev` | preflop-ranges.json 权威数据源、反馈评级 `calculateGrade(evLoss)` 边界归属、场景 street 推导关联课程 |
| `pot-odds-dev` | quizOrder 排序、EV 计算正确性、平均时间单位（毫秒）、0 除/小额保护 |
| `puzzle-trainer-dev` | 每日谜题契约（同契约/同选项顺序）、`quickDrillBest` 独立持久化、optionOrder 排序、ActionBoard 三档 tier |
| `hand-history-dev` | gtoWorker 阈值复制（与 `GRADE_THRESHOLDS` 对齐）、IndexedDB 事务/游标关闭、Worker 终止、复盘分析（非交互训练豁免） |
| `onboarding-dev` | OnboardingGate 首访判定、BlankLayout 无导航、调试解锁不纳入范围 |
| `help-center-dev` | 纯静态模块豁免 store、FAQ 手风琴 a11y、House Rules 立牌签名 |

---

## 五、统一 bug 排查流程（五类问题）

所有评审子代理按统一流程排查，覆盖五类常见问题 + 项目特有高频检查点。每类问题给出**排查指引**与**项目特有落地检查点**。

### 5.1 问题类型排查指引

| 问题类型 | 排查指引 | 验证方法 |
| --- | --- | --- |
| **逻辑错误** | 核对控制流/条件分支/状态机/幂等性；检查"记录完成"action 同日均不重复；选项排序重映射后正确答案是否同步；`calculateGrade(evLoss)` 边界归属 | 单测 / 状态机推演 |
| **边界条件** | 空数据/稀疏数据；每日重置跨日污染（`dailyQuestionsDate===today` 防御）；阈值口径统一；0 除；`lastIndexOf`/-1 越界；`noUncheckedIndexedAccess` 未断言访问 | 构造边界用例 |
| **异常处理** | i18n `t()` 兜底失效（缺 key 返回 key 字符串，`||` 不触发）；persist migrate 防御性合并；IndexedDB 失败降级；ErrorBoundary；离线降级（Service Worker） | 缺 key 模拟 / 降级注入 |
| **资源泄漏** | 卸载后异步 setState；监听器/IntersectionObserver/rAF 清理；定时器清理；Worker 终止；IndexedDB 事务/游标关闭；framer-motion 卸载残留 | 组件卸载冒烟 |
| **并发安全** | Zustand 原子更新；事件总线订阅去重；同日多作答并发计数；scroll spy 与 click 打架（`ignoreScrollUntil` ref）；migrate 幂等；每日谜题同契约 | 并发计数测试 / 双跑 |

### 5.2 项目特有高频检查点（历史复发类型清单）

评审子代理在排查五类问题外，须重点核对以下**已证实的历史复发点**：

| # | 检查点 | 说明 |
| --- | --- | --- |
| 1 | **时间单位统一** | `averageTime` 展示/聚合端统一毫秒（`/1000` 显示秒、speed-king 阈值毫秒），写入端不得存秒 |
| 2 | **framer-motion variant 状态名** | `staggerContainer()` 的 variants 仅 `hidden`/`visible`，使用处必须 `animate="visible"` 而非 `show`，否则元素永久 opacity:0 不可见 |
| 3 | **i18n 硬编码中文** | 数据层 title 渲染用 `t(key, { defaultValue })` 模式；禁用直接渲染/插入 i18n 模板；aria-label 同步 i18n |
| 4 | **阈值口径统一** | 难度判定与建议引用同一 `DIFFICULTY_THRESHOLDS` 常量，避免"最高难度+建议升级"矛盾 |
| 5 | **rgba 硬编码色值** | 热力图/渐变/徽章/横幅改用 token（`--brass-cell-*`/`color-mix`），禁用硬编码 rgba |
| 6 | **动效单源** | 内联 transition 字面量统一为 `motion.ts` 的 `transitionStandard`/`transitionSlow`，禁止内联字面量 |
| 7 | **满色填充文字** | 满色填充按钮/面板上用 `--stable-ivory` 而非随主题翻转的 `--ivory` |

### 5.3 排查执行顺序（单代理内）

1. **静态通读**：读模块 store.ts / types.ts / index.ts 建立数据流与状态模型。
2. **逻辑与边界**：按五类指引逐函数核查。
3. **跨模块触点**：对照契约登记表，标记跨模块问题推入裁决队列。
4. **资源与并发**：核查副作用清理与并发路径。
5. **对照高频检查点**：逐项核对 §5.2 清单。
6. **产出交接单**：按 §4.2 统一格式写入问题登记表。

---

## 六、优化建议框架（五维度）

评审子代理对发现的非阻断性改进，按以下五维度分类给出建议。每个优化建议须**映射到项目治理规范**，避免提出与既有约束冲突的方案。

| 维度 | 优化要点 | 映射的项目治理规范 |
| --- | --- | --- |
| **性能** | memo/useMemo 重渲染；列表 key；IndexedDB 分页/惰性加载；worker 线程；包体积/manualChunks；Recharts 渲染开销；避免 N+1 遍历 | 路由 lazy 分割；分包策略；纯函数缓存 |
| **可维护性** | 单点事实源（常量/阈值/模块清单不硬编码数值）；单文件 ≤300 行；重复定义收敛 shared（≥2 模块门槛）；motion 单源 | shared 层准入门槛；常量单一事实源 |
| **可读性** | 命名规范；组件/函数职责单一；魔法数字命名；注释与 i18n 可读性 | PascalCase/use 前缀/camelCase 命名规范 |
| **可扩展性** | 模块最小结构约定；shared 准入；路由 lazy 分割；新增门禁接入调试解锁；persist schema 迁移路径 | 模块最小结构；persist version 升级规则 |
| **模块间耦合度** | 模块间禁止直接引用；trainingEvents 事件总线；跨模块状态集中 progress；选项排序/seededShuffle 统一出口 | 模块间禁止直接引用；事件总线；选项排序治理 |

---

## 七、输出格式与汇总机制

### 7.1 交接单统一格式（子代理产出）

每个评审子代理将问题以**统一字段**写入共享问题登记表，供汇总阶段直接拼接、去重与排序：

```
问题ID: <模块前缀>-NN
严重度: P0 | P1 | P2 | P3
评审单元: <模块名>
文件路径: <src/.../file.tsx#Lstart-Lend>
问题类型: 逻辑|边界|异常|泄漏|并发|性能|可维护|可读|可扩展|耦合|a11y
根因分析: <root cause + impact>
修复建议: <ORIGINAL / NEW 代码对>
跨模块影响: 是/否 (+涉及方)
验证方式: pnpm verify | <特定测试文件> | Playwright 截图 | axe 冒烟
```

### 7.2 汇总流水线（platform-dev 单点）

```
收集全部交接单
   → 去重合并（跨模块重复问题归并到权威归属方，引用对方问题ID）
   → 跨模块裁决（解析裁决队列中的 [待平台裁决] 问题，裁定归属）
   → 按严重度排序（P0 → P1 → P2 → P3）
   → 标注责任子代理 + 回归验证门禁
   → 输出单一可执行评审报告
```

**去重规则**：同一问题被多模块重复上报时，仅保留权威归属方条目；其余条目引用该 `问题ID`，避免报告冗余。

### 7.3 最终评审报告结构

`platform-dev` 汇总产出一份单一 markdown 报告（落盘 `docs/analysis/` 或工作区根目录），结构如下：

```
# 全项目代码评审报告
审查日期 | 驱动技能 | 评审范围

## 1. 评审方法与并行批次
## 2. 核心发现分级汇总（P0 → P3，每项含文件/根因/影响）
## 3. 各模块交接单明细（按评审单元分节）
## 4. 跨模块裁决结果（去重合并记录）
## 5. 优化建议汇总（按五维度分类）
## 6. 回归验证（pnpm verify / 特定测试 / Playwright / axe）
## 7. 修改文件清单与责任代理
## 8. 设计契约遵循
```

### 7.4 回归验证门禁

每项修复建议附验证方式，作为评审报告"可直接执行"的保障：

- `pnpm verify`（typecheck + lint + test）— 任何代码变更的硬门禁。
- 特定测试文件（`pnpm test <path>`）— 针对模块数据完整性/状态机测试。
- Playwright 截图 — UI 视觉回归。
- axe 冒烟 / `wcag-audit-patterns` — a11y 合规。
- `designTokenGuard.test.ts` / `localeParity.test.ts` — 色彩 token 与 i18n 对称守卫。

---

## 附：交付物清单

| 交付物 | 位置 | 说明 |
| --- | --- | --- |
| 本评审计划文档 | `code-review-plan.md`（工作区根目录） | 评审执行的蓝本与档案 |
| 共享问题登记表 | 评审执行时创建 | 各子代理写入交接单的统一位置 |
| 最终评审报告 | `docs/analysis/code-review-report.md` | platform-dev 汇总的可执行报告 |

---

