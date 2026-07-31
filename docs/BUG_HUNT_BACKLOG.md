# Bug 排查待办清单（P0-B ~ P2-D）

> 本文件承接《功能逐模块 Bug 排查计划》：P0-A（progress store 跨模块状态中枢）已于 2026-07-31 完成，
> 确认 18 项 bug 并全量修复（含 2 项遗留决策点闭环），见 `docs/CHANGELOG.md` 同日条目。
> 以下为**尚未执行**的排查层级，按优先级顺序执行；每层通过后再进入下一层。

---

## 排查方法论（P0-A 经验沉淀）

1. **静态基线先行**：每轮排查前跑 `pnpm typecheck` → `pnpm lint` → `pnpm test`，任何红灯先修复再人工排查
2. **运行时验证**：`pnpm dev` + 浏览器；用 console 直调 store 构造边界状态：
   ```js
   const mod = await import('/dezhou/src/features/<module>/store.ts');
   mod.useXxxStore.getState() / .setState()
   ```
   ⚠️ **HMR 双实例坑**：文件被修改后 Vite 模块 URL 带 `?t=时间戳`，console 裸 import 会拿到与 App 不同的 store 实例（写状态 UI 无反应）。解法：`performance.getEntriesByType('resource')` 找到带时间戳的 URL 再 import，或重启 dev server / 整页刷新后再验
3. **时间敏感逻辑**：streak / 每日谜题 / SRS 通过篡改 localStorage 日期字段模拟"昨天/前天/断签"，不必改系统时间
4. **门禁旁路**：设置页调试码激活 debugMode 验证 7 处门禁旁路；关闭后恢复
5. **bug 记录格式**：模块 / 复现步骤 / 预期 vs 实际 / 涉及文件行号 / 严重级（数据丢失 > 功能不可用 > 逻辑错误 > 显示问题）
6. **只排查不顺手修**：发现的问题入清单，修复作为独立批次（保持排查完整性与修复可审查性）

### P0-A 期间已顺带确认的事项（后续层无需重复排查）

- range/pot-odds/gto 的 trainingEvents.emit 均存在且 progress 入账正常（P0-B 原疑点已消除大半，仅剩 id 碰撞与其余 emit 方逐一验证）
- SessionLimitGuard 已全量接线 9 处（含 puzzle 三模式）且 hooks 顺序安全
- `useGTOWorker`（src/workers/）确认为无调用方的死代码/集成缺口 → P1-C 排查时定性
- 观察项：packageManager 与 devEngines.packageManager 版本不一致告警（低优先，可顺手修）

---

## P0-B：事件总线与判分核心

### 1. trainingEvents（src/shared/stores/trainingEvents.ts）

- 逐一触发全部 emit 方并验证 progress 入账（最近训练记录/统计/streak）：
  theory store、strategy store（practice/basics）、CourseView、DailyPuzzle、PuzzleRush、ThemeDrill、PotOddsQuizPage、GTOSessionPage、RangeQuizPage
- record `id` 唯一性：`Date.now()` 拼接在同毫秒连点场景是否碰撞（addRecord 有 id 去重，碰撞会静默丢记录）
- strategy-academy 的 `recordPracticeScore` 在 `set()` updater 内 emit（store.ts L126）——StrictMode 下 updater 重放是否双发（theory store 已有防御注释，strategy 未确认）

### 2. 五级判分（src/shared/types/decisionFeedback.ts）

- 阈值边界表逐点验证（边界归更严等级）：evLoss=0→best；0.4999→correct；**0.5→inaccuracy**（L49 用 `<`、L50 用 `<=`）；2→inaccuracy；2.01→wrong；5→wrong；5.01→blunder
- `buildDecisionFeedback`：isCorrect=true + evLoss=0.3 → correct（非 best）；isCorrect=false 缺省 → wrong（evLoss=3）
- 旧三级映射：optimal→best / acceptable→correct / error→wrong
- 各模块反馈 UI（QuizCard / GTOFeedback / PuzzleCard / TheoryQuiz）颜色图标一致，均走 GRADE_DISPLAY_CONFIG + `.grade-*` 类
- wrong/blunder 必带"去复习"链接且 relatedLessonId 指向存在课程（对照 curriculumIntegrity）
- 导师人格化：三风格 × 五评级 15 套模板齐全；切换风格后反馈文案立即变化；缺省降级 i18n

### 3. 选项排序（PRD 5.26，shared/utils/seededShuffle.ts + 各模块出口）

