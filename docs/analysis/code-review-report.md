# 全项目代码评审报告

**审查日期**：2026-08-11  
**驱动方式**：`@command://cr`（基于子代理协作 · 并行模式）  
**评审范围**：12 个评审单元（平台/共享层 + 视觉层 + 10 个功能模块），依据 `code-review-plan.md` 分批并行执行  
**产出机制**：12 个评审子代理并行产出交接单 → 汇总去重 → 按严重度分级 → 标注责任代理与回归门禁

---

## 1. 评审方法与并行批次

| 批次 | 评审单元 | 子代理 | 交接单数 |
| --- | --- | --- | --- |
| Batch A · 平台层 | 平台/共享层 | `platform-dev` | PLAT-01~10（10） |
| Batch A · 平台层 | 视觉/设计语言 | `ui-ux-dev` | UI-01~10（10） |
| Batch B · 业务核心 | progress | `progress-dev` | PROG-01~14（14） |
| Batch B · 业务核心 | strategy-academy | `strategy-academy-dev` | ACAD-01~09（9） |
| Batch B · 业务核心 | theory-academy | `theory-academy-dev` | THY-01~13（13） |
| Batch B · 业务核心 | range-trainer | `range-trainer-dev` | RNG-01~08（8） |
| Batch C · 训练模块 | gto-simulator | `gto-simulator-dev` | GTO-01~10（10） |
| Batch C · 训练模块 | pot-odds | `pot-odds-dev` | ODDS-01~07（7） |
| Batch C · 训练模块 | puzzle-trainer | `puzzle-trainer-dev` | PZL-01~07（7） |
| Batch C · 训练模块 | hand-history | `hand-history-dev` | HH-01~10（10） |
| Batch D · 轻量模块 | onboarding | `onboarding-dev` | OB-01~06（6） |
| Batch D · 轻量模块 | help-center | `help-center-dev` | HELP-01~05（5） |

**合计**：12 个评审单元，109 项问题（P0×0 / P1×15 / P2×39 / P3×55）。

---

## 2. 核心发现分级汇总（P0 → P3）

### 2.1 P0 必须修复（0 项）

无崩溃、无数据损坏、无安全级阻断问题。五大系统"记录"action 幂等、每日谜题契约、选项排序重映射、`calculateGrade(evLoss)` 边界归属、persist migrate 等核心契约均正确。

### 2.2 P1 应当修复（15 项）

| # | 问题ID | 单元 | 问题 | 位置 |
| --- | --- | --- | --- | --- |
| 1 | `RNG-01` | range-trainer | call-vs-raise 题型 correctAction 恒为 raise，教学答案错误 | questionGenerator.ts#L94-114 |
| 2 | `GTO-01` | gto-simulator | rescue 场景追加后 currentIndex 未更新，决策绑定错误场景且进度错乱 | store.ts#L160-181 |
| 3 | `GTO-02` | gto-simulator | computeCallAmount 用 flop 缓存 texture，多步 turn/river callAmount 用错；与 ActionSelector 固定 0.5 不一致 | store.ts#L225-238 |
| 4 | `PROG-01` | progress | ModuleStatsPage 整页硬编码中文 + trendData 用中文 dataKey | ModuleStatsPage.tsx |
| 5 | `PROG-02` | progress | dailyTrainingPlan 生成文案全硬编码中文，Dashboard 最显眼 i18n 失效 | dailyTrainingPlan.ts |
| 6 | `HH-01` | hand-history | getDeviationSummary 统计 grade==='optimal'（废弃值），最优率恒 0% | gtoDeviation.ts#L272-288 |
| 7 | `HH-02` | hand-history | gtoWorker 单例无 terminate + 无 onerror 恢复，崩溃后全部超时 | gtoDeviation.ts#L126-166 |
| 8 | `HH-03` | hand-history | deleteHand/clearAll 未清 analysisCache，重导入同 id 显示陈旧偏差 | store.ts#L249-265 |
| 9 | `ODDS-01` | pot-odds | 全模块 UI 与题库硬编码中文，双语对称门禁失效（孤儿 key） | 多文件 |
| 10 | `OB-01` | onboarding | placementQuestions 5 道定位题硬编码中文 | placementQuestions.ts#L8-74 |
| 11 | `PLAT-01` | 平台层 | shared/trainingEvents 依赖 feature/progress/types，违反分层 | trainingEvents.ts#L1 |
| 12 | `PLAT-02` | 平台层 | shared/GameVariantSelector 耦合 progress store + 单模块独用（门槛违规） | GameVariantSelector.tsx#L5 |
| 13 | `PLAT-04` | 平台层 | shared/VariantRuleBanner 死代码（零消费方 + 硬编码中文） | VariantRuleBanner.tsx |
| 14 | `PLAT-05` | 平台层 | shared/utils/variantRules.ts 死代码，evaluateAnswer 危险桩（被误调静默判正确） | variantRules.ts#L85-112 |
| 15 | `UI-01` | 视觉层 | 43 处组件内联 framer-motion transition 字面量，大面积绕过 motion.ts 单源 | 20+ 文件 |

