# AI_GUIDE.md

> AI 代理规范细节（从根 AGENTS.md 下沉，保持根文件精简）。根 AGENTS.md 为总入口与硬约束，本文件为编码 / 状态 / 国际化 / UI/UX 的完整规范，AI 处理相关任务时按需读取。

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

单文件 ≤ 300 行（硬约束）；超过 400 行需拆分为子组件 / 工具函数 / 数据文件。以下类型文件可豁免：zustand store（`create()` 单文件约束）、格式解析器（自包含状态机）、页面级组件（内聚性大于拆分收益）。课程内容数据文件亦可放宽。

### 函数设计

- 工具函数必须是纯函数（便于测试）
- 副作用（emit 事件 / 写 store）集中在 hook 或 store action
- 计算逻辑与渲染逻辑分离


## 状态管理

### Zustand + persist

- 全局状态用 `create()` + `persist()` 中间件，持久化到 `localStorage`
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
- 加载策略：core 模块（布局/导航/全局反馈：nav/common/dashboard/academy/theory/variant/gameVariant/tilt/streak/feedback）由 `config.ts` 启动静态加载；功能模块经 `src/app/routes.tsx` 的 `lazyPage` 随路由与页面 chunk 并行按需加载
- 模块注册表（唯一契约源）：`src/i18n/moduleRegistry.ts`（`I18nModuleKey` / `ALL_MODULES` / `CORE_MODULES` / `FEATURE_GROUPS` / `loadModule`）；懒加载注入由 `src/i18n/preload.ts`（`preloadI18n` 幂等 + `addResourceBundle` 深层合并 + 语言切换自动补加载）实现
- **硬性要求**：新增 i18n key 时必须同时更新 zh 与 en 对应模块文件，缺一不可
- key 命名：`<module>.<context>.<field>`（顶层 key 即模块名，与文件名一一对应）

### 国际化约束

- **新 UI 组件/页面文案必须走 `t()`（useTranslation）**，禁止直接书写中文字面量。
- **必须使用 `defaultValue` 兜底参数**：`t('key', { defaultValue: 'Fallback' })`，确保 key 缺失时不白屏。
- **新增 key 必须同步 zh/en 双语**：`localeParity.test.ts` 按模块自动守护 key 对称性，但人工审查仍需确保两语言对应模块文件同时更新。
- **教学内容数据 i18n 暂缓**：课程正文、测验题目、Drill 题库等数据量大且包含专业扑克知识，i18n 迁移策略需单独评估（翻译质量、双语一致性、维护成本），决策待定。
- **`academy.*` key 分组规范**：遵循 `<module>.<context>.<field>`，与现有 `academy.*` 和 `drills.*` key 不冲突。新增 key 前先查阅 `src/i18n/locales/zh/academy.json` 与 `zh/drills.json` 对应段，避免重复/冲突。


## UI/UX 设计系统

- **色彩**：四层架构（牌桌绿 `--felt-*` / 象牙白 `--ivory-*` / 黄铜金 `--brass-*` / 胡桃木 `--walnut-*`），通过 CSS 变量定义于 `src/styles/globals.css`（色彩 token 实现唯一权威）
- **字体**：Fraunces（serif 标题）/ Inter Tight（sans 正文）/ JetBrains Mono（mono 数字）
- **主题**：暗色为默认，禁止硬编码颜色值
- **响应式**：桌面 ≥1024px / 平板 768-1023px / 移动 <768px
- **可访问性**：遵循 WCAG 2.1 AA，交互元素必须有 `aria-label`，对比度 ≥4.5:1
- **反霓虹硬约束**：禁止 Tailwind 霓虹调色板类（`(bg|text|border|from|to|ring)-(red|green|blue|yellow|purple|...)-d{2,3}`）、纯白/纯黑文字类（`text-white`/`bg-white`/`text-black`）、纯黑白 hex（`#000`/`#fff`）；语义反馈用 `--poker-*` token（映射规则以 `docs/TDD.md` §14.7 为准），SVG 渐变 stop 字面值须注释标注对应 token。由 `src/designTokenGuard.test.ts` 守卫（`pnpm test` 强制），豁免清单只删不加。设计契约权威源为 `poker-ui-demo/DESIGN_LANGUAGE.md`（以其当前版本为准，不维护版本号副本）
- **五级反馈样式**：`GRADE_DISPLAY_CONFIG` 的 color 字段引用 globals.css `.grade-best`~`.grade-blunder` 类（样式唯一事实源），禁止内联霓虹类

