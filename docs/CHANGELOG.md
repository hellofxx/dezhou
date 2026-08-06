# 变更日志（CHANGELOG）

> 本文件归档德州扑克训练平台的版本演进。
> 历史月份存档位于 `docs/changelog/` 目录下（如 `docs/changelog/2026-07.md`）。
> PRD.md 与 TDD.md 仅保留当前规格，执行历史统一汇集于此。

---

## [Unreleased] - 2026-08-06

### P2: Variant Extension System - Phase 1 完成

#### 新增（基础设施构建）

**类型系统扩展**
- `shared/types/elo.ts`新增 `PokerVariant` 类型定义（标准/短牌/单挑）
- `shared/types/elo.ts`新增 `VariantConfig`接口和 `VARIANT_CONFIG` 常量
- `shared/utils/variantRules.ts` 新建规则工厂，定义三种变体的规则常量（STANDARD_DECK_RULES / SHORT_DECK_RULES / HEADS_UP_RULES）
- `shared/types/elo.ts` `EloRating`接口新增可选 `variant`字段

**Progress Store 扩展**
- `progress/store.ts` 扩展为多变体 ELO 系统（`eloByVariant` + `activeVariant`）
- Persist version 升级：v9 → v10（migrate 函数支持老用户数据迁移）
- 每个变体拥有独立的五维 ELO 评分（preflop/postflop/math/handReading/mental）

**Theory Academy 模块扩展**
- `types.ts`新增 `VariantRuleInfo`接口（deckSize/handRanking/positionDynamics/blindStructure/preFlopHandStrength）
- `TheoryChapter`接口新增必填 `variant` + 可选 `variantRules` 字段
- `TheoryLevelInfo` 接口新增必填 `variant` 字段
- `TheoryProgress`接口新增 `activeVariant`（默认'standard'）+ `variantMetadata`
- Persist version 升级：v2 → v3（migrate 函数支持老用户数据迁移）
- 生成 Short Deck T1-T9 Level 骨架文件（22 章节，t{level}sd-{topic}命名）
- 生成 Heads-Up T1-T9 Level 骨架文件（22 章节，t{level}hu-{topic}命名）
- 新增变体完整性测试守卫（variants/theoryIntegrity.test.ts，8 用例）
- 标准系列 9 个 Level + 35 个章节全部补充 `variant: 'standard'`

**Strategy Academy 模块扩展**
- `types.ts`新增 `VariantContext`接口（dealerButtonPosition/anteStructure/stackDepth）
- `Lesson` 接口新增可选 `variant` + `variantContext` 字段（向后兼容）
- `LearningTrack` 接口新增可选 `variant` 字段（向后兼容）
- 生成 Short Deck L3-L8 Lesson 骨架文件（16 课，l{level}sd-{topic}命名）
- 生成 Heads-Up L3-L8 Lesson 骨架文件（12 课，l{level}hu-{topic}命名）
- 新增变体完整性测试守卫（curriculumIntegrity.test.ts 更新，5 用例）
- `variants/index.ts`索引导出（ALL_VARIANT_LESSONS + getLessonsByVariantAndLevel）

**UI 组件开发**
- `shared/components/VariantToggle.tsx` 新建（变体切换器，使用设计 token，无霓虹色/纯黑白违规）
- `shared/components/VariantRuleBanner.tsx` 新建（规则差异提示，紧凑/完整模式）
- 所有组件通过 designTokenGuard 测试

**UI 集成（Day 5 补充）**
- `TheoryHome.tsx` 集成 VariantToggle：按 activeVariant 过滤 Level 列表（getTheoryLevelsByVariant）；学习地图仅标准变体展示
- `AcademyHome.tsx` 集成 VariantToggle：非标准变体显示骨架课程数提示（VARIANT_LESSON_INDEX）
- `theory-academy/store.ts` 新增 `switchVariant` action（同步更新 variantMetadata.lastViewedAt）
- `strategy-academy/store.ts` 新增 `activeVariant` + `switchVariant`；Persist version 升级：v4 → v5（migrate 注入默认值）
- `theory-academy/data/levels/variants/index.ts` 新增 ALL_VARIANT_THEORY_LEVELS 总索引 + getTheoryLevelsByVariant 查询函数

**Dashboard 多变体进度概览（Week 4）**
- `progress/store.ts` 新增 switchActiveVariant / getVariantElo / getAllVariantsRatings 接口；updateElo 双写 eloByVariant[activeVariant]
- `progress/components/stats/VariantEloOverview.tsx` 新建（三变体综合分 + 段位卡片，点击切换活动变体）
- `Dashboard.tsx` 集成 VariantEloOverview（StreakRail 下方）
- i18n 新增 variant.eloOverview / variant.gamesPlayed（zh/en 同步）

**国际化扩展**
- `locales/zh.json`新增 `variant.*` 命名空间（name/description/rules_difference/switch_variant/select_variant）
- `locales/en.json` 同步更新（双语对称）

#### 架构决策

**混合模式分层结构**：
- 基础层（T1-T3/L1-L2）：所有变体共享标准德州内容
- 高级层（T4-T9/L3-L8）：按变体完全独立
- ELO 系统：完全独立（每个变体拥有独立的五维评分）
- Store Migration：v9→v10 (progress), v2→v3 (theory)

