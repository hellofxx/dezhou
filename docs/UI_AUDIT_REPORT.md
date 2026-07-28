# UI 设计完善度审查报告

> 审查人：ui-ux-dev 子代理（行使设计语言审查权与反模式 veto 权）
> 审查依据：`poker-ui-demo/DESIGN_LANGUAGE.md` v1.3（唯一权威）
> 对照实现：`src/styles/globals.css`、`src/shared/components/`、`src/layouts/`、`src/features/`
> 审查日期：2026-07-27

---

## 一、严重（阻断级，违反核心禁令或导致样式失效）

### S1. 设计库 token 文件使用高饱和霓虹语义色
- **位置**：`poker-ui-demo/colors_and_type.css` 第 36–43 行；`poker-ui-demo/.preflight/preflight.html` 第 43–49 行
- **违反条目**：§1.3 反 SaaS 饱和色禁令、§2.2 语义色低饱和牌室化、§10.6 反模式「高饱和霓虹色」
- **问题**：`--poker-success: #4ade80`（霓虹绿）/ `--poker-danger: #f87171`（霓虹红）/ `--poker-warning: #fbbf24`（霓虹黄）/ `--poker-info: #60a5fa`（霓虹蓝）——正是 §1.3 点名禁止的四色。该文件是 `apply-html-head-contract` 脚本的 token 来源，若被引用会将霓虹色注入页面。
- **修复方案**：将四色改为 §2.2 牌室化值——`#7fb883` / `#c25a4c` / `#c9a25e` / `#8ba59b`，与 `globals.css` 第 55–62 行保持一致。同步修正 `docs/PRD.md`（第 1110–1113 行）与 `docs/TDD.md`（第 1394–1397 行）中残留的霓虹色记录。

### S2. 三份色值定义互相矛盾，权威源未对齐
- **位置**：`DESIGN_LANGUAGE.md` §2.1 vs `src/styles/globals.css` 第 16–37 行 vs `poker-ui-demo/colors_and_type.css` 第 11–34 行
- **违反条目**：§11.1 Token 集中管理、§2.1 主色板
- **问题**：同一 token 在三处 HEX 全不同。例：`felt-deep` 规范 `#060d09` / globals `#0e1a14` / demo `#0b1510`；`walnut` 规范 `#17110a` / globals `#241a10` / demo `#1f170e`；`ivory` 规范 `#f5eedc` / globals `#f3ebd9` / demo `#f0e8d5`。DESIGN_LANGUAGE.md 声明为唯一权威，但实现未对齐。
- **修复方案**：以 DESIGN_LANGUAGE.md §2.1 为准，统一 `globals.css` 与 `colors_and_type.css` 的全部 HEX。若实现色更优，则反向更新规范文档并记录于附录变更摘要，禁止三份长期分歧。

### S3. FeedbackGrade 子元素类名与 CSS 完全不匹配，四级样式失效
- **位置**：`src/shared/components/FeedbackGrade.tsx` 第 38、39、41、45 行 vs `src/styles/globals.css` 第 545–548 行
- **违反条目**：§5.12 徽章与状态、五级反馈系统
- **问题**：组件渲染 `feedback-grade-icon` / `feedback-grade-label` / `feedback-grade-ev` / `feedback-grade-desc`，但 CSS 选择器是 `.grade-emoji` / `.grade-label` / `.grade-ev` / `.grade-desc`。四个子元素样式全部不生效——emoji 字号、label 字重、ev 等宽字体、desc 字号均丢失。
- **修复方案**：统一为 CSS 侧命名（`grade-emoji/label/ev/desc`），修改 FeedbackGrade.tsx 四处 className。

