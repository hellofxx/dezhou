# PokerLab 第二阶段 UI/UX 修复计划（纯前端）

> 状态：Historical（归档于 2026-11-04）。本计划已实施；当前设计契约以 `DESIGN.md` 为准。

> 版本：v1.2（2026-11-03，已实施并回填执行结果）
> 依据：`docs/CHANGELOG.md` 2026-11-03 条目「未纳入」清单、[DESIGN.md §7](../../../DESIGN.md#7-图标与插画) Emoji 白名单、当前工作树代码事实。
> 范围：**纯前端**。真实排行榜后端整体移出本阶段；排行榜保持本地现状，不在本阶段改动数据与文案。
> 出口门禁：`pnpm verify`（typecheck → lint → repo:check → agents:map:check → test）。

---

## 0. 结论先行

本计划承接 2026-11-03 UI/UX 全链路整改的剩余项，拆成 5 条工作流：

| 工作流 | 目标 | 优先级 | 主要归属 |
|---|---|---|---|
| A 浅色主题「白天牌室」重构 | 从「暗色 token + 37 处组件补丁」升级为「token 驱动、补丁白名单化」 | P0 | `ui-ux-dev` + `platform-dev` |
| B Hero 高度压缩 | 首屏叙事更紧凑，桌面 hero 约压缩 25–35%，不删标题、不删文案 | P1 | `ui-ux-dev` + 各 feature-dev |
| C Puzzle tier 配色统一 | 三档行动色单一来源，保留「颜色不暗示答案」 | P1 | `puzzle-trainer-dev` + `ui-ux-dev` |
| E Emoji 白名单校准 | 以 DESIGN.md §7 为唯一白名单，补齐数据/文案扫描面 | P2 | `platform-dev` + `ui-ux-dev` |
| F 内容区 h2 语义约束 | 保留 h2 视觉标题，只做语义收敛，不做文案去重 | 约束项 | `platform-dev` |

**锁定决策（本计划不再推翻）**

1. 内容区视觉标题按计划**保留为 `h2`**：保留现有标签、视觉类名与文案；只保证全站唯一 `h1` 在壳层，**不删除、不合并、不去重**内容标题。
2. Puzzle tier 配色统一**不得**把档位色改成「正确/错误」反馈色；颜色只能表达行动强度，不能暗示答案。
3. 内容 / 插画 Emoji 以 [DESIGN.md §7](../../../DESIGN.md#7-图标与插画) 白名单为唯一权威；白名单之外新增 emoji 视为反模式。
4. **本阶段不引入任何后端、认证、云数据库或排行榜 SDK**；真实排行榜后端延后，排行榜保持本地现状。

**建议排期**：A/B/C/E/F 合计约 8–10 人日。A 的 token 层必须先于 B/C，否则 hero 与 tier 会把旧补丁再复制一遍。

---

## 1. 全栈开发组会诊记录

### 1.1 派单

【派单】主责：涂悦目（UI）· 协同：颜可见（前端组长）、李响应（React）、查无漏（测试）、常守恒（运维）、蓝图画（产品）、钟帷幄（技术总监）。

命中会诊条件：同时出现「视觉规范」「前端架构」「数据迁移（本地持久化）」「上线发布」四类信号；按 `delivery-team` 规则升级为多角色会诊。后端工作流已按最新约束整体移出，本阶段不涉及接口与云服务。

### 1.2 会诊表态

**蓝图画（产品）**：本阶段不再涉及产品定位变更。排行榜后端移出后，PRD 的「数据全部本地」口径不需要改；排行榜保持现有的本地演示与「我的排名」即可。需要产品确认的只剩三件：hero 压缩后首屏叙事是否仍成立、aggressive 档是否改 terra、以及内容区 h2 保留的例外登记。

**涂悦目（UI）**：浅色主题不能再靠 `html[data-theme="light"] .组件` 逐个打补丁。当前 37 处 light 选择器说明暗色假设已经渗进组件层；绿呢牌桌、牌背这类「物理物件」可以保持深色，但页面、面板、导航、纸张必须由 token 驱动。Hero 压缩要压的是留白和装饰，不是标题和文案；Puzzle tier 的三档色要统一到同一套 tier token，但绝不能借用 success/danger。

**颜可见（前端组长）**：同意 token 化，但要分阶段，不能一次替换全部 152 处黄铜字面 rgba 和 36 处黑色字面 rgba。建议先建语义层与补丁白名单，再按「壳层 → shared → feature」推进；每阶段都能独立回滚。排行榜页面只做浅色主题适配，不改数据与交互契约。

**查无漏（测试）**：当前项目没有 Playwright，hero 高度和主题视觉无法用 jsdom 守住。建议新增两类守卫：一是 token 层对比度与 light 补丁白名单（可在 Vitest 里做），二是浏览器验收清单（1440×900 / 1024×768 / 390×844，双主题）。Puzzle tier 要有「pre-answer 不得引用 success/danger」的静态守卫；排行榜保持现有本地契约，不改测试口径。

**常守恒（运维）**：本阶段没有后端项目、密钥或 CORS 变更；GitHub Pages 的构建与发布流程不变。需要保留的是每次提交的 `pnpm verify` 与 `size:check`，以及纯 CSS 改动按提交回滚的能力。

**石磐安（后端组长）**：本阶段无后端事项。排行榜保持本地；若未来重启在线榜，需要重新走产品闸门、隐私口径与 RLS/限流设计，不在本计划内。

### 1.3 拍板

【拍板】钟帷幄：

1. **A/B/C/E/F 按序推进**，因为它们不改变产品定位，且共享同一套样式与守卫；A 的 token 层先行。
2. **真实排行榜后端整体移出**：排行榜保持本地现状（虚构角色 + 演示说明 + 我的排名），本阶段不改数据、不改文案、不改测试契约；仅做浅色主题适配。
3. **Puzzle tier 的 aggressive 档建议从 clay 改为 terra**：当前 light 主题下 `--clay #a83838` 与 `--poker-danger #a63f30` 几乎同色，违背「颜色不暗示答案」的初衷。保留 clay 作为备选，但必须接受这一视觉风险并在 DESIGN.md 登记。
4. **Hero 高度以浏览器实测为准**，先测基线再定预算；不在没有测量的情况下硬改。
5. **h2 决策不回退**：内容区视觉标题保留 h2 与现有文案；这是产品决策，优先于 DESIGN.md §10.6 的旧反模式条目，需在设计文档中登记例外。
6. **实现阶段下沉技能**：PRD/AC 走 `product-design`，测试门禁走 `qa-quality`，发布回滚走 `devops-pipeline`，前端编码走 `team-p8-full-stack`。

---

## 2. 范围与锁定约束

### 2.1 In scope

- 浅色主题 token 架构、组件适配、对比度与补丁白名单守卫。
- 六个 Hero（Dashboard FeltArena、Puzzle、Help、Progress RankPlaque、Academy Resume、Theory Resume）的高度压缩。
- Puzzle ActionBoard 三档 tier 的配色单一来源与防答案暗示守卫。
- Emoji 白名单扫描面补齐与文档登记。
- 内容区 h2 保留的回归测试与文档例外说明。

### 2.2 Out of scope / 明确不做

- **不引入任何后端、认证、云数据库、排行榜 SDK、接口层或环境变量**；真实排行榜后端整体延后。
- **不改动排行榜的本地数据与文案**：保留当前的 19 位虚构角色、演示数据说明与「我的排名」；不改 `Leaderboard.test.tsx` 的本地契约。
- 不删除、不合并、不去重内容区视觉标题与文案。
- 不把所有页面改成浅色；暗色仍是默认，浅色是「白天牌室」可选主题。
- 不把绿呢牌桌、牌背、场景卡改成浅色；它们是物理物件，允许在亮房间里保持深色。
- 不引入遥测、广告、社交关注、聊天等与本次修复无关的能力。
- 不新增第二种强调色；浅色主题仍只用黄铜作为唯一强调色。
- 不在本阶段引入 Playwright 作为 CI 门禁；浏览器验收先按清单执行，是否产品化另立 ADR。

---

## 3. 工作流 A：浅色主题「白天牌室」重构

### 3.1 现状证据

| 事实 | 位置 |
|---|---|
| 浅色主题已有一套 token 覆盖：felt→羊皮纸、walnut→浅木、ivory→深墨、brass→深黄铜、语义色加深、花色翻转、阴影变暖 | `src/styles/globals.css:2330-2406` |
| 但仍有 **37 处** `html[data-theme="light"]` 组件级选择器，分布在 puzzle、settings、rank plaque、panel/card、help、concept、FAQ 等 | `src/styles/globals.css`（grep `^html[data-theme="light"]`） |
| 组件 CSS 中仍有 **152 处**黄铜字面 `rgba(201,162,94 / 232,201,126 / 161,121,45, ...)` 与 **41 处**黑色字面 `rgba(0,0,0, ...)`；它们不会跟随 `--brass` / 主题阴影翻转 | `src/styles/globals.css` |
| 少量 TSX 仍含字面色值，其中 ConceptGraph 的 SVG 属于已登记的 §12.1 例外；PracticeDrill 的 framer-motion 关键帧是动画插值例外；HandReplayer 的绿呢桌与 CardBack 属于物理物件 | `ConceptGraph.tsx`、`PracticeDrill.tsx`、`HandReplayer.tsx`、`CardBack.tsx` |
| 对比度守卫目前只覆盖暗色房间 + 纸张 + light 的四个 paper 文本 token，未覆盖 light 房间的正文/次级/黄铜/语义文本 | `src/guards/feltContrast.test.ts` |
| PWA manifest 仍是深色背景与主题色 | `public/manifest.json:8-9` |
| 主题切换已实现：设置项、预渲染脚本、`useThemeApplier` 均已存在，不需要重做 | `SettingsPage.tsx:242-258`、`index.html:19-38`、`src/layouts/useThemeApplier.ts:15-33` |

**结论**：浅色主题不是「没有」，而是「token 翻转 + 组件补丁」的混合态。重构目标是让补丁只保留在物理物件与第三方例外上。

### 3.2 目标架构

三层结构，自下而上：

1. **Primitive 层**：现有 `--felt-*` / `--walnut-*` / `--ivory-*` / `--brass-*` / `--poker-*` 保留，`html[data-theme="light"]` 只覆盖这些原语。
2. **Semantic 层（新增）**：面向组件的语义 token，全部引用 primitive，不写死色值。
   - 表面：`--room-page` / `--room-surface` / `--room-surface-raised` / `--room-surface-sunken`
   - 线条：`--room-line` / `--room-line-strong` / `--room-hairline`
   - 文字：`--room-ink` / `--room-ink-dim` / `--room-ink-muted` / `--room-accent-text`
   - 黄铜透明度阶：`--brass-a06` / `--brass-a10` / `--brass-a14` / `--brass-a18` / `--brass-a25` / `--brass-a40` / `--brass-a55`
   - 阴影：`--room-shadow-sm` / `--room-shadow` / `--room-shadow-lg` / `--room-inset-shadow`
   - 渐变：`--room-surface-gradient` / `--room-hero-gradient` / `--room-metal-gradient`
3. **Component 层**：`.panel` / `.theme-card` / `.puzzle-card` / `.module-card` / `.rec-item` / `.streak-rail` / `.help-hero` / `.puzzle-hero` / `.rank-plaque-hero` 等改用 semantic token；light 主题不再逐个组件写 `background`。

**物理物件白名单**（允许在 light 主题保持深色，必须使用 `--table-*` token 而不是 `--felt-*`）：

- `.felt-arena` / `.mini-felt` / `.scenario-card` / 牌桌相关装饰
- `CardBack` 牌背
- `HandReplayer` 的绿呢桌面
- `shareCard` 导出的分享卡（独立画布，不随主题）
- 第三方 SVG / 动画关键帧的已登记例外

### 3.3 关键规则

1. `html[data-theme="light"]` 块内**只允许** token 声明与物理物件白名单选择器；新增组件级补丁必须先登记 `src/guards/README.md` 与 DESIGN.md，否则守卫变红。
2. 所有黄铜发线、glow、alpha 背景改用 `--brass-a*` 或 `color-mix(in srgb, var(--brass) …)`；禁止新增 `rgba(201,162,94, …)` 字面量。
3. 所有阴影改用 `--room-shadow-*`；禁止新增 `rgba(0,0,0, …)` 字面量（已登记的 SVG / 动画例外除外）。
4. 语义文本继续使用 §2.7 的 `--clay-text` / `--danger-text` / `--sage-text` / `--brass-text`，不得回退到原语。
5. 纸张作用域 `.dealer-slip` 的重锚规则不变；light 主题只改纸张底色/边/黄铜，不改 ink 与四个语义色。
6. `meta[name="theme-color"]`、`color-scheme`、`data-theme` 三处保持同步；新增主题相关样式不得绕过这三个入口。

### 3.4 任务拆解

| 编号 | 任务 | 文件 | 产出 |
|---|---|---|---|
| A1 | 建立 semantic token 与 `--brass-a*` / `--room-shadow-*`；替换 `:root` 与 light token 块 | `src/styles/globals.css` | token 层可用，视觉不变 |
| A2 | 把 37 处 light 组件补丁收敛为：token 可表达的删除；物理物件/第三方例外登记白名单 | `src/styles/globals.css`、`src/guards/README.md` | light 补丁数 16（已登记白名单，只减不增） |
| A3 | 壳层与导航：`AppLayout`、`Sidebar`、`Header`、`TableRail`、`MobileNav`、`MobileTrainingSheet` | `src/layouts/**`、`src/shared/components/**` | 白天牌室的木框/桌面/导航成立 |
| A4 | shared 组件：`Panel` / `Card` / `Button` / `Pill` / `Input` / `Select` / `Dialog` / `Sheet` / `Toast` / `EmptyState` / `LoadingState` / `ResultSummary` / `MottoEngraved` | `src/shared/components/**` | 组件在双主题下一致 |
| A5 | feature 页面适配：Dashboard（FeltArena/StreakRail/图表）、Progress（RankPlaque/AccuracyChart/WeaknessAnalysis）、Academy（Home/Resume/LevelLadder/ConceptGraph）、Theory、Puzzle（Home/Hero/Card/ActionBoard）、Help、Range、PotOdds、GTO、HandHistory、Onboarding、Settings、Leaderboard（仅主题适配，不改数据） | 各 feature 组件 | 全路由无暗色残留面 |
| A6 | 图表与 SVG：Recharts 已用 CSS 变量，补齐 tooltip/axis/grid 的 light 校验；ConceptGraph 的 SVG 例外保持注释锚定 | `AccuracyChart.tsx`、`WeaknessAnalysis.tsx`、`ModuleStatsPage.tsx`、`ConceptGraph.tsx` | 图表在羊皮底可读 |
| A7 | PWA：`manifest.json` 的 `background_color` / `theme_color` 决策（建议保留品牌深绿，或改中性羊皮；需产品拍板） | `public/manifest.json` | 启动屏不刺眼、不误导 |
| A8 | 守卫：扩展 `feltContrast.test.ts` 覆盖 light 房间文本；新增 `lightThemeSurfaceGuard.test.ts`（补丁白名单 + 字面量棘轮只减不增） | `src/guards/**` | 防回流 |
| A9 | 文档：DESIGN.md 新增 light theme 章节与 token 表；CHANGELOG 记录 | `DESIGN.md`、`docs/CHANGELOG.md` | 设计契约同步 |

### 3.5 验收标准

- [ ] 15+ 路由在 `dark` / `light` 双主题下无「暗色卡片落在羊皮纸页面」的断层。
- [ ] 绿呢牌桌、牌背、场景卡在 light 主题下仍为深色，且与羊皮房间的过渡自然。
- [ ] 正文/次级/说明/黄铜/语义文本在 light 主题下 ≥ 4.5:1；主文字 ≥ 7:1。
- [ ] light 组件级补丁数不超过 16 条白名单；新增补丁须先登记。
- [ ] 主题切换无首屏闪烁；系统主题变化实时响应；`theme-color` 同步。
- [ ] `pnpm verify` 全绿，`size:check` 不因主题改动超预算。

### 3.6 风险与回滚

| 风险 | 缓解 |
|---|---|
| token 重命名导致大面积样式失效 | 不重命名既有 token；只新增 semantic alias，分阶段替换 |
| 纸张作用域被 light token 污染 | 保持 `.dealer-slip` 独立重锚；新增 light 守卫检查 |
| 图表/SVG 读取 CSS 变量失败 | 沿用现有 `stroke="var(--…)"` 模式；对 SVG stop 保留注释锚定 |
| 视觉回归不可自动发现 | 浏览器双主题截图清单；后续再评估 Playwright |

**回滚**：A 系列只改 CSS 与少量组件类名，按提交粒度回滚即可；不涉及持久化 schema。

---

## 4. 工作流 B：Hero 高度压缩

### 4.1 现状估算（以 1440×900 为基准，实施前先实测）

| Hero | 实施前估算 | 实施后实测（桌面 / 移动） | 预算（桌面 / 移动） |
|---|---|---|---|
| Dashboard `FeltArena` | ~400px | **297 / 240** | ≤ 300 / ≤ 245 |
| Puzzle `PuzzleHero` | ~338px | **259 / 225** | ≤ 260 / ≤ 230 |
| Help `HelpHero` | ~268px | **232 / 245** | ≤ 235 / ≤ 250 |
| Progress `RankPlaqueHero` | ~223px | **184 / 121** | ≤ 185 / ≤ 130 |
| Academy `AcademyResume` | ~153px | **144 / 162** | ≤ 145 / ≤ 165 |
| Theory `TheoryResume` | ~153px | **137 / 227** | ≤ 140 / ≤ 230 |
| Settings `settings-hero` | ~134px | **101 / 101** | ≤ 120 / ≤ 140 |

> 实测口径：headless Chrome，1440×900 与 390×844，`getBoundingClientRect().height`，dark/light 数值一致。Theory 移动端保留进度环与三项统计，因此预算高于桌面；其余 Hero 均达到或低于原目标。

### 4.2 压缩原则

1. 只压留白、装饰尺寸、次要信息布局；**不删 h2、不删文案、不做文案去重**。
2. 保持每个 hero 的签名元素：FeltArena 椭圆桌、Puzzle 翻开的牌、Help 立牌、Progress 牌匾、Academy/Theory 进度环。
3. 移动端优先保 CTA 与标题；装饰可缩小或移到标题下方，但不得造成横向滚动。
4. 所有可点元素仍满足 44×44px 触摸目标（DESIGN.md §6.3）。
5. 压缩后的 hero 不得因中英文长度差异破版；zh/en 都要验收。

### 4.3 具体改动

**B1 Dashboard FeltArena（收益最大）**

- `src/styles/globals.css`: `.felt-arena` 的 `min-height: 250px → 200px`；`padding: 30px 60px 26px → 18px 44px 16px`；`margin-top: -22px → -12px`；`.felt-arena-decor` 的 `margin: 12px 0 10px → 6px 0 4px`，卡堆容器高度 66 → 48；`.felt-arena-stats` 的 `padding: 10px 14px → 6px 10px`；`.felt-suit-row` 的 `margin-top: 12px → 6px`。
- `FeltArena.tsx`: 将 `DailyGoalCard` 从 `.felt-arena` 内部移到 hero 之后（推荐）；若产品要求留在 hero 内，则改成单行进度条形式，高度 ≤ 36px。
- 桌面端把「今日进度」并入 stats 三格；移动端保留三格 + 单独目标行。
- 预计收益：-80 ~ -110px。

**B2 PuzzleHero**

- `.puzzle-hero` padding `22px 26px → 16px 22px`；`.puzzle-hero-grid` gap `28px → 20px`；`.puzzle-hero-title` `27px → 24px`；`.puzzle-hero-actions` `margin-top: 18px → 12px`。
- `.puzzle-face` 宽度 `210px → 170px`（高度约 238px）；移动端 `150px → 132px`；`.puzzle-face-mark` `64px → 52px`。
- 预计收益：-60 ~ -80px。

**B3 HelpHero**

- `.help-hero` padding `22px 26px 26px → 16px 22px 18px`；`.help-hero-grid` gap `32px → 22px`；`.help-hero-title` `24px → 22px`；`.help-hero-actions` `margin-top: 18px → 12px`。
- `.house-rules-card` `max-width: 320px → 280px`；padding `18px 18px 16px → 14px 14px 12px`；`.house-rules-list` gap `6px → 4px`。
- 移动端 padding `18px 18px 22px → 14px 16px 16px`。
- 预计收益：-30 ~ -40px。

**B4 Progress RankPlaqueHero**

- `.rank-plaque-hero` padding `18px 22px 12px → 12px 18px 8px`；`.rp-eyebrow` margin-bottom `14px → 8px`；`.rp-plaque` padding `16px 20px → 12px 16px`；`.rp-plaque-score` `30px → 26px`；`.rp-metric` padding `12px → 9px`；`.rp-metrics` gap `10px → 8px`；`.rp-foot` margin/padding `14px/10px → 8px/8px`。
- 预计收益：-35 ~ -45px。

**B5 AcademyResume / TheoryResume**

- `.panel` 的 padding 保持 20px（全局影响大，不在 B 中改）；hero 内部 `gap-5 → gap-4`、CTA `mt-4 → mt-3`；进度环 76 → 64（`ProgressRing` / `TheoryProgressRing` 同步）；`.academy-hero-stats` / `.theory-hero-stats` gap `7px → 4px`。
- 移动端统计改两列，避免三行。
- 预计收益：-10 ~ -15px。

**B6 SettingsHero**

- `.settings-hero` padding `18px 22px 16px → 14px 18px 12px`。
- 预计收益：-4 ~ -8px。

### 4.4 验收标准

- [ ] 1440×900、1024×768、390×844 三档实测高度不超过预算表目标值。
- [ ] 每个 hero 的 h2、CTA、签名元素仍在首屏可见；无横向滚动。
- [ ] 中英文均不破版；英文标题不超过两行。
- [ ] 移动端触摸目标 ≥ 44×44px。
- [ ] `pnpm verify` 全绿。

### 4.5 风险与回滚

- 牌匾/立牌缩小后文字可能溢出：优先减 padding，再缩装饰；实测后再冻结数值。
- `DailyGoalCard` 移出 hero 会改变 Dashboard 叙事顺序：需产品确认；如果不同意，采用单行内嵌方案。
- 纯 CSS 改动，按提交回滚即可。

---

## 5. 工作流 C：Puzzle tier 配色统一（保留防答案暗示）

### 5.1 现状证据

| 事实 | 位置 |
|---|---|
| `ActionBoard` 按 category 分三档：passive（0-1）/ standard（2-5）/ aggressive（6） | `src/features/puzzle-trainer/components/ActionBoard.tsx:49-55` |
| gauge 点色：passive 用 `dot--frost`（实际 CSS 指向 indigo-bright）、standard 用 brass、aggressive 用 clay | `ActionBoard.tsx:57-62`、`globals.css:1598-1609` |
| 图标色：passive 用 indigo-bright、standard 用 brass-bright、aggressive 用 clay-text | `ActionBoard.tsx:68-72` |
| 按钮主体：passive indigo 底/边/标签；standard brass 底/边但标签 ivory；aggressive clay 底/边/标签，并加大字号/字重 | `globals.css:1636-1686` |
| light 主题为 action tile 单独写了 7 条覆盖 | `globals.css:1713-1743` |
| 答错反馈使用 `--clay` / `--clay-text`，与 aggressive 档同源；而正确反馈使用 `--poker-success` | `globals.css:1695-1700` |
| Puzzle 首页还有另一套「难度档」：beginner=sage / intermediate=brass / advanced=clay | `globals.css:1268-1279` |

**问题**：同一档位在 gauge、图标、标签、边框、背景上取自不同 token；light 主题重复维护；aggressive 档与答错反馈在 light 主题下几乎同色，削弱「答题前颜色不暗示答案」的边界。

### 5.2 设计决策

1. **区分两套 tier 语义，不强行合并颜色**：
   - `ActionTier`（行动强度）：passive / standard / aggressive。
   - `DifficultyTier`（题目难度）：beginner / intermediate / advanced。
   两者含义不同，共用「低饱和、非反馈色」原则，但不要求同色；在 DESIGN.md 用一张表登记两套语义，避免后续把「难度红」误用到「行动红」。
2. **ActionTier 使用专用 token**，不再从 `--clay` / `--dot--frost` 等历史名借色：
   - passive：indigo 家族。
   - standard：brass 家族。
   - aggressive：**推荐 terra 家族**（`--poker-terra` / `--poker-terra-bright`），替代 clay。理由：terra 与 `--poker-danger` 在 light 主题下仍有可辨差异，且保持「激进」的暖色语义。
   - 备选：保留 clay，但必须在 DESIGN.md 登记「clay 为行动强度色，不是 danger 反馈色」；若 light 主题下无法达到可辨差异，则不采纳。
3. **反馈色只在答后出现**：`success` 只用于正确，`danger` 只用于错误；不得用于任何 pre-answer tier。
4. **同一档位的所有视觉元素同源**：边框、背景、标签、gauge、图标全部读同一组 `--tier-*` 变量。

### 5.3 Token 设计

```css
/* :root 与 html[data-theme="light"] 均可覆盖 */
--tier-passive-ink: var(--poker-indigo-bright);
--tier-passive-border: color-mix(in srgb, var(--poker-indigo) 55%, var(--walnut-border));
--tier-passive-fill-1: color-mix(in srgb, var(--poker-indigo) 14%, var(--walnut-raised));
--tier-passive-fill-2: color-mix(in srgb, var(--poker-indigo) 6%, var(--walnut));
--tier-passive-glow: var(--poker-indigo-bright);

--tier-standard-ink: var(--brass-text);
--tier-standard-border: var(--brass-deep);
--tier-standard-fill-1: color-mix(in srgb, var(--brass) 10%, var(--walnut-raised));
--tier-standard-fill-2: color-mix(in srgb, var(--brass) 4%, var(--walnut));
--tier-standard-glow: var(--brass-bright);

--tier-aggressive-ink: var(--poker-terra-bright);
--tier-aggressive-border: color-mix(in srgb, var(--poker-terra) 55%, var(--walnut-border));
--tier-aggressive-fill-1: color-mix(in srgb, var(--poker-terra) 15%, var(--walnut-raised));
--tier-aggressive-fill-2: color-mix(in srgb, var(--poker-terra) 6%, var(--walnut));
--tier-aggressive-glow: var(--poker-terra-bright);
```

`.action-tile` 基类只声明 `--tier-*` 的默认值；`[data-tier="passive"]` 等选择器统一覆盖。`ActionBoard.tsx` 删除 `TIER_DOT` / `TIER_ICON_COLOR`，gauge 与图标统一读 `var(--tier-*-ink)` / `var(--tier-*-glow)`。

### 5.4 任务拆解

| 编号 | 任务 | 文件 |
|---|---|---|
| C1 | 定义 action tier token（dark/light 两套，尽量用 color-mix 自动联动） | `src/styles/globals.css` |
| C2 | 重写 `.action-tile-*` 为 `[data-tier]` 驱动；删除 7 条 light 专属覆盖 | `src/styles/globals.css` |
| C3 | `ActionBoard.tsx` 删除重复色映射，保留 `data-action-icon` 与 Lucide 图标 | `ActionBoard.tsx` |
| C4 | 答错反馈改用 `--poker-danger` / `--danger-text`，与 aggressive 档彻底分离 | `src/styles/globals.css` |
| C5 | 在 DESIGN.md 登记 ActionTier / DifficultyTier 两套语义与色表 | `DESIGN.md` |
| C6 | 新增 `actionTierPalette.guard.test.ts`：pre-answer tier 类不得引用 success/danger；三档 token 在双主题下齐备；light 覆盖数不得增长 | `src/guards/**` |
| C7 | 更新 `ActionBoard.test.tsx`：断言 `data-tier`、图标、gauge 同源；断言答后反馈仍用 success/danger | `ActionBoard.test.tsx` |

### 5.5 验收标准

- [ ] 三档在 dark/light 下均视觉可区分，且同档的边框/背景/标签/gauge/图标同色源。
- [ ] 答题前不出现 success/danger 语义色；答题后正确/错误明确覆盖 tier。
- [ ] 色盲用户仍可通过 Lucide 图标 + gauge 点数区分（颜色不是唯一通道）。
- [ ] light 主题不再为 action tile 单独维护 7 条覆盖。
- [ ] `pnpm verify` 全绿。

### 5.6 风险与回滚

- 把 aggressive 从 clay 改 terra 会改变品牌观感：先做一版视觉对比截图，由 `ui-ux-dev` 复核；若否决，回退 clay 并登记风险。
- standard 标签改用 brass-text 可能降低可读性：必须在 tier 填充底上实测 ≥ 4.5:1；不达标则保留 ivory 标签，并记录「图标/gauge 与标签不同源」的例外。
- 纯 CSS + 组件映射改动，按提交回滚。

---

## 6. 工作流 E：Emoji 白名单校准

### 6.1 现状

[DESIGN.md §7](../../../DESIGN.md#7-图标与插画) 已给出完整边界：

- 交互控件、导航、按钮、徽章、空态、状态反馈、仪表盘/首页首屏可视图标：一律 Lucide。
- Emoji 白名单：成就体系、分享卡、庆祝插画、课程/理论正文数据、`src/i18n/locales/**` 既有文案。

当前 `emojiWhitelist.guard.test.ts` 只扫描：

- `src/shared/components/**`
- `src/features/**/components/**`
- `shared/types/{elo,mentor,opponent,decisionFeedback}.ts`
- `shared/data/opponentProfiles.ts`

**缺口**：白名单中的 `progress/data/achievements.ts`、`strategy-academy/data/lessons/**`、`learningTracks.ts`、`localLessons/**`、`basicsContent.ts`、`theory-academy/data/levels/**`、`i18n/locales/**` 都不在扫描面内。

### 6.2 方案

1. **不新建第二套白名单**：以 DESIGN.md §7 为唯一权威，把扫描面补齐到它描述的范围。
2. 新增 `CONTENT_EMOJI_ALLOWLIST`（文件 + 允许数量），只减不加；对数据与 i18n 做「快照式棘轮」：新增 emoji 或数量增加即失败。
3. 保留 `ILLUSTRATION_ALLOWLIST` 管组件插画；保留 `TYPOGRAPHIC_GLYPHS` 管花色/状态记号。
4. 本阶段不改排行榜 UI；未来新增榜单 UI 时只用 Lucide，不得用 emoji 表示排名、奖杯、同步状态。
5. 更新 `src/guards/README.md` 与 DESIGN.md §7 的扫描面说明。

### 6.3 任务与验收

| 编号 | 任务 | 文件 |
|---|---|---|
| E1 | 扫描数据/i18n 的 emoji 现状，生成文件-数量快照 | `src/guards/emojiWhitelist.guard.test.ts` |
| E2 | 增加 `CONTENT_EMOJI_ALLOWLIST` 与只减不增断言 | 同上 |
| E3 | 清理白名单外的新增 emoji（如有） | 对应数据/文案 |
| E4 | 文档同步 | `src/guards/README.md`、`DESIGN.md` §7 |

验收：

- [ ] 组件层与内容层都在扫描面内；白名单外零命中。
- [ ] 失效条目（文件已无 emoji）自动变红并删除。
- [ ] `pnpm verify` 全绿。

---

## 7. 工作流 F：内容区 h2 语义约束

### 7.1 决策

- 全站唯一 `h1` 仍由壳层 `AppLayout` / `BlankLayout` `sr-only` 承担。
- 内容区视觉标题保留 `h2`（包括 28px 的排行榜标题、Puzzle/Help/Academy/Theory hero 标题），保留现有文案与视觉类名。
- **不做文案去重**：不因为顶栏页名与内容标题重复而删除内容标题。
- 不在本阶段新增 `h1`；`pageHeadingGuard.test.ts` 的 `H1_ALLOWLIST` 不扩容。

### 7.2 已登记的例外

DESIGN.md §10.6 原有反模式条目：「内容区 H2 与顶栏 H1 重复显示同一页名」。本决策与该条目冲突，已在 DESIGN.md §5.7 与 §10.6 增补明确例外：

> 内容区视觉标题保留 h2；允许与壳层 h1 同义/同名；仅要求全站唯一 h1，不要求文案去重。该例外由产品决策锁定，后续代理不得以「去重」为由删除内容标题。

### 7.3 回归测试

- `Leaderboard.test.tsx`：保持现有本地契约；新增断言页面存在 `h2`，且无 `h1`。
- `PuzzleHero.test.tsx` / `HelpHero.test.tsx`：断言 `h2` 仍为标题节点。
- `Dashboard.test.tsx`：断言 FeltArena 欢迎语仍为 `h2`。
- 可选的轻量守卫：扫描上述组件的 `h2` 存在性；不做全仓 h2 数量断言，避免与合法内容标题冲突。

验收：

- [ ] 上述组件测试通过。
- [ ] `pageHeadingGuard` 仍绿（h1 集合不变）。
- [ ] DESIGN.md 例外条目已登记。

---

## 8. 排期、依赖与提交切片

### 8.1 依赖关系

```
A1 token 层
 ├─ A2 light 补丁收敛 ── A3/A4/A5/A6 组件与页面适配 ── A8 守卫
 ├─ B  hero 高度（依赖 A 的 padding/token 语义） ── 浏览器验收
 └─ C  tier token（依赖 A 的 color-mix/语义层） ── C6 守卫

E emoji 守卫（独立，可在 A 之后）
F h2 回归（独立，最后统一跑）
```

### 8.2 建议提交切片

| 顺序 | 提交信息 | 内容 |
|---|---|---|
| 1 | `docs(architecture): 新增第二阶段纯前端 UI/UX 修复计划` | 本文件 |
| 2 | `refactor(ui): 建立浅色主题 semantic token 与黄铜透明度阶` | A1 |
| 3 | `refactor(ui): 收敛浅色主题组件补丁并适配壳层与 shared 组件` | A2/A3/A4 |
| 4 | `fix(ui): 适配各 feature 页面与图表的白天牌室主题` | A5/A6/A7 |
| 5 | `style(ui): 压缩六个 hero 的留白与装饰尺寸` | B1–B6 |
| 6 | `refactor(puzzle-trainer): tier 配色单一来源并保留防答案暗示` | C1–C4 |
| 7 | `test(guards): 增加浅色主题、action tier 与 emoji 内容白名单守卫` | A8/C6/E1/E2 |
| 8 | `docs: 同步 DESIGN/CHANGELOG 与测试规范` | 全部文档 |

> 每个切片独立 commit，互不混装；提交前逐片跑 `pnpm verify`。

---

## 9. 质量门禁与验证矩阵

### 9.1 自动门禁

- [ ] `pnpm typecheck` exit 0
- [ ] `pnpm lint` exit 0
- [ ] `pnpm repo:check` exit 0
- [ ] `pnpm agents:map:check` exit 0（新增文件/路由后先 `pnpm agents:map`）
- [ ] `pnpm test` exit 0
- [ ] `pnpm build` + `pnpm size:check` exit 0

### 9.2 新增/调整守卫

| 守卫 | 断言 |
|---|---|
| `feltContrast.test.ts`（扩展） | light 房间的正文/次级/说明/黄铜/语义文本 ≥ 4.5:1；主文字 ≥ 7:1 |
| `lightThemeSurfaceGuard.test.ts`（新增） | light 组件补丁 ⊆ 白名单；黄铜/黑色字面量只减不增 |
| `actionTierPalette.guard.test.ts`（新增） | pre-answer tier 不得引用 success/danger；三档 token 双主题齐备；light 覆盖不增长 |
| `emojiWhitelist.guard.test.ts`（扩展） | 组件层 + 内容层白名单外零命中；失效条目变红 |

### 9.3 浏览器验收矩阵

| 视口 | 主题 | 页面 |
|---|---|---|
| 1440×900 | dark / light | `/`、`/progress`、`/leaderboard`、`/academy`、`/theory`、`/puzzle`、`/help`、`/range`、`/pot-odds`、`/gto`、`/hand-history`、`/settings` |
| 1024×768 | dark / light | 上述核心页 + `/academy/concept-graph`、`/academy/tracks` |
| 390×844 | dark / light | 上述核心页 + `/onboarding`、`/puzzle/daily`、`/puzzle/rush` |

检查项：无横向滚动、hero 高度达标、h2 仍可见、CTA 可点、触摸目标 ≥ 44px、无原始 i18n key、无暗色残留面、图表可读。排行榜页面只检查主题与 h2，不检查数据状态。

### 9.4 文档同步

- `DESIGN.md`：v1.9，新增 light theme 章节、hero 高度契约、ActionTier/DifficultyTier 语义表、h2 例外说明；§7 白名单扫描面。
- `docs/CHANGELOG.md`：记录第二阶段完成项与未完成项（排行榜后端仍为未纳入）。
- `docs/testing/README.md`：新增守卫与浏览器验收矩阵。
- `docs/agents/MODULE_MAP.md`：新增文件/路由后由 `pnpm agents:map` 重生成。
- `src/guards/README.md`：新增守卫清单与 allowlist 规则。
- `docs/PRD.md` / `docs/TDD.md`：本阶段无后端与产品定位变更，不需要为排行榜改口径；如新增主题 token 架构说明，仅补 TDD 的实现约定。

---

## 10. 待拍板事项

| 编号 | 事项 | 建议 | 影响 |
|---|---|---|---|
| O1 | aggressive tier 用 terra 还是保留 clay | terra | 决定 C 的视觉与防暗示强度 |
| O2 | `DailyGoalCard` 是否移出 FeltArena | 移出（推荐） | 决定 B1 的收益与 Dashboard 叙事 |
| O3 | PWA manifest 的浅色启动屏 | 保留品牌深绿或改中性羊皮 | 决定 A7 |
| O4 | 是否把 Playwright 纳入 CI | 本阶段不纳入，先清单验收 | 决定长期视觉回归能力 |

---

## 11. 完成定义（Definition of Done）

- 5 条工作流全部有对应提交、测试与文档；没有「只改代码不改契约」的遗留。
- `pnpm verify` 全绿；`pnpm build` 与 `size:check` 通过。
- 双主题、三视口浏览器验收通过；hero 高度在预算内；h2 保留；无原始 i18n key。
- 排行榜保持本地现状，未引入后端、认证、云数据库或排行榜 SDK；`Leaderboard.test.tsx` 的本地契约不变。
- DESIGN.md / CHANGELOG / testing / guards README / MODULE_MAP 全部同步。

---

## 12. 执行结果（2026-11-03）

本条为计划落地后的回填记录，后续复核以此为当前事实。

- **浅色主题**：light 组件级选择器 37 → 16（全部登记在 `lightThemeSurfaceGuard`）；黄铜字面 rgba 152 → 0；黑色字面 rgba 锁 41 条棘轮；light `--ivory-muted` 调深到 `#665b43`（felt-deep 5.13:1 / walnut-raised 4.80:1）。
- **Hero 高度**：实测桌面 / 移动 = Dashboard 297/240、Puzzle 259/225、Help 232/245、Progress 184/121、Academy 144/162、Theory 137/227、Settings 101/101；与原目标基本一致，Theory 移动端因保留进度环与三项统计放宽到 ≤230。
- **Puzzle ActionTier**：passive indigo / standard brass / aggressive terra；light 主题 action tile 补丁清零；答错反馈改用 `--poker-danger` / `--danger-text`；`actionTierPalette.guard.test.ts` 7 项断言通过。
- **Emoji**：内容层扫描 `features/**/data/**`、`shared/data/**`、`i18n/**`；45 个白名单命中文件，白名单外零命中；`puzzleBank` 在剔除花色/排版记号后零 emoji；排版箭头 `↔` 单独豁免。
- **h2**：Dashboard / Puzzle / Help / Leaderboard 新增 h2 保留断言；`pageHeadingGuard` 仍绿；DESIGN.md 已登记例外。
- **质量门禁**：`pnpm verify` 全绿（typecheck / lint / repo:check / agents:map:check / 352 文件 2538 用例；lint 2 条既有 warning、0 error）；`build` 产出 `dist/`，首屏 JS 719.77 KB，`size:check` 通过。正常 PowerShell 7 终端（加载 `C:\Users\24533\Documents\PowerShell\profile.ps1`，`pnpm` → `F:\dev\bin\pnpm.exe` 11.18.0）可直接执行；非交互 shell（`powershell -NoProfile` / Git Bash）不加载该 profile，需显式加入 `F:\dev\bin` 或使用 `corepack pnpm`。
- **浏览器验收**：headless Chrome 1440×900 / 390×844，dark/light 双主题；14 个 Hero 测量全部完成；截图确认浅色牌室、紧凑 Help/Puzzle 移动布局、Puzzle tier 三色可辨；无横向滚动。
- **未做**：排行榜后端（按纯前端约束移出）、Playwright CI 接入（维持清单验收）。