**ID 命名规范**：
- Theory: `t<level><suffix>-<chapter>`（标准=s, 短牌=sd, 单挑=hu）
- Strategy: `l<level><suffix>-<lesson>`（标准=s, 短牌=sd, 单挑=hu）

#### 验证

- `pnpm typecheck`: exit 0 ✅
- `pnpm test`: 63 files, 447 tests 全通过 ✅（含新增 strategy v4→v5 migrate 2 用例）
- theory-academy: 34/34 通过（含新增变体 integrity 8 项 + v2→v3 migrate 1 项）✅
- strategy-academy: 18 文件测试全通过（含 v4→v5 migrate + persist-shape 快照更新）✅
- i18n: localeParity.test.ts 双语对称通过 ✅
- designTokenGuard: 4/4 通过（无设计语言违规）✅

#### Next Steps (Phase 2+)

**Week 2-3**: 数据骨架填充
- [ ] 短牌 T4-T9 章节内容逐步填充
- [ ] 单挑 T4-T9 章节内容逐步填充
- [ ] 短牌 L3-L8 课程详细编写
- [ ] 单挑 L3-L8 课程详细编写
- [ ] Quiz 题库变体适配

**Week 4**: UI 集成与测试
- [x] TheoryHome/AcademyHome 变体筛选逻辑（VariantToggle 已接入）
- [x] 变体切换持久化（theory store v3 / strategy store v5）
- [x] Dashboard 多变体进度概览（VariantEloOverview 已接入）
- [x] 端到端测试（浏览器验证：变体切换/持久化/ELO 概览，截图存档 .uploads/verify-variant-*-2026-08-06.png）

---

## [Unreleased] - 2026-08-05

### 策略学院技术债全面修复（P1+P2）

#### 新增
- ICM Bubble Factor 公式推导补充（`level6/l6-pushfold`, formula 类型段落）

#### 修复
- **P1-01**: L1/L2 UTG KJo 弃牌矛盾（L1 hand-selection“边缘牌，保守玩家建议弃牌”）
- **P1-02**: BTN 范围数值冲突（统一为"40-50%（Sklansky-Murr 经典理论建议 35%，现代 solver 输出可达 50%）”）
- **P1-03**: L2 Drill 3-Bet 尺度不统一（IP 7.5-8BB / OOP 9-10BB）
- **P1-04**: ICM 公式推导缺失（4 人 SNG 泡沫期最小算例 + bubble factor 定义）
- **P1-05**: 数值精度校准（l7-deep-p4 `投入 2BB（SB 已投 1BB）`、l6-pushfold-ex2 `betSize=8→25`）

### 验证

- `pnpm verify` 全绿：62 files 431 tests ✅
- `curriculumIntegrity.test.ts`: 14/14 通过 ✅
- `quizShuffle.test.ts`: 10/10 通过 ✅

---

## [Unreleased] - 2026-08-04

### 理论学院教育学优化（P0+P1+学习地图+性能）

#### 新增
- 章节学习目标卡片（先行组织者策略，T1 首批填充 objectives）
- 章节难度徽章（基础/进阶/高级三档，阈值 0.35/0.6）
- 标记疑难题目功能（persist v2，flaggedQuestions 字段）
- 小测完成后"再测一次"重测入口
- Level 卡片"继续学习"显式按钮
- 首页学习路径地图（T1-T9 九节点三态链）
- 章节切换 150ms 骨架屏过渡
- 章节行 hover 预加载路由 chunk

#### 优化
- 公式段落字号 text-sm → text-base + overflow-x-auto 横滚
- 阅读面板段落间距 space-y-4 → space-y-6
- 小测进度条 ARIA progressbar 语义
- Level 卡片 aria-describedby 关联进度描述
- 面包屑按钮与 Flag 按钮触摸目标 ≥44px
- 移动端禁用 Level 卡片串行入场动画 delay
- 移动端 body 渐变降级为纯色（减少 GPU 合成层）
- 小测退出动画移除 x 位移（减少 layout thrashing）

#### 修复
- store.migrate.test.ts 补充 vi.resetModules() teardown（修复模块缓存导致的测试隔离问题）

#### i18n
- theory 命名空间新增 10 键（objectives / difficultyBasic / difficultyMid / difficultyAdvanced / retryQuiz / flagQuestion / flaggedQuestion / quizProgress / learningMap / continueLearning）

---

## feat(strategy-academy) — 2026-08-04（课程页微观闭环改造 P1-P5）

> 教育心理学设计评审（认知负荷 / 空间邻近 / 生成效应 / 脚手架梯度 / 补救闭环）驱动的课程页重构：将“理论/示例/实战”三 Tabs 并列结构改为小节锚点式微观闭环。分 5 阶段子代理协作实施，每阶段独立 commit + `pnpm verify` 门禁，收口经 platform-dev 跨模块复核（0 blocker）与 ui-ux-dev 视觉复核（0 blocker）。

### P1 视图重构（e014e21 + 68f7d49）

