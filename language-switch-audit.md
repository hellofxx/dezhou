# 语言切换滞后更新排查报告（2026-08-12）

## 一、结论摘要

中英文切换后"部分内容立即切换、其他内容滞后更新"由两类根因叠加造成：

1. **机制性滞后（主要根因，P0）**：懒加载翻译模块（feature 模块）在语言切换时异步补加载，资源注入完成后**不触发组件重渲染**，文案滞留 fallback（zh）直到下一次任意交互/渲染。core 模块（静态打包、zh/en 同置内存）经 `languageChanged` 事件即时生效——因此表现为"导航等立即变、页面主体内容滞后"。
2. **永久性不更新（P2）**：13 个组件存在 40+ 处硬编码中文文本，未经 i18n 处理，切换语言后永不变化；另有 1 处 state 缓存翻译字符串（无 UI 消费，潜伏问题）。

以下按排查要求的五个方面逐一说明。

---

## 二、按五个排查方面逐项分析

### 1. 语言切换的状态管理机制是否统一

**现状**：语言切换入口有 3 处，均为 `i18n.changeLanguage(next)` + `updateSettings({ language: next })` 双写：

- `src/layouts/AppLayout.tsx`（顶栏按钮）
- `src/features/progress/components/settings/SettingsPage.tsx`
- `src/app/providers.tsx`（启动时从持久化偏好恢复）

**结论**：状态源统一（i18n 实例为唯一渲染事实源，`settings.language` 仅为持久化偏好），且全部 150+ 处组件经 `useTranslation()` 订阅 i18n 实例的 `languageChanged` 事件，无"组件读 zustand 语言字段但未订阅 i18n"的割裂点。`settings.language` 在 `src/` 下无组件级直接消费（仅 store 内维护），机制本身是统一的。

**唯一例外**：`AppLayout` / `SettingsPage` 调用 `changeLanguage` 时未 `await` 资源补加载，切换是乐观的——这与异步补加载机制（见下）组合形成了滞后表象。

### 2. 异步加载的内容模块是否在语言切换时触发重新渲染 —— 根因所在

**机制**：feature 翻译模块经 `src/i18n/preload.ts` 按需动态 import；语言切换时，`languageChanged` 监听器对"已请求过的模块"异步补加载目标语言资源，完成后调用 `i18n.addResourceBundle` 注入。

**缺陷**（已确认，`node_modules/react-i18next/dist/es/defaults.js`）：
- react-i18next v17 默认 `bindI18n: 'languageChanged'`、`bindI18nStore: ''`；
- `useTranslation` 的 `useSyncExternalStore` 只订阅 `languageChanged`，**不订阅 store 的 `added` 事件**；
- 时序：`changeLanguage('en')` → 组件立即重渲染（en 懒加载资源尚未就绪）→ `t()` 因 `fallbackLng: 'zh'` 返回中文 → 异步资源加载完成 → `addResourceBundle` 注入 → store emit `'added'` → **无组件订阅 → 页面继续显示中文**，直到下一次任意渲染。

而 core 模块（nav/common/dashboard/academy/theory/variant/tilt/streak/feedback）在 `config.ts` 静态打包，zh/en 资源同置内存，`languageChanged` 触发的这一次重渲染即可取到目标语言——故 core 即时切换、feature 滞后，与现象完全吻合。

**修复**：`src/i18n/config.ts` 配置 `react: { bindI18nStore: 'added removed' }`，使 `addResourceBundle` 注入完成后触发所有 `useTranslation` 组件重渲染。已新增回归测试 `src/i18n/languageSwitch.test.tsx` 复现并验证完整时序。

### 3. 是否有些文本被缓存或硬编码而未经过国际化处理

#### 3.1 硬编码中文（切换语言后永不更新）—— 已修复 13 个组件

| 模块 | 文件 | 修复内容 |
|---|---|---|
| gto-simulator | `GTOResultPage.tsx` | 结果页标题/副标题/统计项标签/再练一次/返回首页/EV 损失率/最需改进 Spots/矩阵标题/无数据提示 |
| gto-simulator | `SpotTrainer.tsx` | Spot 练习/返回/加注大小/4 条策略描述 |
| strategy-academy | `LessonQuiz.tsx` | 测验通过/继续加油/答对 X 题/分数/重新测验/题号/正确错误/下一题/查看结果 |
| strategy-academy | `LevelCertification.tsx` | 认证页全部文案（标题/标准/历史/进度提示/按钮/答题反馈） |
| strategy-academy | `ChoiceDrillRenderer.tsx` | 无题提示/完成统计/退出/正确率/正确答案/查看成绩 |
| strategy-academy | `PracticeDrill.tsx` | 难度标签（删除 `DIFFICULTY_LABELS` 硬编码常量）/压力标记/游戏类型/ICM 压力/EV 损失/去复习/对手提示 |
| strategy-academy | `ContentBlock.tsx` | 关键要点/职业牌手说/反直觉点 |
| strategy-academy | `DiagramBlock.tsx` | 手牌示例数据兜底文案 |
| strategy-academy | `HandExample.tsx` | 示例 N/现金桌/锦标赛/SNG/ICM 压力/泡沫期 |
| strategy-academy | `QuickDrill.tsx` | 行尾硬编码全角冒号并入 key |
| progress | `RangeStatsPage.tsx` | 页面标题复用 `nav.rangeTrainer` |
| progress | `GTOStatsPage.tsx` | 页面标题复用 `nav.gtoSimulator` |
| shared | `FreezeChip.tsx` | aria-label 复用 `streak.freeze.label` |

