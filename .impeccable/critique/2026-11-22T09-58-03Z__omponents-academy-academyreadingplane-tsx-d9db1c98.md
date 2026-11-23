---
target: 课程页面（理论/策略学院阅读页）
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
target_identity: "file:F:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyReadingPlane.tsx"
target_fingerprint: "sha256:9cee8ef6cd00d99092ef6bed448d2ca38fb5c6f90b32f2a7f47a50bb0f5073eb"
target_path: "F:\\code\\dezhou\\src\\shared\\components\\academy\\AcademyReadingPlane.tsx"
timestamp: 2026-11-22T09-58-03Z
slug: omponents-academy-academyreadingplane-tsx-d9db1c98
---
# PokerLab 课程阅读页 · 设计评审与教育向改进建议

Method: dual-agent (A: 设计评审 · B: 检测器证据)

**评审目标**：两院共用阅读骨架 AcademyReadingPlane.tsx（xl 起 768px 阅读列 + 264px 学习导轨）、策略课时页 /academy/lesson/:id（CourseView.tsx）、理论章节页 /theory/chapter/:id（TheoryChapterView.tsx）。

**实机走查**：l1-basics（阅读→练习→小测全链路）、t1-combinatorics、t2-ev（含计算演练正确/错误判分）、/academy 首页；l2-3bet-basics 被解锁门禁拦截，仅锁屏态。

**覆盖声明**：内置浏览器面板隐藏（0×0 视口）——桌面截图与 xl 双栏骨架未实机验证；小测完成页因隐藏视口冻结 rAF 走不通（测试环境伪影，非确认缺陷）；实测为浅色「白天牌室」主题；真实 390×844 移动布局未验证。结论以 DOM 实测 + 源码 + 课程内容数据为据。

## Design Health Score：26/40（Acceptable）

| # | 启发式 | 分 | 关键问题 |
|---|--------|----|----------|
| 1 | 系统状态可见性 | 3 | 小测进度点/练习正确率/级别进度条齐全；阅读进度条仅移动端 |
| 2 | 贴近真实世界 | 3 | BB/底池/位置/牌例原生；α/MDF/outs 对新手缺内联释义 |
| 3 | 用户控制与自由 | 3 | 返回/重考/换题/收藏/笔记齐全；小测不能回看上一题 |
| 4 | 一致性与标准 | 2 | 两院节号规则不一致；公式渲染两套 |
| 5 | 错误预防 | 3 | 答后锁定/容差判定/解锁门禁/Session 止损；误点不可撤销 |
| 6 | 识别而非回忆 | 2 | 目标/胶囊导航/导轨好；小测卸载正文无参照、无词汇表入口 |
| 7 | 灵活与高效 | 3 | 快捷键 1/2/3/空格、标记复习；无课内搜索/小测跳节 |
| 8 | 美学与极简 | 3 | 反霓虹低饱和克制；居中 mono 公式坨破坏节奏 |
| 9 | 错误恢复 | 2 | 反馈讲「为什么」，但无相关课程链接、算错不揭示答案 |
| 10 | 帮助与文档 | 2 | 帮助中心/纠错存在；词汇表页未从阅读页链接 |

## 设计特异性判定

高度特异性，非通用 LMS 换皮。牌室四材质映射教学语义：正文象牙纸（≈12:1 对比），牌例带 SVG 牌面/位置徽章/对手 VPIP/PFR 画像/BB 底池，内容块有 counter-intuitive/职业牌手说/跨院 theory-reference 互链，计算演练用真实 α/MDF 公式。两处材质压倒教学：数学推导=居中等宽铭牌而非草稿纸；契约承诺的章末要点卡缺位。

确定性扫描：CLI 4 条 side-tab（HandExample.tsx:205/229、BasicsIntro.tsx:284、PredictionPrompt.tsx:178 语义左竖线）对照 DESIGN.md §13.3.1/§5.22 属既定词汇，判假阳性。浏览器注入 5 页成功：undersized-ui-text 为主（l1 页 31 条，8–10px 位置徽章/级别 kicker/移动导航/节号）；dark-glow/radial-halo/repeating-stripes 为黄铜光晕与绿呢纹理刻意材质，判假阳性；cream-palette 为浅色主题合法态；em-dash-overuse（t1 正文 14 破折号）与首页 level 徽章 thin-border+wide-shadow 为真实小瑕疵。检测器与契约在 9px 节号上冲突：§13.3.3 明文 9px eyebrow。裁决：装饰 eyebrow 保留契约，功能性微文字（位置徽章/BB 数值/移动导航）≥11px，契约需修订。

## 总体印象

扑克原生感与目标先行+口径透明已做对，错误反馈解释质量高于多数训练产品。最大机会不在装饰，而在把数学推导从铭牌变成可跟读草稿纸、把契约承诺的要点卡与补救闭环真正兑现——直接决定新手能否学会而非读完。

