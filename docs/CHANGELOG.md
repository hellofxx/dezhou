# 变更日志（CHANGELOG）

> 本文件归档德州扑克训练平台的版本演进。
> 历史月份存档位于 `docs/changelog/` 目录下（如 `docs/changelog/2026-07.md`）。
> PRD.md 与 TDD.md 仅保留当前规格，执行历史统一汇集于此。
> 2026-08 及更早：见 docs/changelog/2026-08.md、2026-07.md

---

## [Unreleased] - 2026-09-05

### 2026-10-19 仓库结构与 Agent 工作流优化 Phase 1（6 个 commit）

Phase 1 只做「不改变产品行为」的工程卫生：把历史包袱移出主仓、把守卫与文档收进有明确归属的位置，并为后续规模治理装上只减不增的棘轮。全部改动经 `pnpm verify` 与 `pnpm build` 终验。

- **仓库卫生**：备份并移除嵌套 `docs/.git`（`.archive/docs-nested.bundle`，730K，本地 gitignore），`docs/` 不再以 gitlink 形式出现在主仓库；删除 `poker-ui-demo` 生成物（`.preflight/`、`runtime-orchestration-summary.json`、`validation-report.json`）与 6 个 `scripts/tmp-*` 一次性脚本；新增 `scripts/check-repo-hygiene.mjs` + `repo:check`，把「嵌套 git 仓库 / 临时脚本 / 生成物 / 被跟踪的已归档 docs」四类违规做成静态门禁，接入 `verify` 与 CI；新增 `poker-ui-demo/README.md` 声明该目录只是静态设计参考、不参与构建。
- **docs 结构**：新增 `docs/README.md` 统一索引（Current specs → Agents → Architecture → Ops → History → Archive）；运维文档移入 `docs/ops/`；`claude.md` 改为兼容指针（只指向 `AGENTS.md` / `docs/agents/behavior.md` / `docs/README.md`），行为准则全文移 `docs/agents/behavior.md`；`docs/analysis` 与 `docs/superpowers` 归档到本地 `.archive/`（`.archive/docs-analysis/` / `.archive/docs-superpowers/`，gitignore，git 历史保留）；`docs/CHANGELOG.md` 约 198K（202,212 字节）→ 256 行，2026-08 及更早内容归档到 `docs/changelog/2026-08.md`。
- **守卫归位**：7 个全局不变式守卫集中到 `src/guards/`（`dealerSlip.contrast` / `designTokenCssGuard` / `designTokenGuard` / `eslintCrossImports` / `huPositionOrderGuard` / `line-count-guard` / `rangePresetGtoConsistency`），a11y harness 移 `src/test-utils/a11y.ts`；同步修正守卫内部相对路径与 `termFormGuard` 例外清单；新增 `src/guards/README.md` 登记「保护的不变式 → 运行命令 → 新增约定」；文档 / 代理 / 注释中的旧根路径引用统一为 `src/guards/*`（17 文件 / 20 处）。
- **规模棘轮**：`src/guards/line-count-guard.test.ts` 删除按类别的宽泛豁免，改为 **39 条逐文件 allowlist**（登记实测行数，只减不增；300–400 行灰区 warning，>400 行未登记即失败）；新增 `src/guards/cssLineCountGuard.test.ts`（`src/styles/*.css` 单文件 ≤800 行，`globals.css` 在 Phase 2 拆分前按 3,398 行临时锁定，并自检扫描面防路径失效空跑）；`docs/AI_GUIDE.md` 补口径。
- **Agent 地图**：新增 `scripts/generate-agent-map.mjs` 与生成物 `docs/agents/MODULE_MAP.md`（10 模块 / 34 lazy 声明 / 34 行 i18n 分组，覆盖 owner / 入口 / store persist version / 允许跨模块边）；新增手写 `docs/agents/README.md` 任务路由表；`agents:map` / `agents:map:check` 接入 `verify`、CI 与 pre-commit（`.git-hooks/pre-commit`）；`AGENTS.md` 顶部增加任务导航表（任务 → 先读 → 负责代理）。
- **验证**：`pnpm repo:check` 通过（817 个被跟踪文件中无嵌套 git / 临时脚本 / 生成物 / 归档文档）；`pnpm agents:map:check` 通过（地图与代码事实一致：10 模块 / 34 lazy 声明）；`pnpm verify` **168 文件 / 1176 测试**全绿；`pnpm build` 通过（1.97s，仅既有 chunk >500kB 与 `INEFFECTIVE_DYNAMIC_IMPORT` 警告，无新增失败）。
- **commit**：1681ead（仓库卫生）/ 67ed79d（docs 重组与月度归档）/ 7d87c5a（守卫与测试工具归位）/ 5541532（规模棘轮）/ 411ae09（Agent 模块地图）+ 本次文档终验 commit。
- **遗留**：Phase 2 backlog（`globals.css` 拆分 / `puzzleBank` / progress store / 课程数据 / 大组件拆分）本批未执行；历史 `docs/changelog/*` 与 `docs/CHANGELOG.md` 既有条目中的旧守卫路径保留为历史事实，不回改；`eslint.config.js` 仍保留 `docs/analysis` ignore（目录已归档，无实际影响）。

### 2026-10-17 Design QA 修复 + 发牌员纸条材质 + 设计契约迁移 DESIGN.md v1.8（9 个 commit）

以 Design Review 走查壳层与共享组件，结论与上一批 help-center 同源：**偏差不是"不好看"，而是实现与契约长期无对照**。本批把材质从"深色房间一律深色"升级为角色绑定（DESIGN.md v1.7 → v1.8.0），并修掉一批层级、焦点与 aria 语义缺陷。

- **契约迁移**：`poker-ui-demo/` 下的旧设计语言文档 → 仓库根 `DESIGN.md`（v1.8.0）。迁移**不保留旧文件名与兼容 stub**——两份契约并存会把"以哪份为准"重新变成口头约定。全仓 **39 个文件**同批替换引用（源码注释、代理文件、TDD / CHANGELOG 均在内，198 增 / 108 删）。新增或改写条款：§1.5 材质契约（walnut 房间 / felt 画布 / ivory paper 纸条 / brass 镶嵌，各绑固定角色）、§2.6 纸张色板（`--paper*` 全套底色 / ink / 语义色，light 主题只调底与边，ink 与语义不变）、§5.23 `.dealer-slip`、§5.5 按钮金属族三级层次、§5.7 顶栏胡桃梁与壳层 h1 / 导航序号、§6.3 / §6.4 44px 触摸目标与 Z 轴（100 层）、§13.7.2 移动端反馈 Sheet 纸张化。判定规则写明：**一次性信息载体用纸、常驻外壳用木、训练台面用呢**；纸面内必须重锚 token，禁止逐处写死色值。
- **材质与视觉**：`globals.css` 新增 `--paper-*` 与 `--progress-track`（含 light 覆盖），落地 `.dealer-slip` 并在作用域内把 ink / brass / 语义 / 表面的 **canonical 与 alias**（含 Tailwind `@theme` 颜色别名）整体重锚到 paper 深阶——只改一侧会让纸面继续沿用暗色房间亮阶，对比度必掉。Dialog、移动端反馈 Sheet、`ResultSummary`、`BlankLayout` 快捷键浮层四处共用同一纸面；纸条带顶部内缩黄铜发线 `::before` 与中央黄铜钉 `::after`，呼应 `TableRail` 铆钉。壳层顶栏由悬浮条改为**胡桃梁**，与侧栏构成包住绿呢的 L 形木框；按钮收敛为金属族：一级黄铜渐变、二级深胡桃金属、三级 quiet 透明，**纯色平铺主按钮登记为反模式**。顺手修掉四处"看着能用"的细节：进度条轨道改引 `--progress-track`（浅色主题不再出现深底挖空感）、toast 移除 sonner `richColors`（其自带饱和调色板会绕过 §1.3 禁令）、`ResultSummary` 重试/返回按钮入场延迟 **1.2s → 0.3s**（原先要盯着结果页等一秒才出现操作）、`Sparkline` 渐变与描边由 `rgba(201,162,94,*)` / `--poker-brass` 改为 `var(--brass)` + `stopOpacity`。
- **无障碍与结构**：壳层统一为**唯一 h1**（`AppLayout` 顶栏 19/22px、`BlankLayout` `sr-only`），**接受与页面既有 h1 的短期重复、不做路由白名单**——白名单会随新模块漂移，重复至少语义正确且能逐步降级。补 skip link、`useDocumentTitle`（`页名 · 应用名`，卸载恢复）、`<html lang>` 随 i18n 同步（zh → `zh-CN`，影响读屏与断行）与路由切换播报。Radix Dialog / Sheet 统一焦点陷阱、Escape、关闭后焦点归还与背景滚动锁（Sheet 原为手写遮罩 + 自管焦点）。网格键盘导航改 roving tabindex：**13×13 网格 169 个 Tab 停靠点 → 1 个（三处消费方合计 3）**，方向键 / Home / End 移动、Enter / Space 选择、SVG 项兼容。牌面与筹码 aria 文案本地化（`Card` / `CardSVG` / `Chip` 不再向读屏器抛英文裸花色）；`Progress` **补下传 `value`**（Radix Root 只有拿到 value 才输出 `aria-valuenow` / `data-state`，此前读屏只播报"进度条"无数值）；`ProgressBar` / `DailyGoalCard` 补 `progressbar` 语义；`aria-controls` / `aria-pressed` / `role=status` 按控件实际状态接线；触摸目标统一 44px（含 `Button` 各尺寸移动端下限与 icon 变体）；清理重复可访问名称；删除零引用 `SuitIcon`（花色呈现已由 `CardSVG` 承担）。
- **测试**：`shared/test/a11y.ts` 改为**默认启用全部 axe 规则**——此前两个 a11y 测试整块禁用 8 条 page-level 规则，"元素不在 landmark 内 / 缺 h1 / 缺文档标题"这类真问题在组件测试里永远看不见。harness 约定渲染进 `<main><h1>`，`document.title` 与 `<html lang>` 由 `configureA11yDocument()` 提供；**豁免只允许逐条且必须带理由（reason 为空直接抛错）**，现存唯一豁免是整页概念的 `bypass`。新增 Button / Dialog / MobileFeedbackSheet / Progress / ProgressBar / CardSVG / Chip / BlankLayout 测试；新增 `src/dealerSlip.contrast.test.ts` **17 项断言**（两套主题各 1 条主文字 ≥7:1 + 7 条次级文字 ≥4.5:1，另 1 条锁 canonical 与 alias 的重锚映射）。全量 **167 文件 / 1170 测试**全绿。
- **未覆盖 / 遗留**：① **浏览器视觉全程未验证**（不起 dev server、不截图）——纸张渐变、胡桃纹理、黄铜钉、计算后的 44px、z 序、Sheet 300/200ms 时序、浅色主题下的纸张分离度、reduced-motion 表现，以及桌面与 375px 构图均需实测；② `select.tsx` / `tooltip.tsx` 仍残留同类的无效 `animate-in` 类（本轮只修 dialog / sheet），功能无感但会让人误以为动效由 Tailwind 插件提供；③ **`AppLayout` 396 行 > AI_GUIDE 300 行基线**（已抽出 `navSections.ts` 仍超），后续可再抽 header / sidebar；④ 壳层 h1 与页面既有 h1 的**双标题为已接受的过渡态**，待各模块逐步降级；⑤ 其它模块若在纸面内使用 `--sage` / `--clay` 等暗色房间亮阶，需各自复查（本轮只修了 `GTOResultPage` 一处）。
- **验证**：typecheck / lint exit 0（仅 `i18n/unitRef.test.ts` 两条既有 warning）；`vitest run` 167 文件 / 1170 测试全绿；`pnpm build` 通过（1.36s，仅既有 chunk >500kB 与 `INEFFECTIVE_DYNAMIC_IMPORT` 警告，无新增失败）。

