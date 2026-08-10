---
name: complete-short-deck-theory-and-strategy
overview: 补全短牌德州（Short Deck）的理论学院与策略学院教学模块：理论学院 T1-T9 共 20 个骨架章节、策略学院 L3-L8 共 16 门骨架课程，风格与已完成的单挑变体及 l3sd-intro 完全一致。采用子代理协作执行机制。
todos:
  - id: theory-t1-t3
    content: 按 theory-academy-dev 规范补全短牌理论学院 T1-T3（9 章）的 objectives/content/quiz 与 practiceRecommendations，引用 l3sd-intro、l3sd-cbet、l4sd-nuts-equity、l4sd-preflop-ranges
    status: completed
  - id: theory-t4-t6
    content: 按 theory-academy-dev 规范补全短牌理论学院 T4-T6（7 章）的 objectives/content/quiz 与 practiceRecommendations，引用 l4sd-preflop-ranges、l4sd-blocker-bluff、l4sd-gto-fundamentals、l4sd-solver-readout、l3sd-cbet、l3sd-donk
    status: completed
  - id: theory-t7-t9
    content: 按 theory-academy-dev 规范补全短牌理论学院 T7-T9（4 章）的 objectives/content/quiz 与 practiceRecommendations，引用 l8sd-exploit-i、l8sd-exploit-ii、l5sd-tilt-control、l5sd-bankroll、l7sd-deep-stack、l7sd-shallow-stack
    status: completed
  - id: strategy-l3-l4
    content: 按 strategy-academy-dev 规范补全短牌策略学院 L3-L4（6 课：C-Bet/Donk/Check-Raise/翻前范围/坚果权益/阻断牌诈唬）的 content/quiz/examples/practice
    status: completed
  - id: strategy-l5-l8
    content: 按 strategy-academy-dev 规范补全短牌策略学院 L5-L8（10 课：GTO/Solver/资金/情绪/锦标赛二/深浅筹码/剥削二）的 content/quiz/examples/practice
    status: completed
  - id: docs-verify
    content: 在 docs/CHANGELOG.md 记录短牌两模块内容补全演进，运行 pnpm verify 确认 typecheck/lint/test 全部通过
    status: completed
    dependencies:
      - theory-t1-t3
      - theory-t4-t6
      - theory-t7-t9
      - strategy-l3-l4
      - strategy-l5-l8
---

## 需求概述

短牌德州（Short Deck / 6+ Hold'em）的游戏变体教学模块在理论学院与策略学院中均未补全：

- **理论学院短牌**：T1-T9 全部 20 个章节均为骨架（content/quiz 为空、缺 objectives、practiceRecommendations 为空）
- **策略学院短牌**：仅 `l3sd-intro` 已完成，其余 L3-L8 共 16 门课程均为骨架（content/quiz/examples/practice 为空）

需参考标准德州扑克规则与短牌特有规则，完整补全两个模块的教学内容，确保语言简洁清晰、风格与已完成的 `l3sd-intro` 及单挑变体课程完全一致。

## 核心功能

- 补全理论学院短牌 T1-T9 共 20 个章节（objectives + content + quiz + practiceRecommendations）
- 补全策略学院短牌 L3-L8 共 16 门课程（content + quiz + examples + practice）

## 内容约束

- 理论学院章节：objectives（3条，"理解/掌握/学会"句式）+ content（TheorySection 七类段落混合，含概念来源标注与反直觉点）+ quiz（4-5题含 explanation）
- 策略学院课程：content（heading 分节 + text/key-point/example/formula/highlight/pro-tip）+ quiz（4-5题）+ examples（HandExample 含 correctDecision/commonMistake/evLoss）+ practice（3-5题含难度分档、evImpact/evLoss、relatedLessonId）
- 以短牌特有规则为锚点：36 张牌（移除 2-5）、同花 > 葫芦、三条 > 顺子、A-6-7-8-9 最小顺子、AK 最强非对子、口袋对价值提升、同花连牌可玩性好但非顶级、Ante 制、outs 按 36 张牌计
- 不改变骨架字段（id/level/order/duration/eloDimension/variant/variantRules/variantContext），确保守卫不回归
- 详尽度与已完成的 l3sd-intro / 单挑变体一致，语言简洁清晰

