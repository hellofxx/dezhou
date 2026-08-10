# 桌面端 / 平板端可访问性与 UI 质量评审报告

> 评审范围：除移动端（<768px）外所有页面 —— 桌面端与平板端，含 30 个路由页面及其共享组件。
> 评审维度：布局结构、响应式适配、交互元素、内容完整性、加载性能、浏览器兼容性、品牌一致性。
> 评审方法：代码静态走查（两轮 code-explorer 全量扫描 + 关键证据人工复核）+ 既有守卫测试（designTokenGuard / axe 冒烟）。
> 日期：2026-08-10

---

## 一、结论摘要

整体完成度**良好**：全部页面具备基础响应式断点（`md:`/`lg:` 前置），三处共享组件已通过 axe 冒烟门禁，颜色全部走四层 token（designTokenGuard 全绿）。但存在 **1 个高优先级功能性缺陷**（HandHistory 删除按钮触屏不可见）与 **2 个系统性中等级问题**（全局宽屏无限拉伸、可点击 `<div>`/SVG 节点缺键盘可达性），以及一批平板端挤压与触控目标问题。

| 优先级 | 数量 | 说明 |
|---|---|---|
| P0（阻断） | 1 | 功能不可用：牌局删除按钮触屏不可见 |
| P1（严重） | 5 | 键盘/读屏不可达、宽屏阅读体验、触屏 hover 依赖 |
| P2（重要） | 10 | 平板端挤压、触控目标不达标、内容截断 |
| P3（建议） | 8 | 固定宽度/固定高度细节、aria 语义补全 |

---

## 二、全局架构层发现（影响所有页面）

### G1 [P1] 全局内容区无限拉伸，无最大宽度约束
- **位置**：`src/layouts/AppLayout.tsx:324` → `<main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">`
- **证据**：`main` 无 `max-w-*`/`mx-auto`。在 ≥1440px 桌面屏上，所有页面内容（仪表盘网格、课程正文、统计表）横向拉满整屏，卡片间距与文本行宽过大，破坏阅读体验。
- **建议**：在 `main` 内包裹一层 `mx-auto w-full max-w-[1400px]`（或对阅读型页面 `max-w-4xl`），并让各页面外层同步收敛。注意 `TheoryChapterView.tsx:102` 注释明确"不再限宽居中"，需按页面类型权衡（阅读页应限宽，操作台页面可全宽）。

### G2 [P1] 多处"可点击 div / SVG 节点"缺键盘与读屏可达性
同一种反模式出现在 3 处，均导致：鼠标可点、键盘 Tab 不可达、读屏不可识别。
- `src/features/range-trainer/components/RangeGrid.tsx:55-70`（GridCell 为 `<div onClick>`）
- `src/features/gto-simulator/components/StrategyMatrix.tsx:74-90`（MatrixCell 为 `<div onClick>`）
- `src/features/strategy-academy/components/ConceptGraph.tsx:461-472`（`<motion.g>` SVG 节点 onClick）
- **建议**：为这三类网格/图节点补充 `role="button"` + `tabIndex={0}` + `onKeyDown`(Enter/Space)，或用原生 `<button>` 包裹。`RangeGrid`/`StrategyMatrix` 是高频核心交互，属 P1。

### G3 [P2] `color-scheme: dark` 已修复，但 `100dvh` 残留需全量复核
- **位置**：上一轮已改 `globals.css` body/#root 与 `ErrorBoundary.tsx`；本轮复核确认 `globals.css` 已无 `100vh` 残留（`100dvh` 生效）。
- **建议**：运行一次 `search_content('100vh', 'src')` 确认 0 命中（本评审时已 0 命中，仅记录防回归）。桌面浏览器（Chrome 108+ / Safari 15.4+ / Firefox 101+）均支持 `dvh`，无兼容性风险。

