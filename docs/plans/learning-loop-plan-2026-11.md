# 方向 A：学习闭环化实施计划（课程枢纽阶段卡 + 双地图瘦身）

状态：Current（一次性计划；执行完成后移入 `docs/history/` 并在其 README 登记）

> 决策来源：2026-11-23 课程区 IA 会诊结论（方向 A）。
> 角色基线以 [`COURSE_IA.md`](../COURSE_IA.md) 为准，视觉契约以 [`DESIGN.md`](../../DESIGN.md) 为准；本计划只改呈现层，不改角色与规则。
> 文中文件路径为撰写时事实；数量 / 阈值 / 版本一律以代码与守卫为准。

---

## 1. 目标与教育假设

| 假设 | 内容 | 对应改动 | 验证口径 |
|---|---|---|---|
| H1 理论进度可见 | 让理论完成度在阶段卡"算数"，提升理论阅读动机与完成率 | 双泳道进度环（WP2） | 行为断言 + 本地进度数据中理论完成占比 |
| H2 学习闭环显式化 | "概念 → 实战 → 自查"顺序与课时级概念配对，提升段内"先读后练"比例 | 步骤排序 + 配对副标题（WP1/WP3） | 行为断言 + 课时完成序列中前置章先读占比 |
| H3 地图回归浏览面 | 地图去仪表盘化，降低外在认知负载， mastery 单源归枢纽 | 双地图瘦身（WP4/WP5） | 行为断言（默认折叠 / 入口可达）+ 可用性走查 |

**度量边界**：纯前端零后端，无遥测。本批验收以组件 / e2e 行为断言与本地进度口径为准；H1–H3 的学习结果指标（完成率、先读后练比例的前后对比）需要未来遥测支持，登记为后续项（§11），不在本批承诺。

## 2. 非目标（硬边界）

- 不改返回语义 R1–R10、不改路由表、不改 persist schema / version / migrate。
- 不改解锁 / 认证 / ELO / SRS 判定：阶段 `complete` 与解锁仍由实战完成态驱动（`computeStageStates`），双环只是让理论可见。
- 不新增第二套"下一步"判定：`buildHubNextAction` 仍是枢纽唯一"下一步"权威；闭环步骤是呈现层叙事，不是决策引擎。
- 不新增 shared 组件、不新增依赖、不改 `ALLOWED_CROSS_IMPORTS`。
- 不做隐喻更名（地图 / 阶梯 / 轨道 / 阶段文案保持现状）；不动 `TheoryLearningPaths` 与 `LearningTracksView`。

## 3. 现状证据（撰写时）

| 面 | 文件 | 现状 | 问题 |
|---|---|---|---|
| 阶段卡 | `src/features/strategy-academy/components/hub/CourseStageCard.tsx` | 单 ProgressRing 只计实战课时；双泳道并列 chip，默认 2 个 + 展开；补充阅读 details 折叠 | 理论进度不可见；无闭环顺序；无自查步骤 |
| 枢纽装配 | `src/features/strategy-academy/components/CourseHub.tsx` | 变体 → 定位条 → 下一步卡 → 阶段路径 → 双掌握度 → 覆盖报告 → 目录 | 保持不动 |
| 实战地图 | `src/features/strategy-academy/components/AcademyHome.tsx` | 侧栏 = 掌握度卡 + 理论桥 + 评估区 + 8 工具格 | 仪表盘化；掌握度与枢纽重复 |
| 理论地图 | `src/features/theory-academy/components/TheoryHome.tsx` | 侧栏 = 先修卡 + 阅读统计 + 掌握度卡 + ELO 推荐 + 评估区 + 补强卡 + 实战桥 | 同上 |
| 枢纽掌握度 | `src/features/strategy-academy/components/hub/CourseMasteryDualCard.tsx` | 双维掌握，已含双泳道最弱项导航 | 地图掌握度移除后无功能损失 |
| 阶段数据 | `src/features/strategy-academy/utils/hubStages.ts` | 四段旅程分组（L1 / L2–3 / L4 / L5+），含 `doneChapters/totalChapters` | 双环所需数据已就绪，无需改投影 |
| 进度环 | `src/shared/components/data-display/ProgressRing.tsx` | 单环 + center 槽 + aria-label | 直接复用两个实例，不改 shared |
| 检索面 | `src/features/theory-academy/components/TheoryStudyTools.tsx` | 搜索 / 术语 / 书目 Dialog 宿主 | 已是"检索"面，保持常显 |

## 4. 设计决策（D1–D5，可评审改向）

