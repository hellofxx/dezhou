# 多智能体编排优化分析报告

> 分析对象：`.claude/agents/` 下 12 个**自定义** agent（2 基础层 + 10 feature 层），不含 `builtin/` 内置代理。
> 方法：通读全部 agent 配置，对照 `AGENTS.md` 既定原则，量化职责划分、触发条件、信息传递的冗余与断裂点。
> 日期：2026-08-10

---

## 0. 结论速览（Executive Summary）

| 维度 | 现状评估 | 核心问题 | 优化收益 |
|---|---|---|---|
| 职责划分 | 模块边界清晰 | QuickDrill 归属割裂、跨模块能力无登记中心 | 减少误路由与重复澄清 |
| 触发条件 | 关键词触发基本合理 | 跨模块变更无自动路由，层层人工交接 | 降低协调开销 |
| 信息传递冗余 | **严重** | 共享条款/工作流被复制 10 份 | 删减 ~30% 样板，单点维护 |
| 信息传递断裂 | 中 | worker 双源阈值、agent 文件易过时 | 补契约测试 + 自动校验 |
| 流程可合并 | 适中 | 同构 agent 文档样板可抽取 | 不合并 agent，只合并文档 |

**最高 ROI 的三项动作**：① 把"新增页面/组件标准路径"工作流与全局约束抽成单源引用；② 建立"跨模块能力归属登记表"；③ 统一 6 个 trainer 的 progress-store 集成契约。

---

## 1. 现状画像（Profiling）

### 1.1 Agent 资产清单

| Agent | 类型 | 模型 | 职责焦点 |
|---|---|---|---|
| `platform-dev` | 基础层 | DeepSeek-V4-Flash | 脚手架/路由/shared 层/跨模块协调/持久化 |
| `ui-ux-dev` | 基础层 | Qwen3.7-Plus | 设计语言守护/视觉一致性/响应式/可访问性 |
| `range-trainer-dev` | Feature | DeepSeek-V4-Flash | 范围训练（网格/位置解锁） |
| `pot-odds-dev` | Feature | DeepSeek-V4-Flash | 赔率计算/底池赔率 |
| `gto-simulator-dev` | Feature | DeepSeek-V4-Flash | GTO EV 对比 |
| `hand-history-dev` | Feature | DeepSeek-V4-Flash | 牌局复盘/偏差分析 |
| `progress-dev` | Feature | DeepSeek-V4-Flash | 五大系统中枢/Dashboard |
| `onboarding-dev` | Feature | DeepSeek-V4-Flash | 5 步新手引导 |
| `puzzle-trainer-dev` | Feature | DeepSeek-V4-Flash | Puzzle 三模式 |
| `strategy-academy-dev` | Feature | DeepSeek-V4-Flash | 课程/Drill/QuickDrill |
| `theory-academy-dev` | Feature | DeepSeek-V4-Flash | 理论课程/章末小测 |
| `help-center-dev` | Feature | DeepSeek-V4-Flash | 帮助文档（纯静态） |

### 1.2 量化重复指标

- **`新增页面/组件标准路径` 工作流**：在 10 个 feature agent 中**逐字复制**（已用 grep 验证，10/10 命中）。
- **`继承 AGENTS.md 全局约束`** 约束段：10/10 重复。
- **Quality Checklist 基线项**（`tsc --noEmit exit 0` + `zh.json/en.json 双语同步`）：10/10 重复。
- **progress-store 集成文档**：在 6 个 trainer agent 中各自重述，写法不统一（见 §2.3-F）。
- **QuickDrill 归属澄清**：在 `puzzle-trainer-dev` 中出现 **3 次**"这些不归我，在 strategy-academy/QuickDrill"。

---

## 2. 核心问题发现

### 2.1 职责划分（清晰度）