### 2.3 P2 建议修复（39 项）

| 问题ID | 单元 | 问题概要 |
| --- | --- | --- |
| `PLAT-03/06/08/09/10` | 平台层 | GameVariantSelector 双语双轨；MdfComparisonTable+mdfComparison 单模块独用；ResultSummary/BlankLayout/shareCard 硬编码中文 |
| `PLAT-07` | 平台层 | mdfComparison `calculateComparisonValues` 0 除（pot=0/bet=0 → NaN） |
| `UI-02/03/04/05/06/07` | 视觉层 | 主 CTA 双色渐变（brass→sage）；DeleteAll 用 clay 满底；Chip SVG 硬编码 hex 无 token 锚定；中英混排；rgba 阴影硬编码；hover:brightness 滤镜 |
| `PROG-03/04/05/06/07/08/09` | progress | AchievementBadges 第二套成就系统；ReviewSession 阈值未复用单源；WeaknessAnalysis/DailyChallenge 中文；rgba 黄铜阴影；elo 与 eloByVariant 写扩散漂移；里程碑跳档漏发 |
| `ACAD-01~05` | strategy-academy | difficultyMultiplier 数组越界（L7/L8 落 1.0）；areAllLevelsCertified 忽略 validUntil 过期；认证冷却死代码；requiredAccuracy 双口径；变体课程 CourseView 不可达 |
| `THY-01~10` | theory-academy | 各组件硬编码中文；变体 i18n key 缺失；标准 Level 数据文件超 300 行门禁；TheoryChapterView 渲染期 setState；TheoryLevelCard 内联 duration |
| `RNG-02/03/04` | range-trainer | fold 按钮 rgba 硬编码；SessionResult/QuizTimer 内联 transition；全模块 i18n 硬编码 |
| `GTO-03~09` | gto-simulator | GTOFeedback/GTOSessionPage/GTOResultPage/ScenarioSetup/SpotTrainer/DecisionTree/GTOSimulatorHome 硬编码中文 |
| `PZL-01/02/03` | puzzle-trainer | 每日谜题跨午夜完成态归属；会话结束 effect 无 StrictMode 双跑防护（重复副作用）；6 处内联 transition |
| `ODDS-02/03` | pot-odds | timeTaken 单题秒写毫秒字段；内联 transition 字面量 |
| `HH-04/05` | hand-history | 大量中英硬编码；GRADE_CONFIG 重复实现共享配置 |
| `OB-02` | onboarding | onboarding 路由缺 ErrorBoundary（异常白屏闭环风险） |
| `HELP-01` | help-center | HelpHero 内联 transition（0.4 无对应常量 + 缺 ease） |

### 2.4 P3 可选/归档（55 项）

包含各模块的边界、可维护性、a11y、测试健壮性细节，清单见「3. 各模块交接单明细」中标注 P3 的条目。

---

## 3. 各模块交接单明细

> 以下为各评审子代理产出的完整交接单，按模块分节，每节含问题ID、严重度、位置、类型、根因、修复建议、跨模块影响、验证方式。修复建议中的 ORIGINAL/NEW 代码对请参照各子代理原始交接单（本报告精简记录位置与根因）。

### 3.1 平台/共享层（PLAT-01~10）