### G4 [P2] `interactive-widget=resizes-content` 浏览器覆盖有限
- **位置**：`index.html:6`（上轮已加）。
- **说明**：`interactive-widget=resizes-content` 仅较新版 Chrome（108+）完整支持，Safari/旧 Chrome 会忽略该值。桌面/平板浏览器上软键盘场景少，风险低，但建议在 `manifest.json`/`theme-color` 之外不做额外依赖。

---

## 三、按模块 / 页面的问题清单

### 3.1 progress（仪表盘 / 统计 / 设置 / 排行榜）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| P-D1 | Dashboard | P2 | 首页网格 `grid-cols-2 md:grid-cols-3` 与 `lg:grid-cols-3` 响应式合理；但页面无 `max-w`，随 G1 拉伸 | `Dashboard.tsx:118,216,298` | 随 G1 统一加容器限宽 |
| P-D2 | Dashboard | P3 | 成就卡/模块卡为整卡 `<button>`，内部无 focus-visible 自定义，依赖全局 focus 环 | `Dashboard.tsx:177` | 确认 `focus-visible:ring` 存在（全局样式有，通过） |
| P-S1 | SettingsPage | P1 | 音效开关为自定义 toggle `<button>`，仅 `aria-pressed`，**无 `role="switch"` / `aria-checked` / `aria-label`**，读屏语义不完整 | `SettingsPage.tsx:275-287` | 加 `role="switch"` + `aria-checked` + 本地化 label（双语 key） |
| P-S2 | SettingsPage | P2 | SettingRow 长描述 + 固定 `w-[120px]` Select 同行，平板窄宽（768px）下冻结卡行（长描述+状态+按钮）挤压/溢出 | `SettingsPage.tsx:355-384` | SettingRow 改 `flex-wrap` 或描述区 `min-w-0` + 控件 `shrink-0` |
| P-S3 | SettingsPage | P2 | 语言切换在 Settings 内重复（顶栏已有），且与顶栏为两个入口 | `SettingsPage.tsx:391` | 保留（合规），仅提示 UI 冗余非缺陷 |
| P-M1 | ModuleStatsPage | P2 | 返回按钮为纯图标 `<button>`（`ArrowLeft`）**无 `aria-label`**；`p-1.5` 触控区约 36px 略小 | `ModuleStatsPage.tsx:76-81` | 加 `aria-label={t('...back')}`；触控区扩到 44px |
| P-M2 | ModuleStatsPage | P2 | 统计卡 `grid grid-cols-3` 无响应式前缀，768px 平板 3 列偏挤 | `ModuleStatsPage.tsx:89` | 改 `grid-cols-2 md:grid-cols-3` |
| P-L1 | Leaderboard | P3 | 榜单行 `min-w-0` + `truncate` 处理长用户名，但无 `overflow-x` 容器，平板超长名可能挤压排名徽章 | `Leaderboard.tsx:146` | 加 `flex-wrap` 或让用户名区 `truncate`（已有 `min-w-0`，风险低） |
| P-P1 | ProgressPage | — | `grid-cols-1 md:grid-cols-3`、表格 `overflow-x-auto` 均合规 | `ProgressPage.tsx:63,85,140` | 已满足，仅随 G1 限宽 |

### 3.2 range-trainer（范围训练）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| R-R1 | RangeTrainerHome / RangeLearnPage | P1 | GridCell 为可点击 `<div>`，无 `role/tabIndex/onKeyDown`；且 `onMouseEnter/onMouseLeave` 驱动的悬停高亮（`highlightedHand`）在触屏/平板不可用（无法查看悬停详情） | `RangeGrid.tsx:55-70,64-65` | 补键盘可达性；触屏下改用 `onClick` 切换高亮（现有 onClick 已可选，扩展为点选即高亮） |
| R-R2 | RangeGrid | P2 | 网格列数固定 `24px repeat(13,1fr)` 内联样式，无响应式列数降级；平板窄容器下 13 列单元格过小、`text-[11px]` 挤 | `RangeGrid.tsx:115,128` | 小容器时允许横向 `overflow-x-auto` + `min-width`，或按容器宽度缩放字体 |
| R-R3 | RangeTrainerHome | P3 | 位置按钮 `size="sm"` + `px-3 py-1.5`（约 32px 高）触控区偏小 | `RangeSelector.tsx:65,88` | 平板触点扩到 ≥44px |
| R-R4 | RangeTrainerHome | P3 | 位置锁定提示依赖 `title` hover，触屏不可见 | `RangeSelector.tsx:63` | 锁定态改为可见文本/aria-describedby |

