# 中英文切换滞后更新 —— 修复方案（含子代理协作）与执行记录

> 状态：**已执行完毕**。本文档为已完成修复的可追溯方案记录，包含根因分析、子代理协作分工、改动清单与验证结果。
> 关联排查报告：`language-switch-audit.md`；版本演进：`docs/CHANGELOG.md`（Unreleased · 语言切换滞后更新修复 2026-08-12）。

---

## 1. 问题定义

点击中英文切换按钮后，部分内容**立即切换**，而其他内容**滞后更新**（甚至滞留原语言）。

四条排查方向（用户给定）：

1. 语言切换状态管理是否统一、所有国际化组件是否订阅相同变更通知
2. 异步加载模块是否在切换时触发重渲染
3. 是否存在缓存/硬编码文本未走 i18n
4. 组件生命周期是否正确响应语言变更（尤其条件渲染与懒加载）

## 2. 根因分析

### P0 · 机制性滞后（主根因，对应排查方向 1/2/4）

- react-i18next v17 默认 `bindI18n: 'languageChanged'`、**`bindI18nStore: ''`**。
- `useTranslation` 组件只订阅 `languageChanged` 事件。
- 语言切换时：core 模块（zh/en 静态打包、同置内存）**即时生效**；feature 懒加载模块由 `src/i18n/preload.ts` 的 `languageChanged` 监听器**异步补加载**。
- `addResourceBundle` 注入完成后，`ResourceStore` emit `added` 事件——但组件未订阅，故**不触发重渲染**，文案滞留 fallback（zh）直到下一次任意渲染。
- 表现即"导航立即变、页面主体滞后"。

### P2 · 硬编码文案（对应排查方向 3）

13 个组件存在 40+ 处硬编码中文，走不到 `t()`，语言切换永不更新。

## 3. 修复方案

### P0 · 机制修复

`src/i18n/config.ts` 的 init 配置增加：

```ts
react: {
  // 订阅 store 的 added/removed 事件，资源注入即触发所有 useTranslation 组件重渲染
  bindI18nStore: 'added removed',
},
```

### P2 · 硬编码清理

| 模块 | 组件 | 处理 |
|---|---|---|
| gto | `GTOResultPage` / `SpotTrainer` | 新增 `gto.result.*` / `gto.spot.*` 双语 key |
| strategy-academy | `LessonQuiz` / `LevelCertification` | 新增 `academy.quiz.*` / `academy.levelCertification.*` |
| strategy-academy | `ChoiceDrillRenderer` | 新增 `drills.common.*` |
| strategy-academy | `PracticeDrill` | 删 `DIFFICULTY_LABELS` 常量，改 `academy.difficulty.<level>` 动态 key |
| strategy-academy | `ContentBlock` / `DiagramBlock` / `HandExample` / `QuickDrill` | 新增 `academy.content.*` / `academy.drill.*` / `academy.gameContext.*` / `quickDrill.*`（全角冒号并入 key） |
| progress | `RangeStatsPage` / `GTOStatsPage` | 复用 `nav.rangeTrainer` / `nav.gtoSimulator` |
| shared | `FreezeChip` | aria-label 改 `streak.freeze.label` |

## 4. 子代理协作分工

| 子代理 | 职责 | 产出 |
|---|---|---|
| `platform-dev` | i18n 架构 / config / preload / moduleRegistry 机制层 | P0 配置修复、回归测试 `languageSwitch.test.tsx` |
| `gto-simulator-dev` | gto 模块组件国际化 | GTOResultPage / SpotTrainer + `gto.json` key |
| `strategy-academy-dev` | 课程/测验/Drill/内容块国际化 | 9 个组件 + `academy.json`/`drills.json`/`quickDrill.json` key |
| `progress-dev` | 统计页导航文案复用 | RangeStatsPage / GTOStatsPage |
| `ui-ux-dev` | 全局视觉/文案一致性复核 | 无文本回归（全角冒号随 key 迁移） |
| `platform-dev`（复核） | `pnpm verify` 门禁 | typecheck + lint + 547 tests / 77 files 全通过 |

## 5. 回归测试与验证

- 新增 `src/i18n/languageSwitch.test.tsx`：复现并断言完整时序——
  core 立即切换 → 懒加载 fallback 滞留 → `addResourceBundle` 注入后自动刷新。
- `pnpm verify` 全量门禁通过：**typecheck + lint + 77 files / 547 tests**。

## 6. 文档同步

- `docs/CHANGELOG.md`：新增"语言切换滞后更新修复（2026-08-12）"条目
- `docs/TDD.md` §9.1：补充语言切换重渲染机制
- 根目录 `language-switch-audit.md`：完整排查报告
- `.codebuddy/memory/2026-08-12.md`：工作记忆写入
- `.claude/agents` 子代理文件：模块级约束不变，无需同步

## 7. 遗留建议（执行状态：已落地 2026-08-12）

> 本批三项遗留建议已在「语言切换遗留建议执行」中落地（代码 + 测试 + 文档，详见 docs/CHANGELOG.md），验证：`pnpm verify` 全量通过（typecheck + lint + 551 tests / 78 files）。

| # | 建议 | 执行结果 |
|---|---|---|
| 1 | 数据/生成文案层硬编码 | **部分落地**：gto 运行时生成文案已 key 化（`DecisionNode.descriptionKey` / `getEasyGTOScenario` / `strategyCompare.explanation`）、`displayName` 已删除。strategy-academy / theory-academy 课程正文（约 1.3MB+）超大规模，单独产出 `content-i18n-roadmap.md` 分阶段方案，不并入本次。 |
| 2 | hand-history `dbError` | **已落地**：改存 `DBErrorType` key（`'quotaExceeded' | 'unavailable' | 'generic'`），`classifyDBError` 不再 `i18n.t()`；`HandHistoryList` 新增错误提示条渲染时 `t('handHistory.dbError.' + type)`。 |
| 3 | 切换体验 | **已落地**：`preload.ts` 新增 `switchLanguage(next)` 先预加载目标语言再切换，`AppLayout` 三处按钮与 `SettingsPage` 接入（切换中禁用 + 加载动画）。 |
