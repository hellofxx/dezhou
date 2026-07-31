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

- [x] 逐一触发全部 emit 方并验证 progress 入账（最近训练记录/统计/streak）：
  theory store、strategy store（practice/basics）、CourseView、DailyPuzzle、PuzzleRush、ThemeDrill、PotOddsQuizPage、GTOSessionPage、RangeQuizPage
- [x] record `id` 唯一性：`Date.now()` 拼接在同毫秒连点场景是否碰撞（addRecord 有 id 去重，碰撞会静默丢记录）——全部 9 个 emit 方 id 生成与调用闸已逐一核对安全
- [x] strategy-academy 的 `recordPracticeScore` 在 `set()` updater 内 emit（store.ts L126）——StrictMode 下 updater 重放双发风险（含 `completeBasics` 同款问题）——**已修复（P0B-02，CHANGELOG 2026-07-31）**：emit 移出 updater，对齐 theory store 基准写法

### 2. 五级判分（src/shared/types/decisionFeedback.ts）

- [x] 阈值边界表逐点验证（边界归更严等级）：evLoss=0→best；0.4999→correct；**0.5→inaccuracy**（L49 用 `<`、L50 用 `<=`）；2→inaccuracy；2.01→wrong；5→wrong；5.01→blunder
- [x] `buildDecisionFeedback`：isCorrect=true + evLoss=0.3 → correct（非 best）；isCorrect=false 缺省 → wrong（evLoss=3）
- [x] 旧三级映射：optimal→best / acceptable→correct / error→wrong
- 各模块反馈 UI（QuizCard / GTOFeedback / PuzzleCard / TheoryQuiz）颜色图标一致，均走 GRADE_DISPLAY_CONFIG + `.grade-*` 类 —— TheoryQuiz 不接入五级判分 **→ 分流 P1-F（P0B-05 已定性设计豁免登记，见 TDD 5.9）**；其余三模块 UI 一致性已验证
- [x] wrong/blunder 必带"去复习"链接且 relatedLessonId 指向存在课程（对照 curriculumIntegrity）——全项目无悬空引用
- 导师人格化：三风格 × 五评级 15 套模板齐全（已验证）；非法/未知风格无防御回退 **已修复（P0B-06，CHANGELOG 2026-07-31）**；缺省降级 i18n **→ 移交 P2-D（P0B-07）**

### 3. 选项排序（PRD 5.26，shared/utils/seededShuffle.ts + 各模块出口）

- [x] 各题库正确答案位置分布 ≤60%（分布守卫测试已有，抽查新题）——**PracticeDrill 无排序出口缺口已修复（P0B-01，CHANGELOG 2026-07-31）**：新增 practiceOptionOrder 出口 + 全量分布守卫测试
- [x] 同一题跨会话、跨语言顺序稳定；每日谜题当天全用户一致；认证考试每次进入重新随机
- [x] 动作类选项恒为"消极→激进"；数值类单调
- [x] i18n-key 型题库在 `t()` 解析后重排且顺序不随语言变化

**高发问题类型**：边界比较符写反、t() 前洗牌导致中英顺序不一致、重排后正确答案索引未重映射

### P0-B 排查结论（2026-07-31）

**7 条 bug 简表**（修复详情见 CHANGELOG 2026-07-31 P0-B 条目）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P0B-01 | PracticeDrill（含 QuickDrill 消费路径）选项无排序出口，259 题正确答案 55.2% 集中 index 1 | 逻辑错误（治理红线，最重） | 已修复 + CHANGELOG 2026-07-31（新增排序出口 + 分布守卫测试） |
| P0B-02 | strategy store `recordPracticeScore` / `completeBasics` 在 `set()` updater 内 emit，updater 重放有双发风险 | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（对齐 theory 基准写法） |
| P0B-03 | CourseView 两处 `toISOString` 计算 nextReviewDate，UTC+8 凌晨 SRS 日期晚一天（P0-A BUG-09 同源遗漏点） | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（改用 progress `toLocalDateString`） |
| P0B-04 | PotOddsQuizPage 直接内插裸英文 grade 枚举（「评级：wrong」），未走 GRADE_DISPLAY_CONFIG + `.grade-*` 统一评级展示 | 显示问题 | → 分流 P1-B |
| P0B-05 | theory-academy 章末小测未接入五级判分（概念判断题、无 EV 语义） | 设计差异（非缺陷） | → 分流 P1-F；已定性为设计豁免并登记（TDD 5.9 + TheoryQuiz.tsx 头注） |
| P0B-06 | `renderMentorFeedback` 对非法/未知 mentorStyle 无防御回退，脏持久化数据会读 undefined 模板抛错 | 功能不可用（边界） | 已修复 + CHANGELOG 2026-07-31（回退 encouraging + 纯函数测试） |
| P0B-07 | 导师模板 15 套及“去复习”等反馈文案硬编码中文（mentorStyles.ts / PuzzleCard / PotOddsQuizPage），en 界面不翻译 | 显示问题 | → 移交 P2-D（i18n 走查） |

**P0-B 期间已确认、后续层无需重复排查的事项**：

- 事件总线基础设施可信（trainingEvents 实现 / progress 订阅入账 / addRecord 去重 / debounced 成就检查已验证），P1 只需关注 emit 参数语义
- 全部 9 个 emit 方 id 生成与调用闸已逐一核对安全，P1 无需重查 id 碰撞与重复 emit
- 五级判分纯函数层完全可信（calculateGrade 全边界 / buildDecisionFeedback / migrateGrade 已脚本验证），P1 只需关注传入 evLoss 语义
- puzzle 题库 evLoss 数据干净（615 选项 0 异常），P1-D 免重复扫描
- 四个排序出口 + seededShuffle 实现全部正确（correctIndex 重映射 / t() 后重排 / zh-en 一致 / 认证随机 / 每日一致），PracticeDrill 缺口已由 P0B-01 修复（现共五个出口，均带分布守卫）
- TrainingSession completedRef 防重入已确认；X 按钮 endQuiz() 部分会话入账语义问题移交 P1-A 定性
- relatedLessonId 全项目无悬空引用
- theory store"状态提交后再 emit"为全项目基准写法（strategy store 已由 P0B-02 对齐）
- 观察项延续：packageManager 版本 WARN 维持观察

---

## P1-A：范围训练（src/features/range-trainer/）

**步骤**：
- [x] 1. 6 位置 × 4 动作类型切换，13×13 网格渲染（对角线对子/上三角同花/下三角 offsuit）——抽查 AA/AKs/AKo/72o 四角
- [x] 2. 学习模式悬停格子显示手牌详情与范围内外状态（P1A-11 修复后 HU/短牌变体亦正确）
- [x] 3. 测验全流程：计时、五级反馈、末题简单题、答错补救（只一次）、结果页统计（P1A-02/03/12/14 修复后计时与判分口径一致）
- [x] 4. 位置解锁：preflopElo 临界值验证 HJ/CO/BTN/SB/BB 锁定态与悬停提示；调试解锁全开（P1A-05 修复后配置页与 RangeSelector 门禁一致）
- [x] 5. 结果保存 + streak 入账（P0-A recordTrainingDay 接线回归通过；P1A-04 修复后空会话不再入账）

**边界**：
- [x] 范围边缘手牌判定（handClassifier 纯函数测试覆盖）
- [x] 计时器切后台/返回行为（P1A-12 修复后 Date.now() 基准，节流不再累积误差）
- [x] 连错 3 次降级 banner（shouldDownshiftDifficulty 接线正常）
- [x] `/range-trainer/result/:sessionId` 直接刷新 → 确认为死路由（store 无 persist），删除属 src/app/routes.tsx → P1A-13 已修复 + CHANGELOG 2026-07-31（专批 A）

