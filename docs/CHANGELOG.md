# 变更日志（CHANGELOG）

> 状态：Historical · 最后复核：2026-11-06
> 本文件归档德州扑克训练平台的版本演进，仅保留当月变更（跨月后归档）。
> 历史月份存档位于 `docs/changelog/` 目录下，文件名为 `YYYY-MM.md`。
> PRD.md 与 TDD.md 仅保留当前规格，执行历史统一汇集于此。
> 已归档：2026-10、2026-09、2026-08、2026-07

---

## [Unreleased] - 2026-11-04

### 2026-11-06 共享层结构收口（准入守卫 · 语义目录 · 装配复用）

- **准入守卫重建**：新增 `src/test-utils/admissionGraph.ts`（import 图 + shared→shared 传递闭包 + 消费者计数 + 双向 baseline 校验），`src/shared/admission-guard.test.ts` 改为真校验：0 生产消费者直接失败、1 生产消费者失败（仅「只降不升」baseline 内可临时存在，收口后 baseline 已清空）、`components/ui/**` 豁免 ≥2 但仍禁 0 消费、`utils/localStorageStub` / `utils/persistShape` 按测试消费者计数豁免。旧实现只扫 `shared/utils` 且统计 `import` 方向相反，单消费者文件长期漏检。
- **删除零消费者**：`business/FreezeChip`（progress 已有同字节文件）/ `MilestoneMarker` / `feedback/FeedbackGrade` / `feedback/GradeBadge` / `layout/LiveDot` / `ui/tabs`（同时移除 `@radix-ui/react-tabs` 依赖）与旧 `shared/utils/quizOrder.ts`；连带清理 `.milestone-marker` / `.live-dot` / `@keyframes live-pulse` 样式与 `common.ui.live` 文案。
- **单消费回归模块**：`CasinoPlaque` / `DailyGoalCard` / `MottoEngraved` / `GameVariantSelector` / `RankIcon` / `Sparkline` / `moduleLabels` / `useModuleLabel` / `useAcademyDataSource` / `types/ability` → progress；`TableRail` → `src/layouts/`；`pokerMath` → `pot-odds/utils/`；`ResultSummary` → `gto-simulator/components/`；删除 `range-trainer` 的 `rangeParser` / `handClassifier` 纯 re-export shim 与 `shared/utils/index.ts` 半桶 barrel（统一深路径导入）。
- **`business/` 拆解**：目录撤销，组件按语义域归位 `poker/`（VariantGlyph / VariantToggle / OpponentGlyph）、`quiz/`（QuizCard / quizCardModel，range-trainer 与 onboarding 专用）、`academy/`（ContentBlocks）、`data-display/`（ProgressBar / ProgressRing / StatCard）、`system/`（ErrorBoundary）、`feedback/`、`layout/`、`ui/`；`components/academy/index.ts` 是唯一 barrel facade。
- **装配复用**：`ProgressRing`（`valueMax` / `variant` / `center` / `ariaLabel`）统一房间环与学院环、`StatCard` 收敛三份本地实现并新增 `StatPair`、`ResultHeader` / `ResultActions` 统一结果页标题层级（h1 整页 / h2 嵌入）与动作组、`BackLink` 统一约 25 处返回入口（text / pill / button 三变体，`historyBack` 走 `navigate(-1)`）；`pageHeadingGuard` 的 H1 allowlist 随之收敛到 `ResultHeader`。
- **选项排序收口**：新增 `shared/utils/optionOrder.ts`（numeric / shuffle / action / conditional 四类策略 + `computeOptionOrder` / `applyOptionOrder` / `remapCorrectIndex`），pot-odds / theory-academy / onboarding / puzzle-trainer / strategy-academy 五方改为薄包装（导出名与行为不变）；迁移前先为五方各落固定样本黄金断言，`seededShuffle.ts` 底座保持不动。
- **行数守卫**：`src/shared/components/**` 纳入豁免（跨模块装配体不按行数拆分）；`shared/utils` / `types` / `constants` / `stores` 仍守 ≤300 行目标、>400 行失败。
- **文档同步**：重写 `src/shared/AGENTS.md`（目标目录全量、准入与导入规则、测试桩例外）、根 `AGENTS.md`（代码组织 shared 清单 / 跨模块复用契约新增 optionOrder · ResultHeader·Actions · BackLink / 质量门禁 shared 准入）、`docs/AI_GUIDE.md` §跨模块复用契约、`docs/TDD.md` shared 组件树与 §5.9 选项排序、`src/guards/README.md` 与相关子代理文件的旧 shared 路径。
- **验证**：`pnpm docs:check` / `pnpm agents:map:check` 通过；组件行为由 jsdom 覆盖，视觉与响应式未实机复核（Batch 4–7 统一交 `ui-ux-dev` 复核）。
### 2026-11-06 后续修复：理论搜索跟随变体 + 短牌 L4 课时 order

- **理论搜索**：`TheorySearch` 的目录层与全文层统一改用理论 store 的 `activeVariant`（`getChapterSummariesByVariant(activeVariant)` / `loadTheoryLevelsForVariant(activeVariant)`），单挑 37 章的标题、正文与小测均可检索；全文结果按变体打标，切换变体后旧变体结果不再命中。新增 jsdom 用例断言加载参数为当前变体。
- **短牌 L4 order**：`l4sd-gto-fundamentals` / `l4sd-solver-readout` 的 order 由 1/2 改为 4/5，修复 L4 合并为单一条目后 order 重复导致的关卡进度百分比少算与图谱排序交错；`manifest.parity.test.ts` 新增「变体每个 Level 的课时 order 严格递增且不重复」守卫，manifest 已重新生成。
- **范围外 / 遗留**：短牌内容扩章、变体认证、持久化 schema 不变；成就 / 推荐卡与 `theoryTitleKeys` / `contentAppendOnly` 守卫扩展仍为后续批次。
- **验证**：全量门禁通过（439 文件 / 3323 用例；typecheck / lint / repo:check / docs:check / agents:map:check 均通过）。组件行为由 jsdom 覆盖，视觉与响应式未实机复核。