### S4. 多处中文/混合文本使用 `italic`（中文斜体禁令）
- **位置**：`src/features/strategy-academy/components/PracticeDrill.tsx` 第 667、772 行；`src/features/gto-simulator/components/DecisionTree.tsx` 第 175 行；`src/features/strategy-academy/components/HandExample.tsx` 第 68 行；`src/features/strategy-academy/components/LearningTracksView.tsx` 第 115 行；`src/features/hand-history/components/ActionLog.tsx` 第 36 行；`src/features/strategy-academy/components/drills/OutsDrill.tsx` 第 169 行；`src/features/progress/components/MoodTracker.tsx` 第 112 行；`src/features/progress/components/SettingsPage.tsx` 第 213 行
- **违反条目**：§3.2 禁用规则、§5.8 motto-engraved、§10.6 反模式「中文斜体」
- **问题**：8 处 Tailwind `italic` 类用于含中文的说明文本。中文字形无斜体设计，浏览器合成 italic 产生锯齿伪斜。
- **修复方案**：移除所有 `italic` 类；中文格言/引述改用 `.motto-engraved` 或 `text-[var(--ivory-muted)]` 正体；确需弱化的英文辅助文本可保留 italic 但须限定英文内容。

### S5. 纯白 `#fff`/`#ffffff` 出现，违反三不原则
- **位置**：`src/styles/globals.css` 第 754 行（`.mentor-avatar color: #fff`）；`src/shared/components/CardSVG.tsx` 第 59 行（`stroke="#ffffff"`）；`src/shared/utils/shareCard.ts` 第 74、84 行（`fillStyle = '#ffffff'`）
- **违反条目**：§1.2 三不原则、§10.6 反模式「纯白 `#fff`」
- **修复方案**：全部替换为 `var(--ivory)` / `#f5eedc`（或 globals 侧 `#f3ebd9`）。CardSVG 描边改用 `rgba(245,238,220,0.6)`；shareCard canvas 改用 `#f5eedc`。

### S6. Chip 组件硬编码颜色、无径向渐变、字体错误
- **位置**：`src/shared/components/Chip.tsx` 第 10–18 行（COLOR_MAP）、第 82 行（`fontFamily="sans-serif"`）、第 49 行（平涂 `fill`）
- **违反条目**：§5.2 筹码（径向渐变 + font-numeric）、§3.1 三族分工、§10.6 反模式「扁平纯色按钮」、§11.5 数据字体
- **问题**：①COLOR_MAP 全为硬编码 HEX，未引用 CSS 变量；②用 SVG `fill` 平涂，违反 §5.2「径向渐变 circle at 35% 35%」；③`fontFamily="sans-serif"` 违反 §3.1（须 Inter Tight）且筹码数字须 `font-numeric`（JetBrains Mono）；④`red: #c25a4c` 用陶土红，§10.3 规定 `.chip-red #a83838`（黏土红）。
- **修复方案**：COLOR_MAP 改引 `var(--poker-clay)` / `var(--poker-brass)` / `var(--poker-frost)` 等；用 SVG `<radialGradient>` 实现径向渐变；`fontFamily` 改 `var(--font-mono)` 并加 `font-numeric` 类；red 色值改 `#a83838`。

---

## 二、中等（规范偏差，影响质感或一致性）

### M1. globals.css 主色板缺少 `poker-` 前缀
- **位置**：`src/styles/globals.css` 第 16–37 行
- **违反条目**：§2 色彩系统「前缀 `--poker-`」、§11.1
- **问题**：§2 规定所有变量前缀 `--poker-`，但 globals 用 `--felt-*` / `--walnut-*` / `--ivory-*` / `--brass-*`（无前缀），仅语义色有前缀。`@theme inline` 也映射无前缀变量。
- **修复方案**：新增 `--poker-felt-*` 等别名指向现有值，或统一重命名并全局替换引用。优先补别名以保向后兼容。

### M2. 阴影 token 值明显弱于规范
- **位置**：`src/styles/globals.css` 第 95–98 行
- **违反条目**：§4.2 阴影层级
- **问题**：`--shadow-sm: 0 1px 2px 0.3`（规范 `0 1px 3px 0.35`）/ `--shadow: 0 2px 8px 0.35`（规范 `0 4px 14px 0.45`）/ `--shadow-lg: 0 8px 24px 0.45`（规范 `0 12px 40px 0.55`）/ `--shadow-brass: 0 2px 12px`（规范 `0 4px 20px`）。阴影偏弱削弱「物理质感」核心气质。
- **修复方案**：按 §4.2 对齐四档阴影值；命名加 `poker-` 前缀。

