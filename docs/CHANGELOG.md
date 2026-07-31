# 变更日志（CHANGELOG）

> 本文件归档德州扑克训练平台的所有执行历史与版本演进。
> PRD.md 与 TDD.md 仅保留当前规格，历史决策与落地细节统一汇集于此。

---

## 跨模块专批 C（数据一致性） — 2026-07-31

> 处理《跨模块专批挂起清单》最后 3 项（platform-dev 执行）：P1A-06 / P1A-08 range preset ↔ GTO JSON
> 一致性 · P1D-11 puzzle 题目 id 前缀规范。**至此挂起清单全部清空，跨模块专批（A/B/C）全部完成。**
> **persist 变更**：无（组2 走路径 A 零迁移，未触碰任何 persist store 的 shape/version）。
> **GTO 数据红线确认**：全程**未臆造**任何求解器频率数据——preset 重生成均为从既有
> `preflop-ranges.json` 频率表按阈值抄录离散化；JSON 文件本身零改动（只读核验）。
> 门禁：`pnpm typecheck` / `pnpm lint` / `pnpm test` 均 exit 0（359/359 通过，含本批新增 2 个测试文件 13 例）。

### fix(range-trainer) — open/call 类 preset 以 GTO JSON 为源重生成 + 数据源定性（P1A-06，组1）

- **数据源定性（P1-C 结论固化）**：gto-simulator `data/preflop-ranges.json`（6max_100bb_preflop）是
  open / facing-open 场景的权威频率源；range-trainer open/call 类 preset 按「频率 ≥ 0.5」离散化生成
- **执行偏差说明**：任务前提称「P1-A 修复批次已重生成并建守卫」，经排查**守卫测试不存在**且
  open/call preset 与 JSON 存在实际漂移（utg-open 缺 8 手、btn-open 多 17 手等）——本批按
  「若未建或覆盖不全，补齐」条款一并补齐
- `constants.ts` 重生成 6 个 preset（以 JSON ≥0.5 为源）：utg-open 34→42 手、hj-open 48→47 手、
  co-open 58→66 手、btn-open 93→76 手、sb-open 72→75 手、bb-call-vs-btn 59→60 手；
  bb-3bet-vs-btn 与 JSON `bb_vs_btn_open.raise≥0.5` 已一致（10 手，零改动）
- **「发起 3-bet」类不臆造数据**：JSON 的 `btn_vs_co_3bet` / `co_vs_hj_3bet` 语义是「Hero open 后
  **面对** 3-bet 的响应」，与 range-trainer「面对 open **发起** 3-bet」是**不同 spot，不得互相校验**；
  `btn-3bet-vs-co` / `co-3bet-vs-hj` / `4bet-range` 三个 preset 定性为**模块自身权威源**（教学参考范围），
  constants.ts ADVANCED 段头注释固化该定性与「严禁为对齐而臆造 JSON 频率数据」红线
- 新增跨模块守卫 `src/rangePresetGtoConsistency.test.ts`（置于 src 根，同 eslintCrossImports.test.ts
  先例——range-trainer 依 ESLint 模块隔离不得引用 gto-simulator）：7 对映射断言 preset ↔ JSON ≥0.5
  集合全等；3 个排除项显式登记（注释排除原因）；守卫映射+排除项恰好覆盖全部 ADVANCED preset
  （新增 preset 必须显式归类）；另设 JSON 语义提示测试防 `btn_vs_co_3bet` 表语义漂移

### fix(range-trainer) — preset 名称百分比标注按组合占比重算（P1A-08，组1）

- 所有 `(~N%)` 标注按组合数加权占比（对子 6 / 同花 4 / offsuit 12，P1A-07 口径）重算：
  utg ~19% · hj ~22% · co ~32% · btn ~39% · sb ~38% · bb-call ~33%；3-bet/4-bet 类补标注
  （btn-3bet ~6% · co-3bet ~5% · bb-3bet ~5% · 4bet ~4%）；HU BTN 标注 ~75%→~62%（原标注失真）
- 守卫测试断言：全部带标注 preset 的标注值与 `getRangeComboPercentage` 实际占比偏差 ≤ 1pp

### chore(puzzle-trainer) — 题目 id 前缀规范定性（P1D-11 路径 A，组2，零迁移）

- **核查结论（路径 A 成立，比预期更强）**：puzzle-trainer **完全不注册 SRS ReviewItem**
  （全模块 0 处 `addReviewItem` / `processReview` 调用；`inferPuzzleLessonId` 仅用于
  relatedLessonId 反馈链接），题库短 id（`rfi-001` 式）从不进入 progress SRS 键空间，
  与 `range:` / `odds:` / `gto:` 前缀键无碰撞可能
- 处置：**不改题库数据、不做存量迁移**；`puzzle:{theme}:{questionId}` 规范修订为仅约束
  「未来接入 SRS 时**注册处**的 key 拼接」（题库静态数据保持短 id）
- 规范表述修订：`.qoder/agents/puzzle-trainer-dev.md`（题目 ID 口径 + Quality Checklist）、
  `docs/TDD.md` SRS 章节补「puzzle-trainer 不注册 SRS」定性说明
- 新增守卫 `data/puzzleBank.ids.test.ts`（3 例）：全库 id 唯一（跨 10 主题）、205 题/10 主题
  规模锁定、id 不含 `puzzle:` 前缀（前缀仅在未来 SRS 注册处拼接）

### docs — TDD 数据源规范落盘

- `docs/TDD.md` range-trainer 章节新增「预置范围数据源」段落：open/call 类以 JSON 为源 ≥0.5
  离散化 + 守卫位置；发起 3-bet / 4-bet 类为模块自身权威源，严禁臆造求解器数据

---

## 跨模块专批 B（progress 中枢口径） — 2026-07-31

> 处理《跨模块专批挂起清单》中涉及 progress store 跨模块中枢的口径统一 4 组（platform-dev 执行）：
> P1A-04/P1F-03 兜底 · P1D-06/P1F-01 SessionLimitGuard 家族 · P1E-07 streak 口径 · P1E-05 SRS 回写。
> **persist 变更**：无。四组均未触碰任何 persist store 的 shape/version：
> 组1 仅 action 内判定逻辑；组2 仅 hook 判定时机（既有字段结构不变）；组3 仅补调既有幂等 action；
> 组4 复用既有 processReview/updateReviewItem（ReviewItem 已含全部 SM-2 字段），新增的 PracticeResult.answers
> 逐题明细在 academy store 入库前剥离，practiceResults 持久化负载形状不变（persist-shape 快照测试未动，全绿）。
> 门禁：`pnpm typecheck` / `pnpm lint` / `pnpm test` 均 exit 0（346/346 通过，含本批新增 3 个测试文件 11 例）。

### fix(progress) — addRecord 空会话拒收兜底（P1A-04 + P1F-03，组1）

- `features/progress/store.ts` `addRecord`：`totalQuestions <= 0`（或 result 缺失）的训练记录不入账（不计 records、不影响统计/streak 链路）
- 定位：中枢纵深防御——模块侧（range-trainer 空会话入口 / theory 空题库 effect）已各自阻断，此处防止未来任何模块发空会话污染统计
- 回归：新增 `store.addRecord.test.ts`（拒收 0/负数 · 正常入账 · 重复 id 去重 · 统计口径不受污染）

### fix(progress) — SessionLimitGuard 开局判定口径统一（P1D-06 家族 + P1F-01，组2）

- `useSessionLimitReached()` 由响应式 `dailyQuestionsAnswered >= limit` 改为**开局判定**：挂载时一次性快照额度并用 ref 冻结
  - 开局已达上限 → 拦在训练开始前（提示「今日已达题量上限」）
  - 会话进行中额度耗尽 → 不再中途翻转拦断（原口径会整体卸载进行中会话：无结算、无 emit 直接丢弃），允许走完结算；下次进入训练页（新挂载）再拦
  - 调试解锁旁路保留响应式（激活即放行；激活期间不冻结快照，关闭后按开局口径重新判定）
- hook 层单点修复，覆盖全部 “同款” 调用点：puzzle Rush/Daily/Theme 三模式、strategy QuickDrill、theory 章末小测（TheoryChapterView）——调用点零逻辑改动（仅注释同步）
- 已知边界（已写入注释）：同一挂载内的「再来一轮/重考」沿用挂载时快照，直到重新进入页面才重新判定
- 回归：新增 `components/SessionLimitGuard.test.tsx` 4 例（中途耗尽不翻转 · 开局已达即拦 · limit=0 放行 · debug 旁路）

### fix(strategy-academy) — 训练日 streak 口径跨模块统一（P1E-07，组3）

- 口径：**任何一次实质训练完成都计入训练日 streak**（与 theory/puzzle/其他训练模块归口）
- `CourseView.tsx`：课程测验完成（handleQuizComplete）与 Drill 完成（handleDrillComplete）补调 `recordTrainingDay()`
- `QuickDrill.tsx`：`recordTrainingDay()` 移出 `isQuickMode` 块，普通模式完成同样计入
- progress store 的 action 未改（recordTrainingDay 幂等性 P0-A 已验证，同日重复调用安全），仅跨模块调用点补齐

### fix(strategy-academy) — QuickDrill 复习题 SRS 回写闭环（P1E-05，组4）

- 核查结论：progress 已有完整公开 API（`processReview` SM-2 纯函数 + `updateReviewItem` action），**无需新增 action**，本批建立完整回写闭环（非降级为 API 骨架）
- 链路：`types.ts` 新增 `PracticeAnswerDetail` + `PracticeResult.answers?`（逐题明细，仅供完成回调侧消费）→ `PracticeDrill.tsx` 用 answersRef 记录逐题 `{questionId, isCorrect, timeTaken}` 随 result 上报 → 新建 `utils/quickDrillSrs.ts` 纯函数（quality 映射：对+快(<5s)→5 / 对→4 / 错→1，对齐 TDD 既有口径；非 review-* 忽略；复习项已清理静默跳过） → `QuickDrill.tsx` handleComplete 逐项 `updateReviewItem` 回写（间隔推进 1→3→7→14→30，答错重置 1 天）
- persist 不变：`academy store.recordPracticeScore` 入库前剥离 `answers`，practiceResults 持久化负载与历史形状一致；ReviewItem 既有字段（easeFactor/interval/repetitions/nextReviewDate）足够，未动 progress shape
- 边界：本批仅建立「QuickDrill 复习题回写」闭环；SRS 其余方面（复习会话/队列管理/其他消费方）由 P2-C 专项全面排查
- 回归：新增 `utils/quickDrillSrs.test.ts` 6 例（quality 映射 · 答对推进 nextReviewDate · 间隔进档 1→3 · 答错重置 · 非 review-*/失配跳过）

---

## 跨模块专批 A（清理类） — 2026-07-31

> P1 全阶段排查修复完成后，处理《跨模块专批挂起清单》中零状态风险的清理/防御类 7 项（platform-dev 执行）。
> **persist 变更**：无。未改任何 persist store 的 version/shape（纯函数 / 路由 / 测试配置 / 注释 / 死代码删除）。
> 门禁：`pnpm typecheck` / `pnpm lint` / `pnpm test` 均 exit 0（335/335 通过；eslintCrossImports 全量并发实测 3.7s，已在新上限内）。

### fix(shared) — pokerMath 边界防御 + 死函数删除 + JSDoc 口径澄清

| 项 | 描述 | 文件 |
|---|---|---|
| P1B-10 | 全函数边界防御：新增 `sanitizeNonNegative`（金额/outs：NaN/±Infinity 归 0、负值 clamp 0）与 `sanitizeRate`（胜率 clamp [0,1]）入口守卫；`estimateEquity` 结果 clamp [0,1]、`estimateEquityShortDeck` 单街概率 clamp [0,1] 后结果 clamp [0,100]（修复 outs>31 互补概率溢出为负，历史缺陷 outs=100 → -419%）；`calculatePotOdds` 负 bet 不再返 -1；`isProfitableCall` 非法入参保守返 false。clamp 仅作用于非法边界输入，正常值语义不变（calculateEV 结果保留可负） | `shared/utils/pokerMath.ts` |
| calculateImpliedOdds 处置 | grep 确认全仓零运行时调用（仅本体 + 自身测试 + oddsMath.ts 注释提及）后删除函数及其测试；其「potOdds + gain」方向本身错误（P1B-02 已在 pot-odds 侧以「收益并入底池」口径替代）；shared/utils/index.ts barrel 未导出 pokerMath（仅注释提示直接 import），无需清理 | `shared/utils/pokerMath.ts` / `pokerMath.test.ts` |
| JSDoc 口径澄清 | `calculatePotOdds` 明确 potSize 为「已含对手本次下注的底池总额」，分开维护时需调用方自行并入（bet/(pot+bet+bet) 权威三项式示例）；`calculateEV` 明确 winAmount 应含对手本次下注——均对齐 pot-odds `utils/oddsMath.ts` 头注口径，标注 P1B-01/03 历史缺陷根因防再误用；oddsMath.ts 头注同步删除「挂起 platform-dev」过期表述 | `shared/utils/pokerMath.ts` / `pot-odds/utils/oddsMath.ts`（仅注释） |

回归测试：`pokerMath.test.ts` 由 8 例扩至 21 例（负值 / NaN / Infinity / 溢出封顶 / 胜率越界 / EV 可负语义保留全覆盖）。

### chore(workers) — 删除 useGTOWorker.ts 死代码 hook（P1-C 定性 B）

- grep 确认：`useGTOWorker` 全仓零外部引用（仅自身文件定义）；`gtoWorker.ts` 仍被 `hand-history/utils/gtoDeviation.ts` L133 消费 → **只删 `src/workers/useGTOWorker.ts`，保留 `gtoWorker.ts`**，删除后无 import 悬空
- gtoWorker.ts 伪造 evLoss/旧四级评级问题维持移交 P2-B（本批不处理）
- TDD 同步：目录树删 useGTOWorker.ts 行；§8.1 改写为 gtoDeviation.ts 消费口径，删除 hook 健康检查/一次性重建段落

### fix(app) — 删除 `/range-trainer/result/:sessionId` 死路由（P1A-13）

- grep 确认全项目无 navigate 指向该路由；`SessionResultPage` 仅 routes.tsx 引用（占位页，store 无 persist 直接刷新必空白）
- 删除：routes.tsx 路由注册 + lazy import、`range-trainer/components/SessionResultPage.tsx`、`app/pages/placeholder.tsx`（createPlaceholder 工厂仅被 SessionResultPage 消费，连带成为死代码一并删除）
- TDD 同步：路由表删该行；目录树删 `app/pages/placeholder.tsx` 行

### test(platform) — eslintCrossImports testTimeout（挂起清单 #11）

- `src/eslintCrossImports.test.ts` 动态 import `eslint.config.js` 连带加载 eslint 插件链，全量 `pnpm test` 并发下与其他测试竞争资源偶发超过默认 5000ms（单跑 1.4s 稳定绿）
- 修复：仅该 it 传入 `{ timeout: 30000 }`，不动全局默认 timeout（vitest.config.ts 未改）；本批全量实测该用例 3689ms 通过

### docs(strategy-academy) — track-theory-bridge 孤岛定性注释修正（P1F-05）

- **裁决：维持数据现状不补引用，修正注释口径**。理由：theory-academy 9 个 Level 的 practiceRecommendations 定向推荐均指向 track-beginner/track-gto/track-cash-game，补引用需改 theory 数据且属臆测产品意图，风险更高；轨道本身经 `/academy/tracks` 泛浏览可达，非不可达孤岛，仅注释与实现矛盾
- `learningTracks.ts` 注释改为：通用「理论→实践」入口轨道，经泛浏览发现，非各 Level 定向推荐目标；TDD 5.8 第 9 条同步同口径

### 落盘同步

- `docs/BUG_HUNT_BACKLOG.md`：《跨模块专批挂起清单》增状态列，本批 7 项标「已修复 + CHANGELOG 2026-07-31（专批 A）」，专批 B/C 项保留挂起；P1-A/P1-B/P1-C/P1-F 各分散登记点同步
- `docs/TDD.md`：目录树（workers / app/pages）、路由表、§8.1 Web Worker、§5.8 理论→实践桥接四处同步

---

## fix(theory-academy) — 2026-07-31（P1-F 排查 5 项：3 项修复 + 2 项挂起）

> 基于 P1-F（理论学院 theory-academy）排查确认的 5 项问题：本批修复 3 项（均在 `src/features/theory-academy/` 内闭环），P1F-01（SessionLimitGuard 小测中途拦，并入 P1D-06 家族专批扩围）与 P1F-05（track-theory-bridge 孤岛定性，双模块数据协调）挂起 platform-dev 专批；P1F-03 的 progress 侧 totalQuestions=0 拒收兜底并入 P1A-04 兜底专批。排查结论已落盘 `docs/BUG_HUNT_BACKLOG.md`《P1-F 排查结论（2026-07-31）》。
> **persist 变更**：无。未改 theory-academy-progress store 的 persist version（v1）与 shape，无迁移需求。

### 修复明细

| 编号 | 描述 | 文件 |
|---|---|---|
| P1F-02 | "下一章"跨 Level 顺延指向未解锁 Level，点击被章节页门禁 Navigate 静默弹回 /theory → 渲染前用目标章节所属 Level 解锁态校验（含调试解锁旁路），未解锁降级为不可点击提示文案“完成本级剩余章节后解锁：…”；新增 `isLevelUnlockedByCompleted` 纯函数，store.isTheoryLevelUnlocked 委托同一实现（单源防口径分叉）；两处“下一章”按钮（回访阅读页 / done 页）抽取 NextChapterNav 统一接入 | utils/theoryProgress.ts / store.ts / components/NextChapterNav.tsx (new) / TheoryChapterView.tsx |
| P1F-03 | 空题库防御 effect（`if (isEmpty) onComplete(100,0,0)`）无一次性守卫，StrictMode 双跑 → completeChapter 双调、训练事件双 emit → 加 `completedRef` 一次性守卫（对齐 range-trainer TrainingSession 防重入模式） | components/TheoryQuiz.tsx |
| P1F-04 | 桥接跳转丢失 track 参数：`navigate('/academy/tracks')` 不带 `?track=`，P1E-01 建好的 LearningTracksView 消费方（滚动高亮）收不到 → 两处改 `navigate(\`/academy/tracks?track=${rec.trackId}\`)`（track-beginner/track-gto/track-cash-game） | components/PracticeBridgeCard.tsx / TheoryLevelCard.tsx |

### 挂起项