### 3.3 pot-odds（赔率计算器）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| O-O1 | PotOddsPage | P3 | Reset 按钮 `h-8 w-8`（32px）触控偏小 | `OddsCalculator.tsx:43`、`EVCalculator.tsx:41` | 扩到 `h-11 w-11` |
| O-O2 | PotOddsPage | P3 | EquityChart/EVChart 固定高度 200/320px，不随视口高度变化（平板竖屏显矮） | `EquityChart.tsx:28`、`EVCalculator.tsx:118` | 可接受；如要优化用 `min-h` + aspect |
| O-O3 | PotOddsQuizPage | P2 | 结果面板 `grid grid-cols-3` 无响应式前缀，平板窄屏数字挤 | `PotOddsQuizPage.tsx:221` | 改 `grid-cols-1 sm:grid-cols-3` |
| O-O4 | PotOddsQuizPage | P3 | 外层 `max-w-2xl` 较窄，宽屏左右留白大（非缺陷，仅体验） | `PotOddsQuizPage.tsx:279` | 可调 `max-w-3xl` |

### 3.4 gto-simulator（GTO 模拟器）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| G-G1 | GTOSessionPage | P2 | 玩家人数 6 个 pill 用 `flex gap-2` 不换行，平板左列（约 350px）下横向溢出/挤压 | `ScenarioSetup.tsx:234` | 加 `flex-wrap` 或 `grid grid-cols-3 sm:grid-cols-6` |
| G-G2 | GTOSessionPage | P3 | 整页 `max-w-lg`（512px）固定窄容器，桌面宽屏左右留白大 | `GTOSessionPage.tsx:194` | 桌面放大到 `max-w-2xl` |
| G-G3 | GTOResultPage / StrategyMatrix | P1 | MatrixCell 可点击 `<div>` 无键盘可达；`onMouseEnter` 高亮触屏不可用；13 列固定 | `StrategyMatrix.tsx:74-90,111,124` | 同 R-R1/R-R2 方案 |
| G-G4 | GTOResultPage | P2 | `ResultSummary` 全宽布局（`py-8`），桌面拉伸大 | `ResultSummary.tsx:62` | 随 G1 限宽 |

### 3.5 hand-history（牌局复盘）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| H-H1 | HandHistoryList | **P0** | 删除按钮 `opacity-0 group-hover:opacity-100` —— **触屏/平板无 hover，按钮永远不可见，无法删除牌局**（功能性缺陷） | `HandHistoryList.tsx:201-206` | 删除按钮常显（或改为列表项左滑/长按，最小修复：去掉 `opacity-0`，用低对比描边态弱化） |
| H-H2 | HandHistoryList | P2 | 筛选栏（搜索框 + 2 个 select）`flex items-center gap-3` 不换行，768px 平板偏挤 | `HandHistoryList.tsx:120-151` | 加 `flex-wrap`，select 允许 `shrink-0` |
| H-H3 | HandHistoryList | P3 | 赢家名 `truncate max-w-[100px]` 截断可能丢信息 | `HandHistoryList.tsx:196` | 改 `max-w-[160px]` 或省略号保留完整值（title） |
| H-H4 | HandImportPage | P1 | 拖拽区为 `<div onClick>` 无键盘可达（键盘用户无法触达文件选择） | `HandImporter.tsx:119-143` | 加 `role="button"`/`tabIndex`/`onKeyDown`，或内嵌原生 `<label>`+`<input type=file>` |
| H-H5 | HandReplayer | P1 | 控制条 6 个纯图标按钮仅 `title`、**无 `aria-label`**；`p-2`（32px）触控区偏小 | `HandReplayer.tsx:109-151` | 加双语 `aria-label`；触控区 ≥44px |
| H-H6 | HandReplayer | P2 | 右栏固定 `w-64` + 桌面椭圆 `h-[400px]` 固定高，768px 平板挤压 | `HandReplayer.tsx:86,174` | `w-64` 改 `w-56 lg:w-64`；椭圆高用 `min-h` + aspect |