| ID | 严重度 | 位置 | 类型 | 根因 | 跨模块 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- |
| PLAT-01 | P1 | trainingEvents.ts#L1 | 耦合 | shared 依赖 feature/progress/types | 是(8订阅方) | tsc 解除依赖 |
| PLAT-02 | P1 | GameVariantSelector.tsx#L5 | 耦合 | 耦合 progress store + 单模块独用 | 是(progress) | grep 引用数 |
| PLAT-03 | P2 | GameVariantSelector.tsx#L22-26 | 可维护 | VARIANT_DESCRIPTIONS 双语双轨 | 否 | localeParity |
| PLAT-04 | P1 | VariantRuleBanner.tsx | 可维护 | 死代码 + 硬编码中文 | 否 | grep 引用 |
| PLAT-05 | P1 | variantRules.ts#L85-112 | 可维护 | 死代码 + evaluateAnswer 危险桩 | 否 | grep 引用 |
| PLAT-06 | P2 | MdfComparisonTable+mdfComparison | 耦合 | 单模块独用（门槛违规） | 否 | grep 引用 |
| PLAT-07 | P2 | mdfComparison.ts#L68-78 | 边界 | 0 除 → NaN | 否 | 单测 (0,0) |
| PLAT-08 | P2 | ResultSummary.tsx#L26-58 | 可维护 | 硬编码中文 + 单模块独用 | 否 | localeParity |
| PLAT-09 | P2 | BlankLayout.tsx#L11-56 | 可维护 | SHORTCUTS/按钮/aria 硬编码中文 | 是(全部全屏训练) | en 走查 |
| PLAT-10 | P2 | shareCard.ts#L76-115 | 可维护 | Canvas 硬编码中文 + 单模块独用 | 否 | en 生成分享卡 |

### 3.2 视觉/设计语言（UI-01~10）

