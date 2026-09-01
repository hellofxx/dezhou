# PokerLab 业务架构理解（当前态）

| 项 | 内容 |
|---|---|
| 回答的问题 | 这个系统是什么、由哪些部分组成、边界与上下游关系如何 |
| 产出路径 | `system-modeler`（场景）+ `c4model` / `graphviz`（图源格式） |
| 视图状态 | **仅当前态**。无目标态、无运行时观测数据 |
| 证据基线 | 工作树 @ `c966912`（含 85 项未提交改动），采集 2026-08-30 |
| 事实源 | `src/` 代码与配置为唯一权威；`AGENTS.md` / `docs/PRD.md` / `docs/TDD.md` 为补充佐证 |
| 配套工件 | `pokerlab.structurizr.dsl`（L1/L2/L3）、`10-modules-dependency.dot`、`20-training-data-flow.dot`、`30-progress-hub.dot`、`00-evidence.md` |

---

## 1. 系统边界：一句话讲清它是什么

PokerLab 是一个**纯前端、零后端、单人本地使用**的德州扑克训练平台。549 个 `src` 源文件编译成**一个 SPA bundle**，交付到 GitHub Pages 的 `/dezhou/` 子路径；所有"服务器端"职责（进度保存、成就判定、间隔复习调度、离线缓存）都由浏览器自身承担。

因此这张架构里**没有 API 服务、没有数据库集群、没有账号系统**：

- 唯一的"人"是**扑克学员**（learner）。没有第二角色，没有管理员后台，没有多租户 / workspace 概念。
- 唯一的"写"出口是浏览器存储：`localStorage`（5 个 zustand persist store）+ `IndexedDB`（3 个库）。
- 唯一的外部数据入口是**学员从扑克室导出的手牌历史文本**（PokerStars / GGPoker / PartyPoker），由 hand-history 解析器消费。
- 所有"门禁"（等级解锁、位置解锁、每日题量上限、新手引导拦截）都是**客户端体验约束，不是安全边界** —— 数据本来就在学员自己设备上，`debugMode` store 还可以一键全放开（`src/shared/stores/debugMode.ts`）。这一点对理解后续所有权限描述很关键：不要把门禁读成访问控制。

34 条路由（33 个懒加载页面 + 1 个 index）分两种外壳：`AppLayout`（带主导航与 `OnboardingGate`）承载 27 条，`BlankLayout`（全屏无导航）承载 6 条沉浸训练页与引导流程。

---

## 2. 业务能力地图

| 能力 | 承担模块 | 学员得到什么 |
|---|---|---|
| 翻前范围判断 | range-trainer | 13×13 网格上练习 17 个范围预设，按位置渐进解锁 |
| 赔率与 EV 计算 | pot-odds | 底池赔率 / EV / 听牌胜率计算器 + 19 题测验 |
| GTO 决策比对 | gto-simulator | 运行时生成的场景（默认 20 个）对照 11 个翻前 spot 频率库与翻后策略，得到 EV 损失 |
| 谜题式速答 | puzzle-trainer | 205 题 / 10 主题 / 三模式（rush、daily、theme） |
| 牌局复盘 | hand-history | 导入真实牌局，逐动作回放 + 统计 + GTO 偏差标注 |
| 系统与理论学习 | strategy-academy、theory-academy | 分级课程 + 概念图谱 + 学习轨道 + 级别认证；理论学院章节讲解 + 章末小测 |
| 度量与激励 | progress | 连续训练天数、ELO 能力分、间隔复习队列、情绪/负荷保护、导师人格化反馈、26 条成就 |
| 首次上手与自查 | onboarding、help-center | 5 步引导（含定位测试）；9 篇教程 / 6 步快速上手 / 8 条 FAQ |

**训练类与学习类的分工**是这套架构最有业务含义的一条线：训练模块产"表现数据"，学习模块供"知识内容"，progress 把两者缝起来 —— 答错的题按 EV 损失定级后写进复习队列，复习队列和 ELO 又反过来决定推荐哪一节课程（`progress/utils/dailyTrainingPlan.ts:93` 经 `getAcademyDataSource().findNextLesson()` 取下一课）。

---

## 3. 核心领域实体（业务语言）