**重点文件**：utils/rangeParser.ts、handClassifier.ts、hooks/useQuizEngine.ts、useTimer.ts、components/RangeGrid.tsx、QuizCard.tsx、constants.ts（isPositionUnlocked）

**问题类型**：范围数据组合数错误（用 RangeInfo 面板手牌数/占比校验）、刷新丢会话态、计时器泄漏

### P1-A 排查结论（2026-07-31）

**14 条 bug 简表**（修复详情见 CHANGELOG 2026-07-31 P1-A 条目）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P1A-01 | 无题库组合（如 UTG+4bet、变体切换后失效组合）开始测验 → 0 题仍置 running，页面渲染 null 白屏卡死 | 功能不可用（最重） | 已修复 + CHANGELOG 2026-07-31（配置页按 presets 过滤 + startQuiz 布尔守卫双保险） |
| P1A-02 | 超时自动提交 `answerQuestion('fold')`，正确答案为 fold 时被判"答对"，正确率/权重/ELO/SRS 全部失真 | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（'timeout' 显式入口恒判错） |
| P1A-03 | 暂停→恢复后当前题倒计时永久冻结（handleResume 未重启 timer） | 功能不可用 | 已修复 + CHANGELOG 2026-07-31（恢复分支调用 startTimer） |
| P1A-04 | X 按钮 → endQuiz() 空/半程会话全量 buildResult+emit+recordTrainingDay 入账 | 逻辑错误（数据污染） | 模块内已修复 + CHANGELOG 2026-07-31（X 改走暂停遮罩确认+resetQuiz）；progress 拒收 totalQuestions:0 兜底 → 已修复 + CHANGELOG 2026-07-31（专批 B，addRecord 中枢拒收） |
| P1A-05 | 测验配置页位置列表未调 isPositionUnlocked，绕过位置渐进解锁门禁 | 逻辑错误（门禁绕过） | 已修复 + CHANGELOG 2026-07-31（复用 isPositionUnlocked + debugMode 旁路，锁定禁用+阈值提示） |
| P1A-06 | constants.ts 预置范围与 gto-simulator preflop-ranges.json 一致性存疑（JSON 3-bet 场景语义未定性，谁是权威源待裁决） | 数据一致性（待定性） | 已修复/已定性 + CHANGELOG 2026-07-31（专批 C）：open/call 类以 JSON ≥0.5 为源重生成 6 个 preset + src/rangePresetGtoConsistency.test.ts 守卫；发起 3-bet/4-bet 类（btn-3bet-vs-co / co-3bet-vs-hj / 4bet-range）与 JSON「面对 3-bet 响应」表是不同 spot，定性为模块自身权威源，**未臆造任何 JSON 频率数据** |
| P1A-07 | RangeInfo 占比用手牌数/169，未按组合数加权（对子6/同花4/offsuit12 除以 1326），短牌亦错 | 显示问题（数值错误） | 已修复 + CHANGELOG 2026-07-31（新增 rangeCombos 纯函数 + 短牌 630） |
| P1A-08 | preset 百分比标注（如 "~15%"）与实际组合占比不符 | 显示问题 | 已修复 + CHANGELOG 2026-07-31（专批 C）：全部 (~N%) 标注按组合数加权占比（P1A-07 口径）重算，3-bet/4-bet/HU 补正标注；守卫断言标注与实际占比偏差 ≤1pp |
| P1A-09 | resetQuiz 整体重置清空 handWeights，"再练一次"丢失间隔重复加权 | 逻辑错误（间隔重复失效） | 已修复 + CHANGELOG 2026-07-31（reset 保留 handWeights） |
| P1A-10 | generateQuestions 硬编码 6-max，忽略 store playerCount / 变体化 presets | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（presets 参数化 + 配置页选项随变体过滤） |
| P1A-11 | 学习页直接 PRESET_RANGES.find 绕过 store 变体化 presets（含 ADVANCED），且未传 variant 给 RangeGrid | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（改用 store presets + variant 透传） |
| P1A-12 | useTimer `setTimeout(...,0)` 无句柄清理泄漏；100ms tick 累加受后台节流，与 Date.now() 记时口径不一致 | 逻辑错误（资源泄漏+计时漂移） | 已修复 + CHANGELOG 2026-07-31（Date.now() 段式基准 + 句柄 ref 清理） |
| P1A-13 | `/range-trainer/result/:sessionId` 为死路由（store 无 persist，直接刷新必空白），删除涉及 src/app/routes.tsx | 死代码 | 已修复 + CHANGELOG 2026-07-31（专批 A：删路由 + SessionResultPage 占位页 + 仅其消费的 placeholder.tsx） |
| P1A-14 | resumeQuiz 把 questionStartTime 重置为恢复时刻，暂停前已耗时被丢弃，timePerQuestion 偏小 | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（pausedElapsed 累计续算） |

**跨模块专批挂起清单（供 platform-dev 认领）**：

1. **P1A-04 兜底**：progress store 对 `totalQuestions === 0` 的训练结果拒收防御（模块侧已阻断空会话入口，此为纵深防御，涉及 progress store 归 platform-dev）——已修复 + CHANGELOG 2026-07-31（专批 B，addRecord 拒收 totalQuestions <= 0，store.addRecord.test.ts 回归）
2. **P1A-06**：range-trainer `constants.ts` 预置范围 ↔ `gto-simulator/data/preflop-ranges.json` 一致性校验——已修复/已定性 + CHANGELOG 2026-07-31（专批 C：open/call 类以 JSON 为源重生成 + 跨模块守卫；发起 3-bet/4-bet 类定性为模块自身权威源，不臆造 JSON 数据）
3. **P1A-08**：preset 百分比标注修正——已修复 + CHANGELOG 2026-07-31（专批 C，按组合占比重算 + 守卫 ≤1pp）
4. **P1A-13**：删除 `/range-trainer/result/:sessionId` 死路由——已修复 + CHANGELOG 2026-07-31（专批 A）
5. **P1B-10**：`shared/utils/pokerMath.ts` 全函数边界防御——已修复 + CHANGELOG 2026-07-31（专批 A）
6. **calculateImpliedOdds 处置**：确认全仓零调用后删除——已修复 + CHANGELOG 2026-07-31（专批 A）
7. **pokerMath JSDoc 口径澄清**：`calculatePotOdds`/`calculateEV` 的 potSize/winAmount 口径已对齐 oddsMath.ts 头注写入 JSDoc——已修复 + CHANGELOG 2026-07-31（专批 A）

**P1-A 期间已确认、后续层无需重复排查的事项**：

- 13×13 网格纯函数层可信：handClassifier（11 例测试全绿）、RangeGrid 渲染分类（对角线对子/上三角同花/下三角 offsuit）、React.memo + selector 精细订阅均已验证
- `utils/rangeParser.ts` 的 `parseRange` 当前无调用方（预置范围直接以 HandNotation[] 存储），属潜在死代码，暂保留（含测试）待后续清理批定夺
- 末题简单（getEasyQuestion: AA@BTN raise）+ rescueUsed 单次补救机制逻辑正确，P1-A 修复后有 store 层回归测试锁定
- useQuizEngine 的 ELO（preflop）/SRS（quality 5/4/1 映射）/Emotion 三同步接线完整；'timeout' 语义修复后"答错"口径全链路一致
- gto-simulator preflop-ranges.json 的 3-bet 场景语义疑点已移交 P1-C 排查时定性（见挂起清单 P1A-06）
- 观察项延续：packageManager 版本 WARN 维持观察

---

## P1-B：底池赔率（src/features/pot-odds/）

