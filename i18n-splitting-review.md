# 翻译文件拆分方案评估报告

> 评估对象：`src/i18n/` 模块化拆分架构（41 模块 × zh/en = 82 个 JSON 文件）
> 评估维度：文件组织结构 / 键值命名规范 / 模块拆分粒度 / 重复与冗余 / 国际化扩展性

---

## 整体评估

✅ **Good**

该方案采用"单命名空间 + 顶层 key 拆分 + 静态/动态混合加载"的架构，核心设计成熟：类型驱动的注册表契约（`satisfies` 三重校验）、幂等懒加载器、双语对称守卫测试、路由→模块分组映射，均已达到生产级水准。主要风险集中在**模块边界划分语义不一致**（`variant` vs `gameVariant` vs `shortDeck` 三重变体散落）与**键值命名规范不统一**（snake_case / camelCase / 嵌套 vs 扁平混用）两处，建议在下一轮迭代中收敛。

---

## Issue 清单

#### 1. 模块边界语义重叠：变体相关翻译三处分流 🟡

**Location:** `src/i18n/moduleRegistry.ts#L23,L50`、`src/i18n/locales/zh/variant.json#L1-L17`、`src/i18n/locales/zh/gameVariant.json#L1-L12`、`src/i18n/locales/zh/shortDeck.json#L1-L6`

**Analysis:** 变体（game variant）相关的翻译被拆分到三个独立模块文件：
- `variant.json`：变体名称、描述、ELO 概览、切换/选择文案
- `gameVariant.json`：变体标题、切换提示、各变体卡片描述、牌量/人数单位
- `shortDeck.json`：短牌规则差异（仅 4 个 key，最小文件）

三者语义高度重叠且消费方交叉（`variant` 与 `gameVariant` 同属设置页与变体切换组件），`shortDeck` 仅 4 个 key 却独立成文件，粒度过细。新增翻译时开发者难以判断应写入哪个文件，增加协作摩擦。`shortDeck` 既未出现在任何 `FEATURE_GROUPS` 也未在 `CORE_MODULES` 中，属于"未消费保留 key"——拆分后反而成为维护负担。

**Fix Recommendation:**

```json
// FILEPATH: src/i18n/locales/zh/variant.json

// ------ ORIGINAL CODE ------
{
  "name": {
    "standard": "标准德州",
    "short-deck": "短牌德州",
    "heads-up": "单挑"
  },
  "description": {
    "standard": "标准德州扑克，52 张牌，最多 9 人桌",
    "short-deck": "短牌德州，36 张牌（移除 2-5），同花>顺子，AA>KQ",
    "heads-up": "单挑德州，2 人对战，SB 强制 Ante，翻后 SB 先行动"
  },
  "rules_difference": "规则差异",
  "switch_variant": "切换变体",
  "select_variant": "选择游戏变体",
  "eloOverview": "变体 ELO 概览",
  "gamesPlayed": "题"
}
// --------------------------
// ------ NEW CODE ----------
{
  "name": {
    "standard": "标准德州",
    "shortDeck": "短牌德州",
    "headsUp": "单挑"
  },
  "description": {
    "standard": "标准德州扑克，52 张牌，最多 9 人桌",
    "shortDeck": "短牌德州，36 张牌（移除 2-5），同花>顺子，AA>KQ",
    "headsUp": "单挑德州，2 人对战，SB 强制 Ante，翻后 SB 先行动"
  },
  "title": "游戏变体",
  "switchHint": "切换变体后，训练模块的数据和规则将自动调整",
  "switchVariant": "切换变体",
  "selectVariant": "选择游戏变体",
  "eloOverview": "变体 ELO 概览",
  "gamesPlayed": "题",
  "deckSize": "张牌",
  "players": "人",
  "descStandard": "经典52张牌，全球最流行的扑克变体",
  "descShortDeck": "36张牌（6-A），三条>顺子，同花>葫芦",
  "descHeadsUp": "1v1 单挑对决，纯策略博弈",
  "shortDeckRules": {
    "ruleChanges": "规则变化",
    "deckInfo": "36张牌（6-A），移除2-5",
    "straightBeatsTrips": "顺子 > 三条",
    "flushBeatsFullHouse": "同花 > 葫芦"
  }
}
// --------------------------
```