### 2026-11-05 策略学院单挑变体全量对齐（12 课 · 独立题库 · 元数据/搜索）

- **课程结构**：12 门单挑课拆为 `data/lessons/variants/heads-up/lessons/<lessonId>.ts` 每课单文件；`headsUpLevel3..8.ts` 改为薄转发兼容层；L4 课时 order 修正为 1–4。
- **题库与评估**：题库迁入 `heads-up/quizBank/l3hu..l8hu.ts`，每课 10 题（q1–q5 逐字保留、q6–q10 新增），复用 `applyQuizBank`（shared `mergeQuizBank`）注入，课时仍抽 5；各 Level 新增 `quantAudit.l*hu.test.ts` 复算审计。
- **正文深对齐**：每课 3 个 HandExample、2 条 `theory-reference`、3 个手写 units、takeaway（量化课加 formula）与 p4（l7 保持 5）；`variantContext` 统一 `anteStructure='sb_ante'`。
- **元数据与运营**：新增 `lessonMeta/headsUp.ts`（12 课 ELO 维度 + `t*hu-*` 锚点），标准/单挑分表守卫；`contentOps` 纳入单挑 12 课 `lastReviewed`；全文搜索按当前变体懒加载并缓存（标准全量 / 单挑 12 课），UI 复用 shared `AcademySearchShell`。
- **i18n**：`academy-course/heads-up.json` 拆为 `heads-up-l3..l8.json`（zh/en），`deriveAcademyCourseFilesForLesson` 按 `l<n>hu-` 映射；`huPositionOrderGuard` 扫描六份新文案。
- **守卫**：新增 `headsUpVariantParity.test.ts`（10 题 / 3 牌例 / ≥4 practice / ≥10 段 / ≥2 理论引用 / ≥2 units）；`curriculumIntegrity` 覆盖变体 quiz / practice / units；`quizShuffle` 纳入全部变体课时（857 题，分布 <50%）。顺带修复短牌两处存量重复牌（`l7sd-deep-stack-p2` / `l8sd-exploit-i-p2`），变体卡牌校验恢复全量。
- **变体 L4 去重与门禁**：`generate-academy-manifest` 对变体按数字 level 去重，短牌 / 单挑 L4 合并为单一条目（id 保留 `l4b`，标题「进阶思维 · 范围、EV 与 GTO」，解锁「完成 Level 3」），不再把同一组课重复挂到 l4a / l4b；L8 的 `prerequisiteLevelIds: ['l4b']` 仍可解析。单挑 manifest 由 7 层/16 课收敛为 6 层/12 课。同时 `isLevelEntryUnlockedByCompleted` 接受当前变体 Level 序列，store 按 `activeVariant` 解析前置与上一级：单挑完成 L3 解锁 L4、完成 L4 解锁 L5，L8 仍只依赖 L4b；L1/L2 共享基础层回退标准序列。
- **行数守卫**：课程内容数据文件（策略 lessons/variants、localLessons、basicsContent；理论 levels/variants 的 Level / chapters / quizBank / blocks / 章节推荐）不做行数限制；移除 `QUIZ_BANK_ALLOWLIST`，逻辑 / UI 文件仍 ≤300 目标、>400 失败，非课程超大文件逐文件 allowlist 保留。
- **范围外 / 遗留**：短牌内容、变体认证、持久化 schema 不变。
- **验证**：全量 `pnpm verify` 通过（439 文件 / 3321 用例；typecheck / lint / repo / docs / agents-map 均通过）；`pnpm build` 通过，单挑 chunk 188.62 KB（gzip 56.04 KB，懒载）；`pnpm size:check` 通过（首屏 727.83 KB / gzip ~218.35 KB）。组件行为由 jsdom 测试覆盖，视觉与响应式未实机复核。

### 2026-11-05 理论学院单挑变体全量对齐（heads-up 37 核心章）

