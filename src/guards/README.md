# src/guards — 全局不变式守卫

本目录存放**跨模块 / 全仓范围**的不变式测试。判定对象是「整个 src 或全仓契约」，不属于任何单个 feature 模块，因此放在 feature 目录之外：

- 归属 feature 模块的数据完整性守卫（课程结构 / 题库 id / 选项排序分布等）留在各自模块内，不进本目录。
- i18n 相关全局守卫（`localeParity` / `staticKeyGuard` / `contentAlignment` 等）与 i18n 资源同处 `src/i18n/`，便于就近读取 locale 结构。
- 其他位置已存在的守卫（如 `src/shared/admission-guard.test.ts`）保持原位，不做迁移。

## 守卫清单

| 文件 | 保护的不变式 | 运行命令 |
|---|---|---|
| `dealerSlip.contrast.test.ts` | 发牌员纸条（`.dealer-slip`）文字的 WCAG AA 对比度：`--paper-ink` 于 `--paper` ≥ 7:1，次级/语义色 ≥ 4.5:1；暗色与 light 两套主题同样达标；`.dealer-slip` 把 canonical 与 alias token 重锚到 paper 深阶 | `pnpm test src/guards/dealerSlip.contrast.test.ts` |
| `feltContrast.test.ts` | 暗底房间与纸条文本的 WCAG AA 对比度（token 层）：`--ivory-muted` / `--clay-text` / `--danger-text` / `--sage-text` / `--brass-text` 于 `--felt`、`--felt-raised` ≥ 4.5:1；`--clay-text` 于 `--clay` 15% 复合底、`--danger-text` 于 `--danger-bg` 复合底 ≥ 4.5:1；paper 四色于 `--paper` ≥ 4.5:1 且 `.dealer-slip` 把四个文本语义 token 重锚到对应 paper 深阶；light 主题四个文本 token 于 light `--paper` / `--paper-raised` ≥ 4.5:1 | `pnpm test src/guards/feltContrast.test.ts` |
| `designTokenGuard.test.ts` | 全仓源码（`src/**/*.{ts,tsx}`）无 Tailwind 霓虹调色板类、无纯白/纯黑文字与实底类、无纯黑/纯白 hex 字面量（含任意值槽） | `pnpm test src/guards/designTokenGuard.test.ts` |
| `designTokenCssGuard.test.ts` | `src/styles/*.css` 的 `background` 声明无超阈白透面填充、无纯黑实底；豁免项必须成对登记 DESIGN.md 依据；help 段 44px 触摸目标与 transition 引用动效 token | `pnpm test src/guards/designTokenCssGuard.test.ts` |
| `pageHeadingGuard.test.ts` | 「一页一个 h1」：`src/layouts` / `src/features` / `src/shared` 非测试 `.ts(x)` 中含 `<h1` 的文件集合 === 8 个整页视图 allowlist；内嵌内容页必须用 h2，新增 h1 须显式登记 | `pnpm test src/guards/pageHeadingGuard.test.ts` |
| `actionTierPalette.guard.test.ts` | Puzzle ActionBoard 三档配色单一来源：pre-answer 的 passive / standard / aggressive 必须由 `--tier-*` 驱动且不得引用 success / danger / clay；aggressive 使用 terra；答后反馈才可用 success / danger；light 主题不得再写 action tile 组件补丁 | `pnpm test src/guards/actionTierPalette.guard.test.ts` |
| `lightThemeSurfaceGuard.test.ts` | 浅色主题只改 token 与物理物件白名单：light 组件级选择器 === 16 条 allowlist；黄铜字面 rgba 清零；黑色字面 rgba ≤ 41 条；semantic room token 与 hero 渐变在 `:root` / light 两侧均有定义 | `pnpm test src/guards/lightThemeSurfaceGuard.test.ts` |
| `emojiWhitelist.guard.test.ts` | 交互 UI 不用 emoji：`src/shared/components/**`、`src/features/**/components/**` 与 shared 类型 / 数据点名文件里命中 `\p{Extended_Pictographic}` 的文件集合 === 7 个庆祝 / 徽章插画 allowlist；花色与状态记号走 `TYPOGRAPHIC_GLYPHS` 豁免表。内容层扫描 `features/**/data/**`、`shared/data/**`、`i18n/**`，只允许成就数据 / 策略与理论正文 / i18n 既有文案，排版箭头 `↔` 单独豁免 | `pnpm test src/guards/emojiWhitelist.guard.test.ts` |
| `eslintCrossImports.test.ts` | `eslint.config.js` 的 `ALLOWED_CROSS_IMPORTS` 与精确快照一致（新增跨模块边必然变红，收紧时只删不加） | `pnpm test src/guards/eslintCrossImports.test.ts` |
| `huPositionOrderGuard.test.ts` | 单挑（heads-up）位置方向零容忍：以 `shared/constants/headsUpRules.ts` 为单源，四份 HU locale 与单源本身不得出现「谁先行动 / 谁有位置」倒置 | `pnpm test src/guards/huPositionOrderGuard.test.ts` |
| `variantRuleCopyGuard.test.ts` | 变体规则 UI 文案与单源一致：单挑描述/规则卡 key 为翻后 BB 先行动（`variant.json` / `elo.ts` / `variant.headsUpRules.*`，单源 `shared/constants/headsUpRules.ts`），短牌文案为三条 > 顺子（`variant.json` / `rangeTrainer.json`，单源 theory `variantRules.shortDeckRules`） | `pnpm test src/guards/variantRuleCopyGuard.test.ts` |
| `rangePresetGtoConsistency.test.ts` | range-trainer preset 与 gto-simulator `preflop-ranges.json` 频率 ≥ 0.5 的手牌完全一致；预设名称的 `(~N%)` 标注与组合占比偏差 ≤ 1pp | `pnpm test src/guards/rangePresetGtoConsistency.test.ts` |
| `sixMaxBenchmarkGuard.test.ts` | 理论学院 6-max 开池基准的双列口径：`standard` 列与 range-trainer 6-max open 预设名称的 `(~N%)` 逐位置一致；新手列不宽于标准列且 BTN 最宽 | `pnpm test src/guards/sixMaxBenchmarkGuard.test.ts` |
| `line-count-guard.test.ts` | 单文件行数硬约束：**课程内容数据文件不做行数限制**（策略 `lessons/variants` / `localLessons` / `basicsContent`；理论 `levels/variants` 的 Level / `chapters` / `quizBank` / `blocks` / 章节推荐）；其余逻辑 / UI / 常量文件 >400 行失败，300–400 为 warning 灰区。非课程超大文件逐文件 allowlist 棘轮（只减不增）。课程豁免按精确路径正则匹配，专属断言校验「大课程文件不进入违规清单」且逻辑文件（loaders / 组合器 / index）不误匹配 | `pnpm test src/guards/line-count-guard.test.ts` |
| `cssLineCountGuard.test.ts` | `src/styles/*.css` 平铺扫描：单文件 ≤800 行（`globals.css` 按 allowlist 当前行数锁定，Phase 2 拆分前临时豁免）；CSS 总行数自检防路径失效空跑 | `pnpm test src/guards/cssLineCountGuard.test.ts` |
| `testSystem.guard.test.ts` | 测试体系自身不变式：无 focused / skipped / todo / expected-failure 标记；测试文件只用 `.test.ts(x)` 且不在 `__tests__/`；含 `describe`/`it` 声明的非测试文件（不会被收集）为零；每个 feature 至少一个测试；每个 persist store 有 `<store>.persist-shape.test.ts`（version > 1 还需 `<store>.migrate.test.ts`）；`src/guards` 文件与 README 双向一致；扫描面自检 | `pnpm test src/guards/testSystem.guard.test.ts` |