合并后从 `moduleRegistry.ts` 删除 `gameVariant` 与 `shortDeck` 两个 key（`ALL_MODULES` / `loadModule` / `CORE_MODULES` 同步更新），`FEATURE_GROUPS` 中 `gameVariant` 引用改为 `variant`。合并后文件仍 < 40 行，粒度合理。

---

#### 2. 键值命名风格不统一：snake_case 与 camelCase 混用 🟡

**Location:** `src/i18n/locales/zh/variant.json#L12-L14`（snake_case）、`src/i18n/locales/zh/gameVariant.json#L4-L9`（camelCase）、`src/i18n/locales/zh/common.json#L2-L4`（camelCase 扁平）

**Analysis:** 同一项目内键值命名存在两种风格：
- `variant.json`：`rules_difference` / `switch_variant` / `select_variant`（snake_case）
- 其他几乎所有文件：`switchHint` / `descStandard` / `quickStart`（camelCase）

AGENTS.md §国际化要求 key 命名 `<module>.<context>.<field>`，但未明确 case 风格。`variant.json` 的 snake_case 是历史遗留（可能从旧数据迁移），与全项目主流 camelCase 不一致，影响检索一致性与开发者心智模型。此外变体标识符内部也不一致：`variant.name` 用 `short-deck`（kebab-case，对应路由/枚举值），而 `gameVariant` 用 `shortDeck`（camelCase）——同一概念两种 key 形态，`t()` 调用方需记忆两套，易错。

**Fix Recommendation:**

```typescript
// FILEPATH: src/i18n/locales/zh/variant.json

// ------ ORIGINAL CODE ------
{
  "rules_difference": "规则差异",
  "switch_variant": "切换变体",
  "select_variant": "选择游戏变体"
}
// --------------------------
// ------ NEW CODE ----------
{
  "rulesDifference": "规则差异",
  "switchVariant": "切换变体",
  "selectVariant": "选择游戏变体"
}
// --------------------------
```

全项目 grep `t('variant.rules_difference')` / `t('variant.switch_variant')` / `t('variant.select_variant')` 并同步更新调用方。建议在 AGENTS.md §国际化补充一行硬约束："key 一律 camelCase；kebab-case 仅用于与枚举值/路由参数一一对应的动态 key（如 `variant.name['short-deck']`）"。

---

#### 3. 语义重复：快捷键翻译两处维护 🟡

**Location:** `src/i18n/locales/zh/common.json#L36-L43`、`src/i18n/locales/zh/shortcuts.json#L1-L9`

**Analysis:** 快捷键文案同时存在于 `common.shortcuts.*` 与 `shortcuts.*` 两个位置，内容完全相同（fold/call/raise/confirm/exit/toggle 六个 key 逐一对应）。维护时极易遗漏同步，且 `shortcuts` 模块未出现在任何 `FEATURE_GROUPS`，属于未消费保留 key。这是典型的"拆分时未去重"遗留——原 `zh.json` 大文件拆分时，通用快捷键被复制到 `common` 又独立成 `shortcuts.json`。

**Fix Recommendation:**

```json
// FILEPATH: src/i18n/locales/zh/shortcuts.json

// ------ ORIGINAL CODE ------
{
  "title": "键盘快捷键",
  "fold": "弃牌",
  "call": "跟注",
  "raise": "加注",
  "confirm": "确认 / 下一题",
  "exit": "退出训练",
  "toggle": "显示/隐藏快捷键"
}
// --------------------------
// ------ NEW CODE ----------
// 整个文件删除，内容已由 common.shortcuts.* 承载
// --------------------------
```

在 `moduleRegistry.ts` 删除 `shortcuts` key（`I18nModuleKey` / `ALL_MODULES` / `loadModule` 双语），并确认所有调用方使用 `common.shortcutsTitle` + `common.shortcuts.*`。`localeParity.test.ts` 的"文件集合与 ALL_MODULES 一致"断言会自动适配。

---

#### 4. 语义重复：弃牌/跟注/加注基础动作三处定义 🟡

**Location:** `src/i18n/locales/zh/common.json#L2-L4`、`src/i18n/locales/zh/shortcuts.json#L3-L5`、`src/i18n/locales/zh/common.json#L37-L39`（shortcuts 子对象内重复）

**Analysis:** 扑克三大基础动作（fold/call/raise）在 `common.json` 顶层定义一次（`common.fold`），又在 `common.shortcuts.fold` 内带括号中文重复一次（`"Fold（弃牌）"`）。后者实际是快捷键面板的显示文案，但与基础动作语义同源。若未来动作译名调整（如"弃牌"→"盖牌"），需同步改两处。`shortcuts.json` 被删除后（见 Issue 3），此问题收敛为 `common` 内部顶层 vs `shortcuts` 子对象的二重定义。

