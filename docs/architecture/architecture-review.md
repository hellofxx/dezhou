# PokerLab 架构评审（证据化）

| 项 | 内容 |
|---|---|
| 评审目标 | 判断这套架构是否**足够健康**去支撑它的核心承诺：单人、长期、纯本地使用的训练平台，且不丢用户数据、可持续演进 |
| 关注的质量属性 | 数据持久性（reliability）> 可维护性 > 可测试性 > 性能 > 可观测性。安全/可用性不作为目标（无后端、无多用户） |
| 风险容忍度 | 假设偏低：**用户自己产生的学习进度不可再生**，任何静默丢失都按高风险处理；纯代码风格问题按低成本顺手项处理 |
| 产出路径 | `risk-quality-reviewer` + `graphviz`（风险图）；基线模型来自 `system-modeler` |
| 证据基线 | 工作树 @ `c966912`（85 项未提交改动），采集 2026-08-30；配套 `00-evidence.md`、`business-architecture.md` |
| 严重度标尺 | **P0** 会导致用户数据丢失或功能不可用；**P1** 契约/不变量与实现分叉，随时间放大；**P2** 维护成本与可见性 |

> 明确不在本评审范围内：运行时性能调优建议、UI 视觉问题、功能需求取舍。这些各有归属（`deployment-topology-analyzer` / `design-review` / PRD）。

---

## 结论先说

这套架构的**边界纪律是好的**：跨模块 import 边与 `eslint.config.js` 白名单逐条相等、无 peer 债务边、有快照测试守卫、依赖倒置注册表干净地解开了"中枢读学院数据"的反向依赖。这不是常见水平，值得保持。

真正的问题集中在**一处系统性模式**：项目在"有界性"和"失败可见性"两件事上，做了一半。

- `records` 曾经因为无上限增长导致每次 `set()` 全量 `JSON.stringify` 阻塞主线程 —— 团队已经踩过并修好了（P2-01 外迁 IndexedDB，注释写在 `progress/store.ts:985-987`）。
- 同一个仓库里 `reviewItems` 仍是无上限数组，仍留在 `localStorage`，而 persist 配置里**没有任何配额失败的兜底**。
- 同一类问题已经证明过一次会真实发生。

所以最重要的两条建议不是"新架构更好看"，而是**把已经付过学费的教训推广到剩下的暴露面**。

---

## P0 · 用户数据持久性

### R1 `reviewItems` 无上限增长 + persist 无配额兜底 → 长期使用后写入静默失败

**证据（high）**
- `progress/store.ts:535-539`：`addReviewItem` 对 `reviewItems` 做 `[...state.reviewItems, item]`，**无长度上限、无淘汰策略**。
- `progress/store.ts:971-990`：persist 选项只有 `name` / `version` / `migrate` / `partialize` / `onRehydrateStorage`，**没有 `storage` 覆写，也没有任何 `QuotaExceededError` 处理路径**（全仓 `grep QuotaExceeded` 为空）。
- 同一仓库里同类字段**都已设界**：`accuracyHistory` `slice(-7)`（:812-813）、`records` `cleanup(1000)`（:472）、puzzle `history ≤50`。说明"设界"是本仓库既有惯例，`reviewItems` 是遗漏而非选择。
- **已核实的失败机制**（读 `node_modules/zustand/esm/middleware.mjs`）：persist 的 `setItem()` 直调 `storage.setItem(...)`，**中间没有 try/catch**（:358-362），而 action 包装是 `set(...args); return setItem()`（:370-374）。`localStorage.setItem` 配额溢出是**同步抛错**，因此顺序是：内存态已经更新成功 → 写盘抛错 → 异常出现在事件处理器里（不经 React ErrorBoundary，只会进 console / window.onerror）。
- 触发概率随使用单调上升：SRS 队列按"每题错一次就可能新增一项"增长。`dismissedRecommendations` 只是隐藏推荐，未见删除条目 —— 此点未逐行确认，见 §待验证。

**影响**：用户看到的是**UI 照常响应、每次操作在 console 留一条未捕获错误、但进度实际不再落盘**。下次刷新，配额之后写入的全部进度、ELO、复习队列全部回退。这是本仓库唯一"不可再生数据"的丢失路径，且失败信号只存在于开发者工具里。

