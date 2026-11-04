# AI_GUIDE.md

> 状态：Current · 最后复核：2026-11-04。根 `AGENTS.md` 为总入口与硬约束；本文件是编码 / 状态 / 国际化 / UI/UX 的详细规范，AI 处理相关任务时按需读取。

---

## 编码规范

### TypeScript

- `strict: true` + `noUncheckedIndexedAccess` + `noUnusedLocals` + `noUnusedParameters`
- 路径别名：`@/*` → `./src/*`
- 禁止 `any`；必要时用 `unknown` + 类型守卫
- 公共 API 必须有显式返回类型

### 命名

| 类别 | 约定 | 示例 |
|---|---|---|
| 组件 | PascalCase.tsx | `RangeGrid.tsx` |
| Hook | camelCase.ts（use 前缀） | `useQuizEngine.ts` |
| 工具 | camelCase.ts | `rangeParser.ts` |
| 路由 | kebab-case | `/pot-odds/quiz` |
| i18n key | 模块前缀 + camelCase | `range.quiz.correct` |

### 文件大小

单文件目标 ≤ 300 行。守卫 `src/guards/line-count-guard.test.ts` 分三档判定：

- ≤ 300 行：合规
- 300–400 行：灰区，守卫以 `console.warn` 输出清单，不阻断 CI
- > 400 行：硬失败，必须拆分为子组件 / 工具函数 / 数据文件

既有超大文件采用**逐文件 allowlist 棘轮**（`LEGACY_OVERSIZED_FILES`）：每个条目记录登记时的实测行数作为 `maxLines`，**只减不增**——文件继续增长即失败；拆分回到 400 行以内后必须删除条目（条目指向已合规文件同样变红）。禁止恢复目录 / 类别级宽泛豁免（`/data/`、`/utils/`、`store.ts`、页面组件名枚举等曾使全部超大文件绕过守卫）。新增文件不得登记 allowlist，只能拆分。

**唯一例外：理论题库纯数据文件**。`features/theory-academy/data/levels/variants/standard/quizBank/t*.ts` 是逐 Level 的纯数据文件，体积随题量增长；它们走 `QUIZ_BANK_ALLOWLIST`（精确路径、逐文件 `maxLines`、只减不增）并从通用硬失败扫描中排除。该例外仅限 quizBank 数据文件，不构成目录/类别级豁免，也不适用于逻辑或 UI 文件；新增题库文件必须登记且不能超过登记行数。

CSS 单文件上限 800 行，由 `src/guards/cssLineCountGuard.test.ts` 守卫（平铺扫描 `src/styles/*.css`，Phase 2 拆分的分片文件同样平铺）；`globals.css` 为 Phase 2 拆分前的临时豁免，上限锁定在 `CSS_ALLOWLIST` 中的当前行数，同样只减不增。

### 函数设计

- 工具函数必须是纯函数（便于测试）
- 副作用（emit 事件 / 写 store）集中在 hook 或 store action
- 计算逻辑与渲染逻辑分离

### React 渲染约定

- **数组不可变性**：排序/反转/删除链优先用不可变 API（`toSorted()` / `toReversed()` / `toSpliced()`），禁止对源数组原地 `.sort()`。
- **条件渲染**：条件为数值/字符串等非布尔值时用三元（`count > 0 ? <X/> : null`），禁止 `count && <X/>`；布尔条件可用 `&&`。
- **Effect 治理**：可由 props/state 派生的值禁止用 `useEffect` + `setState` 回写；交互触发的副作用放事件处理器。
- **组件定义**：禁止在组件内部定义组件（导致每次渲染重挂载与状态丢失），内部子组件提取到模块级。
- **事件监听器**：`addEventListener` 必须在 `useEffect` 内注册并 cleanup；滚动/触摸类监听须传 `{ passive: true }`。


## 状态管理

### Zustand + persist

- 全局状态用 `create()` + `persist()` 中间件，持久化到 `localStorage`
- 禁止裸调 `localStorage.getItem / setItem`；所有持久化经 zustand persist（自动版本化 + migrate）
- 大数据（牌局）用 IndexedDB
- 每个 store 必须有 `name` 与 `version` 字段

