---
name: complete-strategy-academy-heads-up
overview: 补全策略学院（strategy-academy）游戏变体「单挑（Heads-Up）」L3-L8 共 10 个骨架课程（content/quiz/examples/practice），风格与已完成的 l7hu-stakes 完全一致。采用子代理协作执行机制：委派 strategy-academy-dev 按其工作流执行，主代理复核验收。
todos:
  - id: content-l3
    content: 按 strategy-academy-dev 规范补全 L3 翻后策略 3 课（按钮位激进度/SB 持续下注/BB 防守）的 content、quiz、examples、practice，position 用 SB/BB
    status: completed
  - id: content-l4a
    content: 按 strategy-academy-dev 规范补全 L4A 范围与 EV 2 课（按钮位开局加注/EV 调整）的 content、quiz、examples、practice
    status: completed
  - id: content-l4b
    content: 按 strategy-academy-dev 规范补全 L4B GTO 与博弈论 2 课（单挑 GTO 基础/反制策略）的 content、quiz、examples、practice
    status: completed
  - id: content-l5
    content: 按 strategy-academy-dev 规范补全 L5 职业素养 2 课（单挑专注力/对手心理）的 content、quiz、examples、practice
    status: completed
  - id: content-l6-l8
    content: 按 strategy-academy-dev 规范补全 L6 单挑锦标赛与 L8 单挑剥削打法 2 课的 content、quiz、examples、practice
    status: completed
  - id: docs-verify
    content: 在 docs/CHANGELOG.md 记录本版本演进，运行 pnpm verify 确认 typecheck/lint/test 全部通过
    status: completed
    dependencies:
      - content-l3
      - content-l4a
      - content-l4b
      - content-l5
      - content-l6-l8
---

## 需求概述

策略学院（strategy-academy）游戏变体「单挑（Heads-Up）」教学模块已部分完成：`l7hu-stakes`（L7 单挑策略基础）内容完整，而 L3-L8 共 10 个课程仍为骨架（content、quiz、examples、practice 均为空）。本次需参考标准德州扑克规则与单挑特有结构，完整补全这 10 个课程，确保语言简洁清晰、风格与已完成的 `l7hu-stakes` / `l3sd-intro` 完全一致。

## 核心功能

- 补全 L3 翻后策略 3 课：按钮位激进度、SB 持续下注、BB 防守
- 补全 L4A 范围与 EV 2 课：按钮位开局加注、EV 调整
- 补全 L4B GTO 与博弈论 2 课：单挑 GTO 基础、反制策略
- 补全 L5 职业素养 2 课：单挑专注力、对手心理
- 补全 L6 锦标赛策略 1 课：单挑锦标赛
- 补全 L8 高级剥削 1 课：单挑剥削打法

## 内容约束

- 每课程填充 content（heading 分节 + text/key-point/example/formula/highlight/pro-tip 混合）、quiz（4-5 题含 explanation）、examples（1-2 个 HandExample）、practice（3-5 题含难度分档）
- 以单挑特有规则为锚点：SB 强制 0.5 Ante、BB 翻前最后行动、SB 翻后先行动（位置反转）、两人底池、宽范围（SB 开池约 80%、BB 防守 60%+）
- 不改变骨架课程的 id/level/order/duration/variant/variantContext（守卫约束）
- 详尽度与已完成的 l7hu-stakes 一致，语言简洁清晰

## 技术方案

### 修改目标

单一数据文件 `src/features/strategy-academy/data/lessons/variants/heads-up.ts`，就地填充 10 个骨架课程的四字段。该文件为课程数据文件（可放宽单文件行数限制，参考已提交的 heads-up.ts/short-deck.ts 现状），直接在原文件内填充即可。

### 实施方式

按课程对象就地填充四个字段，不触碰 id/level/order/duration/variant/variantContext：

1. `content: LessonSection[]`：以 heading 分节（deriveLessonUnits 按 heading 切分 unit），混合 text/key-point/example/formula/highlight/pro-tip，约 6-9 个段落、2-4 个 heading。
2. `quiz: QuizQuestion[]`：每课 4-5 题，question/options/correctIndex/explanation，correctIndex 指向正确项，explanation 辨析错误项。
3. `examples: HandExample[]`：每课 1-2 个，heroHand 用 ['Ah','Kh'] 格式、position 用 'SB'/'BB'（单挑无 BTN，按钮位归属 SB），含 previousActions/street/board/effectiveStack/potSize/correctDecision（action+reasoning[]）/commonMistake（action+reasoning+evLoss）。
4. `practice: PracticeDrill`：每课 3-5 题 PracticeQuestion，含 difficulty（beginner/intermediate/advanced）、scenario（heroHand/heroPosition/previousActions/street/board/potSize/effectiveStack/gameContext）、options（action/isCorrect/explanation/evImpact/evLoss）、relatedLessonId。