---

### 2026-10-12 帮助中心 Design QA 修复：契约偏差 12 项 + CSS 面填充守卫（7 个 commit）

用 Design Review 插件对 `src/features/help-center/` 做综合走查（契约源 `DESIGN.md` v1.7.0）。**结论是缺陷不在"好不好看"，而在实现与已登记契约的偏差长期无人看守**，因此本批既修偏差也补守卫。

- **根因是门禁盲区，不是疏忽**：`designTokenGuard.test.ts` 的 glob 只覆盖 `src/**/*.{ts,tsx}`，globals.css 整个在射程外。象牙卡面上的 `.house-rules-item { background: rgba(255,255,255,0.4) → hover 0.7 }` 叠在 `--stable-ivory #f8f2e2` 上，hover 已越过 §1.2「最亮色 ivory」的上界，而契约对同族元素（§5.9 横幅内部 pill）明明规定了墨色低透 `rgba(26,19,8,0.08)`。改为该族既有的 0.08→0.15 阶，**顺手把 `::before` 顶高光与内描金这类 §4.3/§5.9 授权项列为内容指纹豁免**（用选择器+声明子串，抗行号漂移）。
- **中文斜体禁令的成立条件比条文更硬**：`HelpArticle` tip 段用 Tailwind `italic`，而三族 `@font-face`（Fraunces/Inter Tight/JetBrains Mono）**只声明了 `font-style: normal`**，仓库未加载任何 italic 面 → 浏览器必然合成伪斜。删 `italic` 即可（tip 本就有左侧 brass 竖条做差异化，无需补偿样式）。刻意**不做**全局 CJK italic reset：`.opponent-avatar` 与庄码 D 的斜体是 §5.3 授权，reset 会误伤。
- **动效降级此前是空头支票**：TDD §14.6 原写「支持 `prefers-reduced-motion`」，实测全仓库 `MotionConfig` / `useReducedMotion` / `matchMedia('(prefers-reduced-motion')` **零命中**，而 globals.css 的 CSS 兜底只能压 `transition-duration`，压不住 framer-motion 写入的 inline transform。补成三层接管并在 TDD 写清边界：`MotionConfig reducedMotion="user"` 只降级 **transform 类**，opacity 与 **height 仍会过渡**——所以 FAQ 折叠的 `height: 0→auto` 必须组件级 `useReducedMotion()` 置零时长，锚点 `scrollIntoView` 属 JS API 也得单独降 `behavior`。
- **触摸目标是模块内自相矛盾**：hero CTA 38px / 立牌条目 40px，而同模块的 `ModuleEntryCard`、文章返回、`.faq-item-button`、`.quick-path-node` 全是 44px。统一提到基线 44px（不进媒体查询，桌面也受益）。
- **Link 语义按"能否安全落地"划界**：`<button onClick={navigate}>` 无 href，中键/Ctrl+点击新标签失效、SR 播报为按钮。帮助中心 17 处跳转全部改为 `Link`（`Button` 走 `asChild` + Radix Slot），并给 `.module-card`/`.quick-path-node` 补防御性 `text-decoration` reset（Tailwind preflight 已让 `a` 继承无下划线，唯一的全局 underline 在 `prefers-contrast: high` 块内且带 `!important`，属 WCAG 刻意增强，保留）。**`ModuleGrid` 不动**：其卡片内嵌 `span[role=button]` 的聚焦 Pin，转 `<a>` 会违反"a 内不得含 interactive content"，正解是 stretched-link 结构重构，单独留批。
- **`.module-icon` 底色事实源分裂（needs-design-decision）**：CSS 基类无 `background`，仪表盘靠 `module-texture-*` 类、帮助中心靠 JS 内联 `color-mix()`。按用户决定「改代码对齐既有档位」，把 5 种 accent 收进 `.module-icon[data-accent]` 变体，维持 12% 视觉零变化并让亮暗主题经 `var()` 计算值自动联动。**§5.18 规定的「径向渐变底」三处实现都没落地**，仍属契约待决。
- **字号家族漂移只收自己那一份**：hero 标题 puzzle 27 / help 26 / settings 24，无一在 §3.3 档位。本批把 help 收到 24px 对齐既有 settings 值，puzzle/settings 不动、契约不修订（用户决定），该项作为遗留保留。
- **help 段 transition 成为全文件首个 token 消费者**：globals.css 36 处 `transition:` 此前 0 处用 `var(--poker-duration-*)`/`var(--poker-ease-*)`（变量只被 `animation:` 用）。本批把 help 段 7 处收口，并把 `transition: all` 收窄为 hover 实际变化的属性（§8.4 避免 layout/paint 抖动）；段外约 30 处裸值留下。
- **文案数量此前无绑定**：`hero.meta` 硬编码「9 篇 · 6 项 · 8 条」，integrity 测试只锁数组长度（FAQ 还只是 `>=8` 下限），加内容不改文案会静默失效。新增断言从文案**提取数字**与三组长度比对（措辞调整不脆断），zh/en 各一条。
- **守卫落地方式的两处教训**：① Vitest 默认 `css: false` 会把 CSS 导入 **stub 成空模块**，`import.meta.glob('./styles/**/*.css', {query:'?raw'})` 只拿到 1 行占位——首版守卫因此"5 例全过"其实是空跑；改用 `readFileSync`（沿用 `huPositionOrderGuard.test.ts` 的读取方式）。② 白名单校验用「选择器+声明子串」而非行号。③ 守卫写完做了**变异测试**：把 `.house-rules-item` 底色改回白透，确认它精准报出 `globals.css:2697 .house-rules-item → 白透面填充超过 0.05`，随后还原。
- **文档**：PRD §5.28 验收标准补 4 条（内容规模一致 / 可寻址链接 / 44px / 尊重减弱动态偏好，均只写 What/Why）；TDD §14.6 把 reduced-motion 改写为三层接管并声明 `MotionConfig` 的属性边界、§14.7 守卫机制拆成源码层与样式层两条；`help-center-dev` 代理文件的「shared/ 层依赖：无」原已过期（Hero 早已 import `shared/utils/motion`），改为登记 motion / EmptyState / button 三项，Key Files 补 help 专属 CSS 段与 CSS 守卫，路由跳转条款改为 Link 口径。
- **验证**：typecheck / lint exit 0（仅 `i18n/unitRef.test.ts` 两条既有 import-pattern 警告，与本批无关）；`vitest run` **158 文件 / 1121 测试**全绿（本批 +2 文件 / +16 用例，既有用例无一被放宽）；`pnpm verify` 每批各跑一遍。
- **未覆盖 / 遗留**：① **浏览器视觉全程未验证**（按既有约束不起 dev server、不截图）——立牌 3D 观感、`<768px` 真实布局，以及 `.help-hero-meta` 11px `--ivory-muted` 落在 hero 渐变暗底上的对比度（按 §2.1 色值手算约 4.4–4.6:1，正好卡在 AA 4.5 临界）均需实测才能定论；② `ModuleGrid` 的 Link 化与 stretched-link 重构；③ 其余 124 处内联 framer-motion 字面量与其余 6 处 `behavior: 'smooth'` 未降级；④ help 段外约 30 处 transition 裸值；⑤ hero 标题字号家族（24/27 两处）与 §3.3 档位缺口；⑥ §5.18「径向渐变底」与 §13.5.1 微纹理在 help 侧的落地；⑦ 路由跳转后的焦点迁移（`scrollIntoView` 不会移动焦点，键盘/SR 用户感知不到页面位置变化）；⑧ `DESIGN.md` 全程未修订。

---

### 2026-09-29 理论学院第五批（下半）：单挑位置事实纠错 152 处 + 方向守卫（4 个 commit）

销上一条遗留①（单挑翻后位置标注在两学院正文里被写反）。拆批经用户批准：本批只做纠错与守卫，单挑 T5–T9 补深 5 章留下一批——理由是**新章要按标题写跨章引用，且其位置/权益论述直接依赖修正后的归属**，口径未钉死前先写新章会返工。