**建议（两阶段，先止血再收口）**
1. **加界**：给 `reviewItems` 一个明确上限与淘汰策略（建议按 `nextReviewDate` 保留最近 N 条 + 按 SRS 权重淘汰"已掌握"项），并在 `MIGRATIONS` 里加 **v16** 做一次性裁剪（老用户数据防御性合并，符合仓库既有迁移惯例）。
2. **让失败可见**：用 `createJSONStorage` 包一层，捕获写入异常，把"持久化失败"变成一个显式状态（store 里 `persistError` 标记 + `Toaster` 提示"进度无法保存，请立即导出备份"，并引导到已有的 `handHistoryBackup` / 导出入口）。

**验收标准**
- 新增测试：stub `localStorage.setItem` 抛 `QuotaExceededError` → 断言不崩、`persistError` 被置位、有用户可见提示（Node 环境下按仓库惯例 stub `window.localStorage`）。
- 新增测试：`reviewItems` 超过上限时仍保持上界且优先级高的条目未被误删。
- `pnpm verify` 通过；persist version 递增且有对应 migrate。

---

### R2 `hand-history-db` 被两个模块各自 open，且缺 `req.onblocked` → 跨标签页时牌局功能可能永久卡死

**证据（high）**
- 同一套 `DB_NAME='hand-history-db'` / `DB_VERSION=1` / `STORE_NAME='hands'` 常量与 `open` 逻辑**在两个模块各写了一份**：`hand-history/store.ts:13-48`、`progress/utils/handHistoryBackup.ts:11-46`。两处逻辑目前逐行等价。
- **更正（复核源码后发现）**：两处的 `getDB()` **已经**挂了 `db.onclose` 与 `db.onversionchange`（关闭连接 + 清空 `_db` / `_dbPromise`），且 `open` 失败时也会在 `.catch` 里清掉缓存的 Promise（`hand-history/store.ts:37-46`、`handHistoryBackup.ts:35-44`）。所以"同一标签页内的版本变更"处理是正确的，初稿把它写成"均无 onversionchange"是我说重了。
- **真正缺失的是 `IDBOpenDBRequest.onblocked`**：两处的 `indexedDB.open()` 只挂了 `onupgradeneeded` / `onsuccess` / `onerror`（`hand-history/store.ts:19-28`、`handHistoryBackup.ts:20-29`）。

**影响（这一步是规范推断，不是已观测事实；场景比初稿窄）**：PWA 场景下用户很可能开两个标签页。若 A 标签页持有 v1 连接，B 标签页请求 v2，`open()` 会进入 blocked 态等待 A 关闭；由于没有 `onblocked` 回调，Promise 既不 resolve 也不 reject。此时 `_dbPromise` 已被赋值，而 `.then` 与 `.catch` 都不会触发 —— 缓存的 pending Promise **永挂**，B 标签页的牌局列表与备份功能变成无限加载，且没有任何错误可查。今天两处 `DB_VERSION` 都是 1，不触发；一次正常的加字段操作就会暴露它。

**建议**
1. **单一 owner**（治本）：库定义与 `open` 只留在 `hand-history`，`progress` 侧改为调用其公开 API（读全量 / 写全量），不再自己 `indexedDB.open`。这需要跨模块接口，按仓库规矩走 `shared/` 层或既有 registry 模式，由 `platform-dev` 协调。
2. **补 `onblocked`**（止血，已实施）：两处 `open()` 增加 `req.onblocked` → reject 一个可诊断错误，并清掉 `_dbPromise` 以便用户关闭其他标签页后重试。

**验收标准**
- 单测：stub `indexedDB.open` 返回一个只触发 `onblocked` 的假请求 → 断言 `getDB()` reject 而非永久 pending，且 `_dbPromise` 被清空（重试可再次发起 open）。
- 若采用建议 1：`grep -c "hand-history-db"` 从 2 处降为 1 处。

---

## P1 · 不变量有约定但无守卫

### R3 `≤300 行` 硬约束没有任何机器检查，实测已大面积越界

**证据（high）**
- `docs/AI_GUIDE.md:28` 写着"单文件 ≤ 300 行（硬约束）；超过 400 行需拆分"，并给出豁免类别：zustand store、格式解析器、页面级组件、课程内容数据。
- `eslint.config.js` 只启用 2 条规则（`no-restricted-imports`、`no-explicit-any`），**不含文件大小规则**；全仓 `grep "maxLines|lineCount"` 在测试与脚本中为空 → 无 fitness 守卫。
- 实测（排除 `.test.*` 与 `data/`）：**33 个文件 >300 行**；按 AI_GUIDE 的豁免类别再排除 `*/store.ts`、`*/parsers/*`、`constants`、页面级组件后，仍有 7 个非豁免文件越界：
  `gto-simulator/utils/strategyCompare.ts` 451、`strategy-academy/utils/contentKeys.ts` 376、`strategy-academy/types.ts` 364、`hand-history/utils/gtoDeviation.ts` 323、`progress/utils/dailyTrainingPlan.ts` 312、`progress/utils/streakCalc.ts` 306、`shared/utils/spacedRepetition.ts` 302。