- **章节与题库**：单挑 +15 章达到 37 核心章（T4 / T5 各 5、T6 / T7 / T8 各 4、T9 6），新增章落 `variants/heads-up/chapters/t<level>hu-*.ts`；全部章末题迁入独立题库 `variants/heads-up/quizBank/t1hu..t9hu.ts`（每章 8–12 题），旧题逐字迁移、题号与选项顺序不变；抽题仍为 T1–T3 抽 5、T4–T9 抽 6。
- **组合单源**：新增 `variants/composeVariantChapters.ts`，静态聚合 `heads-up/index.ts`（eager glob 吸收新章 / 题库 / 块）与运行时 `loaders.ts`（glob 按变体查表）共用同一组合顺序，`headsUpStaticRuntimeParity.test.ts` 深比较两条路径；题库注入泛化为 `applyTheoryQuizBank`（单挑 `strict`，未知章节键 fail loud）、块注入为 `applyTheoryContentBlocks`，标准侧改为别名再导出以保持既有 import。
- **富文本块**：`variants/heads-up/blocks/t2hu.ts`、`t4hu..t9hu.ts` 镜像标准覆盖（table / decision-tree / range-matrix），只追加到正文尾部，不改既有下标型 key。
- **共享规则卡**：新增 `shared/types/variantRules.ts` / `shared/constants/headsUpRules.ts` / `shared/utils/academyVariantRules.ts` / `shared/components/academy/AcademyVariantRuleCard`；理论 `TheoryVariantRuleCard` 与策略 `StrategyVariantRuleCard` 各做薄包装，单挑规则卡在章节页与课时页正文前展示，方向值由 `positionDynamics` 派生。`huPositionOrderGuard` / `variantRuleCopyGuard` 的单源路径改到 shared。
- **persist v5 宽限**：`TheoryProgress` 增 `legacyUnlockedLevels`，v4→v5 按历史快照（对齐前 22 个单挑核心章）把当时已解锁的 Level 写入宽限名单，只放宽解锁、不写 `completedChapters`，存量进度不倒退。
- **行数豁免边界**：`QUIZ_BANK_ALLOWLIST` 逐个登记 `heads-up/quizBank/t[1-9]hu.ts`（逐文件上限、只减不增）；`chapters/` 与 `blocks/` 不豁免。
- **内容运营**：单挑 37 章 `contentOps.lastReviewed` 随本批纳入；理论搜索覆盖单挑、成就 / 推荐卡、`theoryTitleKeys` / `contentAppendOnly` 守卫扩展不在本批，短牌内容不动，变体认证仍为后续批次。
- **文档同步**：PRD §1.3.1 范围界定（标准与单挑已对齐）、TDD §5.8b 第 23 条与 persist 迁移条目、AI_GUIDE §文件大小 / §跨模块复用契约（变体规则卡）、AGENTS 共享组件与能力归属表、theory-academy-dev / strategy-academy-dev 代理文件、`src/guards/README.md` 行数守卫口径。
- **验证**：文档侧 `pnpm docs:check` 通过；全量 `pnpm verify` / `pnpm build` / `pnpm size:check` 由集成阶段执行，结果以该批提交为准。

### 2026-11-04 策略学院学习工具与形成性评估（P2，非变体）

- **定位测评**：16 题概念测评（牌型 / 位置 / 赔率 / 翻前范围 / C-bet / EV / GTO / ICM），分档 0–4→L1、5–8→L2、9–11→L3、12–14→L4A、15–16→L4B；结果只写 `placement.creditLevels`（放宽条目访问），不写 `completedLessons`、不计进度，重测取并集不降级；最高免修 L4B、L5+ 不接受 credit。路由 `/academy/placement`。
- **Level Checkpoint**：每级 12 题形成性测评，仅该级核心课全部完成后开放；首轮按题目来源课维度写 ELO 与情绪计数，错题按来源课进题级 SRS（`checkpoint:l<n>:<qid>`），重考只更新成绩；**不发证、不解锁下一级**。路由 `/academy/checkpoint/:level`。
- **课时工具与内容运营**：课时书签（toggle + 收藏页 `/academy/bookmarks`）、纯文本笔记（2000 字上限、显式保存、空文本即删除）、课时「最近校对」`lastReviewed`（92/92 标准课时，`data/contentOps.ts`）与内容纠错入口（mailto / 剪贴板降级，无后端）；策略参考书目 11 本按 Level 聚合（`/academy/bibliography`，只读，不复制理论书目数据）。
- **全文搜索**：`/academy/search` 升级为标题即时 + 正文全文；首次查询 ≥2 字符时懒加载全量标准课时并缓存索引，命中标题 / 副标题 / objectives / 正文 / 小测题干，结果去重、上限 20，加载失败降级为标题搜索。
- **共享层**：`shared/components/academy/` 新增 `AcademyBookmarksPanel` / `AcademyNotesPanel` / `ContentIssueReportDialog`，理论（`TheoryBookmarksPanel` / `TheoryNotesPanel` / `ContentIssueReport`）与策略（`StrategyBookmarksPanel` / `StrategyNotesPanel` / `StrategyContentIssueReport`）各自薄包装。
- **persist 与 v8 清理**：v6 新增 `lessonAttempts`、v7 新增 `placement` / `checkpoints` / `bookmarkedLessons` / `lessonNotes`、v8 删除 `abilityAssessment`、`firstAttemptScores` / `lastAttemptScores` 镜像与 legacy `attemptCertification`；`lessonAttempts` + `submitCertificationAttempt` 成为唯一事实源，`ProgressReplay` 改读 `AcademyDataSource.getLessonAttemptsSnapshot()`，progress 新增 `seedEloFromOnboardingAbility` 取代 `syncEloFromAcademyAbility`。
- **文档同步**：PRD §5.16.12–5.16.14 与对应验收项；TDD §5.8 修订第 19 / 20 / 23 / 24 条并新增第 26–30 条，§6.4 / §9.4 持久化字段、§7.2 路由表与 persist 迁移记录同步；AGENTS 共享组件契约与 AI_GUIDE 学院共享层补充 P2 工具与 v8 清理记录；strategy-academy-dev / progress-dev / theory-academy-dev 代理文件更新。
- **验证**：`pnpm verify` 全绿（418 文件 / 3091 用例；typecheck / lint / repo / docs / agents-map 通过）；`pnpm build` 通过；`size:check` 通过（首屏 725.67 KB / gzip ~217.7 KB）。Playwright 1440×900 / 390×844 × 亮/暗实测策略首页、定位测评、Checkpoint、收藏、书目、全文搜索、课时页：0 console error/warn、0 page error、无横向溢出；截图归档 `C:\Users\24533\.qoder\tmp\p2-e2e`。英文文案由 localeParity/staticKeyGuard 与既有英文冒烟覆盖。