- **登记口径本身是错的，且错得偏小**：上一条写"理论侧 5 章 + 策略学院 3 课、约 60 处从句"。以 `variantRules.headsUpRules` 为判据写临时扫描器全量枚举后实测为 **152 处子句**（数据层 61 / locale 91），波及**理论 6 个 Level 文件 + 策略 4 个 Level 文件里的 9 个课时**（不是 3 课），另含**翻前**侧同源倒置「SB 翻前最后行动」14 处。**两学院各自内部正反陈述并存**（`headsUpLevel1.ts:42` 正确、`headsUpLevel2.ts:158/232` 相反），所以读者看到的不是"一套错的规则"而是自相矛盾——这比全错更糟，也是本批优先级高于 ICE #11 剩余项的原因。
- **判定器的两次自我修正**（先假阳后假阴，都不该省）：首版跨子句正则把正确句「翻前 SB 先行动、BB 最后行动」误判为违规；改成**子句级三元组**（盲注主语 + 街道 + 方向谓语）后，又因 locale 递归 `flat()` 漏传累加器而**完全没扫到 4 份 locale**（0 命中被误当成"已清零"）。教训写进守卫：扫描面必须自带"命中数异常偏低即失败"的自检。
- **改语义而非换标签**：11 处属论证前提依赖错误归属，重写立论——`t2hu-ev` 位置价值 0.5-1BB 的归属由 BB 搬到 SB；`t2hu-risk` 的规则陈述段（原文"SB 翻前最后行动，BB 翻前最后行动"自相矛盾）与 check-raise 算例（x/r 杠杆属先行动方 = BB）；`t3hu-position-reversal` 整章的反转方向改为"BB 翻前最后行动 → 翻后最先表态"；`t3hu-bb-defense` 的宽防守改由翻前最后行动 + 已投 1BB 死钱赔率支撑并声明翻后 OOP 需补偿；策略侧 `l3hu-sb-continuation` 整课从"SB 翻后 OOP 的 C-Bet 成本论"改为"SB 翻后 IP 的持续施压"，check/x/r 杠杆归 BB。**全部数值一字未动**。
- **只在旧归属下成立的论断按诚实性处置**：「BB 权益实现率超过 100%」在 BB=OOP 下失效——理论侧删除该论断（未补新实现率数值），策略侧改判归属为"红利属于持有位置的 SB"并在 `variantQuantAudit` 文件头索引注明；`t3hu-bb-defense` idx8 的"IP 位置优势 +0.5BB"改名为"主动权与范围优势"（数值保留）。
- **判分链连带**：`t2hu-risk-q1`（"单挑中翻后谁先行动？"）`correctIndex` 1→0（SB→BB）并同步解析；策略侧 8 题的正确项文本翻转但 `correctIndex` 未变，选项排序治理与分布守卫（`quizShuffle` / `quizOrder` / `optionOrder`）全绿。小测**干扰项允许保留错误陈述**，只在与解析冲突或造成双解时改写。
- **复核代理产出时抓出的两处**（代理报告未自陈）：① **en 座位漂移**——`en/theory.json` 的 `content.t3hu-position-reversal.5` 在 zh/数据已改为"SB 开池范围"后仍写 "the BB's calling range"，方向守卫抓不到这类不含方向词的座位所指错误；② **数值所指随主体迁移但未重算**——同段的"Kx 密度约 30%"原指 BB 跟注范围、现指 SB 宽开池范围，后者实际密度远低于 30%。处置：把该量显式声明为教学锚点值，并补稳健性区间（按约 80% 开池范围估到约 20% 时加权权益升至约 23%），使"21%-23% 均低于 25% 跟注线、弃牌结论不变"成为正文的一部分（PRD §6.7.1「假设」类）。
- **守卫**：新增 `src/huPositionOrderGuard.test.ts`（src 根级，与 `designTokenGuard` 同级，避开 features 间 import 边与 shared 准入门槛）。零容忍，扫 4 份 HU locale（zh 侧经 `contentAlignment` 逐字镜像锁定数据层）+ `variantRules` 单源区块；断言单源散文与 `sbFirstActionPreflop: true` / `bbFirstActionPostflop: true` 一致，防"参照物自己被改"。两处刻意豁免：小测 `options`、**子句自身**点名满员桌/6-max 的对比句（满员桌 SB 确实翻后先行动）。内置 7 条已知倒置必红 / 6 条已知正确句必绿的判定器自检，防止后续放宽正则把守卫悄悄空转。规则入 PRD §5.27.7（**变体的规则性事实与公式同格要求单源**）、TDD §5.8b 第 16 条、AGENTS.md §质量门禁全局守卫清单、两学院代理文件 Workflows。
- **验证**：typecheck / lint exit 0；`vitest run` **156 文件 / 1105 测试**全绿（本批 +1 文件 / +3 用例，无既有用例被改动以适配修正）；`pnpm build` 通过。
- **未覆盖 / 遗留**：① **非作者学科复核仍缺**（PRD §6.7.3）——本批把两学院统一到同一方向，但"重写后的论证在扑克学上是否最优"未过第三方，且单挑正文的正确性本就是本批才建立的；② **en↔zh 语义一致性无机器守卫**，本次只做了座位词频对照（人工复核 35 个候选漂移）；③ 短牌与标准主线未纳入方向守卫（判据只覆盖 HU 规则）；④ 真实浏览器下的正文渲染未验（仍以 jsdom + 全量断言代替）；⑤ **ICE #11 剩余项**：单挑 T5–T9 各 +1 章（现 22 章，短牌 27）留批 B；⑥ 上一条遗留②-⑥（策略侧 39 条量化未修项、drill 型 objectives 渲染接线、首页 2 个空可访问名控件、`bb_vs_btn_open` 联动、`4Bet/5Bet` 词形）本批未动；⑦ **本批实测到一处既有测试 flake**：`strategy-academy/store.migrate.test.ts`、`theory-academy/store.migrate.test.ts`、`progress/.../DailyChallenge.test.ts` 三例在全量并行首轮失败（3 failed / 1102 passed），单独复跑 15 例全绿、全量再跑 156 文件 1105 例全绿 —— 属跨文件状态或日期依赖的执行顺序敏感，非本批引入（三者均不读 HU 内容），待专项隔离治理。

---

### 2026-09-28 理论学院第五批（上半）：变体桥接双层守卫 + 短牌高级段补深 5 章（10 个 commit）

ICE 表最后一项 #11（变体高级段补深）开工。批次中途查出**两学院的单挑翻后位置标注互相矛盾**（详见"遗留"），经用户决定改为先交不受争议影响的部分：守卫、桥接、口径参数化与短牌 5 章；单挑正文纠错与单挑新章整段留到下一批。

- **反向存在性守卫先行**（`strategy-academy/data/theoryVariantBridgeIntegrity.test.ts`）：变体课时 id 进不了任何白名单（`curriculumIntegrity` 断言变体课不在 `LEVELS` 内），所以章节级桥接必须先有守卫再写数据，否则 49 章的引用完整性只能靠人工核验。守卫经 `import.meta.glob('?raw')` 扫变体数据源码，按**两种命名空间分别对面不同全集**：变体专属 `l<n>hu|sd-*` 必须存在于 `ALL_VARIANT_LESSONS` 且**不在** `LEVELS`；三变体共享地基课 `l<n>-*`（T1/T2 章节复用）必须**在** `LEVELS` 内可解析——后者是本轮补上的盲区，"把标准课 id 打错一个字母"原本无人拦截。引用点自带的回退标题与 `academy.lessonTitle.*` 权威值比对（剥尾部消歧括号），定位统一为 `目录/文件:行号`（两变体的同名 `chapterPracticeMap.ts` 只留 basename 会歧义）。它落地即查出 2 处真实缺陷：`l6-sd-tourney` 非法 id 与 `l6sd-tourney` 缺后缀（散文里的裸 id）。
- **变体章节级桥接全量落地**：新增 `data/levels/variants/{heads-up,short-deck}/chapterPracticeMap.ts` 各覆盖本变体全部章节，由 `variants/<v>/index.ts` 的 `withChapterPractice(levels)` 聚合附加（视图层与标准侧共用 `PracticeBridgeCard`，无变体分支）。因无白名单可依赖，守卫结构换成两层：理论侧**覆盖率**（每章必带非空推荐 + id 命名空间）对策略侧**存在性**（反向扫描）。新增 `PracticeBridgeCard.variant.test.tsx` 逐个挂载全部变体章节推荐，证明渲染面真实取到 i18n 权威标题（回退字面量静默生效 = key 缺失，两侧数据守卫都看不见）且跳转按 id 拼装；en 侧无汉字与键面字泄漏。
- **`outsToEquity` 未知牌参数化**：第三参 `unknownCards` 默认 `[47, 46]`（标准主线三处调用点零改动），短牌传新导出常量 `SHORT_DECK_UNKNOWN_CARDS = [31, 30]`。`theoryFormulas.test.ts` 加两条锁：默认值对 outs 1-20 **逐位等于**旧硬编码式（参数化 touching 默认口径即红），短牌 5/8 outs 单双街与已公布的 16%/26%/30%/46% 对齐；`variantQuantAudit` 两处手工分数改调函数，把手工复算收编为口径。
- **短牌 T5–T9 各 +1 章**（每章 15 段覆盖 `TheorySectionType` 全部 8 类含 `takeaway`、4 条 objectives、5 题、双语、审计登记）：`t5sd-mixed-strategy`（尺度给频率、牌堆给权益：A 类口径两牌制逐字相同，未知牌 31/30、同花恒 5 outs、翻牌三同花色时对手至少持一张该花色的概率 33.5% 对标准 37.0%）、`t6sd-equity-realization`（单张 out 单价 3.2% 对 2.1% 而数量只剩 5，标价 30.1% × 实现率 0.85 = 到手价 25.6%，倒推线 29.4%/39.2%）、`t7sd-hud`（VPIP/AF 定义不含牌堆参数，要重设的是基线与样本：只对子一项 8.6% 对 5.9% 抬下限 2.7 点；SE=√(p(1−p)/n) ⇒ 100 手 ±9.0 点、分辨 6 点需约 896 手；`requiredHandsForEdge` 单源给出 86,436/185,933/38,416 手与 2.25 倍比例）、`t8sd-bankroll`（B ∝ σ² 把"≥150 买入"从口号换成区间：113–242 买入；ROR 四点复算 0.13%/0.005%/1.2%/4.5%；止损写成 σ 倍数后 1σ 约每 6.3 个单位触发）、`t9sd-tournament-structure`（前注改死钱不改公式：0.6bb 前注使开池保本率降 8.3 点、BB 门槛降 2.7 点、10bb 全下只降 1.2 点，M 值压缩 28.6%）。
- **诚实性登记分类扩容**：复核索引不再只有 `[正确]`/`[示意值]`，新增 `[查表值]`（正态分位等外部表，本模块不推导 CDF）、`[定性]`（机制陈述无数值）、`[假设]`（教学结构设定，声明"数字随结构表变、关系不变"）、`[规则集说明]`；并规定**由示意值导出的结论继承示意标签**。同步把 `t1sd-variance` 那条长期挂 `[示意值]` 的"≥150 买入"指向新换算区间。规则入 PRD §6.7.1 新行「数值来源分类登记」与 §6.7.3 第 2 条。
- **守卫当场抓出的两处自身错误**（均为本会话所写，非历史遗留）：`t8sd-bankroll-q4` 正确项写成 450bb（正确应为 150bb，`expectAnswerIs` 直接判红）；变体顺延用例首版把"每级 ≥3 章"写成通用断言，被 HU 的每级 2 章证伪——改为按变体参数化下限（HU 22 / SD 27）并把 `theoryProgress.test.ts` 的顺延与解锁链断言从 HU 专属升级为两变体各跑一遍。
- **文档**：PRD §5.27.6（三变体同等桥接要求与双层守卫）、§5.27.7（**重构判据 = 把公式拆成"只依赖尺度"与"随牌堆变"两层**，且声明章节数以数据为唯一事实源）、§12.4.2（两种命名空间各自的校验全集）、§6.7.1 / §6.7.3；TDD §5.8b 第 9 条（变体逐章桥接）、第 11 条（牌堆参数显式化）与新增第 15 条（双层守卫结构 + 组件级证据）；`theory-academy-dev` 新增 Workflows 第 10 条（变体新章是 5 文件原子单元）并改掉已过期的"变体桥接无守卫兜底"条款，`strategy-academy-dev` 登记反向守卫为改名/删除变体课时时的强制同步对面。
- **验证**：`pnpm verify` 155 文件 / 1102 测试全绿；`pnpm build` 通过，首屏 JS 1.07 MB **不变**。**更正本批第 4 条 commit message 里的一处归属错误**：`heads-up-*.js`（82/92KB）与 `short-deck-*.js`（105/122KB）两个块来自 `vite.config.ts` 的 `manualChunks` 对 **strategy-academy/data** 路径的切分，本批完全没碰，所以尺寸一字未变；理论学院三变体的全部章节实际落在懒载的 `theory-*.js`（实测 586KB / 543KB / 616KB 三个块），也不在 `CORE_MODULES` 的首屏预算内。结论不变而理由改述：**#11 的成本是内容与审校工时，不是首屏体积**。
- **未覆盖 / 遗留**：① **单挑翻后位置标注在两学院正文里被写反**（`variantRules.headsUpRules` 单源为"BB 翻后先行动 = BB 是 OOP、SB 是按钮位 = IP"），实测涉及理论侧 5 章 + 策略学院 3 课、约 60 处从句，其中三处是论证前提需重写而非替换标签（`t2hu-risk` 的 check-raise 算例主语、`t3hu-position-reversal` 章内自相矛盾句、策略学院 `l3hu-sb-continuation` 整课前提）；课时与章节 **id 不改**（进 URL 与持久化，本仓库只追加不改名）。单挑 5 章补深（`t5hu-preflop-equilibrium` 等）与该项同批做。② 变体章节级桥接的散文引用（`『…』` 按标题）无机器守卫，仍靠人核。③ 真实浏览器下的视觉与响应式（本会话仍不能启动 dev server），仅以 jsdom 渲染断言代替。④ 短牌 5 章与双层守卫的语义正确性须非作者学科复核（PRD §6.7.3）。