**为什么值得修**：问题不是"文件太长"，而是**"硬约束"这个词已经不可信**。AI 代理与新人都会读 AGENTS/AI_GUIDE 并据此判断"我可以再加 50 行"。约束要么可执行，要么改口径。

**建议（择一，成本都很低）**
- **A（推荐）**：加一条 fitness 测试，只覆盖**非豁免类别**（`utils/`、`hooks/`、`shared/**`、`types.ts`），阈值 300 硬失败 + 一个"只降不升"的基线快照（类似 `eslintCrossImports.test.ts` 的快照守卫做法，避免一次性整改）。
- **B**：把 AI_GUIDE 的豁免类别从散文改成**可枚举的路径模式清单**，并显式声明"非清单内文件超 400 行需在 CHANGELOG 记录理由"。

**验收标准**：`pnpm test` 中有一条会在新增超长文件时变红的守卫；或文档口径与实际执行一致。二者都算通过 —— 不接受"口头硬约束"。

### R4 `TrainingRecord.module` 联合类型包含 `hand-history`，但该模块按设计不 emit

**证据（high）**：`shared/types/training.ts` 的 `module` 联合含 7 个值（含 `hand-history`）；`hand-history/store.ts:7-10` 明确注释该模块豁免事件总线；全仓 `grep trainingEvents` 未命中 hand-history 的 emit 调用（仅命中该注释文件）。

**影响**：任何基于 `TrainingRecord.module` 做统计、分模块筛选或图表的代码，都要处理一个"结构上可能、实际永不出现"的值。属于低危但会持续制造分支的契约噪声。

**建议**：二选一并留痕 —— (a) 从联合中移除 `'hand-history'`，同时在 PRD 记录"复盘不计入训练历史"；(b) 若确有规划（例如未来把复盘也计入训练时长），补一个真实的 emit 点与测试。

**验收标准**：联合成员与 `grep trainingEvents.emit` 的模块集合一致；`docs/PRD.md` 有对应一句口径。

### R5 训练模块 → 中枢五大系统的接线矩阵只存在于代码，无回归保护

**证据（high，事实部分）**：实测存在有意不对称 —— theory-academy 写 ELO + Emotion 但**不写 SRS**（`TheoryQuiz.tsx:36-37,72`、`TheoryChapterView.tsx:46`）；strategy-academy **不直接调 `updateElo`**，改经 `store.bootstrap.ts:51` 的 `syncEloFromAcademyAbility()`（`progress/store.ts:686`）。
**（推断部分，medium）**：这类"谁该写哪些子系统"目前没有任何测试或契约文档承载，新模块接入时容易只接一半（例如只 `recordAnswer` 不 `updateElo`），而现有 110 个测试里没有一条会因此变红。

**建议**：在 `progress` 侧加一份**接线矩阵测试**（模块名 → 期望调用的 API 集合），或在 shared 层提供统一提交入口 `submitTrainingResult(record, {elo, srs, emotion, streak})` 让漏接变成编译期缺失而非运行时静默。

**验收标准**：新增一个模块时，若漏接任一子系统，`pnpm test` 变红或类型报错。

> 注：对称性本身不是缺陷。要修的是"这个设计决策没有承载物"。

### R6 自适应难度只有"降"没有"升"

**证据（high）**：`shouldDownshiftDifficulty()`（`progress/store.ts:902`）是唯一入口，AGENTS.md 亦如此定义；全仓 `grep upshift|increaseDifficulty|raiseDifficulty` **为空**。

**影响**：用户持续表现变好时，难度不会回升，长期会训练不足 —— 这是**产品意图问题而非代码缺陷**，但当前 PRD/AGENTS 都没有写明"刻意只降不升"。

**建议**：确认产品意图。若刻意单向，在 `docs/PRD.md` 写一句理由（例如"避免挫败回流"）；若希望双向，则在同一个唯一入口上扩展 `shouldAdjustDifficulty()`，禁止各模块自行判定（守住既有约束）。