## 约定

- **新增全局不变式应放在本目录**：判定对象跨模块或覆盖全仓时，新建 `src/guards/<不变量名>.guard.test.ts` 风格的文件（后缀 `.test.ts` → unit 项目，Node 环境）。
- **新增守卫必须登记本表**：`testSystem.guard.test.ts` 双向校验文件与清单；未登记或登记了不存在的文件都会变红。
- 守卫必须**自检扫描面**：路径解析或 glob 失效时以「扫描文件数 / 扫描字段数偏低」的断言变红，禁止空洞通过。移动本目录文件后须重跑对应守卫确认自检未失效。
- 目录层级变化时同步修正相对路径（守卫距 `src/` 为一层，故读 `src/styles` 用 `../styles`，读仓库根用 `../../`）。
- 守卫失败即 `pnpm test` 变红，禁止用跳过/放宽断言来"修复"；确需豁免时先在设计文档登记依据（白名单只删不加）。

## 设计层 UI 守卫的 allowlist 规则

`feltContrast.test.ts` / `pageHeadingGuard.test.ts` / `emojiWhitelist.guard.test.ts` / `actionTierPalette.guard.test.ts` / `lightThemeSurfaceGuard.test.ts` 均按「扫描面 + 白名单/棘轮」判定，统一口径如下（失败信息一律带 `file:line`，可直接定位）：