### 2026-09-28 理论学院第四批补充：正文排版与跨章引用卫生修复（3 个 commit）


接上一条末尾登记的两类"查出未修"缺陷，经用户批准后立即修复并固化为门禁。

- **修掉会被原样渲染的 markdown**：`TheorySectionRenderer` 把段落当纯文本节点输出，正文里的 `**粗体**` 星号会直接显示在页面上。全库 17 对（zh）/ 13 对（en），其中 3 对是前两批新增 `t5-multiway-frequency` 时引入的——**自己写的东西也会被自己的守卫查出**，不是历史遗留才有的问题。
- **修掉 9 处编号式跨章引用**：`本级第 4/5 章`、`本章第 3 章`（措辞自相矛盾）、`T4 第 2 章`、变体里的裸`第三章`，统一改为按章节标题引用（如「见本级『MDF 与 Alpha』章」）。这类写法在第三批已被证明会被加章打穿（当时修了策略学院 9 处，理论侧漏了），且 `t5-multiway-frequency` 是本会话新加的章——它一落地就把三处指向 `t5-mdf-alpha` 的引用写成了"第 3 章"。
- 顺带统一标点惯例：5 处用《》包章节名改为『』（《》只用于教材书名）；1 处正文里直接写 `t5-mdf-alpha` 改为标题引用。
- **新增卫生守卫**（`theoryIntegrity.test.ts`，覆盖三变体全部 81 章的正文 / 学习目标 / 小测题干选项解析）：禁用 `**`、编号交叉引用、书名号包裹的章节名（判定以是否命中某章 `title` 为准，不误伤真书名）、裸章节 id。上一条 commit 修的是存量，这一条保证它不再回来。
- **验证**：`pnpm verify` 153 文件 / 1074 测试全绿；zh 由数据脚本重生成保证逐字镜像，en 同步改 7 处引用与 13 对标记；`standardQuantAudit` 对被改段落的 `toContain` 断言全部仍绿，证明未触碰任何被断言的量化子串。**未覆盖**：真实浏览器下的正文渲染（仍以 jsdom 与全量断言代替）。

### 2026-09-28 理论学院第四批：29 章学习目标回填 + 变体标题截断修正 + 目标必填门禁（6 个 commit）

范围按上轮 ICE 建议的"风险最低先行"：只做 `objectives` 回填与一处顺带的内容修正，#11 变体补深与 44 章变体章节级桥接各自留独立批次。

- **根因不在漏填，在守卫**：标准主线 29/37 章没有学习目标、卡片不渲染，但变体 44 章**全部**都填了——说明"字段可选"掩盖了"内容漏填"。两个 integrity 测试都写成 `if (chapter.objectives !== undefined)`，只要不声明就永远绿。故本批把标准与变体两侧同批收紧为"必须声明、条数 ∈ [3,5]、每条非空"，失败信息带 chapterId：**收紧断言比补数据更能防复发**。
- **回填 116 条目标**（29 章 × 4 条，双语）：T2 三章 / T3 三章 / T4 三章 / T5 四章 / T6 三章 / T7 四章 / T8 四章 / T9 五章。写作口径三条硬约束——动词开头单句无句号、**不复述任何精确数值**（量化一致性只由 `content` 与 `quiz` 两处承担，目标写数字会造出第三个需要同步维护的地方）、每条必须能指回该章某个具体段落。T8 按"可观察动作"落笔（避免"保持好心态"式劝诫），T9 严守章间边界（`t9-multiway` 只写胜率稀释与均衡失效，乘积律与防守责任分摊留给 `t5-multiway-frequency`）。
- **工序**：三段由并行子代理只改数据层起草，逐条附"目标 → content 下标"依据；我按索引抽查 54 处全部命中其声称段落（其中 `t2-ev` 一处把段首文字记错但支撑段落成立）。zh 侧一律由数据脚本生成以保证逐字镜像（两段共 174 行**纯插入、0 删除**，反证未触动任何既有段落），en 逐条撰写并由脚本校验条数对齐、禁汉字、句末无标点。
- **渲染面新守卫**：`TheoryChapterView.objectives.test.tsx` 跨段抽 3 章（`t2-pot-odds` / `t8-tilt` / `t9-cash-vs-mtt`）断言条目数与数据层一致、zh 逐字相等、en 无汉字且**不等于**原文（若 en 被误填成中文，无汉字断言即红）、不泄漏 `theory.chapterObjectives.` 键面字。经 `useDebugModeStore.unlockAll` 旁路门禁，避免为测渲染而重走七级解锁链。
- **顺带修 5 处变体词内截断**：`最优下注尺`→`最优下注尺度`、`下注尺选择`→`下注尺度选择`、两条 level description 同错、`多条 streets`→`多街下注规划`（en 同步为 `Multi-Street Bet Planning`），并补回 `headsUpLevel6.ts` level description 丢失的行首缩进。这些串直接显示在阶梯与章节页眉。
- **文档**：PRD §6.7.1「学习目标对齐」补条数、"不复述数值"与"由完整性守卫强制"三点；TDD §5.8b 的 `TheoryChapter` 字段清单标注 `objectives?` 为**类型可选、守卫必填**（并说明为何类型不动）；`theory-academy-dev` Workflows 补目标必填条款，并写明"成规模做变体章节级桥接**之前**须先建反向存在性守卫"（策略学院侧用 `import.meta.glob('?raw')` 扫理论变体数据提出课时 id，再对 `ALL_VARIANT_LESSONS` 断言）——因为变体课时不在 `LEVELS` 内，两个现有白名单都装不下它。
- **验证**：`pnpm verify` 153 文件 / 1073 测试全绿（较上批 +1 文件 / +2 用例）；`chapterObjectives` zh/en 各由 52 cid·159 条增至 **81 cid·275 条**（严格对称）。**未覆盖**：真实浏览器下的目标卡排版与折叠（本会话不能起 dev server，以 jsdom 代替）。
- **本批查出但**未**修的两类内容缺陷**（登记待办，不在批准范围内故未动）：① 理论正文有 **17 处 `**粗体**` markdown 残留**，而 `TheorySectionRenderer` 以纯文本节点渲染，星号会原样显示在页面上（含 `t5-multiway-frequency` 3 处，系前一批引入）；② 理论正文有 **8 处"本级第 N 章 / 本章第 3 章 / T4 第 2 章"式编号交叉引用**，其中"本章第 3 章"措辞自相矛盾，且这一写法已在上一批被证明会被加章打穿（当时把策略学院 9 处改为按标题引用，理论侧漏了）。
- **与计划的偏差**：计划把"基础段 T2+T3"与"中段 T4–T6"分两个 commit；两段由并行子代理同时起草、zh/en 变更落在同一文件不可切分，故合为一个逻辑单元（`8b51544`）。

### 2026-09-28 理论学院第三批：ICM 实例纠错 + 元游戏漂移 + 结构经济学章 + 现金/锦标赛对照章 + 演练回填（7 个 commit）

接第二批的 ICE 排序，闭合表中最后三项（#10 元游戏漂移 / #8 结构理论 / #9 现金-锦标赛对照），并回填 3 章"有可算对象却没挂演练槽"的章节。标准主线 35 → 37 章，变体不动。