### 2026-11-04 策略学院评估与学习闭环整改（P0+P1，标准变体）

- **题库与评估**：标准 70 门非 Drill 课迁入 `quizBank/level1..8.ts` + `local.ts`，目标 8–12 题/课；课时抽 5、Level 认证抽 20；首次成绩计掌握度/ELO，重考只更新 best/last 并进题级 SRS。
- **认证**：标准变体 70% 通过、30 天有效、失败 24h 冷却、过期续期；完成门禁、变体模式隐藏入口并拒绝 `wrong-variant`；题量按实考记录。短牌/单挑认证明确 de-scope，PRD §5.16.8 / §5.17.3 同步。
- **能力链路**：策略课时首考/Drill 写 `progress.updateElo`；`dailyPlan` / QuickDrill 弱点改读 ELO；`abilityAssessment` 降为自适应难度内部启发式（同批 P2 的 v8 清理已将其移除）；onboarding 初值种子化 ELO（P2 收敛为 `seedEloFromOnboardingAbility`）。
- **桥接与工具**：`lessonMeta` 覆盖 92 门标准课（`eloDimension` + `theoryAnchors`）；策略首页/课程完成页/认证失败页/理论 Checkpoint 双向入口；掌握度卡、搜索页、术语入口、leak-fix 动态推荐。
- **共享层**：新增 `shared/components/academy/*` 与 `shared/utils/academy*`；理论 `PracticeBridgeCard` / `TheoryMasteryCard` / `TheorySearch*` / `theorySrs` / `applyQuizBank` / `quizDraw` 与策略侧对应实现改为薄包装。
- **内容修正**：`l2-3bet-basics` 持 A♠ 的 3-bet 范围组合数由 26→22 修正为 26→17（AA 6→3、AKs/A5s 各 4→1）；`standardQuantAudit` 索引同步。
- **验证**：`pnpm verify` 全绿（397 文件 / 2930 用例；typecheck / lint / repo / docs / agents-map 通过）；`pnpm build` 通过；`size:check` 通过（首屏 724 KB / gzip ~217 KB）。dev server 结构验收：策略首页（掌握度/搜索/术语）、搜索 92 课、认证未完成与变体门禁、课时题库 8 题、理论首页与章节（共享组件）均无 console error/warn；截图因 in-app browser viewport 0x0 不可用，移动端视觉未实机复核。

### 2026-11-04 理论学院标准课程全量整改

- **独立题库**：全部章末题迁入 `data/levels/variants/standard/quizBank/t1..t9.ts`（标准变体题库 354 题，每章 8–12 题），按章节 + 尝试次数种子抽 5/6 题；题库纯数据文件走 `QUIZ_BANK_ALLOWLIST` 逐文件行数棘轮。
- **尝试与掌握度**：首次成绩计掌握度/ELO，重考只做练习并进 SRS；theory store 升至 v4，新增 `chapterAttempts` / `checkpoints` / `placement` / 书签 / 笔记，v3→v4 用 `quizScores` 种子化尝试记录。
- **定位测评与 Level checkpoint**：16 题定位按分档免修 T1–T5（只写 `creditLevels`，不写完成态）；每级 12 题 checkpoint 仅完成核心章可进，首轮计 ELO、错题回 SRS，不解锁、不发证。
- **学习工具与富内容**：术语表（57 词）、参考书目（10 本）、全站搜索、章节书签/笔记、章节 lastReviewed 与纠错入口；正文新增只读表格 / 13×13 范围矩阵 / 决策树（追加式，不改既有索引）。
- **每日计划与反向桥接**：新增理论复习卡（→ `/theory/review`）与下一理论章卡（经 `theoryDataSourceRegistry`，progress 不 import theory）；首页按 ELO 五维推荐理论章节。
- **路由与加载**：新增 `/theory/placement`、`/theory/checkpoint/:levelId`、`/theory/glossary`、`/theory/search`、`/theory/bibliography`；术语/书目内容包由 `loadTheoryContentBundle('glossary')` 显式加载，避免 key 尾段回退。
- **验证**：`pnpm verify` 全绿（381 文件 / 2744 用例；typecheck / lint / repo / docs / agents-map 通过）。

### 2026-11-04 浅色主题「白天牌室」配色与牌桌控件重设计

- **大面黄铜填充**：新增 `--brass-fill` / `--brass-fill-ink` / `--brass-fill-border` / `--brass-fill-gradient*`；light 取柔和蜜金 + 墨色文字，`.btn-brass`、选中态、学院 CTA 与各训练器按钮统一切换，消除浅色下的深芥末色块；dark 沿用原金属渐变。
- **日间绿呢**：light 覆写 `--grad-felt-*` 与 `--poker-felt-center`，去掉近黑收边；新增 `--scene-vignette*` / `--scene-drop-*` / `--scene-rail*`，`felt-arena` / `mini-felt` 改用暖棕投影与胡桃木轨，dark 数值等价于原实现。
- **牌桌控件修正**：GTO All-In 改深胡桃墨底 + 象牙字；位置选中态在 light 改蜜金（dark 保留 sage）；`PositionBadge` 的 clay/sage 实底文字与 `GTOFeedback` 三色条文字改用 `--stable-ivory`；GTO 进度条去掉 brass→sage 的橄榄色渐变。
- **页面材质**：`.difficulty-ladder` / `.streak-dot.missed` / `.rec-item:hover` / 移动端 `.quick-path-node` 由字面深 rgba 改为 `var(--walnut*)` 混色；纸面/浅木 token 轻微去黄提亮，保持羊皮纸身份。
- **文档与门禁**：DESIGN.md 新增 §2.8.1；`lightThemeSurfaceGuard` 白名单与黑色 rgba 棘轮不变；更新 `SectionNav` / `PotSizeInput` 断言。