| 编号 | 描述 | 归口 |
|---|---|---|
| P1F-01 | SessionLimitGuard theory 小测中途拦（quiz 阶段中途翻转丢弃作答进度） | platform-dev（并入 P1D-06 开局拦/中途拦口径家族专批扩围） |
| P1F-03 兜底 | progress 侧 totalQuestions=0 训练结果拒收防御 | platform-dev（并入 P1A-04 兜底专批） |
| P1F-05 | track-theory-bridge 轨道孤岛定性（裁决补引用 or 修正注释） | platform-dev + 双模块 |

### 回归测试新增

- `utils/theoryProgress.test.ts` (8 tests)— P1F-02 跨 Level 顺延/解锁判定/未解锁复现路径/顺序学习流不变式
- `components/TheoryQuiz.test.tsx` (2 tests)— P1F-03 StrictMode 空题库 onComplete 单发 / 非空题库不自动完成

---

## fix(strategy-academy) — 2026-07-31（P1-E 排查 13 项：11 项修复 + 2 项挂起）

> 基于 P1-E（策略学院 strategy-academy）排查确认的 13 项问题：本批修复 11 项（均在 `src/features/strategy-academy/` 内闭环），P1E-05（QuickDrill SRS 复习回写）与 P1E-07（训练日 streak 口径统一）挂起 platform-dev + P2-C 专批。
> **persist 变更**：无。未改 strategy-academy-progress store 的 persist version（v2）与 shape，无迁移需求。

### 修复明细

| 编号 | 描述 | 文件 |
|---|---|---|
| P1E-01 | track 跳转参数无消费方 → 改跳 `/academy/tracks?track=<id>`；LearningTracksView 消费 `?track=` 滚动高亮 | CourseView.tsx / LearningTracksView.tsx |
| P1E-02 | 轨道前置判定认证口径→课程完成口径（统一 CourseView 本土课门禁） | learningTracks.ts / LearningTracksView.tsx |
| P1E-03 | LearningTracksView 前置未满足按钮不禁用 → disabled + 跳转链接 | LearningTracksView.tsx |
| P1E-04 | QuickDrill 复习题混入总题数缩水 → 缺口回填保证题数契约 | quickDrillMix.ts (new) / QuickDrill.tsx |
| P1E-06 | PracticeDrill adaptive 重排破坏复习题前置顺序 → QuickDrill 传 `adaptive={false}` | QuickDrill.tsx |
| P1E-08 | LevelCard l4a/l4b 进度环口径错位 → 改用条目自身口径 | LevelCard.tsx / AcademyHome.tsx |
| P1E-09 | 认证重试不重洗 → handleRetry 重置 sessionSeed；题池洗牌改 shuffleBySeed | LevelCertification.tsx / certificationExam.ts (new) |
| P1E-10 | 冻结卡文案硬编码“7 天”→ {{count}} 插值实际 quickDrillStreak | QuickDrill.tsx / zh.json / en.json |
| P1E-11 | QuickDrill 正确率零值边界 → totalQuestions>0 判别无数据 | QuickDrill.tsx |
| P1E-12 | ConceptGraph 本土课节点锁定口径 → 按 LOCAL_TRACK.prerequisiteLevelIds 判定 | ConceptGraph.tsx |
| P1E-13 | PracticeDrill 超时判 Fold 对 → 超时强制 isCorrect=false（对齐 P1A-02） | PracticeDrill.tsx / practiceGrading.ts (new) |

### 挂起项

| 编号 | 描述 | 归口 |
|---|---|---|
| P1E-05 | QuickDrill 复习题答完 SRS 不消化（需 progress 复习回写 API） | platform-dev + P2-C |
| P1E-07 | 训练日 streak 口径跨模块统一（strategy 课程/Drill 不计 streak） | platform-dev（与 P1-F theory 同款归口） |

### 回归测试新增

- `data/learningTracks.test.ts` (6 tests)— P1E-02 前置口径
- `utils/quickDrillMix.test.ts` (6 tests)— P1E-04 题数回填
- `utils/certificationExam.test.ts` (6 tests)— P1E-09 重试重洗
- `utils/practiceGrading.test.ts` (7 tests)— P1E-13 超时判错

---

## fix(puzzle-trainer) — 2026-07-31（P1-D 排查 12 项：10 项修复 + 2 项挂起：Rush 难度递增 / failed 计分口径 / 计时后台漂移 / 命耗尽状态边界 / 统计污染 / Daily 跨日标记）

> 基于 P1-D（扑克谜题 puzzle-trainer）排查确认的 12 项问题：本批修复 10 项（均在 `src/features/puzzle-trainer/` 内闭环），P1D-06（SessionLimitGuard 口径，P1-E QuickDrill 同款）与 P1D-11（题目 ID `puzzle:` 前缀，涉 SRS 存量迁移）挂起 platform-dev 专批。排查结论已落盘 `docs/BUG_HUNT_BACKLOG.md`《P1-D 排查结论（2026-07-31）》。
> **persist 变更**：无。未改 puzzle-trainer-store 的 persist version（v2）与 shape，无迁移需求。
> **P1D-10 甄别结论**：4 个单主题正确答案位置超 60% 经甄别为动作类选项语义固定排序（消极→激进）的自然结果（全库 615 选项 100% 动作类），**不算 bug**：不改题库、不强制单主题 ≤60%，守卫测试改为分型断言（动作类验语义排序正确性，文字陈述类断言 ≤60%）。

### 代码变更

**组一：引擎正确性（Rush 计分 / 计时 / 状态机）**
- **fix**（P1D-01）：`data/rushQuestions.ts` 分段配比切片（easy/medium/hard 各 ⌈count/3⌉，不足从剩余题补齐，末尾稳定排序保难度非降序），修复旧 `slice(0,30)` 导致 30 题全难度 1、难度递增失效；新增 `rushQuestions.test.ts`（5 例：10/10/10 配比 / 非降序 / 同日确定性 / id 无重复 / count=12）
- **fix**（P1D-02）：新建 `hooks/puzzleEngineCore.ts`（纯函数层），`computeSessionScore` 在 `status==='failed'`（命耗尽）时剩余时间分归 0（只计对题分+命分），修复“快速送命比打满分高且可刷 rushBest”的激励反常
- **fix**（P1D-03）：`hooks/usePuzzleEngine.ts` 倒计时改 Date.now() 段式基准（对齐 range-trainer P1A-12 useTimer 口径）：剩余 = 总时长 + 累计连对奖励(bonusAwarded) − 墙钟耗时，250ms tick，后台节流恢复后一次性追平，不可再切后台作弊
- **fix**（P1D-04）：`next()` 命耗尽判定前置于“无下一题”（末题命耗尽不再误判 completed）；倒计时归零分支区分 `lives===0 → failed`
- **fix**（P1D-05）：`buildPuzzleResult` 中 rush 未答完时 `totalQuestions` 取 `answers.length`（已答数），修复 emit 恒=30 稀释全局正确率/题数虚增、结果页 “10/30” 与 accuracy 自相矛盾；buildResult / trainingEvents.emit / 结果页三处单源同口径；新增 `puzzleEngineCore.test.ts`（10 例：failed 不计时间分 / totalQuestions=已答数 / 连对奖励 / 重复作答幂等）
- **fix**（P1D-12）：删除 `end()` 死代码（无调用方）与空 effect `if(answered){}`；顺手修正 `types.ts` / `PuzzleCard.tsx` 头注过时的“三级反馈/评级”注释为五级

**组二：三模式交互**
- **fix**（P1D-07）：`DailyPuzzle.tsx` 完成时实时计算 `getDailyKey(new Date())`（不用 mount 冻结值），retry 时 `setToday(new Date())` 同步刷新，修复跨午夜 retry 抽今天题却 `markDailyCompleted(昨天)` 的错日标记
- **fix**（P1D-08）：`PuzzleHome.tsx` Rush 卡片新增 3/5 分钟双按钮入口（`?duration=3|5`，stopPropagation 防卡片点击冲突；文案 “3 min/5 min” 语言中立，不扩大 i18n 硬编码面）
- **fix**（P1D-09）：`PuzzleHome.tsx` themeBest 改 `usePuzzleStore((s) => s.themeBest)` 响应式订阅（旧 render 中 `getState()` 非响应式）

**组三：守卫与行数治理**
- **test**（P1D-10）：`puzzleBank.optionOrder.test.ts` 新增分主题分布守卫：动作类逐题验语义排序正确性（输出分布供监控），文字陈述类断言 ≤60%，并硬断言当前题库 100% 动作类
- **refactor**（≤200 行治理）：新建 `hooks/usePuzzleSession.ts`（三模式会话接线去重：选中项/recordAnswer/完成提交/emit 单源）、`utils/trainingRecord.ts`（puzzleResultToTrainingRecord 下沉）、`components/PuzzleCardFeedback.tsx`（五级反馈面板）、`components/PuzzleCardChrome.tsx`（RushStatusBar/InfoChip）、`components/PuzzleResultParts.tsx`（StatCard/WrongAnswerList）；除静态题库数据 `data/puzzleBank.ts` 外全部文件 ≤200 行

### 挂起登记（跨模块专批，见 BUG_HUNT_BACKLOG 挂起清单第 5/6 项）
- **P1D-06**：SessionLimitGuard 开局拦 vs 中途拦口径统一（P1-E QuickDrill 同款需一并处理）——platform-dev
- **P1D-11**：题目 ID 加 `puzzle:` 前缀规范化（涉 SRS 存量 ReviewItem 键迁移）——platform-dev 评估

---

## fix(gto-simulator) — 2026-07-31（P1-C 排查 27 项：24 项修复 + 3 项挂起/移交：判分正确性 / 发牌唯一性 / 翻后策略接入 / EV 单位统一 / 多步底池计算）

> 基于 P1-C（GTO 模拟器 gto-simulator）排查确认的 27 项问题：本批修复 24 项（均在 `src/features/gto-simulator/` 内闭环），useGTOWorker 删除挂起 platform-dev，gtoWorker 移交 P2-B，i18n 移交 P2-D。排查结论已落盘 `docs/BUG_HUNT_BACKLOG.md`《P1-C 排查结论（2026-07-31）》。
> **persist 变更**：无。store 未使用 persist 中间件，无版本迁移需求。
> **SRS id 历史数据说明**：P1C-07 将 SRS ReviewItem id 从 `gto:${scenario.id}`（含时间戳）改为稳定语义键 `gto:${spotKey}:${handNotation}`。旧 id 的 ReviewItem 不迁移，自然淡出；重复训练同 spot+hand 时新键生效。

### 代码变更

**组一：判分正确性**
- **fix**（P1C-01/26）：`boardGenerator.ts` 重写为牌堆抽取模式，新增 `excludeCards` 参数，确保 hero 2张 + board 5张全局唯一
- **fix**（P1C-02）：`strategyCompare.ts` evLoss 恒 `Math.max(0, ...)` + 超注惩罚模型（all-in 不再判 best）
- **fix**（P1C-03）：`store.ts` 删除局部 `determineSpotKey`，复用 `utils/spotKey.ts` 的 `resolveSpotKey`（null 显式 fallback）
- **fix**（P1C-04/23）：新建 `utils/postflopStrategy.ts`，接入 postflop-ranges.json texture_strategy + classifyHandStrength 含 weak_hand + cbet_frequencies sizing
- **fix**（P1C-05）：多步首节点改用 `getPreflopHandStrategy` 查表（不再硬编码 {0.2,0.3,0.5}）
- **fix**（P1C-06）：ELO 移入 `currentNodeIndex===0` 块内（对齐 SRS/Emotion 仅首决策节点）
- **fix**（P1C-07）：SRS id 改稳定语义键 `gto:${spotKey}:${handNotation}`
- **fix**（P1C-08）：新建 `utils/handDifficulty.ts`（169 全覆盖，A2s 补入 ADVANCED）
- **fix**（P1C-09）：`GTOSessionPage` relatedLessonId 改用 activeStreet
- **fix**（P1C-10）：`strategyCompare.ts` isOptimal 改为 `evLoss < GRADE_THRESHOLDS.correct`（引用 shared 常量，只读不改）

**组二：功能/显示**
- **fix**（P1C-11）：types.ts 新增 `evLossBB100` 字段，统一 BB/100 口径（结果页/首页显示 BB/100）
- **fix**（P1C-12）：`GTOSessionPage` 传入真实 callAmount（preflop=lastRaise / postflop=pot×sizing）
- **fix**（P1C-13）：`GTOFeedback.tsx` 显示 `Math.max(0, evLoss)` 防御
- **fix**（P1C-14）：`GTOResultPage` 矩阵按会话 spotKey，无数据渲染占位
- **fix**（P1C-15）：`SpotTrainer` BB 从位置选项剔除
- **fix**（P1C-16）：`GTOSessionPage` 透传 exploitMode/exploitStrategy/selectedOpponent 给 GTOFeedback
- **fix**（P1C-17）：`DecisionTree` 未来节点牌面渲染卡背 "?"
- **fix**（P1C-18）：`GTOSessionPage` userDecisions 取结构化 userAction 字段

**组三：数据/状态**
- **fix**（P1C-19）：store 新增 `decisionStartAt` 每题重置（timeTaken 不再累计）
- **fix**（P1C-20）：`scenarioGenerator.ts` 多步 potSize 由 previousActions 累加真实底池
- **fix**（P1C-21）：`scenarioGenerator.ts` turn/river 重算 classifyBoardTexture
- **fix**（P1C-22）：store 删除无消费者死状态 selectedSpotKey/highlightedHand
- **fix**（P1C-24）：`GTOResultPage` 除零防御 `|| 1`
- **fix**（P1C-25）：3-bet 场景 previousActions 含 hero open + 后位 3-bet（语境完整）

**架构重构**
- `useScenarioEngine.ts` 从 598→62 行（逻辑抽至 utils/scenarioGenerator.ts、handDifficulty.ts、postflopStrategy.ts、spotKey.ts）
- `store.ts` 从 361→193 行（删除局部 helpers，复用 utils）

### 测试新增
- `boardGenerator.test.ts`（4 测试：发牌唯一性 P1C-01/26）
- `handDifficulty.test.ts`（5 测试：169 全覆盖守卫 P1C-08）
- `postflopStrategy.test.ts`（7 测试：翻后策略随牌力变化 P1C-04）
- `strategyCompare.test.ts` 增补4 测试（All-In 不再 best P1C-02；isOptimal 边界 P1C-10）

### 挂起/移交
- useGTOWorker.ts + gtoWorker.ts 删除 → 挂起 platform-dev 专批
- P1A-06 发起 3-bet spot 数据补齐 + range-trainer 对齐 → 挂起专批
- gtoWorker.ts 伪造 evLoss/旧四级评级 → 移交 P2-B
- P1C-27 i18n 硬编码 → 移交 P2-D

---

## fix(pot-odds) — 2026-07-31（P1-B 排查 11 项：10 项修复 + 3 项挂起：赔率核心口径 / 隐含赔率方向 / EV 漏算 / SRS 去重 / 评级展示 / 输入边界）

> 基于 P1-B（底池赔率 pot-odds）排查确认的 11 项问题：本批修复 P1B-01～09/11 共 10 项（均在 pot-odds 模块内闭环），P1B-10 等 3 项挂起 platform-dev 专批（见下）。排查结论、挂起清单与观察项已落盘 `docs/BUG_HUNT_BACKLOG.md`《P1-B 排查结论（2026-07-31）》。
> **关键口径裁决（已确认）**：底池赔率所需胜率以题库三项式为权威——所需胜率 = 跟注额 / (当前底池 + 对手下注 + 我方跟注额) = `bet / (pot + bet + bet)`（pot=100, bet=50 → 25%）；计算器 UI 将"底池"与"对手下注"分开输入，故在模块内 hook/util 层把对手下注并入底池后再调 shared 纯函数，**未修改 `shared/utils/pokerMath.ts` 本体**。

### 代码变更

- **fix(pot-odds)**（P1B-01，最重 + P1B-02/03 同批）：口径计算抽为纯函数 `utils/oddsMath.ts` 的 `computeOddsResult`（useOddsCalculation 变转发层，可直接单测）：
  - **P1B-01 底池赔率**：`calculatePotOdds(potSize, betSize)` → `calculatePotOdds(potSize + betSize, betSize)`，对手下注并入底池参数，输出与题库三项式一致（pot=100/bet=50：33.3% → 25%）
  - **P1B-02 隐含赔率方向修正**：弃用 shared `calculateImpliedOdds`（方向相反：收益越大所需胜率越高，gain 够大时 >100%），改用 `calculatePotOdds(potSize + betSize + impliedOddsGain, betSize)` 组合实现——所需胜率 = `bet / (pot + bet + bet + gain)`，隐含收益并入底池，收益越大所需胜率越低
  - **P1B-03 EV 漏算对手下注**：`calculateEV(eq, potSize, betSize)` → `calculateEV(eq, potSize + betSize, betSize)`（赢时获得 = 底池 + 对手下注）；与 P1B-01 同批修复，消除两处"错得自洽"，isProfitable 与 EV 符号保持一致
- **fix(pot-odds)**（P1B-04）：补救题 id 由 `10000 + Date.now()` 改为固定常量 `RESCUE_QUESTION_ID = 9998`（constants.ts 新增，与末题 `EASY_LAST_QUESTION_ID = 9999` 错开、与题库 1-19 错开）：SRS 复习项 `odds:9998` 可正常去重更新，不再每轮补救新增内容相同但 id 不同的 ReviewItem；顺带补齐补救分支遗漏的 `setDecisionFeedback(null)` 重置
- **fix(pot-odds)**（P1B-05，=P0B-04 分流项）：PotOddsQuizPage 评级展示改用 `GRADE_DISPLAY_CONFIG[grade]` 的 `icon + t(titleKey)`（`feedback.grade.*` zh/en 均已存在，无需补 key）+ `.grade-*` 容器类（color+textColor），对齐 QuizCard/GTOFeedback；**答对也展示评级徽章**（best/correct），不再仅答错时渲染；"去复习"链接仍仅答错且有 relatedLessonId 时显示。注：真实 evLoss 分级（inaccuracy/blunder）需题库补 evLossBB 数据，本批不做数据标注，evLoss 维持兜底（答对=0，答错=3），已登记观察项
- **fix(pot-odds)**（P1B-06）：PotSizeInput 引入本地字符串草稿态（`draft`）：输入中显示草稿原文，失焦丢弃草稿回填 state 值——清空/非法输入不再出现"DOM 空白但计算用旧值"的显示与计算脱节
- **fix(pot-odds)**（P1B-07）：PotSizeInput 统一 `clamp(v) = Math.max(min, Math.min(max, v))`：快捷按钮（含 OddsCalculator 的 1/2 Pot～2x Pot）、数字输入、滑块三入口均走 clamp，高亮判定同步改 `value === clamp(btn.value)`；不再产生 betSize=20000（>max）或 <min 值
- **fix(pot-odds)**（P1B-08）：EVCalculator 盈亏平衡提示增加相等分支：胜率=平衡点时显示 `=` 与"盈亏平衡"（三分支 >盈利 / =盈亏平衡 / <亏损），消除"50% < 50.0% → 盈利"符号与结论矛盾
- **fix(pot-odds)**（P1B-09）：EquityChart 由 EV 分析 tab 移入底池赔率 tab（OddsCalculator 与 DrawsReference 之间）。方案理由：该图表渲染"需要胜率 vs 估算胜率"，数据源 useOddsCalculation 正是 odds tab 的输入态（底池/下注/Outs）；而 EV tab 持独立 evState（winRate/callAmount）且已有自己的 EV-胜率曲线图，旧布局导致"调 EV tab 滑块图表不动"的错位，按信息架构归位比换数据源更合理
- **chore(pot-odds)**（P1B-11）：删除死代码 `hooks/useEquityEstimate.ts`（全仓确认无组件消费，仅 index.ts re-export）及其 index.ts 导出；index.ts 改导出 `computeOddsResult`；TDD 5.x pot-odds hooks 表格同步