**Fix Recommendation:**

```json
// FILEPATH: src/i18n/locales/zh/common.json

// ------ ORIGINAL CODE ------
  "shortcuts": {
    "fold": "Fold（弃牌）",
    "call": "Call（跟注）",
    "raise": "Raise（加注）",
    "confirm": "确认 / 下一题",
    "exit": "退出训练",
    "toggle": "显示/隐藏快捷键"
  },
// --------------------------
// ------ NEW CODE ----------
  "shortcuts": {
    "confirm": "确认 / 下一题",
    "exit": "退出训练",
    "toggle": "显示/隐藏快捷键"
  },
// --------------------------
```

快捷键面板渲染时对 fold/call/raise 直接复用 `t('common.fold')` 等，移除 `shortcuts` 子对象内的重复三项。若需保留"英文+中文"双标显示，改为 `t('common.fold')` 拼接静态英文常量（`ACTION_LABELS.en.fold`），不进 i18n。

---

#### 5. 模块粒度失衡：feedback.json 含废弃键未清理 🔴

**Location:** `src/i18n/locales/zh/feedback.json#L8-L10`、`src/i18n/locales/zh/feedback.json#L18-L20`

**Analysis:** `feedback.grade` 与 `feedback.message` 各含三个 `[deprecated]` 标记的废弃键（`optimal` / `acceptable` / `error`），双语对称测试因它们存在而"通过"，但运行时无人消费。根据工作记忆中的 code-review-report HH-01 记录，`gtoDeviation` 早期用 `grade==='optimal'` 导致最优率恒 0%，已修复为 `best`——废弃键是历史五级反馈系统迁移的残留。保留废弃键会：
1. 误导新开发者认为这些 grade 仍有效
2. 增加 `localeParity` 测试的假绿（废弃键双语对称不等于功能完整）
3. 若被误引用会复活已修复的 bug

**Fix Recommendation:**

```json
// FILEPATH: src/i18n/locales/zh/feedback.json

// ------ ORIGINAL CODE ------
{
  "grade": {
    "best": "最优决策！",
    "correct": "正确决策",
    "inaccuracy": "不够精确",
    "wrong": "决策错误",
    "blunder": "严重错误",
    "optimal": "[deprecated] 最优决策！",
    "acceptable": "[deprecated] 可接受决策",
    "error": "[deprecated] 决策错误"
  },
  "message": {
    "best": "最优决策！🌟",
    "correct": "正确！这个决策是合理的",
    "inaccuracy": "不太精确，还有更好的选择",
    "wrong": "这个决策损失了 {{evLoss}} BB",
    "blunder": "严重错误！损失了 {{evLoss}} BB",
    "optimal": "[deprecated] 最优决策！",
    "acceptable": "[deprecated] 不错，但还有更好的选择",
    "error": "[deprecated] 这个决策损失了 {{evLoss}} BB"
  }
}
// --------------------------
// ------ NEW CODE ----------
{
  "grade": {
    "best": "最优决策！",
    "correct": "正确决策",
    "inaccuracy": "不够精确",
    "wrong": "决策错误",
    "blunder": "严重错误"
  },
  "message": {
    "best": "最优决策！🌟",
    "correct": "正确！这个决策是合理的",
    "inaccuracy": "不太精确，还有更好的选择",
    "wrong": "这个决策损失了 {{evLoss}} BB",
    "blunder": "严重错误！损失了 {{evLoss}} BB"
  }
}
// --------------------------
```

删除前 grep 全仓 `t('feedback.grade.optimal')` / `t('feedback.message.acceptable')` 等确认零引用，`en/feedback.json` 同步删除。这是唯一建议立即清理的 🔴 项——废弃键复活即 bug。

---

#### 6. 未消费模块占比偏高：9/41 模块无路由引用 🟡

**Location:** `src/i18n/moduleRegistry.ts#L53-L95`（ALL_MODULES 全集）、`src/i18n/moduleRegistry.ts#L119-L164`（FEATURE_GROUPS 引用面）