### M3. globals.css 缺少 `--brass-glow` token
- **位置**：`src/styles/globals.css` :root（缺失）
- **违反条目**：§2.1 黄铜家族 `--poker-brass-glow: rgba(232,201,126,0.12)`
- **修复方案**：补 `--brass-glow: rgba(232,201,126,0.12)` 定义。

### M4. 花色 ♣♠ 色值与规范矛盾
- **位置**：`src/styles/globals.css` 第 75–76 行；`poker-ui-demo/colors_and_type.css` 第 48–49 行
- **违反条目**：§2.3 花色（♣♠ `#1a1308` 深棕近黑）
- **问题**：实现用 `#f3ebd9`（象牙白），注释称「为暗底可见性」。但规范明确深棕近黑。两者矛盾。
- **修复方案**：若象牙白为实际更优选择（暗底可见性确实更重要），则更新 §2.3 规范并记录变更；若需对齐规范，改用 `#1a1308` 并在亮底场景单独处理。建议更新规范承认象牙白方案。

### M5. Card 尺寸与圆角与规范不符
- **位置**：`src/shared/components/Card.tsx` 第 17–21 行；`src/shared/components/CardSVG.tsx` 第 55 行（`rx="6"`）、第 42–44 行（渐变 `#faf8f0→#f5f0e6→#f0ebe0`）
- **违反条目**：§5.1 扑克牌（small 42×60 / medium 56×80 / large 76×108，圆角 7px，牌面 `#f8f2e2→#e5dcc4`）
- **修复方案**：SIZE_MAP 改 42×60 / 56×80 / 76×108；CardSVG `rx` 改 7；渐变 stops 改 `#f8f2e2` / `#e5dcc4`。

### M6. FeltArena 手机端未隐藏 ELO 徽章与 daily-progress-chip
- **位置**：`src/features/progress/components/FeltArena.tsx` 第 48–63、129–139 行；`src/styles/globals.css` 媒体查询（缺失对应隐藏规则）
- **违反条目**：§6.3 移动端「arena 内 ELO 徽章和 daily-progress-chip 隐藏」、§10.6 反模式
- **问题**：§6.3 明确要求手机端隐藏这两个元素（避免遮挡标题），但 globals.css `@media(max-width:767px)` 中无 `.elo-rank-badge { display:none !important }` 与 `.daily-progress-chip { display:none !important }` 规则。
- **修复方案**：在 `@media(max-width:767px)` 补两条 `display:none !important` 隐藏规则；并补 arena 三分区紧凑布局的对应 CSS（plaque 对称 top:38% 等）。

### M7. 侧边栏宽度 256px 而非 240px
- **位置**：`src/layouts/AppLayout.tsx` 第 123 行（`w-64`）
- **违反条目**：§6.1 桌面布局（240px 侧边栏）、§5.7 侧边栏
- **修复方案**：`w-64`（256px）改 `w-60`（240px）。

### M8. 侧边栏 active 态未用「8% 黄铜渐变底」
- **位置**：`src/layouts/AppLayout.tsx` 第 171 行（`bg-[var(--walnut)]`）、第 179 行（3px 实色 brass 条）
- **违反条目**：§5.7 侧边栏项（Active「左侧 8% 黄铜渐变底 + 右侧黄铜庄码 D」）
- **问题**：实现用纯 walnut 底 + 3px 实色 brass 竖条，规范要求 8% 黄铜渐变底。
- **修复方案**：active 背景改 `linear-gradient(90deg, rgba(201,162,94,0.08), transparent)` 或 `bg-[rgba(201,162,94,0.08)]`。