**问题 A — QuickDrill 归属割裂**
`puzzle-trainer-dev` 反复声明 `composeDailyMix` / `quickDrillStreak` / `awardStreakFreeze` 不在本模块，而位于 `strategy-academy/QuickDrill`。概念上"快速训练"更像 puzzle 能力，却寄居 strategy-academy。后果：① puzzle-trainer 文档自相矛盾地反复澄清边界；② 触发"快速训练"类任务时易误路由。

**问题 B — 跨模块能力无登记中心**
类似"不归我"的澄清散落在多个文件（puzzle 澄清 QuickDrill、hand-history 澄清 trainingEvents 豁免、各 trainer 澄清 progress 集成）。缺乏单一归属登记表，每个 agent 都要口头划清"哪些不是我的"。

**问题 C — `generateDailyPlan` 双源命名碰撞**
`strategy-academy/utils/dailyPlan.ts` 与 progress 模块各有 `generateDailyPlan`，已在约束中显式"禁止混淆"。这是 fragile 的命名碰撞风险，仅靠文字约束防护。

### 2.2 触发条件（合理性）

- 各 agent `description` 关键词触发基本合理，模块边界清晰。
- **跨模块变更链路断裂**：AGENTS.md 规定"涉及跨模块变更须 platform-dev 协调"，但执行靠人工"通知受影响 agent 更新其文件"。一次触及 3 模块 + 视觉复核的变更需 platform-dev + 3 feature + ui-ux-dev = **5 agent 串行交接**，且无自动校验确保各 agent 文件确实更新 → 断点风险高。
- **模型分配错配嫌疑**：`platform-dev` 承担架构决策与 persist 协调（重推理任务）却用最轻量的 `DeepSeek-V4-Flash`；而一致性复核 `ui-ux-dev` 用更强的 `Qwen3.7-Plus`。建议对"架构/协调"类任务评估更强模型，避免轻模型做重决策。

### 2.3 信息传递冗余（Redundancy）

**问题 D — 标准路径工作流 10 份复制**（已验证）
每个 feature agent 的 Workflows 第 N 步都含同一长句（路径创建 → 双语 i18n → 选测试后缀 → `pnpm verify` → platform-dev 注册路由 → ui-ux-dev 复核）。变更此流程需改 10 处。

**问题 E — 全局约束与 Quality Checklist 基线项 10 份复制**
`tsc --noEmit`、`zh/en 双语同步`、`单文件 ≤300 行` 等基线项在 10 个 agent 中重复，且与 `AGENTS.md` 同源。

**问题 F — progress-store 集成文档 6 种写法**
6 个 trainer 对"训练完成 → 五大系统"的集成描述各不相同：
- range-trainer：经 `useQuizEngine` recorders
- pot-odds：协同 `useOddsEloRecorder` 等注入 `useOddsCalculation.ts`
- gto-simulator：协同 `useGtoEloRecorder` 等注入 `useGTOComparison.ts`
- puzzle-trainer：经 `usePuzzleSession`
- strategy-academy / theory-academy：经公共 API

同一语义（提交训练结果 → 更新 ELO/SRS/Emotion/Mentor/Streak）被 6 次重述，drift 风险高。

**问题 G — 与 AGENTS.md 内容重复（原则冲突）**
`AGENTS.md` 明确规定："子代理文件禁止复制知识库中的描述性内容"。但 agent 文件大量重述 AGENTS.md 的编码规范、i18n 规则、trainingEvents 规则、persist version 规则。文档本身已出现"说一套、写一套"的漂移。

### 2.4 信息传递断裂（Fragmentation）

**问题 H — `GRADE_THRESHOLDS` 双源**
`hand-history/workers/gtoWorker.ts` 拷贝了 `shared/types/decisionFeedback.ts` 的 `GRADE_THRESHOLDS`（worker 隔离需要）。靠"改源即同步"工作流 + 约束防护，但**无测试守卫**，阈值变更时极易漏同步。