### 3.6 strategy-academy（策略学院）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| S-S1 | ConceptGraphView | P1 | ConceptGraph 节点为 `<motion.g>` onClick，无键盘/读屏可达；tooltip 仅 hover 显示 | `ConceptGraph.tsx:461-472,532-552` | SVG 节点加 `tabIndex`+`role`；触屏改点按显示 tooltip |
| S-S2 | ConceptGraphView | P2 | 统计卡 `grid grid-cols-3` 无响应式前缀 | `ConceptGraphView.tsx:59` | 改 `grid-cols-1 sm:grid-cols-3` |
| S-S3 | CourseView | P2 | 页面无 `max-w`，课程正文在宽屏拉伸 | `CourseView.tsx:215` | 正文容器 `max-w-3xl mx-auto` |
| S-S4 | LearningTracksView | P3 | 轨道卡 hover 边框为增强样式（非功能依赖），触屏无碍 | `LearningTracksView.tsx:85-91` | 已满足 |
| S-S5 | LevelCertification | P3 | 选项字母圆圈 `w-5 h-5` 小，但整行按钮 `py-3` 可点，风险低 | `LevelCertification.tsx:254` | 已满足，记录 |
| S-S6 | QuickDrill | P2 | 难度选择 `flex gap-2` 三按钮不换行；结果区 `grid grid-cols-3` 固定 | `QuickDrill.tsx:254,429` | 加 `flex-wrap`；结果区响应式列数 |

### 3.7 theory-academy（理论学院）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| T-T1 | TheoryChapterView | P1 | 页面**刻意全宽**（`TheoryChapterView.tsx:102` 注释"不再限宽居中"），文章正文行宽在桌面过大（>80ch），违反可读性准则 | `TheoryChapterView.tsx:103` | 正文区域单独 `max-w-3xl`（保留按钮/导航全宽），提升长文阅读体验 |
| T-T2 | TheoryChapterView | — | 按钮/导航 `flex-wrap`、标题 `md:text-[26px]`、focus-visible 均已合规 | `TheoryChapterView.tsx:108,123,180` | 已满足 |

### 3.8 puzzle-trainer（谜题训练）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| U-U1 | PuzzleHome | P3 | Rush 3/5 min 双入口按钮 `py-0.5` 触控区约 24px 偏小 | `PuzzleHome.tsx:72-82` | 扩高到 ≥32px（带内边距） |
| U-U2 | PuzzleRush / DailyPuzzle / ThemeDrill | P2 | 页面无 `max-w`；选项 `sm:grid-cols-3` 在 768px 平板下每列约 200px，长选项文本换行 | `PuzzleCard.tsx:133` | 容器加 `max-w-3xl`；平板 `sm:grid-cols-2 lg:grid-cols-3` |
| U-U3 | PuzzleHome | — | 主题卡 `sm:grid-cols-2 lg:grid-cols-3`、模式卡 `md:grid-cols-3` 响应式优秀 | `PuzzleHome.tsx:54,148` | 已满足 |

### 3.9 help-center（帮助中心）