### 回归测试（新增 11 例，`utils/oddsMath.test.ts`）

- P1B-01（3 例）：100/50→25%、80/80→33.3%、150/37.5→16.7%
- P1B-02（3 例）：gain 0→50→200 所需胜率严格递减；公式核对 gain=50→20%；超大 gain 不产生 >100%
- P1B-03（3 例）：排查计划口径 eq=0.35/pot+bet=150/r=50→+20；面板组合 9 outs flop（36%）→+22 且 isProfitable 与 EV 符号一致；反例 4 outs turn→-34 且 isProfitable=false
- P1B-04（2 例）：末题/补救题固定 id 常量互不冲突且与题库错开；两轮补救构造 SRS key `odds:9998` 完全一致可去重（含选项顺序确定性）

### 挂起决策（3 项，platform-dev 专批，已登记 BUG_HUNT_BACKLOG 挂起清单第 5-7 项）

- **P1B-10**：`shared/utils/pokerMath.ts` 全函数边界防御（estimateEquity 负 outs 返负值、shortDeck 溢出 -419%、NaN/Infinity 直通等 clamp）
- **calculateImpliedOdds 处置**：P1B-02 后其唯一调用方已绕开，现为无调用方死代码，语义修正或废弃由专批裁决
- **pokerMath JSDoc 口径澄清**：`calculatePotOdds`/`calculateEV` 的 potSize 是否含对手下注（pot-odds 模块已在 utils/oddsMath.ts 头注自文档化）

### 数据迁移

- 无 persist 形状/版本变更（pot-odds store 不持久化；四个 persist store 均不升版；P1B-04 仅改变后续新增 ReviewItem 的 id 取值，存量时间戳 id 的旧 ReviewItem 不做迁移清理，随 SRS 自然淡出）

### 验证

- `pnpm typecheck` / `pnpm lint` / `pnpm test`（含新增 11 例回归，共 255 例）全部 exit 0

---

## fix(range-trainer) — 2026-07-31（P1-A 排查 14 项：11 项修复 + 4 项挂起：白屏入口 / 超时判分 / 计时链路 / 门禁绕过 / 变体适配）

> 基于 P1-A（范围训练 range-trainer）排查确认的 14 项问题：本批修复 P1A-01/02/03/04(模块内)/05/07/09/10/11/12/14 共 11 项，其余 4 项挂起跨模块专批（见下）。排查结论、挂起清单与"后续层免重复排查事项"已落盘 `docs/BUG_HUNT_BACKLOG.md`《P1-A 排查结论（2026-07-31）》。

### 代码变更

- **fix(range-trainer)**（P1A-01，最重 + P1A-10 协同）：无题库组合开始测验白屏卡死修复——题目生成抽出纯函数 `utils/questionGenerator.ts` 并 **presets 参数化**（消除硬编码 6-max，透传 store 变体化 presets，HU/短牌/4-max 同样成立）；`startQuiz` 改返回 boolean，生成 0 题时不置 running 停留配置页；新拆 `components/QuizConfig.tsx` 配置卡，位置/动作类型选项按当前变体 presets 实际存在的组合过滤（治本）+ 变体切换后失效选择自动回退 + "该组合暂无题库"防御提示（过滤后理论不可达）
- **fix(range-trainer)**（P1A-02）：超时不再伪装成选择 fold——新增 `QuizAnswer = RangeAction | 'timeout'` 类型，TrainingSession 超时路径改调 `answerQuestion('timeout')`，store 判对条件改为 `action !== 'timeout' && action === correctAction`：正确答案为 fold 的题超时也恒判错，正确率/handWeights 加权/错题列表/ELO/SRS/情绪记录全链路"答错"口径一致
- **fix(range-trainer)**（P1A-03）：暂停→恢复后倒计时冻结修复——handleResume 与 Esc 恢复路径均补调 `startTimer()` 重启倒计时
- **fix(range-trainer)**（P1A-04 模块内部分）：X 按钮不再 `endQuiz()` 全量入账——改为打开暂停遮罩作确认层（复用现有"继续训练/退出训练"双按钮，零新增文案），退出走 onExit→`resetQuiz`：不入账、不 emit、不计 streak；progress 拒收 totalQuestions:0 的纵深兜底挂起跨模块专批
- **fix(range-trainer)**（P1A-05）：测验配置页位置选项接入位置渐进解锁门禁——复用 `isPositionUnlocked(pos, preflopElo)` + `useDebugModeStore.unlockAll` 旁路（对齐 RangeSelector 行为），锁定位置 SelectItem 禁用 + Lock 图标 + "需 preflop ELO ≥ 阈值 解锁"提示，开始按钮同步禁用
- **fix(range-trainer)**（P1A-07）：RangeInfo 占比改按组合数加权——新增纯函数 `utils/rangeCombos.ts`（对子 6 / 同花 4 / offsuit 12，总数标准 1326、短牌 630，复用 shared `TOTAL_COMBOS`/`SHORT_DECK_TOTAL_COMBOS` 常量），RangeInfo 新增 `variant` prop 并由学习页透传，取代旧算法手牌数/169
- **fix(range-trainer)**（P1A-09）：`resetQuiz` 保留 `handWeights`（`{ ...INITIAL_QUIZ_STATE, handWeights: state.quizState.handWeights }`），"再练一次"路径保住间隔重复加权
- **fix(range-trainer)**（P1A-11）：学习页 `RangeLearnPage` 改用 store 变体化 `presets` 自动匹配（含 ADVANCED，不再直接 `PRESET_RANGES.find` 只认 6-max 基础范围），并把 `variant` 透传给 RangeGrid 与 RangeInfo
- **fix(range-trainer)**（P1A-12）：`useTimer` 重写为 Date.now() 墙钟段式基准（accumulatedRef 已完成段累计 + segmentStartRef 当前段起点，消除后台 100ms tick 节流累积误差，与 store 的 Date.now() 记时口径对齐）；time-up 的 `setTimeout(...,0)` 句柄存入 ref 并在 cleanup/卸载时清理，消除泄漏
- **fix(range-trainer)**（P1A-14）：暂停前已耗时不再丢弃——`QuizSessionState` 新增 `pausedElapsed` 字段：`pauseQuiz` 把已耗时累计入 `pausedElapsed`，`resumeQuiz` 仅重置段起点，`answerQuestion`/超时路径耗时 = `pausedElapsed + (Date.now() - questionStartTime)`，切题归零（与 P1A-12 时间戳基准协同，无 tick 二次误差）
- **refactor(range-trainer)**：为满足单文件 ≤200 行，`store.ts`（383→97 行）拆出 quiz 状态切片 `storeQuizSlice.ts`（Zustand StateCreator 组合，QuizSlice 接口定义入 types.ts）与题目生成纯函数 `utils/questionGenerator.ts`；`RangeQuizPage.tsx` 拆出 `QuizConfig.tsx`；对外行为除上述修复外不变

### 回归测试（新增 14 例）

- `storeQuizSlice.test.ts`（7 例）：P1A-01（无题库组合返回 false 停留 idle / 有效组合进 running 且末题 AA@BTN raise）、P1A-02（'timeout' 对 fold 题恒判错且权重升 2；主动 fold 判对权重 1）、P1A-09（resetQuiz 保留 handWeights）、P1A-14（vi.spyOn(Date,'now') 确定性验证：暂停累计 5000ms、恢复后续算总耗时 6000ms、暂停期 4s 不计入、切题归零）
- `utils/rangeCombos.test.ts`（7 例）：P1A-07（单类组合数 6/4/12 / 混合求和 / 空范围 / 总数 1326与630 / 标准与短牌占比 / 全 169 手牌=1326 组合=100%）

### 挂起决策（4 项，跨模块专批，已登记 BUG_HUNT_BACKLOG 挂起清单供 platform-dev 认领）

- **P1A-04 兜底**：progress store 拒收 `totalQuestions === 0` 训练结果的纵深防御（涉及 progress store）
- **P1A-06**：range-trainer 预置范围 ↔ gto-simulator preflop-ranges.json 一致性（JSON 3-bet 场景语义待 P1-C 定性后裁决权威源）
- **P1A-08**：preset 百分比标注修正（依赖 P1A-06 定性结论）
- **P1A-13**：删除 `/range-trainer/result/:sessionId` 死路由（src/app/routes.tsx 越界）

### 数据迁移

- 无 persist 形状/版本变更（range-trainer store 不持久化；`pausedElapsed` 为内存态会话字段，四个 persist store 均不升版）

### 验证

- `pnpm typecheck` / `pnpm lint` / `pnpm test`（含新增 14 例回归，共 244 例）全部 exit 0

---

## fix(strategy-academy / shared / progress) — 2026-07-31（P0-B 排查 7 项：4 项修复 + 3 项分流：选项排序出口 / 事件时序 / SRS 时区遗漏 / 导师反馈防御）

> 基于 P0-B（事件总线与判分核心）排查确认的 7 项问题：本批修复 P0B-01/02/03/06，其余 3 项分流（见下）。排查结论与"后续层免重复排查事项"已落盘 `docs/BUG_HUNT_BACKLOG.md`《P0-B 排查结论（2026-07-31）》。

### 代码变更

- **fix(strategy-academy)**（P0B-01，最重）：PracticeDrill（含 QuickDrill 消费路径）新增选项排序出口 `utils/practiceOptionOrder.ts`（纯函数）——修复 259 题 practice 题库按原序渲染、正确答案 55.2% 集中 index 1 的治理红线违规：动作类选项集按"消极→激进"canonical 固定排序（Fold→Check→Call→Limp→Bet/C-Bet/Donk→Raise/3-Bet/4-Bet/5-Bet→All-in/全下，同类按尺度升序，口径对齐 puzzle-trainer optionOrder）/ 数值类单调升序 / 文字陈述类 `hash(题目id + '@practice-v1')` 加盐种子洗牌（盐值与 quizShuffle 裸 hash(id) / DRILL_OPTION_SALT '@v2' 隔离种子空间）；PracticeDrill `questions` memo 三分支（压力循环 / 非自适应 / 自适应选题）渲染前统一重排；正确答案标识 isCorrect 随选项对象整体移动无需索引重映射；选项为静态中文文本无 t() 时序问题；源题库静态数据零改动。新增分布守卫 `practiceOptionOrder.test.ts`（Node 环境 5 例：全量题库重排后正确答案任一位置占比 ≤60% / 同题两次排序结果一致含引用级 / 源对象不被修改 / 正确选项保留唯一 / 每题恰有一个正确选项）
- **fix(strategy-academy)**（P0B-02）：store `recordPracticeScore` 与 `completeBasics` 的 `trainingEvents.emit` 移出 `set()` updater，改为状态提交后再发事件，完全对齐 theory-academy store 防御模式并添加同款防御注释（避免 StrictMode 等 updater 重放导致重复发事件）；事件负载仅依赖入参与 Date.now()，与修复前完全一致
- **fix(strategy-academy / progress)**（P0B-03）：CourseView 两处（Drill 完成 / Quiz 完成高分分支）`nextReviewDate` 计算由 `date.toISOString().split('T')[0]` 改用 progress `toLocalDateString()`（自 spacedRepetition.ts 导出并经 feature barrel re-export，沿用既有 strategy-academy→progress 允许边，未新增跨模块依赖），消除 UTC+8 凌晨 00:00-08:00 SRS 首次复习日期晚一天（P0-A BUG-09 同源遗漏点）
- **fix(shared)**（P0B-06）：`renderMentorFeedback` 对非法/未知 mentorStyle 防御性回退 `'encouraging'` 风格模板（函数签名与返回类型不变，UI 调用方零改动）；新增纯函数测试 `mentorStyles.test.ts`（Node 环境 3 例：非法风格不 throw 且等于 encouraging 渲染结果 / undefined 脏数据形态同样回退 / 三风格×五评级模板齐全且占位符替换）

### 分流决策（3 项，本批不修）

- **P0B-04 → 分流 P1-B**：PotOddsQuizPage 直接内插裸英文 grade 枚举（「评级：wrong」），未走 GRADE_DISPLAY_CONFIG + `.grade-*` 统一评级展示，在 P1-B 修复批处理
- **P0B-05 → 分流 P1-F（已定性设计豁免并登记）**：theory-academy 章末小测为概念判断题、无 EV 语义，暂不接入五级判分体系（与 hand-history 不 emit 的豁免模式并列）；已登记 TDD 5.9 反馈闭环系统 + TheoryQuiz.tsx 头注
- **P0B-07 → 移交 P2-D**：导师模板 15 套及“去复习”等反馈文案硬编码中文（mentorStyles.ts / PuzzleCard / PotOddsQuizPage），en 界面不翻译，并入 P2-D i18n 走查

### 数据迁移

- 无 persist 形状/版本变更（四个 persist store 均不升版；修复均为渲染前重排/事件时序/日期格式化/只读回退，不触碰存储形状）

### 验证

- `pnpm typecheck` / `pnpm lint` / `pnpm test`（含新增 practiceOptionOrder 分布守卫 5 例 + mentorStyles 防御回退 3 例）全部 exit 0

---

## fix(progress) — 2026-07-31（P0-A 排查 18 项 bug 全量修复：Streak 记账链路 / 里程碑庆典 / 时区统一 / 成就判定 / Hooks 崩溃）

> 基于 P0-A 逐功能排查（progress store 跨模块状态中枢）确认的 18 项 bug 的整批修复。修复原则：Streak 事实源唯一化、奖励发放与弹窗展示解耦、日期口径统一本地时区、成就判定收敛到数据所属模块。

### 代码变更

- **fix(range-trainer / pot-odds / gto-simulator)**：三大核心训练模块完成训练时补调 `recordTrainingDay()`（与 puzzle / theory 同模式：完成时同步调用，不走事件总线），修复训练不计入 Streak / 不触发里程碑 / 不掉碎片（BUG-01）
- **fix(progress)**：重写 `updateStreak` 分支语义（BUG-02/03）——首次训练直接启动 Day 1（原先误入"断裂"态导致 streak 停留 0）；漏训 1 天（gap=2）无冻结卡时按 Earn Back 恢复原天数 +1（断裂时刻按"漏训首日结束"起算）；断签 ≥2 天重置为 1 且回归首训即时计入（消除"被吞掉的训练"与"任意长度断签同日两训可恢复"漏洞）；保留旧版 `streakBrokenAt` 历史状态兼容分支；新增 `updateStreak` 单元测试 9 例
- **fix(progress)**：里程碑庆典可达性修复（BUG-04）——`checkMilestone` 达成时**即时发放**冻结卡奖励（不再依赖弹窗关闭，刷新/导航不丢奖励）并设置 `pendingMilestone`；新增全局 `MilestoneCelebrationHost` 挂载于 AppLayout 与 BlankLayout，监听 `pendingMilestone` 统一弹出 `StreakCelebration`（组件自身移除发奖逻辑，仅展示）；StreakTracker 移除本地庆典弹窗（挂载补检保留）
- **fix(platform)**：`TiltWarning` 与 `MilestoneCelebrationHost` 补挂 BlankLayout，覆盖范围测验 / 赔率测验 / GTO 会话等训练页（BUG-05：原 Tilt 弹窗仅 AppLayout 渲染，主训练页连错 3 题无提醒）
- **fix(puzzle-trainer)**：Rush / Daily / Theme 三模式接入 `SessionLimitGuard` 每日题量止损（未完局拦截、已完局结果页放行），补齐 PRD 5.19"所有训练页面开头检查"（BUG-06）
- **fix(progress)**：`updateElo` 仅在发生升段时覆盖 `eloRankUp` 事件，未升段保留现值，修复会话中后续答题把未展示的升段庆祝清零（BUG-07）
- **feat(progress)**：设置页"训练设置"新增冻结卡行——显示剩余数量 + "使用冻结卡"按钮（调 `useStreakFreeze()`，成功/失败即时反馈，数量不足或今日已用时禁用），落地 PRD 5.8 手动使用冻结卡（BUG-08）；i18n 新增 `streak.freeze.settingLabel/settingHint/useNow/useSuccess/useFail`（zh/en）
- **fix(progress)**：`spacedRepetition.getTodayString` / `getDateAfterDays` 由 UTC（`toISOString`）改为本地时区格式化，与 `streakCalc` 统一口径，修复 UTC+8 凌晨 00:00-08:00 的跨日判定错位（Dashboard 今日完成态 / SessionLimitGuard 止损 / MoodTracker 选中态）（BUG-09）
- **fix(progress)**：`recordAnswer` 跨日重置补充 `consecutiveWrongCount`（昨日连错不延续到今天）；`resetDailyCounters` 同步补重置（BUG-10）
- **fix(progress / strategy-academy)**：成就判定修正（BUG-11/12/13）——strategy-academy store 新增 `isLevelLessonsCompleted(level)` / `areAllLevelsCertified()` / `isTrackCompleted(trackId)` 三个查询（课程/认证/轨道数据判定收敛在其所属模块）；progress `checkCondition` 相应改造："完成 Level N"需该级全部课程（含 L4A/4B）、"全部等级认证"需全部 level 认证（原 `some` 任一认证即解锁）、"完成轨道"按 trackId 精确判定（原"完成 10 课即算"）
- **fix(progress)**：Streak 展示统一事实源（BUG-14）——`useProgress().summary` 在汇总层用 `store.streak` 覆盖 records 派生的 currentStreak/longestStreak（派生值不感知冻结卡续接与 Earn Back），StatsOverview / StreakTracker / 分享卡等消费方一次收敛
- **fix(progress)**：`StreakRail` 今日正确率补 `dailyQuestionsDate === today` 校验，修复昨日数据被当作今日展示（BUG-15）；`StreakTracker` 碎片合成动画改用 `useRef` usePrevious 模式（原 `useMemo` 误用导致 4→0 变化检测永假、动画永不显示）（BUG-16）
- **fix(i18n)**：`tilt.continue` 文案修正"继续训练"→"学习情绪管理"（与实际跳转 `mental-tilt-recognition` 课程的行为一致），补齐 `tilt.dismiss`（zh/en）（BUG-17）
- **fix(range-trainer / pot-odds / gto-simulator / strategy-academy)**：四个训练页的 `SessionLimitGuard` 早退移至全部 hooks 之后（BUG-18：早退在 hooks 之前，守卫状态在挂载期间翻转——答题中达上限 / 调试开关切换——触发 `Rendered fewer hooks` 整页白屏崩溃；正确写法参照 TheoryChapterView）