| 守卫 | 扫描面 | 白名单 / 豁免表 | 失败修复方式 |
|---|---|---|---|
| `feltContrast.test.ts` | `src/styles/globals.css` 顶层块（`:root`、`html[data-theme="light"]`、`.dealer-slip`）；颜色值全部从 CSS 解析，守卫里不登记任何色值 | 无文件白名单；`TINTED_SURFACES` 登记语义色铺底的复合口径（`--clay` 15%、`--danger-bg` 自带透明度），`SLIP_REANCHOR` 登记纸条必须重锚的四个 token | 调深文本阶或调亮底色（globals.css token），禁止下调阈值；新增 `color-mix()` 值需先换成字面量否则解析报错（错误信息会指出 token 名与 `var()` 解析链） |
| `pageHeadingGuard.test.ts` | `src/layouts` / `src/features` / `src/shared` 非测试 `.ts(x)`（含 `.ts`：标题可能以 HTML 字符串形式留在数据文件里）；扫描面 ≥ 300 文件 | `H1_ALLOWLIST`：8 个整页视图（AppLayout / BlankLayout / ErrorBoundary / ResultSummary / WelcomeStep / PotOddsQuizPage / RangeLearnPage / SessionResult），每条附登记理由 | 内嵌内容页把 `<h1>` 降为 `<h2>`；确属整页视图则在 allowlist 显式登记理由。文件删 h1 后必须删除对应条目 |
| `emojiWhitelist.guard.test.ts` | 组件层：`src/shared/components/**`、`src/features/**/components/**`（非测试）＋ `shared/types/{elo,mentor,opponent,decisionFeedback}.ts`、`shared/data/opponentProfiles.ts`；内容层：`features/**/data/**`、`shared/data/**`、`i18n/**`（.ts/.tsx/.json）；扫描面 ≥ 150 组件文件 / ≥ 100 内容文件；判定字符集 `\p{Extended_Pictographic}` | `ILLUSTRATION_ALLOWLIST`：7 个庆祝/徽章/段位插画文件；`CONTENT_ALLOWED_PREFIXES`：成就数据 / 策略与理论正文 / i18n 既有文案；`TYPOGRAPHIC_GLYPHS`：花色与状态记号（♠♥♦♣ / ℹ / ⚠ / ⏱）；`CONTENT_TYPOGRAPHIC_GLYPHS`：排版箭头 ↔ | 交互 UI 改用 Lucide 图标；插画类在 allowlist 与 DESIGN.md 登记。豁免表条目在扫描面中消失后必须删除（否则变红） |
| `actionTierPalette.guard.test.ts` | `src/styles/globals.css` 的 action-tile 规则 + `ActionBoard.tsx`；扫描面自检 CSS 与源码有效 | 三档 `data-tier` 必须定义完整 `--tier-*`；pre-answer 不得引用 success / danger / clay；aggressive 使用 terra；答后反馈才可用 success / danger；light 不得再写 action tile 补丁 | 把色值收回 `--tier-*`；tier 色与反馈色分离；新增 tier 先登记 DESIGN.md §5.5 |
| `lightThemeSurfaceGuard.test.ts` | `src/styles/globals.css` 的 `html[data-theme="light"]` 组件选择器与字面量 | `ALLOWED_LIGHT_SELECTORS` 16 条；黄铜字面 rgba 0；黑色字面 rgba ≤ 41 条；`:root`/light 双侧定义 `--hero-surface-gradient` / `--question-card-gradient` | 优先用 token/`color-mix` 消除补丁；新增 light 补丁须先登记 DESIGN.md §2.8 与本表 |

- 文件白名单与补丁白名单都**只减不加**，且带**失效检测**：allowlist 里的文件若已无 h1 / emoji，守卫同样变红，强制删除条目——避免清单腐化成「历史豁免堆积」。
- 新增豁免的登记顺序：先在设计文档（DESIGN.md / PRD）写清依据，再改守卫白名单，最后在同一次提交里跑 `pnpm test src/guards`。