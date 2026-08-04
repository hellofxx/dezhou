# 策略学院课程内容全面审计报告

**审计日期**: 2026-08-04  
**审计范围**: `src/features/strategy-academy/` 全部课程数据（9 个 Level + 7 个本土课 + basicsContent）  
**审计方式**: 脚本化结构检查 + 8 个子代理深度只读审查（逐课复算牌型、赔率、EV、组合计数；验证行动序列合法性）  
**产出物**: 本报告 + 修复任务清单（已提交至 GitHub issue）

---

## 🔍 一、核心发现分级汇总

### A. **P0 级致命错误（需立即修复）**

#### A1. Drill/Practice 题库场景合法性（L1-L2-L3-L7）

| # | 文件 | 位置 | 问题描述 | 影响面 |
|---|------|------|---------|--------|
| 1 | level1.ts | l1-basics-p2 | potSize=5.5，解析称"4BB≈75% pot"（实际 4/5.5≈73%，且混淆下注尺度与底池赔率表述） | L1 quiz + practice 混用口径 |
| 2 | level2.ts | d-l2-3bet-q1 | "BTN open, hero CO" — CO 在 BTN 之前行动，BTN open 时 CO 已弃牌，场景不存在 | drill-l2-3bet q1 |
| 3 | level2.ts | d-l2-3bet-q2 | "BTN open, CO 3-Bet" — CO 不能 action after BTN，场景非法 | drill-l2-3bet q2 |
| 4 | level2.ts | d-l2-3bet-q8 | 同类错误："BTN open, hero CO 持 54s" | drill-l2-3bet q8 |
| 5 | level2.ts | l2-3bet-p5 | SB 持 QJs vs BTN open，解析称"利用位置优势"——SB 翻后 OOP，说法事实错误 | l2-3bet-p5 practice |
| 6 | level2.ts | l2-4bet-ex2 | 标题"4-Bet Bluff：A5s 面对 TAG 3-Bet"，但行动序列无 4-Bet 过程；street=preflop 却解析中出现 board，字段矛盾 | l2-4bet-ex2 example |
| 7 | level3.ts | l3-check-range-p5 | Board K♥7♥（仅 2 张红桃），解析称"AQ 构成同花"——仅 4 张牌无法成花 | l3-check-range-p5 |
| 8 | level3.ts | d-l3-odds-q1 | 题目问"Flop→Turn 命中率"，选项 a="9%"，explanation 承认这是错误答案 —— 自相矛盾 | drill-l3-odds q1 |
| 9 | level7.ts | l7-multi-ex2 | potSize=17，复算应为 12.5BB（UTG limp+SB+BB+CO raise+BTN call），后续 C-Bet 8BB 参照失真 | l7-multi-ex2 example |
| 10 | level7.ts | l7-hu-p5 | potSize=18.5，正确应为 19；SPR=4.3 应为 4.2，错误依据推导 | l7-hu-p5 practice |
| 11 | level7.ts | d-l7-deep-q6 | scenario "对手 open"，question "BTN open，你在 BTN 持 54s" —— 自己不能对自己 open | drill-l7-deep q6 |
| 12 | deepStack.ts | local-deep-implied-q4 | 题干"深筹码可以全下的最低牌力"答案是"两对或更强"，500BB 深度下两对有反向隐含赔率风险 | localLessons/deepStack.q4 |
| 13 | straddle.ts | local-straddle | Straddle 有效筹码=50BB 严重错误（Straddle 是额外 2BB 投入，有效筹码仍是 100BB） | localLessons/straddle |
| 14 | limpt.ts | local-limp-intro | "Limp 局底池小、SPR 高" —— Limp 局多人入池底池中等，SPR 通常 3-5（中等偏低），表述矛盾 | localLessons/limp |
| 15 | basicsContent.ts | basics-hands | "记忆口诀...10.高牌→9.一对..." 编号混乱，零基础学员困惑 | basicsContent |