### 数据迁移

- progress store persist version 升级 **v8 → v9**：migrate 注入 `pendingMilestone: null`（待展示里程碑庆典，全局 host 消费）；`store.persist-shape.test.ts` 快照与 `store.migrate.test.ts` 断言同步更新
- 其余 store（strategy-academy / puzzle-trainer / theory-academy / debugMode）无形状变更，不升版（academy 仅新增只读查询方法）

### 验证

- `pnpm typecheck` / `pnpm lint` / `pnpm test`（31 文件 212 用例，含新增 updateStreak 9 例）/ `pnpm build` 全部 exit 0
- 真实浏览器端到端抽验：首训 Day 1 启动、断签 30 天重置且同日两训不恢复、gap=2 无卡 Earn Back +1、v8→v9 迁移、里程碑达成即发 2 张冻结卡 + 全屏庆典弹出/关闭清除、训练页 Tilt 弹窗三按钮、止损翻转不崩溃且守卫响应式恢复、PuzzleRush 止损拦截、设置页冻结卡使用成功落盘、升段事件在后续答题后保留

### 已知遗留（产品语义层，非本次修复范围）

- PRD 5.8 中"冻结卡自动扣减"与"Earn Back 恢复"在 gap=2 场景结果重叠（有卡扣卡 / 无卡也可恢复 +1），冻结卡在该场景的价值弱化，建议产品层澄清两机制边界
- StreakTracker 的"⚡ Earn Back 窗口期"提示依赖旧版 `streakBrokenAt` 字段，新逻辑下断裂即时结算、该提示基本退役（纯前端无后台任务，无法在未打开应用时标记断裂）

### 遗留决策点后续修复（同日追加）

> 上述两项遗留已于同日闭环，两机制边界澄清为：**冻结卡 = 第一道防线**（自动扣减无感兑底 + 手动"请假"主动保护）；**Earn Back = 无卡时的最后兑底**（仅漏训 1 天可救，窗口为漏训次日全天）。

- **feat(progress)**：手动使用冻结卡赋予真实保护语义（原 `useStreakFreeze` 只扣卡+标记，无任何保护效果，纯亏一张卡）——新语义"为今天请假"：今日未训且连续性可救（昨日已训或恰漏 1 天）时，扣 1 卡将 `lastTrainingDate` 置为今天（currentStreak 不 +1，避免用卡与训练等价），明日训练按"昨日已训"续接；判定收敛在纯函数 `applyManualFreeze`（streakCalc.ts，+6 测试）；设置页禁用条件补"今日已训练"，提示文案同步新语义（zh/en）
- **feat(progress)**："⚡ Earn Back 窗口期"提示复活——新增纯函数 `computeStreakBrokenAt`（+4 测试）与 store action `detectStreakBreak()`：首页/进度页挂载时检测"昨日漏训（gap=2）且无卡可自动保护"，标记 `streakBrokenAt` 为**今日 0 点**（=漏训日结束时刻）；窗口语义与 updateStreak 结算严格一致：今天全天训练可恢复 +1，明天必过期重置（不重新引入"任意断签可恢复"漏洞）；接线 StreakRail 与 StreakTracker 挂载检测（幂等）；有卡时不标记（自动扣减兑底，无需焦虑提示）
- 验证：typecheck / lint / test（31 文件 222 用例，新增 10 例）全绿；浏览器端：gap=2 无卡刷新后 brokenAt=今日 0 点落盘、进度页显示"⚡ Earn Back 窗口期"；设置页用卡后 lastTrainingDate=今天、streak 不变、扣 1 卡、按钮禁用
- 数据迁移：无 persist 形状变更（复用既有 `streakBrokenAt` / `streakFreezeUsedToday` 字段），不升版

---

## chore(platform) — 2026-07-31（优化建议落地：语言切换接通 + theory 迁移测试 + 组件测试 i18n + PRD/TDD 职责分离全量清理）

> 落地上轮文档审计提出的 5 项优化建议：代码修复（语言切换 / 测试补全 / i18n 初始化）+ 文档职责分离（PRD → v2.3、TDD → v2.4）。

### 代码变更

- **feat(progress)**：设置页语言选择器接通——移除 `disabled`，切换时同步 `updateSettings({ language })` + `i18n.changeLanguage()`；硬编码中文改为 `settings.languageLabel` / `settings.languageHint` （zh/en 双语新增）
- **fix(platform)**：`AppLayout` 顶栏语言切换同步写入 `settings.language`（消除顶栏与设置页双事实源）；`providers.tsx` 启动时从持久化语言偏好恢复 `i18n` 语言（跨刷新生效，兑现 PRD「可切换双语」承诺）
- **test(theory-academy)**：新增 `store.migrate.test.ts`（v0→v1 防御性合并默认值，已有字段不被触碰），补齐四个 persist store 的迁移测试
- **test(platform)**：`setupTests.components.ts` 初始化 i18n 实例（`import '@/i18n/config'`），消除组件测试 `NO_I18NEXT_INSTANCE` 警告
- 测试文件 30 → 31，全部 exit 0

### 文档变更

- **PRD v2.3**：职责分离全量清理——逐节移除文件路径 / store action 名 / 组件名 / 类型定义 / i18n key 清单（涉 5.7-5.24，含 5.8 核心 Actions 表、5.9 模块实现表、5.11/5.13 组件表、5.13 ELO 公式 / Actions、5.14 API 与组件表等）；行为规格与数值规则（阈值/题量/概率/路由/课程标识）保留并产品化改写，验收标准同步去 API 化
- **TDD v2.4**：承接 PRD 迁出的实现细节——§5.9 补 Streak 核心 actions 表 / ELO store actions / SRS 记录器名 / “末题简单+补救”三模块实现表，§5.8 补 4 个 Drill 题库文件名与 i18n-key 驱动说明；结构修正：补 §1 文档信息章节（原从 §2 开始）、修项目结构中 stale 引用“理论学院 设计见 5.10”→“5.8b”；测试清单 30→31
- **数据迁移**：无 persist 形状变更（`settings.language` 字段已存在），不需升版

---

## docs(sync) — 2026-07-31（PRD/TDD 文档一致性审计：与代码实现全量对齐）

> 对 PRD.md（→v2.2）与 TDD.md（→v2.3）做了一次代码级一致性审计（逐项核对 store/路由/共享层/题库/测试实现），修正文档中的过时与错误描述；代码零变更。

- **PRD v2.2**：功能模块数 25→27（补 5.26/5.27 目录行）、feature 目录数 8→9；策略学院 L5-L8 主题修正为职业素养/锦标赛策略/现金桌专项/高级剥削策略（与 `data/levels/index.ts` 对齐）；成就系统 22→26 个（含 4 项理论成就，类别分布 10/5/6/5，“每成就 4 等级”更正为四档归属）；冻结卡碎片每日上限 3→2 片；难度指示器阈值 55%/80% 更正为 <50% 降级 / >85% 且 >20 次升级；牌局解析补 PartyPoker；语言切换入口更正为顶部导航（设置页为只读）；`--brass-bright` 色值 #e0bd75→#e8c97e；学习目标位置补 BB；移除成就数据文件路径等技术细节（职责分离）
- **TDD v2.3**：架构图 Feature Modules 8→9（补 Theory Academy）；`shouldDownshiftDifficulty()` 更正为无参调用，数据源更正为 `emotion.consecutiveWrongCount` 全局计数（删除不存在的 `consecutiveWrongByModule` 描述，共 3 处）；persist 清单更正为 5 个 store（补 theory-academy/debugMode 行与 localStorage key 表，删除未接入的 `i18nextLng`）；迁移记录表补 progress v1→v6 链路与 puzzle v1→v2；TrainingRecord.module 联合补 `'hand-history'`；HandHistory.site 联合与解析器目录补 `partypoker`；导师风格更正为 strict-math/old-school/encouraging（模板事实源 `mentorStyles.ts` 而非 i18n）；路由表补 `/theory` 两条；manualChunks 代码块更正为实际函数式实现；谜题题库文件名/Theme 题量 15-30/store 字段补齐；成就 26 个与碎片每日 2 片同步；测试章节重写为双项目划分 + 30 文件实录（删除不存在的 RangeGrid 等组件测试描述，E2E 标注未落地）；pnpm 版本改为引用 `packageManager` 事实源
- **AGENTS.md**：调试解锁旁路门禁 5→7 处（补 theory-academy store 门禁与 TheoryChapterView URL 门禁）
- **数据迁移**：无 persist 字段变更，不需升版（纯文档变更）

---

## fix(design-system) — 2026-07-30（设计系统合规修复：霓虹色板清零 + 五级反馈牌室化 + 守卫测试，DESIGN_LANGUAGE v1.3.2）

> Design QA 全面审查发现实现层 156 处 Tailwind 霓虹调色板类（21 文件）违反 DESIGN_LANGUAGE §1.3 反 SaaS 饱和色禁令，五级反馈事实源使用 `bg-emerald-600`/`text-white` 等违规类且被 3 个训练模块消费。本次全量修复并建立防回流门禁。

- **fix(shared)**：`GRADE_DISPLAY_CONFIG` 牌室化——`color` 改为引用 globals.css `.grade-best`~`.grade-blunder`（样式单一事实源），`textColor` 改 token 文字色；QuizCard / GTOFeedback / PuzzleCard 三消费方零改动生效
- **feat(shared)**：新增色彩 token `--poker-gold #d4a84b`（落地 globals.css）、`--poker-bronze #cd7f32`、`--poker-indigo-bright #8ea4c4`、`--poker-terra-bright #c98a63`（暗底文字亮阶）；`colors_and_type.css` 镜像同步
- **fix(strategy-academy / theory-academy / progress)**：霓虹色板全量替换为 `--poker-*` token 类（quiz 正误反馈、SRS 分类标签、每日计划、概念图谱、成就墙四档徽章等）；映射：green/emerald→success、red→danger、yellow/amber→brass、orange→terra、blue→info、purple→indigo
- **fix(range-trainer)**：测验行动按钮色阶对齐 §5.5（fold=陶土 12% 透底 / call=深胡桃半透 / raise=黄铜渐变，替换原 clay/sage 实底）；范围网格文案"绿色"→"金色"（对齐黄铜三档实现）；`--clay-bright` 失效引用修复
  - **后续修订（三按钮区分度）**：用户反馈 fold（陶土透底）与 call（半透明沉底）在墨绿背景上都成暗棕调、糊在一起。改为三色相并立且都浮于呢面：fold 保持陶土红透底但加**红字+红边 0.55**、call 由半透明改为**胡桃木不透明实色 `--walnut-raised`**+象牙字、raise 黄铜渐变不变（计算样式实测三按钮 bg/color/border 各异）
- **fix(shared)**：牌背胡桃化——`CardBack.tsx` 与 `public/cards/back.svg` 由酒红/遗留蓝改为 §5.1 胡桃底+45°黄铜条纹+2px 黄铜边+内描金，SVG 描边直引 `var(--brass)` 消除 `#c8a456` 漂移；CardSVG 近黑描边改胡桃调；hand-history `--clay-bright` 失效引用修复
- **test(shared)**：新增 `src/designTokenGuard.test.ts` 守卫（vitest 门禁）：断言 src 零霓虹调色板类、零纯黑白类（`bg-black/NN` 压暗层豁免）、零纯黑白 hex；豁免白名单只删不加
- **docs(design)**：DESIGN_LANGUAGE.md 升版 v1.3.2——新增 §5.21 交互状态矩阵、§2.2 hover/active 变体与暗底文字亮阶规则、§2.4 token 登记、§12.1 React 落地形态（样式双轨制）、附录 F 变更摘要
- **docs(sync)**：三层文档与子代理同步——TDD §14.7「UI 颜色实现规范与守卫」+ §14 色值表补 4 token + 按钮色阶约定；AGENTS.md 质量门禁补守卫测试项 + UI/UX 章节反霓虹硬约束；ui-ux-dev（Color System 改为引用权威源、消除过时色值副本）/ puzzle-trainer-dev / range-trainer-dev 三子代理补规范
- **数据迁移**：无 persist 字段变更，不需升版

验证：typecheck / lint / test（30 文件 202 用例，含新守卫 4 断言）全部 exit 0。

---

## feat(theory-academy) — 2026-07-30（章节复习导航：已完成章节自由回访）

> 补齐“已完成章节可自由回访复习”的导航入口：此前 Level 卡片整卡只跳首个未完成章、章节阅读页唯一出口是进入小测，复习被迫重考（数据层本已安全：completeChapter 幂等 + quizScores 取历史最高分，本次零 store/persist 变更）。

- `TheoryLevelCard`：外层 `<button>` 重构为 `div role="button"`（tabIndex/aria-disabled/Enter+Space 键盘激活，仅响应卡片自身键盘事件避免内部按钮冒泡误触发），解决嵌套交互的 HTML 合法性；右侧新增展开/收起章节列表切换（ChevronDown/Up，`aria-expanded` + `aria-label`，stopPropagation），整卡点击 = 继续学习保持不变
- 新增 `TheoryChapterList` 子组件：章节行显示序号/标题/时长，已完成章节显示绿色 CheckCircle2 + 历史最高分（font-numeric），点击直达章节页（Level 已解锁即全部章节可点，与既有 URL 门禁口径一致，不新增章节级门禁）
- `TheoryHome`：向卡片透传 `progress.quizScores`（沿用 completedChapters 的 props 传递风格）
- `TheoryChapterView`：已完成章节的 reading 阶段新增免重考导航——返回目录 + 下一章（`getNextChapter` 跨 Level 顺延）直接跳转；小测入口降级为次要按钮并改文案“重新挑战小测”；头部“已完成”徽标旁追加历史最高分。未完成章节 reading 阶段与 quiz/done 阶段逻辑不变
- 文案沿用组件内硬编码中文口径，不新增 i18n key；视觉全部使用设计变量（felt/walnut/brass/ivory）

验证：typecheck / lint / test 全部 exit 0。

---

## feat(platform) — 2026-07-30（导航系统全量优化：IA 重构 + 今日任务合并 + 交互合规 + 视觉打磨）

> 基于 ui-ux-dev 导航系统设计审查（P0/P1/P2）的全量落地：信息架构层消除冗余入口与标签混淆，对齐 DESIGN_LANGUAGE §5.7 分组规范。

### feat(platform): P0 信息架构与标签统一

- 侧边栏 13→11 项，分组重构为“概览（仪表盘）/ 训练（范围·赔率·GTO·谜题）/ 研习（策略学院·理论学院·牌局复盘）/ 数据 / 设置”；移除 `/academy/basics` 与 `/daily-challenge` 两个一级导航项（basics 路由保留，入口收敛到学院首页卡片与首访引导）
- 新增 `nav.dashboard` 键，三端统一：`/` = 仪表盘、`/progress` = 进度统计，消除“两个进度统计”双重标签与落地页标题断裂
- MobileNav 第 2 项修复 label/图标/目的地三重矛盾：`nav.training`+Target → `nav.academy`+GraduationCap

### feat(progress): 每日体系统一（今日任务）

- 每日挑战卡改造为“今日任务”卡（仪表盘内嵌）：新增每日谜题入口行（读 puzzle store `dailyCompleted` 完成态，跳转 `/puzzle/daily`）；删除私有 `getConsecutiveChallengeDays` 计算，streak 展示统一读 `progressStore.streak.currentStreak`（消灭三套并行火焰计数）
- 删除 `/daily-challenge` 路由与 `nav.dailyChallenge` 键（zh/en 同删）；`dailyChallenge.*` 文案键保留复用，title 改“今日任务 / Today's Tasks”
- **数据迁移**：无 persist 字段变更，不需升版（`dailyCompleted` 仍留 puzzle store，streak 事实源本就在 progress store）

### fix(platform): P1 交互与合规

- 折叠态 NavLink 接入 Radix Tooltip（右侧展示 label）+ 全量 `aria-label`；庄码 D 徽章折叠态降级为图标下方 3px 黄铜圆点（避免与图标重叠），展开态改斜体 Fraunces + `aria-hidden`（DESIGN_LANGUAGE §5.3）
- 用户区硬编码中文 i18n 化：`nav.playerDefault` / `nav.appSubtitle` / `nav.toggleLanguage`（zh/en 同步）
- 金色 token 收敛：全局 29 处 `--gold` 用点统一收敛到 brass 家族（text→brass-bright、border/bg→brass），正确率阶梯 0.5 档改 `--brass` 避免与 0.9 档撞色；`--gold` 变量已从 globals.css 删除
- pageTitle 补全 `/academy/basics` 精确映射 + 带参数子路由前缀兑底（不再断档到 APP_NAME）
- 顶栏移动端语言按钮补 `aria-label` 并扩至 ≥44px 触控区；组标题对比度 `--ivory-muted`→`--ivory-dim`

### style: P2 视觉打磨

- 删除与顶栏 H1 重复的内容区大标题：ProgressPage / AcademyHome / TheoryHome（反模式清单）
- 双学院定位区分：新增 `academy.positioning`（课程与实战练习）/ `theory.positioning`（理论手册与章节阅读），eyebrow 与侧边栏 title 提示同步携带
- 硬编码色值清理：AcademyHome 路径横幅按钮（#1a1308/#e8c97e/#2a1c0a → walnut/brass 变量）、Dashboard 记录分隔线（#2d2214 → `--walnut-border`）
- ProgressPage 排版 token 对齐：`font-mono`→`.font-numeric`、`rounded-xl`→`rounded-[var(--radius)]`