**步骤**：
- [x] 1. 底池赔率：pot=100 bet=50 → 需胜率 25%；手工核对 3 组——**P1B-01 已修复 + CHANGELOG 2026-07-31**（3 组回归测试锁定）
- [x] 2. EV 计算器与手算一致（`eq×(pot+r) - (1-eq)×r`）——**P1B-03 已修复 + CHANGELOG 2026-07-31**（旧实现漏算对手下注）
- [x] 3. Outs 速查表 ≥8 种听牌（同花 9 / OESD 8 / Gutshot 4）——COMMON_DRAWS 8 种，数据正确
- [x] 4. `/pot-odds/quiz` 全流程：五级反馈、末题简单+补救、选项数值单调排序——**P1B-04/05 已修复 + CHANGELOG 2026-07-31**

**边界**：
- [x] 输入 0/负数/超大数/非数字/清空——不得出现 NaN、Infinity、除零；快速输入不卡顿——**P1B-06/07 已修复 + CHANGELOG 2026-07-31**（UI 层草稿态 + clamp；shared 纯函数层边界防御 P1B-10 挂起 platform-dev）

**重点文件**：hooks/useOddsCalculation.ts、utils/oddsMath.ts（P1-B 新增）、shared/utils/pokerMath.ts、utils/quizOrder.ts、components/EVCalculator.tsx、OddsCalculator.tsx（useEquityEstimate.ts 已作为死代码删除）

### P1-B 排查结论（2026-07-31）

**11 条 bug 简表**（修复详情见 CHANGELOG 2026-07-31 P1-B 条目）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P1B-01 | 计算器漏算我方跟注额，pot=100/bet=50 输出 33.3%（权威口径应 25%），与题库三项式矛盾 | 逻辑错误（核心口径，最重） | 已修复 + CHANGELOG 2026-07-31（hook 层对手下注并入底池，不碰 pokerMath） |
| P1B-02 | 隐含赔率方向反了：预期收益越大所需胜率越高，gain 够大时 >100% | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（收益并入底池，绕开 calculateImpliedOdds） |
| P1B-03 | EV 漏算对手下注（赢时只计 potSize），与 P1B-01 "错得自洽" | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（与 P1B-01 同批，面板不自相矛盾） |
| P1B-04 | 补救题 SRS id 含 Date.now() 时间戳，每轮补救新增同内容不同 id 的 ReviewItem 永不去重 | 逻辑错误（数据污染） | 已修复 + CHANGELOG 2026-07-31（固定 id 9998，与末题 9999 错开） |
| P1B-05（=P0B-04） | 评级显示裸英文枚举且仅答错时渲染、evLoss 恒兜底 → 永远只显示 wrong | 显示问题 | 已修复 + CHANGELOG 2026-07-31（GRADE_DISPLAY_CONFIG + t(titleKey) + .grade-*，答对也展示；evLossBB 数据标注为观察项） |
| P1B-06 | PotSizeInput 清空后 DOM 空白但计算用旧值，显示与计算脱节 | 显示问题（边界） | 已修复 + CHANGELOG 2026-07-31（本地字符串草稿态 + onBlur 回填） |
| P1B-07 | 快捷按钮绕过 min/max clamp，可产生 betSize=20000（>max）或 0（<min） | 逻辑错误（边界） | 已修复 + CHANGELOG 2026-07-31（统一 clamp，含滑块与高亮判定） |
| P1B-08 | 胜率=平衡点时显示"50% < 50.0% → 盈利"，符号与结论矛盾 | 显示问题 | 已修复 + CHANGELOG 2026-07-31（相等分支显示"="与"盈亏平衡"） |
| P1B-09 | EV 分析 tab 的 EquityChart 实际渲染 odds tab 数据，调本 tab 滑块图表不动 | 显示问题（信息架构错位） | 已修复 + CHANGELOG 2026-07-31（EquityChart 移入 odds tab，理由见 CHANGELOG） |
| P1B-10 | shared/pokerMath.ts 全函数无边界防御（负 outs 返负值 / shortDeck 溢出 -419% / NaN直通） | 逻辑错误（边界，跨模块） | 已修复 + CHANGELOG 2026-07-31（专批 A：入参 sanitize + 结果 clamp + 边界测试） |
| P1B-11 | useEquityEstimate 全仓无组件消费，仅 index.ts re-export，死代码 | 死代码 | 已修复 + CHANGELOG 2026-07-31（确认无引用后删除，TDD 5.x 表格同步） |

**结论沉淀（P1-B 期间确认、后续层免重复排查 / 观察项）**：

- **题库数学全对，错的是计算器口径**：data/quizQuestions.ts 19 题三项式口径（bet/(pot+bet+bet)）逐题核验无误，裁决为权威口径；计算器 hook 层已对齐（P1B-01），P1-D/P1-E 涉赔率题目可以题库口径为基准
- **isProfitable 与 EV 旧实现"错得自洽"**：两处同时漏算对手下注，结论方向碰巧一致——已同批修复（P1B-01+03）并用回归测试锁定符号一致性，面板不再自相矛盾
- **calculateImpliedOdds 唯一调用方已绕开**：P1B-02 后该 shared 函数为无调用方死代码，处置（修正语义或废弃）归 platform-dev 专批（挂起清单第 6 项）
- **pot-odds 全模块 i18n 硬编码范围比 P0B-07 登记更大**：除 PotOddsQuizPage 外，OddsCalculator/EVCalculator/PotOddsPage/EquityChart/DrawsReference 中文文案均未走 t()（含本批新增的"盈亏平衡"等），提示 P2-D i18n 走查扩大抽样范围
- **观察项（emit 语义）**：末题替换为简单题 + 补救题均计入 accuracy/totalQuestions 后 emit，训练统计略偏乐观（设计上属"以成功收尾"机制的副作用），维持现状观察，若 P2-C 统计层发现失真再议
- **观察项（evLossBB 数据增强）**：P1B-05 仅修展示层与展示条件，evLoss 仍为兜底值（答对=0→best，答错=3→wrong）；inaccuracy/blunder 等中间级需题库逐题标注 evLossBB 后才有区分度，归题库内容建设批次

---

## P1-C：GTO 模拟器（src/features/gto-simulator/）