- **D1 闭环三步**：阶段卡内 ① 概念（理论泳道）→ ② 实战（实战泳道）→ ③ 自查（评估区入口）。泳道标题加步骤编号；移动端纵向堆叠天然成序。
  - 步骤③链接 `/academy` 评估区锚点（`#assessment`），**不直链检查点页**。理由：工具页按 R2 返回所属地图，直链检查点会把"返回主线"的闭环打断；评估区是批次 3 的聚合入口（检查点 / 认证 / 定位），地图根按 R3 回主线，闭环闭合。
  - 步骤③仅标准变体显示（检查点 / 认证只对标准开放）；短牌 / 单挑呈两步闭环。
  - `AcademyHome` 增加 hash 锚点滚动效应（镜像 `CourseHub` 既有实现，尊重 `prefers-reduced-motion`）。
- **D2 双环并列**：阶段卡头部以两个并列迷你 ProgressRing（理论 / 实战）替换单环，各带泳道图标、完成数与独立 `aria-label`。不做同心双环（避免新增 shared 组件）。`theoryUnavailable`（短牌无锚点）时理论环以占位文案呈现，不伪造数据；`theoryKnown=false` 时显示 `—`。状态文案（完成 / 当前 / 锁定）语义不变。
- **D3 课时级配对**：实战 chip 增加一行"前置概念"副标题，取 `getLessonMeta(id).theoryAnchors` 首项，标题复用枢纽已构建的 `chapterLabels`；drill 型 / 无锚点课时不显示。理论 chip 不变。不新增数据源、不改投影。
- **D4 抽屉 = 原生 disclosure**：工具 / 统计收纳用 `<details>/<summary>`（与补充阅读同构），**不做浮层抽屉**——避开 overlay 守卫与焦点管理成本。默认折叠；理论阅读统计在 `flaggedCount > 0` 时自动展开（`open` 属性），保住 SRS 复习入口可见性。
- **D5 掌握度单源**：两张地图移除掌握度卡；枢纽 `CourseMasteryDualCard` 为唯一掌握度面。删除 0 消费者文件：`StrategyMasteryCard.tsx`、`TheoryMasteryCard.tsx`、`utils/theoryMastery.ts` 及其专属测试（删除前以 grep 复核消费者为 0）。

## 5. 工作包与文件所有权

> 单一写者：WP1–WP3 同触 `CourseStageCard.tsx`，WP1 与 WP4 同触 `AcademyHome.tsx`，WP4 与 WP5 同触再生成的 `MODULE_MAP.md`——默认全链串行。项目内职责只以文件所有权表达（根 AGENTS.md）；下表为插件执行层派单，不改变所有权。

### 代理分工（执行层）

| 工作包 / 提交 | 主责（插件角色） | 协同 | 写域 | 约束 |
|---|---|---|---|---|
| WP1–WP3（C1–C3） | 李响应（React） | 涂悦目（视觉 / a11y 复核）、颜可见（代码评审） | `hub/CourseStageCard.tsx`、`AcademyHome.tsx`（锚点）、`academy.json` zh/en、`CourseHub.test.tsx`、`e2e/lesson-hub.test.ts` | 同文件串行；零 shared 改动 |
| WP4（C4） | 李响应（React） | 查无漏（测试复核） | `AcademyHome.tsx`（瘦身）、删 `StrategyMasteryCard.tsx`、`AcademyHome.test.tsx`、`MODULE_MAP.md` 再生成 | 接 C1 之后（同触 AcademyHome） |
| WP5（C5） | 李响应（React） | 查无漏（测试复核） | `TheoryHome.tsx`、删卡 / 工具 / 测试、`theory.json` zh/en、`fontSizeFloor` 条目、`MODULE_MAP.md` 再生成 | 接 C4 之后（同触 MODULE_MAP） |
| WP6（C6） | 颜可见（前端组长） | 蓝图画（AC 验收）、涂悦目（DESIGN 复核） | `docs/**` | AC 全过后归档本计划 |
| 用例与验收 | 查无漏（测试） | 蓝图画（共定 AC） | e2e 增补、手动浏览器清单执行 | 下沉 `qa-quality` / `test-case` |
| 发布门禁 | 常守恒（运维） | 查无漏 | `verify:e2e` 链与部署 | 下沉 `devops-pipeline`；方案 + 回滚 + 授权 |
| 裁决 | 钟帷幄（总监） | 全员 | D1–D5 改向、跨模块争议 | 唯一对外口径 |

**执行模式**：默认李响应串行单写者（C1→C5），颜可见逐提交评审，总历时 ≈2.5 人日。如需并行提速：仅 C4 / C5 可用 worktree 隔离执行，颜可见为唯一集成者，负责合并 `MODULE_MAP.md` 与守卫条目冲突；两包合计仅 ≈1 人日，收益有限，不推荐默认启用。

