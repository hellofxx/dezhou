# 变更日志（CHANGELOG）

> 本文件归档德州扑克训练平台的版本演进。
> 历史月份存档位于 `docs/changelog/` 目录下（如 `docs/changelog/2026-07.md`）。
> PRD.md 与 TDD.md 仅保留当前规格，执行历史统一汇集于此。

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