验证：typecheck / lint / test（29 文件 198 用例）/ build 全部 exit 0。

### fix: 代码评审问题修复（R1–R9，三视角评审 b37c8a5..d3b5985）

- **R1 Critical**：折叠态 `TooltipTrigger asChild` 会把 NavLink 函数式 `className` 字符串化（Radix Slot 无条件 join）致激活态失效——AppLayout 改为渲染前自行计算 `active`（根路径精确匹配，其余前缀匹配），传静态 className 与普通 JSX children
- **R2**：`getDailyKey` 从 `puzzle-trainer/data/dailyPuzzles` 迁至 `utils/dateSeed`（data 侧 re-export 兼容），切断今日任务卡→puzzleBank（约 181KB）的静态链，首页 chunk 不再拉入题库
- **R3**：今日任务卡挑战行日期基准由 UTC（toISOString）改为本地时区 `getDailyKey()`，与每日谜题行同口径，消除 00:00–08:00 窗口的同卡双自然日错位
- **R4**：pageTitle 前缀兑底补 `/pot-odds`
- **R5**：双学院导航项折叠态不再设原生 `title`，避免与 Radix Tooltip 双提示
- **R6**：DecisionTree AllIn 改 `--brass` 与 Raise（`--brass-bright`）恢复区分
- **R7**：旧金色字面量收敛：StreakTracker 热力格与 StreakCelebration 动画 `rgba(212,168,75,α)`→`rgba(201,162,94,α)`，shareCard `BRASS #d4a84b`→`#c9a25e`
- **R8**：本条目导航项计数修正为 13→11
- **R9**：DESIGN_LANGUAGE §5.3 登记庄码折叠态降级例外（3px 黄铜圆点）

---

## fix(platform) — 2026-07-30（理论学院移动端入口）

> 代码审查（提交 44c3952）发现的严重问题修复：侧边栏在移动端隐藏且 MobileNav 无 /theory 项，导致移动端用户完全无法到达理论学院。

- `MobileNav.tsx` 底部导航 5→6 项：在“训练”后新增“理论学院”（Library 图标，`nav.theory`）；6×44px 最小触控宽度在 320px 最窄屏亦可容纳
- 修正下方 feat(theory-academy) 条目中“MobileNav 保持 5 项不变”的假设：该假设使需求 1（导航入口）与需求 7（响应式体验一致）仅在桌面端交付，现已补齐

### fix: 代码审查警告级问题（W2-W8）

- **W2 Session 止损契约**：`TheoryChapterView` 进入小测阶段接入 `useSessionLimitReached` + `SessionLimitGuard`（与 pot-odds/gto/range/quick-drill 口径一致）——理论小测 `recordAnswer` 消耗每日题量预算，不能“只写不守”；阅读仍不受限
- **W3 陈旧 UI 闪现**：`TheoryChapterView` 章节切换改为渲染期同步重置 phase/result（trackedChapterId 比较），消除 useEffect 迟滞导致的“新章标题挂上一章得分卡”闪现
- **W4 选项排序**：`t1-variance-q2` 选项统一为纯数字单位（`10000 手`/`50000 手以上`），修正“万”缩写被升序排序器误解导致的量级乱序
- **W5 性能**：progress `checkCondition` 的 `theoryChapters`/`theoryLevel` 加廉价短路（`records.some(r => r.module === 'theory-academy')`），仅理论模块有记录时才动态加载理论内容 chunk
- **W6 成就阈值**：`allAchievements` 改为从 `ACHIEVEMENTS` 数据源派生非 meta 总数（不再硬编码 `>=20`），“成就猎手”回归“真正解锁全部”语义
- **W7 导航并列**：理论学院从“研习”分组移入“训练”分组紧邻策略学院，真正“并列显示”（PRD 5.27 验收 1 / TDD 5.8b 同步）
- **W8 实践入口持久化**：`TheoryLevelCard` 完成态新增常驻“去实践应用”链接（复用 practiceRecommendations，role=button + stopPropagation），不再仅限完成当次会话可见

### fix: 代码审查建议级问题（S9-S13）

- **S9 双向推荐**：`track-beginner` / `track-gto` 的 `relatedTrackIds` 回指 `track-theory-bridge`，与 bridge 自身指向形成双向横向推荐
- **S10 副作用出 updater**：theory-academy `completeChapter` 的 `trainingEvents.emit` 移至 `set` 提交之后（不再在 zustand set updater 内做副作用），避免订阅方同步读取旧状态与 updater 重放重发
- **S11 文档口径**：PRD 5.27 将“入口与界面 chrome 支持 zh/en”收窄为“导航入口与主页 chrome”，明确模块内 chrome 与策略学院一致为内联中文
- **S12 空题库防御**：`TheoryQuiz` 空题库时用 useEffect 自动按完成处理（非渲染期调用父 setState），避免卡死空白小测页
- **S13 反向包含守卫**：`theoryIntegrity.test.ts` 新增实践推荐引用 ID 白名单镜像守卫（fail-loud），新增/删除引用即变红，提醒同步 curriculumIntegrity 的 CROSS_MODULE_LESSON_IDS

---

## feat(theory-academy) — 2026-07-29（新增理论学院模块）

> 新增与策略学院并列的独立理论学习模块（产品规格 PRD 5.27，技术设计 TDD 5.8b），承载权威德扑理论体系，与策略学院形成“理论学习→实践应用→复习巩固”闭环。策略学院代码结构零改动，仅定位调整为“实践应用与技能训练”。

### feat(theory-academy): 模块与内容

- 新增 `src/features/theory-academy/`（types / store / utils / hooks / components / data），架构复刻 strategy-academy 成熟模式
- 全量 9 个理论 Level、共 31 章，每章 3-5 道章末小测（共 124 题），三段分级（基础 T1-T3 / 中级 T4-T6 / 高级 T7-T9）：
  - T1 概率论基础 / T2 期望值与赔率 / T3 位置与起手牌 / T4 范围理论 / T5 博弈论基础 / T6 下注理论 / T7 对手分析 / T8 扑克心理学 / T9 经典理论综合
- 章节内容为原创中文（内联文本，与策略学院课程正文口径一致），基于业界公认理论（概率/EV/GTO/MDF/统计指标/心理学），不逐字复制受版权保护教材
- 章节 ID 前缀 `t<level>-`，与 strategy-academy 的 `l<level>-` 隔离，保证全局唯一

### feat(theory-academy): 路由与导航

- `routes.tsx` 新增 `/theory`（TheoryHome，含 ErrorBoundary）/ `/theory/chapter/:chapterId`（TheoryChapterView），均 lazy + LazyWrapper
- `AppLayout` “研习”分组新增“理论学院”入口（Library 图标），与“策略学院”并列；pageTitle 同步；MobileNav 保持 5 项不变（注：此假设已于 2026-07-30 fix(platform) 修正，移动端入口已补齐）
- i18n：`nav.theory` + `theory.*` 命名空间（zh/en 同步，localeParity 守卫通过）

### feat(theory-academy): progress 中枢集成

- `TrainingRecord.module` 联合类型新增 `'theory-academy'`；Dashboard / ProgressPage / StatsOverview 的 MODULE_LABELS 补“理论学院”标签
- 章末小测每题作答调用 `progress.updateElo`（按章节 eloDimension）+ `recordAnswer`；完成调 `recordTrainingDay`；完成发射 `trainingEvents.emit`（module `'theory-academy'`）
- `achievements.ts` 新增 `theoryChapters` / `theoryLevel` 两个 condition type 与 4 项成就（首章/基础段/中级段/全 9 Level，末项奖励 3 张冻结卡）；progress store `checkCondition` 新增 `getTheoryStore()` 动态 import（避免循环依赖）
- 调试解锁：debugMode 注释门禁清单由 5 处扩至 7 处（新增理论 Level 解锁与章节 URL 直达门禁）

### feat(theory-academy): 理论→实践桥接

- 每 Level 完成后 `PracticeBridgeCard` 展示对应策略学院课程/轨道（路由字符串跳转，不产生模块 import）
- strategy-academy `learningTracks.ts` 新增 `track-theory-bridge`（“理论到实践”轨道）承接 9 个理论支柱；curriculumIntegrity 的 `CROSS_MODULE_LESSON_IDS` 补入理论实践推荐引用的课程 ID

### chore: 模块隔离与守卫测试

- `eslint.config.js` FEATURES 8→9，`ALLOWED_CROSS_IMPORTS` 新增 `'theory-academy': ['progress']` 与 `progress` → `theory-academy`（成就检查动态 import）；`eslintCrossImports.test.ts` 快照同步为 9 键
- 新增 `theoryIntegrity.test.ts` / `quizOrder.test.ts`（分布守卫：A 17.7% / B 29.8% / C 20.2% / D 32.3%，均 <50%）/ `store.persist-shape.test.ts`

### 数据迁移

- theory-academy 为全新 store（`theory-academy-progress`，persist version 1），无存量用户数据，无迁移负担；migrate 仅做 `fromVersion<1` 防御性默认值合并兜底
- progress store **不** bump persist version：本次仅扩宽 `TrainingRecord.module` 联合类型、新增静态成就数据与 checkCondition 分支，持久化键形状不变（persist-shape 测试验证）

### 质量门禁

- `pnpm typecheck` / `pnpm lint` / `pnpm test`（29 文件 197 用例）/ `pnpm build` 全绿

---

## 待办（Backlog）

- **trainingEvents.emit 存量缺口（部分完成）**（登记于 2026-07-28）：pot-odds / puzzle-trainer 已在 v2.0 补全 emit；hand-history 经评估为复盘分析工具（非交互式训练），标注为合理豁免，无需 emit。剩余缺口已清零。
- **strategy-academy Drill 题库位置偏差（i18n-key 型）（已完成）**（登记于 2026-07-28，同日治理完成）：`outsQuestions` / `potOddsQuestions` / `OPPONENT_DRILL_QUESTIONS` 的位置偏差已通过组件内 i18n 解析后重排治理，见下方 fix(strategy-academy) 条目。
- **策略学院逐级审计任务系列 git commit 范围决策（2026-07-29，用户确认）**：本审计任务系列（逐级审计修复 + 调试解锁 + 规范债务）不含 git commit 步骤——提交时机与粒度由用户另行决定；项目通用提交约定仍以 AGENTS.md「提交粒度」章节为准，不受此决策影响。

---

## feat(progress) + chore(strategy-academy) — 2026-07-29（调试解锁开发者选项 + 低优先规范债务）

> 审计收尾：实现设置页“开发者选项”调试解锁，并清理 Spec 批次 5 中风险可控的规范债务。

### feat(progress): 调试解锁（开发者选项）

- 新增 `src/shared/stores/debugMode.ts`（独立 persist store，name=poker-debug-mode，version 1）：`unlockAll` 状态 + `activateWithCode(code)` + `deactivate()`；激活码常量 `DEBUG_UNLOCK_CODE = '1337'`（唯一事实源，改码仅改一行）；提供非响应式 `isDebugUnlockActive()` 供 store 方法短路
- 解锁点短路（激活后全部放行）：strategy-academy store 的 `isLevelUnlocked`/`isLevelEntryUnlocked`、CourseView 本土课与课程级门禁、range-trainer `RangeSelector` 位置解锁、strategy-academy `LearningTracksView` 轨道前置、progress `SessionLimitGuard` 每日题量上限
- SettingsPage 新增“开发者选项”分区：数字输入框 + “激活”按钮（错误码提示“调试码不正确”）；激活后显示“调试解锁已开启”与“关闭调试解锁”按钮
- 范围说明：onboarding 不纳入解锁（未完成引导无法进入设置页，纳入无意义）；状态独立持久化，不影响 progress store persist 形状/版本
- 浏览器实测：新用户 Academy 9 张 Level 卡 8 锁 0 解→设置页输入 1337 激活→Academy 9/9 全解锁；SettingsPage 开发者分区渲染为激活态

### chore(strategy-academy): 低优先规范债务（Spec 批次 5 安全子集）

- **命名统一**：`bonus-short-deck` → `l5-short-deck`（与同级 `l5-*` 命名对齐，引用仅 level5.ts 内部 1 处 id + 4 处 relatedLessonId，同步改完）
- **order 重排**：消除 native 课程 order 重复（l4a、l4b、l5 共 13 处重新编号为递增序），修正 ConceptGraph 排序歧义
- **守卫测试扩展**：`curriculumIntegrity.test.ts` 新增“native 课程 order 无重复”用例（排除本土课——其有意共享 order 保稳定展示顺序）
- **不做项及理由**：drill 命名（`drill-hand-ranking` 专用组件型 vs `drill-l2-*` ChoiceDrill型、`drill-l4b-*` 区分 4A/4B）为有意义语义区分，强行统一会破坏语义并需改 learningTracks 引用，按 Surgical Changes 保留；超 200 行大组件拆分（PracticeDrill 811 / ConceptGraph 552 / QuickDrill 529）回归面过大，Spec 已标注“另开任务”，本轮不做
- 门禁：`pnpm typecheck` / `pnpm lint` / `pnpm test`（26 文件 186 用例）全绿

---

## fix(strategy-academy) — 2026-07-29（课程逐级审计修复：解锁门禁 / 认证系统 / 数据完整性）

> 两轮课程审计（逐级排查 + 系统性深挖）确认 5 大缺陷模式后的集中修复。根因：4A/4B 拆分后消费方仍按 level 数字索引、认证功能半集成、本土课并入 L7 的门禁副作用、课程数据无 schema 守卫。

### P0 功能修复

- **level 数字索引根治（8 处）**：store 新增 `isLevelEntryUnlocked(levelId)`（按 LevelInfo 条目判定，l4b 需 l4a 全完成）；CourseView 门禁与锁定提示改按所属条目（堵住“完成 L3 即可直学 4B”旁路）；ConceptGraph 节点状态/归属/key、AcademyHome 卡片解锁与 key 全部改按 `level.id`（消除 l4a/l4b 同 key=4 的 React key 冲突）
- **认证系统接通**：LevelCard 在级别全部完成后显示“参加认证”入口（此前 `/academy/certification/:level` 无任何 UI 入口，连带轨道前置提示与 certification-any/All 成就死锁）；LevelCertification 题池改为合并同 level 全部条目（Level 4 = 4A+4B，此前 4B 的 33 题永不入池）；`attemptCertification.questionCount` 与实考口径统一为 min(合并题池, 20)
- **非法数据**：`l3-bluff-p5` 手牌与 turn 牌重复（Kd 出现两次）且课程定位错位，改写为 QJ 卡顺半诈唬场景；`l4-ev-p3` effectiveStack 0→89.5

### P1 一致性修复

- **本土课门禁对齐**：CourseView 对 LOCAL_LESSONS 改按 LOCAL_TRACK 前置（l1-l3 全完成）放行，不再继承 l7 的 l3+l5 硬门禁（mental-tilt-recognition 白名单保留）
- **l6 重复课下架**：删除 `l6-final-table`（Final Table 动态，与 `l6-finaltable` 主题重复、同 order），保留含 examples 的 `l6-finaltable`；track-tournament 引用同步改指
- **子 ID 撞车改名（16 组）**：`l4-range-construction` 的 quiz/examples/practice 子 id `l4-range-*` → `l4-rc-*`（与 l4a `l4-range-thinking` 全套撞车）；`l3-check-range` 的 `l3-cr-q1~q3` → `l3-check-range-q1~q3`（与 `l3-checkraise` 撞车，对齐本课 q4/q5 既有前缀）
- **fix(puzzle-trainer)**：`inferPuzzleLessonId` 的 icm 主题映射 `l2-short-stack` → `l6-icm`

### P2 教学内容修正（zh/en 同步）

- `outs-q3` 成顺误标听牌：牌面 7TJ（手持 89 已成顺）→ 7T2（真 OESD，6/J 完成），zh/en prompt+explanation 同步
- `hr-q1/q2/q3` 比大小题两手牌共牌（Qh/As/5h）：换牌消除，牌型结论不变
- `l4-overbet-p5` Q 高“价值下注”教学错误：改为 KQ 顶对薄价值场景；`local-deep-sc-q4` 15-outs 概率标反（54%/80% → 32%/54%），deepStack 课程正文（content）与示例（example）中同源的 15-outs 概率、`54s-9Ts`→`54s-T9s` 写法一并修正；`l4-gto-q4` 脏文本“完美.play”→“完美游戏”

### 防回归（数据守卫）

- 新增 `data/curriculumIntegrity.test.ts`（6 用例）：lesson/子对象 id 全局唯一、correctIndex 界内、唯一正确项、牌面合法（格式/无重复卡/street-board 匹配/数值为正）、轨道-概念节点-prerequisites-relatedLessonId-跨模块引用无悬空、Drill 接线完整，随 `pnpm test` 常驻门禁

### 数据迁移

- 无 persist 字段形状变更，version 不升级：completedLessons 中残留的 `l6-final-table` 旧 id 为无害冗余（数组包含判定，不影响进度/解锁）；子题 id 改名不影响持久化（quizScores 按 lessonId 记录）
- 门禁：`pnpm typecheck` / `pnpm lint` / `pnpm test`（26 文件 185 用例）全绿

---

## fix(strategy-academy) — 2026-07-28（i18n-key 型 Drill 题库位置偏差治理）

> 承接"答案位置偏差系统性治理"的遗留待办：outs / potOdds / opponent 三处 i18n-key 型 Drill 题库的选项文本存于 locale 文件，需在组件 `t()` 解析后重排。

- **新增纯函数**（`utils/quizShuffle.ts`）：`orderResolvedOptions(id, options, correctIndex, getText, seed?)`，解析后重排并同步重映射正确索引；模块内放宽数值判定 `isDigitBearingOptionSet`（`/\d/`，兼容 zh"约 16%"与 en"~16%"），不动 shared 的 `isNumericOptionSet` 语义
- **规则偏离说明（数值题方向哈希）**：outs / potOdds 源数据的数值选项本已升序，若按既定"一律升序"规则重排等于不重排（outs 正确答案仍 75% 集中）。改为**数值单调排列、升/降序方向由 `hash(id + '@v2')` 奇偶决定**——保留单调可扫读性，同时打散位置集中；方向只依赖题目 id，跨语言/跨会话稳定。课后测验的 `orderQuizQuestion`（一律升序）未改动
- **组件接入**：OutsDrill / PotOddsDrill / HandRankingDrill / OpponentDrill（第 2 问）在 `t()` 解析后用 `useMemo` 重排（deps 含 `i18n.language`）；HandRankingDrill 的 `resolveOptionText` 从按位置匹配改为按 key 匹配；判分与 ELO/SRS/训练事件链路自洽（只消费聚合 DrillResult）
- **实测分布**：outs B75% → B50/C50；potOdds B66.7% → A/B/C 各 33.3%；opponent 第 2 问 A75% → A25/B37.5/C12.5/D25；handRanking（一致性接入）最大 40%
- **测试**：新增 `utils/drillOptionOrder.test.ts`（13 用例），含 zh/en 双语全量对照断言、重映射正确性、分布守卫；全量 25 文件 / 178 用例三项门禁全绿
- 数据文件与 locales 零改动；`positionQuestions`（座位点击型）无此问题不处理