### WP1 阶段卡学习闭环（strategy-academy）

- `hub/CourseStageCard.tsx`：泳道步骤编号标题；步骤③行（标准变体，链接 `/academy#assessment`）；保留 `id=hub-stage-N` / `data-hub-stage` / `data-hub-*-ratio` / `hubFrom(stageIndex)` state / `nextLessonId` 高亮 / `orderUnread` / 补充阅读 details。
- `AcademyHome.tsx`：评估区包层加 `id="assessment"`；新增 hash 滚动效应。
- i18n：`academy.json` zh/en 新增闭环步骤 key（`academy.courseHub.loop.*`）。
- 测试：`CourseHub.test.tsx` 增补（§6）；e2e `lesson-hub.test.ts` 增补闭环旅程。

### WP2 双泳道进度环（strategy-academy）

- `hub/CourseStageCard.tsx`：单环 → 双迷你环（复用 ProgressRing，不改 shared）；双独立 aria 播报；理论占位 / 未知降级。
- 守卫：不新增小于字号地板的文本；若移除既有小字号 usage，同步下调 `fontSizeFloor.guard.test.ts` 常量（只降不升）。
- 测试：双环 aria 与降级断言。

### WP3 课时级概念配对（strategy-academy）

- `hub/CourseStageCard.tsx`：实战 chip 副标题（D3）；chip 触摸目标 ≥44px 不变，truncate 防溢。
- i18n：`academy.courseHub.lanes.anchorPrefix` 等 zh/en。
- 测试：配对渲染 / drill 与无锚点降级。
- 若文件超行数目标，抽 `hub/` 模块内子组件（如 `StageDualRings` / `StageLoopSteps`），不进 shared。

### WP4 实战地图瘦身（strategy-academy）

- `AcademyHome.tsx`：移除 StrategyMasteryCard；ToolsGrid 收进 details disclosure（默认折叠，summary 带工具数）；保留零状态卡 / 变体只读面板 / LevelLadder / TheoryBridgeCard / AcademyAssessmentCard。
- 删除 `StrategyMasteryCard.tsx`（0 消费者）。
- 测试：`AcademyHome.test.tsx` 更新（工具默认折叠 / 可展开 / 掌握度缺席）。
- `pnpm agents:map` 再生成（文件删除改变地图），随本批提交。

### WP5 理论地图瘦身（theory-academy）

- `TheoryHome.tsx`：移除 TheoryMasteryCard；ReadingStats 收进 details（`flaggedCount > 0` 自动展开）；保留先修卡 / ELO 推荐 / 评估区 / 补强卡 / 实战桥 / TheoryStudyTools / 书签条 / TheoryLearningPaths。
- 删除 `TheoryMasteryCard.tsx` + 其两个组件测试 + `utils/theoryMastery.ts` + 其单测；清理被删卡专属 i18n 孤儿 key（zh/en 成对）。
- 守卫：移除 `fontSizeFloor.guard.test.ts` 中 TheoryMasteryCard 条目。
- 测试：`TheoryHome.tools.test.tsx` / `TheoryHome.basicsGuide.test.tsx` 复核保持绿；新增统计折叠 / 自动展开断言。
- `pnpm agents:map` 再生成随本批提交。

### WP6 横切同步与验证

- i18n zh/en 对称（`src/i18n/locales/{zh,en}/{academy,theory}.json`）。
- 守卫复核：line-count（CourseStageCard 目标 ≤300 行）、duplicateLiteralRatchet（FOCUS_RING 单源）、shared 准入（本批零 shared 改动）。
- 文档同步：`COURSE_IA.md` §8 增补呈现层描述（角色 / 规则不变）；`TDD.md` 模块设计增量；`DESIGN.md` §13 登记双环与 disclosure 模式（如构成新视觉模式）；`CHANGELOG.md` 当月条目。
- 本计划执行完成后移入 `docs/history/` 并登记。

## 6. 测试计划

- **单元（`.test.ts`）**：本批无新纯函数（D1 避免改 `hubStages` 投影）；若 WP3 抽出配对纯函数则补单测。
- **组件（`.test.tsx`）**：
  - `CourseHub.test.tsx` 既有用例保持绿（泳道链接 / 来源 state / 锚点回位 / 变体切换 / 短牌降级）；新增：步骤顺序 ①→②→③、步骤③仅标准变体、双环 aria、配对副标题、无锚点降级。
  - `AcademyHome.test.tsx`：工具默认折叠 / 展开可达 / 掌握度卡缺席 / 评估锚点存在。
  - `TheoryHome` 系：统计默认折叠 / 疑难 >0 自动展开 / 掌握度缺席 / StudyTools 保持。