- **先修一处已发布的数学错误**：`t9-icm` 实例三写"A=5000 全下 B=3000、输光则归零、0.55×46≈25.3<38.4 ⇒ 弃牌"。三处不成立——B 只覆盖 3000，A 输了剩 2000 而非归零；期望式漏掉输分支；补回输分支（$EV=31.9）后得 39.6>38.4，结论从"弃牌"反转成"跟注"。改为"中筹码 M=3000 被 5000 覆盖"配置（归零成立）：弃牌 32.8、跟且赢后 6000/2000/2000 → $EV=41.0、期望 0.55×41.0=22.6<32.8 ⇒ 弃牌成立，另补现金桌同一手 +300 筹码的对照。**元问题**：该错误推导在 `standardQuantAudit.test.ts` 的文件头复核索引里被登记为 `[正确]`，且索引下标本身漂移了一格（写 idx4 实为 idx5、写 idx1 实为 idx3）——「已登记」不等于「已验证」。据此在 PRD §6.7.1 新增"示例可复算自洽"条（全下/ICM 实例必须写明谁覆盖谁），在审计文件头写明"0 起含 heading"的下标口径与该标签的自评性质，并在 `theory-academy-dev` 补同样的实例前置检查条款。
- **#10 元游戏与池子漂移**：`t7-exploit` 原只有静态的"群体倾向"先验，从未说明群体会随时间漂移。在其 content 数组末尾追加 4 段（heading/text/example/takeaway，idx14-17，**只追加不插入**），把漂移变成可算量：同一记半池诈唬在弃牌率 65%→60%→55%→α=33.3% 时的 EV 为 +47.5→+40.0→+32.5→0（掉 10 个百分点的弃牌率就缩水约三成），并由 `multiwayBluffEv(defenders=1)` 复算登记。
- **#8 新章 `t4-structure-economics`（T4 第 5 章）**：抽水 / 前注 / Straddle 此前在标准主线里几乎不存在（`rake` 只有一句"忽略抽水"、`ante` 只作为短牌变体的规则说明）。新章把三类参数归位为两个自变量——前注与 Straddle 抬 P、抽水压 μ：α 60.0%→47.4%、MDF 40.0%→52.6%、大盲收价 1.25bb→0.25bb（所需权益 25.0%→5.0%）、3-bet 侧 68.1%/31.9%→62.7%/37.3%（互补为 1）；抽水把 8bb/100 压到 3bb/100 时样本量按 (8/3)²≈7.1 倍放大、ROR 由 1.9% 升到 22.7%。15 段 8 类段型 + 4 条 objectives + 5 题。**对计划的一处更正**：原估"所需权益 25.0%→20.0%"漏算了前注已投在池内这一事实，真实门槛是 5.0%。
- **#9 新章 `t9-cash-vs-mtt`（T9 第 6 章，标准主线收官章）**：两套结构从未并排算过。以"同一手牌的两套账"为主轴（锚点复用本批修好并登记过的 ICM 数字，不引入第二套口径）：M 由 50 单向塌缩到 10 时尺度族消失、抽水按锅 vs 服务费按买入分别惩罚参与量与入场次数、σ×2 则 n×4 的平方律、以及剥削知识在两种池子里分别是可折旧还是可摊销资产（收拢 #10 的漂移结论）。16 段 8 类段型 + 4 条 objectives + 5 题。
- **跨模块桥接白名单扩容**：新章的实践出口需要 `l7-rake`、`local-ante`、`l6-bounty`，三处同一 commit 同步（T4/T9 的 Level 推荐 + `EXPECTED_PRACTICE_LESSON_IDS` 23→26 + 对面 `CROSS_MODULE_LESSON_IDS`）。过程中暴露一处守卫过窄：`theoryIntegrity` 的前缀断言只认 `^l\d`，会把本土课 `local-*` 判为非法——已放宽为 `l<level>-` / `local-` 两种命名空间（本土课确实并入策略学院 LEVELS 且路由可解析，非豁免而是修正断言范围）。
- **演练槽位回填 3 章**：`t1-outs`（outs→精确权益，1 街 o/47、2 街 1−((47−o)/47)((46−o)/46)）、`t4-combinatorics`（口袋对子档位组合数与牌面削减）、`t7-stats`（VPIP 与 AF）。`DrillUnit` 由 `percent/hands` 扩到含 `ratio`/`count`（AF 用绝对容差 0.05、组合数用精确整数容差），覆盖 20 → 24/37 章。**新增单位标签守卫**：`drill.unit.<unit>` 是动态 key、`staticKeyGuard` 覆盖不到，缺 key 会把判分行渲染成键面字，故在题源测试里断言双语两侧均存在。`t9-cash-vs-mtt` 刻意不挂槽并在文件头写明理由（唯一可算量是三人 ICM 递归，越出"可口算复核"纪律）。
- **文档与子代理**：PRD 新增 §6.7.1"示例可复算自洽"条、§5.27.3 表 T4/T7/T9 覆盖范围更新、§5.27.10 补新公式族与"覆盖为部分章节"的定性；TDD §5.8b 第 11 条口径函数清单扩到 13 个（含死钱计入 P 不并入 betSize 的参数语义）、第 9 条补白名单三处同步与两种 id 命名空间、第 13 条补单位/动态 key/部分覆盖三条约束；`theory-academy-dev` Workflows 补 4 条（实例覆盖关系、下标口径、白名单扩容三处同步、演练新单位与不挂槽理由）。**未写入 TDD**："本批未改 persist version"属演进历史，按三层职责分离只记于此——理论侧 persist 契约未动（`TheoryProgress` 不变、`store.ts` 仍是版本号唯一事实源）。
- **验证**：`pnpm verify` 152 文件 / 1071 测试全绿（较上批 +9：新增 ICM 复算块、漂移段、两新章的结构与审计断言、单位守卫、演练组件 3 项）；`pnpm build` 通过、新章仍在懒加载 chunk。答题索引分布守卫实测 396 题 A/B/C/D = 22.7% / 26.8% / 27.8% / 22.7%，最大 27.8% 远低于 50% 上界。**未覆盖**：真实浏览器的视觉与 <768px 布局（本会话不能启动 dev server，以 jsdom 渲染断言代替）；两本新章与漂移段的非作者学科审校（PRD §6.7.3）——本批的 ICM 错误正是"作者自评正确"漏掉的，审校需求因此更明确而非更弱。**已知副作用**：T4 加第 5 章会让已通关 T4 的学习者重新被锁 T5（解锁判定为前一 Level 全章完成），沿用上一批加 `t5-multiway-frequency` 时的同一取舍，不做缓解。

### 2026-09-28 理论学院第二批：计算演练 + 章节级桥接 + 多人底池前置章 + 仓库清理（8 个 commit）

接上一批的 ICE 排序，闭合剩余三项高优先级（#7 演练 / #4 桥接粒度 / #5 多人底池位置），并修掉本批查出的三处缺陷。

- **#7 章内即时计算演练（ICE #7，出口断层）**：题源 `utils/theoryCalcDrills.ts` 从离散友好网格出数值题，期望值一律调 `theoryFormulas` 现算（题源零硬编码答案），按单位分档容差判分；组件 `components/TheoryCalcDrill.tsx`（179 行）挂在 reading 阶段正文之后，形成"读→算→测"微闭环。**零持久为显式产品决策**（PRD §5.27.10）：`recordAnswer` 无幂等且直连全局连错计数（自适应难度唯一入口）与每日题量预算，把"允许试错"的练习计入会把自我纠错当漏洞；该决策由组件测试的状态快照不变断言 + `import.meta.glob('?raw')` 源码级 token 禁用双向锁定。`drillId` 用 `chapterId#dN` 而非 `-qN`，避开 SRS/疑难清单的章节反解契约。新增 3 个多人公式口径（`multiwayAllFold` / `perDefenderRequiredDefense` / `multiwayBluffFold`）。
- **#4 桥接下沉到章节粒度（ICE #4）**：`TheoryChapter.practiceRecommendations?` 新字段 + `chapterPracticeMap.ts` 集中维护标准 35 章映射（22 个课时，全部复用 Level 已登记白名单），`standard/index.ts` 聚合时附加；章节卡优先、被 Level 覆盖且本级完成时不重复渲染。守卫新增**子集**断言（非等值，因章节集合必然 ⊆ Level 集合）+ 非空断言（防聚合链被误删后静默失效）。**更正上一批的估计**：该字段属数据层、`TheoryProgress` 不存它，故 persist version 仍为 3、`store.persist-shape.test.ts` 快照未动——不需要 schema 迁移。
- **#5 新增第 36 章 `t5-multiway-frequency`（ICE #5，不改名方案）**：把多人底池的**频率与尺度**前移到 T5，正好收拢 `t5-game-theory` 与 `t5-mdf-alpha` 两处早已埋下的伏笔（各追加指向本章的指针，下标型 key 原位替换）。核心结论：全弃率是乘积而非平均（半池进两人 11.1%、进三人 3.7%）、EV 由 0 塌到 −33.3/−44.4、放大尺度反而更差（满池进两人 −50）、防守义务按 `d = 1 − α^(1/n)` 分摊（两人 42.3%）而非除以人数（33.4% 是系统性欠防）。`t9-multiway` 原地保留——改名需 theory v3→4 **加** progress v18→19 并迁移四处已发布 id 与复习项 key/route，本仓库无先例。
- **修 T9 order 错号**：`t9-alpha` 声明 5 却排第 4、`t9-unified` 声明 4 却排第 5，章节眉编号与"下一章"链自相矛盾；改为 [1,2,3,4,5]。
- **策略学院 9 处理论引用去编号化**：审计全仓 45 处"Tn 第 k 章"散文引用后，修正 9 处语义错位（含被上述 order 修正改坏的 2 处），统一改为按章节标题引用，并把 `l6-bounty` 拆清为《多人底池理论》+《ICM 理论》两个指针；zh 逐字镜像与 en 译文同批改（`academy-course/level{1,5,6,7,8}.json`）。**方法论结论**：编号写法会被后续加章打穿，跨模块指针应引用标题。
- **仓库清理**：删除误入库的 `.tmp-verify/` 过期镜像（707 个跟踪文件，含整棵 src 副本与两个 vitest 日志），`.gitignore` 补条目防复发。删除前逐项核对：4 个"仅存在于镜像"的模块与现居处逐字节等价，唯一独有的 `elo.test.ts` 先救回（12 项断言对现役 API 直接通过，补上了 elo.ts 迁移时丢失的回归覆盖）；确认无任何 tsconfig/vitest/eslint/glob 扫描该目录，删除前后 `pnpm verify` 均为同一结论。
- **文档**：PRD 新增 §5.27.10（演练与其零持久决策）、§5.27.6 扩为"每级与每章"、T5 覆盖范围与教材基线更新；TDD §5.8b 补第 13/14 条（演练四约束、口径不下沉 shared 的理由）并修正桥接条目；`theory-academy-dev` 新增 Workflows 第 8/9 条。
- **验证**：`pnpm verify` 152 文件 / 1062 测试全绿，`pnpm build` 通过；演练卡 7 项 jsdom 断言含判分三态、零持久快照、换题保持公式族、en 无汉字与键面泄漏、label/aria 关联。**未覆盖**：真实浏览器下的视觉与 <768px 布局（本会话仍不能启动 dev server），仅以组件级渲染代替；`t5-multiway-frequency` 的范围/概率结论仍需非作者复核（PRD §6.7.3）。

### 2026-09-27 理论学院课程修复：两处枢纽章 + 量化闭环 + 零基础先修（内容层，7 个 commit）

对理论学院做了"初学者→职业牌手"路径实测评审后，按结论补齐三处结构性断层（评审结论：九级主线骨架完整、每 Level 教材引用 ≥2 达标，但入口/中场/出口有洞）。

