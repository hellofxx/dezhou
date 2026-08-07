---
name: complete-theory-academy-heads-up
overview: 补全理论学院游戏变体「单挑（Heads-Up）」T4-T9 共 13 个骨架章节的教学内容，与 T1-T3 已完成的课程风格完全一致，语言简洁清晰。
---

我已经完整掌握了任务所需的全部信息。现在我清楚了：

- 需要补全 heads-up.ts 中 T4-T9 共 13 个骨架章节
- 现有可引用的 strategy-academy 单挑课程 ID：`l3hu-bn-aggression`、`l3hu-sb-continuation`、`l3hu-bb-defense`、`l4hu-bn-opening`、`l4hu-ev-adjustments`、`l4hu-gto-basics`、`l4hu-counter-strategies`、`l5hu-focus`、`l5hu-opponent-psychology`、`l6hu-tourney`、`l7hu-stakes`、`l8hu-exploitative`

任务不涉及新 UI 或大幅 UI 改动（纯数据内容补全），因此不需要 `<design>` 标签。技术实现相对直接（数据文件内容填充）。不涉及相关扩展。现在生成计划。

<plan_result>
<req>

## 需求概述

理论学院（theory-academy）游戏变体中的"单挑（Heads-Up）"教学模块已部分完成：T1-T3 等级（9 个章节）内容完整，而 T4-T9 等级（13 个章节）仍为骨架（content 与 quiz 为空、缺 objectives）。本次需参考标准德州扑克规则与单挑特有结构，完整补全 T4-T9 的教学内容，确保语言简洁清晰、风格与已完成的 T1-T3 完全一致。

## 核心功能

- 补全 T4 范围构建（3 章）：范围宽度、两极化范围、挡牌应用
- 补全 T5 GTO 基础（2 章）：GTO 核心思想、频率平衡
- 补全 T6 下注工程（2 章）：最优下注尺、多条 streets
- 补全 T7 对手剥削（2 章）：对手模式识别、针对性调整
- 补全 T8 心理战（2 章）：压力管理、心理读取
- 补全 T9 理论大师（2 章）：全面整合、职业选手研究

## 内容约束

- 每章节填充 objectives、content（heading/text/key-point/formula/example/highlight/pro-tip 混合结构）、quiz（4-5 题，含 explanation）
- 以单挑变体特有规则为锚点：SB 强制 0.5 Ante、BB 翻前最后行动、SB 翻后先行动（位置反转）、两人底池无多人稀释、宽范围（60%+）
- 不改变已有骨架的 id/level/order/duration/eloDimension（守卫测试约束）
- 保持 T1-T3 的内容风格：概念来源标注、反直觉点、实例推演、pro-tip 口诀
</req>

<tech>

## 技术方案

### 修改目标

单一数据文件 `src/features/theory-academy/data/levels/variants/heads-up.ts`，追加 T4-T9 的 13 个章节内容。该文件为数据文件，已超 300 行硬约束（现有已提交豁免），直接在原文件内填充即可，无需拆分。

### 实施方式

按章节对象就地填充三个字段：

1. `objectives`：3 条左右，"理解/掌握/学会"句式，与该章 eloDimension 对齐。
2. `content: TheorySection[]`：沿用 TheorySectionType 七种类型，每章约 6-9 个段落。结构遵循 T1-T3 模板：heading 引入 → text 阐述 → key-point 关键点 → formula 数学推导（含"（概念源自：《...》某作者）"标注）→ example 实例（手牌+具体数字推演）→ highlight 反直觉点 → pro-tip 实战口诀。
3. `quiz: TheoryQuizQuestion[]`：每章 4-5 题，correctIndex 指向正确项，explanation 解释正确原因并辨析错误项。

### 各等级内容要点（依据单挑特有结构与标准德扑理论）