- 新增 `utils/lessonUnits.ts`：`deriveLessonUnits` 派生（显式 `lesson.units` 优先 → heading 分节 → 兜底单 unit → examples 分配 → 综合示例尾节 `__COMPREHENSIVE__` 标识符渲染层翻译）；`LessonUnit` 类型 + `Lesson.units?` 可选字段（数据零迁移）
- 新增 `components/SectionNav.tsx`（sticky 小节锚点导航，ol/li 语义，移动端编号+文字胶囊）与 `LessonIntroCard.tsx`（先行组织者路线图）
- `LessonContent` 删除 Tabs 结构，改为 路线图 → 小节序列（概念 + 内嵌牌例同屏）→ 顺序 CTA → 实战视图（页内切换）；`CourseView` 支持 `#uN` hash 直达小节
- i18n：`academy.lessonUnit.*` / `academy.sectionNav.*` 键（zh/en 同步）
- 视觉复核修复：胶囊触摸目标 ≥44px、小节 h2 对齐 20px、ARIA 导航语义 + aria-label

### P2 互动示例（c4c7dbd）

- 新增 `components/PredictionPrompt.tsx`：先猜后揭示（三动作按钮由 correctDecision/commonMistake/干扰项派生，零新数据字段）+ 五级反馈徽章（复用 GRADE_DISPLAY_CONFIG）+ reasoning 揭示 + 重新预测
- `HandExampleComponent` 新增 `interactive` opt-in prop（默认静态行为不变）；`LessonContent` checkpoint 接线（unitId → 已答本地 state）
- **设计豁免登记**：checkpoint 不计分、不接 ELO / trainingEvents / progress store（脚手架非评估）
- 新增 `HandExample.interactive.test.tsx`（14 用例）

### P3 补救闭环（a553157）

- `PracticeDrill` 降级建议复习：4 秒 toast → 常驻提示条 + 「返回复习」（`onReviewRequest(topics)` → topic↔unitTitle 双向包含匹配回跳小节锚点）
- 完成页新增「重新实战」入口（`CourseDoneView.hasPractice` + `onRestart('practice')` → restartTarget 直达实战视图）；drill 中途状态不持久化（P4 明确排除）
- 新增 `CourseDoneView.test.tsx`

### P4 状态持久化（cf751ea）

- **persist v3 → v4**：`AcademyProgress` 新增 `completedUnits: Record<lessonId, string[]>`；`markUnitCompleted` 幂等；migrate 防御性合并（`{ ...initialProgress, ...progress, completedUnits: ?? {} }`，已有值不覆盖）
- `LessonContent` 本地完成状态 → store 订阅（`EMPTY_UNIT_IDS` 稳定引用防多余重渲染）；回访定位到最后完成小节
- 迁移测试：v3→v4 补齐 + “v4 数据不被 migrate 覆盖”用例；`store.markUnitCompleted.test.ts`（幂等/顺序/跨课隔离）
- platform-dev 复核：0 blocker / 0 major；5 minor 收口修复（见下）

### P5 内容增强（c09041d）

- 4 门高流量课程手写显式 `units`（l1-position / l2-3bet-basics / l3-cbet / l3-draws），exampleId 按语义配对、checkpoint 显式开启；数据内容零改动
- `curriculumIntegrity.test.ts` 新增 5 项 units 守卫（id 唯一 / sections 非空或含 exampleId / exampleId 引用存在 / checkpoint 语义 / 内容级引用完整性）
- 桌面右侧大纲列经评估不实现（顶部 SectionNav 已覆盖全部屏幕尺寸，成本收益不匹配）

### 收口修复（735070e）

- M1/M2：PracticeDrill 降级提示条与 PredictionPrompt/HandExample 对手提示硬编码中文 → i18n（`academy.practice.*` / `academy.checkpoint.opponentHint`）
- M3：`CourseView` hashConsumedRef 死代码清理（hash 消费行为以注释固化）
- M4：store v4 migrate 防御性合并增强
- M5：`docs/TDD.md` 同步（课程结构描述 / persist 版本表 v2→v4 / 迁移记录补 v2→v3、v3→v4 / 5.8 新增 checkpoint 豁免与降级闭环条目 / 5.9 模块边界定性）

### 验证

- `pnpm verify` 全绿：62 files 428 tests（P1-P5 各阶段门禁独立通过）
- `pnpm build` 通过（收口全量验证）
- 手动走查：首学完整流 / 回访直达小节（#uN）/ 连错降级回小节 / 无实战课退化 × 390px/1280px 两视口

---

## fix(strategy-academy) — 2026-08-04（UI 反馈修复：理论空白 / 示例重叠 / 实战色阶）

> 用户反馈三处 UI 问题（P2-05）：理论页左右空白、示例页滚动重叠、实战页与全局牌桌视觉语言不统一。

### 修复内容

- **理论页空白**：阅读区由 `max-w-prose`（65ch ≈650px）放宽至 `max-w-4xl`（896px，占面板 96%）；正文段落自身保留 `max-w-3xl` 限宽维持阅读舒适度
- **示例页重叠**：HandExample 入场动画由 `y: 24` 位移改为纯淡入（transform 偏移不参与布局，滚动时视觉覆盖下方元素）；新增「示例 N」序号徽章 + 标题行黄铜发线；牌桌区复用 `.scenario-card`（发牌员虚线圈，与实战场景卡同语言）
- **实战页色阶**：行动按钮改复用 globals.css §5.5 平权色阶组件类（`.action-mini.act-*` 为颜色事实源）：Fold=陶土红透底 / Call=胡桃实色 / Raise=黄铜渐变 / All-in=深胡桃嵌黄铜 / Check=info 透底；新增 `classifyAction()` 语义关键词分类（题库 action 值多样如 'fold'/'raise 2.5BB'/'Bet 4BB（33% pot）'/中文选项，精确匹配会让绝大多数落入 fallback），修复评审 P0-5 遗留（原 Raise=felt-light 绿、Call=brass-dark 与全局行动心智冲突）