- **新章 `t4-preflop-structure`（T4 第 4 章）**：3-bet / 4-bet / 防守范围此前只作为 T4/T5 例题出现，从未被当作"范围构建对象"推导，学习者无法解释求解器翻前范围的来源。新章以 α = b/(P+b)、MDF = P/(P+b)、跟注门槛 = 需补额/跟注后底池三条口径推出尺度与位置的关系与 SPR 塌缩逼出的极化结构（α 66.7%/74.1%/59.3%、门槛 31.4%/28.9%/39.7%、SPR 1.93，全部可手算）。15 段覆盖 `TheorySectionType` 全部 8 类——**本模块首次启用 `takeaway` 段型**（此前标准 32 章零使用）。
- **新章 `t6-equity-realization`（T6 第 4 章）**：权益实现是全主线的空白枢纽（仅 T3 顺带提过一次"权益实现"），而它同时解释位置为何有价值、深筹码一对为何变负债、多人底池为何双层受损。给出 `实现权益 = 全下权益 × 实现率`、`R=1 当且仅当立即全下`、门槛倒推 (1/3)÷0.85≈39% 与 25%÷0.8≈31%。实现率数值无标定依据，正文与题面一律标"约/典型量级"并归入审计测试的 `[示意值]`，不伪造精度（PRD §6.7.1）。
- **T1/T8 量化闭环补段**：`t1-variance` 讲标准差却未回答"打多少手能证明优势"，现补 `n=(zσ/μ)²` 推导（5bb/100 @80bb/100 需 98,345 手；2 万手累计 σ 1131bb > 期望 1000bb 故仍在噪声内）；`t8-bankroll-psych` 有 Kelly 上限却无破产概率，现补 `ROR=exp(−2μB/σ²)`（10/20/30 买入 → 21%/4.4%/0.9%），并明写连续近似是下界。两章均**只在 content 数组末尾追加 3 段**——段落 key 为下标型且 `contentAlignment.baseline.ts` 的棘轮基线是空集，中间插段会造成 zh/en 静默错位且无自救余地。
- **新增 `utils/theoryFormulas.ts`（模块内自持）**：六个纯函数固化上述口径 + `theoryFormulas.test.ts` 锚定已发布课文数值（MDF 半池 67%/满池 50%、Kelly 0.55→10% 等）。**刻意不下沉 `shared/utils/pokerMath.ts`**：当前仅本模块消费，未达 shared 层 ≥2 模块准入门槛；策略学院若复用再上收。
- **审计登记**：`standardQuantAudit.test.ts` 新增 3 个复算 `it` 块并复用 theoryFormulas 作为单一口径源，文件头人工复核索引同步补 T1/T4/T6/T8 条目（`[正确]` / `[示意值]` 分类）。
- **首页先修引导卡**：T1 首章直接从组合计数开场，而规则/牌型/位置/术语只在策略学院 `/academy/basics`，且桥接方向（理论→实践）与真实前置依赖相反。`TheoryHome` 侧栏新增私有 `BasicsPrerequisiteCard`，仅在当前变体已完成章节为 0 时出现；因 `ALLOWED_CROSS_IMPORTS` 禁止 theory→strategy 边，只以路由字符串对接、不读取对方 `basicsProgress` 完成态、**不新增持久化字段（persist version 不变）**。
- **单挑变体桥接难度错配修复**：T1HU/T2HU 的推荐指向策略学院 **L7** 课 `l7hu-stakes`，入门级理论被推到高级实践课，且同一 `{id,title}` 字面量在 T1/T2/T9 三处重复。现 T1→`l1-hand-selection`、T2→`l3hu-bn-aggression`（对齐策略学院"变体 L1/L2 复用标准共享基础层"的既有设计），T9 保留 `l7hu-stakes`（高级段推高级课本就合理）；另修正 T7HU 中 `l8hu-exploitative` 的回退标题与 `academy.lessonTitle` 权威标题不一致。**发现并登记风险**：变体的 `practiceRecommendations` 不在任何守卫清单内（`variants/theoryIntegrity.test.ts` 完全不校验，两份 ID 镜像的事实源只是 `THEORY_LEVELS`），故只能人工 grep 核对——已把该约束写入 theory-academy-dev 的 Workflows，未新增守卫（变体课时 id 加进 `CROSS_MODULE_LESSON_IDS` 会因"变体课不得混入 LEVELS"断言直接变红）。
- **文档口径对齐**：PRD §5.27.3 原把"学习目标"列为章节契约必项，而 `types.ts` 的 `objectives?` 是可选（缺省不渲染，标准 32 章仅 T1 的 3 章声明）→ 改为"可选字段，新增章节必填，存量按批次补齐"；§5.27 内容规格表 T1/T4/T6/T8 覆盖范围同步；§5.27.8 增补先修引导条目并写明其非门禁性质。TDD §5.8b 的 `TheorySectionType` 清单原缺 `takeaway`（7/8 类）已补，并把过期的"数据文件放宽 200 行"更正为以 `line-count-guard.test.ts` 为事实源，另记入下标型 key 的追加约束、量化口径单源与先修卡三条实现约束。
- **验证**：`pnpm verify` 全绿（148 文件 / 1028 测试，含新增 theoryFormulas 7 项 + TheoryHome 先修卡 3 项）；新章全段落经真实渲染链 jsdom 渲染验证（takeaway / formula 分支正常、无 i18n key 字面量泄漏）。zh 侧由数据文件程序化重建以保证逐字镜像，en 侧断言零汉字与长度对齐。**未覆盖**：真实浏览器下的 `/theory` 与章节页视觉与响应式布局（dev server 启动被判定超出本次范围），仅以组件级渲染代替。
- **待人工事项**：PRD §6.7.3 要求新增章节在自动断言之外由**非作者复核人**做学科正确性复核——两章的范围/概率结论尚未走完该环节，交付状态应记为"机器可校验部分通过"。

### 2026-09-25 GitHub Pages 部署连续失败的根因修复（已提交 `48cad4d` / `6905ec1` / 本轮）

连续 9 次 CI 红（`35963310235`…`35965691565`），前 5 个 commit 全是在盲改豁免清单。三处根因：

- **守卫测试路径解析在 Windows 下失效**：`new URL(...).pathname` 产出 `/F:/...`，被解析成 `F:\F:\...` 直接 ENOENT；`eslint-guard-dependency-graph.test.ts` 则手工裁剪 `file://` 前缀踩同一坑。影响 `line-count-guard` / `admission-guard` / `eslint-guard-dependency-graph` 三个守卫——**本地恒红、Linux CI 结论不同**，开发者看不到违规文件只能猜。统一改 `fileURLToPath`；line-count-guard 增加扫描自检（`allFiles.length > 300`）防路径失效时断言空洞通过，断言改为直接比对路径数组使 diff 自解释。
- **line-count-guard 阈值口径**：对齐 `docs/AI_GUIDE.md` §编码规范「超过 400 行需拆分」，硬失败线 300 → 400，300–400 为非阻断灰区（原 300 线下的豁免清单已膨胀为组件名枚举）；补齐模块根 `constants.ts` 豁免（旧规则只覆盖 `constants/` 目录）。整改后 >400 的 36 个文件全部落在正当豁免类别。
- **`useAcademyDataSource` late registration 真实产品缺陷**：自愈路径只触发一次快照刷新、未补桥接真实数据源的 `subscribe`，导致「Dashboard 先挂载、学院数据源后注册」时组件拿到一次性快照后**不再响应学院进度变更**；且丢弃 `onAcademyDataRegister` 返回的取消函数造成监听器泄漏。测试侧 mock 每次合成新快照对象，违反 `AcademyDataSource` 稳定引用契约，是 "Maximum update depth exceeded" 的直接触发点，两侧同时修。

**元根因（本轮追加修复）**：`.git-hooks/pre-commit` 的 lint 门禁 **fail-open**——`command -v pnpm` 失败即 `exit 0` 放行。pnpm 实际不在 hook 的 PATH 上（本机 pnpm 位于 `F:\dev\pnpm`，未入 PATH），所以门禁静默空转，`git status` 却显示检查通过；上文「全部 8 个提交逐一通过 pre-commit」即其产物。改为：`pnpm` → `corepack pnpm`（按 `packageManager` 取锁定版本，本机可解析到 11.18.0）→ `$APPDATA` 下 `eslint.cmd` → **三者皆无则 `exit 1` 中止提交**；检测口径由 `git diff HEAD` 修正为 `git diff --cached`（只校验将要提交的内容）；`cd` 仓库根目录失败时同样阻断。同步更正 `.git-hooks/README.md`——原文把门禁写成「仅校验 agent 文件」「警告级非阻塞」，与代码双重不符。三分支均已实测：正常放行、lint 错误阻断（exit 1）、无包管理器 fail-closed（exit 1）。

### 多代理协作收口遗留事项（本轮总计：门禁 132/898 → 142/1021 全绿；全部未 commit）

> 编排者（主代理）+ 项目子代理（platform-dev / progress-dev / gto-simulator-dev / range-trainer-dev / strategy-academy-dev / theory-academy-dev）波次协作。子代理产出均经 git diff 与测试数交叉核验；`progress-dev` 两次空转由主代理接管其任务。

### 契约与体验修复

- **复习项 i18n key 契约收口**：pot-odds 新增 `utils/oddsSrs.ts`（修复 `scenario.slice(0,40)` 产生的残缺 key——题库早已 key 化，真缺陷是截断而非"存原文"，更正上批登记）；gto-simulator 新增 `utils/gtoSrs.ts`（场景运行时生成无现成 key，改存静态 key + `metadata.params`，**删除了向持久化写入 `scenario.description` 动态文本的旧逻辑**）；`gto.json` zh/en 新增 `review.*` 双语键。渲染层补齐 label/back 的 `metadata.params` 插值（`ReviewSession` / `SpacedRepetitionPanel`，+`reviewParams.test.tsx`）。
- **progress persist v17 → v18**：新增 `utils/migrateOddsReviewKeys.ts`（残缺 key 归一 / 中文原文版 label+front+scenario 归一、含原文 options 整体移除退化为自评、back 优先取 options 正确项 key 否则清空；进度零丢失、幂等、脏数据安全）。
- **SRS 答错由整项重置改为有界回退**（`shared/utils/spacedRepetition.ts`）：repetitions 退 1 步、interval 退一档（`INTERVAL_SEQUENCE` 回退映射）、easeFactor −0.2 有界下浮；quality 5/4/1 语义不变；+8 测试。
- **`descReviewMore` 计数修正**：「等 N 项」的 N 由总到期数改为**隐藏数**（不变量：展示条数 + N = 总到期数；+4 测试）。
- **GTO 预设 BTN 开池宽度 36.08% → 47.12%**：实测确认手工近似（频率形态单调反常、solver 常用手牌缺失），修正为 169 手全量频率表（call=0、raiseAmount 2.5、每手和=1 逐手校验；依据 PreflopWizard 40-45% / Freebetrange 40-48%）；range-trainer `btn-open` preset 同步 76→89 手（+K3s 等 13 手纯新增，标注 ~39%→~44%，纯组合数口径 43.89%）；一致性守卫 10/10 绿。**附带登记**：`bb_vs_btn_open` 与更宽 BTN 开池的联动放宽未动，待后续数据批次。

### 3Bet/3-bet/3bet 词形统一（用户裁定纳入）