### 2026-11-04 文档指导体系精简

- **Current / Historical 分层**：`docs/README.md` 改为唯一索引并引入 Current / Generated / Historical 状态约定；新增 `docs/history/README.md` 归档索引。
- **遗留材料归档**：一次性报告、架构评审、补救计划、UI/UX 执行记录与部署诊断共 12 份移入 `docs/history/`；`docs/agents/behavior.md` 删除（摘要保留在 AGENTS.md，全文见 git 历史）。
- **代理文档去重**：`docs/agents/README.md` 删除与 AGENTS.md 重复的任务路由表，改为代理清单 / 命名 / 工具权限的单一位置；模板迁至 `docs/agents/TEMPLATE-dev.md`；`docs/agents-guide/` 移除。
- **AGENTS.md 精简**：429 → 199 行；编码/状态/i18n/UI 与跨模块复用契约下沉 `docs/AI_GUIDE.md`，代理命名/清单/工具权限下沉 `docs/agents/README.md`；AGENTS.md 只保留常驻路由、硬约束与质量门禁。
- **文档门禁**：新增 `scripts/check-doc-links.mjs` 与 `pnpm docs:check`（链接、Current/Historical 索引覆盖、状态声明），接入 `verify`、CI、pre-commit 与 `verify:parallel`。
- **ADR 与架构降级**：新增 `docs/adr/`（纯前端本地优先 / Feature-first 边界 / progress 单中枢）；`docs/architecture/` 从 Current 降级为 Snapshot，并定义刷新触发。
- **贡献者指南**：新增 `docs/how-to/`（新增模块 / 新增守卫 / 新增或修改测试）并接入任务导航。
- **过期指导修正**：`docs/AI_GUIDE.md` 更新 i18n 现状与 CORE_MODULES 清单；`docs/ops/DEPLOY_CHECKLIST.md` 重写为现行门禁 / 回滚手册；`docs/knowledge-guide.md` 明确 `.qoder/repowiki` 为本机缓存、不入库；根 README 对齐 Node 22 / pnpm 11.18.0 / 12 代理 / fail-closed hooks / ISC。
- **验证**：`pnpm verify` 全绿（typecheck / lint / repo:check / docs:check / agents:map:check / 352 文件 2538 用例；lint 0 error，2 条既有 warning）；本次无运行时代码变更。

### 2026-11-03 第二阶段纯前端 UI/UX 修复（白天牌室 / Hero / ActionTier）

承接同日前一轮整改的「未纳入」项，本轮**不含后端**；排行榜保持本地现状，不引入认证、云数据库、排行榜 SDK 或接口层。

- **浅色主题 token 化**：新增 `--room-*` semantic 层与 `--hero-surface-gradient` / `--question-card-gradient`；light 主题组件补丁从 37 处收敛到 16 处白名单；黄铜字面 rgba 清零（统一 `color-mix(var(--brass))`）；light `--ivory-muted` 调深到 `#665b43`，羊皮底 5.13:1、浅木侧栏 4.80:1；`feltContrast` 扩展 light 房间对比度，新增 `lightThemeSurfaceGuard`（补丁白名单 + 字面量棘轮）。
- **Hero 高度压缩**：FeltArena 的 `DailyGoalCard` 移出椭圆桌；压缩 FeltArena / PuzzleHero / HelpHero / RankPlaqueHero / AcademyResume / TheoryResume / SettingsHero 的 padding 与装饰尺寸；保留 h2、CTA 与签名元素；新增 DESIGN.md §6.6 高度契约。
- **Puzzle ActionTier 配色统一**：三档改为 `--tier-*` 单一来源；aggressive 从 clay 改为 terra，与答后 danger 反馈保持可辨差异；答前禁止 success/danger；新增 `actionTierPalette.guard.test.ts`；light 主题删除 7 条 action tile 专属补丁。
- **Emoji 白名单**：按 DESIGN.md §7 扩展内容层扫描面到 `features/**/data/**`、`shared/data/**`、`i18n/**`；仅允许成就 / 策略与理论正文 / i18n 既有文案；排版箭头 `↔` 单独豁免。
- **h2 决策**：内容区视觉标题保留 h2，允许与壳层 h1 同名/同义，不做文案去重；Dashboard / Puzzle / Help / Leaderboard 增加 h2 回归断言；DESIGN.md 登记例外。
- **排行榜后端**：按「纯前端」约束整体移出本阶段；`Leaderboard` 保持 19 位虚构角色 + 演示说明 + 我的排名，不改数据、文案与测试契约。
- **文档同步**：DESIGN.md v1.9.0（§2.8 / §5.5 / §5.7 / §6.6 / §7 / §10.1 / §10.6 / 附录 K）、TDD §14、AI_GUIDE UI/UX、guards README、architecture/docs 索引，以及 `ui-ux-dev` / `platform-dev` / `puzzle-trainer-dev` / `pot-odds-dev` 代理约束。
- **验证**：`pnpm verify` 全绿（typecheck / lint / repo:check / agents:map:check / 352 文件 2538 用例；lint 仅 2 条既有 import-pattern warning，0 error）；`build` + `size:check` 通过；headless Chrome 1440×900 / 390×844 双主题实测 7 个 Hero，桌面/移动高度分别为 Dashboard 297/240、Puzzle 259/225、Help 232/245、Progress 184/121、Academy 144/162、Theory 137/227、Settings 101/101；无横向滚动。正常 PowerShell 7 终端（加载 profile，`pnpm` → `F:\dev\bin\pnpm.exe` 11.18.0）可直接执行 `pnpm verify`；不带 profile 的工具 shell 需显式加入 `F:\dev\bin` 或使用 `corepack pnpm`。