- 各题库正确答案位置分布 ≤60%（分布守卫测试已有，抽查新题）
- 同一题跨会话、跨语言顺序稳定；每日谜题当天全用户一致；认证考试每次进入重新随机
- 动作类选项恒为"消极→激进"；数值类单调
- i18n-key 型题库在 `t()` 解析后重排且顺序不随语言变化

**高发问题类型**：边界比较符写反、t() 前洗牌导致中英顺序不一致、重排后正确答案索引未重映射

---

## P1-A：范围训练（src/features/range-trainer/）

**步骤**：
1. 6 位置 × 4 动作类型切换，13×13 网格渲染（对角线对子/上三角同花/下三角 offsuit）——抽查 AA/AKs/AKo/72o 四角
2. 学习模式悬停格子显示手牌详情与范围内外状态
3. 测验全流程：计时、五级反馈、末题简单题、答错补救（只一次）、结果页统计
4. 位置解锁：preflopElo 设 799/800/1199/1200 等临界值验证 HJ/CO/BTN/SB/BB 锁定态与悬停提示；调试解锁全开
5. 结果保存 + streak 入账（P0-A 已修 recordTrainingDay 接线，验证回归）

**边界**：范围边缘手牌判定、计时器切后台/返回行为、连错 3 次降级 banner、`/range-trainer/result/:sessionId` 直接刷新（store 无 persist，应优雅降级不白屏）

**重点文件**：utils/rangeParser.ts、handClassifier.ts、hooks/useQuizEngine.ts、useTimer.ts、components/RangeGrid.tsx、QuizCard.tsx、constants.ts（isPositionUnlocked）

**问题类型**：范围数据组合数错误（用 RangeInfo 面板手牌数/占比校验）、刷新丢会话态、计时器泄漏

---

## P1-B：底池赔率（src/features/pot-odds/）

**步骤**：
1. 底池赔率：pot=100 bet=50 → 需胜率 25%；手工核对 3 组
2. EV 计算器与手算一致（`eq×(pot+r) - (1-eq)×r`）
3. Outs 速查表 ≥8 种听牌（同花 9 / OESD 8 / Gutshot 4）
4. `/pot-odds/quiz` 全流程：五级反馈、末题简单+补救、选项数值单调排序

**边界**：输入 0/负数/超大数/非数字/清空——不得出现 NaN、Infinity、除零；快速输入不卡顿

**重点文件**：hooks/useOddsCalculation.ts、useEquityEstimate.ts、shared/utils/pokerMath.ts、utils/quizOrder.ts、components/EVCalculator.tsx、OddsCalculator.tsx

---

## P1-C：GTO 模拟器（src/features/gto-simulator/）

