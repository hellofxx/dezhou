---
name: complete-theory-academy-heads-up
overview: 补全理论学院游戏变体「单挑（Heads-Up）」T4-T9 共 13 个骨架章节的教学内容。采用子代理协作执行机制：委派 theory-academy-dev 按工作流 7 步执行，主代理复核验收。内容详尽程度与已完成的 T1-T3 完全一致。
---

我已根据上下文充分理解了任务。现在基于用户已确认的两点决策（委派 theory-academy-dev 子代理执行 + 内容与 T1-T3 一致），生成最终计划。

本任务为纯数据内容补全，不涉及新 UI 或大幅 UI 改动，因此不需要 `<design>` 标签。任务将使用 `theory-academy-dev` 子代理规范作为执行机制。

<plan_result>
<req>

## 需求概述

理论学院（theory-academy）游戏变体「单挑（Heads-Up）」教学模块已部分完成：T1-T3 等级（9 个章节）内容完整，而 T4-T9 等级（13 个章节）仍为骨架（content 与 quiz 为空、缺 objectives）。本次需参考标准德州扑克规则与单挑特有结构，完整补全 T4-T9 的教学内容，确保语言简洁清晰、风格与已完成的 T1-T3 完全一致。

## 核心功能

- 补全 T4 范围构建（3 章）：范围宽度、两极化范围、挡牌应用
- 补全 T5 GTO 基础（2 章）：GTO 核心思想、频率平衡
- 补全 T6 下注工程（2 章）：最优下注尺、多条 streets
- 补全 T7 对手剥削（2 章）：对手模式识别、针对性调整
- 补全 T8 心理战（2 章）：压力管理、心理读取
- 补全 T9 理论大师（2 章）：全面整合、职业选手研究

## 内容约束

- 每章填充 objectives、content（heading/text/key-point/formula/example/highlight/pro-tip 混合结构）、quiz（4-5 题，含 explanation）
- 以单挑变体特有规则为锚点：SB 强制 0.5 Ante、BB 翻前最后行动、SB 翻后先行动（位置反转）、两人底池无多人稀释、宽范围（60%+）
- 不改变已有骨架的 id/level/order/duration/eloDimension（守卫测试约束）
- 保持 T1-T3 的内容风格：概念来源标注、反直觉点、实例推演、pro-tip 口诀，详尽度与 T1-T3 一致

## 协作机制

采用「委派 theory-academy-dev + 主代理协调复核」的子代理协作执行机制：主代理加载 `.claude/agents/theory-academy-dev.md` 作为执行规范，按其内容扩充标准工作流与 Quality Checklist 组织 13 章节的内容创作、数学复核、守卫校验与整合写入；跨模块 practiceRecommendations 课程 ID 经 platform-dev 协调确认已登记。

</req>

<tech>

## 技术方案

### 修改目标

单一数据文件 `src/features/theory-academy/data/levels/variants/heads-up.ts`，就地填充 T4-T9 的 13 个骨架章节内容。该文件为数据文件，已超 300 行硬约束（现有已提交豁免），直接在原文件内填充，无需拆分。

### 实施方式

按章节对象就地填充三个字段，不触碰已有骨架的 id/level/order/duration/eloDimension/variant/variantRules：

1. `objectives`：3 条左右，「理解/掌握/学会」句式，与该章 eloDimension 对齐。
2. `content: TheorySection[]`：沿用 TheorySectionType 七种类型（heading/text/key-point/formula/example/highlight/pro-tip），每章约 6-9 个段落，覆盖全部 7 类段落（禁止纯 text 堆砌）。
3. `quiz: TheoryQuizQuestion[]`：每章 4-5 题，correctIndex 指向正确项，explanation 解释正确原因并辨析错误项。

### 各等级内容要点（依据单挑特有结构与标准德扑理论）

- **T4 范围构建**：单挑 SB/BB 双位置范围宽度（SB 开池约 80%、BB 防守 60%+）、极化 vs 线性范围在下注中的意义、挡牌（Blocker）在单挑宽范围中的阻断价值。引用 `l4hu-gto-basics`、`l4hu-bn-opening`。
- **T5 GTO 基础**：单挑二人零和博弈的纳什均衡适用性、价值:诈唬比与下注尺度、MDF 与频率平衡。引用 `l4hu-gto-basics`、`l4hu-counter-strategies`。
- **T6 下注工程**：单挑多街下注尺度（小注控池、超池极化）、连开三枪协调、SPR 与街间底池几何。引用 `l3hu-bn-aggression`、`l3hu-sb-continuation`。
- **T7 对手剥削**：识别单挑玩家常见倾向（跟注站/nit/疯鱼）、从 GTO 基线做最小必要偏离、node locking。引用 `l4hu-counter-strategies`、`l8hu-exploitative`。
- **T8 心理战**：单挑高压高频下的情绪与波动管理、读取与反读取、避免 tilt。引用 `l5hu-focus`、`l5hu-opponent-psychology`。
- **T9 理论大师**：整合全部技能构建个人单挑体系、职业选手决策逻辑研究。引用 `l7hu-stakes`、`l6hu-tourney`。

### 子代理协作执行机制