### 各课程内容要点（依据单挑特有结构与标准德扑理论）

- **l3hu-bn-aggression（按钮位激进度）**：SB（BTN）翻前最后行动 + 翻后先行动的频率优势，高频开池约 80%、翻后持续施压、C-Bet 频率与尺度。
- **l3hu-sb-continuation（SB 持续下注）**：单挑 SB 翻后 OOP 的 C-Bet 尺度/频率/范围，位置反转下 OOP 下注纪律、混合 check 保留 x/r 杠杆。
- **l3hu-bb-defense（BB 防守）**：BB 翻后 IP 的宽范围防守（60%+）、过牌加注（x/r）构建范围、不利位置控制与 MDF 底线。
- **l4hu-bn-opening（按钮位开局加注）**：单挑 BTN（SB）接近 100% 开池频率与尺度调整，min-raise 为主的数学依据。
- **l4hu-ev-adjustments（EV 调整）**：两人底池 EV 计算差异、决策简化、翻前偷盲 EV 与翻后位置 EV 锚点。
- **l4hu-gto-basics（单挑 GTO 基础）**：单挑二人零和博弈均衡、频率基准（MDF/价值:诈唬比）、位置对称性与不可剥削。
- **l4hu-counter-strategies（反制策略）**：针对单挑对手常见偏离（弃牌过多/跟注过松）的 GTO 反制与再调整框架、节点锁定。
- **l5hu-focus（单挑专注力）**：高速决策节奏下的专注、状态管理与疲劳控制，避免 tilt。
- **l5hu-opponent-psychology（对手心理）**：心理博弈、下注节奏/反应时间/行为模式解读与反读取。
- **l6hu-tourney（单挑锦标赛）**：SNG/MTT 决赛桌筹码节奏、ICM 压力、盲注上涨与筹码攻防（variantContext.stackDepth=40）。
- **l8hu-exploitative（单挑剥削打法）**：频率读取、范围极化与动态调整、从 GTO 基线做最小必要偏离。

### 子代理协作执行机制（延续前一任务，用户已确认）

- **主代理（协调者）**：加载 `.claude/agents/strategy-academy-dev.md` 规范，提炼 l7hu-stakes 风格模板；按批次对产出做数学准确性复核（formula/evImpact 抽算）、结构校验（heading 分节、quiz 4-5 题、examples/practice 字段完整、heroHand/board/potSize 一致性、position 用 SB/BB）；统一风格后就地写入 heads-up.ts；最终运行 pnpm verify。
- **strategy-academy-dev（主责）**：承担 heads-up.ts 变体课程内容补全，遵循其约束（课程数据为静态、选项书写顺序不限但 correctIndex 正确、分布守卫覆盖新题）。
- **platform-dev（跨模块协调）**：本次不涉及 shared/层、progress store、路由变更，learningTracks 无单挑引用，跨模块需求极小；如有课程 ID 语义核对经其把关。

### 执行注意

- 补全不改变骨架课程的 id/level/order/duration/variant/variantContext，确保 `curriculumIntegrity.test.ts` 守卫不回归（ID 唯一、l{level}hu- 格式、variantContext 合法、不混入 LEVELS）。
- quiz/practice 选项书写顺序不限（渲染前自动经 orderQuizQuestion/orderDrillOptions 重排），correctIndex 指正确项即可。
- 内容为数据内嵌中文，不进 i18n，无需更新双语文件。
- 完成后运行 `pnpm verify`（typecheck + lint + test）确认门禁通过。

### 文档同步

- `docs/CHANGELOG.md`：记录本版本单挑策略学院 L3-L8 内容补全的演进。
- `docs/PRD.md`/`docs/TDD.md`：本次仅数据内容补全，无 schema 变更，persist version 无需升级，如无结构变更可不改。

## 目录结构

本次仅修改一个数据文件（就地填充），无新增/删除文件：

```
src/features/strategy-academy/data/lessons/variants/heads-up.ts  # [MODIFY] 补全 10 个骨架课程的 content/quiz/examples/practice
docs/CHANGELOG.md                                                 # [MODIFY] 记录单挑策略学院 L3-L8 内容补全的版本演进
```

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在批量填充前，用于扫描 `l7hu-stakes` 与 `l3sd-intro` 的完整课程结构（段落类型分布、examples/practice 的字段格式、quiz 数量与 explanation 写法），以及核对 heads-up.ts 中 10 个骨架课程的 id/level/order/variantContext，提取统一风格模板并确认补全不触碰的骨架字段，避免遗漏细节。
- Expected outcome: 输出策略学院单挑课程的四字段风格基准（heading 分节结构、HandExample/PracticeQuestion 字段完整格式、quiz 数量与 explanation 写法），以及 10 个待补全课程的准确骨架字段清单（id/level/order/duration/variant/variantContext），为主代理组织内容创作与最终写入提供准确依据。