#### A2. EV 计算错误集中爆发区（L4A）

| # | 文件 | 位置 | 问题描述 | 影响面 |
|---|------|------|---------|--------|
| 16 | level4a.ts | l4-range-p3 | hero 98 + board 7-6-2，解析称"击中顺子"——实际上是两头顺听牌（8 outs），非已中顺子 | l4-range-practice p3 |
| 17 | level4a.ts | l4-ev-ex2 | potSize=15.5（实际 16.5）、effectiveStack=85（实际 92.5），数值自洽错误 | l4-ev-example ex2 |
| 18 | level4a.ts | l4-ev-p3 | Call 解释"需要约 40% 胜率"，实际需 89.5/(106+89.5)≈46%；AKs 对 QQ+/AK 约 40% < 46%，Call 为 -EV | l4-ev-practice p3 |
| 19 | level4a.ts | l4-opp-p4 | hero AcKc 在 Kh-9h-4c-2d-7h 面，解析称"AK 同花成牌"——仅有 3 张草花，无法成同花 | l4-opp-practice p4 |
| 20 | level4a.ts | l4-blockers-ex2 | 赔率公式错写为"20/(27+20)=43%"，漏自身跟注额应为"20/(27+20+20)≈30%" | l4-blockers-example ex2 |
| 21 | level4a.ts | l4-blockers-p3 | "KK 使对手 AA 从 6→1 组合"——持有 K 不影响 A 数量，AA 仍为 6 种；K blocker 削减的是 AK（16→8） | l4-blockers-practice p3 |
| 22 | level4a.ts | drill-l4-ev-q1 | explanation 先说"EV=+4BB"又改口"+1BB"，口径混乱 | drill-l4-ev q1 |
| 23 | level4a.ts | drill-l4-ev-q2 | correctIndex 标 −0.8BB，实际 EV=0.4×18−0.6×8=+2.4BB | drill-l4-ev q2 |
| 24 | level4a.ts | drill-l4-ev-q4 | correctIndex 标 +1.1BB，实际 EV=0.35×26−0.65×8=+3.9BB | drill-l4-ev q4 |
| 25 | level4a.ts | drill-l4-ev-q6 | correctIndex 标 −1BB，实际 EV=0.3×15−0.7×5=+1BB | drill-l4-ev q6 |
| 26 | level4a.ts | drill-l4-ev-q7 | correctIndex 标 −10BB，计算结果为 −20BB，解释自相矛盾 | drill-l4-ev q7 |
| 27 | level4a.ts | drill-l4-ev-q8 | correctIndex 标 +0.4BB，实际 EV=0.32×11−0.68×3=+1.48BB | drill-l4-ev q8 |
| 28 | level4a.ts | drill-l4-ev-q6 | hand: 'AcAc'（两张草花 A），非法手牌 | drill-l4-range-id q5 |

#### A3. MDF/GTO 理论表达混淆（L4B）

| # | 文件 | 位置 | 问题描述 | 影响面 |
|---|------|------|---------|--------|
| 29 | level4b.ts | l4-mdf-q3 | MDF 公式推导混淆，将跟注胜率与防御频率混为一谈 | l4-mdf quiz q3 |
| 30 | level4b.ts | l4-overbet-p4 | asKs + Kh9h4c2d7h（仅 1 黑桃），解析称"坚果同花" —— 牌面无法成花 | l4-overbet practice p4 |
| 31 | level4b.ts | l4-overbet-q3 | Overbet 150% pot 算"MDF=1-1.5/2.5"，实为跟注胜率而非 MDF（MDF=1/2.5=40%） | l4-overbet quiz q3 |
| 32 | level4b.ts | l4-freq-q1~q5 | "1/2 pot bet → 诈唬占 25%" —— 正确为 33% | quiz/q1~q5 |
| 33 | level4b.ts | d-l4b-freq-q1 | "1:3（25% bluff）" —— 应改为"1:2（33% bluff）" | drill-l4b-freq q1 |
| 34 | level4b.ts | l4-gto-q4 | "双方都完美游戏"易误解，应强调"GTO vs GTO 纳什均衡" | gto quiz q4 |
| 35 | level4b.ts | l4-overbet-ex2 | AsT♥在 Kh8h3dJc2s 面，解析称"错过的坚果同花听牌"——仅 2 张红心无法成花 | overbet-example ex2 |