- **E2E（真实浏览器）**：
  - `lesson-hub.test.ts` 既有用例保持绿；新增：枢纽步骤③ → `/academy#assessment` 定位 → 返回主线（R3 闭环）。
  - 新增：地图 disclosure 展开 → 工具页 → 返回所属地图（R2 不变）。
  - `ia-navigation.test.ts` / `ia-restored.test.ts` / `courseBack.test.ts` 全绿（R1–R10 不变的回归锁）。
- **手动浏览器清单**：零状态新用户 / 短牌（理论占位）/ 单挑（两步闭环）/ 深链刷新兜底 / reduced-motion / <768px 移动布局与触摸目标。

## 7. 验收标准（AC）

| AC | 内容 | 验证 |
|---|---|---|
| AC1 | 标准变体阶段卡呈 ①②③ 顺序，非标准呈 ①②；步骤编号可被读屏播报 | 组件 + e2e |
| AC2 | 双环分别播报理论 / 实战完成度；理论不可用 / 未知时占位不伪造 | 组件 |
| AC3 | 有锚点实战 chip 显示前置概念；drill / 无锚点不显示 | 组件 |
| AC4 | 两地图无掌握度卡；枢纽双掌握度为唯一面且最弱项导航保留 | 组件 + 手动 |
| AC5 | 工具 / 统计默认折叠且全部原入口可达；理论统计疑难 >0 自动展开 | 组件 + e2e |
| AC6 | R1–R10 语义不变 | courseBack / ia-* / lesson-hub 既有测试全绿 |
| AC7 | persist schema / version 零改动 | diff 复核 |
| AC8 | `pnpm verify` exit 0；`pnpm verify:e2e` exit 0 | 命令 |
| AC9 | i18n zh/en 对称；守卫棘轮只降不升 | verify 内含 |

## 8. 风险与缓解

| 风险 | 缓解 |
|---|---|
| CourseStageCard 膨胀超行数 | 抽 `hub/` 模块内子组件，不进 shared |
| 双环 + 计数在窄屏溢出 | 360px 视口实测；必要时纵向堆叠 |
| chip 副标题增高 / 截断 | min-h-11 保持、truncate、移动 wrap 实测 |
| 新文案撞既有 e2e 断言 | 新增 key 独立命名；既有断言文案（阶段路径 / 在课程目录切换等）不动 |
| 字号地板棘轮 | 新文本 ≥ 地板字号；小字号 usage 只减不增 |
| 删文件引发 agents:map diff | 删文件批次内再生成并同批提交 |
| 双环诱发"理论完成焦虑" | 文案强调浏览 / 自查，不门禁（与 COURSE_IA §1 一致） |
| 评估区锚点在移动端定位失败 | hash 效应镜像 CourseHub 既有实现（延迟等待挂载 + reduced-motion 降级） |

## 9. 提交切片（逻辑单元独立提交）

| 序 | 提交 | 内容 |
|---|---|---|
| C1 | `feat(strategy-academy): stage loop ordering + assessment anchor` | WP1 |
| C2 | `feat(strategy-academy): dual-lane progress rings` | WP2 |
| C3 | `feat(strategy-academy): lesson-level concept pairing` | WP3 |
| C4 | `refactor(strategy-academy): slim practice map, mastery single-source` | WP4 + agents:map |
| C5 | `refactor(theory-academy): slim theory map, mastery single-source` | WP5 + agents:map + 守卫条目 |
| C6 | `docs: sync COURSE_IA / TDD / DESIGN / CHANGELOG` | WP6 文档部分 |

每个提交独立过 `pnpm verify`。C1–C5 默认串行单写者（C1/C4 同触 `AcademyHome.tsx`，C4/C5 同触 `MODULE_MAP.md`）；并行仅限 worktree 隔离 + 唯一集成者模式（§5 代理分工）。C6 收尾。

## 10. 估时与执行顺序

WP1 ≈ 0.5d · WP2 ≈ 0.25d · WP3 ≈ 0.25d · WP4 ≈ 0.5d · WP5 ≈ 0.5d · WP6 ≈ 0.5d，合计 ≈ 2.5 人日（含测试与浏览器验证）。执行顺序与角色派单见 §5 代理分工；编码下沉 `team-p8-full-stack`，质量门禁走 `qa-quality`，发布走 `devops-pipeline`。

## 11. 后续登记（不在本批）

- 隐喻统一（地图 / 阶梯 / 轨道 / 阶段）——触 nav 单源与 e2e 文案，单独立项。
- 学习结果遥测：H1–H3 结果指标的前后对比能力。
- `TheoryLearningPaths` / `LearningTracksView` 组织面收敛评估。
- 同心双环 / 配对连线可视化升级（若 D2 / D3 可用性走查不达预期）。