---

## 答案位置偏差系统性治理 — 2026-07-28（选项语义排序与跨模块防作弊）

> 承接同日早前的 puzzle-trainer 种子洗牌修复，对全仓做同类排查，发现 strategy-academy（课程测验 B+C 占 95%）与 pot-odds（正确答案 71% 在首位）存在相同的"正确答案位置固定"缺陷。本次统一治理，并按教学目标将 puzzle-trainer 的临时种子洗牌方案升级为语义固定排序。

### 治理原则（按选项类型分流）

- **动作类选项**（Fold/Check/Call/Bet…）→ 语义固定排序：消极→激进、同类按尺度升序，与真实扑克客户端一致，选项位置本身成为"动作光谱"教具
- **纯数值选项**（outs 数 / 胜率百分比）→ 数值升序排列，位置由数值天然决定，便于心算对比
- **文字陈述类选项** → 按 `hash(题目id)` 种子确定性洗牌：每题独立、跨会话稳定（复习顺序不变），打破"总选某位"模式
- **认证考试例外**：LevelCertification 每次进入用会话随机种子洗牌（评估场景，防重考背位置）

### shared 层（洗牌工具上移）

- 新建 `src/shared/utils/seededShuffle.ts`：自 `puzzle-trainer/utils/dateSeed.ts` 迁移 `seededRandom` / `shuffleBySeed` / `hashStringToSeed`（满足 ≥2 模块复用准入）；新增 `isNumericOptionSet(texts)`（全部文本匹配 `/^约?\s*\d/` 才为纯数值集）与 `sortByNumericValue(items, getText)`（按首个数字升序、稳定、不改原数组）
- `dateSeed.ts` 改为 re-export 洗牌函数并保留 `getDateSeed` / `pickBySeed` / `getDailyCompletionCount`，模块内既有 import 路径零变更

### refactor(puzzle-trainer)：种子洗牌 → 语义排序

- 新建 `utils/optionOrder.ts`：`parseOptionSortKey(text)` 解析（类别, 尺度）——Fold(0) < Check(1) < Call(2) < Limp(3) < Bet/C-bet(4) < Raise/3bet/4bet/5bet(5) < 全下类(6)，同类按正则提取的 BB 数值升序；`sortOptionsCanonically(options)` 稳定排序
- `getAllPuzzles()` / `getPuzzlesByTheme()` 移除 `date` 参数，`withShuffledOptions` 替换为 `withCanonicalOptions`；`dailyPuzzles.ts` / `rushQuestions.ts` 回退 date 透传（抽题与题序仍由日期种子驱动，契约不变）；`index.ts` barrel 移除 `PUZZLE_BANK` 原始常量导出
- 实测分布（205 题）：索引 0 占 18.5%、索引 1 占 30.2%、索引 2 占 51.2%（源数据激进选项多为正确答案，语义排序下自然靠后；任一 <60%）
- 测试：删除 `puzzleBank.shuffle.test.ts`，新建 `puzzleBank.optionOrder.test.ts`（6 用例：唯一正确选项 & evLoss / 确定性 / 615 选项全可解析类别 / 类别与尺度升序 / 选项集合不丢失 / 分布守卫）

### fix(strategy-academy)：测验与 Drill 选项分流排序

- 新建 `utils/quizShuffle.ts`：`orderQuizQuestion(q, seed?)`（数值集升序，否则种子洗牌并同步重映射 `correctIndex`）、`orderDrillOptions(q, seed?)`
- 渲染前接入（不改数据文件）：`LessonQuiz`（id 稳定种子）、`LevelCertification`（抽 20 题后逐题用会话随机 `sessionSeed + index` 洗牌，题序洗牌保留）、`ChoiceDrillRenderer`（`DrillQuestion` 唯一渲染点，id 稳定种子）
- 实测分布（levels + localLessons 共 326 题）：A 21.5% / B 27.3% / C 31.9% / D 19.3%（治理前 B+C ≈ 95%，任一 <50%）
- 测试：新建 `quizShuffle.test.ts`（10 用例，含重映射正确性与分布守卫）

### feat(pot-odds)：新增平衡题 + 选项排序

- 题库自组件内嵌抽离至 `data/quizQuestions.ts`，14→19 题：新增 5 道正确答案为"否/应弃牌"的场景题（id 15-19，覆盖 odds-judgment / implied-odds / reverse-implied），补齐"识别 -EV 跟注"训练维度；正确选项含"否/弃牌"的题目 1→6 题
- 新建 `utils/quizOrder.ts`：`orderQuizOptions(q, seedKey?)`（数值集升序，否则 `hash(id)` 洗牌），模块顶层一次性 map 处理；`getEasyOddsQuestion` 补救题用固定种子 `'easy-odds'` 处理
- 实测分布（19 题）：索引 0 占 47.4%、索引 1 占 36.8%、索引 2 占 5.3%、索引 3 占 10.5%（治理前索引 0 占 71.4%）
- 测试：新建 `quizOrder.test.ts`（7 用例，含内容平衡守卫与数值题升序验证）

### 质量门禁

- `pnpm typecheck` / `pnpm lint` / `pnpm test` 全绿；测试总量增至 24 文件 166 用例
- 未处理项：onboarding 定位题（刻意设计 + 一次性）、range-trainer / gto-simulator（固定按钮天然免疫）、PracticeOption（已语义序）

---

## fix(puzzle-trainer) — 2026-07-28（题库正确答案位置偏差修复）

> 缺陷：`puzzleBank.ts` 全题库 205 题中 179 题的正确答案（`isCorrect: true`）位于 options 数组第一位（id 'a'），用户总选第一个选项即可答对，训练价值失效。

- **种子化选项洗牌**：`getAllPuzzles()` / `getPuzzlesByTheme()` 新增可选 `date: Date = new Date()` 参数，内部对每题调用 `withShuffledOptions`——以 `(daySeed ^ hashStringToSeed(q.id)) >>> 0` 为种子用 `shuffleBySeed`（Fisher–Yates）确定性打乱选项顺序；原始 `PUZZLE_BANK` 静态数据零改动
- **`hashStringToSeed` 新增**（`utils/dateSeed.ts`）：FNV-1a 字符串哈希（返回 uint32）纯函数，将题目 id 混入日期种子，使每题洗牌互不相同且确定
- **契约保持**：同一天所有用户看到相同题目、相同选项顺序（每日谜题契约不变）；不同日期选项顺序变化，避免背位置；`dailyPuzzles.ts` / `rushQuestions.ts` 已透传 date 给 `getAllPuzzles(date)` 保证同一 date 输入完全确定
- **实测分布**（固定日期 2026-07-28，205 题）：索引 0 占 35.1%、索引 1 占 36.1%、索引 2 占 28.8%，不再集中于第一位
- **测试**：新增 `puzzleBank.shuffle.test.ts`（5 用例）——唯一正确选项 & evLoss 校验 / 同日两次调用确定性 / 索引分布任一 < 60% / 跨日期顺序变化 / 洗牌不丢失选项
- 消费方 `usePuzzleEngine` / `PuzzleCard` / `DailyPuzzle` 均按 optionId 与 `isCorrect` 工作，与位置无关，无需改动

---

## v2.0 — 2026-07-28（全面功能排查与质量保证修复）

> 对全平台进行系统性功能排查，修复跨模块集成缺口、状态管理缺陷、类型安全问题、UI/UX 硬编码残留，并补全测试覆盖。

### 跨模块集成修复

- **trainingEvents.emit 合规补全**：pot-odds（`PotOddsQuizPage`）和 puzzle-trainer（`PuzzleRush` / `DailyPuzzle` / `ThemeDrill`）补全 `trainingEvents.emit` 调用；hand-history 经评估为复盘分析工具（非交互式训练），标注为合理豁免
- **shouldDownshiftDifficulty 接入**：puzzle-trainer 三种模式（Rush / Daily / ThemeDrill）接入自适应难度降级 API，连续答错 ≥3 次显示降级提示（`puzzle.common.downshiftHint` i18n key）
- **relatedLessonId 反馈闭环确认**：pot-odds 已合规（`useOddsCalculation.ts` 调用 `buildOddsFeedback` 时携带 `relatedLessonId`）

### 状态管理修复

- **IndexedDB 单例重构**（hand-history）：`openDB()` 重构为 `getDB()` 单例模式，避免重复打开数据库连接；添加 try-catch 错误分类 + `dbError` 字段 + i18n 错误消息（`handHistory.dbError.quotaExceeded` / `.unavailable` / `.generic`）
- **strategy-academy persist v1→v2**：`practiceResults` 添加 cap 200 限制（`.slice(-200)`），migrate 函数对老数据执行裁剪；同时补齐 v0→v1 迁移（`firstAttemptScores` / `lastAttemptScores` 默认值注入）
- **progress store addRecord 去重**：添加 `record.id` 去重检查，防止事件总线重复 emit 导致训练记录重复

### 类型安全

- **消除全部 any 类型**：4 处 any 已替换——`gtoDeviation.ts` Worker 分析结果定义 `WorkerAnalyzeResult` 接口替代 any；3 个 Recharts formatter 回调通过类型推断消除 any

### 测试覆盖

- **新增 6 个纯函数测试文件**：`strategyCompare.test.ts` / `statsAggregator.test.ts` / `streakCalc.test.ts` / `parsers/common.test.ts` / `deck.test.ts` / `handClassifier.test.ts`，共 73 个测试用例
- 总测试从 14 文件 51 用例增至 18 文件 124 用例

### UI/UX 修复

- **模块级 ErrorBoundary**：Dashboard / AcademyHome / GTOSimulatorHome 三个核心路由包裹 ErrorBoundary，文案 i18n 化（`common.errorBoundary.*` keys）
- **HandStatsPanel memo 优化**：`chartData` 和 `feedbacks` 使用 `useMemo`，避免不必要的重渲染
- **manifest.json 色彩修正**：`theme_color` 改为 `#15301f`（--felt），`background_color` 改为 `#0e1a14`（--felt-deep），与 CSS 变量保持一致
- **globals.css 去硬编码**：组件类区域 60+ 处硬编码 HEX 色值替换为 CSS 变量引用，消除主题色泄漏

### i18n 新增 keys

- `common.errorBoundary.*`（title / subtitle / reset）
- `handHistory.dbError.*`（quotaExceeded / unavailable / generic）
- `puzzle.common.downshiftHint`

### 基础设施

- **GTO Worker 健康检查**：`useGTOWorker` 新增 `onerror` 监听 + 10 秒超时降级标记 dead + 一次性重建机制（`rebuildWorker`）；重建失败后永久使用 fallback，避免无限重试
- **pot-odds index.ts 导出补全**：从 3 项扩展为完整公共导出
- **TrainingRecord.module 类型扩展**：新增 `'puzzle-trainer'` 与 `'hand-history'`，联合类型现已覆盖全部六个训练模块

### 数据迁移

- strategy-academy store persist version 升级 **v1 → v2**（practiceResults cap 200 裁剪）
- progress store persist version 无变更（addRecord 去重为运行时逻辑，不影响持久化 shape）

---

## v1.9.3 — 2026-07-28（AGENTS.md 硬性规则接入执行面）

> 模块隔离 / i18n 双语 / 禁 any 三条硬性规则此前仅靠自觉，本次接入 lint 与测试执行面。

### Lint 门禁（最小可行集）

- 新增 `eslint.config.js`（flat config），仅启用两条规则：`no-restricted-imports`（features 模块隔离，别名 + 相对路径双形式拦截）与 `@typescript-eslint/no-explicit-any`
- 当前模块间依赖图快照固化为 `ALLOWED_CROSS_IMPORTS` 允许边清单（progress 中枢属设计内，其余 peer 边为存量债务，收紧时只删不加），新增跨模块边一律变红
- 新增 `pnpm lint` script；接入部署工作流（构建前强制）与 pre-commit 钩子
- 依赖：`eslint` + `typescript-eslint`（仅 devDependencies，零 bundle 影响）；typescript-eslint 尚不支持 TS 7.0，通过 `.pnpmfile.cjs` 为 lint 工具链侧载 TS 6.0.3（官方并行方案，不影响 typecheck/build 的 TS 7）

### i18n 双语对称测试

- 新增 `src/i18n/localeParity.test.ts`：比对 zh.json 与 en.json 扁平化键集合，任一侧缺键即失败，随 `pnpm test` 执行

### 附带修复（lint 基线清零）

- `HandRankingDrill.tsx`：`t: (key, opts?: any)` 改为 `TFunction`（真实 any，原 disable 注释错位未生效）
- `gtoWorker.ts` / `StreakTracker.tsx`：移除失效的 eslint-disable 注释（分别为无 any 可压、引用未安装的 react-hooks 插件规则）

### 数据迁移

- 无 persist version 变更

---

## v1.9.2 — 2026-07-28（课程引用修复与对手画像 Drill 落地）

> 修复学习路径与概念图中的悬空课程 ID 引用，并完成 P2-1.8 对手画像 Drill 的组件落地（此前仅有题库无课程/组件，本土路径无法 100% 完成）。

### 悬空引用修复

- **learningTracks.ts**（track-cash-game / track-tournament / track-gto）：`l2-3bet`→`l2-3bet-basics`、`l2-4bet`→`l2-4bet-strategy`、`l3-check-raise`→`l3-checkraise`、`l7-deep-stack`→`l7-deepstack`、`l4-range-reading`→`l4-range-thinking`、`l6-push-fold`→`l6-pushfold`、`l4-opponent-exploit`→`l4-opponent-reading`；不存在的 `l4-mental-game` 映射为 `l5-tilt`
- **conceptNodes.ts**：同系列 ID 同步修正；不存在的 `l5-discipline` 映射为 `mental-tilt-recognition`
- 影响：修复前这些课程永远无法计入路径完成度，「继续学习」与概念卡片会导航到不存在的课程页

### 对手画像 Drill（P2-1.8 落地）

- 新增课程 `opp-drill`（`data/localLessons/oppDrill.ts`，并入 LOCAL_LESSONS，本土路径 16→17 课），修复 localTrack 中的悬空引用
- 新增 `OpponentDrill` 组件（+ `OpponentStatsPanel` / `OpponentDrillResult` 子组件）：消费既有 `OPPONENT_DRILL_QUESTIONS` 8 题，两阶段作答（先判对手类型再选剥削策略），两问全对才计答对
- `DrillComponentName` 联合类型新增 `'OpponentDrill'`，`DrillLessonRouter` 注册懒加载分支；i18n 新增 `drills.opponent.*`（zh/en 同步）

### 数据迁移

- 无 persist version 变更（旧悬空 ID 从未可完成，completedLessons 中不存在历史脏数据，无需迁移）

---

## v1.9.1 — 2026-07-28（质量门禁机械化）

> 补齐验证层：引入最小测试框架 + 首批冒烟测试 + typecheck 机械触发点，结束“零测试、零机械执行”状态。

### 测试基础设施

- **引入 vitest**（经用户确认）：仅 devDependencies，不进生产 bundle（构建产物与引入前逐 chunk 一致）；新增 `pnpm test`（vitest run）与独立 `vitest.config.ts`（Node 环境 + `@` 别名，不加载 react/tailwind 插件）
- **首批冒烟测试（37 项）**：
  - 纯函数：`pokerMath.test.ts`（底池赔率/EV/2-4 法则/短牌）、`elo.test.ts`（ELO 变化/段位/K 因子/升级）、`decisionFeedback.test.ts`（GRADE_THRESHOLDS 与 calculateGrade 边界归入更严重等级）
  - store migrate：progress（v0→v8 全链路）/ puzzle-trainer（v1→v2）/ strategy-academy（v0→v1），通过预置旧版本 localStorage 数据触发 rehydrate 验证迁移、无需 jsdom
  - 新增测试专用共享桩 `shared/utils/localStorageStub.ts`（三个模块的 migrate 测试复用）
  - 坑位记录：zustand v5 persist 默认 storage 引用 `window.localStorage`（非全局 `localStorage`），Node 环境测试必须同时 stub `window`，否则 persist 静默跳过 hydrate/migrate

### 机械触发点

- **pre-commit hook**（经用户确认，`.git/hooks/pre-commit`）：提交前自动运行 `pnpm typecheck`，失败即阻止提交；已验证可拦截 TS2322 类型错误。注：hook 不随 git 克隆分发，新环境需手动复制

### 数据迁移

- 无 persist version 变更（本次仅新增测试覆盖现有 migrate，未改动任何 store）

---

## v1.9 — 2026-07-28（课程体系扩展与游戏化系统升级）

> 基础架构重构（courses.ts 拆分为 levels/ 目录 9 文件 + barrel 导出）、L4 拆分为 L4A/L4B、新增 4 门课程 + 16 个 Drill、成就系统 / 冻结卡碎片 / 进步回放三大游戏化功能上线、GTO Worker 批量分析、构建优化（主 chunk 1204 kB → 291 kB）。

### 基础架构

- **courses.ts 拆分**：拆分为 `data/levels/` 目录（9 个独立文件 + barrel 导出），原 `courses.ts` 保留为 re-export 兼容层
- **L4 拆分**：Level 4 拆分为 L4A（范围与 EV 思维）和 L4B（GTO 与博弈论），共 9 个 Level 节点
- **L7/L8 解锁条件修正**：L7 需完成 L3 + L5（`prerequisiteLevelIds: ['l3', 'l5']`），L8 需完成 L4B（`prerequisiteLevelIds: ['l4b']`）
- **LevelInfo 扩展**：新增 `id` 和 `prerequisiteLevelIds` 字段

### 课程内容

- **新增 4 门课程**：3-Bet 底池翻后策略、单挑策略、软件工具入门、线上 vs 线下差异
- **L2-L8 Drill 扩展**：每级新增 2 个 Drill（共 16 个），新增 `ChoiceDrillRenderer` 通用组件
- **题库补充**：所有课程 quiz/practice 补充至 ≥5 题