- 全部统一为 `3-bet`：theory 数据+locale 344 处（数量守恒 346，`l3-bet-sizing` 等标识符保留）；strategy 数据+locale 全量；puzzleBank 文案约 220 处 + 全仓散点（HUD label、range-trainer label、注释散文）。**新增 `src/i18n/termFormGuard.test.ts` 棘轮守卫：非例外残留锁死为 0**（例外清单全为标识符：kebab id / snake 数据键 / `L2_3BET_*` 常量名，含死条目强制清理）。实测更正：`help.json` / `potOdds.json` 此前已统一。

### objectives 全量补全（用户裁定纳入）

- **121 课时 / 414 条**三批落地（standard 75 课时 252 条含 20 个 drill 型、heads-up+short-deck 29 课时 95 条、localLessons 17 课时 67 条）；zh 镜像逐字一致、en 无汉字，contentAlignment 棘轮零新增漂移；卫生守卫扩至 12 用例（三组清单落地断言互斥覆盖全部课时，禁不可测动词）。实测更正上批「118/121」口径（3 个既有样例 + 实际课时数）。
- **新登记**：drill 型课时（21 个）的 objectives 数据已落但渲染端不消费（`DrillLessonRouter` 路径不经 `LessonIntroCard`），待 UI 批次接线。

### 阶段 7 全量量化断言审计（全量逐条复算，禁止抽样）

- **theory 侧（两批）**：standard L1-L9 约 240 数值点 + short-deck/heads-up 约 240 点；约 80 处修复（26 错位数值）。系统性错误：**AK 对口袋对权益方向颠倒**（43-45% 落后 → AKs vs QQ≈53.7% 领先，pokerpro.tools 全枚举口径）、**短牌非法牌张 2-5 全量清零**（board/正文/题干 20+ 处）、÷33→÷31、set mining 17.6%→17.1%（1−C(32,3)/C(34,3)）、偷盲保本统一沉没成本口径 50%（原 60% 与 t7hu 分裂）、EV 分解净赢口径 P+b、Set 概率 1/8.5（7.5:1 是赔率非概率）、价值诈唬比 P+bP、多人池 4 人=64%、KQ 双重阻断漏 board K♠（8→6 种）、死钱场景单列复算（Ante 局 BB 22.4%）等。
- **strategy 侧（两批）**：standard 11 项修复 + 变体/本土课 83 处修复（同源 AK 方向、非法牌张清零、偷盲 50%、15→16 outs、Maniac EV +125→+68、ICM $36.6→$33.6、MDF 44%→56%、4bet 保本 70.6%→57.4% 等）；未修清单 #3-#12（standard L3-L7 正文级改写约 40 处 × 三语）如实保留待下批。**evCalibration 棘轮零变动**（未编造任何 evLoss）。
- **四份真复算守卫**（theory `standardQuantAudit`/`variantQuantAudit` + strategy 同名，共 72 用例）：判分题数学复算锁定、短牌非法牌张正则扫描、BB min-raise 25% 与偷盲 50% 回归锁、ICM 递归复算；散文数值以人工复核索引记录。

### Wave 3 浏览器实测（webapp-testing / Playwright，真实用户路径）

- **✅ 通过：`<768px` 布局**——home/theory/academy 三页 375px 宽均 0 横向溢出、MobileNav 存在（截图 `.codebuddy/acceptance/acc3-*.png`）。
- **✅ 通过：三态反馈呈现**——无标定 practice 选项作答后**无 EV 损失徽章渲染**（符合 PRD §6.7.1 呈现诚实性）；顺带验证本轮新增的 objectives 学习目标卡真实渲染于课时页。
- **⚠️ 基本通过：朗读顺序**——aria snapshot 显示语义化结构完整（complementary/nav/list/listitem/link 均带可访问名、heading 层级正常）；**发现 2 个空可访问名控件**（首页 button/a 无文本无 aria-label），待定位修复（小项）。
- **❌ 失败（发现真缺陷）：章末小测真实入队断裂**——真实走完「进入小测 → 答题（答对 2/5，含 3 错题）→ 查看结果 → 本章完成」全流程后，`poker-training-progress.reviewItems` **始终为空**（返回目录后同样为空）。上批「自动化脚本未能走到完成态」的未验项本轮走到完成态，暴露断裂。候选根因（待排查）：`completeChapter` 真实路径的 `wrongQuestionIds` 为空 / `buildTheoryReviewItems` 未知题 id 静默跳过全部命中 / 入队调用被 `alreadyCompleted` 分支吞并。**处置**：登记为新 P0 缺陷，本轮未修（验收即目的）。

### 验证状态与遗留（诚实记录）

- **门禁**：`pnpm verify`（typecheck + lint + test）**exit 0，142 文件 / 1021 测试**（本轮起点 132/898）。全部棘轮（contentAlignment 基线空集 / evCalibration 覆盖率 / termFormGuard 锁 0 / lessonObjectives 12 用例）无倒退。**全部变更未 commit**（按模块提交清单见各子任务交付报告；待用户确认后执行）。
- **浏览器已验**：见上 Wave 3 三项；**未验**：屏幕阅读器真实朗读（仅 aria snapshot 替代检查）、en 界面下的 objectives 与反馈渲染目检、`pnpm build` 产物走查。
- **登记遗留（本轮新增/顺延）**：① 章末小测入队断裂（P0，见上）；② strategy 未修清单 #3-#12 约 40 处 × 三语；③ drill 型 objectives 渲染接线；④ 首页 2 个空可访问名控件；⑤ `bb_vs_btn_open` 联动放宽；⑥ `4Bet/5Bet` 词形不在 termFormGuard 范围未统一。

---

## [Unreleased] - 2026-09-04

### 教学内容守卫层：三类静默失效从"无法发现"变为"提交前拦截"

> 教学审计的根因结论：本轮所有内容与判分缺陷之所以能长期潜伏，不是因为写错，而是因为**没有任何自动化能看见"数据与本地化文案不一致"**。先建守卫，再改内容。

- **新增 `src/i18n/contentAlignment.test.ts`**：对课程内容做四层断言——下标长度对齐、**zh locale 与数据原文逐字镜像**、en 侧非空且不含汉字、下标 orphan 反向检查（数据删段后 locale 残留此前完全无人看守）。配 `contentAlignment.baseline.ts` **棘轮基线**（只允许减少）。首跑即抓出 **87 条既存错位**，本轮全部真修复，**基线为空集**，未靠白名单掩盖任何一条。
- **新增 `src/i18n/contentKeyEntries.ts`**：把"数据 → 内容 key → 原文"的映射收敛为单一生成器，`contentI18n.test.ts` 与 `contentAlignment.test.ts` 共用，消除两处各自的重复遍历；并补齐 **id 型单值键**（题干 / 解析 / 示例 / Drill / 对手画像 / 术语）的陈旧检查——此前只覆盖下标型数组，漏掉了"改了数据没改 locale"这一类。
- **新增 `src/features/strategy-academy/data/theoryReferenceIntegrity.test.ts`**：经 Vite `import.meta.glob(..., '?raw')` 扫描理论数据求章节 id 全集，断言策略课时 `theory-reference` 的目标真实存在、每段都带可跳转 id、报错带 `文件:行号`。**不维护手工镜像清单**（双侧硬编码镜像是该仓既有模式，但会随章节增删漂移，故此处不用）。
- **收编无主命名空间**：`academy.lessonTitle.*` 在 locale 中已有 94 个键却**没有生成函数、不受任何守卫管理**；现补 `lessonTitleKey` 单源函数并登记进 `CONTENT_KEY_PREFIXES`，同时补齐缺失该键的 27 个课时，现共 121 键全量受管。

### 教学内容事实修正与判分缺陷（理论学院 + 策略学院）

> 最严重的不是措辞，而是**判分**：多处"界面显示的题"与"判定对错的题"来自不同源。

- **P0 · 19 族 Drill 题显示/判分分裂**：`resolveDrillQuestion` 用 `t(key)` 取显示文字、用 `{...q}` 取数据侧 `isCorrect`，而 locale 与数据已整体错位一位——样本 `d-l5-session-q1` 数据题干「此时你应该怎么做？」（正解"立即执行止损"）对 locale「你一天的最佳训练时长是？」。学员会**按没见过的题被判分**。修复 102 个键（zh 镜像 + en 按新语义重录）。同类错位另在两学院的 3 处数组（`local-gto-vs-exploit` / `local-mental-tilt-recognition` 缺头部 💡 前置段、`t5-gto-concept` 缺 index 3 小节标题）中导致**中英文界面同时"前置提示消失 + 结尾重复一遍"**。
- **系统性数学口径错误**：`Alpha = b/(P+b)`（进攻方 bluff 保本弃牌率）与**跟注所需胜率** `b/(P+2b)` 被混为一谈，跨两学院复发——修于 `t9-alpha`（整章应用段与三例视角颠倒、例一"30% 低于 Alpha=25%"数值自相矛盾、`order: 1.5` 插队重教 T5）、`l4-bluffcatching`（步骤 2 用 40% 代 28.6%、步骤 4 两条 Blocker 方向**完全写反**、解析含"等等——"草稿自述）、`l4-mdf-q3` / `l4-overbet-q3` / `standardLevel4a` / `standardLevel3`，以及**单挑变体 12 处**「BB 面对 min-raise 跟注需 33.3%」漏算自己已入池的 1BB（正解 25%，且同库 `headsUpLevel2` 写的就是正确值）。
- **其余事实修正**：满池跟注所需胜率 25%→33%；把 QQ 说成 AKo「你领先」（实为被支配，AKo 对 QQ ≈ 43%）；`t6-geometric` SPR 例重复扣减自己筹码（`400−67−67` → `400−67=333`，与同段正确值自洽）；`t3-starting-hands` 伪公式改可复算 set-mining；同文件内 BTN 40-50% 与「CO/BTN 25-35%」冲突；同一"剥削偏离幅度"两式互斥且挂伪出处「半凯利」；7 处 CJK 错别字（偏缀 / 折3-Bet / 營得 / 藄弱点 / 兘开 / 疑狂 / 購值）、12 处源码 `\\n` 会渲染出字面 "\n"、繁体「頻」、markdown 星号泄漏。
- **判分结论纠偏**：`d-l4-ev-q4` 的 `+3.9BB` 系 `0.35×(10+8+8)` 双重扣减所得，正解 `0.35×18−0.65×8=+1.1BB`；`d-l4-ev-q8` 题面明写"无隐含赔率"却把 `+1.5BB` 判为正确，正解 `0.32×8−0.68×3≈+0.5BB`；`l4-ev-p3` 的 AKs 面对 4-Bet 全下按 `89.5/194.5=46%` 对约 40% 实得，正确项由 Call 改判 Fold。**明确不做**：为 595 个无标定选项人工编造 `evLoss`（与 PRD §5.3.6 冲突）。
- 重复题 `l5-sr-q2/q3`、无出处冠名"GTO 基准"的 REG 人群统计（22/18）、凭空的「80% GTO + 20% 剥削」比例断言，均已按 §6.7.1 纠正或降级为示意值。翻前范围宽度不再由课程复述，改为相对描述 + 指向策略数据事实源。