## 做得好的

1. 牌例 worked-example 原生结构化（HandExample.tsx:203）：①②③编号推理 + 常见错误 EV 损失 + 真实牌面/对手画像。
2. TheoryCalcDrill 读→算→测微闭环：容差判分（25% 正确/45.1 错误实测）、公式提示 α=b÷(P+b)、可换题、明示不计进度。
3. 目标先行 + 首考/练习口径透明：4 条行为化目标置顶，小测明示首考成绩/练习不计掌握度/抽题数。

## 优先问题

**[P1] 数学推导=居中铭牌而非草稿纸**
现状：t1 C(n,k) 推导 4 行居中整块等宽（TheorySectionRenderer.tsx:103 raw 渲染无变量高亮），一行≈80 字中文+公式混排；策略 FormulaDisplay 有高亮但仍居中。
伤害：逐步推导是数学理解核心（worked-example effect），居中坨剥夺步骤感；两院不一致。
修：共享 ContentBlocks.tsx FormulaBlock 升级「编号步骤①②③ + 散文左对齐 + 公式行居中 mono + 变量黄铜高亮」，两院统一；t1「为何÷2」成独立编号步。
命令：/impeccable typeset

**[P1] 章末要点总结卡缺位**
现状：DESIGN.md §13.3.1 承诺每章末自动渲染 lesson-takeaway；实测 l1/t1/t2 takeaway=0，仅数据含 type:'takeaway' 才渲染。
伤害：巩固与扫读双失，长章无收尾。
修：渲染层由 objectives + key-point 自动装配章末要点卡（单源不改内容数据），guaranteed 收尾件。
命令：/impeccable distill

**[P1] 错误反馈不闭环到补救**
现状：实测 relatedChip=[]；§13.4.4 RelatedLessonChip 存在未接线；算错多次仅「再算一次」不揭示答案。
伤害：反馈即教学闭环断在补救，概念缺口留存。
修：错误反馈挂 RelatedLessonChip（relatedLessonId 已有）+「回顾本节」锚点；计算演练 N 次失败揭示分步答案。
命令：/impeccable harden

**[P2] 长章节全量渲染 + CTA 沉底 + 小测卸载正文**
现状：units.map 全量渲染（12 分钟章一整屏长滚）；顺序 CTA 全文最底（LessonContent.tsx:283）；quiz 卸载正文纯回忆；词汇表页存在但阅读页无入口。
伤害：认知负荷 3 项失败（一次一事/工作记忆桥/渐进披露）；移动用户滚不到底流失。
修：分节渐进释放；移动端 sticky 底部 CTA；quiz「查看原文」peek；首现术语词汇表浮层 + 导轨入口。
命令：/impeccable adapt

**[P2] 节号跳号 + 两院不一致 + 功能微文字过小**
现状：TheorySectionRenderer.tsx:54 用原始 content 索引→理论 §1.1/1.4/1.9/1.14 跳号，策略顺序索引；位置徽章 10px/级别 kicker 8px/移动导航 10px。
伤害：跳号破坏扫读与交叉引用；8–10px 功能文字移动不可读。
修：节号按 heading 出现序计数两院统一；功能微文字 ≥11px，装饰 eyebrow 保留 9px（修订 §13.3.3 区分两类）。
命令：/impeccable typeset

## Persona 红旗

- Jordan（零基础）：t1 C(n,k) 居中推导看不懂「为何÷2」；t1-q5 考此点，解析重讲但无「回到推导」链接。失效：居中 mono 推导块 + 错误反馈缺回顾锚点。
- Casey（移动分心）：12 分钟章长滚无折叠；主 CTA 最底部；SectionNav 移动标题截断 6 字易迷失。失效：底部 CTA + 胶囊截断。
- Sam（无障碍）：策略 quiz 选项无 aria-label（LessonQuiz.tsx:195），理论有（TheoryQuiz.tsx:219），读屏缺「选项」语境；课时标题 H2=小节 H2 扁平。

## 次要观察

- LessonQuiz.tsx:122 finished 分支死代码（onComplete 立即切 done）。
- t1 正文 14 破折号，长句宜拆。
- 首页 level 徽章 1px 边框 + 18–22px blur，与牌室雕刻发线不符。
- 浅色主题纸面对比好但 felt/walnut/brass 层次 flatten，值得单独材质复核。
- 理论公式缺策略侧变量高亮；t1 未登记 calc drill。

## 值得追问的问题

1. 若「纸=递给你的知识」，为何最重要的数学推导被印成居中等宽铭牌，而非学生能用手指跟着走的编号步骤？
2. 契约承诺「每章末」要点卡，三门基础课一张都没有——总结卡是设计系统能力，还是内容侧的偶然？
3. 反馈讲清了「为什么」却不给回到概念的门——我们是在教学，还是只在判分？