## 子代理协作执行机制（延续已确认模式）

采用「委派模块子代理 + 主代理协调复核」：

- 主代理（协调者）：加载 theory-academy-dev / strategy-academy-dev 规范，按批次组织执行；对产出做数学复核、结构校验、统一风格后就地写入；最终 pnpm verify
- theory-academy-dev（主责）：理论学院短牌 T1-T9 章节，遵循"内容扩充硬性契约"（7 类段落全覆盖、公式推导、≥2 权威教材引用、版权规避、禁用裸 ASCII 撇号改 U+2019 弯引号）
- strategy-academy-dev（主责）：策略学院短牌 L3-L8 课程，遵循其约束
- platform-dev（跨模块协调）：本次不涉及 shared/层、progress store、learningTracks、路由变更，跨模块需求极小

## 技术方案

### 修改目标

两个数据文件就地填充，均为课程/章节数据文件（可放宽单文件行数限制）：

1. `src/features/theory-academy/data/levels/variants/short-deck.ts` — 补全 T1-T9 共 20 个骨架章节
2. `src/features/strategy-academy/data/lessons/variants/short-deck.ts` — 补全 L3-L8 共 16 门骨架课程

### 实施方式

**理论学院（short-deck.ts）**：按章节对象就地填充三个字段，不触碰 id/level/order/duration/eloDimension/variant/variantRules：

1. `objectives`：3 条，"理解/掌握/学会"句式，与该章 eloDimension 对齐
2. `content: TheorySection[]`：heading/text/key-point/formula/example/highlight/pro-tip 七类混合，每章约 6-9 段；公式含完整推导与"（概念源自：《...》某作者）"标注
3. `quiz: TheoryQuizQuestion[]`：每章 4-5 题，correctIndex 指正确项，explanation 辨析错误项
4. 为 T1-T9 补充 `practiceRecommendations`，引用短牌策略课程 ID（已核实存在）

**策略学院（short-deck.ts）**：按课程对象就地填充四字段，不触碰 id/level/order/duration/variant/variantContext：

1. `content: LessonSection[]`：heading 分节 + text/key-point/example/formula/highlight/pro-tip 混合，约 6-9 段、2-4 heading
2. `quiz: QuizQuestion[]`：4-5 题含 explanation
3. `examples: HandExample[]`：1-2 个，heroHand 用 ['Ah','Kh'] 格式，含 previousActions/street/board/effectiveStack/potSize/correctDecision/commonMistake/evLoss
4. `practice: PracticeDrill`：3-5 题 PracticeQuestion，含难度分档（beginner/intermediate/advanced）、scenario、options（isCorrect/explanation/evImpact/evLoss）、relatedLessonId

### 短牌特有数学锚点（贯穿全部内容）

- **牌组 36 张**：移除 2-5，每花色 9 张
- **牌型重排**：三条 > 顺子、同花 > 葫芦（两处与标准相反）；A-6-7-8-9 最小顺子
- **AK 最强非对子**：口袋对 > 任何 A-K；AK > KQ > ...
- **Outs 重算**：同花听牌 outs = 9 − 已见该花色数；2/4 法则仍可粗估但基数按 36 张牌
- **set mine 价值下降**：短牌中三条牌级低于葫芦/同花，隐含赔率变差，需更高门槛
- **Ante 制**：通常无盲注，所有人投前注 + BTN 投额外 ante

### 各等级内容要点

**理论学院 T1-T9**（以短牌规则为锚点）：