- **主代理（协调者）**：加载 `theory-academy-dev` 规范，按 Workflow 6「内容扩充标准工作流（7 步）」组织执行；提炼 T1-T3 风格模板；对每批产出做数学准确性复核（抽算公式数值）、7 类段落契约校验、quiz 3-5 题与 ID 前缀校验；统一风格后就地写入 heads-up.ts。
- **theory-academy-dev（主责）**：内容补全，遵循「内容扩充硬性契约」——关键公式展示推导过程、每章至少 2-3 个不同场景实战牌例、标注反直觉点与认知误区（highlight）、教材对照索引与版权规避（思想复述 +「（概念源自：XXX 教材 YY 章）」脚注式标注，禁止逐字复制；字符串内禁用裸 ASCII 撇号，一律用 U+2019 弯引号）。
- **platform-dev（跨模块协调）**：确认 practiceRecommendations 引用的 strategy-academy 课程 ID 已登记在 `curriculumIntegrity.test.ts` 的 `CROSS_MODULE_LESSON_IDS` 清单（已核实 l7hu-stakes 等 ID 存在且 l7hu-stakes 已登记；若引用新 ID 须补登记）。
- **strategy-academy-dev（数据协调）**：仅核对 practiceRecommendations 课程 ID 语义，经 platform-dev 间接协调，不直接修改 strategy-academy 模块。

### 执行注意

- 补全不改变 id/level/order/duration/eloDimension/variant/variantRules，确保 `theoryIntegrity.test.ts` 守卫不回归。
- 内容为数据内嵌中文，不涉及 i18n key，无需更新双语文件。
- 完成后运行 `pnpm verify`（typecheck + lint + test）确认门禁通过。
- 按 theory-academy-dev 的 Quality Checklist 逐项核对（integrity / quizOrder / ID 前缀 / 段落非空 / 版权与引号）。

### 文档同步

- `docs/CHANGELOG.md`：记录本版本单挑变体 T4-T9 内容补全的演进。
- `docs/PRD.md`/`docs/TDD.md`：本次仅数据内容补全，无 schema 变更，persist version 无需升级，如无结构变更可不改。

## 目录结构

本次仅修改一个数据文件（就地填充），无新增/删除文件：

```
src/features/theory-academy/data/levels/variants/heads-up.ts  # [MODIFY] 补全 T4-T9 共 13 章节的 objectives/content/quiz，并为 T4-T9 的 practiceRecommendations 补充真实存在的单挑策略课程引用
docs/CHANGELOG.md                                             # [MODIFY] 记录单挑变体 T4-T9 内容补全的版本演进
```

</tech>

<extensions>

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在补全前用于对现有单挑章节（T1-T3）与标准 level（theoryLevel4-9）的章节结构、段落类型分布、公式与 quiz 风格进行快速扫描比对，提取统一风格模板，并核对 strategy-academy 单挑课程 ID 清单，避免遗漏细节。
- Expected outcome: 输出 T1-T3 单挑章节的完整风格基准（段落顺序、7 类段落覆盖、quiz 数量与 explanation 写法、objectives 句式），以及 T4-T9 各章节对应的可引用课程 ID 清单，为主代理组织子代理内容创作提供准确依据。

### Skill

- 本任务为纯数据内容补全（数据内嵌中文，不进 i18n），不涉及数学建模工作流、PPT/PDF/docx 等技能，上下文中其他 skills 与本任务无直接关联，故不选用。

</extensions>

<todolist>
<item id="content-t4" deps="">按 theory-academy-dev 规范补全 T4 范围构建 3 章（范围宽度/两极化/挡牌）的 objectives、content、quiz，并补充 practiceRecommendations 引用 l4hu-gto-basics、l4hu-bn-opening</item>
<item id="content-t5" deps="">按 theory-academy-dev 规范补全 T5 GTO 基础 2 章（GTO 核心思想/频率平衡）的 objectives、content、quiz，引用 l4hu-gto-basics、l4hu-counter-strategies</item>
<item id="content-t6" deps="">按 theory-academy-dev 规范补全 T6 下注工程 2 章（最优下注尺/多条 streets）的 objectives、content、quiz，引用 l3hu-bn-aggression、l3hu-sb-continuation</item>
<item id="content-t7" deps="">按 theory-academy-dev 规范补全 T7 对手剥削 2 章（对手模式识别/针对性调整）的 objectives、content、quiz，引用 l4hu-counter-strategies、l8hu-exploitative</item>
<item id="content-t8" deps="">按 theory-academy-dev 规范补全 T8 心理战 2 章（压力管理/心理读取）的 objectives、content、quiz，引用 l5hu-focus、l5hu-opponent-psychology</item>
<item id="content-t9" deps="">按 theory-academy-dev 规范补全 T9 理论大师 2 章（全面整合/职业选手研究）的 objectives、content、quiz，引用 l7hu-stakes、l6hu-tourney</item>
<item id="docs-verify" deps="content-t4,content-t5,content-t6,content-t7,content-t8,content-t9">经 platform-dev 确认 practiceRecommendations 课程 ID 已登记，在 docs/CHANGELOG.md 记录演进，运行 pnpm verify 确认 typecheck/lint/test 全部通过</item>
</todolist>
</plan_result>