persist `version` 数值以各 store 代码中的 `persist` 配置为唯一事实源，本文档不维护数值副本。下表 `name` 仅作快速索引，不替代代码事实源：

| Store | version 事实源 | name |
|---|---|---|
| progress | `src/features/progress/store.ts` | poker-training-progress |
| puzzle-trainer | `src/features/puzzle-trainer/store.ts` | puzzle-trainer-store |
| strategy-academy | `src/features/strategy-academy/store.ts` | strategy-academy-progress |
| theory-academy | `src/features/theory-academy/store.ts` | theory-academy-progress |

### Persist Version 升级硬性规则

1. 递增 `version`
2. 编写 `migrate(persistedState, fromVersion)` 函数
3. migrate 必须防御性合并默认值（`{ ...DEFAULT_X, ...persisted.x }`），不触碰已有字段
4. 老用户数据零丢失，首次加载自动迁移
5. persist version 数值以 store 代码为唯一事实源，文档与子代理文件不维护数值副本（无需同步数值）
6. 在 `docs/CHANGELOG.md` 的"数据迁移"小节记录

### 幂等性

`recordTrainingDay()` / `recordQuickDrillCompletion()` / `markDailyCompleted()` 等"记录完成"action 必须幂等（同一日重复调用不重复计数）。


## 国际化

- 默认中文（zh），支持 zh / en
- 翻译文件按顶层 key 模块化拆分：`src/i18n/locales/{zh,en}/<module>.json`（如 `zh/rangeTrainer.json`、`en/academy.json`），单一 `translation` 命名空间，`t('a.b.c')` 路径式调用不变
- 加载策略：core 模块（nav / common / dashboard / variant / tilt / streak / feedback / mentor）由 `config.ts` 启动静态加载；academy / theory / academy-course 及其余功能模块经 `src/app/routes.tsx` 的 `lazyPage` 随路由与页面 chunk 并行按需加载。core 清单以 `src/i18n/moduleRegistry.ts` 的 `CORE_MODULES` 为唯一事实源。
- 模块注册表（唯一契约源）：`src/i18n/moduleRegistry.ts`（`I18nModuleKey` / `ALL_MODULES` / `CORE_MODULES` / `FEATURE_GROUPS` / `loadModule`）；懒加载注入由 `src/i18n/preload.ts`（`preloadI18n` 幂等 + `addResourceBundle` 深层合并 + 语言切换自动补加载）实现
- **硬性要求**：新增 i18n key 时必须同时更新 zh 与 en 对应模块文件，缺一不可
- key 命名：`<module>.<context>.<field>`（顶层 key 即模块名，与文件名一一对应）

### 国际化约束