### M9. nav-section-label 样式偏差
- **位置**：`src/layouts/AppLayout.tsx` 第 158 行
- **违反条目**：§5.7 导航（nav-section-label 9px uppercase tracking 0.2em ivory-muted）
- **问题**：实现 `text-[10px] tracking-[0.18em] text-[var(--brass-dark)]`，字号、字距、颜色均偏差。
- **修复方案**：改 `text-[9px] tracking-[0.2em] text-[var(--ivory-muted)]`。

### M10. globals.css 组件类大量硬编码 HEX
- **位置**：`src/styles/globals.css` 第 312–841 行（`.panel` / `.felt-arena` / `.casino-plaque` / `.quick-drill-card` / `.action-mini` / `.path-banner` 等）
- **违反条目**：§11.1 Token 集中管理「改主题只需改变量」、§10.1「不硬编码颜色」
- **问题**：组件类内嵌 `#17110a` / `#120d07` / `#2d2214` / `#1a1308` / `#e8c97e` / `#8a6b30` 等硬编码 HEX，未引用 CSS 变量。属 demo 单页移植遗留。
- **修复方案**：逐类替换为 `var(--walnut)` / `var(--walnut-border)` / `var(--brass-bright)` 等变量引用。渐变中的固定色阶可保留但应注释对应 token。

### M11. Dashboard quick-drill-card 内联硬编码颜色
- **位置**：`src/features/progress/components/Dashboard.tsx` 第 110、114、119、127、134、141、147 行
- **违反条目**：§10.1 不硬编码颜色、§11.1
- **问题**：大量 `text-[#1a1308]` / `bg-[rgba(26,19,8,0.12)]` 硬编码。虽在黄铜横幅上深色文字是正确的，但应复用 `.quick-drill-*` CSS 类而非内联。
- **修复方案**：复用 globals.css 已定义的 `.quick-drill-title` / `.quick-drill-mode` / `.quick-drill-done` 类，移除内联硬编码。

### M12. Dashboard 首屏引导卡用 brass-muted 大面积做背景
- **位置**：`src/features/progress/components/Dashboard.tsx` 第 156 行（`bg-[var(--brass-muted)]`）
- **违反条目**：§1.1 单重点缀（黄铜仅小面积点缀）、§2.2「禁止大面积纯语义色做背景」
- **修复方案**：背景改 `var(--walnut)` 或 `.panel` 胡桃底，黄铜仅用于边框/图标/按钮。

### M13. SpotTrainer 用 `--sage`/`--clay` 做按钮背景
- **位置**：`src/features/gto-simulator/components/SpotTrainer.tsx` 第 84、92 行
- **违反条目**：§2.4 功能装饰色（sage「辅助图表，已被 --poker-info 取代，保留兼容」）、§5.5 按钮色阶
- **问题**：`--sage` / `--clay` 是装饰保留色，不应做交互按钮背景。按钮应走 §5.5 四色阶（fold/call/raise/allin）。
- **修复方案**：改用 `.action-mini.act-call` / `.act-fold` 等标准按钮类。

### M14. Hand History 模块图标硬编码皮革赭 `#c08a5a`
- **位置**：`src/features/progress/components/Dashboard.tsx` 第 340 行（`style={{ color: '#c08a5a' }}`）、第 338 行（rgba 同色）
- **违反条目**：§5.18 模块入口卡主题色「复盘=皮革赭 `#c08a5a`」、§10.2「新色先加 :root 再登记」
- **问题**：皮革赭是 §5.18 登记的模块主题色，但未在 :root 定义为 token，直接硬编码。
- **修复方案**：在 :root 补 `--poker-leather: #c08a5a`，引用 `var(--poker-leather)`。

---

## 三、轻微（细节偏差，不影响功能）

### L1. radius token 命名与前缀不符
- **位置**：`src/styles/globals.css` 第 92、146–148 行
- **违反条目**：§4.1 间距与圆角（`--poker-radius-sm/md/lg/xl`）
- **问题**：用 `--radius: 0.5rem` 派生 `--radius-lg/md/sm`，缺 `--poker-radius-xl`（16px），未遵循 `--poker-` 前缀。
- **修复方案**：补 `--poker-radius-*` 四档定义并别名引用。