- **T4 范围构建**：单挑 SB/BB 双位置范围宽度（SB 开池约 80%、BB 防守 60%+）、极化 vs 线性范围在下注中的意义、挡牌（Blocker）在单挑宽范围中的阻断价值。practiceRecommendations 可引用 `l4hu-gto-basics`、`l4hu-bn-opening`。
- **T5 GTO 基础**：单挑二人零和博弈的纳什均衡适用性、价值:诈唬比与下注尺度、MDF 与频率平衡。引用 `l4hu-gto-basics`、`l4hu-counter-strategies`。
- **T6 下注工程**：单挑多街下注尺度的选择（小注控池、超池极化）、连开三枪的协调、SPR 与街间底池几何。引用 `l3hu-bn-aggression`、`l3hu-sb-continuation`。
- **T7 对手剥削**：识别单挑玩家常见倾向（跟注站/nit/疯鱼）、从 GTO 基线做最小必要偏离、node locking。引用 `l4hu-counter-strategies`、`l8hu-exploitative`。
- **T8 心理战**：单挑高压高频下的情绪与波动管理、读取与反读取、避免 tilt。引用 `l5hu-focus`、`l5hu-opponent-psychology`。
- **T9 理论大师**：整合全部技能构建个人单挑体系、职业选手决策逻辑研究。引用 `l7hu-stakes`、`l6hu-tourney`。

### 执行注意

- 每个新增 chapter id 已存在，直接填充字段，不触碰 id/level/order/duration/eloDimension/variant/variantRules，确保 `theoryIntegrity.test.ts` 守卫不回归。
- practiceRecommendations 中的 lesson id 必须使用 strategy-academy `data/lessons/variants/heads-up.ts` 中真实存在的 ID（已核实：l3hu-bn-aggression、l3hu-sb-continuation、l3hu-bb-defense、l4hu-bn-opening、l4hu-ev-adjustments、l4hu-gto-basics、l4hu-counter-strategies、l5hu-focus、l5hu-opponent-psychology、l6hu-tourney、l7hu-stakes、l8hu-exploitative）。
- 内容为数据内嵌中文，不涉及 i18n key，无需更新双语文件。
- 完成后运行 `pnpm verify`（typecheck + lint + test）确认门禁通过。

### 文档同步

按 AGENTS.md 文档维护约定，涉及 theory-academy 模块内容扩充，需在 `docs/CHANGELOG.md` 记录本版本单挑变体 T4-T9 内容补全的演进；`docs/PRD.md`/`docs/TDD.md` 如无结构变更可不改（本次仅数据内容补全，无 schema 变更，persist version 无需升级）。

## 目录结构

本次仅修改一个数据文件（就地填充），无新增/删除文件：

```
src/features/theory-academy/data/levels/variants/heads-up.ts  # [MODIFY] 补全 T4-T9 共 13 章节的 objectives/content/quiz，并为 T4-T9 的 practiceRecommendations 补充真实存在的单挑策略课程引用
docs/CHANGELOG.md                                             # [MODIFY] 记录单挑变体 T4-T9 内容补全的版本演进
```

</tech>

<todolist>
<item id="content-t4" deps="">补全 T4 范围构建 3 章（范围宽度/两极化/挡牌）的 objectives、content、quiz，并补充 practiceRecommendations 引用 l4hu-gto-basics、l4hu-bn-opening</item>
<item id="content-t5" deps="">补全 T5 GTO 基础 2 章（GTO 核心思想/频率平衡）的 objectives、content、quiz，引用 l4hu-gto-basics、l4hu-counter-strategies</item>
<item id="content-t6" deps="">补全 T6 下注工程 2 章（最优下注尺/多条 streets）的 objectives、content、quiz，引用 l3hu-bn-aggression、l3hu-sb-continuation</item>
<item id="content-t7" deps="">补全 T7 对手剥削 2 章（对手模式识别/针对性调整）的 objectives、content、quiz，引用 l4hu-counter-strategies、l8hu-exploitative</item>
<item id="content-t8" deps="">补全 T8 心理战 2 章（压力管理/心理读取）的 objectives、content、quiz，引用 l5hu-focus、l5hu-opponent-psychology</item>
<item id="content-t9" deps="">补全 T9 理论大师 2 章（全面整合/职业选手研究）的 objectives、content、quiz，引用 l7hu-stakes、l6hu-tourney</item>
<item id="docs-verify" deps="content-t4,content-t5,content-t6,content-t7,content-t8,content-t9">在 docs/CHANGELOG.md 记录本版本演进，并运行 pnpm verify 确认 typecheck/lint/test 全部通过</item>
</todolist>
</plan_result>