**问题 I — agent 文件易过时**
跨模块变更后"通知-更新"全靠人工。无脚本验证 agent 文件描述的"模块路径/store action"是否仍存在 → 漂移不可见。

**问题 J — onboarding 复用 QuizCard 无契约**
`onboarding-dev` 复用 `range-trainer/QuizCard` 且仅靠 props，但无契约测试。QuizCard API 变更会静默破坏 onboarding。

**问题 K — trainingEvents 豁免清单散落**
hand-history、help-center 各自声明"豁免 emit"，无集中豁免清单，新增豁免时无统一登记点。

---

## 3. 优化方案（具体调整）

> 原则：**保留 agent 职责边界，只抽取/统一文档样板**；不合并 domain agent（4 个 trainer 领域逻辑各异，合并会失焦）。

### P0 — 高 ROI / 低风险（建议立即执行）

**调整 1：抽取共享基线条款为单源引用** （消除 D / E / G）
- 在 `AGENTS.md` 新增 §「子代理共享基线条款」，集中写入：① "新增页面/组件标准路径"工作流；② 全局约束清单（≤300 行、i18n 双语同步、persist version 规则等）；③ Quality Checklist 基线项。
- 各 feature agent 将对应段替换为一行引用，例如：
  `> 全局约束、标准路径与基线 Quality Checklist 见 AGENTS.md §子代理共享基线条款（禁止在此重述）。`
- 涉及文件：10 个 feature agent（删除重复段） + `AGENTS.md`（新增单源段）。
- 收益：删减每 agent ~25–35 行；全局规则变更只改 1 处。

**调整 2：建立「跨模块能力归属登记表」** （消除 B）
- 在 `AGENTS.md` 或新建 `docs/AGENT_OWNERSHIP.md`，用表格登记所有跨模块能力及其 owner：
  | 能力 | Owner agent | 消费方 |
  |---|---|---|
  | QuickDrill / composeDailyMix | strategy-academy-dev | puzzle-trainer-dev |
  | trainingEvents 豁免 | 各模块自声明 | progress-dev |
  | progress 五系统集成 | progress-dev（统一入口） | 全部 trainer |
- 各 agent 删除"不归我"澄清段，改为"跨模块能力见归属登记表"。
- 涉及文件：`AGENTS.md`/`docs/AGENT_OWNERSHIP.md` + 相关 agent。

**调整 3：统一训练完成集成契约** （消除 F，降低 drift）
- 在 `shared/` 或 `progress` 定义唯一入口（如 `submitTrainingResult(result)` hook），6 个 trainer 统一调用。
- 各 trainer agent 的 Cross-Module Touchpoints 收敛为一句："训练完成统一经 `submitTrainingResult` 提交，集成细节见 progress-dev 契约。" 删去 6 种写法明细。
- 涉及文件：6 个 trainer agent + `progress-dev`（定义契约）。

### P1 — 中 ROI（短期执行）

**调整 4：QuickDrill 归属澄清** （缓解 A）
- 二选一：① 将 QuickDrill 整体迁入 `puzzle-trainer`（更直觉的归属）；② 在归属登记表中明确标注 strategy-academy 为"共享快速训练基础设施" owner，puzzle-trainer 仅消费。推荐 ②（改动小、风险低），并删除 puzzle-trainer 中 3 处重复澄清。

**调整 5：`GRADE_THRESHOLDS` parity 测试** （消除 H 风险）
- 新增 `hand-history/workers/gtoWorkerThresholds.test.ts`，在 vitest 中**同时 import** 源与拷贝并断言相等（测试环境可跨 worker 边界 import）。将"人工同步"升级为"自动守卫"。

**调整 6：双 `generateDailyPlan` 改名/守卫** （消除 C）
- 重命名其一（如 `generateAcademyDailyPlan` vs `generateCrossModulePlan`），或加 lint 守卫禁止同名导出跨模块。