**跨模块唯一的数据契约**是 `TrainingRecord`（`src/shared/types/training.ts`）：

```
{ id, module: 7 个模块名之一的字面量联合, mode: string, result: TrainingResult, createdAt }
```

它既是事件总线的载荷类型，也是训练记录的落库形状。7 个模块字面量与 `TrainingRecord.module` 联合成员一致（`range-trainer` / `pot-odds` / `gto-simulator` / `strategy-academy` / `puzzle-trainer` / `hand-history` / `theory-academy`）—— 注意 `hand-history` 出现在契约里却并不 emit（见 §5 豁免说明），这是契约与实现之间一处值得核对的张力。

**评级脊柱**：`DecisionGrade = best | correct | inaccuracy | wrong | blunder`，由 `calculateGrade(evLoss)` 依 `GRADE_THRESHOLDS`（0 / 0.5 / 2 / 5 BB，边界归更严重等级）单点产出，所有训练模块共用，禁止自定义评级（`src/shared/types/decisionFeedback.ts:15-60`）。这是本仓库少见的"全模块共享的业务不变量"，也是共享内核。

各模块自有实体：

- range-trainer：`RangePreset` / `RangeCell`（13×13，短牌 9×9）、`QuizSessionState`；题库类型 `QuizQuestion` 单一事实源在 `shared/types/quiz.ts`。
- pot-odds：`OddsCalculatorState` / `EVCalculatorState` / `OddsResult` / `DrawInfo`（8 个常见听牌）。
- gto-simulator：`Scenario` / `DecisionNode` / `GTOSpot` / `HandStrategy` / `GTOSession` / `GTOResult`。
- puzzle-trainer：`PuzzleQuestion` / `PuzzleTheme`（10 主题）/ `PuzzleMode` / `PuzzleBestRecord` / `DailyCompletionMap`。
- hand-history：`HandHistory` / `Player` / `StreetActions` / `ReplayState` / `ImportResult` / `HandFilter`；`PlayerAction.amount` 统一为"to 金额"语义（`types.ts:6-15`）。
- strategy-academy：`LevelInfo → Lesson → LessonSection / QuizQuestion / HandExample / PracticeDrill`，另有 `LearningTrack`、`ConceptNode`、`LevelCertification`、`LessonUnit`。层级上 `CourseLevel` 类型定义为 `1|…|8`，但 standard 变体实际有 **9 个 `LevelInfo` 条目**（L4 拆 `l4a` / `l4b`），共 **75 课**；short-deck 与 heads-up 覆盖 L3–L8，L1/L2 回退到 standard 共享基础层。无独立 `Course` 实体。
- theory-academy：`TheoryLevelInfo`（T1–T9，分 basic/intermediate/advanced）→ `TheoryChapter` → `TheorySection` + `TheoryQuizQuestion`。standard 32 章 / 160 题（每章 5 题，题内嵌于章节对象）；short-deck 22 章 110 题；heads-up 22 章 101 题。
- progress：`settings`、`currentGameVariant`、`streak`、`eloByVariant`、`reviewItems`、`emotion`、`mentorStyle`、`quickDrillBest` / `quickDrillStreak`、`unlockedAchievements`、`freezeCardFragments`、`onboarding`、`focusModule`、`pendingMilestone`、`records`。

**游戏变体（standard / short-deck / heads-up）是横切维度**：ELO 按变体分桶（`eloByVariant` + `activeVariant` + `switchActiveVariant()`），课程与理论题库按变体分套，范围训练的网格是 13×13 还是 9×9 也由变体决定。

---

## 4. 跨模块通信：四条通道，且被机器守卫

这是本仓库架构上最值得记住的一点 —— 模块隔离不是约定，是**可执行约束**：