### 2026-11-03 UI/UX 全链路整改（P0→P2）

以 1440×900 / 390×844 双视口实测 15+ 路由，按「止血 → 交互/响应式 → 视觉一致性 → 信息架构/产品内容」四阶段修复。

- **P0 i18n 原始 key**：`mentor` 升入 CORE_MODULES，`/onboarding` 补 `rangeTrainer`；`renderMentorFeedback` 增加缺失 key 兜底；新增 `src/i18n/routeGroupNamespace.test.ts` 静态契约守卫，锁定反馈组件与路由组命名空间覆盖。
- **P0 反馈闭环**：答对 1.5s 自动推进，答错/超时手动推进；移除 TrainingSession 对 QuizCard 的外部 key，移动 Sheet 常驻，关闭后可「查看反馈 / 再做一题 / 下一题」。
- **S1 交互/响应式**：移动端 RangeTrainer 头部堆叠、降级条换行、暂停遮罩改发牌员纸条、快捷键浮层打开时暂停计时；新增 `TRAINING_OVERLAY_EVENT` 跨布局/训练页契约。
- **S2 视觉一致性**：新增文本专用对比度 token（`--ivory-muted #b0a68c`、`--clay-text/--danger-text/--sage-text/--brass-text`）并完成 172 处文本色替换；19 个 AppLayout 页面内容 h1→h2；五级反馈/对手/段位/变体/谜题主题图标 Lucide 化；新增 `feltContrast` / `pageHeadingGuard` / `emojiWhitelist` 三条守卫；globals.css 行数棘轮 3421→3374。
- **S3 信息架构/产品内容**：移动底栏六项 + 训练快捷 Sheet + 顶栏设置齿轮；设置页单导航；进度页指标去重；排行榜虚构角色 + 演示数据说明 + 我的排名；学院零状态单入口；Basics 阅读列宽收窄；中文页名「牌局历史」统一为「牌局复盘」。
- **验证**：`pnpm verify` 全绿（350 测试文件 / 2497 用例）；双视口浏览器验收：每页唯一 h1、无原始 i18n key、答错 3s 不跳题、移动 Sheet 常驻、快捷键浮层计时冻结、Lucide 反馈图标生效。
- **未纳入**：浅色主题「白天牌室」重构、hero 高度压缩、Puzzle tier 配色统一（有意保留防答案暗示）、真实排行榜后端；内容/插画 emoji 白名单见 DESIGN.md §7。

### 2026-11-03 全仓测试补全与多智能体协同收官

以覆盖率审计驱动、按模块拆分给 feature 子智能体并行补测，最终 `pnpm verify` 全绿（345 个测试文件 / 2437 个用例）。合并 unit + component 覆盖率 **93% 行（10010/10710）**；10 个 feature 模块中 9 个 ≥91%（最低 progress 88%），shared 96% / i18n 92% / layouts 98% / app 98%。唯一 0% 源文件为启动入口 `src/main.tsx`，按规范登记为 L4/间接覆盖豁免。

- **补测范围**：pot-odds 12%→98%、strategy-academy 24%→95%、hand-history 42%→95%、progress 42%→88%、gto-simulator 45%→91%、puzzle-trainer 56%→96%、range-trainer 66%→95%，并补齐 onboarding（100%）、theory-academy（95%）、shared/app/layouts、help-center（98%）的剩余缺口；新增 `debugMode` / progress `indexedDB` / hand-history IDB / 路由注册与 `/help` 渲染等测试。
- **真实 bug 修复（均带回归锁）**：pot-odds 移动端反馈 Sheet 不随下一题关闭；GG 牌局 stakes 恒为 0/0；worker 崩溃后分析 promise 永久挂起；partypoker `collected` 方括号金额不解析导致 winner 丢失；RankUpCelebration 直接渲染 i18n 语义 key；Dashboard「最近训练」按写入序取最早记录；ConceptGraph L4A/L4B 重复 React key；EVCalculator 百分比胜率被当概率（30%→100%，EV 虚高）；FormulaDisplay `P(win)` 等带右括号变量无法高亮；`formatChipCount` 输出 `1000.0K`；`quizOrder` 对 i18n-key 数值选项误走洗牌；非交互 `PokerCard` 被 framer-motion 补成无名称 Tab 停靠点。
- **测试体系**：`vitest.config.ts` 增加 v8 覆盖率配置与 `test:coverage`（审计用，非门禁）；`testSystem.guard.test.ts` 新增「含 `describe`/`it` 的非测试文件不可被收集」检查，并清理一个未被收集的占位 guard-doc；`docs/testing/README.md` 新增 §13 多智能体补测协作流程；`docs/TDD.md` §11、`AGENTS.md`、`src/guards/README.md` 同步；`docs/agents/MODULE_MAP.md` 已重生成。
- **登记豁免/遗留**：Playwright E2E 不在本次目标内（路由测试只覆盖注册结构与 `/help` 静态渲染）；`main.tsx` / `App.tsx` 入口组合壳不做直接单测；真实滚动/动画/响应式/IDB quota/worker 运行时属 L4 手工验收；`detectVariant` 无消费方、`ActionSelector` minRaise > maxRaise 边界与 `ReviewSession` 答错解析回退待产品决策，未擅自改语义。