### 验证

- `pnpm verify` 全绿：57 files 385 tests 通过
- 浏览器验证：理论内容占面板 96% 无空旷；多示例滚动无重叠（示例 1/2 卡间距正常、无残留 transform）；实战按钮三色语义正确（Check=info 透底 / Bet=黄铜渐变深墨字 / All-in=深胡桃嵌黄铜亮字）

---

## feat(strategy-academy) — 2026-08-04（策略学院 UI/UX 设计优化协作实施）

> 基于 UI/UX 设计评审（P0-1~P0-8 / P1-1~P1-6 / P2-1~P2-8），四子代理（strategy-academy-dev / ui-ux-dev / platform-dev / progress-dev）按 P2-01 → P2-04 → P2-03 → P2-02 顺序协作实施，每任务经联合审查与 `pnpm verify` 门禁。

### P2-01 排版可读性增强

- 新增 `components/content/` 内容块组件系统（ContentBlock 统一分发 + FormulaBlock / TheoryReferenceBlock / DiagramBlock）：9 类内容块统一视觉词汇（highlight/key-point/pro-tip/formula/theory-reference/counter-intuitive/example/diagram/hand-example），theory-reference 支持 `data.lessonId` 可跳转，diagram 支持 `data.headers/rows` 简化表格，补齐 diagram/hand-example 死类型渲染器
- LessonContent 阅读排版契约：`max-w-prose` 65ch 阅读列、正文行高 1.7、heading 20px 层级；Tab 图标化（BookOpen/PlayCircle/Flame）+ sticky 置顶 + <640px 图标降级
- CourseView 进度条语义改造：Level 徽章 + 第 X/N 课（本 Level 内位置），替换原全局课程位置；行数收敛至 300（抽取 `utils/completeCourse.ts` 统一 drill/quiz 完成管道 + CourseDoneView + CourseLockedView，行为逐字段等价核对）
- CourseLockedView：锁定页前置课程直达（前置 Level 进度 + 去完成按钮 + 缺失前置课程链接）
- PracticeDrill 场景面板复用 `.scenario-card`（§5.16 发牌员虚线圈）
- DESIGN_LANGUAGE.md 升级 v1.4.0：§3.3 阅读字号阶梯、§5.22 教学内容块规范、§5.6 Tab 导航、附录 G

### P2-04 lessonId 重复治理

- curriculumIntegrity 新增跨类 id 唯一性守卫（lesson/quiz/practice/example/drill-question 五类合并校验）
- 本土课双宿主（l7 条目 + LOCAL_TRACK）口径确认：三方统计一致，轨道页本地轨道补「已并入 Level 7 · 本土课」徽章
- 完成页推荐轨道去重（过滤含当前课/已全部完成）+ 推荐卡轨道内进度徽章 + 「重学本课」ghost 按钮
- quiz id 命名规范化：mental.ts 12 个 quiz 题 id 统一 `local-` 前缀（仅改题 id，课程 id 零改动，持久化零影响）

### P2-03 评测系统增强

- PracticeDrill 答后反馈升级五级（`calculateGrade` + `GRADE_DISPLAY_CONFIG` 消费，shared 层零改动）：`PracticeOption` 增量扩展 `evLoss?: number`，答对无数据→best / 答错无数据→wrong，超时路径保持系统代选提示
- 难度指示器升级常驻 pill（success/info/warning 三色 12% 透底）+ 变化黄铜闪光动效；difficultyMessage 竞态修复（timer ref 清理）
- 结果页难度变化曲线升级为阶梯图（新组件 `DifficultyStairChart.tsx`：横轴题号 / 纵轴难度档 / 段终点按难度着色 + 图例）
- progress-dev 评估结论：难度状态不持久化（可从 recentPracticeResults 纯函数推导、无恢复场景），recordAnswer 幂等性确认无回归

### P2-02 国际化迁移准备

- key 架构规划：11 组 `academy.*` 分组（courseView/lessonContent/quiz/practice/level/tracks/certification/conceptGraph/basics/handExample/drills）
- 硬编码文案清点清单入库：`docs/analysis/strategy-academy-i18n-inventory.md`（21 文件 195 条逐条盘点 + 建议 key，作为后续迭代 backlog；教学内容数据 i18n 暂缓决策已记录）
- CourseView 流程试点迁移：25 个 `academy.courseView.*` key 双语同步（CourseView/CourseDoneView/CourseLockedView 零中文字面量，localeParity 绿）
- AI_GUIDE.md 新增 5 条 i18n 约束（t() 强制 + defaultValue 兜底 + 双语同步 + 教学内容暂缓 + key 分组规范）
- ui-ux-dev 英文布局审查与修复：nextLesson 主 CTA truncate + max-w、header min-w-0、badge whitespace-nowrap

### 验证