1. **直接 import（白名单，最窄）**：实测代码里的跨模块边与 `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` **完全一致** —— 7 个模块 → `progress`，`hand-history` / `help-center` / `progress` 零出边，**没有任何 peer 债务边**。新增一条边即 `pnpm lint` 报错，且 `src/eslintCrossImports.test.ts` 快照测试会让 `pnpm test` 变红。
2. **事件总线（异步反向）**：6 个训练/学习模块 `trainingEvents.emit(TrainingRecord)`，`progress/store.bootstrap.ts:49-53` 订阅并记账。总线实现只有 28 行，订阅者异常被 `try/catch` 逐个隔离（`trainingEvents.ts:19-27`），一个订阅者抛错不会连累其他。
3. **依赖倒置注册表（消除反向 import）**：`achievementRegistry`（成就数据源）与 `academyDataSourceRegistry`（课程数据源）。学院/谜题模块在自己的 `store.bootstrap.ts` 里注册，progress 侧查询 —— 于是"中枢读学院数据"不再需要中枢 import 学院。精确归属：`progress/store.ts:41` 只用 `achievementRegistry`（成就判定 `checkCondition`，:1036-1105）；`academyDataSourceRegistry` 的消费方是 `progress/utils/dailyTrainingPlan.ts:10,:93` 与 `components/replay/ProgressReplay.tsx:7`。
4. **shared 层（正向下沉）**：类型、纯函数、共享组件、hook。准入门槛 ≥2 模块使用；`TrainingRecord` 从 feature 下沉到 shared 正是为了守住"shared 不依赖 feature"（`shared/types/training.ts` 头部注释 PLAT-01）。

第 3 条通道值得单独记：**它是这套分层里唯一的"运行时反向依赖"**，静态 import 图上看不见它。只看 import 关系会误判 progress 与学院模块之间毫无耦合。

---

## 5. 端到端业务路径 A：答完一道题之后发生了什么

（图源：`20-training-data-flow.dot`）

学员在 `RangeQuizPage` 提交答案 → `useQuizEngine` 判定 → `calculateGrade(evLoss)` 定级 → `renderMentorFeedback` 按导师风格出文案 → 共享反馈卡片渲染（wrong/blunder 级别带"去复习"链接）；同一时刻，模块把结果送进中枢：

| 中枢动作 | 语义 | 调用点 |
|---|---|---|
| `updateElo()` | 按变体 + 维度更新 ELO 分 | `useQuizEngine.ts:105-106` |
| `recordAnswer()` | 更新连续答错计数（情绪/负荷信号） | `:109` |
| `shouldDownshiftDifficulty()` | 自适应降难度**唯一入口** | `:111`（读 `emotion.consecutiveWrongCount` :112） |
| `addReviewItem()` / `updateReviewItem()` | 错题进入 / 更新 SRS 队列 | `:210-212` |
| `recordTrainingDay()` | 记训练日（同日幂等，不重复计数） | `RangeQuizPage.tsx:31` |
| `trainingEvents.emit()` | 会话完成 → 中枢订阅写 `TrainingRecord` | `RangeQuizPage.tsx:47` |

**两个模块不对称，是实测出来的，不是设计缺陷推测**：theory-academy 写 ELO 与 Emotion 但**不写 SRS**；strategy-academy **不直接调 `updateElo`**，而是经 `store.bootstrap.ts:51` 的 `syncEloFromAcademyAbility()` 从学院能力分同步。

持久化分两路：五大系统与设置进 `localStorage`（persist v15，`partialize` 显式排除 `records`，`store.ts:987`）；训练记录走 `addRecord()` → `IndexedDB poker-training-records`，并 `cleanup(1000)` 只保留最近 1000 条（`store.ts:471-472`）。

**hand-history 是唯一走另一条路的模块**（路径 B）：导入文本 → `parsers/` 嗅探格式并归一化 → 写 `IndexedDB hand-history-db` → 回放 → `utils/gtoDeviation.ts:133` 起 `gtoWorker` 离线批量算每手牌 `gtoAction / evLoss / grade`。它**不 import progress、不 emit**，`store.ts:7-10` 把理由写明了：它是复盘分析工具，不是交互式答题，因此不产出 `TrainingRecord`。

---

## 6. 数据与状态：生命周期与所有权

**生命周期状态（有代码证据的转移）**