| # | 页面 | 优先级 | 问题 | 位置 | 改进建议 |
|---|---|---|---|---|---|
| C-C1 | HelpHome | — | 教程卡 `sm:grid-cols-2 md:grid-cols-3`、`min-h-[44px]`、FAQ `aria-expanded` 均合规 —— **最佳实践模板** | `HelpHome.tsx:33,45` | 已满足 |
| C-C2 | HelpArticle | P2 | 页面无 `max-w`，长教程正文宽屏拉伸 | `HelpArticle.tsx:29` | 正文容器 `max-w-3xl mx-auto` |

---

## 四、专项维度结论

### 4.1 浏览器兼容性
- **构建目标**：`tsconfig.app.json:4` `target: ES2020`，Vite 默认 `baseline-widely-available`（现代浏览器）。Chrome 88+ / Safari 14+ / Firefox 87+ 均覆盖。
- **已用现代 CSS**：`100dvh`（Chrome108+/Safari15.4+/FF101+）、`color-scheme`（Chrome81+）、`aspect-square`（Chrome88+）、`env(safe-area-inset-bottom)`（需 `viewport-fit=cover` 已配）。桌面端无风险。
- **`interactive-widget=resizes-content`**：仅 Chrome 108+ 识别，其余忽略（渐进增强，无副作用）。
- **结论**：浏览器兼容性良好，无 P0/P1。建议 CI 增加 `pnpm build` 产物在旧浏览器（如 Safari 14）的 smoke 验证（可选）。

### 4.2 加载性能
- **已达标**：路由全部 `React.lazy()`；`vite.config.ts:23-54` manualChunks 对 academy 数据、puzzle 题库、recharts/d3、framer-motion、react-dom 分包；`sw.js` 静态资源 cache-first + app-shell network-first，离线可用。
- **风险点 [P2]**：`index.html:15` Google Fonts 由 `<link>` 加载（非自托管）。中国区访问 `fonts.googleapis.com` 可能慢或超时，`display=swap` 会兜底回退字体，但首屏 FOUT 抖动可见。
  - **建议**：将三款字体（Fraunces / Inter Tight / JetBrains Mono）自托管至 `public/fonts/` 并通过 `@font-face` + `font-display: swap` 引入；同时纳入 SW 缓存白名单（当前 SW 只缓存同源 `assets/`，自托管字体落 `public/` 路径即可被同源缓存）。这是对桌面加载体验最有价值的单项优化。
- **风险点 [P3]**：`@import "tailwindcss"` 在 `globals.css:1`（保留），CSS 体积由 Tailwind 4 自动裁剪，无阻塞问题。

### 4.3 视觉品牌一致性
- **已达标**：`designTokenGuard.test.ts` 全绿（霓虹色板/纯黑白 class/纯黑白 hex 三类违规 0 命中）。全站颜色经四层 token（`--felt-*`/`--ivory-*`/`--brass-*`/`--walnut-*`），语义色走 `--poker-*`。
- **例外说明（合规豁免）**：硬编码 hex 仅存在于以下场景，均有注释标注对应 token，属合理：
  - Canvas 绘制（`shareCard.ts:23-84` 图表渐变底色）、SVG 扑克牌（`CardSVG.tsx:42-44` 纸面纹理、`CardBack.tsx:34-36`）、筹码色（`Chip.tsx:16-22`）
  - 数据定义色值（`elo.ts:33-38` 段位色、`poker.ts:39-53` 花色、`opponentProfiles.ts` AI 对手色）—— 这些本质是数据属性而非 UI 皮肤，集中定义可维护。
- **发现 [P3]**：`ErrorBoundary.tsx:46-107` 使用内联 `style` 带 hex fallback（如 `#0e1a14`）。虽为兜底页（无 token 上下文时也能显示），但建议统一走 CSS 类保持一致性。
- **结论**：品牌一致性整体优秀，无跨页颜色漂移。