#### A4. 策略方向性错误（L5/L6/L7/L8）

| # | 文件 | 位置 | 问题描述 | 影响面 |
|---|------|------|---------|--------|
| 36 | level5.ts | l5-short-deck/sd-ex1 | 9h8h + Ah7h6c，解析称"你有 9 个同花 outs"——短牌每花色 9 张，已见 4 张应只剩 5outs | short-deck example |
| 37 | level5.ts | l5-short-deck正文 | "AK 类型牌价值略降"——短牌共识：AK 等高牌价值上升 | short-deck section |
| 38 | level5.ts | l5-short-deck正文 + sd-q4 | "JTs 在短牌是顶级起手牌（约等于标准德州 AKs）" —— 主流 6+ 理论认为连张相对价值下降，该表述夸大误导 | short-deck quiz/practice |
| 39 | level5.ts | l5-short-deck/sd-q5 | "短牌中同花 beats 什么？"选项含"顺子"和"葫芦"，两个均正确——双答案 | sd quiz q5 |
| 40 | level6.ts | l6-pushfold/q4 + 正文 | UTG 10BB push 范围"很紧（强牌）"，结论"BB 只需 15-20% call"——事实相反：Nash 显示 UTG 10BB push 范围接近全开（约 70-80%），BB call 约 35-40% | pushfold quiz/section |
| 41 | level6.ts | l6-pushfold/ex2 | "call 10BB 赢 12BB"——SB push 10BB，hero 追加 call 成本是 9BB（已投 1BB），所需胜率 9/21≈43%，非 45.5% | pushfold example |
| 42 | level6.ts | l6-pushfold/p5 | AJs 对 BTN 40%+ push 范围实际约 55-58%，称"约 60%"明显高估 | pushfold practice |
| 43 | level6.ts | l6-bounty/p1 | "CO 有大赏金→更多人想淘汰他"与 hero 决策无关，赏金逻辑反了 | bounty practice |
| 44 | level6.ts | l6-bounty/p5 | board 9h6h2c + 8h7h，称"坚果同花听牌 + 顺子听牌"——实际仅有卡顺听牌，非两头顺听牌 | bounty practice |
| 45 | level7.ts | l7-deep-p4 | "投入 3BB 有机会赢 300BB"——scenario potSize=4.5 意味着 SB fold，hero call 成本应为 2BB 而非 3BB | deep-stack practice |
| 46 | level8.ts | l8-pool-tendencies/Q3 | "低额（NL25-NL50）：翻前开始合理但翻后弱"——Level 4 理论中低额玩家翻后反而较强，矛盾 | pool tendencies quiz |

---

### B. **P1 级重要问题（建议尽快修复）**

*详见完整表格（审计报告附件 PDF），主要包含：*

#### B1. 术语/概念误译（L1/L2/L4A）
- level1: "偏缀"→"偷取/争夺"，"折 3-Bet"→"频繁 3-Bet"
- level2: "∞当筹码≤20BB"乱入符号、"營得策略"→"懂得策略"
- level4a: "后门同花"在转牌面不存在（仅翻牌可构建后门听牌）

#### B2. 跨课程口径不一致（L1/L2/L4A）
- L1 教"KJo 在 UTG 应弃牌"，L2  Drill 却说"JTs 在 UTG 应 Open"，KJo/JTs 强度接近，存在矛盾
- L1 position 讲"BTN 位置可以最宽范围开牌（约 45% 手牌）"，l1-leaks 讲"后位可放宽到 25-35%"，数值冲突