**调整 7：trainingEvents 豁免集中登记** （消除 K）
- 在归属登记表或 `AGENTS.md` 列出豁免 emit 的模块清单（hand-history、help-center），新增豁免统一登记。

### P2 — 流程层（中期）

**调整 8：扩展校验脚本为「agent↔code 一致性校验」**
- 现有 `scripts/validate-agent-tools.ts` 仅校验 tools 字段。扩展为：扫描每个 agent 文件声明的"模块路径/store action 名"，与代码真实存在性比对，CI 中运行。将"人工通知更新"转为"自动发现漂移"（消除 I）。

**调整 9：评估模型分配**
- 对 `platform-dev` 的架构/协调任务评估使用更强模型（如与 ui-ux-dev 同档），轻量编辑保留 flash。明确"按任务复杂度动态选模型"策略，呼应成本优化原则。

---

## 4. 优先级与执行路线

| 优先级 | 调整项 | 涉及文件数 | 风险 | 预期收益 |
|---|---|---|---|---|
| P0 | 1 抽共享基线 | 11 | 低 | 删除 ~300 行重复，单点维护 |
| P0 | 2 归属登记表 | 3+ | 低 | 消除误路由 |
| P0 | 3 统一集成契约 | 7 | 中 | 消除 6 种写法 drift |
| P1 | 4 QuickDrill 澄清 | 2 | 低 | 文档自洽 |
| P1 | 5 阈值 parity 测试 | 1 | 低 | 防静默漂移 |
| P1 | 6 改名/守卫 | 2 | 低 | 防命名碰撞 |
| P1 | 7 豁免登记 | 1 | 低 | 单源豁免 |
| P2 | 8 一致性校验脚本 | 1 | 中 | 自动防漂移 |
| P2 | 9 模型评估 | 0(配置) | 低 | 成本/质量平衡 |

建议执行顺序：**P0-1 → P0-2 → P0-3**（先消除最大冗余与断裂），再 P1，最后 P2。

---

## 5. 风险提示

- **不要合并 domain agent**：4 个 trainer 领域逻辑不同，合并会丧失专业聚焦。优化点在于"文档样板共享"，而非"agent 合并"。
- **抽取共享条款时保留模块特有约束**：每个 agent 的 `不可越界`/`模块特有约束` 段必须保留，仅删除与 AGENTS.md 重复的部分。
- **归属登记表需随代码同步**：登记表本身是新的"单点事实源"，变更跨模块能力时须同步更新，否则成为新的漂移源。
- **P0-3 统一集成契约需先与 progress-dev 对齐**：集成入口是跨模块改动，按 AGENTS.md「跨模块变更协作流程」经 platform-dev 协调后再落地。

---

## 6. 执行状态（2026-08-10 已落地）

| 调整 | 状态 | 落地说明 |
|---|---|---|
| 调整1 抽共享基线 | ✅ 已落地 | AGENTS.md §子代理共享基线条款（标准路径 / 全局约束 / 基线 Checklist）+ 10 个 feature agent 收敛为单源引用，删除约 300 行重复 |
| 调整2 归属登记表 | ✅ 已落地 | AGENTS.md §跨模块能力归属登记表（QuickDrill / 五系统集成 / trainingEvents 豁免 / 阈值 / 双 generateDailyPlan 等） |
| 调整3 统一集成契约（文档层） | ✅ 已落地 | progress-dev 定义「训练结果提交统一契约」单源；6 个 trainer 的 progress store 段收敛为单源引用 + 保留模块特有 colocated recorder 名；代码层接线保持（符合单点事实源与跨模块协调原则） |
| 调整4 QuickDrill 澄清 | ✅ 已落地 | puzzle-trainer 3 处"这不归我"澄清收敛为归属表引用 |
| 调整5 阈值 parity 测试 | ✅ 已落地 | 新增 `gtoWorkerThresholds.test.ts`；worker 阈值重构为导出对象 `WORKER_GRADE_THRESHOLDS` + 防御式 `self` 初始化（可 node import） |
| 调整6 改名消歧 | ✅ 已落地 | progress 侧 `generateDailyPlan` → `generateCrossModuleDailyPlan`（dailyTrainingPlan.ts / index.ts / Dashboard.tsx 3 处）+ 归属表更新 |
| 调整7 豁免集中登记 | ✅ 已落地 | hand-history / help-center 的 trainingEvents 豁免加归属表引用 |
| 调整8 一致性校验脚本 | ✅ 已落地 | `validate-agent-tools.ts` 扩展 agent↔code 模块路径校验（仅 warning，用于自动发现漂移）；12 agent 全合规 |
| 调整9 模型评估 | ⏸ 建议项 | platform-dev 模型分配为成本/质量权衡决策，需人工评估后决定，未自动改 |