### L2. FreezeChip size prop 不生效
- **位置**：`src/shared/components/FreezeChip.tsx` 第 17、20 行；`src/styles/globals.css` 第 447 行（`.freeze-chip` 固定 28px）
- **违反条目**：§5.12 冻结卡
- **问题**：CSS 固定 `width/height: 28px`，`size` prop 仅缩放 Snowflake 图标，容器不缩放。
- **修复方案**：组件用 inline `style={{ width: size, height: size }}` 覆盖，或 CSS 改用 `width: var(--freeze-size, 28px)`。

### L3. AppLayout 用户头像硬编码 `text-[#1a1308]`
- **位置**：`src/layouts/AppLayout.tsx` 第 203 行
- **违反条目**：§10.1 不硬编码颜色
- **修复方案**：改 `text-[var(--primary-foreground)]`。

### L4. MobileNav 边框用 brass-muted 而非 walnut-border
- **位置**：`src/layouts/MobileNav.tsx` 第 30 行（`border-[var(--brass-muted)]`）
- **违反条目**：§5.7 移动端底栏（胡桃色）
- **修复方案**：改 `border-[var(--walnut-border)]`。

### L5. MobileNav active 色用 brass 而非 brass-bright
- **位置**：`src/layouts/MobileNav.tsx` 第 41 行（`text-[var(--brass)]`）
- **违反条目**：§5.7 侧边栏项（Active `--brass-bright`）
- **修复方案**：改 `text-[var(--brass-bright)]`。

### L6. AppLayout 顶栏 streak 徽章硬编码 rgba
- **位置**：`src/layouts/AppLayout.tsx` 第 242 行（`bg-[rgba(201,162,94,0.08)]`）
- **违反条目**：§10.1 不硬编码颜色
- **修复方案**：改 `bg-[var(--brass-glow)]` 或定义专用 token。

### L7. Card 高亮 filter 硬编码 rgba
- **位置**：`src/shared/components/Card.tsx` 第 52 行（`rgba(200,164,86,0.65)`）
- **违反条目**：§10.1 不硬编码颜色
- **修复方案**：改 `var(--brass-glow)` 或 `rgba(232,201,126,0.65)` 对齐 brass-bright。

### L8. 训练场模块网格缺少 §10.5 防御性 !important 覆盖
- **位置**：`src/features/progress/components/Dashboard.tsx` 第 248 行（`grid grid-cols-2 md:grid-cols-3`）；`src/styles/globals.css` 媒体查询（缺失）
- **违反条目**：§6.3 移动端「训练场模块网格 2 列」、§10.5 CSS 特异性规则
- **问题**：§6.3/§10.5 要求 `.grid.grid-cols-2.md\:grid-cols-3 { grid-template-columns:repeat(2,1fr) !important }` 防御性覆盖。当前 Tailwind v4 移动优先默认 2 列可工作，但未按规范沉淀防御规则。
- **修复方案**：在 `@media(max-width:767px)` 补该防御性 `!important` 规则，符合 §10.5 并防止未来 Tailwind 配置变更导致回退。

### L9. CardSVG 牌面纸纹用 `#00000008` 硬编码
- **位置**：`src/shared/components/CardSVG.tsx` 第 49–50 行
- **违反条目**：§10.1 不硬编码颜色
- **修复方案**：改 `rgba(26,19,8,0.03)` 等深棕调透明，避免纯黑。

### L10. 文档残留霓虹色记录误导开发
- **位置**：`docs/PRD.md` 第 1110–1113 行；`docs/TDD.md` 第 1394–1397 行；`docs/OPTIMIZATION_EXECUTION_PLAN.md` 第 662–666 行
- **违反条目**：§1.3 反 SaaS 饱和色禁令（文档应同步规范）
- **问题**：PRD/TDD 仍记录 `#4ade80` / `#f87171` / `#fbbf24` / `#60a5fa` 为语义色，与 §2.2 低饱和要求矛盾，会误导开发者。
- **修复方案**：按 §2.2 牌室化值更新文档色彩表。