**Analysis:** 41 个模块中有 9 个（`adaptive` / `app` / `dailyPlan` / `localTrack` / `opponent` / `opponentDrill` / `shortcuts` / `shortDeck` / `toast`）未出现在任何 `FEATURE_GROUPS`，占比 22%。工作记忆记录显示这些是"防破坏未来功能保留"——但其中：
- `shortcuts` / `shortDeck`：建议随 Issue 1/3 合并删除
- `adaptive` / `opponent` / `opponentDrill` / `localTrack` / `dailyPlan` / `toast` / `app`：需确认是否有规划中的功能消费

保留未消费模块会增加 `localeParity` 测试的维护成本（每次新增 key 需同步 9 个"僵尸文件"双语），且 `loadModule` 为每个未消费模块生成了动态 import 字面量——Vite 会为其产出独立 chunk，虽然按需不加载，但增加构建产物文件数与 sourcemap 噪声。

**Fix Recommendation:**

```typescript
// FILEPATH: src/i18n/moduleRegistry.ts

// ------ ORIGINAL CODE ------
export const ALL_MODULES = [
  'academy',
  'achievements',
  'adaptive',
  'app',
  'common',
  'dailyChallenge',
  'dailyPlan',
  'localTrack',
  'opponent',
  'opponentDrill',
  'shortcuts',
  'shortDeck',
  'toast',
  'variant',
] as const satisfies readonly I18nModuleKey[];
// --------------------------
// ------ NEW CODE ----------
// 未消费模块集中到末尾并加注释分区，便于未来清理决策
export const ALL_MODULES = [
  // === 活跃模块（被 FEATURE_GROUPS 或 CORE_MODULES 引用） ===
  'academy',
  'achievements',
  'common',
  'dailyChallenge',
  'dashboard',
  'downswing',
  'drills',
  'elo',
  'feedback',
  'gameVariant',
  'gto',
  'handHistory',
  'help',
  'leaderboard',
  'mentor',
  'mood',
  'nav',
  'onboarding',
  'potOdds',
  'progress',
  'puzzle',
  'quickDrill',
  'rangeTrainer',
  'rankUp',
  'review',
  'sessionLimit',
  'settings',
  'spacedRepetition',
  'streak',
  'theory',
  'tilt',
  'variant',
  // === 未消费保留模块（无 FEATURE_GROUPS 引用，规划中功能或待清理） ===
  // 清理准则：连续 2 个版本无规划消费即删除文件 + 注册表 key
  'adaptive',
  'app',
  'dailyPlan',
  'localTrack',
  'opponent',
  'opponentDrill',
  'toast',
] as const satisfies readonly I18nModuleKey[];
// --------------------------
```

（注：`shortcuts` / `shortDeck` 随 Issue 1/3 合并后从全集移除。）建议在 `preload.test.ts` 增加一条测试：断言"活跃模块集合 = CORE_MODULES ∪ FEATURE_GROUPS 引用面"，对未消费模块单独列出并加版本标记，CI 可在发版前提示清理。

---

#### 7. 命名空间扁平与嵌套混用：common.json 顶层散落动作与操作词 🟡

**Location:** `src/i18n/locales/zh/common.json#L2-L4`（动作）、`src/i18n/locales/zh/common.json#L11-L35`（操作词扁平）

**Analysis:** `common.json` 顶层混合了三类语义：
- 扑克动作（`fold` / `call` / `raise` / `allIn`）——语义属"游戏术语"
- 通用操作词（`start` / `pause` / `reset` / `back` / `next` / `confirm` / `cancel` / `save` / `delete` / `retry` / `close`）——语义属"UI 操作"
- 组件文案（`resultSummary.*` / `errorBoundary.*` / `shortcuts.*`）——已按上下文嵌套

扁平的顶层 key 在文件增长后检索困难，且动作词与操作词混排会让"新增通用 key 时放哪"缺乏明确指引。主流方案（如 i18next 官方建议）推荐 `common.<context>.<field>` 二级嵌套以保持语义聚类。

**Fix Recommendation:**