- **新 UI 组件/页面文案必须走 `t()`（useTranslation）**，禁止直接书写中文字面量。
- **必须使用 `defaultValue` 兜底参数**：`t('key', { defaultValue: 'Fallback' })`，确保 key 缺失时不白屏。
- **新增 key 必须同步 zh/en 双语**：`localeParity.test.ts` 按模块自动守护 key 对称性，但人工审查仍需确保两语言对应模块文件同时更新。
- **课程内容 i18n**：策略学院 / 理论学院的正文、题目、解析按 `academy-course` / `theory-content` 分文件维护；zh 侧保留与原文逐字一致的镜像 key，新增 / 修改必须同批同步 zh 与 en（见 `AGENTS.md` §国际化 与 PRD §12.4.3）。
- **`academy.*` key 分组规范**：遵循 `<module>.<context>.<field>`，与现有 `academy.*` 和 `drills.*` key 不冲突。新增 key 前先查阅 `src/i18n/locales/zh/academy.json` 与 `zh/drills.json` 对应段，避免重复/冲突。
- **key 命名**：静态 key 一律 camelCase（如 `selectVariant` / `rulesDifference`）；kebab-case 仅用于与枚举值 / 路由参数一一对应的动态 key（如 `variant.name.short-deck`）。
- **模块注册表**：`src/i18n/moduleRegistry.ts` 是唯一契约源；模块增删须同步 `I18nModuleKey` / `ALL_MODULES` / `loadModule`（/ `CORE_MODULES` / `FEATURE_GROUPS`）。
- **课程内容双轨**：数据层保留中文原文 + 渲染层 i18n key 覆盖，zh 侧存在与原文逐字一致的镜像 key；新增/修改课程文本必须同批同步 zh 与 en。正文 / 选项 / 解析 / 小测 / 双语 locale 是**同一原子变更单元**（规则见 PRD §6.7.4，口径见 §12.4.3）。
- **理论学院内容分层**：`theory.json` 只保留目录/UI；正文/小测/目标按 level 拆分于 `src/i18n/locales/<lng>/theory-content/`，由章节页/复习出口经 `i18n/theoryContent.ts` 按需加载。首页/store 只读 `data/levels/manifest` 摘要，禁止静态引用完整 `data/levels/variants/**`。**6-max 现金增补章**位于 `data/levels/variants/standard/chapters/`，目录摘要透传 `supplemental` / `pathTags`；增补章不计入 Level 解锁与核心进度（core = `!supplemental`），完成增补章不回锁，数据改动后须运行 `pnpm theory:manifest`。
- **策略学院加载分层**：首页/store/轨道/图谱只读 `data/lessons/manifest` 摘要；完整课程经 `data/lessons/loaders.ts` 按 Level/变体懒载。`academy-course` 文案由 `i18n/academyCourse.ts` 按文件加载，路由入口禁止整批 `loadAcademyCourses`。
- **复习类持久状态必须存 i18n key**（SRS 队列的 label 与 `metadata.front/back` 等），禁止存任何语言的原文；且渲染于首页的复习界面必须保证来源包按需可得——两者是**配对要求**，只做其一比原状更糟（PRD §12.4.3）。


## UI/UX 设计系统

- **色彩**：四层架构（牌桌绿 `--felt-*` / 象牙白 `--ivory-*` / 黄铜金 `--brass-*` / 胡桃木 `--walnut-*`），通过 CSS 变量定义于 `src/styles/globals.css`（色彩 token 实现唯一权威）
- **字体**：Fraunces（serif 标题）/ Inter Tight（sans 正文）/ JetBrains Mono（mono 数字）
- **主题**：暗色为默认，另支持浅色「白天牌室」（light token / 补丁白名单见 DESIGN.md §2.8）；禁止硬编码颜色值
- **响应式**：桌面 ≥1024px / 平板 768-1023px / 移动 <768px
- **可访问性**：遵循 WCAG 2.1 AA，交互元素必须有 `aria-label`，对比度 ≥4.5:1
- **反霓虹硬约束**：禁止 Tailwind 霓虹调色板类（`(bg|text|border|from|to|ring)-(red|green|blue|yellow|purple|...)-d{2,3}`）、纯白/纯黑文字类（`text-white`/`bg-white`/`text-black`）、纯黑白 hex（`#000`/`#fff`）；语义反馈用 `--poker-*` token（映射规则以 `docs/TDD.md` §14.7 为准），SVG 渐变 stop 字面值须注释标注对应 token。由 `src/guards/designTokenGuard.test.ts` 守卫（`pnpm test` 强制），豁免清单只删不加。设计契约权威源为 `DESIGN.md`（以其当前版本为准，不维护版本号副本）
- **五级反馈样式**：`GRADE_DISPLAY_CONFIG` 的 color 字段引用 globals.css `.grade-best`~`.grade-blunder` 类（样式唯一事实源），禁止内联霓虹类
- **设计契约权威源**：`DESIGN.md`（以其当前版本为准）；组件视觉、布局、动效与可访问性决策均以其为准。

## 跨模块复用契约

> 以下是所有训练模块共享的横向契约；单项事实源以文中路径为准，模块不得自行复制实现。

### 五级反馈