---

## 四、修复优先级排序与分批实施建议

### 第一批（P0，立即修复——违反核心禁令/样式失效）

| 序号 | 项 | 理由 |
|---|---|---|
| 1 | S1 霓虹语义色 | 违反 §1.3 核心禁令，是 token 源头污染 |
| 2 | S3 FeedbackGrade 类名不匹配 | 五级反馈系统样式完全失效，影响所有训练模块答题反馈 |
| 3 | S4 中文斜体 | 违反 §3.2 核心禁令，8 处 |
| 4 | S5 纯白 #fff | 违反 §1.2 三不原则 |
| 5 | S6 Chip 硬编码+无渐变 | 违反 §5.2 + §10.6 扁平禁令，筹码是核心物理组件 |

**实施建议**：S1 改 `colors_and_type.css` 四色 + 同步 PRD/TDD；S3 改 FeedbackGrade.tsx 四处 className；S4 全局搜索 `italic` 移除；S5 替换三处 `#fff`；S6 重写 Chip COLOR_MAP 与渲染。批次完成后跑 `tsc --noEmit` + 截图回归。

### 第二批（P1，本周修复——规范对齐与质感恢复）

| 序号 | 项 | 理由 |
|---|---|---|
| 6 | S2 三份色值统一 | 消除权威源分歧，是后续所有 token 工作的基础 |
| 7 | M6 FeltArena 手机端隐藏规则 | 影响移动端首屏可用性 |
| 8 | M2 阴影 token 对齐 | 恢复「物理质感」核心气质 |
| 9 | M10 globals.css 组件类去硬编码 | 落实 §11.1 集中管理 |
| 10 | M11 Dashboard quick-drill 内联去硬编码 | 复用 CSS 类 |
| 11 | M12 首屏引导卡背景 | 违反单重点缀原则 |
| 12 | M13 SpotTrainer 按钮色 | 走标准四色阶 |

**实施建议**：S2 以 DESIGN_LANGUAGE.md 为准统一（或反向更新规范），完成后全页面截图回归。M6/M10/M11 集中改 globals.css 与 Dashboard.tsx。

### 第三批（P2，择机修复——命名规范与细节打磨）

| 序号 | 项 | 理由 |
|---|---|---|
| 13 | M1 poker- 前缀补齐 | 命名一致性，用别名保兼容 |
| 14 | M3 brass-glow token 补齐 | 完整性 |
| 15 | M4 花色色值对齐（建议更新规范） | 消除规范矛盾 |
| 16 | M5 Card 尺寸/圆角/渐变对齐 | 牌面质感 |
| 17 | M7/M8/M9 侧边栏宽度/active/label | §5.7 对齐 |
| 18 | M14 皮革赭 token 化 | §5.18 主题色登记 |
| 19 | L1–L10 轻微项 | 逐项打磨 |

**实施建议**：P2 批次可在功能迭代间隙进行，每批改完跑 `tsc --noEmit` + `pnpm build` 验证。L8 防御性 `!important` 建议与 M6 同批处理（均在移动端媒体查询）。

---

## 五、审查结论

项目整体设计语言落地度约 **70%**：核心四层色架构、桌沿签名、铭牌/筹码/铭文等签名组件已就位，仪表盘 5 段叙事与 streak-rail 上移等 v1.3 移动端规则基本落实。主要缺口集中在三处：① token 源头污染（霓虹色未清除、三份色值分歧）；② 组件层类名匹配失效（FeedbackGrade）与硬编码（Chip）；③ 反模式残留（中文斜体、纯白、大面积黄铜背景）。

P0 批次（5 项）修复后即可消除所有核心禁令违规与样式失效，建议优先处理。P1 批次恢复质感与移动端可用性。P2 批次完成命名与细节对齐后，落地度可达 90%+。