#### 3.2 store 缓存翻译字符串（潜伏问题）

`src/features/hand-history/store.ts` 的 `classifyDBError` 将 `i18n.t()` 结果存入 `dbError` state，切换语言后不更新。当前 `dbError` **无 UI 消费方**（全仓搜索仅在 store.ts 与 locales 出现），未产生可见影响，但属于错误模式，建议后续改为存储错误类型 key、渲染时翻译。

### 4. 组件的更新生命周期是否正确响应语言变更事件

- **`useTranslation` 组件**：全部经 `useSyncExternalStore` 订阅 `languageChanged`，语言切换时正确重渲染（P0 修复后，store `added` 事件也能触发）。`React.memo` 包裹不会阻断此机制（`useSyncExternalStore` 订阅变化强制重渲染，与 memo 无关）。
- **`useMemo` 依赖 `i18n.language`**：`OutsDrill` / `PotOddsDrill` / `HandRankingDrill` / `ProgressPage` 等均在组件内调用 `useTranslation()`，语言变更触发重渲染后 `i18n.language` 为新值，`useMemo` 正确重算。
- **条件渲染 / 延迟加载**：路由级懒加载页面在语言切换时已 mount，不会重新走 `lazyPage` 的 preload；其翻译补加载依赖 `preload.ts` 的 `languageChanged` 监听，而注入后的刷新依赖 P0 修复的 `bindI18nStore`。此链路已修复并经回归测试验证。
- **非响应式 i18n 消费**：全仓 `i18n.t(` 直接调用仅 2 处（preload 测试 + hand-history store 错误分类），`i18n.language` 直接读取仅 7 处且均在 `useTranslation` 订阅上下文中，无遗漏。

### 5. 其他核对项

- **语言选择器** `SettingsPage.tsx` 的 `<SelectItem value="zh">中文</SelectItem>`：语言名按原生语言显示（行业惯例），无需翻译。
- **数据/生成文案层**（`scenarioGenerator` / `strategyCompare` / `useGTOComparison` / `shareCard` / `poker.ts` displayName 等）：属于"动态生成内容"，切换语言后同样不更新。shareCard 已具备 `translations` 参数机制但调用方未全部接入，建议后续专项改造（涉及模板字符串与上下文变量，改造面大，本次未动）。

---

## 三、已实施修复清单

| 类别 | 文件 | 说明 |
|---|---|---|
| P0 根因 | `src/i18n/config.ts` | 配置 `react.bindI18nStore: 'added removed'` |
| 回归测试 | `src/i18n/languageSwitch.test.tsx` | 复现"core 立即切换 / 懒加载 fallback → 注入后自动刷新"全时序 |
| P2 硬编码 | 13 个组件 + `gto`/`academy`/`drills`/`quickDrill` 双语 JSON | 新增 60+ 双语 key |
| 文档 | `docs/TDD.md` §9.1 / `docs/CHANGELOG.md` | 记录语言切换重渲染机制与修复历史 |

**验证**：`pnpm verify` 全量门禁通过（typecheck + lint + 547 tests / 77 files，含新增回归测试）。

## 四、遗留项建议（非本次范围）

1. **数据/生成文案层国际化**：`scenarioGenerator` / `strategyCompare` / `useGTOComparison` / shareCard 调用方 / `poker.ts` displayName——需专项改造为"存数据 key、渲染时翻译"。
2. **hand-history `dbError`**：改为存储错误类型 key（当前无 UI 消费方，优先级低）。
3. **切换体验优化**：可在 `languageChanged` 补加载完成后再触发一次 `i18n.store.emit('added')` 无需额外操作（P0 已覆盖）；若需消除"先 fallback 后跳变"的短暂闪烁，可改为切换前预加载目标语言资源（权衡按钮响应延迟），当前机制已保证最终收敛。