**验收标准**：PRD 有明确口径，或实现有双向路径 + 测试。

---

## P2 · 成本与可见性

| 编号 | 发现 | 证据 | 建议 | 验收 |
|---|---|---|---|---|
| R7 | 会话记录只在完成时 emit，中途刷新少一条历史（**不丢** ELO/SRS/Streak，它们逐题写入） | `RangeQuizPage.tsx:43-55`（`handleComplete` 内 emit）对照 `useQuizEngine.ts:105/109/210`（逐题） | 作为预期取舍写进 PRD 一句；若要修复则每题 `addRecord` 并标 `incomplete` | 文档口径明确，或历史条数与实际答题一致 |
| R8 | 体积门禁只覆盖首屏（`modulepreload` + entry），且超 500KB 仅记 `warnings` 不阻断；惰性大 chunk 无人看管 | `scripts/check-bundle-size.mjs:50-70,130-135`（`warnings` 不影响 `exit 0`） | 增加惰性 chunk 的**软预算表**并在 CI 打印全量 chunk 清单，逐步收紧；`academy-levels-*`、`theory-*` 是首选目标（但见 §待验证：当前 `dist/` 是 8 月 15 日的旧构建，数字不可作依据） | CI 输出 chunk 表；某条 chunk 超预算时给出可行动失败信息 |
| R9 | 调试旁路有两种接法（store/纯逻辑用 `isDebugUnlockActive()`，组件内用 `useDebugModeStore(s => s.unlockAll)`），分散在约 9 个门禁点 | `grep isDebugUnlockActive\|useDebugModeStore` 命中 12 个文件（含实现与测试） | 提供单一 `useGateBypass()` hook 并让 AGENTS.md 只描述一种接法 | 新增门禁点只有一种写法可选 |
| R10 | 失败路径全部静默（SW 注册 `.catch(() => {})`、总线订阅者 `console.error`、IndexedDB open 无上报），零后端下用户与开发者都无感 | `main.tsx:43-45`；`shared/stores/trainingEvents.ts:22-25` | 与 R1-2 合并实现一个本地"诊断"面板（Settings 内）：persist 写入失败、IndexedDB 状态、SW 版本。符合离线约束，不引入任何外部服务 | 面板能在人为制造的失败下显示条目 |
| R11 | 无 ADR，`why` 类决策散落在代码注释与 CHANGELOG（如 records 外迁、hand-history 豁免）；`docs/` 下只有 PRD/TDD/AI_GUIDE/CHANGELOG/analysis | 目录实测；`store.ts:985-987` 与 `hand-history/store.ts:7-10` 的注释是唯一出处 | 起步 3 篇 ADR：`0001 纯前端零后端与数据落在客户端`、`0002 训练记录外迁 IndexedDB`、`0003 hand-history 豁免事件总线` | `docs/adr/` 存在且被 AGENTS.md 引用 |

---

## 待验证（不要当成结论）

1. `dismissedRecommendations` 是否真的不删除 `reviewItems` 条目（影响 R1 的增长速率估计）。
2. 除 `reviewItems` 外，`settings` / `unlockedAchievements` / `freezeCardFragments` 等 persist 字段是否还有别的无界数组。
3. 当前 `dist/` 构建产物是 **2026-08-15**，而 HEAD 提交在 08-24、工作树更新 —— R8 里出现的 582KB / 480KB 数字**不可作为现状依据**，需重跑 `pnpm build` 后再测。
4. 本次评审**没有运行 `pnpm verify`**，也没有跑真实浏览器会话；所有结论来自静态证据。R1/R2 的失败模式是"代码路径 + 规范"推断，不是已观测到的线上故障。
5. 工作树有 85 项未提交改动，其中包括删除 `progress/store.earnBackStreak.test.ts`。我没确认它是被 `store.checkMilestone.test.ts` / `streakCalc.test.ts` 覆盖替代还是净减少 —— 在判定为回归前先核对补救窗口的覆盖归属。

---

## 一句话给决策者

不需要重构，边界纪律值得保留。真正要投入的是**三个小改动**：给 `reviewItems` 设界并让 persist 失败可见（R1）、给 `hand-history-db` 补 `onblocked`/`versionchange`（R2）、给已经不可信的 300 行约束补一条守卫或改口径（R3）。前两条守护的是本仓库唯一不可再生的东西 —— 用户自己的学习进度。