| ID | 严重度 | 位置 | 类型 | 根因 | 跨模块 | 验证方式 |
| --- | --- | --- | --- | --- | --- | --- |
| UI-01 | P1 | 20+ 文件 | 可维护 | 43 处内联 transition 绕过 motion.ts 单源 | 是(全部模块) | grep transition:{ |
| UI-02 | P2 | ScenarioSetup.tsx#L304 | 耦合 | 主 CTA 用 brass→sage 双色渐变，违反单重点缀 | 否 | 视觉核对 |
| UI-03 | P2 | HandHistoryList.tsx#L231 | 耦合 | DeleteAll 用 clay 满底，违反危险按钮规范 | 否 | 对比度验证 |
| UI-04 | P2 | Chip.tsx#L15-23 | 可维护 | SVG 渐变 hex 无 token 锚定注释 | 是(共享) | grep hex 带注释 |
| UI-05 | P2 | ScenarioSetup/QuizCard/GameVariantSelector | 可读 | 数据/渲染层硬编码中文混排英文 | 是 | en 走查 |
| UI-06 | P2 | 多处徽章/CTA | 可维护 | rgba 阴影硬编码（含 #d4af37 色相漂移） | 是(共享) | grep rgba( |
| UI-07 | P2 | AcademyResume/TheoryResume/ScenarioSetup/FirstVisitBanner | 可维护 | hover:brightness 滤镜绕过 token | 是 | 主题切换 |
| UI-08 | P3 | designTokenGuard.test.ts | 可扩展 | 守卫不扫 CSS、不拦任意值霓虹 hex、不拦 rgba | 是 | 构造样本 |
| UI-09 | P3 | PositionBadge/Dashboard | a11y | 满色语义底 + 仅颜色区分位置组 | 是 | axe |
| UI-10 | P3 | globals.css 多处 | 可维护 | 渐变色 stop 裸 hex | 是 | grep |

### 3.3 progress（PROG-01~14）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| PROG-01 | P1 | ModuleStatsPage.tsx | i18n | 整页硬编码中文 + 中文 dataKey | en 走查 |
| PROG-02 | P1 | dailyTrainingPlan.ts | i18n | 推荐卡文案全硬编码中文 | en 走查 |
| PROG-03 | P2 | AchievementBadges.tsx | i18n/耦合 | 第二套成就系统 + 中文 + 阈值内联 | en 走查 |
| PROG-04 | P2 | ReviewSession.tsx | i18n/可维护 | CATEGORY_LABELS 中文 + 5000 未复用单源 | en 走查 |
| PROG-05 | P2 | WeaknessAnalysis.tsx | i18n | 雷达图中文轴标签 | en 走查 |
| PROG-06 | P2 | DailyChallenge.tsx | i18n | 奖励名硬编码中文 | en 走查 |
| PROG-07 | P2 | AchievementBadges/AchievementWall | 可维护 | rgba 黄铜阴影硬编码 | grep rgba |
| PROG-08 | P2 | store.ts#L489-530 | 逻辑 | elo 与 eloByVariant 写扩散漂移 | reset 后比对 |
| PROG-09 | P2 | store.ts + streakCalc | 逻辑 | 里程碑跳档只发一个 | 构造跳档 |
| PROG-10 | P3 | store.ts#L590-646 | 边界 | downswing 单题噪声 | 单测 |
| PROG-11 | P3 | useProgress.ts#L48-53 | 可维护 | 死代码 + hooks 反模式 | grep |
| PROG-12 | P3 | SettingsPage.tsx | 泄漏 | setTimeout 未清理 | 卸载冒烟 |
| PROG-13 | P3 | store.ts#L726-754 | 并发 | checkAchievements 并发重复发奖 | 并发单测 |
| PROG-14 | P3 | ProgressReplay.tsx | 边界 | 遍历边界（可读性） | 无 |

### 3.4 strategy-academy（ACAD-01~09）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| ACAD-01 | P2 | store.ts#L366-371 | 逻辑 | difficultyMultiplier 数组越界，L7/L8 落 1.0 | 单测 L7/L8 |
| ACAD-02 | P2 | store.ts#L402-426 | 逻辑 | areAllLevelsCertified 忽略 validUntil 过期 | 单测过期 cert |
| ACAD-03 | P2 | LevelCertification.tsx | 逻辑 | 认证冷却 isReadyForRetry 死代码 | 组件单测 |
| ACAD-04 | P2 | LevelCertification.tsx | 逻辑 | requiredAccuracy 双口径（组件 80 vs store 自适应） | 单测 |
| ACAD-05 | P2 | courseProgress.ts | 逻辑/耦合 | 变体课程 CourseView 不可达 | 手工导航 |
| ACAD-06 | P3 | 多组件 | a11y/i18n | 大量硬编码中文 + aria-label 硬编码 | en 走查 |
| ACAD-07 | P3 | store.ts#L194-226 | 逻辑 | isLevelUnlocked OR 语义旁路风险 | 单测 |
| ACAD-08 | P3 | store.ts#L192 | 逻辑 | resetProgress 残留派生状态 | 单测 |
| ACAD-09 | P3 | LearningTracksView.tsx | 逻辑/a11y | "去学习"固定跳 basics，前置不符 | 手工构造 |

### 3.5 theory-academy（THY-01~13）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| THY-01 | P2 | TheoryQuiz.tsx | i18n | 硬编码中文 + aria 硬编码 | en 走查 |
| THY-02 | P2 | TheoryChapterView.tsx | i18n | 返回目录/小测/已完成等硬编码 | en 走查 |
| THY-03 | P2 | TheoryChapterList.tsx | i18n | 硬编码中文 | en 走查 |
| THY-04 | P2 | TheoryLevelCard.tsx | i18n | 硬编码中文 | en 走查 |
| THY-05 | P2 | ProTipBox.tsx | i18n | "职业牌手说"硬编码 | en 走查 |
| THY-06 | P2 | 变体 i18n key | i18n | en.json 缺 t1hu/t1sd levelTitle/chapterTitle | en 走查 |
| THY-07 | P2 | standardLevel 数据 | 可维护 | Level 数据文件超 300 行门禁 | 行数统计 |
| THY-08 | P2 | TheoryChapterView.tsx | 逻辑 | 渲染期 setState（受控但反模式） | React 检查 |
| THY-09 | P2 | TheoryLevelCard.tsx#L65 | 可维护 | 内联 duration 0.3 | grep |
| THY-10 | P2 | TheoryHome.tsx#L16 | 性能 | 无选择器订阅整个 store | 性能 |
| THY-11 | P3 | TheoryQuiz.tsx | 边界 | 空题库 onComplete(100,0,0) | 单测 |
| THY-12 | P3 | completeChapter | 边界 | 重测重复 emit（语义讨论） | 无 |
| THY-13 | P3 | TheoryQuiz.tsx | 可维护 | 动画用 MOTION_DURATION 直接而非预设 | grep |

### 3.6 range-trainer（RNG-01~08）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| RNG-01 | P1 | questionGenerator.ts#L94-114 | 逻辑 | call-vs-raise 题型 correctAction 恒为 raise | 生成 20 题断言 |
| RNG-02 | P2 | QuizCard.tsx#L96-100 | 可维护 | fold 按钮 rgba 硬编码 | 视觉比对 |
| RNG-03 | P2 | SessionResult/QuizTimer | 可维护 | 内联 transition 字面量 | grep |
| RNG-04 | P2 | 全模块组件 | i18n | 仅 QuizCard 用 t()，其余硬编码中文 | en 走查 |
| RNG-05 | P3 | RangeTrainerHome/TrainingSession | 可读 | "蒸蘆"乱码文案 + "Space=跳过"误导 | 目测 |
| RNG-06 | P3 | questionGenerator.ts | 并发 | 用 Math.random() 非 seededShuffle | 同 seed 复现 |
| RNG-07 | P3 | QuizConfig.tsx | 边界 | 位置回退 effect 缺 preflopElo 依赖 | 模拟 ELO 变化 |
| RNG-08 | P3 | QuizConfig.tsx | 边界 | HU 变体首帧 Select 空态 | 切变体首帧 |

### 3.7 gto-simulator（GTO-01~10）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| GTO-01 | P1 | store.ts#L160-181 | 逻辑 | rescue 后 currentIndex 未更新 | 触发救援断言 |
| GTO-02 | P1 | store.ts#L225-238 | 逻辑 | computeCallAmount 用错 texture + 显示不一致 | 多步节点比对 |
| GTO-03~09 | P3 | 多组件 | 可维护 | 各组件硬编码中文未走 t() | en 走查 |
| GTO-10 | P3 | store.ts#L250-253 | 异常 | worstSpots 非空断言缺防御 | 注入缺失 scenarioId |

### 3.8 pot-odds（ODDS-01~07）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| ODDS-01 | P1 | 多文件 | i18n | 全模块 UI 与题库硬编码中文（孤儿 key） | en 走查 |
| ODDS-02 | P2 | PotOddsQuizPage.tsx#L89-172 | 边界 | timeTaken 单题秒写毫秒字段 | 断言 details 单位 |
| ODDS-03 | P2 | PotOddsQuizPage/OddsDisplay | 可维护 | 内联 transition 字面量 | grep |
| ODDS-04 | P3 | EVCalculator.tsx#L103 | 边界 | 浮点相等分支不可达 | 断点 |
| ODDS-05 | P3 | PotOddsQuizPage.tsx#L149-162 | 可维护 | handleRestart 未清 decisionFeedback | 单测 |
| ODDS-06 | P3 | 多组件 | a11y | range 无 aria 关联、选项按钮无标签 | axe |
| ODDS-07 | P3 | OddsDisplay.tsx#L17 | 可读 | toFixed key 精度内不触发动画 | 观察 |

### 3.9 puzzle-trainer（PZL-01~07）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| PZL-01 | P2 | DailyPuzzle.tsx#L44-61 | 逻辑/边界 | 每日谜题跨午夜完成态归属脱节 | stub Date 跨午夜 |
| PZL-02 | P2 | usePuzzleSession.ts#L58-70 | 并发 | 会话结束 effect 无 StrictMode 双跑防护 | StrictMode 完成会话 |
| PZL-03 | P2 | 6 处组件 | 可维护 | 内联 transition 字面量 | grep |
| PZL-04 | P3 | ActionBoard.tsx#L35-39 | 边界 | UNKNOWN_CATEGORY 误标 aggressive | 构造 99 |
| PZL-05 | P3 | PuzzleHome.tsx#L30-32 | 边界 | mount 冻结 today 跨日滞后 | 模拟跨日 |
| PZL-06 | P3 | PuzzleRush.tsx#L182 | 可维护 | cnInline 重复实现 | 替换后冒烟 |
| PZL-07 | P3 | usePuzzleEngine.ts#L75 | 边界 | 首题计时含页面加载时长 | 停留后作答 |

### 3.10 hand-history（HH-01~10）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| HH-01 | P1 | gtoDeviation.ts#L272-288 | 逻辑 | grade==='optimal' 废弃值，最优率恒 0% | 单测 best |
| HH-02 | P1 | gtoDeviation.ts#L126-166 | 泄漏 | Worker 无 terminate/onerror 恢复 | 模拟 worker 抛错 |
| HH-03 | P1 | store.ts#L249-265 | 逻辑 | deleteHand/clearAll 未清缓存 | 重导入同 id |
| HH-04 | P2 | 多组件 | i18n | 大量中英硬编码 | en 走查 |
| HH-05 | P2 | GtoDeviationPanel.tsx | 耦合 | GRADE_CONFIG 重复实现 | 删除本地配置 |
| HH-06 | P3 | store.ts#L50-59 | 性能 | getAll 无分页 | 千级数据统计 |
| HH-07 | P3 | BoardDisplay/PlayerSeats | 可维护 | 内联 transition | grep |
| HH-08 | P3 | gtoDeviation.ts | 逻辑 | 跨 batch 重复 DeviationResult | >50 动作 |
| HH-09 | P3 | store.ts#L399-401 | 边界 | filter.minPot truthiness | 边界用例 |
| HH-10 | P3 | HandReplayPage.tsx | 可维护 | effect 依赖冗余 | 切换手牌 |

### 3.11 onboarding（OB-01~06）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| OB-01 | P1 | placementQuestions.ts#L8-74 | i18n | 5 道定位题硬编码中文 | en 走查 |
| OB-02 | P2 | routes.tsx#L88 | 异常 | onboarding 路由缺 ErrorBoundary | 抛错白屏 |
| OB-03 | P3 | CelebrationStep.tsx | 可维护 | 内联 `<style>` 注入 | 控制台警告 |
| OB-04 | P3 | OnboardingFlow.tsx | 边界 | currentStep=5 过渡闪烁 | 观察 |
| OB-05 | P3 | FirstDrillStep.tsx | 并发 | 双击无 UI 防抖 | mock spy |
| OB-06 | P3 | OnboardingGate.tsx | 边界 | 精确路径匹配脆弱 | /onboarding/ |

### 3.12 help-center（HELP-01~05）

| ID | 严重度 | 位置 | 类型 | 根因 | 验证方式 |
| --- | --- | --- | --- | --- | --- |
| HELP-01 | P2 | HelpHero.tsx#L38 | 可维护 | 内联 transition 0.4 + 缺 ease | grep |
| HELP-02 | P3 | HelpArticle.tsx#L107-119 | 可维护 | section.to! 断言替代局部收窄 | tsc strict |
| HELP-03 | P3 | FaqAccordion.tsx | a11y | 折叠态 aria-controls 引用不存在元素 | axe |
| HELP-04 | P3 | ConceptCard.tsx | 可扩展 | ICON_MAP Record<string> 宽泛类型 | TS strict 误 key |
| HELP-05 | P3 | HelpHome.test.tsx | 可维护 | 选择器 [aria-expanded] 语义不精确 | 跑测试 |

---

## 4. 跨模块裁决结果

以下跨模块问题经 `platform-dev` 统一裁决，归并到权威归属方：

| 问题 | 归并到 | 裁决说明 |
| --- | --- | --- |
| 内联 transition 字面量（UI-01 + RNG-03 + PZL-03 + ODDS-03 + THY-09 + HELP-01 + GTO 相关） | `UI-01` | 动效单源为全局规范，统一归入视觉层，涉及 20+ 文件跨 8 模块 |
| hardcoded 中文 i18n（各模块分散） | 各模块自行持有 | 不跨模块归并，各模块按自身命名空间处理，但整体由 `PLAT-08` 提供模式参考 |
| `averageTime` 单位（ODDS-02） | `ODDS-02` | 唯一遗留单题 timeTaken 单位问题，其余模块已收敛毫秒 |
| shared 层单模块独用（PLAT-02/06/08/10） | `PLAT-06` | shared 准入门槛违规统一归入平台层裁决，涉及 MdfComparisonTable/GameVariantSelector/ResultSummary/shareCard |

---

## 5. 优化建议汇总（按五维度）

| 维度 | 问题数 | 代表问题 | 修复方向 |
| --- | --- | --- | --- |
| 性能 | 4 | THY-10（store 订阅）、HH-06（getAll 无分页）、UI-01（动效）、PROG-13 | 选择器订阅、IndexedDB 游标分页、动效单源 |
| 可维护性 | 38 | UI-01、PROG-03/08、ACAD-03、PLAT-04/05、RNG-06 | 单点事实源、死代码清理、seededShuffle、阈值常量复用 |
| 可读性 | 12 | RNG-05（乱码）、PROG-14、ODDS-07 | 文案修正、i18n 化 |
| 可扩展性 | 5 | ACAD-05（变体课程）、PZL-04、HELP-04、UI-08 | 变体门禁、类型收窄、守卫扩展 |
| 模块耦合度 | 8 | PLAT-01/02/06、PROG-03/08、HH-05、ACAD-05 | shared 依赖下沉、单模块独用收敛、重复系统统一 |

---

## 6. 回归验证门禁

- **P1 项修复后**：`pnpm verify`（typecheck + lint + test）必须全绿。
- **特定测试**：RNG-01/GTO-01/02/PROG-08/09/ACAD-01/02/HH-01/03 建议补针对性单测。
- **i18n 修复**：`pnpm test src/i18n/localeParity.test.ts` 保持双语对称。
- **视觉修复**：Playwright 截图（`.visual-check/`）+ `designTokenGuard.test.ts`。
- **a11y 修复**：axe 冒烟 / `wcag-audit-patterns`。

---

## 7. 修改文件清单与责任代理（修复阶段建议）

| 责任代理 | 负责问题 | 优先级 |
| --- | --- | --- |
| `platform-dev` | PLAT-01~10、UI-08 | 先修 PLAT-01/02/04/05（分层+死代码） |
| `ui-ux-dev` | UI-01~10 | 先修 UI-01（动效单源，跨模块） |
| `range-trainer-dev` | RNG-01~08 | 先修 RNG-01（教学答案错误） |
| `gto-simulator-dev` | GTO-01~10 | 先修 GTO-01/02（rescue/多步 callAmount） |
| `progress-dev` | PROG-01~14 | 先修 PROG-01/02（i18n） |
| `strategy-academy-dev` | ACAD-01~09 | 先修 ACAD-01/02（认证逻辑） |
| `theory-academy-dev` | THY-01~13 | 先修 THY-01~06（i18n） |
| `pot-odds-dev` | ODDS-01~07 | 先修 ODDS-01/02 |
| `puzzle-trainer-dev` | PZL-01~07 | 先修 PZL-01/02（跨日/双跑） |
| `hand-history-dev` | HH-01~10 | 先修 HH-01/02/03 |
| `onboarding-dev` | OB-01~06 | 先修 OB-01 |
| `help-center-dev` | HELP-01~05 | 先修 HELP-01 |

---

## 8. 设计契约遵循

- **四层色彩 token**：本次评审发现并上报了多处 rgba 硬编码（PROG-07、RNG-02、UI-06/07），属需修复项，非既有合规状态。
- **反霓虹守卫**：`designTokenGuard.test.ts` 已生效（UI-08 指出其盲区）。
- **动效单源**：UI-01 为最大违规面（43 处内联 transition）。
- **i18n 双语对称**：P1 级 6 项均为硬编码中文导致门禁失效，需统一迁移。
- **模块间无直接引用**：PLAT-01/02 违反，需下沉 shared 依赖。

---

*本报告由 12 个评审子代理并行产出交接单后汇总去重形成。修复阶段建议按 §7 责任分配逐项执行，每项修复后运行 `pnpm verify` 回归。*