- `DecisionGrade = 'best' | 'correct' | 'inaccuracy' | 'wrong' | 'blunder'`；阈值以 `shared/types/decisionFeedback.ts` 的 `GRADE_THRESHOLDS` 为唯一事实源。
- 评级函数 `calculateGrade(evLoss)`；边界归入更严重等级；`buildDecisionFeedback` 必须内部调用 `calculateGrade`，禁止用 `isCorrect` 掩盖真实 EV 损失。
- 所有训练模块必须复用此系统，禁止自定义评级。theory-academy 章末小测为概念判断题，恒以「正确 / 错误 + 解析」二态呈现（PRD §5.9.2 / §5.27.5）。
- **呈现诚实性**：选项无真实 EV 标定时不得渲染五级徽章与 EV 数值；覆盖率由 `strategy-academy/utils/evCalibration.test.ts` 棘轮追踪（PRD §6.7.1）。

### 反馈闭环

- **正向（训练→课程）**：range-trainer / pot-odds / gto-simulator / puzzle-trainer 的答题反馈必须携带 `relatedLessonId`，wrong/blunder 显示「去复习」链接。推导入口：`inferRelatedLessonId(position, actionType)`、GTO 按 `scenario.street`、`inferPuzzleLessonId(theme)`。
- **反向（数据→难度）**：`progress.shouldDownshiftDifficulty()`（无参）是自适应难度唯一入口，禁止模块自行判定；数据源为 `progress.emotion.consecutiveWrongCount`（由 `recordAnswer(isCorrect)` 维护）。

### 位置渐进解锁

- 阈值常量 `POSITION_UNLOCK_THRESHOLDS` 在 `range-trainer/constants.ts`（文档不维护数值副本）；工具函数 `isPositionUnlocked(position, preflopElo)`；调用方 `RangeSelector` 渲染时过滤锁定位置；阈值变更记录到 `docs/CHANGELOG.md`。

### 答题选项排序治理

- 所有选择题选项必须经统一排序，禁止按题库原序渲染。分流：动作类按语义固定（消极→激进）；纯数值单调排列；文字陈述按 `hash(题目id)` 种子洗牌；认证考试用会话随机种子。
- 共享工具 `shared/utils/seededShuffle.ts`；模块出口：puzzle-trainer `utils/optionOrder.ts`、strategy-academy `utils/quizShuffle.ts`、pot-odds / theory-academy `utils/quizOrder.ts`。
- 源题库静态数据不手改重排；i18n-key 型题库须在 `t()` 解析后重排，顺序不得随语言变化；重排必须同步重映射正确答案；新增题库须经模块排序出口并补分布守卫。每日谜题同一天所有用户题目与顺序一致。

### 导师人格化

- 三种风格：`strict-math` / `old-school` / `encouraging`；模板 `MENTOR_FEEDBACK_TEMPLATES`（`shared/constants/mentorStyles.ts`）；渲染 `renderMentorFeedback(mentorStyle, grade, params)`；QuizCard / GTOFeedback 优先调用，缺省降级到 i18n。

### 事件总线

- 实现 `src/shared/stores/trainingEvents.ts`；feature 完成训练后必须 `trainingEvents.emit(event)`，progress store 自动订阅更新统计。hand-history 为复盘分析工具而非交互式训练，合理豁免 emit（见其 store.ts 顶部说明与 CHANGELOG）。
- 五大系统的「记录」action 在答题/反馈环节同步调用（不走事件总线）：Streak / ELO / SRS / Emotion 直接记录，Mentor 经 `renderMentorFeedback` 渲染。

### 调试解锁

- 实现 `src/shared/stores/debugMode.ts`（独立 persist store，不并入 progress）；激活码常量以该文件为唯一事实源。
- 全局旁路共 9 处：strategy-academy 的 `isLevelUnlocked` / `isLevelEntryUnlocked`、`ConceptGraph` 本土课节点（`isLocalLessonUnlocked`）、CourseView 本土课与课程级门禁、`LearningTracksView` 轨道前置；range-trainer `RangeSelector` / `QuizConfig` 位置解锁；progress `SessionLimitGuard` 每日题量上限；theory-academy `isTheoryLevelUnlocked` / `TheoryChapterView` 章节直达门禁。
- 短路接法：store/纯逻辑用 `isDebugUnlockActive()`；组件内用 `useDebugModeStore((s) => s.unlockAll)`。新增门禁须同步接入；onboarding 不纳入解锁范围（PRD 5.6.6 / TDD 5.9）。