### 反馈与复习

- **PracticeDrill "去复习" 链接**：wrong/blunder 级别添加跳转按钮
- **学习路径横向推荐**：`relatedTrackIds` 字段支持跨路径推荐
- **本土化路径前置条件**：需完成 L1-L3（`prerequisiteLevelIds`）+ 内容去重交叉引用

### 游戏化系统

- **成就系统**：22 个成就（学习 / 连续 / 技能 / 里程碑 4 类），`AchievementWall` 展示墙
- **冻结卡碎片系统**：训练 30% / 速训 20% 概率掉落，5 片合成 1 张
- **进步回放**：`ProgressReplay` 对比首次 vs 最近表现

### 技术分析

- **GTO Worker 批量分析**：新增 `batchAnalyze` 批量分析接口
- **GtoDeviationPanel**：集成到手牌回放
- **Puzzle Rush 连对验证**：连对 5 题 +10 秒验证通过

### 构建优化

- **manualChunks 分包**：`vite.config.ts` 添加 `manualChunks` 配置，主 chunk 从 1204 kB 降至 291 kB
- **动态 import 优化**：提取为辅助函数（`getAcademyStore()`），消除 INEFFECTIVE_DYNAMIC_IMPORT 警告

### 数据迁移

- progress store persist version 升级 **v6 → v7**（成就系统）→ **v8**（冻结卡碎片）

---

## v1.8 — 2026-07-27（排组打法逻辑排查与修复）

> 系统性排查范围训练与策略训练中的排组打法逻辑，4 阶段共修复 29 个问题（10 P0 + 13 P1 + 6 P2），建立规范的初学者入门训练体系。
> 排查报告归档于 `.trae/documents/排组打法逻辑排查/`，总览见 [排组打法逻辑排查总览.md](../.trae/documents/排组打法逻辑排查/排组打法逻辑排查总览.md)。

### 阶段一：单个基础排组逻辑校验

- **范围嵌套关系修复**（P0）：HJ Open 范围补齐 18 张缺失手牌（55/44/33/22 + A7s/A5s/A4s/A3s/K9s/Q9s/T8s/65s/54s + ATo/KJo/QJo/JTo/T9o），修复 UTG ⊄ HJ 嵌套违反
- **GTO 频率表与预置范围一致性**（P1）：以 `preflop-ranges.json` 为权威数据源，对齐 HJ Open 范围
- **rangeParser 裸手牌展开**（P1）：`parseRange("KQ")` 现自动展开为 `KQs` + `KQo`

### 阶段二：组合排组联动逻辑校验

- **HJ ⊄ CO 范围嵌套修复**（P0）：`co-open` 补齐 `T9o`
- **`resolveSpotKey` 重构**（P0）：未覆盖场景返回 `null`，避免错误降级为 `open`
- **BB 防御范围对齐 GTO**（P1）：
  - `bb-3bet-vs-btn` 删除 6 张非价值 3bet 手牌（A5s-A2s/K9s/Q8s），仅保留 AA-TT + AKs/AQs/AJs + AKo/AQo
  - `bb-call-vs-btn` 补齐 KQs/KQo/A7o/A5o-A2o，删除重复手牌
- **HU BTN open 扩展**：99 hands (58.6%) → 127 hands (75.1%)，符合 GTO ~75% 标准

### 阶段三：排组与策略打法适配校验

- **EV 计算回归 GTO 标准**（P0）：`calculateEVFromAction` 移除硬编码 `foldEquity = 0.3`，改为标准公式 `eq×(pot+r) - (1-eq)×r`
- **Calling Station 剥削逻辑修正**（P0）：fold-0.05, raise+0.15, call 归一化（原逻辑 fold 不变与策略矛盾）
- **手牌难度分类 169 全覆盖**（P0）：56 手 → 169 手（STRONG 15 + INTERMEDIATE 54 + ADVANCED 100，三类互斥无重复）
- **PREFLOP_EQUITY 169 全覆盖**（P1）：58 手 → 169 手（PokerStove/Equilab 公开胜率表）
- **isOptimal 阈值统一**（P1）：0.3 → 0.5，与 `correct` 阈值一致
- **l2-bb-defense 补 HJ 防御频率**（P1）：补齐 `vs HJ Open 35-40%`
- **calculateGrade 边界值修正**（P1）：`<2` → `≤2`，`<5` → `≤5`，边界归入更严重等级
- **buildDecisionFeedback 统一分级**（P2）：统一使用 `calculateGrade(evLoss)`，避免 isCorrect 掩盖真实 EV 损失

### 阶段四：整体范围训练体系流畅性校验

#### 反馈闭环贯通（4 P0）

- **range-trainer 接入 relatedLessonId**：新增 `inferRelatedLessonId`，由 position+actionType 推导课程 ID
- **GTO 模拟器接入 relatedLessonId**：根据 `scenario.street` 推导（preflop→l4-gto-basics, flop→l3-cbet, turn/river→l3-multistreet）
- **range-trainer 接入自适应难度**：progress store 新增 `shouldDownshiftDifficulty` API，连续答错 ≥3 次显示降级提示
- **pot-odds 接入五级反馈 + 自适应难度**：`PotOddsQuizPage` 接入 `buildOddsFeedback` + 降级提示

#### 一致性与新手路径（7 P1）

- **CourseView 双层门禁**：Level 解锁检查 + prerequisite 解锁检查，防止 URL 绕过（`mental-tilt-recognition` 例外）
- **puzzle-trainer 接入课程联动**：`inferPuzzleLessonId` 映射 10 个主题到课程 ID，PuzzleCard 显示"去复习"链接
- **range-trainer 位置渐进解锁**：`POSITION_UNLOCK_THRESHOLDS`（UTG=0/HJ=800/CO=1000/BTN=1200/SB=1500/BB=1800），RangeSelector 锁定未解锁位置
- **QuickDrill 自动降级**：连续答错 ≥3 次自动降级（不低于 beginner）
- **GTO/puzzle 降级提示**：连续答错时显示 banner
- **dailyPlan 职责区分**：两个 `generateDailyPlan` 添加注释明确职责（学院焦点 vs 跨模块推荐）

#### 数据清理（3 P2）

- **ABILITY_LESSON_MAP 修正**：5 个错误 lesson ID 全部修正（`l2-3bet`→`l2-3bet-basics` 等）
- **课程 prerequisite 字段**：`Lesson` 类型新增 `prerequisites?: string[]`，`l2-4bet-strategy`/`l2-squeeze` 声明依赖 `l2-3bet-basics`
- **TiltWarning 三选项**："我知道了"（仅关闭）+"学习情绪管理"（跳转 mental-tilt-recognition）+"休息一下"（返回 Dashboard）

### 修改文件清单

#### 数据文件
- `src/features/range-trainer/constants.ts` — 范围预设 + 位置解锁阈值
- `src/features/strategy-academy/data/courses.ts` — 课程内容 + prerequisite 字段

#### 工具/Hook 文件
- `src/features/range-trainer/utils/rangeParser.ts` — 裸手牌展开
- `src/features/gto-simulator/utils/strategyCompare.ts` — EV 公式 + PREFLOP_EQUITY + Calling Station
- `src/features/gto-simulator/hooks/useGTOComparison.ts` — resolveSpotKey 重构
- `src/features/gto-simulator/hooks/useScenarioEngine.ts` — 手牌难度分类补齐
- `src/features/range-trainer/hooks/useQuizEngine.ts` — inferRelatedLessonId + 自适应难度
- `src/features/puzzle-trainer/hooks/usePuzzleEngine.ts` — inferPuzzleLessonId
- `src/features/strategy-academy/utils/dailyPlan.ts` — ABILITY_LESSON_MAP 修正

#### 类型文件
- `src/shared/types/decisionFeedback.ts` — calculateGrade 边界 + buildDecisionFeedback
- `src/features/strategy-academy/types.ts` — Lesson.prerequisites 字段
- `src/features/puzzle-trainer/types.ts` — PuzzleAnswerRecord.relatedLessonId

#### 组件文件
- `src/features/range-trainer/components/TrainingSession.tsx` — 降级提示
- `src/features/range-trainer/components/RangeSelector.tsx` — 位置渐进解锁
- `src/features/gto-simulator/components/GTOSessionPage.tsx` — relatedLessonId + 降级提示
- `src/features/pot-odds/components/PotOddsQuizPage.tsx` — 五级反馈 + 降级提示
- `src/features/puzzle-trainer/components/PuzzleCard.tsx` — "去复习"链接
- `src/features/strategy-academy/components/CourseView.tsx` — 双层门禁
- `src/features/strategy-academy/components/QuickDrill.tsx` — 自动降级
- `src/features/progress/components/TiltWarning.tsx` — 三选项

#### Store 文件
- `src/features/progress/store.ts` — shouldDownshiftDifficulty API + ProgressStore 类型扩展

### 验证

- 每阶段修复后均运行 `tsc --noEmit`，全部通过（exit code 0）
- 手牌分类脚本验证：169 手全覆盖，三类互斥无重复
- 范围嵌套关系验证：HJ ⊂ CO ⊂ BTN、BB 防御 ⊂ BTN open、3bet ⊂ open、4bet ⊂ 3bet

---

## v1.7 — 2026-07-25（P2-4 导师角色人格化）

### 新增

- **导师角色人格化**（P2-4）
  - 三种教练风格：`strict-math`（严谨数学派）/ `old-school`（老派牌手）/ `encouraging`（鼓励型教练）
  - 设置页"教练风格"卡片，3 张教练卡片可点击切换，当前选中项高亮（黄铜金边框 + ring）
  - `MENTOR_FEEDBACK_TEMPLATES` 提供每种风格 × 5 个 grade 的模板，支持 `{evLoss}` / `{correctAction}` 占位符替换
  - `renderMentorFeedback(mentorStyle, grade, params)` 简单字符串替换，不引入模板引擎
  - GTOFeedback / QuizCard 优先调用 `renderMentorFeedback`，缺省时降级到 i18n `feedback.message.*`
  - 颜色与图标仍由 `GRADE_DISPLAY_CONFIG` 统一控制

### 数据迁移

- progress store persist version 升级 **4 → 5**
- migrate 函数 v4 → v5 注入 `mentorStyle = DEFAULT_MENTOR`（仅新字段，不触碰 onboarding/streak/elo/quickDrillStreak 等已有字段）

### 文件位置

- `src/shared/types/mentor.ts` — `MentorStyle` / `MentorProfile` / `MentorFeedbackTemplate` 类型，`MENTOR_PROFILES` / `DEFAULT_MENTOR` 常量
- `src/shared/constants/mentorStyles.ts` — `MENTOR_FEEDBACK_TEMPLATES` 与 `renderMentorFeedback` 函数
- `src/features/progress/store.ts` — `mentorStyle` 状态字段与 `setMentorStyle` action（persist v5）
- `src/features/progress/components/SettingsPage.tsx` — 教练风格切换 UI
- `src/features/gto-simulator/components/GTOFeedback.tsx` / `src/features/range-trainer/components/QuizCard.tsx` — 文案渲染入口

### i18n

- `mentor.settings.*`（标题 / 提示 / 语气标签 / 已选中）
- `mentor.profiles.{style}.{name, description, voiceTone}`
- zh / en 双语齐全

---

## v1.6 — 2026-07-25（P1-4 / P2-5）

### 新增

#### 1. 3 分钟快速训练扩展（P1-4）

- **Best Record 持久化**：puzzle-trainer store 新增 `quickDrillBest: QuickDrillBestRecord | null`（bestScore / bestAccuracy / bestTime / achievedAt），与 `rushBest / dailyBest / themeBest` 解耦
- **综合分数公式**：`accuracy * 100 + max(0, round((10 - averageTime) * 3))`（满分约 130，时间奖励上限 30）
- **SRS 复习队列混合**：快速模式下调用 `composeDailyMix(newQuestions, todayReviewItems, questionCount, userAccuracy)` 决定复习题/新题比例；复习题通过 `reviewItemToPracticeQuestion` 转换（仅保留 `metadata.options` 选择题），放在新题之前作为热身
- **连续 7 天奖励**：progress store 新增 `quickDrillStreak` 与 `lastQuickDrillDate`（与 `streak` 子计数器独立），连续第 7 / 14 / 21 … 天触发 `awardStreakFreeze(1)`
- **幂等性**：`recordQuickDrillCompletion()` 在 `lastQuickDrillDate === today` 时直接返回当前状态，不重复 +1
- **结果面板扩展**：复习题数量（Sparkles 蓝色）→ 新纪录（Trophy 金色，仅 isNewRecord）→ 冻结卡奖励（Gift 绿色，仅 freezeRewarded）→ 当前连续天数（Zap 灰色）→ Streak 计入 ✓

#### 2. 情绪管理模块（P2-5）

- **Tilt 前兆识别**：`TiltWarning.tsx` 监听 `emotion.consecutiveWrongCount`，从 <3 跨越到 >=3 时弹出 Dialog "要不要休息一下？"，提供"休息一下"（返回 Dashboard）与"继续训练"两个按钮；在 `AppLayout` 全局渲染一次
- **Session 止损**：`SessionLimitGuard.tsx` + `useSessionLimitReached` hook，达到每日题量上限（0/50/100/200 四档，0=无限）时禁止继续训练；在 `RangeQuizPage` / `PotOddsQuizPage` / `GTOSessionPage` / `QuickDrill` 组件开头检查
- **下风期检测**：`checkDownswing` action 取最近 3 天 `accuracyHistory`，判断严格递减则标记 `isDownswing=true`；`DownswingAlert.tsx` 仅在 isDownswing=true 时渲染，提供"查看应对指南"按钮跳转 `mental-tilt-recognition` 课程
- **情绪记录**：`MoodTracker.tsx` 提供"好 / 一般 / 差"三档情绪标记按钮，同步展示今日正确率与情绪关联文案（4 种情境）
- **数据采集**：答题时自动调用 `recordAnswer(isCorrect)`，更新 `consecutiveWrongCount` / `dailyQuestionsAnswered` / `dailyCorrect` / `dailyTotal` / `accuracyHistory`；accuracyHistory 仅保留最近 7 天

### 数据迁移

- puzzle-trainer store persist version 升级 **1 → 2**（migrate 函数注入 `quickDrillBest: null`）
- progress store persist version 升级 **5 → 6**（migrate 函数 v5→v6 防御性合并注入 emotion 默认值）

### 文件位置

- `src/features/progress/types.ts` — `EmotionState` 接口与 `DEFAULT_EMOTION_STATE` 常量
- `src/features/progress/store.ts` — `emotion` 状态字段与 `setTodayMood` / `recordAnswer` / `setDailyQuestionLimit` / `checkDownswing` / `resetDailyCounters` 共 5 个 actions（persist v6）
- `src/features/progress/components/TiltWarning.tsx` — Tilt 前兆 Dialog
- `src/features/progress/components/SessionLimitGuard.tsx` — Session 止损守卫与 hooks
- `src/features/progress/components/DownswingAlert.tsx` — 下风期提示卡片
- `src/features/progress/components/MoodTracker.tsx` — 今日情绪标记 + 正确率关联展示
- `src/layouts/AppLayout.tsx` — 全局渲染 TiltWarning
- `src/features/progress/components/SettingsPage.tsx` — 每日题量上限设置
- `src/features/progress/components/Dashboard.tsx` — 渲染 DownswingAlert 与 MoodTracker
- 各训练模块 hooks（`useQuizEngine` / `useOddsCalculation` / `useGTOComparison`）— 情绪记录器

### i18n

- `quickDrill.result.reviewIncluded` / `quickDrill.reviewQueueHint` / `quickDrill.newRecord` / `quickDrill.freezeReward` / `quickDrill.streak.{current, rewarded, broken}` 共 7 个新键
- `tilt.*`（4 项）/ `sessionLimit.*`（6 项）/ `downswing.*`（3 项）/ `mood.*`（10 项）共 23 个 key
- zh / en 双语齐全

---

## v1.5 — 2026-07-25（P1-3 SRS 落地）

### 新增

- **SM-2 算法与训练题打通**：range-trainer `useQuizEngine.recordSrsForAnswer` / pot-odds `useOddsSrsRecorder` / gto-simulator `useGtoSrsRecorder` 三个 hook 暴露记录器，答题后调用 `processReview` 更新复习项
- **题目 ID 规范**：`range:{position}:{hand}` / `odds:{questionId}` / `gto:{scenarioId}`，确保跨模块唯一
- **Quality 评分映射**：答对+用时<5秒→5；答对→4；答错→1（自评"记得"→5；"不记得"→1）
- **每日混合比例**：`composeDailyMix(newQuestions, reviewItems, totalCount, userAccuracy)`：默认 30% 复习 + 70% 新题；正确率 < 0.6 → 50% / < 0.4 → 70%；今日复习队列为空 → 全部用新题
- **SpacedRepetitionPanel 升级**：新增"开始复习"主 CTA（brass 色，含 PlayCircle 图标 + 剩余数量徽章）、今日进度条、双状态（"已完成" / "今天没有待复习的内容"）
- **ReviewSession 组件**：Dialog-based，三种渲染模式（多选题 / 自评 / 退化自评）+ 总结页（总题数 / 答对 / 正确率 / 用时）
- **Dashboard 集成**：新增 `reviewSessionOpen` 本地状态，通过 `onStartReview` 回调传递给 SpacedRepetitionPanel

### 文件位置

- `src/features/progress/utils/spacedRepetition.ts` — `ReviewItemMetadata` 接口（front / back / options / source / scenario）
- `src/features/progress/utils/dailyTrainingMix.ts` — `composeDailyMix` / `getReviewRatio`
- `src/features/progress/components/SpacedRepetitionPanel.tsx` — 升级后的复习面板
- `src/features/progress/components/ReviewSession.tsx` — Dialog-based 复习模式

### 数据迁移

- 无需升级 persist version（ReviewItem 仅扩展可选 `metadata` 字段，老数据自动回退到 `minimal` 自评模式）

### i18n

- `spacedRepetition.*` 扩展 9 个新键（title / allDone / allDoneMessage / emptyToday / progressLabel / lastReview / moreItems / totalItems / review）
- `review.*` 新命名空间（16 个键）
- zh / en 双语齐全

---

## v1.4 — 2026-07-25（P1-1 / P1-2）

### 新增

#### 1. 扑克谜题模式（P1-1）