**步骤**：
1. 场景配置（位置/筹码深度/动作历史）→ 会话 → 每决策即时反馈（最优动作+EV 损失）
2. Spot 练习可重复同一场景
3. 结果页统计：正确率、EV 损失（BB/100）、逐场景分析
4. relatedLessonId 推导：preflop→l4-gto-basics / flop→l3-cbet / turn/river→l3-multistreet
5. 策略矩阵与 data/*.json 一致（抽查 2-3 手牌）
6. **定性 useGTOWorker 死代码**：GTO 偏差检测（PRD 5.23）是否本应走 worker；决定删除或接入

**边界**：不存在的 scenarioId、结果页直接刷新、EV 公式无硬编码 fold equity（strategyCompare.ts）、boardGenerator 不发重复牌、JSON 缺 key 的 fallback

**重点文件**：hooks/useScenarioEngine.ts、useGTOComparison.ts、utils/strategyCompare.ts、boardGenerator.ts、data/preflop-ranges.json、postflop-ranges.json

---

## P1-D：扑克谜题（src/features/puzzle-trainer/）

**步骤**：
1. Rush：`?duration=3|5` 生效；3 命答错扣 1；连对 5 题 +10s；难度递增 1→2→3；分数公式 `对题×100+剩余秒×10+剩余命×200` 手工核对
2. Daily：改日期验证题目轮换、同日刷新题目与选项顺序不变、完成幂等（markDailyCompleted）、完成人数 100-999 稳定
3. Theme：10 主题 4 分类、题数与 PRD 一致（共 205：RFI30/BB防守25/3Bet20/CBet20/同花20/河牌价值20/诈唬15/短码20/ICM15/多人20）、难度标识
4. Best Record 破纪录才更新、同分不更新、破纪录提示
5. 三模式完成计入 streak（P0-A 已确认 recordTrainingDay 存在，验证回归）

**边界**：Rush 计时到 0 与命耗尽同时发生、中途退出、Daily 跨日进行中会话、`?duration=99` 非法参数、连对计数答错后重置

**重点文件**：store.ts（v2）、utils/dateSeed.ts、optionOrder.ts、hooks/usePuzzleEngine.ts、三个模式组件

---

## P1-E：策略学院（src/features/strategy-academy/）

**步骤**：
1. 主页 9 Level 节点（L4 拆 4A/4B）与进度环
2. 三段式课时（讲解→演示→测验）；Drill 课时跳过测验直接出成绩
3. 解锁矩阵：顺序解锁 + L7 需 L3+L5 + L8 需 L4B——分别构造"只完成 L3"/"只完成 L5"验证 L7 仍锁
4. 双层门禁防 URL 绕过：`/academy/lesson/<locked-id>` 被拦；情绪管理课例外直达；调试解锁旁路
5. 4 个基础 Drill（牌力 10 题末 2 简单 / 位置 8 / Outs 8 / 赔率 6）+ L2-L8 共 16 个 ChoiceDrill 全部可进入并回传结果
6. QuickDrill：快速 5 题/普通 8 题；`?mode=range|odds|mixed` 维度过滤；难度自适应三档（avg<50 或 streak<3→beginner；avg≥70 且 streak≥7→advanced）；SRS 复习题前置混入；结果面板提示优先级（复习题数→新纪录→冻结卡→连续天数→计入✓）
7. 本土路径：L1-L3 前置锁定+提示+跳转链接；6 模块 16 课；对手画像 Drill 8 题
8. 学习路径横向推荐：完成轨道后关联路径卡片可跳转
9. 认证考试选项每次进入重新随机
10. 知识图谱三态与点击跳转

**边界**：quickDrillStreak 7/14 天奖励与断签重置（P0-A 已验 store 层，验 UI 层提示）、`/academy/lesson/不存在`、`/academy/certification/99`
**注意**：P0-A 修复新增了 `isLevelLessonsCompleted/areAllLevelsCertified/isTrackCompleted`，成就触发场景需回归验证（完成 L1 全部课程 → complete-level-1 解锁；单个认证不再解锁 certification-all）

**重点文件**：store.ts（isLevelUnlocked/isLevelEntryUnlocked）、CourseView.tsx、LearningTracksView.tsx、QuickDrill.tsx、drills/DrillLessonRouter.tsx、ChoiceDrillRenderer.tsx、utils/quickDrill.ts、adaptiveDifficulty.ts、data/levels/、localTrack.ts

---

## P1-F：理论学院（src/features/theory-academy/）

**步骤**：
1. 主页三段分级 9 Level 卡片、进度环、锁定态
2. 顺序解锁：Tn 需 T(n-1) 全部章节；URL 直达被拦（TheoryChapterView）；调试解锁旁路
3. 章节流程：阅读→章末小测（3-5 题）→完成；选项排序合规
4. 幂等与最高分：重考不重复计数、得分取历史最高（store L55 Math.max）
5. 章节回访：Level 卡片展开列表直达已完成章节，阅读页免重考导航（返回目录/下一章）
6. ELO 维度：各章声明维度正确更新——重点"牌局阅读/心态一致性"（仅理论学院触达）
7. Level 完成后"去实践"推荐卡链接有效
8. 4 项理论成就逐一触发

**边界**：最高分不被低分覆盖、StrictMode 下事件不双发（store L59 注释防御）、Level 末章"下一章"导航行为

**重点文件**：store.ts（v1，isTheoryLevelUnlocked）、TheoryChapterView.tsx、TheoryQuiz.tsx、utils/theoryProgress.ts、quizOrder.ts、data/levels/

---

## P2-A：新手引导（src/features/onboarding/）

**步骤**：
1. 清空 localStorage → 任意路由重定向 /onboarding（OnboardingGate）；全屏无主导航
2. 三路径：新手（定位测试 5 题 4 维度含解析）/ 有基础（跳过定位）/ 跳过引导
3. 能力评估映射 30-70、GTO 默认 50、写入 progress
4. 微训练末题简单、答错补救（只一次）
5. 首胜庆祝 + Day 1 streak 启动（**P0-A 已修 BUG-02，验证 CelebrationStep 现在真正启动 Day 1**）
6. 目标设定三档记录；完成后刷新不再重定向；调试解锁**不**旁路 onboarding

**边界**：引导中途刷新（恢复当前步骤或安全回退）、引导期间 URL 直达其他路由

---

## P2-B：牌局复盘（src/features/hand-history/）

**步骤**：
1. 三平台真实格式样本导入（PokerStars/GGPoker/PartyPoker），元信息正确
2. 回放：街道时间轴、逐决策点行动序列、玩家座位
3. 标注保存 + 刷新持久（IndexedDB）
4. 筛选（日期/底池/平台）与搜索（牌局号/玩家名）
5. 单删与清空
6. GTO 偏差面板：决策点评级 + EV 损失 + 汇总报告

**边界（解析器重灾区）**：格式损坏/空文件/超大文件（1000+ 手）/混合平台/非 UTF-8/玩家名特殊字符/不完整牌局（中途 all-in）/重复导入去重

**重点文件**：parsers/pokerstars.ts、gg-poker.ts、partypoker.ts、common.ts、utils/gtoDeviation.ts、progress/utils/indexedDB.ts、hooks/useHandReplay.ts

**问题类型**：正则对格式变体脆弱、IndexedDB 打开失败无降级、大量导入卡 UI

---

## P2-C：SRS、进步回放、Dashboard 与今日任务

**SRS（PRD 5.14）**：
- 三训练模块答题后 ReviewItem 自动注册；题目 ID 跨模块唯一；重复答题只更新不新增
- SM-2 间隔 1→3→7→14→30：改日期验证到期项进入今日队列（**注意 P0-A 已把日期改为本地时区，存量 UTC 生成的 nextReviewDate 最多偏 1 天，验证无异常**）
- 复习会话三模式（多选/自评/退化自评）、Quality 评分（对+<5s→5/对→4/错→1）
- 混合比例：默认 30%、<0.6→50%、<0.4→70%（utils/dailyTrainingMix.ts）
- 复习完成"今日复习已完成 ✓"；复习不单独计 streak

**Dashboard**：
- 4 项快速统计、最近 5 条、14 天趋势图（无数据/单日不崩）、打卡日历跨月、难度指示器阈值（<50% 降 / >85% 且 >20 次升 / <5 次不建议）
- 今日任务卡：日期种子轮换、完成态、每日谜题入口、streak 用全局值（P0-A 已统一事实源，回归验证）
- 五维雷达图 0-3000 量纲、空状态

**进步回放**：首次 vs 最近对比、仅一次记录时的行为、进步/退步语义色

---

## P2-D：平台能力

**成就系统（26 个/4 类）**：
- 抽样触发各类别 ≥2 个；已解锁显示日期、未解锁显示条件与进度
- **回归重点**：P0-A 修正了 completeLessons/allCertifications/completeTrack 判定，验证新逻辑（L4 拆分后 `l4a-`/`l4b-` 课程 id 是否被 `isLevelLessonsCompleted(4)` 正确覆盖——LEVELS 按 level 数字过滤，理论上已覆盖，需实测）
- "全成就达成"元成就；成就检查 debounce 不漏（连续快速触发两个条件）

**排行榜**：本地数据排序正确性、空状态

**PWA**：`pnpm build && pnpm preview` 验证 sw.js 注册、断网可访问、manifest 安装；SW 缓存旧版本导致更新不生效（新构建后强刷验证）

**i18n**：
- 顶栏切换 zh/en 全页面即时更新；每模块抽查 3-5 处无 key 裸露
- 理论学院口径：入口/主页 chrome 双语、正文中文
- 选项顺序跨语言一致（P0-B 覆盖后此处抽查）

**响应式与可访问性**：三断点（≥1024/768-1023/<768）走查；<768 底部 MobileNav 6 项 + aria-current；13×13 网格与牌桌组件 390px 不溢出；aria-label 抽查、对比度 ≥4.5:1

---

## 执行与产出约定

1. 顺序：P0-B → P1-A~F → P2-A~D；每层结束输出该层 bug 清单后暂停等确认
2. 排查完成后重跑四项门禁 + `pnpm build` 收尾
3. 修复批次独立于排查批次；修复后在本文件对应条目标注"已修复 + CHANGELOG 日期"并同步回归项
4. 本文件条目完成后打钩标记（`- [x]`），全部完成后本文件归档至 CHANGELOG 并删除