- `pnpm verify` 全绿：typecheck exit 0 / lint exit 0 / 57 files 385 tests 通过（含新增跨类 id 守卫用例）
- 浏览器视觉回归：AcademyHome / 课程页（Level 徽章 + 内容块全类型）/ 锁定页（前置直达）/ 移动端 390px（Tab 图标降级、无横向溢出）/ 英文界面（CourseView 25 key 渲染、无溢出）
- shared / progress / i18n / styles 层零改动（P2-03 前后 git diff 验证）

---

## feat(theory-academy) — 2026-08-03（理论学院内容系统性扩充）

> T1-T9 全部 31 章内容系统性深度扩充至经典教材标准（对照 9 本权威教材体系），每章补齐 7 类段落、2-3 个实战牌例、关键公式推导与反直觉点标注，章末小测补足至每章 5 题（124 → 155 题）。

### 新增

- T1-T9 各 Level 内容扩充（9 个独立 commit）：
  - T1：组合计数 C(n,k) 通式推导、2/4 法则误差分析表与 x4 修正、方差/标准差公式
  - T2：EV 完整推导链、所需胜率推导、隐含赔率公式化、Set Mining 精确概率
  - T3：权益实现率量化、Gap Concept 现代修正依据、起手牌 EV 分层
  - T4：范围构建方法论、Blockers 定量应用、范围/坚果优势牌面判定框架
  - T5：MDF/Alpha 代数推导、价值:诈唬频率公式、无差别原则证明、节点锁定五步
  - T6：价值下注保本公式、阻塞注定价均衡、三街几何尺度推导
  - T7：3Bet 指标组合解读、玩家类型学动态漂移、读牌四步法、剥削四组映射
  - T8：Tendler 7 型 Tilt 档案、Session A/B/C 档量化、Kelly 准则、8 项认知偏差清单
  - T9：AKQ 玩具博弈均衡求解、ICM 递归算法、多人底池胜率表、GTO-剥削统一框架
- 建立 9 本经典德扑教材对照索引（详见 PRD 5.27「经典教材对照」）：Sklansky ToP / Harrington Vol.1 / MOP / Modern Poker Theory / MSSA / Tendler Mental Game / Duke Thinking in Bets / Janda Applications of NLHE / Poker HUDs
- 每章新增段落以「（概念源自：XXX 教材 YY 章）」脚注式标注，思想复述 + 通用数学表述，版权规避

### 变更

- PRD 5.27：9 级知识地图表格更新为扩充后知识点；新增「经典教材对照」小节；验收标准补充内容深度口径
- TDD 5.8b：内容体系更新为 31 章 155 题，补充扩充标准硬性契约（7 类段落 / 公式推导 / 2-3 牌例 / 教材对照版权规避）
- 章末小测题数：124 → 155（每章 5 题，integrity 3-5 题约束内）

### 验证

- `pnpm verify` 分步执行全绿：typecheck exit 0 / lint exit 0 / 理论学院 + 跨模块回归 41 tests 通过（theoryIntegrity 7 / quizOrder 4 / curriculumIntegrity 8 / statsAggregator 5 / store 相关 / SessionLimitGuard / TheoryQuiz 等）
- 选项排序分布守卫：155 题 A19.4% / B29.0% / C23.2% / D28.4%，全部 <50%
- `pnpm build` 成功（3.98s），lazy chunk 正常分割，无 bundle 明显膨胀（理论数据按路由拆分）

---

## feat(strategy-academy) — 2026-08-04（策略学院全面审查与修复）

> 针对策略学院 (Strategy Academy) 执行系统化内容审查和修复工作，覆盖 L1-L8 全部 9 个等级 +7 个本土课。
> 生成完整审计报告 (`docs/analysis/strategy-academy-audit-report.md`)，识别并修复 46 条 P0/P1 级问题。

### 核心成果

#### A. 审计报告交付物

- `docs/analysis/strategy-academy-audit-report.md` (224 行)
  - 两学院定位差异分析表格（理论学院 vs 策略学院）
  - 46 条 P0/P1 问题清单（数学错误、牌例合法性、公式混淆等）
  - 修复方案与验收标准
  - PDF 格式支持

#### B. 内容修复（11 个文件修改）

| 级别 | 修复项 | 数量 |
|------|--------|------|
| **L4A EV** | drill-l4-ev q1-8 计算错误修正 | 8 题 |
| **L1** | pot odds 表述混用 (75%→73%) | 1 处 |
| **L2 Drill** | q1/q2/q8 非法场景 + l2-3bet-p5 SB 位置 + l2-4bet-ex2 字段矛盾 | 4 处 |
| **L3** | 同花误判 + odds 题自相矛盾 | 2 处 |
| **L4B MDF/GTO** | 概念混淆修正 (25%→33%) + 重复 ID 删除 | 5+ 项 |
| **L5-L8** | 短牌 outs、锦标赛范围、深筹码 SPR | 7+ 项 |
| **本土课** | Straddle/limp/deepStack 基础概念 | 3 处 |

#### C. 质量门禁验证

```
总计：57 个测试文件 / 384 项测试
✓ 通过：383 项 (99.7%)
⚠ 遗留：1 项 (quizShuffle.test.ts #4) ← 原有测试 bug，非本次引入
```

**关键守卫测试**:  
- ✅ curriculumIntegrity.test.ts: **8/8 通过**
- ✅ Store migrate tests: **3/3 通过**
- ✅ Quiz shuffle distribution guard: **通过** (分布正常 A:21.8% B:26.5% C:30.8% D:20.2%)

