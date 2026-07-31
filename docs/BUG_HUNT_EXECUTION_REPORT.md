# Bug 排查修复执行方案总结报告

> 生成时间：2026-07-31
> 执行策略：分阶段子代理（排查/修复分离 + 确认门 + 结论落盘 + 跨模块专批）
> 当前进度：P0-B ~ P1-F 及跨模块专批 A/B/C 全部完成；P2 层（A/B/C/D）+ 收尾批待执行
> 事实源：本报告数据对照 `docs/BUG_HUNT_BACKLOG.md` 与 `docs/CHANGELOG.md` 2026-07-31 各条目；数值以两文件为准，本报告不维护副本

---

## 目录

1. [已完成阶段执行情况汇总（P0-B ~ P1-F）](#一已完成阶段执行情况汇总p0-b--p1-f)
2. [跨模块专批执行情况（A/B/C）](#二跨模块专批执行情况abc)
3. [P2 层剩余待执行任务](#三p2-层剩余待执行任务)
4. [后续阶段子代理修复方案（可直接派发）](#四后续阶段子代理修复方案可直接派发)
5. [最终收尾批次安排](#五最终收尾批次安排)
6. [整体进度统计](#六整体进度统计)
7. [对照原计划的差异分析](#七对照原计划的差异分析)
8. [风险控制措施](#八风险控制措施)

---

## 一、已完成阶段执行情况汇总（P0-B ~ P1-F）

### 1.1 各阶段发现与修复数据

| 阶段 | 模块 | 排查发现 | 模块内即时修复 | 挂起专批 | 移交/豁免 | 阶段末测试数 |
|---|---|---|---|---|---|---|
| P0-B | 事件总线/判分/排序（shared） | 7 | 4 | — | 分流 1 + 豁免 1 + 移交 1 | 230 |
| P1-A | range-trainer | 14 | 11 | 4 | — | 244 |
| P1-B | pot-odds（含 P0B-04） | 11 | 10 | 3 | — | 255 |
| P1-C | gto-simulator | 27 | 24 | 2 | 移交 2 | 275 |
| P1-D | puzzle-trainer | 12 | 10 | 2 | — | 291 |
| P1-E | strategy-academy | 13 | 11 | 2 | — | 316 |
| P1-F | theory-academy | 5 | 3 | 3 | — | theory 全绿 |
| **合计** | **7 层** | **88 项**（去重 P0B-04=P1B-05） | **73 项** | **15 项 → 专批** | **移交 3 + 豁免 1** | — |

> 测试基线从 P0-B 排查前 **222 项** 单调增长至专批 C 后 **359 项**，新增 137 项回归测试；每阶段均以三项门禁（typecheck / lint / test）exit 0 收口。

### 1.2 严重级别分布（BACKLOG 四级口径：数据丢失 > 功能不可用 > 逻辑错误 > 显示问题）

| 严重级 | 代表性问题 | 占比趋势 |
|---|---|---|
| **数据丢失/污染** | P1A-04 空会话入账、P1B-04 SRS 无限堆积、P1C-06 ELO 多步多记、P1C-07 SRS 永不去重、P1D-05 Rush totalQuestions 污染全局正确率 | ~12% |
| **功能不可用** | P0B-06 导师模板脏数据抛错、P1A-01 空题库白屏、P1A-03 计时冻结、P1C-14/15 结果页空矩阵、P1C-16 剥削模式死链路、P1D-01 难度递增失效、P1F-01 小测中途被吞 | ~25% |
| **逻辑错误** | P1B-01 赔率核心口径错、P1C-02 all-in 判分剥削漏洞、P1C-04 翻后策略写死、P1E-02 前置口径分叉、P1E-13/P1A-02 超时判分 | ~45%（最大类） |
| **显示问题** | P0B-04 裸英文评级、P1A-07/08 占比与标注、P1C-11 EV 单位、P0B-07/P1C-27 i18n 硬编码 | ~18% |

### 1.3 各阶段核心修复成果

- **P0-B（地基）**：修复选项排序治理红线（PracticeDrill 259 题正确答案 55.2% 集中 index 1 → 新增排序出口 + 分布守卫）、strategy store emit 时序对齐防双发、SRS 时区遗漏点、导师模板防御回退。确立 9 项"后续层免重复排查"结论，作为 P1 各阶段可信输入。
- **P1-A**：修复空题库白屏（功能不可用最重）、超时判分失真、计时器后台节流漂移、resetQuiz 清空间隔重复权重、位置解锁门禁绕过；`store.ts` 383→97 行重构。
- **P1-B**：修复底池赔率核心口径错误（计算器与自家题库自相矛盾，33.3% vs 权威 25%）及隐含赔率方向反转、EV 漏算对手下注三处同源问题。
- **P1-C（最重，27 项）**：修复 GTO 判分可被系统性剥削（all-in 恒判 best）、公共牌与手牌重复发牌、翻后单步策略写死、spotKey 静默降级；`useScenarioEngine.ts` 598→62 行大幅重构；完成两个关键定性（3-bet 场景语义、useGTOWorker 去留）。
- **P1-D**：修复 Rush 难度递增完全失效（30 题全难度 1）、failed 会话刷分漏洞、Rush 统计口径污染；甄别 615 选项 100% 动作类，主题分布"超标"实为语义排序自然结果（不改题库）。
- **P1-E**：修复前置口径分叉家族（认证 vs 课程完成）、QuickDrill 复习题题数缩水、认证重试不重洗；P0-A 新增判定函数回归 8/8 全通过。
- **P1-F**：修复"下一章"指向未解锁 Level、空题库 effect 双发、桥接跳转丢参；最高分不覆盖 / StrictMode 不双发 / ELO 维度 31 章逐章核对三项回归全通过。

---

## 二、跨模块专批执行情况（A/B/C）

P1 全部完成后，将 15 项挂起项按风险分层为三个顺序执行的专批（均由 platform-dev 角色执行，串行以避免 progress / shared 层互相干扰）。

### 专批 A（清理类，零状态风险）— 335 测试全绿

| 项 | 技术细节 | 文件 |
|---|---|---|
| P1B-10 | pokerMath 全函数边界防御：新增 `sanitizeNonNegative` / `sanitizeRate` 入口守卫，修复 shortDeck outs>31 溢出（-419%）、负 bet 返 -1、NaN/Infinity 直通；正常值语义不变 | `shared/utils/pokerMath.ts`（8→21 测试） |
| calculateImpliedOdds | grep 确认零调用后删除死函数（P1B-02 已在 pot-odds 侧替代） | `shared/utils/pokerMath.ts` |
| JSDoc 澄清 | `calculatePotOdds` / `calculateEV` 的 potSize 语义标注（防 P1B-01/03 类误用再现） | shared + oddsMath.ts 注释 |
| useGTOWorker 删除 | 只删死代码 hook，保留 gtoWorker.ts（hand-history 消费中） | `src/workers/` |
| P1A-13 死路由 | 删除 `/range-trainer/result/:sessionId` + SessionResultPage + placeholder.tsx | `src/app/routes.tsx` |
| eslintCrossImports 超时 | 该测试 testTimeout 提至 30s，消除全量并发偶发红灯（修复后全量 test 首次干净 exit 0） | `src/eslintCrossImports.test.ts` |
| P1F-05 桥接孤岛 | track-theory-bridge 注释口径修正（通用入口而非定向推荐），不臆造接线 | `learningTracks.ts` |

### 专批 B（progress 中枢口径）— 346 测试全绿，四组均无需升 version

| 组 | 技术细节 | persist 影响 |
|---|---|---|
| 组 1 拒收兜底 | `addRecord` 对 `totalQuestions<=0` 记录拒收（P1A-04 + P1F-03 中枢纵深防御） | 仅 action 逻辑，不改 shape |
| 组 2 SessionLimitGuard | `useSessionLimitReached()` 改开局判定（mount 快照冻结）：中途额度耗尽不再吞会话；覆盖 puzzle 三模式 / QuickDrill / theory 小测 5 处调用点零逻辑改动；debug 旁路保留 | 既有字段结构不变 |
| 组 3 streak 口径 | strategy 课程测验 / Drill / 普通 QuickDrill 补调幂等 `recordTrainingDay()`，与 theory 等 7 处归口一致 | 仅补调既有幂等 action |
| 组 4 SRS 回写 | 核查确认 progress 已有 `processReview` / `updateReviewItem`，建立 QuickDrill 复习题回写闭环（间隔 1→3→7→14→30，答错重置）；`PracticeResult.answers` 入库前剥离 | 复用既有 API，ReviewItem 字段足够 |

> 关键控制成果：四组变更经审慎判断均未触碰 persist shape，progress 保持 v9，四个 persist store 的 persist-shape 快照测试未动且全绿——规避了最高风险的数据迁移。

### 专批 C（数据一致性）— 359 测试全绿

| 项 | 技术细节 | 红线遵守 |
|---|---|---|
| P1A-06 | open/call 类 6 个 preset 以 preflop-ranges.json（≥0.5）重生成；3-bet/4-bet 类定性为模块自身权威源（与 JSON"响应 3-bet"是不同 spot）；新增跨模块守卫 `src/rangePresetGtoConsistency.test.ts` | 全程未臆造 GTO 频率数据，均从既有 JSON 抄录离散化 |
| P1A-08 | 百分比标注按组合占比重算（HU BTN ~75%→~62% 等） | 纯显示文字 |
| P1D-11 | 核查确认 puzzle 根本不注册 SRS，走路径 A 零迁移：规范修订 + id 守卫测试 | 不引入存量迁移风险 |

> 专批 C 暴露一个重要事实：P1-A 声称已建的 open/call 一致性守卫实际未建成且 preset 存在真实漂移，专批 C 补齐——印证了"排查/修复分离 + 分层复核"对捕捉遗漏的价值。

**跨模块专批挂起清单 15 项（含衍生项）已 100% 清空。**

---

## 三、P2 层剩余待执行任务

| 阶段 | 模块 | 排查计划要点 | 预期修复范围 | 已知遗留输入 |
|---|---|---|---|---|
| **P2-A** | onboarding | OnboardingGate 重定向、三路径、能力评估映射 30-70、微训练补救、首胜 Day 1 回归、调试解锁不旁路 onboarding（唯一不旁路项） | 映射越界 clamp、重定向漏洞、中途刷新丢步骤 | BUG-02 首胜回归验证 |
| **P2-B** | hand-history | 三平台解析器（PokerStars/GGPoker/PartyPoker）、回放、IndexedDB 持久、筛选搜索、GTO 偏差面板 | 解析器重灾区（格式损坏/非 UTF-8/超大文件/不完整牌局）、IndexedDB 降级 | gtoWorker.ts 伪造 evLoss（P1C 移交）——gtoDeviation 分析结果当前不可信 |
| **P2-C** | SRS / Dashboard / 进步回放 | SM-2 间隔、复习会话三模式、混合比例、Dashboard 统计/趋势/日历、今日任务、雷达图 | SRS 队列/复习会话全面排查、averageTime=0 统计消费 | theory averageTime=0、P1E-05 SRS 已建闭环需回归、UTC→本地时区存量偏移 |
| **P2-D** | 平台能力 | 成就 26 个/4 类、排行榜、PWA（build+preview）、i18n 全量走查、响应式三断点、可访问性 | i18n 硬编码集中收口（P0B-07/P1C-27 及各模块扩样）、成就触发实测、WCAG | 需 ui-ux-dev 协同响应式/可访问性段 |

> P2-A 排查已启动但被报告请求中断，需重新派发。P2-B、P2-D 预计为 P2 层最重阶段。

---

## 四、后续阶段子代理修复方案（可直接派发）

> 通用纪律（每阶段一致，不再逐条重复）：
> - **排查/修复分离**：每阶段先派"排查代理"（只查不修，产出结构化 bug 清单），再派"修复代理"。
> - **确认门**：用户已授权"后续所有确认按推荐执行"，主对话按推荐处置分流后直接派发修复，遇无既定推荐的产品级抉择才停。
> - **静态基线先行**：每次排查先跑 `pnpm typecheck` / `pnpm lint` / `pnpm test`，红灯先记录。
> - **跨模块根因挂起**：根因在 shared / progress store 的一律入"跨模块专批挂起清单"，不在 feature 阶段擅改。
> - **门禁与落盘**：修复后三项门禁 exit 0（回传真实 exit code），并在 BACKLOG 打钩 + 新增该阶段排查结论 + CHANGELOG 增条目；persist shape 变更强制升 version + migrate + 数据迁移小节。
> - **证据要求**：bug 记录含模块/复现步骤/预期 vs 实际/文件行号/严重级；修复回传门禁原文；主对话每阶段抽查复核。

### 4.1 P2-A onboarding（子代理：onboarding-dev）

**排查派发要点**
- OnboardingGate 重定向：清空 localStorage → 任意路由重定向 `/onboarding`；BlankLayout 全屏无主导航；完成后刷新不再重定向。
- 三路径：新手（定位测试 5 题 4 维度含解析）/ 有基础（跳过定位）/ 跳过引导。
- 能力评估映射：分数映射 30-70、GTO 默认 50、写入 progress 的 ELO 维度值；核对边界（全对/全错是否 clamp 到 30-70）。
- 微训练末题简单、答错补救仅一次。
- 首胜庆祝 + Day 1 streak（P0-A BUG-02 回归：CelebrationStep 的 `recordTrainingDay()` 存在且幂等）。
- **调试解锁不旁路 onboarding**（反直觉约束，重点核实：grep `isDebugUnlockActive` 在 onboarding 应为无）。
- 边界：引导中途刷新（恢复步骤/安全回退不白屏）、引导期间 URL 直达其他路由被拦回。

**预期修复范围**：能力评估映射越界 clamp、OnboardingGate 重定向漏洞、中途刷新丢步骤、补救超次；调试解锁误旁路（若发现）。

**边界约束**：只改 `src/features/onboarding/`；能力评估写入 progress 属既有接线，若涉及 progress store 逻辑变更则挂起。

### 4.2 P2-B hand-history（子代理：hand-history-dev）

**排查派发要点**
- 三平台真实格式样本导入（PokerStars/GGPoker/PartyPoker），元信息正确。
- 回放：街道时间轴、逐决策点行动序列、玩家座位。
- 标注保存 + 刷新持久（IndexedDB）。
- 筛选（日期/底池/平台）与搜索（牌局号/玩家名）；单删与清空。
- GTO 偏差面板：决策点评级 + EV 损失 + 汇总报告。
- **重点（P1C 移交）**：`utils/gtoDeviation.ts` 消费的 `gtoWorker.ts` 用 `Math.random()` 伪造 evLoss、评级用旧四级词汇（optimal/minor_mistake/mistake/blunder）、与 strategyCompare 双事实源分叉——当前分析结果不可信，需重点定性与修复。
- 边界（解析器重灾区）：格式损坏/空文件/超大文件（1000+ 手）/混合平台/非 UTF-8/玩家名特殊字符/不完整牌局（中途 all-in）/重复导入去重。

**预期修复范围**：解析器正则对格式变体的脆弱性、IndexedDB 打开失败无降级、大量导入卡 UI；gtoWorker 伪造 evLoss → 接入 strategyCompare 真实评级或明确降级。

**边界约束**：只改 `src/features/hand-history/`；gtoWorker.ts 属 `src/workers/`（平台层），若需大改评级逻辑评估是否挂起 platform-dev；优先给解析器补大量边界纯函数单测再修。

### 4.3 P2-C SRS / Dashboard / 进步回放（子代理：progress-dev）

**排查派发要点**
- SRS：三训练模块答题后 ReviewItem 自动注册；题目 ID 跨模块唯一；重复答题只更新不新增。
- SM-2 间隔 1→3→7→14→30：改日期验证到期项进入今日队列（注意 P0-A 已把日期改本地时区，存量 UTC 生成的 nextReviewDate 最多偏 1 天）。
- 复习会话三模式（多选/自评/退化自评）、Quality 评分（对+<5s→5 / 对→4 / 错→1）。
- 混合比例：默认 30%、<0.6→50%、<0.4→70%（`utils/dailyTrainingMix.ts`）。
- **回归专批 B 已建闭环**：QuickDrill 复习题回写（P1E-05）需验证 nextReviewDate 正确推进。
- Dashboard：4 项快速统计、最近 5 条、14 天趋势图（无数据/单日不崩）、打卡日历跨月、难度指示器阈值；今日任务卡日期种子轮换/完成态/streak 全局值；五维雷达图 0-3000 量纲。
- **注意 theory averageTime=0**（P1F 沉淀）：统计层消费 averageTime 时 theory 记录恒为 0，趋势图/平均耗时若纳入 theory 会被拉低，核对消费方是否过滤。
- 进步回放：首次 vs 最近对比、仅一次记录时的行为、进步/退步语义色。

**预期修复范围**：SRS 队列/复习会话缺陷、时区存量偏移处理、Dashboard 统计边界崩溃、averageTime 消费口径。

**边界约束**：progress 是跨模块中枢，本阶段可改 progress store，但任何 persist shape 变更强制升 version + migrate（专批 B/C 已示范零迁移优先路径）；Streak/ELO/SRS/Emotion/Mentor 五大系统集中在 progress store，不得分散。

### 4.4 P2-D 平台能力（子代理：platform-dev + ui-ux-dev）

**排查派发要点**
- 成就系统（26 个/4 类）：抽样触发各类别 ≥2 个；已解锁显示日期、未解锁显示条件与进度；回归 P0-A 修正的 completeLessons/allCertifications/completeTrack 判定（L4A/4B id 覆盖已在 P1-E 验证）；"全成就达成"元成就；成就检查 debounce 不漏。
- 排行榜：本地数据排序正确性、空状态。
- **PWA**：`pnpm build && pnpm preview` 验证 sw.js 注册、断网可访问、manifest 安装；SW 缓存旧版本导致更新不生效（新构建后强刷验证）。
- **i18n（集中收口）**：顶栏切换 zh/en 全页面即时更新；每模块抽查 3-5 处无 key 裸露；理论学院口径（入口/主页 chrome 双语、正文中文）；选项顺序跨语言一致。**汇总修复 P0B-07（导师模板/去复习文案硬编码）、P1C-27（gto 模块零 i18n）及各阶段登记的硬编码扩样**。
- 响应式与可访问性（ui-ux-dev 协同）：三断点（≥1024 / 768-1023 / <768）走查；<768 底部 MobileNav 6 项 + aria-current；13×13 网格与牌桌组件 390px 不溢出；aria-label 抽查、对比度 ≥4.5:1。

**预期修复范围**：i18n 硬编码集中双语化（zh/en 同步，localeParity 守卫）、成就触发缺陷、PWA 缓存更新、响应式溢出、WCAG 对比度/aria。

**边界约束**：i18n 新增 key 必须 zh/en 同步；响应式/可访问性/全局样式变更由 ui-ux-dev 复核；成就逻辑在 progress store（persist 谨慎）。

### 4.5 派发顺序与并行边界

- 严格串行：P2-A → P2-B → P2-C → P2-D（运行时独占 + 依赖有序，与 P0-B~P1-F 一致）。
- P2 阶段若再产生 shared/progress 挂起项，在 P2-D 前追加一次同规格跨模块专批（记为专批 D）。
- 运行时验证（dev server + localStorage + debugMode）同一时刻仅一个子代理操作，避免状态互踩与 HMR 双实例坑。

---

## 五、最终收尾批次安排

对照 BACKLOG 第 232-238 行「执行与产出约定」：

1. **全量门禁**：`pnpm typecheck` + `pnpm lint` + `pnpm test` 三项 exit 0（当前基线 359 测试全绿）。
2. **构建验证**：`pnpm build` 成功产出 `dist/`。
3. **PWA 更新验证**：`pnpm build && pnpm preview` 验证 sw.js 注册、断网可访问、manifest 安装；新构建后强刷确认 SW 不缓存旧版本。
4. **文档归档确认**：确认 BACKLOG 全部条目 `- [x]`，按第 237 行约定将其归档至 CHANGELOG 后删除该文件（删除前向用户确认）。
5. **总报告产出**：各阶段 bug 数 / 严重级分布 / 修复率 / 遗留决策点。

---

## 六、整体进度统计

### 6.1 修复率

- **P0-B ~ P1-F 层 88 项独立发现**：85 项已修复或定性闭环（**96.6%**），3 项（P0B-07/P1C-27 i18n、gtoWorker evLoss）移交对应 P2 阶段，1 项（P0B-05）设计豁免登记。
- **跨模块挂起清单**：15 项 **100% 清空**。
- **门禁健康度**：三项门禁连续 10 个批次 exit 0；测试数 222→359（+61.7%）。

### 6.2 模块覆盖率

| 已完成（8） | range-trainer / pot-odds / gto-simulator / puzzle-trainer / strategy-academy / theory-academy / shared / progress 中枢 |
|---|---|
| 待完成（3 + 横切） | onboarding（P2-A）/ hand-history（P2-B）/ progress 的 SRS·Dashboard 深度（P2-C）/ 平台横切（P2-D） |

模块层覆盖率约 **65%**（8/12.5，P2-C/D 为横切维度）。

### 6.3 预计完成时间

剩余 4 个 P2 阶段（每阶段排查→确认→修复→落盘一轮）+ 1 个收尾批。延续当前节奏，预计 **5-6 个执行轮次** 完成全部工作。

---

## 七、对照原计划的差异分析

| 维度 | 原计划 | 实际执行 | 评价 |
|---|---|---|---|
| 执行顺序 | P0-B→P1→P2 严格串行 | 完全遵循 | 一致 |
| 修复批次独立 | 排查/修复分离 | 严格分离，每阶段两次派发 | 一致 |
| 每层暂停确认 | 输出清单后暂停 | 前两阶段人工确认，后授权"按推荐自动执行" | 用户主动调整，合理 |
| 跨模块处理 | 未明确专批机制 | 新增 A/B/C 三专批分层处理挂起项 | 优于原计划：避免跨模块变更散落各阶段 |
| 发现规模 | 未预估 | 88 项（P1-C 达 27 项超预期） | GTO 模块问题密度最高 |

---

## 八、风险控制措施

1. **persist 迁移风险（最高）**：P2-C 若触及 SRS/Dashboard 持久化 shape，严格执行"升 version + migrate 防御合并 + 数据迁移小节"，优先保守方案（专批 B/C 已示范零迁移路径）。
2. **PWA 缓存陷阱**：收尾 PWA 验证必须新构建后强刷，防 SW 缓存旧版本导致验证失真。
3. **i18n 双语对称**：P2-D 新增 key 必须 zh/en 同步（`localeParity.test.ts` 守卫）。
4. **子代理声明核验**：专批 C 已暴露"P1-A 声称建守卫实际未建"，对 P2 各阶段的"已建测试/已修复"声明做抽样复核，勿全信收尾报告。
5. **归档不可逆**：BACKLOG 删除前必须人工确认全部条目闭环且已归档 CHANGELOG。
6. **解析器优先补测**：P2-B 解析器为纯函数重灾区，先补大量边界单测（损坏/非 UTF-8/超大文件）再修，避免正则脆弱性回归。

---

**结论**：截至 2026-07-31，排查修复工程已完成 P0-B 至 P1-F 全部 7 层及三个跨模块专批，88 项发现中 96.6% 已闭环、跨模块挂起清单 100% 清空、测试基线增至 359 项全绿，且以零 persist 迁移的方式完成所有 progress 中枢口径统一。剩余 P2 四阶段 + 收尾批已有清晰的子代理修复方案与风险预案，可按既定策略继续推进。