### 2026-11-02 测试体系补口：路由组合与 hand-history IndexedDB

- **路由冒烟**：`src/app/routes.tsx` 导出 `appRoutes`；新增 `src/app/routes.test.tsx` 锁定 AppLayout / BlankLayout 路径清单、路径唯一性、动态参数、LazyWrapper 包裹，并用 `/help` 渲染验证「壳层 + 新手门禁 + 懒加载页面」接线。
- **IDB 覆盖**：新增 devDependency `fake-indexeddb`，新增 `src/features/hand-history/store.indexeddb.test.ts`，覆盖空库加载、addHands 持久化 / 幂等、loadFromDB 回读、deleteHand、clearAll、批注持久化 / 空值删除、筛选排序与回放状态推进。
- **规范同步**：`docs/testing/README.md` 的 IndexedDB 规则改为 `fake-indexeddb`，已知缺口移除「路由组合」与「hand-history IDB」两项；路由增删须同步 `routes.test.tsx` 路径清单。

### 2026-11-02 测试体系规范与执行链路

把分散在 AGENTS.md / TDD §11 / src/guards/README.md 的测试约定收敛为单一规范，并补齐“测试体系自身”的可执行门禁。

- **规范单源**：新增 `docs/testing/README.md`，定义 L0–L4 分层、测试文件后缀 / 放置 / 命名、按变更类型的最小测试要求、确定性 / mock 规则、覆盖棘轮、执行矩阵、责任与 PR 自检；`docs/TDD.md` §11 收缩为运行拓扑与 E2E 规划并链接该规范。
- **执行入口**：`package.json` 增加 `test:unit` / `test:component` / `test:guards` / `test:watch`；`pnpm verify` 仍为全量门禁（typecheck → lint → repo:check → agents:map:check → test）。
- **PR 门禁**：新增 `.github/workflows/ci.yml`，对 PR 与非 main 分支执行 `pnpm verify` + `pnpm build` + `pnpm size:check`；main 仍由 deploy 工作流执行同序列后部署。
- **体系守卫**：新增 `src/guards/testSystem.guard.test.ts` 并登记 `src/guards/README.md`，零容忍 focused / skipped / todo / expected-failure 测试，校验测试文件后缀 / 位置、每个 feature 至少一个测试、persist store 的 shape / migrate 测试、守卫文件与 README 清单双向一致；扫描面自检防止路径失效空跑。
- **补齐 persist 覆盖**：新增 `src/shared/stores/debugMode.persist-shape.test.ts`，锁住调试解锁 store 的持久化形状；`testSystem.guard.test.ts` 的 persist store 检查从「feature `store.ts`」扩展为「任意含 `persist(` 的非测试源码」。
- **已知缺口**：E2E 未落地、`src/app` 无路由组合测试、hand-history IndexedDB 层无自动化测试、页面级组件覆盖不均、progress 测试仍有真实计时器等待；处理方向见规范 §11。

### 2026-11-02 理论学院 6-max 现金基准与位置命名对齐

理论正文的开池口径与 range-trainer 的 6-max 预设长期不一致（T1/T3/T4/T7 写 15% / 40–50% / 40%，训练器为 UTG 19 / HJ 22 / CO 32 / BTN 44 / SB 38），策略学院入门课仍用满员桌位置名。本批只对齐「基数值」与「教命名」的入口，不改训练器预设、不动短牌/单挑变体。

- **双列基准单源**：新增模块内 `data/sixMaxBenchmarks.ts`（`SIX_MAX_BENCHMARK_SCOPE` = 6 座 / 100bb / 无前注；`SIX_MAX_RFI_100BB_NO_ANTE` 标准列 19 / 22 / 32 / 44 / 38 与新手列 15 / 18 / 30 / 35 / 35）与全局守卫 `src/guards/sixMaxBenchmarkGuard.test.ts`（解析 range-trainer 预设名称的 `(~N%)` 逐位置比对 + 扫描面自检 + 新手列不宽于标准列、BTN 为标准列最宽），守卫登记进 `src/guards/README.md`。
- **理论正文（行内改写，行数不变）**：T3 的 RFI 段改双列口径（UTG 标准 19% / 新手 15%、HJ 22%、CO 32%、BTN 最宽 44%、SB 38%）并把「UTG+1 对 UTG」改为「HJ 对 UTG」；T4 的「前 15%」「约 40%」改为 19%（新手简化 15%）/ 44%（新手简化 35%）；T7 的 VPIP 改 6-max 现金参考 `<20 / 22-27 / >32`（标 28–32% 过渡带）、3-bet 改 `<4 / 6-9 / >11`（标经验参考线与过渡带），示例 `3-bet 6%` → `12%` 以保留「松且凶」对比；T1 的「满员桌」改「6-max 桌」；`standardQuantAudit.test.ts` 只同步口径注释，断言未动。
- **策略学院入口命名**：L1 位置分组改为前位 UTG / 中位 HJ / 后位 CO、BTN / 盲注 SB、BB，`player` / `heroPosition` / A5o 示例 / quiz 干扰项中的 MP 全改 HJ（quiz 正确项仍是 BTN，索引不变）；drill 副标题与目标统一为 UTG/HJ/CO/BTN/SB/BB；`positionQuestions.ts` 的 `SeatId` / `SEAT_LAYOUT` 与 q8 target 同步改 HJ；`shared/types/position.ts` 的 `UTG1` 注释更正为「9 人桌 UTG+1；6-max 无此座位，第二位为 HJ」。zh/en 镜像同批更新，`pnpm academy:manifest` 重生成策略课程摘要。
- **原子单元**：正文 / 选项 / 解析 / 双语 locale 同批改，`contentAlignment` 与 `contentI18n` 守卫保持绿。
- **未覆盖 / 遗留**：策略 L2–L7 牌例中的 MP 座位标签（内部牌例标签，全量替换属独立治理项）不在本批。