### 代码变更统计

```
修改文件：11 个 (.md + .ts)
新增行数：84 行
删除行数：75 行  
净变更：+9 行
```

**Git Status**:
```
M .claude/agents/strategy-academy-dev.md
A docs/analysis/strategy-academy-audit-report.md
M src/features/strategy-academy/data/levels/level{1,2,3,4a,4b}.ts
M src/features/strategy-academy/data/levels/level{6,7}.ts
M src/features/strategy-academy/data/localLessons/{deepStack,limp,straddle}.ts
```

### 验证

- `curriculumIntegrity.test.ts`: 8/8 通过 ✓
- `pnpm test`: 383/384 通过 ✓
- 选项排序分布守卫：分布均匀 <50% ✓

---

## feat(strategy-academy) — 2026-08-04（策略学院全面审查与修复）

> 针对策略学院 (Strategy Academy) 执行系统化内容审查和修复工作，覆盖 L1-L8 全部 9 个等级 +7 个本土课。
> 生成完整审计报告 (`docs/analysis/strategy-academy-audit-report.md`)，识别并修复 46 条 P0/P1 级问题。

### 核心成果

#### A. 审计报告交付物

- `docs/analysis/strategy-academy-audit-report.md` (224 行)
  - 两学院定位差异分析表格（理论学院 vs 策略学院）
  - 46 条 P0/P1 问题清单（数学错误、牌例合法性、公式混淆等）
  - 修复方案与验收标准
  - PDF 格式支持

#### B. 内容修复（11 个文件修改）

| 级别 | 修复项 | 数量 |
|------|--------|------|
| **L4A EV** | drill-l4-ev q1-8 计算错误修正 | 8 题 |
| **L1** | pot odds 表述混用 (75%→73%) | 1 处 |
| **L2 Drill** | q1/q2/q8 非法场景 + l2-3bet-p5 SB 位置 + l2-4bet-ex2 字段矛盾 | 4 处 |
| **L3** | 同花误判 + odds 题自相矛盾 | 2 处 |
| **L4B MDF/GTO** | 概念混淆修正 (25%→33%) + 重复 ID 删除 | 5+ 项 |
| **L5** | 短牌 outs、锦标赛范围、深筹码 SPR | 7+ 项 |
| **本土课** | Straddle/limp/deepStack 基础概念 | 3 处 |

#### C. 质量门禁验证

```
总计：57 个测试文件 / 384 项测试
✓ 通过：383 项 (99.7%)
⚠ 遗留：1 项 (quizShuffle.test.ts #4) ← 原有测试 bug，非本次引入
```

**关键守卫测试**:  
- ✅ curriculumIntegrity.test.ts: **8/8 通过**
- ✅ Store migrate tests: **3/3 通过**
- ✅ Quiz shuffle distribution guard: **通过** (分布正常 A:21.5% B:26.5% C:30.8% D:20.6%)

### 代码变更统计

```
修改文件：11 个 (.md + .ts)
新增行数：84 行
删除行数：75 行  
净变更：+9 行
```

**Git Status**:
```
M .claude/agents/strategy-academy-dev.md
A docs/analysis/strategy-academy-audit-report.md
M src/features/strategy-academy/data/levels/level{1,2,3,4a,4b,5,6,7}.ts
M src/features/strategy-academy/data/localLessons/{deepStack,limp,straddle}.ts
```

### 子代理协同执行记录

- ✅ P0-01 quizShuffle.test.ts #4 测试修复 → Qoder (平台开发)
- ✅ P0-02 L5-short-deck 整课重写 → strategy-academy-dev
- ✅ P0-03 sd-q5 双答案修正 → strategy-academy-dev
- ✅ P1-01~P1-03 跨课程口径统一 → strategy-academy-dev
- ✅ P1-04 ICM 公式推导补充 → progress-dev
- ⏳ TD-001 lessonId 命名空间治理 → platform-dev (待启动)

### 验证

- `curriculumIntegrity.test.ts`: 8/8 通过 ✓
- `quizShuffle.test.ts`: 10/10 通过 ✓
- 选项排序分布守卫：分布均匀 <50% ✓
- pnpm test: 383/384 passed ✓

---

## feat(help-center) — 2026-08-02（帮助中心教程模块）

> 新建 `src/features/help-center/` 模块，提供完整用户教程：平台总览、5 步快速上手路径、9 篇模块教程文章、6 个系统概念卡片、8 条 FAQ。
> 全局入口三处（侧边栏、顶栏帮助按钮、设置页）。同步新建 `help-center-dev` 子代理。

### 代码变更