```json
// FILEPATH: src/i18n/locales/zh/common.json

// ------ ORIGINAL CODE ------
{
  "fold": "弃牌",
  "call": "跟注",
  "raise": "加注",
  "positionGroup": { ... },
  "active": "激活",
  "resultSummary": { ... },
  "allIn": "全下",
  "start": "开始",
  "pause": "暂停",
  "reset": "重置",
  "back": "返回",
  "next": "下一步",
  "comingSoon": "即将推出",
  "loading": "加载中...",
  "confirm": "确认",
  "cancel": "取消",
  "save": "保存",
  "delete": "删除",
  "retry": "再来一次",
  "backHome": "返回首页",
  "shortcuts": { ... },
  "close": "关闭",
  "shortcutsTitle": "键盘快捷键",
  "errorBoundary": { ... }
}
// --------------------------
// ------ NEW CODE ----------
{
  "action": {
    "fold": "弃牌",
    "call": "跟注",
    "raise": "加注",
    "allIn": "全下"
  },
  "ui": {
    "start": "开始",
    "pause": "暂停",
    "reset": "重置",
    "back": "返回",
    "next": "下一步",
    "comingSoon": "即将推出",
    "loading": "加载中...",
    "confirm": "确认",
    "cancel": "取消",
    "save": "保存",
    "delete": "删除",
    "retry": "再来一次",
    "backHome": "返回首页",
    "close": "关闭",
    "active": "激活"
  },
  "positionGroup": { ... },
  "resultSummary": { ... },
  "shortcuts": { ... },
  "shortcutsTitle": "键盘快捷键",
  "errorBoundary": { ... }
}
// --------------------------
```

此重构涉及全项目 `t('common.fold')` → `t('common.action.fold')` 的大量调用方迁移，建议作为独立技术债迭代执行，配套 codemod 脚本批量替换 + `localeParity` 守卫。短期可暂缓，但应在 AGENTS.md 记录"common 新增 key 须按 `action.*` / `ui.*` 嵌套"的约束，逐步收敛。

---

## 与主流方案的对比评价

| 维度 | 本项目方案 | i18next 官方推荐 | 行业常见实践 |
|---|---|---|---|
| 命名空间 | 单 `translation` + 顶层 key 拆分文件 | 多 ns（`common.json` / `errors.json`） | 单 ns + 模块化 key（多数中小项目） |
| 按需加载 | 路由分组 + 动态 import chunk | backend plugin 或 lazy ns | 路由级懒加载（Next.js/i18n-router） |
| 双语对称 | `localeParity.test.ts` 逐模块扁平化断言 | 无内置，需自建 | i18next-parser + CI 脚本 |
| 类型安全 | `satisfies` 三重校验（key/loader/core） | 无内置 | TypeScript codegen（i18next-typescript） |
| 语言切换 | `touchedKeys` 自动补加载 | `loadLanguages` + 后端 | 全量预加载或按 ns 切换 |

**评价**：本方案在"单 ns 拆分 + 类型契约 + 双语守卫"三点的工程化程度**高于行业平均水平**，尤其 `satisfies` 三重校验与 `localeParity` 逐模块断言是亮点。主要差距在于：
1. 未采用 i18next 多 ns（会改变 `t('a.b')` 调用为 `t('common:a.b')`，迁移成本高，当前单 ns 方案可接受）
2. 缺少 i18next-parser 自动提取 key（依赖人工维护双语，`localeParity` 兜底但无法发现"双方都缺"的 key）

---

## 优化建议优先级

| 优先级 | Issue | 收益 | 成本 |
|---|---|---|---|
| 🔴 P0 | Issue 5（清理 feedback 废弃键） | 消除 bug 复活风险 | 低（grep + 删 6 key） |
| 🟡 P1 | Issue 3（删除重复 shortcuts.json） | 去重，减少 1 模块 | 低 |
| 🟡 P1 | Issue 1（合并变体三分流） | 边界清晰，减少 2 模块 | 中（调用方迁移） |
| 🟡 P2 | Issue 2（统一 camelCase） | 命名一致性 | 中（grep + 调用方） |
| 🟡 P2 | Issue 6（未消费模块治理） | 构建产物瘦身 | 低（注释分区 + 测试） |
| 🟡 P3 | Issue 4（common 动作词去重） | 消除 shortcuts 内重复 | 低 |
| 🟡 P3 | Issue 7（common 嵌套重构） | 长期可维护性 | 高（全项目迁移） |

---

## 结论

该翻译文件拆分方案**整体合理且工程化程度高**，核心架构（注册表契约 + 幂等懒加载 + 双语守卫）无需调整。优化重点应放在**模块边界语义收敛**（变体三分流合并、shortcuts 去重）与**废弃键清理**（feedback deprecated）两处，这两项是低投入高回报的"卫生整改"。命名风格统一与 common 嵌套重构属于中长期技术债，建议结合下一次 i18n 大改动（如新增第三语言时）一并处理，届时可顺带引入 i18next-parser 自动提取补全"双方都缺 key"的守卫盲区。