### 五级反馈呈现诚实化

- 判分链路与 `GRADE_THRESHOLDS` / `calculateGrade` / `buildDecisionFeedback` **零改动**；仅呈现层改为**三态**：有真实数值 `evLoss` 才渲染五级徽章与 EV 损失，否则如实显示「正确 / 错误 + 解析」（`utils/practiceFeedbackView.ts`）。
- `utils/evImpactTone.ts` 修掉 `startsWith('+')` 造成的 35 处假红（`'0 BB/100'`、`'保护资金安全'` 等叙述值此前一律标红）。
- `utils/evCalibration.test.ts` 把**标定覆盖率**做成棘轮指标（实测 standard 743 选项 / 0 标定，heads-up 99/114、short-deck 144/159），后续只能上升、不可倒退。

### 复习闭环与学习体验

- **理论学院首次接入间隔重复**（此前该模块 `addReviewItem` 为 0 次，宣称的"五级反馈 + SRS"闭环在教学效果上等于不存在）：`utils/theorySrs.ts` 以 `theory:<questionId>` 命名空间入队（避免与策略课时 id 在整体 upsert 下互相吞并），SRS 记录置于 `completeChapter` 的 `alreadyCompleted` 早退**之外**以支持重测；理论 store **未变更 persist**。
- **复习项语言契约**（浏览器实测纠出）：`ReviewSession` / `SpacedRepetitionPanel` 本就把 `metadata.front/back` 与 `label` 当 **i18n key** 使用（`range-trainer` 为正确先例），故理论/策略两侧存中文原文的写法在英文环境直接回显中文；现统一改存 key，并新增 progress **v16 / v17 两次存量 migrate**（按 `theory:<qid>` / `lessonId` 确定性反解，幂等、脏数据安全跳过、保留调度进度）。
- **配对要求沉淀为规则**：`theory` 包为控首屏体积被刻意排除在 `/` 之外，故"存 key"必须配"按需加载来源包"，只做其一比原状更糟——`useEnsureReviewSourceI18n` 接入复习会话、SRS 面板与 Dashboard。
- **策略→理论桥接真正可用**：`resolveLink` 优先 `theoryChapterId`，使 32 处「理论支撑」从死文字变可点（24 处零数据改动）；余 8 处指向不存在章节的 id 重映射（`t3-position`→`t3-position-value` 等）。
- **新增 `/theory/review`** 疑难题目复习清单页（此前 `toggleFlagQuestion` 只在首页显示一个计数、无任何出口），并把「题 id 必须以 `-qN` 结尾」升为契约守卫。
- 术语表 43→55 条（补 MDF / Alpha / SPR / 极化 / Overbet / Blocker / 权益实现率 等高频缺席项，定义取自正文）；策略学院新增 `Lesson.objectives` 与先行组织者卡渲染（3 课样例）。
- **浏览器实测另抓出一处 886 测试全绿未见的缺陷**：学习路径卡用 `t(descReview, {items})` 而 `items` 为未逐条翻译的 label 拼接，i18next 不递归翻译插值值 → 英文首页裸显 `theory.quiz.t1-combinatorics-q1.question`。修复走新增共享解析器 `utils/recommendationText.ts`（`dailyTrainingPlan.ts` 已 312 行超 300 硬约束，故未加深），复现测试先红后绿，修复后裸键 0 处。

### 验证状态与遗留（诚实记录）

- **门禁**：`pnpm verify`（typecheck + lint + test 全量）**exit 0，132 文件 / 898 测试**（本轮起点 113 文件 / 765 测试）。`contentAlignment` 棘轮基线为空集。选项分布守卫实测：strategy quiz 315 题 21.6/27.3/31.4/19.7%、theory 371 题 23.7/26.7/26.1/23.5%、practice 249 题 20.5/45.4/34.1%、drill 四族最高 50%，均在红线内且未借改他题凑数。
- **浏览器已验**（`/dezhou/`，zh 与 en）：理论章节渲染与学习目标卡、`/theory/review` 空态与标题映射、课时推进后理论支撑块为真实 `<a href="/theory/chapter/…">`、英文首页 SRS 面板把 key 正确解析为英文题干且分类显示 "Theory"、计划卡裸键修复后归零。
- **未验**：真实完成章末小测触发的入队（曾手工注入同 id 被 upsert 覆盖，无法区分，自动化脚本未能走到完成态）；策略课时实战练习三态反馈的真实渲染；`< 768px` 布局；屏幕阅读器朗读顺序。
- **登记遗留**：GTO 预设表 `6max_100bb_preflop` 的 BTN 加权宽度仅 36%（主流 45-50%）疑为手工近似；SRS 重测答错会整项重置调度进度；`shared/utils/spacedRepetition.ts` 的 `updateReviewQueue` 仍以原文入队（零调用方）；`descReviewMore` 的 `and N more` 用了总到期数而非隐藏数；正文 3Bet/3-bet/3bet 三形并存 286 处不统一（收益低风险高）；objectives 待补 118/121 课时；pot-odds / gto-simulator 复习项仍以运行时文本入队；**阶段 7 全量量化断言审计**（Alpha/所需胜率类错误已证实为系统性，尚余数条已复算为错但未修）。
- 文档同步：PRD §6.7.1/§6.7.4/§12.4.3/§10 R11-R12/§11 与 TDD 落点、AGENTS.md 五级反馈豁免与课程双轨 i18n 规则已随批写入；4 个 3 行 tombstone 空壳组件待 `git rm`（未擅动）。

---

## [Unreleased] - 2026-09-04 · 文档

### 学习模块内容规格补全与文档撰写规范（PRD v3.1 / TDD 同步，纯文档变更）

> 审阅结论：§5.16 / §5.27 只写了门禁、测验、证书等**功能开关**，没有写"教什么、按什么序、到什么质、谁审核"——内容产品最核心的内容规格整段缺失；根因是「单一事实源」原则被误用到需求语义层，把产品决策一并推给了代码与 TDD。本次按该判据补齐。

- **PRD §5.16 策略学院**：修正为 **L1-L8 共 9 个 Level 节点（L4 拆 L4A/L4B），不存在 L9**（原文"L1-L9"与 `lessons/variants/standard/index.ts` 的 `l1…l8 + l4a/l4b` 不符）；新增 5.16.2 门禁判定口径（同一 Level 数字下多条目须全部满足，L4B 不因 L4A 达成而旁路，对应 store ACAD-07 修复）、5.16.3 小节化微观闭环、5.16.5 学习轨道与概念图谱、5.16.6 课程内嵌交互工具（EV 计算器 / MDF 可视化 / 预测式提问）、5.16.7 变体课程体系；新增**内容规格表**给出 9 个节点的教学主线与可观察学习目标；验收标准由"无空壳节点"改写为映射到既有课程守卫的可断言条款。
- **PRD §5.27 理论学院**：段位命名与代码枚举对齐为**基础 T1-T3 / 中级 T4-T6 / 高级 T7-T9**（原文"入门/进阶/高级"漂移且缺边界）；解锁口径修正为"Tn 需 T(n-1) **全部章节完成**"（原验收标准写"小测通过后解锁"，与 `isTheoryLevelUnlocked` 不一致）；**打破教材对照循环引用**——原文称"对照表以代码为唯一事实源"但代码无结构化字段、TDD 又写"对照索引见 PRD 5.27"，现由 PRD 持有教材对照基线表（按各 Level 正文内联标注实测聚合，补漏 MSSA），并声明教材与级别为多对多、每级引用 ≥2 本为质量基线；新增 5.27.3 章节内容结构契约、5.27.6 桥接 ID 命名空间契约、5.27.7 变体理论课程、5.27.8 学习地图与续学、5.27.9 **认证范围显式决策**（理论学院不发证书及理由）；用户故事角色回归 §2.1 已定义 Persona（原文"系统化学习者"无对应角色），并把理论学院基础段纳入 Persona A 学习路径。
- **PRD 新增 §6.7 内容质量与合规**：把原先只存在于 TDD §5.8b 的编辑准则（段落类型覆盖、公式必须含推导、每章 2-3 个差异化牌例、误区显式化、解析须解释错误选项）上收为产品级非功能需求；补齐此前完全缺失的版权边界（思想复述、禁逐字复制、出处标注格式）与内容审核流程（结构断言 → 非作者学科正确性复核 → 数值变更附复算依据）。
- **PRD 新增 §12.3 单源原则适用边界 / §12.4 文档撰写规范**：给出三分判据（会漂移的数值→代码、技术实现→TDD、**不漂移的产品意图与契约→PRD 必须承载**）；落地内容类需求三段式、可断言验收、并列模块对称性、课程 ID 命名空间、内容双语双轨口径（数据层中文原文 + 渲染层 key 覆盖，由全量遍历断言而非 key 引用静态守卫）、交付状态标注、术语对齐、格式一致性六组规范；原 §12.3 变更流程顺延为 §12.5，文档信息表递增为 v3.1。
- **PRD §10 风险登记表**：新增 **R9 教学内容事实性错误**、**R10 教材版权与实质性相似**——此前 8 条风险全为工程/平台风险，无内容侧风险，而内容是本产品主要价值载体。
- **PRD 格式一致性**：§5-§12 补齐一级章节 `---` 分隔（原文仅 §1-§4 有）；删除 §5.12 验收末行残留的表格分隔符 `|`；修正 §5.28 列表项多余行首缩进；文档信息表中单一事实源原则的交叉引用由 §12.3 更正为 §12.2。
- **TDD §5.8b-2 内容体系**：删除已漂移的硬编码"31 章 / 155 题"（实测 32 章 / 160 题），改为指向 `data/levels/variants/**` 与 `theoryIntegrity.test.ts`；编辑准则改为引用 PRD §6.7.1，仅保留实现落点（`TheorySectionType` 枚举、守卫断言）；修正指向不存在表格的"对照索引见 PRD 5.27 经典教材对照表"，改指 §5.27.4 / §6.7.2 并说明出处为正文内联文本、无独立结构化字段。
- **变更范围与验证（诚实记录）**：本次为**纯文档变更，未触碰 `src/` 任何代码**，故未运行 `pnpm verify`（typecheck / lint / test 的输入不受影响，且已确认无测试读取 `docs/PRD.md`）；文档内事实断言均经代码实测核对（Level/章节 id 检索、变体内容无骨架标记、`contentI18n.test.ts` 全量遍历、unlock 实现）。遗留：`docs/analysis/` 下历史审计工件仍使用已失效的"经典教材对照表"表述，按 point-in-time 存档处理，不追溯改写。

---