- T1 概率：36 张牌组合数、outs 按 36 张重算、高波动
- T2 赔率：Ante 制底池赔率、隐含赔率（set mine 变差）、反向隐含赔率
- T3 起手：AK 与口袋对价值、同花连牌崛起、位置
- T4 范围：范围组成、多路池权益稀释、挡牌
- T5 GTO：短牌均衡、诈唬频率（同花价值高→诈唬收益）
- T6 下注：尺度选择（传统尺度失效）、连续价值下注
- T7 对手：标准玩家转短牌认知偏差、策略调整
- T8 心理：高波动承受、tilt 控制
- T9 综合：系统整合、职业玩家案例

**策略学院 L3-L8**：

- L3：短牌 C-Bet（干燥/湿滑面）、Donk 下注（翻牌率高）、Check-Raise
- L4A：翻前范围、坚果与权益计算、阻断牌诈唬
- L4B：GTO 基础、Solver 解读
- L5：资金管理（高波动）、情绪控制
- L6：锦标赛（一）（二）
- L7：深筹码、浅筹码（Push/Fold）
- L8：剥削（一）（二）

### 各课程 practiceRecommendations 引用（理论学院 → 策略学院）

- T1 → l3sd-intro / l3sd-cbet
- T2 → l3sd-check-raise / l4sd-nuts-equity
- T3 → l3sd-intro / l4sd-preflop-ranges
- T4 → l4sd-preflop-ranges / l4sd-blocker-bluff
- T5 → l4sd-gto-fundamentals / l4sd-solver-readout
- T6 → l3sd-cbet / l3sd-donk
- T7 → l8sd-exploit-i / l8sd-exploit-ii
- T8 → l5sd-tilt-control / l5sd-bankroll
- T9 → l7sd-deep-stack / l7sd-shallow-stack

### 执行注意

- 补全不改变骨架字段，确保 theoryIntegrity.test.ts 与 curriculumIntegrity.test.ts 守卫不回归
- 理论学院 content 字符串内禁用裸 ASCII 撇号（英文缩写用 U+2019 弯引号，如 Hold'em → Hold’em）
- quiz/practice 选项书写顺序不限（渲染前自动经排序出口处理），correctIndex 指正确项即可
- 内容内嵌中文，不进 i18n，无需更新双语文件
- 完成后运行 `pnpm verify`（typecheck + lint + test）确认门禁通过

### 文档同步

- `docs/CHANGELOG.md`：记录本版本短牌理论学院 T1-T9 + 策略学院 L3-L8 内容补全演进
- `docs/PRD.md`/`docs/TDD.md`：本次仅数据内容补全，无 schema 变更，persist version 无需升级，如无结构变更可不改

## 目录结构

本次仅修改两个数据文件（就地填充），无新增/删除文件：

```
src/features/theory-academy/data/levels/variants/short-deck.ts      # [MODIFY] 补全 T1-T9 共 20 章节的 objectives/content/quiz + practiceRecommendations
src/features/strategy-academy/data/lessons/variants/short-deck.ts   # [MODIFY] 补全 L3-L8 共 16 门课程的 content/quiz/examples/practice
docs/CHANGELOG.md                                                   # [MODIFY] 记录短牌两模块内容补全的版本演进
```

## Agent Extensions

### SubAgent

- **code-explorer**
- Purpose: 在批量填充前，扫描已完成的短牌入门课程（l3sd-intro）与短牌特有规则（shortDeckRules）的完整结构，提取四字段风格基准；核对两个 short-deck.ts 中待补全章节/课程的 id/level/order/eloDimension/variantContext 骨架字段，避免遗漏细节。
- Expected outcome: 输出短牌变体的完整风格基准（理论学院章节七类段落结构与 quiz 写法、策略学院 HandExample/PracticeQuestion 字段格式、短牌特有规则锚点），以及两个文件全部待补全章节/课程的准确骨架字段清单，为主代理组织内容创作与最终写入提供准确依据。