**验证结果**：`pnpm typecheck` exit 0；新增 parity 测试 1 passed；`node scripts/validate-agent-tools.ts` 12 agent 全 tools 合规且无路径漂移 warning。

---

## 7. P0-3 代码层复核修正（2026-08-10 二次评估）

> 经逐模块读取 6 个 trainer 真实集成代码（useQuizEngine / useOddsCalculation / useGTOComparison / usePuzzleSession / theoryProgress / quickDrillSrs），**原报告「同一语义 6 种表述」的前提不成立**，结论修正如下。

**事实**：6 个 trainer 并未重写 ELO/SRS/Emotion 逻辑，而是正确调用了**同一中央 store（`progressStore`）+ 共享工具**（`progress/utils/spacedRepetition` 的 `createReviewItem`/`processReview`、`shared/types/decisionFeedback` 的 `calculateGrade`）。各模块真正不同的仅是模块特有胶水：ELO 维度（preflop/math/postflop/level→0.2~0.8）、SRS 复习项 id 与 metadata 映射（`range:pos:hand` / `odds:id` / `gto:spotKey:hand`）、反馈构造口径、逐题 vs 会话级调用时机。这些属于领域知识，**须留在模块内**，上提会破坏 feature 自治与 shared 准入门槛。

**修正结论**：
- `submitTrainingResult(module, …)` 统一入口**不推荐**：要么沦为带 per-module 分支的巨型 dispatcher（耦合 progress store 与各域类型，违反 AGENTS.md），要么只重排公共尾部、留下真正不同的胶水——零收益且 6 处调用点的 blast radius 有静默污染训练统计风险。
- **文档契约统一（§6 调整3 已落地）即本问题的充分解法**：事实单源 + 模块胶水自治，符合 AGENTS.md 哲学。
- **唯一真实字面重复**（非「6 种表述」）是 SRS upsert 四行块 + `quality = isCorrect ? (t<5000?5:4):1` 在 range/odds/gto 重复（quickDrill 已抽 `reviewQualityFor` / `FAST_ANSWER_SECONDS`）。低风险 DRY：将 `answerQuality` 与 `upsertReviewItem` 抽到 `progress/utils/spacedRepetition.ts` 供三模块复用，并统一 `5000` 为 `FAST_ANSWER_SECONDS`。纯函数、可单测、零 blast radius。

**状态**：P0-3 代码层由「deferred/high-risk」**重新分类为「not recommended as scoped」**；文档契约统一保留为正确解法；**可选 DRY 已于 2026-08-10 实施完成**——`spacedRepetition.ts` 新增 `FAST_ANSWER_SECONDS`（单源）、`answerQuality(ms)`、`upsertReviewItem()`；range/odds/gto 三处 SRS 记录器改为调用共享函数（行为等价，含单位统一为 ms）；quickDrillSrs 的 `reviewQualityFor` 与 `FAST_ANSWER_SECONDS` 改为复用共享实现（兼容重导出，单位换算 ×1000）；新增 `spacedRepetition.test.ts`（13 项断言）。`pnpm verify` 全量通过（typecheck/lint/472 tests）。