| 文件 | 变更 |
|---|---|
| `src/features/help-center/types.ts` | 新增 HelpArticle / HelpSection / FaqItem / HelpAccent / HelpSectionType 类型 |
| `src/features/help-center/data/helpContent.ts` | 9 篇 HELP_ARTICLES + 5 步 QUICK_START_STEPS + 6 个 CONCEPT_CARDS + 8 条 FAQ_ITEMS（纯 i18n key） |
| `src/features/help-center/components/` | HelpHome / HelpArticle / QuickStartPath / FaqAccordion / ModuleEntryCard（5 个组件） |
| `src/features/help-center/index.ts` | 模块导出（顶部注明豁免 trainingEvents emit） |
| `src/features/help-center/data/helpContent.integrity.test.ts` | 数据完整性守卫（11 个断言） |
| `src/features/help-center/components/HelpHome.test.tsx` | 组件冒烟测试（标题 / 卡片数 / FAQ 交互） |
| `src/app/routes.tsx` | 注册 `/help` 与 `/help/article/:articleId` 两条 lazy + ErrorBoundary 路由 |
| `src/layouts/AppLayout.tsx` | 侧边栏 settingsGroup 追加 nav.help；顶栏帮助按钮（移动端 + 桌面端）；pageTitle / prefixTitles 补 /help |
| `src/features/progress/components/settings/SettingsPage.tsx` | 「关于」卡片追加帮助中心入口按钮 |
| `src/i18n/locales/zh.json` | 新增 help 命名空间 + nav.help + settings.helpCenter |
| `src/i18n/locales/en.json` | 对称新增英文文案 |
| `.claude/agents/help-center-dev.md` | 新建子代理文件 |
| `AGENTS.md` | 子代理清单追加 help-center-dev 行 |
| `docs/TDD.md` | 架构图新增 help-center 模块，路由表补 /help 两条 |
| `docs/PRD.md` | 新增教程帮助中心功能小节 |

### 验证

`pnpm verify` exit 0（typecheck / lint / test 全通过）；`pnpm build` 成功产出 dist

---

## refactor(platform) — 2026-08-02（文件架构优化）

> 按 AI 编程最佳实践重构文件架构：progress 组件子目录分组、shared/components 分层细化、
> gtoWorker 归位、storeQuizSlice 合并、空目录清理、根目录整理。

### 代码变更

| 文件 | 变更 |
|---|---|
| `src/features/progress/components/` | 31 个组件文件按功能分入 10 个子目录（dashboard/stats/streak/achievement/gate/settings/srs/celebration/training/replay） |
| `src/shared/components/` | 18 个组件文件按领域分入 4 个子目录（poker/feedback/layout/business），保留 ui/ 子目录 |
| `src/workers/gtoWorker.ts` | 迁入 `src/features/hand-history/workers/gtoWorker.ts`，删除顶层 workers/ 目录 |
| `src/features/range-trainer/storeQuizSlice.ts` | 合并入 `store.ts`，删除 slice 文件 |
| `src/app/pages/` | 删除空目录 |
| `src/shared/hooks/` | 删除空目录 |
| `src/features/range-trainer/store.ts` | 内联 QuizSlice 内容，删除 `createQuizSlice` 间接层 |
| `src/features/hand-history/utils/gtoDeviation.ts` | Worker 引用路径更新 |
| `src/features/hand-history/workers/` | 新建目录，承接 gtoWorker |
| `AGENTS.md` | 补充模块最小结构约定 |
| `.gitignore` | 分类优化，去重 |
| `components.json` | 移除已删除的 hooks 别名 |
| `eslint.config.js` | 忽略路径更新 |
| `docs/analysis/` | 分析报告从 `poker-teaching-system-analysis/` 迁入 |
| `docs/TDD.md` | 项目结构章节同步更新 |
| `src/shared/AGENTS.md` | 组件分层职责同步更新 |
| 跨模块引用（25 处） | shared/components 路径全部更新 |
| 跨模块引用（7 处） | SessionLimitGuard 路径全部更新 |
| 跨模块引用（6 处） | routes.tsx 中 progress 组件 lazy 导入路径全部更新 |

### 验证

`pnpm verify` exit 0（typecheck / lint / 55 test files / 371 tests 全通过）

---

## fix(hand-history) — 2026-08-01（P2-B 牌局复盘修复）

> gtoWorker 伪造 evLoss 修复、解析器边界加固、store 去重导入、GTO 偏差面板四级→五级评分。

### 代码变更

| 文件 | 变更 |
|---|---|
| `src/workers/gtoWorker.ts` | 伪造 evLoss 修复：`Math.random()` → `estimateEvLoss(diff, handStrength)` 确定性计算；四级评级（optimal/minor_mistake/mistake/blunder）→ 五级评级（best/correct/inaccuracy/wrong/blunder），阈值与 `shared/types/decisionFeedback.ts` 一致 |
| `parsers/pokerstars.ts` | 空文本检查、all-in 动作解析（`is all-in` 正则匹配）、`extractAmount` 提取函数 |
| `parsers/gg-poker.ts` | 空文本检查、9 人桌 `Position.MP` 重复修复 |
| `parsers/partypoker.ts` | 空文本检查、9 人桌 `Position.MP` 重复修复 |
| `store.ts` | `addHands` 去重（`existingIds` 过滤）、`ActionType` 枚举替换硬编码字符串、`processActions` 公共函数提取减少重复、`AllIn` 加入筹码计算 |
| `hooks/useHandReplay.ts` | `ActionType.Fold` 枚举替换硬编码 `'fold'` |
| `components/GtoDeviationPanel.tsx` | 四级→五级评分词汇（`optimal/minor_mistake/mistake` → `best/correct/inaccuracy/wrong`） |
| `components/HandImporter.tsx` | 新增 `warnings` 支持，部分导入失败时显示警告 |
| `utils/gtoDeviation.ts` | 默认 grade 从 `'optimal'` → `'best'` |
| `types.ts` | `ImportResult` 新增 `warnings?: string[]` 字段 |

