# 变更日志（CHANGELOG）

> 本文件归档德州扑克训练平台的版本演进。
> 历史月份存档位于 `docs/changelog/` 目录下（如 `docs/changelog/2026-07.md`）。
> PRD.md 与 TDD.md 仅保留当前规格，执行历史统一汇集于此。

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