- **训练会话**：`startQuiz` → `answerQuestion`* → `nextQuestion` → `endQuiz` / `resetQuiz`（range-trainer `store.ts:52` 起）。pot-odds / gto-simulator 的 store 只保存输入态与会话态。
- **SRS 复习项**：`addReviewItem` → `updateReviewItem`（按 `shared/utils/spacedRepetition.ts` 重排下次时间）→ `dismissedRecommendations` + `lastDismissalDate` 表示"学员忽略"。
- **Streak**：`recordTrainingDay`（幂等）→ `checkMilestone` / `pendingMilestone` → 断签后 `streakBrokenAt` + `EARN_BACK_WINDOW_MS` 补救窗口（`utils/streakCalc.ts:114,145`）→ `useStreakFreeze` / `freezeCardFragments` 碎片兑换。`quickDrillStreak` 连续 7 天触发 `awardStreakFreeze(1)`。
- **课程进度**：Level 锁定态由 store 门禁函数控制，`debugMode.unlockAll` 短路 9 处门禁；认证走 `LevelCertification`。
- **持久化 schema**：表驱动 `MIGRATIONS`（`store.ts:122-290`）覆盖 **v0 → v15 共 15 段**，含 v13/v14 删除旧 `elo` 键、v10 引入 `eloByVariant`、v15 加 `focusModule`；`onRehydrate` 兜底清洗标签后缀（:995）。

**存储所有权（一处需要留意的共享）**

| 存储 | key / 库名 | owner | 备注 |
|---|---|---|---|
| localStorage | `poker-training-progress` v15 | progress | 五大系统 + 设置 + 成就 |
| localStorage | `strategy-academy-progress` v5 / `theory-academy-progress` v3 / `puzzle-trainer-store` v3 | 各模块 | range/pot-odds/gto 的 store **无持久化** |
| localStorage | `poker-debug-mode` v1 | shared/stores | 独立 store，不并入 progress |
| IndexedDB | `poker-training-records` v1 | progress | 训练记录，保留 1000 条 |
| IndexedDB | `hand-history-db` v1 | **hand-history 与 progress 共享** | `progress/utils/handHistoryBackup.ts:11` 也打开同名库做备份/恢复 —— 这条跨模块数据耦合在 import 图上完全看不见 |
| IndexedDB | `poker-training` v1 | progress | `[低置信]` 仅 `utils/indexedDB.ts` 定义并经 `progress/index.ts:5` 导出，未见内部消费方 |

---

## 7. 分模块细节

| 模块 | 文件数 | 关键内容 | store | 出边 | 主要路由 |
|---|---:|---|---|---|---|
| progress | 62 | Dashboard / 统计 / 五大系统 / 26 成就 / 每日计划 / 门禁组件 | persist v15 | 无（枢纽，被依赖） | `/` `/progress*` `/settings` `/leaderboard` |
| strategy-academy | 128 | 75 课 / 9 Level 节点 / 6 轨道 / 17 本土课 / 15 概念节点 / QuickDrill / 认证 | persist v5 | progress | `/academy*` |
| theory-academy | 61 | T1–T9 / 32 章 160 题（standard）/ 理论→实践推荐 | persist v3 | progress | `/theory*` |
| puzzle-trainer | 35 | 205 题 / 10 主题 / rush-daily-theme / 日期种子 | persist v3 | progress | `/puzzle*` |
| gto-simulator | 32 | 11 spot 翻前频率库（4015 行 JSON）/ 策略矩阵 / Spot 训练 | 无持久化 | progress | `/gto-simulator*` |
| hand-history | 31 | 3 parser + 回放 + 统计 + 偏差面板 + Web Worker | 无 persist，自管 IndexedDB | 无（豁免） | `/hand-history*` |
| range-trainer | 30 | 17 预设 / 13×13 网格 / 位置解锁阈值 | 无持久化 | progress | `/range-trainer*` |
| pot-odds | 18 | 计算器 + 19 题测验 / 8 听牌 | 无持久化 | progress | `/pot-odds*` |
| onboarding | 16 | 5 步引导 / 定位测试 5 题 4 维 | 无持久化 | progress | `/onboarding` |
| help-center | 12 | 9 文章 / 6 快速上手 / 6 概念卡 / 8 FAQ（只存 i18n key） | **无 store.ts** | 无 | `/help*` |

共享层实际内容：`types/` 15 项、`utils/` 20 个纯函数（含 `seededShuffle` 选项排序治理、`persistShape`）、`components/` 6 个子目录（`gate/SessionLimitGuard` 被 6 个模块复用）、`stores/` 4 个（总线 + debugMode + 2 registry）、`hooks/` 4、`constants/` 4、`data/opponentProfiles.ts`。