### 4.4 键盘可访问性（桌面端核心）
- 共享组件（Dialog/Tooltip/Select）基于 Radix，键盘/焦点管理合规。
- 主要缺口集中在**自绘交互体**：RangeGrid / StrategyMatrix / ConceptGraph / HandImporter drop zone（见 G2、R-R1、G-G3、S-S1、H-H4）—— 均 P1。

---

## 五、修复优先级排序（总表）

### P0（阻断 — 必须立即修复）
| ID | 页面 | 问题 |
|---|---|---|
| H-H1 | HandHistoryList | 删除按钮 `opacity-0` 触屏不可见，无法删除牌局 |

### P1（严重 — 一个迭代内修复）
| ID | 页面 | 问题 |
|---|---|---|
| G2/R-R1/G-G3/S-S1 | RangeGrid / StrategyMatrix / ConceptGraph | 可点击网格与 SVG 节点无键盘/读屏可达性 |
| G1 | AppLayout 全局 | 内容区无 `max-w`，宽屏无限拉伸 |
| H-H4 | HandImporter | 拖拽区 div 键盘不可达 |
| H-H5 | HandReplayer | 控制条纯图标按钮无 aria-label |
| T-T1 | TheoryChapterView | 文章全宽行宽过大 |
| P-S1 | SettingsPage | 音效开关缺 `role="switch"`/aria 语义 |

### P2（重要 — 近期迭代）
| ID | 页面 | 问题 |
|---|---|---|
| P-S2 | SettingsPage | 冻结卡行平板挤压 |
| H-H2/H-H6 | HandHistoryList / HandReplayer | 筛选栏与回放布局平板挤压 |
| G-G1 | GTOSessionPage | 玩家人数 pill 不换行 |
| P-M1/P-M2 | ModuleStatsPage | 返回按钮 aria + 统计卡列数 |
| O-O3 / S-S2 / S-S6 / U-U2 | 各结果/统计区 | `grid-cols-3` 固定列数平板偏挤 |
| G4 / 4.2-fonts | 全局 | 字体自托管（性能最佳单项优化） |

### P3（建议 — 排期）
R-R3/R-R4/O-O1/P-D1/P-S3/U-U1/H-H3/C-C2/G-G2/G-G4/P-L1/O-O2/E-B 等（触控目标微调、max-w 微调、图标 aria 补全），详见 §三。

---

## 六、责任智能体建议

| 工作项 | 责任智能体 | 备注 |
|---|---|---|
| H-H1（删除按钮）、H-H2/H-H6 | `hand-history-dev` | 模块内改动 |
| G2 三类网格键盘可达性（R-R1/G-G3/S-S1） | 各模块 owner（range/gto/strategy）+ `platform-dev` 复核共享方案 | 共享工具可抽 `useGridKeyboardNav` |
| G1 全局 max-w | `platform-dev` | 布局层 |
| H-H4 / H-H5 | `hand-history-dev` | |
| P-S1/P-S2 | `progress-dev` | 涉及 i18n 双语 key |
| T-T1 / 4.2 字体自托管 | `platform-dev`（性能）+ `ui-ux-dev`（可读性） | 字体自托管需更新 SW |
| 全量回归 | `platform-dev` | 完成后跑 `pnpm verify` |

---

## 七、已验证良好的部分（防回归基准）

- **响应式网格**：PuzzleHome（`1/md:3`、`1/sm:2/lg:3`）、HelpHome（`min-h-[44px]` + FAQ aria）、ProgressPage（`md:grid-cols-3` + `overflow-x-auto` 表格）、Dashboard（`lg:grid-cols-3` + `lg:col-span-2`）。
- **共享组件 a11y**：Dialog（44×44 关闭按钮 + 可访问名称）、MobileNav（44×44 + aria-label）已入 `pnpm verify` axe 冒烟门禁。
- **品牌 token**：designTokenGuard 全绿，无霓虹/纯黑白回流。
- **性能基线**：全路由 lazy + manualChunks 分包 + SW 离线缓存。