**步骤**：
- [x] 1. 场景配置（位置/筹码深度/动作历史）→ 会话 → 每决策即时反馈（最优动作+EV 损失）
- [x] 2. Spot 练习可重复同一场景
- [x] 3. 结果页统计：正确率、EV 损失（BB/100）、逐场景分析
- [x] 4. relatedLessonId 推导：preflop→l4-gto-basics / flop→l3-cbet / turn/river→l3-multistreet
- [x] 5. 策略矩阵与 data/*.json 一致（抽查 2-3 手牌）
- [x] 6. **定性 useGTOWorker 死代码**：确认为无调用方死代码，删除挂起 platform-dev 专批执行

**边界**：不存在的 scenarioId、结果页直接刷新、EV 公式无硬编码 fold equity（strategyCompare.ts）、boardGenerator 不发重复牌、JSON 缺 key 的 fallback

**重点文件**：hooks/useScenarioEngine.ts、useGTOComparison.ts、utils/strategyCompare.ts、boardGenerator.ts、data/preflop-ranges.json、postflop-ranges.json

### P1-C 排查结论（2026-07-31）

**27 条 bug 简表**（24 项已修复 + CHANGELOG 2026-07-31；3 项挂起/移交）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P1C-01 | 公共牌与 Hero 手牌重复（boardGenerator 无 exclude） | 逻辑错误 | 已修复（牌堆抽取 + excludeCards 参数） |
| P1C-02 | All-In EV 剥削漏洞（强牌 evLoss 负值→恒 best） | 逻辑错误（核心判分） | 已修复（clamp≥0 + 超注惩罚） |
| P1C-03 | determineSpotKey 静默降级 open 表 | 逻辑错误 | 已修复（复用 resolveSpotKey，null 走显式 fallback） |
| P1C-04 | 翻后单步恒用 defaultStrategy | 功能不可用 | 已修复（接入 texture_strategy + classifyHandStrength） |
| P1C-05 | 多步 preflop 节点硬编码策略 | 逻辑错误 | 已修复（首节点 getPreflopHandStrategy 查表） |
| P1C-06 | 多步 ELO 每节点记录 | 逻辑错误（重复计数） | 已修复（移入 currentNodeIndex===0 块内） |
| P1C-07 | SRS ReviewItem id 含时间戳永不去重 | 数据污染 | 已修复（改稳定语义键 gto:spotKey:hand） |
| P1C-08 | 难度分类缺 A2s（168/169） | 逻辑错误 | 已修复（补入 ADVANCED + 169 守卫测试） |
| P1C-09 | relatedLessonId 用 scenario.street（应用 activeStreet） | 显示问题 | 已修复（改用 activeStreet） |
| P1C-10 | isOptimal 边界 与 GRADE_THRESHOLDS 分叉 | 逻辑错误 | 已修复（evLoss < GRADE_THRESHOLDS.correct） |
| P1C-11 | EV 损失单位混乱（BB vs BB/100） | 显示问题 | 已修复（统一 BB/100 口径，新增 evLossBB100 字段） |
| P1C-12 | ActionSelector 未传 callAmount 恒显 Check | 功能不可用 | 已修复（计算并传入真实 callAmount） |
| P1C-13 | GTOFeedback 显示负 EV 损失 | 显示问题 | 已修复（UI 层 Math.max(0, evLoss)） |
| P1C-14 | 结果页 StrategyMatrix 恒显示 pos_open 表 | 显示问题 | 已修复（按会话 spotKey，无数据渲染占位） |
| P1C-15 | SpotTrainer BB 位置空矩阵 | 显示问题 | 已修复（BB 从位置选项剔除） |
| P1C-16 | Exploit 对比 UI 死代码（未透传 props） | 显示问题 | 已修复（透传 exploitMode/exploitStrategy/selectedOpponent） |
| P1C-17 | DecisionTree 泄漏未来街道牌面 | 显示问题 | 已修复（未来节点渲染卡背 "?"） |
| P1C-18 | userDecisions 从 explanation 字符串解析 | 逻辑错误 | 已修复（取 GTODecision.userAction 结构化字段） |
| P1C-19 | timeTaken 为累计耗时 | 逻辑错误 | 已修复（decisionStartAt 每题重置） |
| P1C-20 | 多步 potSize 硬编码 6.5/13/22 | 逻辑错误 | 已修复（previousActions 累加真实底池） |
| P1C-21 | boardTexture turn/river stale | 逻辑错误 | 已修复（每街重算 classifyBoardTexture） |
| P1C-22 | store 死状态 selectedSpotKey/highlightedHand | 死代码 | 已修复（删除） |
| P1C-23 | postflop cbet_frequencies/weak_hand 死数据 | 功能不可用 | 已修复（接入 weak_hand + cbet sizing） |
| P1C-24 | avgTimePerDecision 除零 NaN | 边界崩溃 | 已修复（|| 1 防御） |
| P1C-25 | 3bet 场景无 opener 语境 | 逻辑错误 | 已修复（previousActions 含 hero open + 后位 3bet） |
| P1C-26 | randomCard 重试边界 | 边界 | 已修复（改为牌堆抽取，随 P1C-01） |
| — | useGTOWorker.ts 删除（src/workers/） | 死代码 | 已修复 + CHANGELOG 2026-07-31（专批 A，gtoWorker.ts 保留） |
| — | gtoWorker.ts 伪造 evLoss/旧四级评级 | 逻辑错误 | **移交 P2-B** |
| P1C-27 | i18n 硬编码 | 显示问题 | **移交 P2-D** |

**结论沉淀（P1-C 期间确认、后续层免重复排查）**：

- **EV 计算已统一标准化**：`eq×(pot+r) - (1-eq)×r`，无硬编码 foldEquity；超注惩罚模型确保 all-in 不会产生负损失
- **preflop-ranges.json 11 个 spot 为权威数据源**：未覆盖场景返回 null（不降级），3-bet 场景数据缺口已由专批 C 定性收口（P1A-06：不臆造补齐，fallback 为正确行为）
- **SRS id 迁移说明**：旧 id 含时间戳的 ReviewItem 不迁移（自然淡出，重复训练同一 spot+hand 时新键生效）
- **观察项**：3-bet 场景生成的 spot 大多返回 null（JSON 仅覆盖 btn_vs_co_3bet / co_vs_hj_3bet），用户体验为 fallback 策略——专批 C 定性：**不臆造求解器数据补齐**（臆造比缺口危害大），fallback 策略为正确行为；未来若补充频率表必须来自真实求解器产物

---

### 跨模块专批挂起清单

> 2026-07-31 专批 A（清理类，零 persist 变更）已处理 7 项：本表 #1/#3/#4/#10/#11 + P1-A 挂起列表 #4（P1A-13）/#7（JSDoc）；专批 B（progress 中枢口径）处理 #5/#7/#8/#9；专批 C（数据一致性）处理 #2（P1A-06/P1A-08）与 #6（P1D-11）。
> **✅ 2026-07-31 跨模块专批（A/B/C）全部完成，本挂起清单已全部清空（无剩余挂起项）。**详见 CHANGELOG 2026-07-31 三个专批条目。

| # | 描述 | 来源 | 负责方 | 状态 |
|---|---|---|---|---|
| 1 | 删除 useGTOWorker.ts（src/workers/ 死代码 hook）；gtoWorker.ts 保留（hand-history gtoDeviation.ts 消费中，其伪造 evLoss 问题另行移交 P2-B） | P1-C 步骤 6 | platform-dev | 已修复 + CHANGELOG 2026-07-31（专批 A） |
| 2 | P1A-06 发起 3-bet spot 新增 + range-trainer 对齐 + 守卫（含 P1A-08 标注） | P1-A / P1-C 观察项 | platform-dev + gto-simulator-dev + range-trainer-dev | 已修复/已定性 + CHANGELOG 2026-07-31（专批 C）：**不新增发起 3-bet spot**（严禁臆造求解器频率）；open/call 类 preset 以 JSON ≥0.5 为源重生成 + src/rangePresetGtoConsistency.test.ts 守卫（7 对映射，3 排除项显式登记）；发起 3-bet/4-bet 类定性为模块自身权威源（与 JSON「面对 3-bet 响应」表是不同 spot）；百分比标注按组合占比重算 |
| 3 | shared/pokerMath.ts 边界防御 | P1B-10 | platform-dev | 已修复 + CHANGELOG 2026-07-31（专批 A） |
| 4 | calculateImpliedOdds 死代码废弃/修正 | P1-B 结论 | platform-dev | 已修复 + CHANGELOG 2026-07-31（专批 A，确认零调用后删除） |
| 5 | P1D-06 SessionLimitGuard 口径统一：开局拦 vs 中途拦（puzzle 三模式中途翻转会在会话进行中拦断；P1-E QuickDrill 同款问题需一并处理） | P1-D 排查 | platform-dev | 已修复 + CHANGELOG 2026-07-31（专批 B，useSessionLimitReached 改开局判定：挂载时快照冻结，中途额度耗尽不拦断进行中会话；debug 旁路保留响应式；SessionLimitGuard.test.tsx 4 例回归） |
| 6 | P1D-11 题目 ID 加 `puzzle:` 前缀规范化（涉 SRS 存量 ReviewItem 键迁移，需评估迁移/淡出策略） | P1-D 排查 | platform-dev | 已定性 + CHANGELOG 2026-07-31（专批 C，路径 A 零迁移）：核查证实 puzzle-trainer **完全不注册 SRS**（全模块 0 处 addReviewItem/processReview），短 id 从不进入 SRS 键空间无碰撞可能；不改题库、不迁移；规范修订为「未来接入 SRS 时注册处拼 `puzzle:` 前缀」（agents/TDD 已同步）+ puzzleBank.ids.test.ts 守卫 id 全库唯一 |
| 7 | P1E-05 QuickDrill 复习题答完 SRS 不消化（需 progress 复习回写 API） | P1-E 排查 | platform-dev + P2-C | 已修复 + CHANGELOG 2026-07-31（专批 B，复用既有 processReview + updateReviewItem 建立回写闭环：PracticeResult 新增逐题明细 answers（不入 persist）+ quickDrillSrs 纯函数；P2-C 继续全面排查 SRS 其余方面） |
| 8 | P1E-07 训练日 streak 口径跨模块统一（strategy 课程/Drill/普通 QuickDrill 完成不计 streak，与 P1-F theory streak 口径归口） | P1-E 排查 | platform-dev | 已修复 + CHANGELOG 2026-07-31（专批 B，CourseView 测验/Drill 完成 + QuickDrill 普通模式补调幂等 recordTrainingDay） |
| 9 | P1F-01 SessionLimitGuard theory 小测中途拦（quiz 阶段中途翻转丢弃作答进度，并入 P1D-06 开局拦/中途拦口径家族专批扩围：puzzle 三模式 / QuickDrill / theory 小测） | P1-F 排查 | platform-dev | 已修复 + CHANGELOG 2026-07-31（专批 B，随 P1D-06 家族统一开局判定口径，hook 层单点修复覆盖全部调用点） |
| 10 | P1F-05 track-theory-bridge 轨道孤岛定性（theory practiceRecommendations 未引用该轨道，双模块数据协调：裁决补引用 or 修正注释） | P1-F 排查 | platform-dev + theory-academy-dev + strategy-academy-dev | 已修复 + CHANGELOG 2026-07-31（专批 A，裁决：维持数据现状，修正注释口径为通用入口轨道） |
| 11 | eslintCrossImports.test.ts 全量并发下偶发 5000ms 超时（单跑稳定通过；修 testTimeout 属测试配置，P1-F 门禁期间复现并单跑复核绿） | P1-F 门禁 | platform-dev | 已修复 + CHANGELOG 2026-07-31（专批 A，it 级 timeout 30000） |

## P1-D：扑克谜题（src/features/puzzle-trainer/）

**步骤**：
- [x] 1. Rush：`?duration=3|5` 生效；3 命答错扣 1；连对 5 题 +10s；难度递增 1→2→3；分数公式 `对题×100+剩余秒×10+剩余命×200` 手工核对——**P1D-01/02/03/04/08 已修复 + CHANGELOG 2026-07-31**（难度递增失效 / failed 计时间分 / 计时后台漂移 / 命耗尽误判 completed / 5 分钟无入口）
- [x] 2. Daily：改日期验证题目轮换、同日刷新题目与选项顺序不变、完成幂等（markDailyCompleted）、完成人数 100-999 稳定——**P1D-07 已修复 + CHANGELOG 2026-07-31**（跨日 retry 标记错日）；dateSeed 算法本体可信（见结论沉淀）
- [x] 3. Theme：10 主题 4 分类、题数与 PRD 一致（共 205：RFI30/BB防守25/3Bet20/CBet20/同花20/河牌价值20/诈唬15/短码20/ICM15/多人20）、难度标识——题库数据逐主题核验无误；分主题分布守卫已增强（**P1D-10 甄别：全库 100% 动作类选项，不算 bug**，见结论沉淀）
- [x] 4. Best Record 破纪录才更新、同分不更新、破纪录提示——store.submitResult 判定正确；但 **P1D-02**：旧实现 failed 会话计剩余时间分可刷 rushBest，已修复（failed 时间分归 0）
- [x] 5. 三模式完成计入 streak（P0-A 已确认 recordTrainingDay 存在，验证回归）——回归通过；会话接线已去重下沉 usePuzzleSession（emit/提交/recordAnswer 单源）

**边界**：
- [x] Rush 计时到 0 与命耗尽同时发生——**P1D-04 已修复**（归零分支区分 lives===0 → failed；next() 命耗尽判定前置）
- [x] 中途退出——无残留计时器（interval 随 unmount 清理）；SessionLimitGuard 中途拦口径问题登记 **P1D-06 挂起专批**
- [x] Daily 跨日进行中会话——**P1D-07 已修复**（完成时实时计算 dateKey，retry 刷新 today）
- [x] `?duration=99` 非法参数——安全（非 '5' 一律回退 3 分钟）
- [x] 连对计数答错后重置——applyAnswer 逻辑正确（puzzleEngineCore.test.ts 回归锁定）

**重点文件**：store.ts（v2）、utils/dateSeed.ts、optionOrder.ts、hooks/usePuzzleEngine.ts（纯函数已拆 puzzleEngineCore.ts）、hooks/usePuzzleSession.ts（P1-D 新增）、三个模式组件

### P1-D 排查结论（2026-07-31）

**12 条 bug 简表**（10 项已修复 + CHANGELOG 2026-07-31；P1D-06/P1D-11 挂起专批）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P1D-01 | Rush 难度递增失效：`[...easy,...medium,...hard].slice(0,30)` 导致 30 题全难度 1 | 逻辑错误（最重） | 已修复（分段配比 10/10/10 + 不足补齐 + 非降序排序；rushQuestions.test.ts 回归） |
| P1D-02 | failed 会话计剩余时间分：快速送命比打满分高，且可刷 rushBest | 逻辑错误（激励反常） | 已修复（命耗尽时间分归 0，只计对题分+命分；puzzleEngineCore.test.ts 回归） |
| P1D-03 | 计时后台节流漂移：setInterval 每 tick 固定 -1000ms，切后台计时暂停可作弊 | 逻辑错误 | 已修复（Date.now() 段式基准，对齐 P1A-12 useTimer 口径；连对奖励入 bonusAwarded 并入基准） |
| P1D-04 | 状态语义边界：next() 先判“无下一题”后判命耗尽，末题命耗尽误判 completed | 逻辑错误 | 已修复（命耗尽判定前置；倒计时归零分支区分 lives===0 → failed） |
| P1D-05 | Rush totalQuestions 恒=30：emit 稀释全局正确率、题数虚增，结果页 “10/30” 与 accuracy 自相矛盾 | 逻辑错误（统计污染） | 已修复（rush 取 answers.length；buildResult/emit/结果页三处单源同口径；回归锁定） |
| P1D-06 | SessionLimitGuard 开局拦 vs 中途拦口径不一（P1-E QuickDrill 同款） | 交互口径 | 已修复 + CHANGELOG 2026-07-31（专批 B，开局判定口径，挂起清单第 5 项） |
| P1D-07 | Daily 跨日 retry 标记错日：dateKey mount 冻结，跨午夜 retry 抽今天题却 markDailyCompleted(昨天) | 逻辑错误 | 已修复（完成时实时计算 dateKey；retry 时 setToday 同步刷新） |
| P1D-08 | 5 分钟 Rush 无入口：卡片写 “3/5 min” 却硬编码跳 `?duration=3` | 功能缺失 | 已修复（Rush 卡片 3/5 min 双按钮入口，stopPropagation 防卡片点击冲突） |
| P1D-09 | themeBest 非响应式读取：render 中 getState() | 显示问题 | 已修复（改 usePuzzleStore selector 订阅） |
| P1D-10 | 主题分桶分布守卫盲区：现有守卫只测全库汇总，4 主题单主题超 60% | 守卫盲区 | 甄别后**不算 bug**：全库 615 选项 100% 动作类（语义固定排序自然结果，无法靠猜位作弊）；守卫测试已增强（动作类验语义排序+输出分布监控，文字类断言 ≤60%） |
| P1D-11 | 题目 ID 未加 `puzzle:` 前缀（模块约束要求 `puzzle:{theme}:{questionId}`） | 规范偏差 | 已定性 + CHANGELOG 2026-07-31（专批 C，路径 A 零迁移：puzzle 不注册 SRS，短 id 定性为模块内标识，规范修订为注册处拼前缀 + id 唯一性守卫） |
| P1D-12 | 死代码：end() 无调用方、空 effect `if(answered){}` | 死代码 | 已修复（删除；顺手修正 types.ts / PuzzleCard 头注“三级→五级”反馈注释） |

**结论沉淀（P1-D 期间确认、后续层免重复排查 / 观察项）**：

- **题库数据可信**：205 题 10 主题题数与 PRD 一致；选项全量可解析（parseOptionSortKey category ≠ 99）；难度分布 D1=67/D2=79/D3=59，满足 Rush 10/10/10 配比
- **dateSeed 可信**：getDateSeed(YYYYMMDD)/shuffleBySeed/pickBySeed 确定性验证通过（同日同题同选项序），底层已上移 shared/seededShuffle（19 例测试全绿）
- **Rush 统计污染根因**：totalQuestions 恒取题目总数（30）而非已答数，导致 trainingEvents 消费方（progress 统计/Dashboard）正确率被稀释——P2-C 统计层若发现历史数据异常，根因在此（存量已 emit 记录不回溯）
- **主题分桶守卫结论**：全库 100% 动作类选项，单主题正确答案位置集中（实测 preflop-rfi idx2=77% / short-stack idx2=75% / bluff idx2=67% / three-bet idx2=65%）是“消极→激进”语义排序 + 主题正确动作激进度分布的自然结果，不改题库、不强制单主题 ≤60%；未来新增文字陈述类选项题目时守卫自动断言 ≤60%
- **SessionLimitGuard 共性**：“未完局时拦截继续答题”会在会话中途翻转时丢弃进行中会话（无结算），P1-E QuickDrill 同款口径——统一改“开局拦、中途不拦（或中途先结算再拦）”归 platform-dev 专批（P1D-06）
- **行数治理副产出**：会话接线去重下沉 usePuzzleSession / trainingRecord.ts，三模式 emit 口径单源；存量超行文件均已拆分 ≤200 行（仅 data/puzzleBank.ts 3631 行为静态题库数据文件，本批未改动，拆分归题库内容批次）
- **观察项延续**：packageManager 版本 WARN 维持观察；puzzle 模块 i18n 硬编码（“去复习相关课程”、P1D-08 新增入口沿用 “3 min/5 min” 语言中立文案）待 P2-D 收口

---

## P1-E：策略学院（src/features/strategy-academy/）

**步骤**：
- [x] 1. 主页 9 Level 节点（L4 拆 4A/4B）与进度环——**P1E-08 已修复**（l4a/l4b 进度环口径改用条目自身）
- [x] 2. 三段式课时（讲解→演示→测验）；Drill 课时跳过测验直接出成绩
- [x] 3. 解锁矩阵：顺序解锁 + L7 需 L3+L5 + L8 需 L4B——分别构造“只完成 L3”/“只完成 L5”验证 L7 仍锁
- [x] 4. 双层门禁防 URL 绕过：`/academy/lesson/<locked-id>` 被拦；情绪管理课例外直达；调试解锁旁路
- [x] 5. 4 个基础 Drill + L2-L8 共 16 个 ChoiceDrill 全部可进入并回传结果
- [x] 6. QuickDrill：快速 5 题/普通 8 题；SRS 复习题前置混入——**P1E-04/06/10/11 已修复**（复习题回填 / adaptive 重排禁用 / 文案插值 / 零值边界）
- [x] 7. 本土路径：L1-L3 前置锁定+提示+跳转链接——**P1E-02/03/12 已修复**（口径统一 / 按钮禁用 / ConceptGraph 本土节点）
- [x] 8. 学习路径横向推荐：完成轨道后关联路径卡片可跳转——**P1E-01 已修复**（navigate 改跳 /academy/tracks?track=）
- [x] 9. 认证考试选项每次进入重新随机——**P1E-09 已修复**（handleRetry 重置 sessionSeed）
- [x] 10. 知识图谱三态与点击跳转——**P1E-12 已修复**（本土课改 LOCAL_TRACK 前置口径）

**边界**：
- [x] quickDrillStreak 7/14 天奖励与断签重置——UI 层文案已插值（P1E-10）
- [x] `/academy/lesson/不存在`、`/academy/certification/99`——安全（显示“级别未找到” + 返回）
- [x] 超时代选 Fold 对时的判分口径——**P1E-13 已修复**（超时恒判错，对齐 P1A-02）

**注意**：P0-A 修复新增了 `isLevelLessonsCompleted/areAllLevelsCertified/isTrackCompleted`，成就触发场景需回归验证

**重点文件**：store.ts、CourseView.tsx、LearningTracksView.tsx、QuickDrill.tsx、LevelCertification.tsx、PracticeDrill.tsx、ConceptGraph.tsx、LevelCard.tsx、data/learningTracks.ts、data/localTrack.ts

---

## P1-F：理论学院（src/features/theory-academy/）

**步骤**：
- [x] 1. 主页三段分级 9 Level 卡片、进度环、锁定态
- [x] 2. 顺序解锁：Tn 需 T(n-1) 全部章节；URL 直达被拦（TheoryChapterView）；调试解锁旁路
- [x] 3. 章节流程：阅读→章末小测（3-5 题）→完成；选项排序合规——小测中途 SessionLimitGuard 拦断口径登记 **P1F-01 挂起专批**（并入 P1D-06 家族扩围）
- [x] 4. 幂等与最高分：重考不重复计数、得分取历史最高（store L55 Math.max）
- [x] 5. 章节回访：Level 卡片展开列表直达已完成章节，阅读页免重考导航（返回目录/下一章）——“下一章”指向未解锁 Level 静默弹回 **已修复（P1F-02，CHANGELOG 2026-07-31）**
- [x] 6. ELO 维度：各章声明维度正确更新——重点"牌局阅读/心态一致性"（仅理论学院触达）——31 章 eloDimension 声明与 updateElo 调用链路一致（handReading 6 章 / mental 4 章）
- [x] 7. Level 完成后"去实践"推荐卡链接有效——跨模块跳转丢失 ?track= 参数 **已修复（P1F-04，CHANGELOG 2026-07-31）**；track-theory-bridge 孤岛定性 **P1F-05 挂起专批**
- [x] 8. 4 项理论成就逐一触发——条件核查通过（theoryChapters/theoryLevel 两类 condition 经 getTheoryStore() 读 completedChapters，与数据一致），P2-D 只需实测触发

**边界**：
- [x] 最高分不被低分覆盖（store L55 Math.max，重考低分不回退）
- [x] StrictMode 下事件不双发（store L59 状态提交后 emit 防御有效；空题库防御 effect 无守卫双发 **已修复（P1F-03，CHANGELOG 2026-07-31）**；progress 侧 totalQuestions=0 拒收兜底 → 并入 P1A-04 专批）
- [x] Level 末章"下一章"导航行为——跨 Level 顺延未解锁场景即 P1F-02（已修复，降级提示文案）

**重点文件**：store.ts（v1，isTheoryLevelUnlocked）、TheoryChapterView.tsx、TheoryQuiz.tsx、utils/theoryProgress.ts、quizOrder.ts、data/levels/

### P1-F 排查结论（2026-07-31）

**5 条 bug 简表**（修复详情见 CHANGELOG 2026-07-31 P1-F 条目）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P1F-01 | SessionLimitGuard 在小测进行中达上限即拦断（quiz 阶段中途翻转丢弃作答进度），与 P1D-06 开局拦/中途拦口径家族同款 | 交互口径 | 已修复 + CHANGELOG 2026-07-31（专批 B，随 P1D-06 家族统一开局判定口径） |
| P1F-02 | "下一章"跨 Level 顺延指向未解锁 Level，点击被章节页门禁 Navigate 静默弹回 /theory | 逻辑错误（最重） | 已修复 + CHANGELOG 2026-07-31（渲染前解锁校验，未解锁降级提示文案；NextChapterNav 拆分 + 纯函数单源） |
| P1F-03 | 空题库防御 effect 无一次性守卫，StrictMode 双跑 → completeChapter 双调、训练事件双 emit | 逻辑错误（边界） | 已修复 + CHANGELOG 2026-07-31（completedRef 一次性守卫）；progress 侧 totalQuestions=0 拒收兜底 → 已修复 + CHANGELOG 2026-07-31（专批 B，随 P1A-04 兜底） |
| P1F-04 | 桥接跳转丢失 track 参数：navigate('/academy/tracks') 不带 ?track=，P1E-01 建好的 LearningTracksView 消费方收不到 | 功能缺失 | 已修复 + CHANGELOG 2026-07-31（PracticeBridgeCard / TheoryLevelCard 两处补 ?track=） |
| P1F-05 | track-theory-bridge 轨道孤岛定性：theory practiceRecommendations 与该轨道对应关系断裂（补引用 or 修正注释待裁决） | 数据一致性（待定性） | 已修复 + CHANGELOG 2026-07-31（专批 A，裁决：维持数据现状，修正注释口径） |

**回归结论**：

- 最高分不被低分覆盖：store.completeChapter 的 `Math.max(历史, 本次)` 验证通过，重考低分 quizScores 不回退，completedChapters 不重复计数（幂等）
- StrictMode 不双发：store 侧"状态提交后再 emit"基准写法有效；空题库防御 effect 经 P1F-03 completedRef 守卫后单发（TheoryQuiz.test.tsx StrictMode 双跑回归锁定 onComplete 仅 1 次）
- ELO 维度一致：31 章 eloDimension 声明（math 8 / preflop 6 / postflop 7 / handReading 6 / mental 4）与 TheoryQuiz 每题 `updateElo(chapter.eloDimension, …)` + `recordAnswer` 调用链路一致，handReading/mental 两维仅理论学院触达的定位成立

**回归测试新增**：`utils/theoryProgress.test.ts`（8 例：P1F-02 跨 Level 顺延/解锁判定/未解锁复现路径/顺序学习流不变式）+ `components/TheoryQuiz.test.tsx`（2 例：P1F-03 StrictMode 空题库单发/非空题库不自动完成）

**结论沉淀（P1-F 期间确认、后续层免重复排查 / 观察项）**：

- **theory 不注册 SRS**：章末小测答题不生成 ReviewItem（设计现状，复习靠章节回访/重考），P2-C SRS 排查时 theory 不在注册方清单内，免查
- **averageTime=0 统计消费提示**：theory emit 的 TrainingResult `averageTime` 恒为 0，若 P2-C 统计层有平均用时聚合会被拉低——P2-C 排查时需甄别消费方是否应剔除 averageTime=0 记录
- **理论成就条件已核查**：progress 成就系统经动态 import `getTheoryStore()` 读 completedChapters，theoryChapters/theoryLevel 两类 condition 与数据结构一致，P2-D 只需实测触发不需重新核查条件逻辑
- **theory chrome i18n 归 P2-D**：正文内联中文为设计口径；界面 chrome（含 P1F-02 新增"完成本级剩余章节后解锁"提示，沿用现状内联中文未扩大 i18n 硬编码面的新 key）的 i18n 收口归 P2-D 走查

---

## P2-A：新手引导（src/features/onboarding/）

**步骤**：
- [x] 1. 清空 localStorage → 任意主导航路由重定向 /onboarding（OnboardingGate）；全屏无主导航——BlankLayout 5 条全屏训练路由未被门禁覆盖 → **P2A-01 挂起专批 D**
- [x] 2. 三路径：新手（定位测试 5 题 4 维度含解析）/ 有基础（跳过定位）/ 跳过引导——均正常（skipOnboarding 直标 completed）
- [x] 3. 能力评估映射 30-70、GTO 默认 50、写入 progress——专项验证通过（见下方三专项结论）
- [x] 4. 微训练末题简单、答错补救（只一次）——**P2A-03/04/05 已修复 + CHANGELOG 2026-07-31**（drillFlow 纯状态机统一治本）
- [x] 5. 首胜庆祝 + Day 1 streak 启动（P0-A BUG-02 正向功能回归通过）——**P2A-02 已修复 + CHANGELOG 2026-07-31**（recordTrainingDay 移至 FirstDrillStep 完成动作，跨日卡庆祝页重挂载不再白嫖）
- [x] 6. 目标设定三档记录；完成后刷新不再重定向；调试解锁**不**旁路 onboarding——专项验证通过

**边界**：
- [x] 引导中途刷新（persist 恢复当前步骤，正常）
- [x] 引导期间 URL 直达其他路由——主导航路由被拦；BlankLayout 全屏路由可绕过 → **P2A-01 挂起专批 D**

### P2-A 排查结论（2026-07-31）

**5 条 bug 简表**（4 项已修复 + CHANGELOG 2026-07-31；P2A-01 → 挂起专批 D）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P2A-01 | OnboardingGate 未覆盖 BlankLayout 路由：清空 localStorage 可直达 /range-trainer/quiz 等 5 条全屏训练路由绕过引导 | 逻辑错误（门禁绕过，最重） | 挂起专批 D（根因在 src/app/routes.tsx + BlankLayout（平台层）+ OnboardingGate 本体（progress），归 platform-dev） |
| P2A-02 | CelebrationStep 挂载 effect 即记训练日，跨日卡庆祝页重挂载重复记（recordTrainingDay 幂等仅防同日） | 逻辑错误（streak 白嫖） | 已修复 + CHANGELOG 2026-07-31（调用移至 FirstDrillStep 完成动作，庆祝页只展示；不加持久字段/不升 version） |
| P2A-03 | rescueHint 永不显示：append 补救题与 setFeedback 同批 flush 后 isLast 立即变 false，提示条件恒 false（死文案） | 显示问题 | 已修复 + CHANGELOG 2026-07-31（改按原题库末题判定） |
| P2A-04 | 补救题再答错再 append 第 6 题，题号「第 5 题/共 6 题」与完成按钮矛盾（行为上补救仍一次，状态污染+显示矛盾） | 逻辑错误 | 已修复 + CHANGELOG 2026-07-31（rescueUsed + 原题库末题双守卫，补救仅追加一次） |
| P2A-05 | handleNext `isLast && !lastAnswerCorrect` 分支不可达（末题答错后 isLast 已变 false） | 死代码 | 已修复 + CHANGELOG 2026-07-31（随 P2A-03/04 统一重构为 drillFlow 纯状态机，显式 rescueUsed 替代推断式判定） |

**三专项结论**：

- **P0-A BUG-02 回归**：首胜仍真正启动 Day 1 Streak——P2A-02 修复后 recordTrainingDay 在 FirstDrillStep 微训练完成动作里调用（completeOnboardingStep(3) 之前），正向功能保留；组件回归测试锁定「完成记一次 + 庆祝页重挂载 0 次」
- **调试解锁不旁路 onboarding**：debugMode 仅旁路位置/课程等 7 处训练门禁，OnboardingGate 不读 debugMode，未完成引导时仍重定向（验证通过）
- **能力评估 30-70 边界**：定位测试正确率 → initialAbility 映射锁定在 [30, 70] 区间（0 分 → 30，满分 → 70，GTO 维默认 50），写入 progress.onboarding.initialAbility（验证通过）

**结论沉淀（P2-A 期间确认、后续层免重复排查 / 观察项）**：

- **onboarding 不写 ELO、不 emit 训练事件、不注册 SRS**：首次微训练与定位测试均不进入全局统计/ELO/SRS 链路（设计如此，避免引导样本污染正式数据），P2-C 排查 SRS/统计时 onboarding 不在注册方/emit 方清单内，免查
- **dailyGoalMinutes 零消费方**：GoalSettingStep 写入的 dailyGoalMinutes 全仓无读取方（今日任务/Dashboard 均未消费），待 P2-C 统计层排查时定性（接线 or 死字段）
- **onboarding 模块 i18n 硬编码**（如 QuizCard 复用链路上的中文提示文案属 range-trainer 本体）归 P2-D i18n 走查收口，本批未新增硬编码

### P2 跨模块专批挂起清单（专批 D，供 platform-dev 认领）

> 原《跨模块专批挂起清单》（专批 A/B/C）已于 2026-07-31 全部清空；本表为 P2 层新增挂起项。

| # | 描述 | 来源 | 负责方 | 状态 |
|---|---|---|---|---|
| 1 | **P2A-01** OnboardingGate 未覆盖 BlankLayout 路由：清空 localStorage 后可直达 /range-trainer/quiz 等 5 条全屏训练路由绕过引导（根因：src/app/routes.tsx 路由结构 + src/layouts/BlankLayout.tsx 未包 OnboardingGate + 门禁本体属 progress 模块） | P2-A 排查 | platform-dev | 挂起，待认领 |

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

### P1-E 排查结论（2026-07-31）

**13 条 bug 简表**（11 项已修复 + CHANGELOG 2026-07-31；P1E-05/P1E-07 → 挂起专批）：

| 编号 | 一句话描述 | 严重级 | 处置 |
|---|---|---|---|
| P1E-01 | track 跳转参数无消费方（navigate 到 `/academy?track=` 全仓无读取） | 功能缺失 | 已修复（改跳 /academy/tracks?track=；LearningTracksView 消费滚动高亮） |
| P1E-02 | 轨道前置判定认证口径与 CourseView 本土课门禁完成口径分叉 | 逻辑错误 | 已修复（统一为课程完成口径；learningTracks.test.ts 6 例回归） |
| P1E-03 | LearningTracksView 前置未满足时“选择此轨道”/“继续学习”不禁用 | 交互缺陷 | 已修复（disabled + 前置跳转链接） |
| P1E-04 | QuickDrill 复习题混入无 options 被丢弃导致总题数缩水（5→可能3） | 逻辑错误 | 已修复（composeQuickDrillQuestions 缺口回填；quickDrillMix.test.ts 6 例回归） |
| P1E-05 | QuickDrill 复习题答完 SRS 不消化（无 progress 复习回写 API） | 功能缺失 | 已修复 + CHANGELOG 2026-07-31（专批 B，回写闭环；P2-C 继续 SRS 全面排查） |
| P1E-06 | PracticeDrill adaptive 重排破坏复习题前置顺序 | 逻辑错误 | 已修复（QuickDrill 传 adaptive={false}） |
| P1E-07 | 训练日 streak 口径跨模块不统一（strategy 课程/Drill 不计 streak） | 口径问题 | 已修复 + CHANGELOG 2026-07-31（专批 B，与 theory 口径归口） |
| P1E-08 | LevelCard l4a/l4b 进度环口径错位（文案用条目自身、环用合并 level） | 显示问题 | 已修复（改用条目自身口径） |
| P1E-09 | 认证重试不重洗（sessionSeed 无 setter，handleRetry 不重置） | 逻辑错误 | 已修复（setSessionSeed + shuffleBySeed 种子化；certificationExam.test.ts 6 例回归） |
| P1E-10 | 冻结卡文案硬编码“7 天”（14/21 天触发仍显示 7 天） | 显示问题 | 已修复（{{count}} 插值 + zh/en 同步） |
| P1E-11 | QuickDrill 正确率零值边界（`|| 1.0` 把真实 0 当无数据） | 逻辑错误 | 已修复（totalQuestions>0 判别） |
| P1E-12 | ConceptGraph 本土课节点用 isLevelEntryUnlocked('l7') 与 CourseView 不一致 | 口径分叉 | 已修复（改按 LOCAL_TRACK.prerequisiteLevelIds 判定） |
| P1E-13 | PracticeDrill 超时代选 Fold 恰好正确时判对（加连击+答对音效） | 逻辑错误 | 已修复（超时恒判错，对齐 P1A-02；practiceGrading.test.ts 7 例回归） |

**P0-A 判定函数回归**：8/8 通过（curriculumIntegrity.test.ts 全绿，含 id 唯一性 / correctIndex 界内 / 牌面合法 / 引用无悬空 / Drill 接线 / native order 无重复 / LevelInfo.id 存在性 / prerequisiteLevelIds 解析可达）

**结论沉淀（P1-E 期间确认、后续层免重复排查）**：

- **解锁矩阵已验证**：`isLevelEntryUnlocked` 按 `LevelInfo.id` 精确判定，区分 l4a/l4b；Level 7 需 `prerequisiteLevelIds: ['l3','l5']` 全部完成；Level 8 需 l4b 全部完成；本土课按 LOCAL_TRACK.prerequisiteLevelIds ['l1','l2','l3'] 单独判定；情绪管理课无前置依赖直达；调试解锁放行
- **前置口径分叉家族已统一**：`isTrackPrerequisiteMet` / CourseView 本土课门禁 / ConceptGraph 本土课节点三处现均按「LEVELS 条目课程全完成」口径判定；不再依赖 certifications 认证口径
- **SRS 闭环缺口与 P2-C 互认**：QuickDrill 能从 SRS 取复习题混入（composeDailyMix 分配名额 + 回填补足），答完后回写闭环已建立（专批 B：复用 processReview + updateReviewItem，quickDrillSrs 纯函数 + 逐题明细 answers）——P2-C 继续全面排查 SRS 其余方面（复习会话/队列管理/其他消费方）
- **超时口径与 P1A-02 同款**：PracticeDrill 超时恒判错逻辑与 range-trainer 的 `handleTimeout` 一致（系统代选仅用于展示，判分走强制错误通道），不影响非超时场景的计分正确性

---

## 执行与产出约定

1. 顺序：P0-B → P1-A~F → P2-A~D；每层结束输出该层 bug 清单后暂停等确认
2. 排查完成后重跑四项门禁 + `pnpm build` 收尾
3. 修复批次独立于排查批次；修复后在本文件对应条目标注"已修复 + CHANGELOG 日期"并同步回归项
4. 本文件条目完成后打钩标记（`- [x]`），全部完成后本文件归档至 CHANGELOG 并删除