i18n：`src/i18n/moduleRegistry.ts` 为契约源，`ALL_MODULES` 31 个 key，zh / en 各 32 个文件（含 `academy-course/` 课程包），双语键对称由 `localeParity.test.ts` 守卫。

---

## 8. 交付、验证与代理指令覆盖

**交付**：GitHub Actions（`.github/workflows/deploy.yml`）在 `main` 推送后串行跑 `typecheck → lint → test → build → size:check`，再 `upload-pages-artifact` → `deploy-pages`。运行时离线由 `public/sw.js` 承担（缓存键带 `APP_VERSION`，激活时清旧缓存）。

**验证资产**：110 个测试文件 —— 88 个 `.test.ts`（Node 环境，纯函数与 store migrate）+ 22 个 `.test.tsx`（jsdom 组件冒烟）。值得注意的守卫型测试：`i18n/localeParity`、`i18n/staticKeyGuard`、`designTokenGuard`（全量扫描 src 的色彩合规）、`eslintCrossImports`（跨模块边快照）、`progress/store.persist-shape`（持久化形状）、`hand-history/workers/gtoWorkerThresholds`（worker 内嵌阈值与共享层 parity）。

**代理指令覆盖度**：`AGENTS.md` 不只写了构建命令，它确实写了业务与技术不变量 —— 五级反馈唯一入口、"记录完成"幂等、自适应难度唯一入口、选项排序治理、跨模块能力归属登记表、共享层准入门槛。`src/shared/AGENTS.md` 与 `src/features/progress/AGENTS.md` 就近增强了准入门槛与幂等约束，12 个子代理文件按模块划分职责边界。

**指令覆盖的缺口（作为待验证项，不作为缺陷结论）**：`docs/` 下是 PRD / TDD / CHANGELOG / AI_GUIDE / analysis，未见 ADR 类决策记录，因此"为什么选 ELO 而不是 Glicko""为什么 hand-history 豁免事件总线"这类取舍只能从代码注释反推（后者在 `hand-history/store.ts:7-10` 有说明，前者未见）。业务规则数值（ELO K 因子、SRS 算法参数、解锁阈值）被有意排除在文档外并指向代码单源 —— 这对 AI 代理是友好的，但意味着新读者无法只靠文档建立领域模型。

---

## 9. 模型不确定性（按验证优先级）

1. **`poker-training` IndexedDB 库是否仍在用**。证据：`progress/utils/indexedDB.ts` 定义 `records` / `hands` 两个 objectStore，且经 `progress/index.ts:5` 对外导出；未见模块内部 import。**验证**：确认是否为对外兼容 API 或遗留，若遗留则涉及旧用户数据可读性。
2. **未结束会话的答题是否留下记录**。`range-trainer` / `pot-odds` / `gto-simulator` 的 store 无持久化，若浏览器在 `endSession` 前刷新，模块侧态丢失；是否有中途 `addRecord` 未见证据。**验证**：刷新后查 `poker-training-records` 是否含半程记录。
3. **`TrainingRecord.module` 联合含 `hand-history` 但它不 emit**。契约与实现存在张力。**验证**：确认是历史保留（曾 emit）还是为未来复盘统计预留。
4. **文档与代码的当前差异**：`AGENTS.md` / 子代理文件描述"8 级课程体系"，而 standard 变体实际 9 个 `LevelInfo` 节点（L4 拆 4A/4B）；`src/main.tsx` 注释写"三大学院的 store.bootstrap"，实际 idle 加载的是 strategy-academy、puzzle-trainer、theory-academy 三个（其中 puzzle-trainer 不是"学院"）。以代码为准；文档同步属文档维护任务，不在本模型结论内。
5. **`partialize` 排除 `records` 后的启动期数据回灌顺序**：`store.bootstrap.ts:33` 先 `recordDatabase.getAll()` 再于 :68 回写，与首屏渲染的先后关系（`main.tsx:30` 阻塞渲染）需要运行时观测确认，静态代码只支持"bootstrap 完成后才渲染"。
6. **本模型反映的是工作树**（85 项未提交改动）。若需与 `HEAD` 对齐，在干净工作区重跑采集即可，图源为文本、可 diff。