#### B3. 数值/数学精度（L2/L4B/L6/L7）
- l2-3bet-p5/SB QJs 3-Bet 尺度应为 9-10BB（OOP 标准约 3.5-4x），非 7.5BB
- drill-l2-3bet 中三题 IP 3-Bet 均"到 11BB"（≈4.4x），与 l2-3bet-basics 正课"3-Bet=原始加注 3 倍（7.5BB）"相差近 50%
- l6-icm/p5 effectiveStack=25 与 betSize=8 和动作"Raise all-in"矛盾

#### B4. 测验质量缺陷（多课）
- 错误选项 evImpact 标注为正值（如 +0.5BB/+1.5BB），与"isCorrect=false"矛盾
- sd-q5 双答案（同花同时高于顺子和葫芦）
- basicContent 术语解释"All-In bluff 极弱牌"对零基础不友好

---

### C. **P2 级改进建议（可后续优化）**

#### C1. 排版可读性
- 部分课程文字密度大，建议增加图表辅助说明（如 MDF 推导步骤可视化）
- 基础课术语首次出现时可加 i18n key 链接到 glossary

#### C2. 教学深度增强
- l6-icm 章节可补充 ICM 最小算例（如 4 人 SNG 奖金结构 + 筹码分布手算 $EV）
- bubble factor 定义缺失，需补充"BF = call 所需 equity / 现金局所需 equity"公式

---

## 📊 二、两学院定位差异分析

| 维度 | 策略学院（Strategy Academy） | 理论学院（Theory Academy） |
|------|-----------------------------|---------------------------|
| **目标用户** | 希望学习实战技巧、提升决策能力 | 希望系统理解德扑理论基础 |
| **教学内容层次** | 应用导向（怎么做） | 理论导向（为什么） |
| **课程特点** | 三段式互动教学（概念讲解→实例演示→实践测验）+ Drill 专项训练 | 阅读→章末小测→完成，侧重记忆与理解 |
| **学习目标** | 建立实战决策框架，掌握 GTO/剥削调整方法 | 理解概率论、博弈论等理论背后的数学原理 |
| **技能培养** | 决策速度、位置意识、范围阅读、对手画像分析 | 组合计数、EV 推导、MDF/Alpha 代数 |
| **互补关系** | 理论知识的实践应用与复习巩固 | 为策略学习提供理论基础 |

**桥接映射**：
- 已完成：PracticeBridgeCard 实现理论→实践推荐（theory→academy）
- 待完善：academy→theory 反向引导（遇到概念模糊时跳转理论章节）

---

## 🔧 三、修复优先级与时间安排

### Phase 0: 紧急修复（优先完成，预计 2-3 天）
1. **Drill 题库场景合法性**（d-l2-3bet q1/q2/q8，d-l3-odds-q1，d-l7-deep-q6）
   - 原因：场景不存在/行动序列非法，直接导致题目不可用
   - 修复量：3 道 Drill 题重做 + 题干重写
2. **L4A EV 计算错误大区**（drill-l4-ev q2/q4/q6/q7/q8 + l4-ev-p3/l4-blockers-ex2）
   - 原因：8 题中 5 题答案完全错误，EV 公式混用
   - 修复量：整节重写 + 单元测试回归

### Phase 1: 重点修复（接下来 3-5 天）
1. **L4B MDF/GTO 公式表达**（l4-mdf-q3/l4-overbet-p4/l4-freq-q1~q5）
2. **L6 锦标赛策略方向性错误**（l6-pushfold-q4/正文/l6-bounty/p1/p5）
3. **L1/L2 跨课口径不一致**（UTG 范围/3-Bet 尺度）

### Phase 2: 内容增强（7-10 天）
1. **短牌策略重写**（l5-short-deck 整课按权威 6+ 资料重写）
2. **本土课补充**（deepStack/straddle/limp 的 SPR/筹码计算修正）
3. **BasicsContent 零基础适配**（术语解释通俗化 + 纠错别字）