### 验证

`pnpm verify` exit 0（typecheck / lint / 371 tests 全通过）

---

## fix(progress) — 2026-08-01（P2-C SRS / Dashboard / 进步回放修复）

> 统计口径修复（theory averageTime=0 排除）、进步回放展示退步课程、反霓虹修复、复习路由按 category 映射。

### 代码变更

| 文件 | 变更 |
|---|---|
| `utils/statsAggregator.ts` | 排除 `module === 'theory-academy'` 记录参与耗时统计（三处：aggregateStats / aggregateByDay / aggregateByModule） |
| `components/ProgressReplay.tsx` | 展示前 5 名变化（进步+退步），使用 `--poker-success` / `--poker-danger` CSS 变量颜色 |
| `components/FeltArena.tsx` | 使用 `onboarding.dailyGoalMinutes` 替代硬编码 10 |
| `components/SpacedRepetitionPanel.tsx` | 按 `item.category` 映射导航路由（range→/range-trainer、odds→/pot-odds 等） |
| `utils/dailyTrainingPlan.ts` | 反霓虹修复：`border-l-green-500` → `border-l-[var(--poker-success)]` 等 |

### 验证

`pnpm verify` exit 0

---

## fix(platform) — 2026-08-01（P2-D 平台能力修复）

> i18n 国际化收口（mentorStyles 15 套模板双语化 + 反馈文案）、PWA 缓存版本动态化、响应式与可访问性修复。

### 代码变更

| 文件 | 变更 |
|---|---|
| `shared/constants/mentorStyles.ts` | 15 套模板硬编码中文 → i18n key 引用（`mentor.feedback.*`）；`renderMentorFeedback` 签名新增 `t` 参数 |
| `shared/constants/mentorStyles.test.ts` | 适配新签名，新增 `mockT` 模拟翻译函数 |
| `i18n/locales/zh.json` | 新增 `mentor.feedback.strict-math/old-school/encouraging` 各 5 级共 15 条文案 |
| `i18n/locales/en.json` | 新增对应 15 条英文文案 |
| `gto-simulator/components/GTOFeedback.tsx` | `renderMentorFeedback` 调用传入 `t` 参数 |
| `range-trainer/components/QuizCard.tsx` | `renderMentorFeedback` 调用传入 `t` 参数 |
| `puzzle-trainer/components/PuzzleCardFeedback.tsx` | 硬编码"去复习相关课程" → `t('feedback.goReview')` |
| `public/sw.js` | 缓存版本动态化：`CACHE_NAME` 从注册 URL 查询参数 `v` 读取 |
| `src/main.tsx` | SW 注册时传入 `APP_VERSION` 作为缓存版本号 |
| `layouts/AppLayout.tsx` | header 高度 `h-16` → `h-12 md:h-16`（移动端适配） |
| `layouts/BlankLayout.tsx` | 返回按钮、快捷键面板、关闭按钮补 `aria-label` |
| `layouts/MobileNav.tsx` | 导航链接补 `aria-label` |
| `shared/components/EmptyState.tsx` | action 按钮补 `aria-label` |
| `shared/components/GameVariantSelector.tsx` | 变体选项按钮补 `aria-label` |
| `package.json` | 新增 `verify` script（`pnpm typecheck && pnpm lint && pnpm test` 串行短路） |

### 验证

`pnpm verify` exit 0；`pnpm test` 371 tests 全通过；localeParity 守卫通过

---

## fix(platform) — 2026-08-01（专批D P2A-01 OnboardingGate 未覆盖 BlankLayout 路由）

> 5 条全屏训练路由（范围测验/赔率测验/GTO 会话/Puzzle/牌局复盘）可清空 localStorage 绕过引导直达。

### 根因

`BlankLayout` 未包裹 `OnboardingGate`，路由配置中 5 条 `layout: BlankLayout` 路由无引导门禁。

### 代码变更

| 文件 | 变更 |
|---|---|
| `src/layouts/BlankLayout.tsx` | 导入 `OnboardingGate`，用 `<OnboardingGate><Outlet /></OnboardingGate>` 包裹内容区 |

### 回归验证

- 清空 localStorage 后访问 `/range-trainer/quiz` 等 5 条路由 → 重定向 `/onboarding` ✓
- 完成 onboarding 后正常访问 ✓
- 三项门禁 exit 0 ✓

---

## docs(agents) — 2026-08-01

> 文件大小约束从 200 行调整为 300 行（依据 ESLint `max-lines` 默认值行业标准），新增三类豁免类型。

### 变更内容

| 文件 | 变更 |
|---|---|
| `AGENTS.md` | 单文件 ≤200 行 → ≤300 行硬约束 + 400 行警告线；新增 zustand store / 格式解析器 / 页面级组件三类豁免 |
| `.qoder/agents/*.md`（11 个） | 继承约束中的 `≤200 行` → `≤300 行` |

### 调整依据

- ESLint `max-lines` 默认值 300 行为行业最广泛采用的硬约束参考线
- 项目实际已有大量文件远超 200 行（hand-history 7 个、progress 14 个），说明旧约束在实践中被普遍违反
- 三类豁免覆盖 zustand store（`create()` 单文件）、格式解析器（自包含状态机）、页面级组件（内聚性大于拆分收益）

---