- **三种模式**：
  - Puzzle Rush（限时冲刺）：3/5 分钟（URL 参数 `?duration=3|5`），3 条命，连对 5 题奖励 +10 秒，难度递增
  - Daily Puzzle（每日谜题）：基于日期种子（YYYYMMDD）从全题库抽取 8 题，所有人当天看到相同
  - Theme Drill（主题训练）：单主题 15 题专攻
- **Rush 分数公式**：`correctCount × 100 + floor(timeRemaining/1000) × 10 + lives × 200`
- **日期种子算法**：`utils/dateSeed.ts` 基于 **Mulberry32** 算法，提供 `getDateSeed` / `seededRandom` / `pickBySeed` / `shuffleBySeed` / `getDailyCompletionCount` / `getDailyKey`
- **状态管理**：独立 zustand store（`puzzle-trainer-store`），状态字段 `rushBest` / `dailyBest` / `themeBest` / `dailyCompleted`，不触碰 progress store 的 elo 字段
- **Puzzle 引擎**：`hooks/usePuzzleEngine.ts` 统一管理三种模式的题目流 / 计时 / 命 / 连对奖励
- **五级反馈复用**：根据 EV 损失自动评级（best/correct/inaccuracy/wrong/blunder）
- **路由**：`/puzzle`、`/puzzle/rush`、`/puzzle/daily`、`/puzzle/theme/:themeId`，均用 LazyWrapper 包裹

#### 2. ELO 能力分级体系（P1-2）

- **六段位**：新手 🌱 (0-500) / 入门 🎯 (500-800) / 进阶 ♠️ (800-1200) / 中级 ♥️ (1200-1600) / 高级 ♦️ (1600-2000) / 专家 ♣️ (2000-3000)
- **ELO 算法**：简化 ELO 公式 `E = 1 / (1 + 10^((diff*800 - rating + 400) / 400))`，`delta = K * (S - E)`
- **动态 K 因子**：新手 (<50 局) K=48 / 默认 K=32 / 高分 (>200 局且 overall>1600) K=24
- **维度对应**：preflop ← range-trainer；math ← pot-odds；postflop ← gto-simulator；handReading / mental 暂用映射占位
- **状态集成**：progress store 添加 `elo: EloRating` 与 `eloRankUp: RankUpEvent | null`；`updateElo(dimension, isCorrect, difficulty)` action 自动更新 overall、检测段位升级
- **数据迁移**：启动时通过 setTimeout + 动态 import 从 `strategy-academy/abilityAssessment` 同步初始 ELO（`abilityToElo`：0-100 → 300-1500 映射，仅当 `gamesPlayed===0` 时生效）
- **Dashboard 显示**：欢迎区下方新增段位徽章按钮，边框色随段位变化
- **五维雷达图升级**：`WeaknessAnalysis.tsx` 数据源从训练记录（0-100 正确率）切换为 ELO 五维分数（0-3000），维度标签更新为翻前 / 翻后 / 赔率数学 / 牌局阅读 / 心态一致性
- **段位升级庆祝**：`RankUpCelebration.tsx` 全屏 Dialog，含 emoji 大徽章 + 旧段位→新段位过渡展示 + CSS 彩纸粒子动画

### 数据迁移

- progress store persist version 升级 **2 → 3**（migrate 函数注入 ELO 默认值）

### 文件位置

- `src/features/puzzle-trainer/` — 完整模块目录
- `src/shared/types/elo.ts` — `EloRating` / `Rank` / `RANKS` / `DEFAULT_ELO` / `RankUpEvent`
- `src/shared/utils/elo.ts` — ELO 算法实现
- `src/features/progress/components/RankUpCelebration.tsx` — 段位升级庆祝
- `src/features/progress/components/Dashboard.tsx` — 段位徽章按钮集成
- `src/features/progress/components/WeaknessAnalysis.tsx` — 五维雷达图升级

### i18n

- `puzzle.*` 完整 i18n 树（themes / home / card / rush / daily / theme / result / common 八个子树）
- `elo.unit` / `elo.rankBadge.aria` / `elo.radar.*`
- `rankUp.title` / `rankUp.subtitle` / `rankUp.continue`
- zh / en 双语齐全

---

## v1.3 — 2026-07-25（P0 阶段全量落地）

### 新增

#### P0-1：新手引导流程（Onboarding）

- 5 步流程：Welcome / PlacementTest / FirstDrill / Celebration / GoalSetting
- `OnboardingGate` 组件在 `AppLayout` 中包裹 `<Outlet />`，未完成 onboarding 时自动重定向到 `/onboarding`
- 5 道定位题覆盖 4 个维度：handRanking(2题) / position(1题) / odds(1题) / range(1题)
- 答题正确率映射到 30-70 区间写入 `onboarding.initialAbility`
- 首次微训练最后一题强制从简单题库抽取，答错追加补救题
- 首胜庆祝调用 `recordTrainingDay()` 启动 Day 1 Streak
- persist version 升级至 **1**

#### P0-2：Streak 深度机制

- `StreakState` 包含 currentStreak / longestStreak / lastTrainingDate / streakFreezes / streakFreezeUsedToday / milestones / lastMilestoneCelebrated / streakStartDate / streakBrokenAt
- 新用户初始赠送 2 张冻结卡；老用户首次升级到 v2 migrate 时同样补发 2 张
- gap=2 天且冻结卡 >0 且今日未用时自动扣减 1 张，streak 继续 +1
- 里程碑：达成 3/7/30/100/365 天分别奖励 1/2/3/5/10 张冻结卡
- `StreakCelebration.tsx` 全屏 Dialog，CSS keyframes 动画（彩屑 / 烟花 / 光晕）
- 30 天及以上的庆典显示"分享"按钮，调用 `generateStreakShareCanvas` 生成 1080x1080 PNG
- Earn Back 机制：streak 断裂时记录 `streakBrokenAt`，24 小时内完成训练可恢复
- `StreakTracker` 在 20:00 后未训练时火焰变红闪烁
- persist version 升级 **1 → 2**（migrate 函数转换老 `lastTrainingDate` number 时间戳为 `streak.lastTrainingDate` YYYY-MM-DD string）

#### P0-3：基础 Drill 内容建设

- 4 个 Drill：HandRankingDrill（10题）/ PositionDrill（8题）/ OutsDrill（8题）/ PotOddsDrill（6题）
- 统一 `DrillProps` 接口：`onComplete(result: DrillResult)` / `onExit()`
- 复用现有 CardSVG / HandDisplay 组件，不引入新依赖
- 在 `courses.ts` 注册 4 个 drill 类型 lesson，`Lesson` 类型新增 `drillComponent?` 字段
- 在 `learningTracks.ts` 零基础快速入门 track 中按顺序插入 4 个 drill
- `DrillLessonRouter.tsx` 使用 `React.lazy` 懒加载 4 个 Drill 组件

#### P0-4：反馈机制三级分类（已升级为五级，见 v2-2）

- 初版：`DecisionGrade = 'optimal' | 'acceptable' | 'error'`
- `GRADE_THRESHOLDS`：optimal:0 / acceptable:0.5 / error:1.5（BB/100）
- 后续在 P2-2 阶段升级为五级

#### P0-5：首页"3 分钟快速训练"入口

- Dashboard 顶部欢迎区下方新增渐变 CTA 卡片（brass-dark → brass → brass-bright）
- 三个入口：range / odds / mixed，跳转 `/academy/quick-drill?mode=${mode}&quick=true`
- `QuickDrill.tsx` 接收 `quick=true` 参数进入快速模式（固定 5 题、自适应难度）
- 今日已完成时显示 "✓ 今日已完成" 徽章
- 完成时调用 `recordTrainingDay` 计入 Streak，新增 XP 计算（每题 +10 / 全对 +20 奖励）

### 数据迁移

- progress store persist version 升级 **0 → 1 → 2**

### 文件位置

- `src/features/onboarding/` — 完整模块目录
- `src/features/progress/components/OnboardingGate.tsx`
- `src/features/progress/components/StreakCelebration.tsx`
- `src/features/progress/components/StreakTracker.tsx`
- `src/shared/utils/shareCard.ts` — `generateStreakShareCanvas`
- `src/shared/types/decisionFeedback.ts` — `DecisionGrade` / `DecisionFeedback` / `GRADE_THRESHOLDS` / `calculateGrade` / `GRADE_DISPLAY_CONFIG`
- `src/features/strategy-academy/components/drills/` — 4 个 Drill + 题库 + DrillLessonRouter
- `src/features/progress/components/Dashboard.tsx` — 快速训练入口
- `src/features/strategy-academy/components/QuickDrill.tsx` — 快速模式

---

## v1.2 — 2026-07-24（UI/UX 设计规范升级）

### 变更

- 更新 UI/UX 设计规范：经典德州扑克主题色彩体系
  - 四层色彩架构：牌桌绿呢面 / 象牙白 / 黄铜金 / 胡桃木
  - 字体规范：Fraunces (serif) / Inter Tight (sans-serif) / JetBrains Mono (monospace)
  - 设计原则：沉浸感、信息层级、克制装饰、对比度保障、响应优先

---

## v1.1 — 2026-07-24（策略学院与跨模块优化）

### 新增

- **策略学院模块**（Strategy Academy）：三段式互动教学（概念讲解 → 实例演示 → 实践测验），德扑基础入门、GTO 课程、对手阅读课程、知识图谱、等级解锁
- **对手形象系统**（Opponent Profiles）：TAG / LAG / NIT / Calling Station 四种典型形象，VPIP / PFR / AF 等核心数据可视化，策略建议
- **每日训练计划 / 间隔复习 / 难度自适应**：基于用户进度和弱项智能推荐，SM-2 间隔重复算法，根据正确率动态调整训练难度
- **筹码量与下注尺度系统**：支持 20BB/50BB/100BB 不同有效筹码量，覆盖 1/3 pot / 1/2 pot / 3/4 pot / pot / overbet 等常见尺度
- **跨模块一致性优化**：Toast 提示系统（基于 sonner）、统一空状态组件、统一加载骨架屏、训练结果页统一（ResultSummary）、键盘快捷键

---

## v1.0 — 2026-07-20（初始版本）

### 新增

- 初始版本创建：包含产品概述、目标指标、用户调研、竞品分析、功能需求（5 大模块 + 高级功能）、非功能需求、用户旅程、设计约束、版本规划
- 五大核心训练模块：
  - 手牌范围训练（学习模式 + 测验模式 + 13×13 网格 + 5 个位置预设）
  - 底池赔率计算器（赔率计算 + EV 分析 + Outs 速查 + 胜率图表）
  - GTO 决策模拟器（场景训练 + Spot 练习 + GTO 反馈 + 结果页面）
  - 历史牌局复盘（多平台导入 + 逐步回放 + 街道时间轴 + 标注系统 + 搜索筛选）
  - 进度追踪（Dashboard + 正确率趋势 + 打卡日历 + 能力雷达图 + 成就系统）
- 高级功能：每日挑战、排行榜、PWA 支持、国际化（中/英）

---

## v2-2 反馈机制五级分类升级 — 2026-07-25

### 变更

将 P0-4 的三级分类（optimal / acceptable / error）升级为五级（对标 GTO Wizard）：

- **新五级**：`DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder'`
- **新阈值**：best:0 / correct:0.5 / inaccuracy:2 / wrong:5 / blunder:Infinity（BB/100）
- **新显示配置**：best 深绿 🌟 / correct 浅绿 ✅ / inaccuracy 黄 🟡 / wrong 橙 🟠 / blunder 红 🔴
- **向后兼容**：`migrateGrade(oldGrade)` 将旧三级值映射为 'best' / 'correct' / 'wrong'；旧 i18n key 保留并标记 deprecated
- **构造助手**：`buildDecisionFeedback({ isCorrect, evLoss?, correctAction, explanation?, relatedLessonId? })` 用于不持有 evLoss 的调用方
- **GTO 反馈**：`GTOFeedback.tsx` 新增 `feedback?: DecisionFeedback | null` 可选 props；提供时优先使用五级显示，否则降级为旧二元显示
- **Range 反馈**：`QuizCard.tsx` 新增 `decisionFeedback?: DecisionFeedback | null` 可选 props；五级反馈样式与 GTOFeedback 一致
- **最后一题简单 + 补救机制**：range-trainer / pot-odds / gto-simulator 三个模块均在题目序列生成时将末题替换为最简单题；末题答错且未用过补救时追加一道简单题（`rescueUsed: boolean` 避免无限循环）
- **结果记录**：`TrainingResult.lastQuestionCorrect` 记录最终题是否答对（含补救题）

---

## v2-1 本土低级别盈利路径 — 2026-07-25（P2-1）

### 新增

- **学习轨道**：`track-local-cn` 本土低级别盈利路径，6 模块 16 课，预计 8-10 小时
- **模块 1 Limp 局应对**（3 课）：国内最常见桌型
- **模块 2 Ante/Straddle**（2 课）：BTN Straddle、UTG Straddle、Ante 结构的翻前范围调整
- **模块 3 深筹码调整**（2 课）：500BB+ 深筹的隐含赔率、同花连牌策略、反向隐含赔率陷阱
- **模块 4 玩家剥削**（4 课）：跟注站 / Maniac / Nit / LAG 四类对手的针对性剥削策略
- **模块 5 GTO 与剥削平衡**（2 课）：何时坚守 GTO、何时偏离、基于统计偏差的具体偏离策略
- **模块 6 情绪管理**（3 课）：Tilt 识别、止损纪律、Session 管理与长期盈利心态
- **对手画像训练 Drill**：8 道判断题，根据 VPIP/PFR/AF 等统计判断对手类型并选择应对策略
- **本土化内容**：所有文案使用中文，结合国内实战场景

### 文件位置

- `src/features/strategy-academy/data/localTrack.ts` — 学习轨道定义
- `src/features/strategy-academy/data/localLessons/` — 6 个模块 16 课内容
- `src/features/strategy-academy/data/opponentProfiles.ts` — 扩展对手画像训练 Drill（`OPPONENT_DRILL_QUESTIONS`）

---

## v2-3 主题 Drill 扩展 — 2026-07-25（P2-3）

### 变更

将 Puzzle 模式的主题训练从 5 主题扩展到 10 主题：

| 主题 | 题量 | 分类 |
|---|---|---|
| 翻前 RFI | 30 | 翻前 |
| 大盲防守 | 25 | 翻前 |
| 3Bet 策略 | 20 | 翻前 |
| C-Bet 持续下注 | 20 | 翻后 |
| 同花听牌 | 20 | 翻后 |
| 河牌价值下注 | 20 | 河牌 |
| 诈唬时机 | 15 | 河牌 |
| 短筹码策略 | 20 | 锦标赛 |
| ICM 基础 | 15 | 锦标赛 |
| 多人底池 | 20 | 翻后 |

- 共 205 题，难度分布约 40% 简单 / 40% 中等 / 20% 难
- `PuzzleHome.tsx` 主题训练入口由扁平网格改为按 `PUZZLE_CATEGORIES` 分组展示（翻前 / 翻后 / 河牌 / 锦标赛 4 组）
- 每个主题卡片显示名称、题量、难度标识（基于题目平均难度映射初级 / 中级 / 高级）、最佳正确率

---

## Persist 版本演进时间线

| 时间 | Store | 版本变更 | 触发原因 |
|---|---|---|---|
| 2026-07-20 | progress | (initial) | v1.0 初始版本 |
| 2026-07-25 | progress | 0 → 1 | P0-1 新手引导（注入 onboarding 默认值） |
| 2026-07-25 | progress | 1 → 2 | P0-2 Streak 深度机制（lastTrainingDate 转 YYYY-MM-DD） |
| 2026-07-25 | progress | 2 → 3 | P1-2 ELO 能力分级（注入 elo 默认值） |
| 2026-07-25 | progress | 3 → 4 | P1-4 快速训练扩展（quickDrillStreak / lastQuickDrillDate） |
| 2026-07-25 | progress | 4 → 5 | P2-4 导师角色人格化（mentorStyle） |
| 2026-07-25 | progress | 5 → 6 | P2-5 情绪管理（emotion） |
| 2026-07-25 | puzzle-trainer | 1 → 2 | P1-4 快速训练 Best Record（quickDrillBest，name=`puzzle-trainer-store`） |
| 2026-07-28 | progress | 6 → 7 | v1.9 成就系统（achievements） |
| 2026-07-28 | progress | 7 → 8 | v1.9 冻结卡碎片（freezeFragments） |
| 2026-07-28 | strategy-academy | 1 → 2 | v2.0 practiceResults cap 200 裁剪 + v0→v1 进步回放得分默认值 |

---

## P0 阶段验收清单（已交付）

- [x] 新用户首次访问自动进入 Onboarding 流程
- [x] 定位测试 5 道题完成后给出初始能力评估
- [x] 首次微训练 3-5 题，最后一题确保答对
- [x] 首胜庆祝动画，Day 1 Streak 启动
- [x] 每日目标设定（5/10/20 分钟）
- [x] Streak 冻结卡机制（初始 2 张）
- [x] 3/7 天里程碑全屏庆典
- [x] 晚间 Streak 即将熄灭提醒
- [x] 4 个零基础 Drill 可正常使用
- [x] 零基础学习路径已更新
- [x] 反馈从二元升级为三级分类（后续升级为五级）
- [x] 训练最后一题确保简单题
- [x] 首页"3 分钟快速训练"入口
- [x] 完成训练自动计入 Streak

## P1 阶段验收清单（已交付）

- [x] Puzzle Rush 3/5 分钟限时模式正常工作
- [x] 连对奖励时间、答错扣命机制正常
- [x] 每日谜题基于日期种子，当天题目固定
- [x] 主题训练按知识点分类（已扩展至 10 主题）
- [x] Best Record 记录和展示
- [x] ELO 评分系统正常更新
- [x] 六段位徽章正确显示
- [x] 段位升级庆祝动画
- [x] 五维雷达图使用 ELO 分数
- [x] SRS 复习队列自动调度
- [x] 复习题目自动从队列抽取
- [x] "今日待复习"提示正常显示
- [x] 导航栏有谜题模式入口

## P2 阶段验收清单（已交付）

- [x] "本土低级别盈利路径"完整上线（6 模块 16 课）
- [x] Limp 局、Straddle、深筹策略课程内容完成
- [x] 4 类对手画像训练 Drill 可用
- [x] 反馈升级为五级分类 + 详细解释
- [x] 主题 Drill 扩展到 10 主题
- [x] 导师角色可选（3 种风格）
- [x] Tilt 识别提示
- [x] 情绪记录功能
- [x] 所有课程配有练习题
- [x] 中文内容全部经过本土化校验