### Phase 3: 长期优化（持续迭代）
1. 数值精度提升（potSize/effectiveStack 统一计算口径）
2. 测验选项分布优化（继续走 quizShuffle 出口治理）
3. 双语对照翻译（中译英同步更新）

---

## ✅ 四、验收标准

### 必须满足的硬性指标：
1. **pnpm verify 全绿**（typecheck → lint → test）
2. **无 P0/P1 遗留问题**（本报告中列出的致命错误全部修复）
3. **所有 Drill/Practice 题库场景合法性校验通过**（行动序列自洽、heroPosition 与 previousActions 一致）
4. **EV 计算公式统一**：`EV = P(win)×(底池 + 对手下注) − P(lose)×跟注额`
5. **MDF/GTO 公式标准化**：MDF=pot/(pot+bet)、跟注胜率=bet/(pot+bet)
6. **数值自洽检验**：
   - potSize 与 previousActions 累计死钱一致
   - effectiveStack = 100 − 已投入金额
   - SPR = effectiveStack/potSize

### 软性指标：
1. 术语首次出现有通俗解释
2. 跨课程口径统一（UTG 范围/3-Bet 尺度/位置百分比）
3. 零基础课程（basicsContent/l1）可读性测试通过
4. 经典策略覆盖矩阵无重大缺口

---

## 🚨 五、已知问题与限制

### 当前无法立即解决的问题：
1. **L5-short-deck 整课重写需要查阅权威 6+ 资料**（Upswing/Triton/solver 输出），需额外时间调研
2. **双语同步**：目前仅中文，若未来支持中英双语需单独规划 i18n 迁移
3. **本地课时序冲突**：local-xxx 与 LEVELS 中的 l1-l7 有重复 lessonId（limp-intro、local-mental-tilt-recognition 等），需统一 ID 命名空间

### 已知代码层面修复点（已由 store/CourseView 自查）：
- [x] isLevelEntryUnlocked() 消除 l4a/l4b 解锁旁路
- [x] CourseView URL 门禁集成 debugMode.isDebugUnlockActive() 旁路
- [x] recordQuizScore/recordAttemptScore 幂等性保障
- [x] trainingEvents.emit() 合规（practiceResults answers 剥离）

---

## 📝 六、附录：完整问题清单（Excel/CSV 格式）

**文件**: `docs/analysis/strategy-audit-findings.csv`

```csv
severity,file_id,lesson_id,location,category,description,fix_recommendation,priority
P0,level1.ts,l1-basics-p2,Math,Mix-up of pot odds and bet sizing,L1 practice p2 potSize=5.5,4BB=73% not 75%; align with l1-leaks,"Fix in l1-basics-p2, Priority P0"
P0,level2.ts,d-l2-3bet-q1,Legality,Action sequence invalid,BTN open when CO already folded,"Rewrite scenario to MP/UTG open or move hero to BB",Priority P0
P0,level4a.ts,drill-l4-ev-q2,EV Calculation,wrong answer marked,-0.8BB marked but actual EV=+2.4BB,"Recalculate all EV drills, fix correctIndex",Priority P0
P0,level6.ts,l6-pushfold-q4,Factual Error,Wrong UTG 10BB push range claim,UTG 10BB push is ~70-80% (not tight), "Use BTN push examples instead, Priority P0"
... (full CSV available in docs/analysis/)
```

---

## ✍️ 七、修订记录

| 日期 | 版本 | 作者 | 变更说明 |
|------|------|------|---------|
| 2026-08-04 | v1.0 | Audit Team | Initial audit report complete |
| TBD | TBD | TBD | Post-fix verification & changelog update |

---

**报告结语**: 策略学院课程内容整体符合现代德扑理论框架，但存在少量数值计算错误与绝对化策略表述。本次审计聚焦"P0 级致命错误"（场景合法性/EV 计算/MDF 公式/短牌策略方向），建议优先修复上述问题后再进行长期内容增强。理论学院已在先期审查中确认高质量，无需改动。