### 2026-11-02 理论学院 6-max 现金增补章与核心/增补进度拆分

在九级核心主线之外补齐 6-max 现金局主线，并用「核心章 / 增补章」二分把增补层与解锁、进度解耦——增补章不参与 Level 解锁与核心进度，已解锁的老用户不回锁。

- **数据模型**：`TheoryChapterSummary` 增 `supplemental?: boolean` 与 `pathTags?: TheoryPathTag[]`（six-max / cash / mtt / foundation / preflop / postflop），定义 core = !supplemental；完整章继承摘要。
- **章节组织**：7 个增补章（T1 6-max 牌桌与命名 / T3 盲注战 / T4 6-max 开池范围 / T6 单加注底池 SRP / T6 3-bet 底池 / T6 转河连续下注 / T9 现金综合收束）落在 `variants/standard/chapters/` 的独立单文件；`chapterMeta.ts` 集中维护 `SUPPLEMENTAL_CHAPTER_IDS` 与 `PATH_TAGS` 并幂等打标；`standard/index.ts` 与 `loaders.ts` 按 Level 拼接 core + 增补、`toSorted(order)` 后附实践推荐再打标，loader 新增二次 glob 合并（章节页仍只加载当前 Level 的 chunk）。
- **core/增补语义**：`theoryMeta.ts` 增 core/增补查询与计数（保留 `getTotalChapterCount` 原语义）；`isLevelUnlockedByCompleted` / `isLevelFullyCompleted` 只遍历 core；`getNextChapterSummary` 按「core→同变体下一 core、core→增补回退、增补→扁平下一章」三规则顺延；store 的 `getLevelProgress` / `getTotalProgress` 分子分母只取 core。**persist version 不变、无 migrate**：schema 未变，旧数据与回滚后残留的增补完成 id 均被 core 统计自动忽略。
- **UI**：首页主统计改 core 并新增「6-max 补强 x/y」卡（候选全部锁定则给提示而非死链），`avgScore` 与完成级数只看 core；理论阶梯的活跃 Level、分母、全完成与「下一级」判定全部 core-only，增补章渲染为带「可选」状态的 chip 并显示「6-max 补强 x/y（可选，不影响解锁）」；增补章副标题写明「6-max 现金局补强（可选，不影响解锁）」，`TheoryChapterView` 门禁逻辑不变。
- **摘要与守卫**：`pnpm theory:manifest` 的章节投影透传 `supplemental` / `pathTags`，`manifest.parity` 同步；`theoryIntegrity` 增「`chapters/` 下必须 `supplemental: true`」断言，`theoryProgress.test` 增「仅缺增补章仍解锁下一级」「增补未读仍算 Level 全完成」「下一章三规则」与 core/增补计数用例；新增 `theoryTitleKeys` 守卫（每章 zh/en 目录 key 齐备 + zh 与数据层逐字一致）。
- **i18n**：7 组 `chapterTitle` / `chapterSubtitle` 与 `theory-content` 的 `content` / `quiz` / `chapterObjectives` 双语同批落地（zh 逐字镜像数据原文、en 非空无汉字），并通过 `contentAlignment` / `contentI18n`。

### 2026-11-02 理论学院掌握度卡与学习路径

章末小测此前只有分数徽章，缺掌握度视图与按主题组织的路径。本批补两块**只展示、不门禁**的能力。

- **掌握度**：`utils/theoryMastery.ts` 以 `MASTERY_THRESHOLDS`（mastered 80 / passing 60）、`getMasteryState`、`summarizeMastery` 从既有 `quizScores` 派生已掌握 / 通过 / 待复习 / 未测四项计数与最低分章；`TheoryMasteryCard` 展示计数与「复习最弱一章」CTA（无分时改为继续学习）。
- **学习路径**：`data/theoryPaths.ts` 定义三条静态路径 `sixmax-cash-core` / `postflop-deep` / `mtt-bridge`，成员由 `pathTags` 聚合；`TheoryLearningPaths` 仅标准变体渲染，展示 x/y 进度，CTA 指向首个未完成且已解锁的成员章，下一章锁定显示锁定提示、全部完成显示已完成。
- **不门禁**：两者只读 `quizScores` / `completedChapters`，不新增解锁条件、不改变任何门禁判定（PRD §5.27.2）；`TheoryProgress` 形状不变，**persist version 不递增、不写 migrate**。
- **守卫**：`theoryMastery` 边界用例（79/80、59/60、无分、最低分同分 tie-break）、`theoryPaths` 完整性（路径 id 与成员不重复、成员都带对应 `pathTags`、标题与描述 key 双语齐备）、两个组件的 jsdom 冒烟。
- **门禁**：随 `pnpm verify` 全量执行（typecheck + lint + repo:check + agents:map:check + test），新增 i18n key 双语齐备。
