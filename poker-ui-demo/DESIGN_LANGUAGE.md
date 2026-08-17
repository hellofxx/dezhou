# PokerLab · 设计语言文档

> 德州扑克训练平台 UI/UX 设计规范 v1.7.0
> 品牌主题：**Private Card Room（私人牌室）**
> 核心隐喻：胡桃木扶手、绒布绿呢、象牙牌面、黄铜点缀 — 复刻高端私人牌局的真实触感
> v1.7.0 更新：新增 §13 教育学习设计规范 — 学习进度可视化、课程内容排版增强、反馈教育脚手架、模块教育目的视觉区分、渐进式信息披露、移动端教育体验、教育场景动效
> v1.6.0 更新：内容宽度分级（§6.5）— 新增三档容器宽度（L1 默认收敛 1400 / L2 概览展宽 1680 / L3 阅读作答收敛），策略学院概览视图走 L2 展宽消除超宽屏 felt 留白（§9 页面模式 7）
> v1.5.0 更新：动效章节全量规范（§8）— 新增动效 token（缓动/时长）、触发方式、动画类型定义（淡入/滑动/缩放/旋转）、组件状态动画行为矩阵，React 侧共享动效规范 `src/shared/utils/motion.ts` 为单一事实源
> v1.4.0 更新：课程阅读排版契约（§3.3 Lesson Reading/Heading 字号）、新增 §5.22 教学内容块（content-block 视觉词汇）、课程内 Tab 图标化+sticky（§5.6）、场景卡复用（§5.16）、模块级 Emoji→Lucide 图标约定
> v1.3.2 更新：实现层合规修复（五级反馈牌室化、霓虹色板清零、牌背胡桃化）、新增 §5.21 交互状态矩阵、§2.2 语义色 hover 变体规则、token 登记（gold/bronze/indigo-bright/terra-bright）、设计 token 守卫测试机制
> v1.3 更新：移动端响应式重构（streak-rail 上移至 arena 下方、训练场二列、arena 紧凑三分区、纵向压缩）、CSS `!important` 特异性规则
> v1.2 更新：导航权威统一（侧边栏单一导航）、仪表盘 5 段叙事、训练场模块网格、今日推荐/场景卡/live 呼吸点等新组件、底部黄铜打卡条
> v1.1 更新：语义色低饱和化、跨 Tab 桌沿签名元素、黄铜雕刻铭文、组件质感统一

---

## 1. 设计哲学

### 1.1 核心气质
- **场域感优先**：打开 App 即"落座牌桌"，不是在"使用软件"，而是在"进入一场牌局"
- **物理质感**：所有组件对应真实牌室实物（牌、筹码、庄码、铭牌、木框、铜灯）
- **单重点缀**：整屏只有一个高亮色（黄铜），所有视觉重心由它引导
- **克制的奢华**：不滥用金色渐变/高光/立体，多数时间沉在胡桃木与绿呢暗色里
- **跨页签名**：Tab 栏下方的"桌沿铜钉"（`.table-rail`）是所有页面共享印记
- **雕刻感细节**：横幅顶边、卡片顶边、铭文两侧使用黄铜发线 `linear-gradient(90deg, transparent, brass, transparent)`，模拟木框嵌铜工艺

### 1.2 三不原则
1. **不出现纯黑 `#000`**：最深色 `--poker-felt-deep #0e1a14`（深墨绿），阴影带绿/棕调
2. **不出现纯白 `#fff`**：最亮色 `--poker-ivory #f3ebd9`（象牙米白）
3. **不使用第二种强调色**：除语义色外，所有可交互/高亮/装饰只用黄铜色系

### 1.3 反 SaaS 饱和色禁令
禁止高饱和霓虹色（`#4ade80`/`#f87171`/`#60a5fa`/`#fbbf24`）。所有语义色必须用"牌室化"低饱和变体（见 §2.2），模拟陶土筹码、苔藓地毯、霜钢灯座的真实色彩。

### 1.4 空间隐喻
- **页面 = 牌室**：暗角晕影模拟台灯只照亮牌桌
- **侧边栏 = 牌室墙面/酒柜**：胡桃木深色，固定在左，240px 宽，桌面端唯一导航权威
- **顶部栏 = 牌桌上方横梁**：h-16，薄，仅显示当前页名+状态图标，不承载导航
- **Table Rail（桌沿铜钉）**：顶部 header 正下方，全宽 14px 高，左右胡桃渐变+中央黄铜铆钉；跨所有页面的视觉锚点，模拟木桌包边，绝不可删
- **主内容 = 牌桌**：椭圆绿呢为视觉核心，面板环绕"桌下"
- **弹窗/浮层 = 发牌员递过来的东西**：浮在绿呢上方，带暖色阴影
- **移动端底栏**：<768px 替代侧边栏，固定在底；桌面端不出现

---

## 2. 色彩系统（Color Tokens）

所有颜色以 CSS 变量定义在 `:root`，前缀 `--poker-`。

### 2.1 主色板（4 大家族）

| 家族 | Token | HEX | 用途 |
|---|---|---|---|
| **Felt 绿呢** | `--poker-felt-deep` | `#0e1a14` | 页面底色、最深暗角 |
| | `--poker-felt` | `#15301f` | 卡片底色、面板底 |
| | `--poker-felt-raised` | `#1d4029` | 悬停态、次级表面 |
| | `--poker-felt-light` | `#245035` | 边框、分割线（亮侧） |
| | `--poker-felt-center` | `#1f5233` | 牌桌中心最亮绿 |
| | `--poker-felt-glow` | `rgba(224,189,117,0.07)` | 黄铜灯光晕染 |
| **Walnut 胡桃** | `--poker-walnut` | `#241a10` | 侧边栏底、深色面板 |
| | `--poker-walnut-raised` | `#3a2a18` | 面板抬升态、hover 底 |
| | `--poker-walnut-border` | `#4a3825` | 所有 1px 边框 |
| | `--poker-walnut-light` | `#4d3a24` | 边框亮侧、刻印文字 |
| **Ivory 象牙** | `--poker-ivory` | `#f3ebd9` | 主文字、牌面 |
| | `--poker-ivory-dim` | `#cabf9f` | 次级文字、按钮默认 |
| | `--poker-ivory-muted` | `#8a8068` | 说明、禁用、占位 |
| **Brass 黄铜** | `--poker-brass` | `#c9a25e` | 主强调、CTA 默认、图标 |
| | `--poker-brass-bright` | `#e8c97e` | 高亮态、active、glow |
| | `--poker-brass-deep` | `#a07d3d` | 黄铜暗侧、按压态 |
| | `--poker-brass-dark` | `#8a6b30` | 黄铜最深、暗纹 |
| | `--poker-brass-muted` | `#b09050` | 黄铜中阶、次级强调 |
| | `--poker-brass-glow` | `rgba(232,201,126,0.12)` | 黄铜辉光背景 |

### 2.2 语义色（低饱和牌室化，v1.1）

| Token | HEX | -bg（12% 透明） | 用途 |
|---|---|---|---|
| `--poker-success` | `#7fb883`（苔藓绿） | `rgba(127,184,131,0.12)` | +EV、正确、已掌握、完成 |
| `--poker-danger` | `#c25a4c`（陶土红） | `rgba(194,90,76,0.12)` | 弃牌、错误、-EV、严重警告 |
| `--poker-warning` | `#c9a25e`（黄铜同色） | `rgba(201,162,94,0.12)` | 注意、计时器紧迫（与主强调色统一） |
| `--poker-info` | `#8ba59b`（鼠尾草灰绿） | `rgba(139,165,155,0.12)` | 提示、中性说明、GTO 推荐 |
| `--poker-freeze` | `#a8c4cf`（霜钢蓝） | `rgba(168,196,207,0.12)` | 冻结卡、保护类状态（非 CTA） |

使用规则：
- 必须搭配 `-bg` 变体作底色，禁止大面积纯语义色做背景
- 语义色仅用于反馈/状态，绝不可做主 CTA 或导航高亮
- 反馈条用 `linear-gradient(90deg, semantic-bg, transparent)` 横向渐变
- 图标跟随语义色（对勾=success、叉=danger、i=info、雪花=freeze）
- **hover/active 变体规则（v1.3.2）**：语义色可交互元素 hover 时底色透明度由 12% 提升至 18–20%（如 `success-bg` → `rgba(success, 0.18)`），文字色不变；active/选中态可叠加 1px 同色边框（40–60% 透明）；禁止 hover 切换为更高饱和的异色，禁止各模块自造 hover 色值
- **暗底文字亮阶（v1.3.2）**：`--poker-indigo` / `--poker-terra` 作大面积底色时文字用对应亮阶 token（`--poker-indigo-bright` / `--poker-terra-bright`），保证暗底对比度

### 2.3 花色
| Token | 颜色 | 花色 |
|---|---|---|
| `--poker-heart` / `--poker-diamond` | `#d04545`（酒红，非正红） | ♥ ♦ |
| `--poker-club` / `--poker-spade` | `#f3ebd9`（象牙白） | ♣ ♠ |

> **v1.3.1 变更**：♣♠ 由深棕近黑 `#1a1308` 改为象牙白 `#f3ebd9`。原因：本平台默认暗底（felt 绿呢），深棕色花色在暗底几乎不可见；象牙白花色在绿呢/胡桃暗底上对比度充足（≥7:1），同时与牌面象牙色系一致。亮底场景（如分享卡片 canvas）需单独覆盖为深色花色。

### 2.4 功能装饰色（慎用）
| Token | HEX | 用途 |
|---|---|---|
| `--poker-gold` | `#d4a84b` | 金牌/成就徽章（v1.3.2 已落地 globals.css） |
| `--poker-bronze` | `#cd7f32` | 铜牌徽章（v1.3.2 新增；银牌用 `--poker-ivory-dim` 暖银、钻石用 `--poker-frost`） |
| `--poker-clay` | `#a83838` | 红色筹码（黏土红） |
| `--poker-sage` | `#6b8e7a` | 辅助图表（已被 --poker-info 取代，保留兼容） |
| `--poker-indigo` / `--poker-indigo-bright` | `#4a5a7a` / `#8ea4c4` | 石板靛（策略/进阶类标签底 / 暗底文字亮阶，v1.3.2） |
| `--poker-terra` / `--poker-terra-bright` | `#965a3e` / `#c98a63` | 陶土赭（心理/弱项类标签底 / 暗底文字亮阶，v1.3.2） |
| `--poker-frost` / `--poker-freeze` | `#a8c4cf` | 霜钢蓝（冻结卡） |
| `--poker-moss` / `--poker-success` | `#7fb883` | 苔藓绿（成功态） |
| `--poker-terracotta` / `--poker-danger` | `#c25a4c` | 陶土红（危险态） |
| `--poker-leather` | `#c08a5a` | 皮革赭（hand-history 模块主题色，§5.18） |

### 2.5 渐变规范
- **页面底**：`radial-gradient(ellipse 65% 55% at 50% 30%, transparent 50%, rgba(14,26,20,0.35) 78%, rgba(14,26,20,0.55) 100%)`（暗角，对齐 felt-deep `#0e1a14`）
- **页面灯晕**：`radial-gradient(ellipse 75% 55% at 50% 25%, rgba(232,201,126,0.06) 0%, transparent 65%)`
- **黄铜按钮**：`linear-gradient(180deg, #f0d48a 0%, #c9a25e 50%, #a07d3d 100%)`
- **黄铜横幅**：`linear-gradient(180deg, #d4b068 0%, #c9a25e 50%, #b48f44 100%)`（略深于按钮）+ 顶高光 `rgba(255,240,200,0.45)` + 底暗影 `rgba(0,0,0,0.12)`
- **胡桃面板**：`linear-gradient(180deg, #241a10 0%, #1a1308 100%)`（对齐 walnut `#241a10`）
- **雕刻发线**：`linear-gradient(90deg, transparent, rgba(201,162,94,0.5), transparent)`
- **牌桌绿呢**：多层 radial-gradient 叠加，中心亮边缘暗（见 `.felt-arena`）
- **深色金属按钮**：`linear-gradient(180deg, #4a3218, #2a1c0a)` + inset 0 1px 0 brass(0.15)

---

## 3. 字体系统

### 3.1 三族分工
| CSS 类 | 字体族 | 用途 |
|---|---|---|
| `.font-display` | **Fraunces** (opsz=144, SOFT=30, WONK=1, 500/600) | 标题、品牌名、大数字、铭牌 |
| `body / 默认` | **Inter Tight** 400/500/600 | 正文、按钮、UI 控件 |
| `.font-numeric` | **JetBrains Mono** (tabular-nums) | 筹码、BB、胜率、百分比、计时器 |

中文回退：`'Source Han Serif SC','Songti SC',serif`（display）/ `system-ui,-apple-system,sans-serif`（sans）

### 3.2 禁用规则（v1.1）
- **禁止中文斜体**：中文字形无斜体设计，浏览器合成 italic 会产生锯齿伪斜。中文格言必须使用 `.motto-engraved` 组件，不得用 `font-style: italic`
- 英文格言 italic 仅在 Fraunces 上使用，显式设置 `font-variation-settings:'opsz'144,'SOFT'50`

### 3.3 字号层级
| 层级 | 字号 | 字族 | 字重 | 行高 | 用途 |
|---|---|---|---|---|---|
| Hero | 48–60px | Fraunces | 500 | 1.05 | 登录/开局大标题 |
| H1 / Page Title | 20–22px | Fraunces | 600 | 1.2 | 顶栏页面名 |
| H2 / Panel Title | 15–16px | Fraunces | 600 | 1.3 | 面板标题 |
| H3 / Section | 13–14px | Inter Tight | 600 | 1.4 | 小节标题、标签 |
| Body | 12–13px | Inter Tight | 400/500 | 1.5 | 正文 |
| Caption | 10–11px | Inter Tight | 400 | 1.4 | 注释、次要信息 |
| Eyebrow | 9–10px | Inter Tight | 600 uppercase | 1.2 | tracking 0.18–0.2em，分组标签 |
| Numeric Big | 28–36px | Fraunces/JetBrains | 600/700 | 1 | 铭牌数值、关键数据 |
| Lesson Reading / 课程阅读正文 | 14px | Inter Tight | 400/500 | 1.7 | 课程理论讲解正文（max-w-prose 65ch 阅读列） |
| Lesson Heading / 课程内容标题 | 20px | Fraunces | 600 | 1.4 | 课程内容 heading 段 |
| Motto | 11px | Fraunces italic | 400 | 1 | 两侧发线包裹格言，letter-spacing 0.15em |

---

## 4. 间距、圆角、阴影

### 4.1 间距与圆角（4px 基准）
| 代号 | 值 | 用途 |
|---|---|---|
| `--poker-radius-sm` | 4px | 小芯片、tag |
| `--poker-radius-md` | 8px | 按钮、输入框、徽章、卡片（v1.1 统一） |
| `--poker-radius-lg` | 12px | 大卡片、弹窗 |
| `--poker-radius-xl` | 16px | 大面板、大弹窗 |
| 椭圆牌桌 | `50% / 32%` | 真实赌场牌桌宽椭圆比 |
| 筹码/庄码 | 50% | 正圆 |

布局间距使用 `4/8/12/16/20/24/32/40`，保持 4px 倍数。

### 4.2 阴影层级
| Token | 值 | 语义 |
|---|---|---|
| `--poker-shadow-sm` | `0 1px 3px rgba(0,0,0,0.35)` | 卡片内小元素、chip |
| `--poker-shadow` | `0 4px 14px rgba(0,0,0,0.45)` | 面板、按钮默认 |
| `--poker-shadow-lg` | `0 12px 40px rgba(0,0,0,0.55)` | 弹窗、悬浮面板、牌桌 |
| `--poker-shadow-brass` | `0 4px 20px rgba(201,162,94,0.15)` | 黄铜高亮（CTA glow） |

特殊：
- **牌桌投影**：`0 14px 40px rgba(0,0,0,0.5), 0 30px 60px rgba(0,0,0,0.35)`（双层浮起）
- **inset 绿呢暗角**：`inset 0 0 100px rgba(0,0,0,0.55)`
- **黄铜横幅深投影**：`0 4px 18px rgba(0,0,0,0.3)`（模拟金属重量感）

### 4.3 边框与雕刻线
- 默认边框：`1px solid #4a3825`
- 黄铜发光边：`1px solid var(--poker-brass)` + `box-shadow: 0 0 8px rgba(232,201,126,0.4)`
- 双线木边（牌桌 rail）：`inset 0 0 0 8px #1a1308, inset 0 0 0 10px #4a3825`
- 金色内描线（牌面）：`inset 0 0 0 3px rgba(255,255,255,0.4), inset 0 0 0 4px rgba(201,162,94,0.3)`
- 黄铜雕刻发线 `.hairline-brass`：`height:1px; background:linear-gradient(90deg, transparent, rgba(201,162,94,0.5), transparent);`

---

## 5. 组件库

### 5.1 扑克牌 `.playing-card`
- 尺寸：`.small 42×60` / `.medium 56×80` / `.large 76×108`（5:7.1）
- 牌面：象牙白渐变 `#f8f2e2→#e5dcc4`，圆角 7px，45° 暗斜纹
- 角落：绝对定位 top/bottom 5px，rank+suit 竖排，右下角旋转 180°
- 牌背 `.card-back`：胡桃底+45°条纹，2px 黄铜边+内描金
- 阴影：三层投影（近1px/中4px/远8px），模拟纸卡漂浮
- 动画：`.card-wait` 呼吸缩放+明暗交替 1.8s 循环

### 5.2 筹码 `.chip`
- 正圆，径向渐变 `circle at 35% 35%, 亮, 基色 55%, 暗色 100%`
- 面值数字居中 `font-numeric`，28/32/36px
- 基础色：`.chip-brass` 黄铜 / `.chip-red` 黏土红 / `.chip-frost` 霜钢蓝（冻结卡，v1.1）/ `.chip-green/.chip-black`（预留）
- 堆叠：`.chip-stack` 负 margin 垂直叠放，单 chip 间 2–3px 可见边
- **数字禁忌**：普通筹码不叠印数字，仅特殊用途（如连击天数 top chip）允许 8px 小号

### 5.3 庄码 Dealer Button
- 正圆 22–36px，黄铜渐变
- 居中斜体 Fraunces "D" 字，颜色 `#3a2810`
- 用于：导航 active 指示、座位庄家位
- **折叠态降级例外**：侧边栏折叠（仅图标，w-16）时庄码降级为激活项图标下方 3px 黄铜小圆点（`--brass`），避免 22px 庄码与 20px 图标重叠；展开态恢复完整庄码

### 5.4 赌场铭牌 `.casino-plaque`
- 象牙白底 `#f3ebd9→#e8dcc0`，1px 黄铜边，6px 圆角
- 内描金双环（3px 白 + 4px 黄铜半透明）
- 三层结构：大数值（Fraunces 22–28px）/ 标签（8–9px uppercase）/ 副标（JetBrains 9–10px）
- 黄铜变体 `.casino-plaque-brass`：金底棕字+外发光（v1.1 起慎用，避免与 ELO 徽章重复）
- 小尺寸 `.plaque-sm`：用于椭圆牌桌四角
- **ELO 徽章专用** `.elo-badge`：♠+段位+数字，独立使用，不与 brass plaque 重复展示

### 5.5 按钮（v1.1 全面修订）

| 类 | 背景 | 文字 | 边框/阴影 | 用途 |
|---|---|---|---|---|
| `.btn-brass` 主 CTA | 黄铜渐变 `#f0d48a→#c9a25e→#a07d3d` | `#1a1308` | 1px `#8a6b30`+底阴影 | "在范围内"/"开始训练"/"加注"/"继续学习" |
| `.btn-fold` 弃牌/危险 | `--poker-danger-bg` 陶土红12% | `--poker-danger` | 1px `rgba(194,90,76,0.25)` | 弃牌、取消、删除 |
| `.btn-call` 跟注/中性 | `rgba(58,44,28,0.6)` 深胡桃半透 | `--poker-ivory-dim` | 1px `rgba(58,44,28,0.9)` | 跟注/limp、中性被动 |
| `.btn-allin` 全下/风险 | 深胡桃金属 `#4a3218→#2a1c0a` | `--poker-brass-bright` | 1px `rgba(201,162,94,0.4)`+inset 高光 | 全下、高风险 |
| `.btn-ghost` 次级 | transparent, hover `rgba(255,255,255,0.03)` | `--poker-ivory-dim` | 无 | 次要操作、tab、链接 |
| `.pill` 筛选/标签 | transparent+胡桃边 | `--poker-ivory-muted` | 1px `#4a3825` | 位置选择、模式切换 |
| `.pill.active` | 黄铜渐变 | `#1a1308` | 1px `#8a6b30` | 选中态 |

**行动按钮色阶**：fold=陶土红 → call=深胡桃 → raise=黄铜 → all-in=深胡桃嵌黄铜，按风险递增排列。

**平权答题选项按钮（v1.3.2）**：range-trainer QuizCard 等「三选一」答题场景中，fold/call/raise 是三个**平权选项**（非一个主 CTA + 两个次要动作），须保证三者视觉权重相当且互相可区分——三色相并立、都明显浮于呢面背景之上：
- fold：陶土红透底 `rgba(194,90,76,0.16)` + 陶土红字 `--poker-danger` + **陶土红边 0.55**（红调明确）
- call：**胡桃木不透明实色** `--walnut-raised`（不可用半透明沉底，否则墨绿背景透上来会与 fold 糊成一团暗棕）+ 象牙字 `--ivory-dim`
- raise：黄铜渐变 `--brass-bright→--brass` + 深墨字
- 反模式：直接套用「一亮 CTA + 两沉底次要」的 CTA 色阶（导致两个暗按钮低对比、区分度不足）

### 5.6 面板 `.panel`
- 胡桃渐变 `#241a10→#1a1308`，边框 `1px solid #4a3825`，圆角 8px，padding 20px
- 标题 `.panel-title`：Fraunces 15px 600，前带 15px Lucide 图标（brass 70%）
- 活面板 `.panel-live`：顶部黄铜发线 `::before`（左右各留 10%，带 glow）
- 主题卡片 `.theme-card`：同底，顶边半透明黄铜发线 `::before`，hover 点亮为实色黄铜
- **课程内 Tab 导航（v1.4.0）**：课程内容区的阶段页签（理论讲解/示例演示/实战练习），属内容区组件而非页面导航（不与 §5.7 侧边栏导航权威冲突）
  - `TabsList`：`sticky top-0 z-20`（内容滚动时 Tab 条悬浮）+ `walnut-raised` 底 + 1px `walnut-border` 边；active 项黄铜亮底 `--brass-bright` + 深墨字 `--felt-deep`，未选态 `ivory-muted`
  - Tab 项 = Lucide 图标（20px）+ 短词标签（理论=BookOpen / 示例=PlayCircle / 实战=Flame）；<640px 隐藏文字仅图标（文字 `hidden sm:inline`）
  - 底部推进 CTA：黄铜主按钮，动词式「进入{下一段完整词}」（如"进入示例演示"）；末段为「完成学习」；返回用胡桃次级按钮 + ArrowLeft

### 5.7 导航
**导航权威唯一原则（v1.2）**：桌面端只允许一个主导航（侧边栏），不得出现顶部 Tab/底栏/抽屉等冗余导航层。移动端 <768px 侧边栏隐藏→底部 mobile-nav 接管。
- **侧边栏 `.sidebar`**：240px 宽，胡桃渐变，右侧 1px 黄铜渐变分隔线；分组（训练/研习/数据/设置）由 `.nav-section-label`（9px uppercase tracking 0.2em，ivory-muted）分隔
- **侧边栏项 `.nav-item`**：
  - 默认 `--poker-ivory-muted` 无背景
  - Hover `--poker-ivory-dim` + `rgba(255,255,255,0.025)` 底
  - Active `--poker-brass-bright` 文字 + 左侧 8% 黄铜渐变底 + 右侧黄铜庄码 D（22px 圆）
- **顶栏**：h-16（64px），底部 1px 胡桃边框；左侧 H1 显示当前页名（动态跟随侧边栏激活项），右侧 streak 徽章+通知+设置图标+语言切换；顶栏图标仅作快捷入口，不是主导航
- **桌沿铜钉 `.table-rail`**（v1.1 新增，v1.2 位置调整）：
  - 顶部 header 正下方，全宽，高度 14px
  - 中心胡桃分隔线 + 一颗 8px 黄铜铆钉（radial 渐变+glow）
  - 跨所有页面的视觉签名锚点
- **移动端底栏 `.mobile-nav`**：fixed bottom，胡桃色，<768px 显示，触摸目标 ≥44px
- **导航冗余禁令（v1.2）**：禁止在桌面端同时出现侧边栏与顶部 Tab、侧边栏与底栏、顶部 Tab 与底栏等多层重复导航

### 5.8 黄铜雕刻铭文 `.motto-engraved`（v1.1）
- 用于欢迎标题下格言（如"知其道者·不惑于局"）
- 结构：两侧 `.motto-line`（黄铜发线 32–48px）夹 `.motto-text`
- 文字：Fraunces 11px（英文 italic，中文正体），`--poker-brass` 80%，letter-spacing 0.15em
- 居中，margin-top 10px
- **禁用**：中文 `font-style: italic`

### 5.9 黄铜横幅 `.path-banner` / `.quick-drill-card`（v1.1 升级）
- 背景：深黄铜渐变 `#d4b068→#c9a25e→#b48f44`
- 边框 1px `#8a6b30`，圆角 8px
- 投影：`0 4px 18px rgba(0,0,0,0.3)` + inset 顶高光 + inset 底暗影
- `::before`：顶部 4px 处一道 22% 白高光细线（金属打磨边）
- `::after`：`repeating-linear-gradient` 4px 周期微妙竖纹（金属拉丝）
- 内部 pill：默认 `rgba(26,19,8,0.08)` 底+`rgba(26,19,8,0.12)` 边；active `#1a1308` 底+`#e8c97e` 字
- 完成戳记：深胡桃半透明底+黄铜字+细边（钢印），非绿色对勾

### 5.10 表单控件
- 滑块：track `--poker-walnut-border`，thumb 黄铜渐变 16px 圆+glow
- 输入框：胡桃底，1px 黄铜/胡桃边（focus 变亮），圆角 8px
- 开关/checkbox：未选胡桃色，选中黄铜色+辉光

### 5.11 进度与数据可视化
- 进度条：track `#2d2214` 圆角 2px，fill 黄铜渐变+glow
- 图表：网格线 `rgba(201,162,94,0.08)`；轴文字 `--poker-ivory-muted` 10–11px；主线 `#e8c97e` 2px tension 0.4；填充 0→30% brass opacity
- 范围表格 13×13 gap 1px：选中=黄铜三档色阶（对子亮/同花中/杂色暗）；未选=深红棕半透+弱边框

### 5.12 徽章与状态
- **连击徽章 `.streak-badge`**：黄铜渐变底+火图标，60px pill
- **位置徽章 `.position-badge`**：圆/椭圆，brass 边框，brass 8% 底，大写 serif
- **冻结卡 `.freeze-chip`**（v1.1 修订）：霜钢蓝渐变 `#b8d0d9→#8ba5b0`，内描白边 `rgba(255,255,255,0.3)`，雪花图标+JetBrains 数字，无 glow
- **段位 `.rank-badge`**（v1.1）：三档环色：松绿=已掌握/黄铜=学习中/胡桃=未解锁；用于知识图谱、课程节点、导师头像

### 5.13 导师人格（v1.1 低饱和）
| 风格 | 头像底色 | 徽章色 | 气质 |
|---|---|---|---|
| `strict-math` 严谨数学 | `#4a5a7a` 石板靛（低饱和） | 同色环 | 冷静理性 |
| `old-school` 老牌黑手 | `#9a6b4a` 陶土赭（低饱和） | 同色环 | 老派锐利 |
| `encouraging` 鼓励伙伴 | `#6a9a7a` 苔藓松绿（低饱和） | 同色环 | 温和支持 |

饱和度 25–35%；active 导师加黄铜外环 2px + brass-glow。

### 5.14 情绪按钮 `.mood-btn`（v1.1）
- 默认：`--poker-ivory-muted` 图标 + 透明底
- Hover：`rgba(255,255,255,0.04)` 底
- Active：好=苔藓绿 / 一般=黄铜 / 差=陶土红；2px 对应色环+对应色图标+8% 透底，不再默认彩色

### 5.15 微型桌 `.mini-felt`
- 椭圆绿呢 50%/40%（比 hero 更圆），用于 GTO、复盘等子场景
- 座位 6–9 个围绕椭圆绝对定位

### 5.16 场景卡 `.scenario-card`（v1.2）
- 用于训练题面板内的"当前手牌场景"，模拟绿呢微观视角
- 背景：`radial-gradient(ellipse at top left, rgba(48,98,66,0.18), transparent 60%)` + 深绿渐变
- 边框：`1px solid rgba(201,162,94,0.22)`，圆角 10px，padding 16px 18px
- `::before`：3px inset 虚线黄铜边（发牌员虚线圈）
- 内阴影：inset 顶高光 `rgba(255,240,200,0.06)` + 外阴影 `0 2px 12px rgba(0,0,0,0.2)`
- 组成：位置徽章（BTN/SB/BB）+ 2 张手牌 + 底池/手牌/对手说明（font-numeric）
- 复用（v1.4.0）：PracticeDrill 场景面板已复用本类（`scenario-card p-5 md:p-6` 覆盖 padding 保持内部宽松；压力模式可覆盖边框为 `var(--danger)`/30）

### 5.17 推荐项 `.rec-item`（v1.2）
- 今日训练计划列表的单条项
- 结构：3px 左侧色条（优先级色：弱项=黄铜/SRS=鼠尾草绿/课程=苔藓绿）+ 图标圆 + 文本（标题+标签+时长）+ 右侧箭头按钮
- 背景：`rgba(30,22,12,0.5)`，边框 `1px solid rgba(201,162,94,0.08)`，圆角 8px，padding 10px 12px
- Hover：背景加深 + `translateX(2px)` + 边框亮度提升
- 标签 pill：9px uppercase，对应色 12% 透底
- 箭头 `.rec-go`：24×24px 方，hover 变黄铜底+深色图标

### 5.18 模块入口卡 `.module-card`（v1.2）
- 训练场 6 模块入口网格（2 列/3 列响应式）
- 结构：40×40 图标方块（径向渐变底+主题色图标+黄铜细边）+ 文本（标题+说明）+ 右侧箭头
- 背景：胡桃渐变 `rgba(38,28,16,0.8)→rgba(28,20,12,0.9)`，边框 `1px solid rgba(201,162,94,0.12)`，圆角 10px，padding 14px 16px
- `::before`：左上 0% 0% 黄铜径向高光，默认 opacity 0，hover 渐显
- Hover：边框亮化为 0.3 黄铜 + `translateY(-2px)` + 外阴影 `0 8px 24px rgba(0,0,0,0.4)` + 箭头变黄铜色
- 主题色规则：范围训练=黄铜/赔率=鼠尾草绿/GTO=霜钢蓝/学院=苔藓绿/谜题=黄铜/复盘=皮革赭 `#c08a5a`

### 5.19 周打卡条 `.streak-rail`（v1.2 新增，v1.3 位置调整）
- 仪表盘 arena 下方的黄铜-苔藓双色渐变横条（v1.3 从页面底部上移至 hero 区下方），整合 7 日打卡+冻结卡+今日正确率
- 位置：`.felt-arena-wrap` 结束后、`.quick-drill-card` 之前，与 arena 下缘重叠 8–14px（margin-top -14px 骑椭圆下缘），形成 arena→streak-rail→quick-drill 的紧凑首屏序列
- 背景：`linear-gradient(90deg, brass-6%, walnut, walnut, moss-5%)`，边框 1px brass-12%，圆角 10px，padding 12px 18px
- 结构：左段（火焰+连续天数数字）+ 中段（7 个 `.streak-dot` 紧凑圆点，flex:1 自适应填充）+ 冻结卡项 + 黄铜分隔线 + 今日正确率（苔藓绿大数字）
- `.streak-rail-dots .streak-dot` 比独立使用小一圈（桌面 padding 4px 3px，em 字号 7px；手机 padding 3px 2px，em 字号 6px）
- 手机端规则：隐藏文字标签（"连续天数/冻结卡/今日正确率"）只保留图标+数字，`flex-wrap:nowrap`+`overflow:visible` 保证不横向滚动
- 桌面端与 arena 间距 6px，与下方 quick-drill 间距 12px

### 5.20 Live 呼吸点 `.live-dot`（v1.2）
- 8px 黄铜圆点，用于 SRS/实时待办面板右上角
- 动画：`live-pulse` 1.8s ease-out 无限（box-shadow 0→8px brass 透明扩散）
- 与 `.panel-live` 顶部黄铜发线配合使用，标示"进行中/待办"状态

### 5.21 交互状态矩阵（v1.3.2）

全局交互状态的统一规范（实现权威：`src/styles/globals.css`）：

| 状态 | 规范 | 实现 |
|---|---|---|
| focus-visible | 黄铜 2px outline + 2px offset，禁止浏览器默认蓝 | `*:focus-visible { outline: 2px solid var(--brass) }` |
| hover（中性元素） | 底色 `rgba(255,255,255,0.03–0.04)` 或边框亮化为黄铜 30% | `.pill:hover` / `.nav-item` hover |
| hover（语义色元素） | 底色透明度 12%→18–20%，文字色不变（§2.2） | quiz 选项 / 自评按钮 |
| active/选中 | 黄铜渐变底 + 深色文字（`.pill.active`）或黄铜边框 + glow | `.mentor-card.active` |
| disabled | `opacity 40–60%` + `cursor-not-allowed`，锁定类附锁图标 | 位置解锁按钮 / 答题后选项 |
| loading | 骨架用 `--walnut-raised` 底 + 呼吸动画；等待用 `.card-wait` / `.live-dot` | LoadingState 组件 |
| **五级反馈** | 唯一样式事实源为 `.grade-best`~`.grade-blunder`（苔藓绿/黄铜/陶土红低透底+左侧色条）；`GRADE_DISPLAY_CONFIG` 引用这些类，禁止霓虹类 | `shared/types/decisionFeedback.ts` |

**守卫机制（v1.3.2）**：`src/designTokenGuard.test.ts` 在 `pnpm test` 中强制断言 src 内零 Tailwind 霓虹调色板类、零纯黑白类与 hex 字面量；豁免白名单只删不加，新增豁免须先在本文档登记设计依据。

### 5.22 教学内容块 `.content-block`（v1.4.0）

用于课程理论讲解（LessonContent 理论 Tab）的内容块视觉词汇，九种类型共享统一骨架：
- **统一骨架**：`rounded-lg p-4` + 20px 图标（语义色，`shrink-0 mt-0.5`）+ 标签 `text-xs font-semibold`（部分类型无标签）+ 正文 `text-sm text-[var(--ivory-dim)] leading-relaxed whitespace-pre-line`
- **实现位置**：`src/features/strategy-academy/components/content/`（模块内私有，跨模块复用时升级 `shared/components/`）

类型规范（token 均来自 §2，语义色短名 `--warning`/`--info`/`--success`/`--brass` 为 globals.css 别名）：

| 类型 | 底色 | 边框 | 图标（Lucide） | 标签色 |
|---|---|---|---|---|
| `highlight` | `var(--warning)`/10 | `var(--warning)`/30 | AlertTriangle（warning） | 无标签 |
| `key-point` | `var(--poker-success-bg)` | `var(--poker-success)`/30 | KeyRound（success） | success「关键要点」 |
| `pro-tip` | `var(--brass)`/5 | `var(--brass)`/40 | Lightbulb（brass-bright） | brass-bright「职业牌手说」uppercase |
| `formula` | `var(--felt-deep)` | `var(--brass-deep)`/40 | Sigma（brass-bright） | brass-bright「公式推导」 |
| `theory-reference` | `var(--info)`/10 | `var(--info)`/30 | ExternalLink（info） | info「理论支撑」 |
| `counter-intuitive` | `var(--poker-terra)`/15 | `var(--poker-terra)`/40 | Lightbulb（terra-bright） | terra-bright「反直觉点」 |
| `example` | `var(--felt-deep)` | `var(--walnut-border)` | 无（文本块） | 无标签 |
| `diagram` | `var(--felt-deep)` | `var(--walnut-border)` | Table2（brass-bright） | 无 |
| `hand-example` | 同 example 块 | 同 example 块 | Hand（brass-bright） | 无 |

规则细节：
- **theory-reference 跳转规则**：`data.lessonId` 存在（string 非空）时标签为可点击链接（info 色虚线 underline + 小号 ExternalLink）：`data.target==='theory'` → `/theory/chapter/{lessonId}`；其他/缺失 → `/academy/lesson/{lessonId}`
- **diagram 表格规则**：`data.headers`（string[]）+ `data.rows`（数组的数组）双守卫均非空 → 渲染简化表格（表头 ivory-muted、单元格 ivory-dim、行分隔 `walnut-border` 60%，容器 `overflow-x-auto`）；否则渲染 content 文本 + 可选 caption（ivory-muted 小字）
- **formula / example 等宽规则**：行级 `AsciiMonoText` — 仅含 ASCII 字母/数字的行使用 font-mono，中文行保持无衬线（避免中文等宽无意义）
- **hand-example 内容优先级**：content → `data.scenario`（string 非空）→ 占位「（手牌示例数据待补充）」

---

## 6. 布局系统

### 6.1 桌面（≥1024px）
```
┌─────────┬──────────────────────────────────────────┐
│         │  Header (h-16: 页名 + streak + 图标)     │
│ Sidebar ├──────────────────────────────────────────┤
│  240px  │  Table Rail（桌沿铜钉，跨页签名锚点）      │
│ 胡桃木   ├──────────────────────────────────────────┤
│ sticky  │  Oval Felt Arena (hero 全宽椭圆)          │
│         ├──────────────────────────────────────────┤
│         │  Streak Rail（周打卡条，骑 arena 下缘）    │
│         ├──────────────────────────────────────────┤
│         │  Quick-drill Brass Banner（主 CTA）       │
│         ├──────────────────────────────────────────┤
│         │  Row 1: Live Practice (2fr : 1fr)        │
│         │  ┌─────────────────┬────────────────┐    │
│         │  │  今日训练题      │  SRS 间隔复习   │    │
│         │  └─────────────────┴────────────────┘    │
│         ├──────────────────────────────────────────┤
│         │  Row 2: Data & Plan (2fr : 1fr)         │
│         │  ┌─────────────────┬────────────────┐    │
│         │  │  正确率趋势      │  今日推荐       │    │
│         │  └─────────────────┴────────────────┘    │
│         ├──────────────────────────────────────────┤
│         │  Training Grounds (6 模块卡 3×2 网格)    │
└─────────┴──────────────────────────────────────────┘
```

### 6.2 平板（768–1023px）
侧边栏保留，grid 降为 1fr，侧栏堆叠主面板下；Table Rail 保留；训练场网格 2 列；streak-rail 与 arena 间距维持 12px。

### 6.3 移动（<768px）
- 侧边栏隐藏→底部 mobile-nav（fixed bottom，≥44px 触摸目标）
- Table Rail 保留（视觉锚点不可删），高度可缩至 10px
- Header 高度 h-16→50px
- **椭圆牌桌 arena**：border-radius 改为 `50%/28%`，min-height 100px（480px 下 88px），padding `4px 16px 10px`，margin-top -18px 让椭圆骑在 tab 栏下
- arena 内部采用紧凑三分区：上部（eyebrow+h2+motto）/ 中部水平一行（左 plaque-卡牌堆+A♠+筹码-右 plaque）/ 下部小字；padding-top 0
- arena 内 ELO 徽章和 daily-progress-chip 隐藏（避免遮挡标题）；两个 plaque 对称在 `top:38%` 左右各 3%，尺寸缩小（min-width 60px，value 14px）；A♠ 今日挑战卡保留显示（26×38px）
- **streak-rail 周打卡条上移**：从页面底部移至 arena 下方（margin-top -14px 骑在椭圆下缘），形成 arena→streak-rail→quick-drill 的紧凑首屏序列，首屏即可见本周打卡记录
- streak-rail 在手机端 padding 8px 10px、gap 6px；隐藏"连续天数/冻结卡/今日正确率"文字标签，只保留图标+数字；streak-dot 缩小（padding 3px 2px，span 8px，em 6px），整个条 scrollWidth=clientWidth 无横向滚动
- **训练场模块网格 2 列**（非 1 列）：`.grid.grid-cols-2.md\:grid-cols-3` 必须 `grid-template-columns:repeat(2,minmax(0,1fr)) !important`，覆盖 `.md\:grid-cols-3 { grid-template-columns:1fr !important }` 的特异性
- **取消等高拉伸**：手机端 `grid-auto-rows:auto`、`.panel.h-full { height:auto }`、`.panel .mt-auto { margin-top:12px }`，避免单列下面板被强行拉长产生空白
- 其他面板 padding 12px（vs 桌面 20px）；module-card padding 10px 12px、icon 28px；quick-drill padding 10px 14px、gap 6px、按钮 min-height 32px；scenario-card padding 10px 12px；rec-item padding 8px 10px、gap 6px
- 图表 canvas max-height 180px；action-btn-row 改 2×2 grid（gap 6px）；按钮 min-height 44px（触摸目标）
- gap/mb 压缩：gap-5→12px、gap-4→10px、gap-3→8px
- 所有 grid 规则在手机端必须用 `!important` 覆盖 Tailwind md:/lg: 断点类带 `!important` 的基础规则（见 §10.5 特异性规则）

### 6.4 Z 轴
| z-index | 元素 |
|---|---|
| 0 | 页面背景、暗角伪元素 |
| 1 | body::before/after 灯晕 |
| 2 | `#app-shell` |
| 3 | `.table-rail`（桌沿） |
| 5 | 铭牌、卡片（在 felt 上） |
| 10 | 顶栏、侧栏用户区 |
| 20 | 侧边栏 |
| 50 | 移动端底栏、Toast |
| 100 | 弹窗、Modal、下拉菜单 |

### 6.5 内容宽度分级（v1.6.0 新增）

全局限宽由 AppLayout 主内容盒统一承担，按**视图用途**分三档，兼顾「超宽屏不出现大段 felt 空洞」与「正文不被过度拉长」两个教育目标：

| 档位 | 容器 | 适用视图 | 设计意图（教育向） |
|---|---|---|---|
| **L1 默认收敛 1400px** | `mx-auto w-full max-w-[1400px]` | 操作台/统计/独立交互页面（仪表盘、训练模块、设置、复盘等） | 扫读与操作的舒适带宽，随 main 居中收敛 |
| **L2 概览展宽 1680px** | `mx-auto w-full max-w-[1680px]` | 策略学院**概览/课程地图**类视图（`/academy`、`/academy/tracks`、`/academy/concept-graph`） | 课程阶梯/学习轨道/知识图谱需横向展开以降低纵向滚动手数；展宽消除宽屏 felt 留白，内部须用自适应多栏承接 |
| **L3 阅读/作答收敛** | 模块内部 `max-w-prose`（65ch）或 `max-w-3xl` | 课程正文（CourseView）、快速训练、认证考试、基础入门等连续阅读/专注作答 | 保持可读行长，避免单行过长降低阅读效率 |

**切换规则**
- 宽度档位统一由 AppLayout 依据路由判定（单一集中点），禁止各模块自造全宽容器或负 `margin` hack 突破限宽。
- 所有 L2 展宽视图内部必须**自适应分栏**承接多出的横向空间，不得让单个内容块或被 `1fr` 侧栏强制拉伸到超宽（反例：宽屏下 `lg:grid-cols-3` 的 `1fr` 侧栏被拉成 450px 空洞）。
- 断点统一复用 §10.3：`xl(1280)` 展宽分栏、`lg(1024)` 平板回落、`md(768)` 移动、`480px` 小屏。
- 规则作者：ui-ux-dev 复核；宽度档位归属 AppLayout（platform-dev 协调），分栏归属各模块子代理。

---

## 7. 图标与插画

- **图标库**：Lucide Icons（1.5px stroke，线性）
- **默认尺寸**：16×16（列表）/ 20×20（面板标题）/ 24×24（顶栏）
- **默认颜色**：`--poker-ivory-muted` → hover `--poker-ivory-dim` → active `--poker-brass`
- **彩色图标例外**：语义状态图标跟随语义色；三导师头像按 §5.13 低饱和；知识图谱节点按 §5.12 三色环
- **品牌 Logo**：♠（Lucide `spade`）32px 黄铜色+品牌名

---

## 8. 动效

> **单一事实源（v1.5.0）**：动效 token 与组件状态矩阵的唯一实现权威为 `src/shared/utils/motion.ts`（React / framer-motion）与 `src/styles/globals.css`（CSS keyframes / CSS 变量）。本文档为设计定义权威，二者任一变更须同步其余两处；新增动效禁止绕过共享规范自造参数。

### 8.1 动效原则

**设计取向**：动效是"发牌员递牌"的触觉延伸——帮助用户理解**状态发生了什么变化**（入场/反馈/等待），而非装饰。遵循"克制奢华"：绝大多数时间静止，动效只出现在状态切换的瞬间。

#### 8.1.1 缓动（Easing）

| Token | 值 | 用途 |
|---|---|---|
| `--poker-ease-standard` | `cubic-bezier(0.4,0,0.2,1)` | 默认入场/状态过渡（最常见的缓动） |
| `--poker-ease-out` | `cubic-bezier(0,0,0.2,1)` | 元素出现（快起慢停，结果数字上跳） |
| `--poker-ease-in` | `cubic-bezier(0.4,0,1,1)` | 元素退场/移除（慢入快出） |
| `--poker-ease-spring` | `cubic-bezier(0.34,1.56,0.64,1)` | 弹性回弹（筹码落/卡牌翻/徽章 pop） |

> 对应实现：`motion.ts` 导出 `MOTION_EASE`，CSS 变量见 globals.css `--poker-ease-*`。

#### 8.1.2 时长（Duration）

| Token | 值 | 用途 |
|---|---|---|
| `--poker-duration-fast` | 150–200ms | hover、press、选中态、tab 滑动 |
| `--poker-duration-standard` | 250–350ms | 面板展开、路由切换、反馈浮层 |
| `--poker-duration-slow` | 400–600ms | 大场景（牌桌入场/发牌/结果页数字） |
| `--poker-duration-loop` | 1.5–3s | 循环呼吸/等待（live-dot、卡背、面板光） |

> 对应实现：`motion.ts` 导出 `MOTION_DURATION`。

**时长层级规则**：同一动作的进入/退出时长必须对称或遵循"进快出慢"（`standard` 进 / `in` 退），禁止进出都抢速。

#### 8.1.3 触发方式（Triggers）

| 触发 | 时机 | 典型动效 |
|---|---|---|
| `hover` | 指针悬停 | 背景/边框过渡 + 位移或缩放（150–200ms） |
| `press` | 按下 | `scale(0.96)` 微缩，松手回弹（100–150ms） |
| `focus` | 键盘聚焦 | 黄铜 outline（§5.21），不带动效 |
| `state-change` | 状态翻转 | 颜色/边框/辉光过渡（150–250ms） |
| `mount` | 挂载/入场 | 淡入 + 位移/缩放（250–350ms） |
| `unmount` | 卸载/退场 | 淡出 + 位移（150–200ms） |
| `loop` | 持续状态 | 呼吸/脉冲无限循环（1.5–3s） |

**规则**：
- hover 触发不得使用位移导致布局抖动（用 `transform`，不用 `top/left`）
- 入场/退场必须成对出现（framer-motion `AnimatePresence` 或等价），禁止只进不出
- 循环动效必须尊重 `prefers-reduced-motion`（globals.css 已全局兜底）

### 8.2 常用动画类型定义

统一实现：`src/shared/utils/motion.ts` 导出预置 variants 常量（`FADE_IN` / `SLIDE_UP` / `SLIDE_DOWN` / `SLIDE_LEFT` / `SLIDE_RIGHT` / `SCALE_IN` / `ROTATE_*` / `POP` / `SHAKE`），组件直接引用，禁止内联 `initial/animate` 字面量。CSS 侧对应 keyframes 类（`animate-*`，见 globals.css）。

| 类型 | 关键属性 | 时长 | 缓动 | 用途 |
|---|---|---|---|---|
| **淡入淡出** fade | `opacity 0→1 / 1→0` | 150–300ms | standard/in | 浮层、反馈、状态徽章 |
| **上滑** slide-up | `translateY(12–24px) → 0` + fade | 250–350ms | standard | 面板/卡片入场（最常见） |
| **下滑** slide-down | `translateY(-16px) → 0` + fade | 250–350ms | standard | 顶部提示、下拉内容 |
| **左滑** slide-left | `translateX(16–24px) → 0` + fade | 250–300ms | standard | 题目切换、列表推进 |
| **右滑** slide-right | `translateX(-16px) → 0` + fade | 250–300ms | standard | 返回上一步、列表回退 |
| **缩放** scale-in | `scale(0.9–0.96) → 1` + fade | 200–300ms | spring | 徽章、弹窗、庄码、反馈卡 |
| **旋转** rotate | `rotate(0→180°/±30°)` | 200–300ms | standard | 箭头/chevron 展开、冻结卡雪花 |
| **回弹** pop | `scale(0.8→1.15→1)` | 400–500ms | spring | 正确答案、成就解锁、连击 |
| **摇晃** shake | `translateX(-4px↔4px)` × 3 | 200–250ms | standard | 错误答案、危险操作 |

> **组合规则**：入场/退场动画默认叠加 `opacity` 淡入淡出（不透明度过渡可与 transform 并行，二者互不冲突）；位移与缩放可组合（如 slide-up + scale-in 同时作用），但**禁止**同时使用两个不同方向的位移。

### 8.3 组件状态动画行为矩阵

> 组件 → 状态 → 动效的权威映射。实现约定：交互动效统一 `MOTION_DURATION` + `MOTION_EASE`（`motion.ts`），循环/等待动效用 globals.css keyframes 类；组件新增动效须按此矩阵登记，禁止模块自造参数。

| 组件 | hover | press | active/选中 | 入场（mount） | 退场（unmount） | 反馈/循环 |
|---|---|---|---|---|---|---|
| **按钮 `.btn-*`** | 背景/辉光 200ms standard | scale 0.96 | 黄铜辉光加深 | — | — | 禁用 opacity 40% |
| **pill 筛选** | 边框亮化 150ms standard | scale 0.97 | 黄铜渐变 150ms | — | — | — |
| **卡片 `.theme-card`/`.module-card`/`.puzzle-card`** | `translateY(-2px)` + 阴影 250ms standard | scale 0.98 | 边框点亮 | slide-up 250–300ms stagger | fade 150ms | — |
| **扑克牌 `PokerCard`** | scale 1.05 | scale 0.97 | 黄铜辉光 drop-shadow | -20px + 5° 旋转落下 400ms spring | fade 200ms | 翻面 rotateY 300ms |
| **反馈条 `feedback-grade`** | — | — | — | scale-in + fade 200ms | fade 150ms | 正确：pop 400ms spring / 错误：shake 200ms |
| **FAQ 折叠** | 左边框提亮 200ms standard | — | chevron rotate 180° + 高度展开 200ms | slide-down 250ms | height→0 200ms | — |
| **路由过渡** | — | — | — | slide-left 300ms standard | slide-right 200ms | — |
| **结果页数字** | — | — | — | fade + slide-up 600ms ease-out（延迟 400ms） | — | — |
| **live-dot / 面板光** | — | — | — | — | — | 循环呼吸 1.8–3s |
| **streak-dot 今日** | — | — | 辉光脉冲 2s loop | — | — | — |
| **进度条 fill** | — | — | — | width 0→目标 400ms standard | — | — |
| **概念节点** | scale 1.08 | scale 0.95 | 辉光 + 边框点亮 | scale-in 200ms | — | — |

### 8.4 实现约定

- **React 组件**：全部经 framer-motion `motion.*` 实现，参数引用 `src/shared/utils/motion.ts` 的 `MOTION_DURATION` / `MOTION_EASE` 与预置 variants；`AnimatePresence` 负责退场
- **CSS keyframes**：循环/等待类（live-pulse、panel-glow、card-wait、streak glow）与通用 `animate-*` 类定义于 globals.css，动画参数用 `var(--poker-ease-*)` / `var(--poker-duration-*)`，不写裸数字
- **路由过渡**：`AppLayout` 使用统一的 page-transition variants（slide-left 入 / slide-right 出）
- **键盘/无障碍**：hover 动效不得是唯一信息通道（focus-visible 必须等价可见）；`prefers-reduced-motion` 全局降级
- **性能**：只用 `transform` / `opacity` 动画，避免 layout/paint 抖动；列表 stagger 步进 50–80ms，整页最大延迟 ≤600ms

---

## 9. 页面模式

当前 7 个可复用布局：

1. **仪表盘 Dashboard**（v1.2 重构，v1.3 移动端响应式优化）：5 段叙事结构 — ①Felt Arena 椭圆 Hero（欢迎语+雕刻格言+2 象牙铭牌左右对称+中心卡堆/A♠/筹码柱）→ ②Streak Rail 周打卡条（骑 arena 下缘，v1.3 从底部上移至 hero 下方）→ ③Quick-drill 黄铜 CTA 横幅 → ④Row 1 训练中（今日训练题+场景卡+5 色行动按钮+5 级反馈 / SRS 间隔复习+live 呼吸点）→ ⑤Row 2 数据+计划（正确率趋势 / 今日推荐 3 条带优先级色条）→ ⑥训练场 6 模块入口网格
   - **叙事原则**：3 秒内让用户"落座→看本周打卡→开局→训练"，主 CTA（开始训练/复习）始终黄铜高亮
   - **等高规则**：同行面板必须等高（`grid-auto-rows:1fr` + `h-full flex flex-col` + `mt-auto` 把反馈/底栏压到底）；手机端单列取消等高，面板按内容自适应高度
   - **移动端例外**：arena 缩小为三分区紧凑布局，ELO 徽章/daily-progress-chip 隐藏，训练场改为 2 列网格，streak-rail 文字标签隐藏
2. **范围训练 Range Trainer**：左侧控制面板（位置/动作/模式 pill）+ 13×13 范围网格（三档黄铜色阶）+ 右侧题目卡（卡牌+四色行动按钮）
3. **GTO 模拟**：场景条（公共牌+底池+手牌）+ 微型桌 + 右侧决策面板（Fold/Call/Raise/All-in + 最优决策卡）
4. **底池赔率**：左侧计算器（滑块+结果+EV）+ 右侧补牌表+二四法则
5. **牌局复盘**：左侧手牌列表 + 中央街 timeline + 微型桌 + 学习要点
6. **谜题训练**：三入口卡（Puzzle Rush/每日谜题/Theme Drill）+ 10 主题卡网格（顶边黄铜发线）+ 阶段 pill
7. **策略学院**：黄铜路径横幅 + 正在学习 + 推荐课程（左黄铜竖条分级）+ 知识图谱（三色环）+ 对手画像 + 每日 Drill。
   - **响应式布局（v1.6.0 · 自适应学习工作台）**：概览类视图（Home / Tracks / ConceptGraph）走 §6.5 **L2 概览展宽**档，内部用自适应分栏承接横向空间——
     - Home：`lg:grid-cols-[minmax(0,1fr)_340px]` — 主列=课程阶梯自适应扩充（chips `auto-fill` 自动换行填充新增宽度）；侧栏=Today Plan / Study Tools，固定 340px 带宽保叙事节奏，不再随 `1fr` 膨胀成巨宽空洞
     - Tracks：`xl:grid-cols-2` — 轨道卡在超宽时平铺两列，header 全宽居中
     - ConceptGraph：概念卡 `xl:grid-cols-4`（默认 3 列升至 4 列）
   - 阅读/作答视图（课程正文 / QuickDrill / 认证考试 / 基础入门）走 **L3 收敛**档，保持可读窄列，不随概览展宽

---

## 10. 扩展指南

### 10.1 新增页面时
1. 继承 `:root` 变量，不硬编码颜色
2. header 下方必须保留 `.table-rail`（桌沿铜钉）
3. 所有面板用 `.panel`，不新造容器
4. 进行中区域优先用 `.panel-live`（顶部发线）+ `.live-dot`
5. 牌/筹码/庄码必须复用现有组件
6. 场景区优先用 `.scenario-card`（绿呢微观）或 GTO 页场景条样式
7. 中文格言用 `.motto-engraved`，禁用 `em`/`i`/`font-style:italic`
8. 桌面端导航通过侧边栏注册（在 `.sidebar .nav-section` 加 `.nav-item[data-nav]`），不得新增顶部 Tab 或与侧边栏重复的导航层
9. 双列布局同行面板必须等高（参考 §9.1 仪表盘等高规则）
10. 页面标题由顶栏 H1 动态显示，内容区禁止重复放置 H2 大标题

### 10.2 新增组件时
- 前缀 `poker-` 或 BEM 变体（如 `.chip.chip-frost`）
- 颜色必须来自 §2 色板；新色先加 `:root` 再登记本文档
- 语义色必须从 §2.2 低饱和集合取，不引入高饱和霓虹
- 阴影来自 §4.2，不写新 rgba 黑阴影
- 圆角来自 `--poker-radius-*`（卡片默认 8px）
- 字号从 §3.3 选，不随意写 `font-size:17px`
- 装饰横线优先 `.hairline-brass`（黄铜发线），不用 `border-top:1px solid brass`

### 10.3 Token 预留

**主题扩展**：`[data-theme="vip"]` 覆盖变量；`--poker-clay/--poker-sage` 作扩展入口；`--poker-font-display/sans/mono` 可换字体。

**筹码面额**：`.chip-red #a83838` / `.chip-green #2d7a4a` / `.chip-black #1a1a1a`（非纯黑）/ `.chip-purple`（饱和度 <30%）/ `.chip-frost #a8c4cf`（冻结卡已用）。

**候选组件**：`.hand-history-card`（手牌历史，参考 plaque）/ `.avatar-frame`（对手头像黄铜环）/ `.chat-bubble`（绿呢/胡桃双色）/ `.tournament-banner`（缩小椭圆绿呢+奖池，质感参照 path-banner）/ `.medal`（黄铜/金/银/铜四档）/ `.coach-tip`（象牙底+深棕字+小三角）/ `.equity-bar`（brass vs terracotta 双色）/ `.stamp`（深胡桃半透+黄铜字+细边，替代绿色对勾）。

**动效扩展**：发牌贝塞尔飞行 / 筹码推底池残影 / 胜利金粉粒子 `<canvas>`。新增动效一律先按 §8 规范落地（token + variants 引用），扩展能力挂到现有 token 之上。

**响应式断点**：`@media (max-width:1280px)` 小桌面 / `1024px` 平板 / `768px` 移动 / `480px` 小屏。

### 10.5 CSS 特异性规则（v1.3）

在单文件 HTML 使用 Tailwind 断点类（`md:grid-cols-3`、`lg:grid-cols-2` 等）+ 自定义媒体查询覆盖时，Tailwind 生成的类选择器若已带 `!important`（或因加载顺序在后），自定义媒体查询内必须同步加 `!important` 才能生效。

- **规则**：在 `@media (max-width:767px)` 或 `@media (max-width:480px)` 内覆盖 Tailwind `md:`/`lg:` 断点类相关属性时，必须显式加 `!important`
- **典型场景**：
  - `.md\:grid-cols-3 { grid-template-columns:1fr !important }`（基础规则）需要被 `.grid.grid-cols-2.md\:grid-cols-3 { grid-template-columns:repeat(2,1fr) !important }`（手机二列）覆盖时，后者也必须带 `!important`
  - `.h-full` 等高类在手机端需覆盖为 `height:auto !important`
  - 元素隐藏如 `.elo-rank-badge { display:none !important }` 不能省略 `!important`，否则基础类的 `display:inline-flex` 会后加载覆盖
- **调试方法**：Playwright 执行 `getComputedStyle(el).propertyName` 验证最终值，不能仅看 CSS 源码顺序

### 10.6 反模式（v1.3 补充）
- ❌ 纯黑 `#000` 或纯白 `#fff`
- ❌ 蓝/紫做主 CTA（只有黄铜是主色）
- ❌ 彩色阴影（阴影永远黑/棕调）
- ❌ 系统默认 sans-serif（必须 Inter Tight）
- ❌ 大段中文 serif（Fraunces 只用于标题/数字/格言）
- ❌ 中文斜体（必须 `.motto-engraved`）
- ❌ 扁平纯色按钮（必须渐变，哪怕极微）
- ❌ 重要操作做纯文字链接（必须按钮/pill）
- ❌ 椭圆牌桌用图片（必须 CSS `border-radius`）
- ❌ 高饱和霓虹色（`#4ade80`/`#f87171`/`#60a5fa`/`#fbbf24`/`#22d3ee`/`#a78bfa`）
- ❌ 绿色对勾+绿底做"已完成"（用 .stamp 黄铜戳记或 .success-bg 苔藓绿低透底）
- ❌ 删除 `.table-rail`（跨页锚点必须保留）
- ❌ 同区域重复展示同一数据（如牌桌上 brass plaque 与 rank-badge 同时显示 ELO）
- ❌ 多层重复导航（桌面端侧边栏+顶部 Tab/底栏并存）
- ❌ 内容区 H2 与顶栏 H1 重复显示同一页名
- ❌ 双列布局不等高（同行面板必须底部对齐，用 flex-col + mt-auto 处理底部内容）
- ❌ 非牌桌/非绿呢页面出现大面积 felt 绿（绿色专属牌桌/场景卡，普通面板用胡桃底）
- ❌ 手机端保留桌面等高布局（`grid-auto-rows:1fr` + `h-full`）导致面板被强行拉长产生中部空白，必须改为 `height:auto`
- ❌ 手机端训练场模块网格降为 1 列（必须保持 2 列减少纵向滑动）
- ❌ 手机端 streak-rail 放在页面底部必须滑到底才能看到本周打卡（必须上移至 arena 下方首屏可见）
- ❌ 手机端横向滚动条（streak-rail/卡片区必须内容自适应不溢出）
- ❌ 媒体查询内覆盖 Tailwind 断点类却忘记加 `!important`（特异性不足导致规则不生效）

---

## 11. 实现约定

### 11.1 CSS 变量集中管理
Token 集中在 `<style id="theme-vars">` 的 `:root`，组件样式在 `<style id="custom-styles">`。改主题只需改变量。

### 11.2 Tailwind 集成
Tailwind v4 通过 `@theme inline` 映射 `--poker-*` 为 `bg-primary`/`text-foreground` 等语义类。新增 token 后更新 `@theme inline`。

### 11.3 字体加载
Google Fonts 一次加载 3 族（Fraunces 可变、Inter Tight、JetBrains Mono）。中文回退系统宋/黑。

### 11.4 图片与图标
- 优先 Lucide（`data-lucide` 自动渲染）
- 扑克牌、筹码、铭牌、桌沿全部 CSS 绘制
- 头像/成就徽章可用图片，圆角 50%，外套黄铜环

### 11.5 数据字体
所有数字（金额、百分比、BB、手数、时间、胜率）必须用 `.font-numeric`，启用 `font-variant-numeric: tabular-nums` 防止跳动。

---

## 12. 文件结构

```
poker-ui-demo/
├── poker-ui-demo.design       # Design Canvas 项目
├── DESIGN_LANGUAGE.md         # 本文档
└── pages/
    └── index.html             # 单页演示（含全部 CSS/JS）
        ├── <style id="theme-vars">       # §2 色板/字体/半径/阴影变量
        ├── <style type="text/tailwindcss"> # Tailwind 主题映射
        ├── <style id="custom-styles">    # §5 组件样式
        ├── <body>
        │   ├── <aside class="sidebar">   # 侧边栏（桌面唯一导航）
        │   ├── <main>
        │   │   ├── <header>              # 顶栏（页名+状态）
        │   │   ├── .table-rail           # 桌沿铜钉（跨页签名）
        │   │   └── .tab-panel × 7        # 七个页面
        │   └── .mobile-nav               # 移动端底栏（<768px）
        └── <script>                      # 侧边栏切换、Range、Chart.js、计时器
```

未来多页扩展时，将 `<style id="theme-vars">` 与 `<style id="custom-styles">` 抽离为 `poker-theme.css` / `poker-components.css`，所有页面共用。

### 12.1 React 应用落地形态（v1.3.2）

正式产品为 React 应用（`src/`），与本 demo 单页并行存在，样式采用双轨制：

- **Token 层**：`src/styles/globals.css` 的 `:root` 为色彩 token 唯一实现权威（附录 E 声明）；Tailwind v4 通过 `@theme inline` 将 token 映射为 shadcn 语义类
- **组件类轨**：§5 组件样式（`.panel` / `.table-rail` / `.grade-*` / `.streak-rail` 等）已抽取至 globals.css，React 组件直接引用类名
- **原子类轨**：布局与一次性样式用 Tailwind 任意值 token 类（如 `bg-[var(--poker-success-bg)]`、`text-[var(--brass-bright)]`），禁止绕开 token 写字面色值
- **签名元素组件化对应**：`.table-rail` → `shared/components/TableRail.tsx`；`.motto-engraved` → `shared/components/MottoEngraved.tsx`；牌背（§5.1）→ `shared/components/CardBack.tsx`（胡桃底+45°条纹+2px 黄铜边+内描金，SVG 描边直接引用 `var(--brass)`）
- **SVG 例外**：渐变 stop 无法引用 CSS 变量时允许字面值，但必须注释标注对应 token；独立 SVG 资产（`public/cards/back.svg`）同样以注释锚定 token

---

## 附录 A：Token 速查

```css
/* 文字 */
color: var(--poker-ivory);         /* 主文字 */
color: var(--poker-ivory-dim);     /* 次级 */
color: var(--poker-ivory-muted);   /* 说明/禁用 */
color: var(--poker-brass);         /* 黄铜链接/标签 */
color: var(--poker-brass-bright);  /* 高亮 */
color: var(--poker-success);       /* 苔藓绿 */
color: var(--poker-danger);        /* 陶土红 */
color: var(--poker-info);          /* 鼠尾草灰绿 */
color: var(--poker-freeze);        /* 霜钢蓝 */

/* 背景 */
background: var(--poker-felt-deep);     /* 页面底 */
background: var(--poker-walnut);        /* 侧栏/深面板 */
background: var(--poker-felt);          /* 卡片底 */
background: var(--poker-success-bg);    /* 苔藓绿 12% */
background: var(--poker-danger-bg);     /* 陶土红 12% */

/* 边框 */
border-color: var(--poker-walnut-border);
border-color: var(--poker-brass);

/* 黄铜发线 */
background: linear-gradient(90deg, transparent, rgba(201,162,94,0.5), transparent);

/* 渐变按钮 */
background: linear-gradient(180deg, #f0d48a 0%, #c9a25e 50%, #a07d3d 100%);
color: #1a1308;

/* 阴影 */
box-shadow: var(--poker-shadow);
box-shadow: var(--poker-shadow-brass);

/* 圆角 */
border-radius: var(--poker-radius-md); /* 8px */
```

## 附录 B：v1.2 变更摘要

- **导航权威统一**：移除桌面端顶部 Tab 栏（与侧边栏 7 项完全重复），侧边栏成为桌面唯一导航权威；移动端底栏保留 <768px；新增"导航冗余禁令"
- **仪表盘 5 段叙事重构**：落座（Arena）→ 开局（Quick-drill 黄铜尺）→ 训练中（今日题+SRS 双列）→ 数据+计划（趋势+今日推荐）→ 训练场（6 模块网格）+ 底部 streak-rail
- **Arena 精简**：3 铭牌→2 大铭牌+1 小黄铜筹码章，避免重复数据；中心卡堆+A♠+筹码柱+12 黄铜筹码保留
- **新组件**：`.scenario-card`（绿呢微观场景）、`.rec-item`（带优先级色条的推荐项）、`.module-card`（模块入口卡）、`.streak-rail`（底部打卡条）、`.live-dot`（呼吸点）、`.streak-dot`（紧凑打卡圆点）
- **模块主题色体系**：6 大模块各赋主题色（黄铜/鼠尾草/霜钢/苔藓/黄铜/皮革赭），图标方块径向渐变
- **等高布局规则**：`grid-auto-rows:1fr` + `h-full flex flex-col` + `mt-auto` 保证双列底部对齐
- **内容区去重**：移除 5 个内容面板中与顶栏 H1 重复的 H2 大标题
- **反模式扩充**：新增多层导航禁令、标题重复禁令、双列不等高禁令、绿色滥用禁令

## 附录 C：v1.1 变更摘要

- **色彩**：语义色全面低饱和化（霓虹绿/红/蓝/黄 → 苔藓绿/陶土红/鼠尾草灰绿/黄铜同色）；新增霜钢蓝 `--poker-freeze`
- **组件质感**：`.path-banner`/`.quick-drill-card` 升级为雕刻黄铜板（深投影+顶高光+拉丝纹理）；`.theme-card` 加顶边黄铜发线；`.freeze-chip` 改为霜钢冷色
- **按钮色阶**：`.act-fold` 陶土红 / `.act-call` 深胡桃（去蓝）/ `.act-raise` 黄铜 / `.act-allin` 深胡桃金属
- **新签名元素**：`.table-rail`（桌沿铜钉）跨 Tab 锚点；`.motto-engraved`（黄铜雕刻铭文）替代中文斜体
- **状态系统**：导师头像低饱和（石板靛/陶土赭/苔藓松绿）；情绪按钮默认象牙灰仅 active 着色；"已完成"改用钢印戳记而非绿对勾
- **规范强化**：中文斜体禁令、反 SaaS 饱和色禁令、重复数据展示禁令、table-rail 保留规则
- **圆角统一**：卡片/面板统一 8px（原 10/8 混用）
- **页面新增**：策略学院、谜题训练补入 §9

## 附录 D：v1.3 变更摘要（移动端响应式重构）

- **Streak-rail 位置上移**：从仪表盘底部（训练场之后）整体上移至 arena 椭圆牌桌下方，用 `margin-top:-14px` 骑在椭圆下缘，首屏即可见本周打卡记录；桌面/平板同步
- **Arena 移动端三分区紧凑布局**：border-radius `50%/28%`，min-height 100px（480px 下 88px），padding `4px 16px 10px`；内部上（eyebrow+h2+motto）/中（左plaque-卡堆A♠筹码-右plaque 水平一行）/下（小字）
- **Arena 元素可见性调整**：手机端隐藏 ELO 徽章和 daily-progress-chip（避免遮挡标题）；恢复 A♠ 今日挑战卡和第二块 plaque 的显示（此前被误隐藏），两块 plaque 对称在 `top:38%` 左右各 3%
- **训练场模块网格强制 2 列**：`.grid.grid-cols-2.md\:grid-cols-3` 在手机端必须 `grid-template-columns:repeat(2,1fr) !important`，覆盖 `.md\:grid-cols-3 { 1fr !important }` 的特异性
- **取消手机端等高拉伸**：`grid-auto-rows:auto` + `.panel.h-full { height:auto }` + `.panel .mt-auto { margin-top:12px }`，避免单列下面板被强行等高拉长产生中部空白
- **全局纵向压缩**：panel padding 20→12px；gap-5→12px、gap-4→10px、gap-3→8px；module-card padding 10px 12px、icon 28px；quick-drill padding 10px 14px、gap 6px、按钮 min-height 32px；scenario-card padding 10px 12px；rec-item padding 8px 10px；图表 canvas max-height 180px
- **Streak-rail 手机端紧凑化**：padding 8px 10px、gap 6px；隐藏"连续天数/冻结卡/今日正确率"文字标签只保留图标+数字；streak-dot 缩小（padding 3px 2px，span 8px，em 6px）；`flex-wrap:nowrap` + `overflow:visible` 保证不横向滚动
- **Action 按钮手机端 2×2 grid**：fold/call/raise/all-in 四按钮改 `grid-template-columns:1fr 1fr`，gap 6px，min-height 44px
- **CSS 特异性规则沉淀**：新增 §10.5，明确在媒体查询内覆盖带 `!important` 的 Tailwind 断点类时必须同步加 `!important`，调试用 `getComputedStyle` 验证最终值
- **反模式扩充**：新增手机端等高空白、1 列模块网格、streak-rail 置底、横向滚动、媒体查询忘加 !important 五条禁令

---

## 附录 E：v1.3.1 变更摘要（色板权威源反向对齐）

- **背景**：UI 审查（S2）发现 DESIGN_LANGUAGE.md §2.1 主色板、§2.3 花色与 `src/styles/globals.css`、`poker-ui-demo/colors_and_type.css` 三份色值长期分歧。本次以 `globals.css` 实现值为权威，反向更新本规范文档，消除三份分歧。
- **主色板对齐**：§2.1 全部 HEX 改为 globals.css 实现值（felt-deep `#0e1a14`、felt `#15301f`、felt-raised `#1d4029`、felt-light `#245035`、walnut `#241a10`、walnut-raised `#3a2a18`、walnut-border `#4a3825`、walnut-light `#4d3a24`、ivory `#f3ebd9`、ivory-dim `#cabf9f`、ivory-muted `#8a8068`、brass-deep `#a07d3d`、brass-dark `#8a6b30`）；新增 `--poker-brass-muted #b09050`。
- **花色修订**：§2.3 ♣♠ 由深棕近黑 `#1a1308` 改为象牙白 `#f3ebd9`（暗底可见性优先，对比度 ≥7:1）；♥♦ 对齐实现值 `#d04545`。
- **三不原则引用更新**：§1.2 felt-deep/ivory 引用值同步更新。
- **新增 token 登记**：§2.4 补 `--poker-leather #c08a5a`（hand-history 模块主题色，§5.18）。
- **渐变/组件示例对齐**：§2.5 暗角 rgba 与胡桃面板渐变、§4.3 边框、§5.4 铭牌、§5.5 pill、§5.6 面板——所有硬编码示例色值同步对齐新色板。
- **权威源声明**：`src/styles/globals.css` :root 为色彩 token 唯一实现权威；本规范 §2 为设计定义权威；`poker-ui-demo/colors_and_type.css` 为 demo 单页 token，须与 globals.css 保持一致。三者任一变更须同步其余两处。

---

## 附录 F：v1.3.2 变更摘要（实现层合规修复）

- **背景**：Design QA 审查（2026-07-30）发现实现层 156 处 Tailwind 霓虹调色板类（21 文件）违反 §1.3，五级反馈事实源 `GRADE_DISPLAY_CONFIG` 使用 `bg-emerald-600`/`text-white` 等违规类。本次全量修复并建立防回流机制。
- **五级反馈牌室化**：`GRADE_DISPLAY_CONFIG.color` 改为引用 globals.css `.grade-best`~`.grade-blunder` 类（样式单一事实源）；`textColor` 改为 token 文字色；range-trainer / gto-simulator / puzzle-trainer 三消费方零改动生效。
- **霓虹色板清零**：strategy-academy / theory-academy / progress / range-trainer 全量替换为 `--poker-*` token 类；映射规则：green/emerald→success、red→danger、yellow/amber→brass/warning、orange→terra、blue→info、purple→indigo。
- **测验按钮色阶对齐 §5.5**：range-trainer QuizCard fold=陶土 12% 透底 / call=深胡桃半透 / raise=黄铜渐变（原为 clay/sage 实底）。
- **牌背胡桃化**：`CardBack.tsx` 与 `public/cards/back.svg` 由酒红菱格改为 §5.1 规定的胡桃底+45°黄铜条纹+2px 黄铜边+内描金；SVG 描边直接引用 `var(--brass)` 消除 `#c8a456` 漂移。
- **Token 登记**：新增 `--poker-bronze #cd7f32`、`--poker-indigo-bright #8ea4c4`、`--poker-terra-bright #c98a63`；`--poker-gold #d4a84b` 落地 globals.css（此前仅存在于文档与 demo 镜像）。
- **杂项修复**：成就墙四档徽章 token 化（金/铜/暖银/霜钢）；`var(--clay-bright)` 失效引用修复（2 处）；CardSVG 近黑描边改胡桃调；范围网格文案"绿色"→"金色"（对齐 §5.11 黄铜色阶实现）。
- **新章节**：§5.21 交互状态矩阵、§2.2 hover/active 变体规则与暗底文字亮阶、§12.1 React 落地形态。
- **守卫机制**：新增 `src/designTokenGuard.test.ts`（vitest 门禁），断言 src 零霓虹类/零纯黑白类与 hex；豁免白名单只删不加。

---

## 附录 G：v1.4.0 变更摘要（课程阅读排版与内容块词汇）

- **背景**：P2-01 排版可读性增强落地于 strategy-academy 模块（`LessonContent.tsx` 理论 Tab + `components/content/` 私有组件），本附录登记已实现规范。
- **阅读排版契约**：理论 Tab 内容区 `max-w-prose mx-auto`（65ch 阅读列宽）+ `space-y-4`（16px 段落距）；正文 `text-sm leading-[1.7] tracking-[0.01em]` ivory-dim；内容标题 font-display 20px + tracking-wide + `mt-6 first:mt-0`（首段无上距）。§3.3 新增 Lesson Reading / Lesson Heading 两行字号层级。
- **内容块视觉词汇**：新增 §5.22，统一骨架（rounded-lg p-4 + 20px 语义色图标 + text-xs font-semibold 标签 + text-sm ivory-dim 正文）+ 九种类型表（highlight / key-point / pro-tip / formula / theory-reference / counter-intuitive / example / diagram / hand-example），全部引用 §2 token（含 `--poker-terra`/`--poker-terra-bright`/`--poker-success-bg`），无霓虹。
- **Tab 图标化 + sticky**：课程内 Tab 栏 `sticky top-0 z-20` + Lucide 图标+短词（<640px 仅图标），推进 CTA「进入{下一段}」；登记于 §5.6。
- **场景卡复用**：PracticeDrill 场景面板复用 `.scenario-card`（`p-5 md:p-6` 覆盖 padding 保持宽松；压力模式 `border-[var(--danger)]/30`）；登记于 §5.16。
- **Emoji→Lucide 模块级约定**：课程内容区图标统一替换为 Lucide 线性图标（1.5px stroke，语义色跟随 §7），禁止以 Emoji 作为内容装饰图标。

---

## 附录 H：v1.5.0 变更摘要（动效规范全量化）

- **背景**：动效参数长期散落于各组件内联 framer-motion 字面量（duration 0.15–1.2s 混用、ease 混用 `easeOut`/`linear`/`spring`），无统一 token 出口，动效行为与设计文档 §8 存在漂移。本次将 §8 由「典型动效清单」升级为「全量规范」，并建立单一事实源。
- **动效原则（§8.1）**：新增缓动 token 表（standard / out / in / spring，对应 `--poker-ease-*`）、时长 token 表（fast / standard / slow / loop，对应 `--poker-duration-*`）、触发方式表（hover / press / focus / state-change / mount / unmount / loop）与使用规则（进场退场成对、循环动效尊重 reduced-motion、hover 用 transform 不抖布局）。
- **动画类型定义（§8.2）**：新增 9 类常用动画的规范定义（fade / slide-up / slide-down / slide-left / slide-right / scale-in / rotate / pop / shake），每类含关键属性、时长、缓动、用途；组合规则（位移+缩放可叠、双向位移禁止）。
- **组件状态矩阵（§8.3）**：12 类组件 × 状态（hover / press / active / mount / unmount / 反馈循环）的动画行为权威映射表。
- **实现约定（§8.4）**：React 侧统一 `src/shared/utils/motion.ts`（`MOTION_DURATION` / `MOTION_EASE` / 预置 variants）为单一事实源；CSS 侧 keyframes 与 `animate-*` 类用 token 变量；路由过渡统一 page-transition variants。
- **实现层落地**：`src/shared/utils/motion.ts` 新增（导出 `MOTION_DURATION` / `MOTION_EASE` / `PAGE_TRANSITION` 等预置 variants）；`globals.css` 新增 `--poker-ease-*` / `--poker-duration-*` 变量与 `animate-*` 工具类；核心组件（PokerCard / QuizCard / FaqAccordion / LevelLadder / LessonQuiz / TheoryQuiz / StatsOverview / AchievementBadges / SettingsPage / ResultSummary / AppLayout）统一引用共享动效规范。
- **守卫**：设计 token 守卫（designTokenGuard）不扫描动效参数；动效一致性靠共享规范单一事实源 + 组件引用收口，新组件动效须按 §8.3 矩阵登记。

---

## 附录 I：v1.6.0 变更摘要（内容宽度分级与策略学院自适应布局）

- **背景**：实测 1920×1080 全屏下，侧边栏 240px + 主内容盒 `max-w-[1400px]` 居中，导致 `main` 宽 1680px 而内容盒仅 1400px，**左右各留白 140px**；同时 Home 的 `lg:grid-cols-3` 让侧栏（Daily Plan / Study Tools）以 `1fr` 膨胀到约 450px 巨宽空洞。两者叠加使策略学院在宽屏上"两侧大片留白 + 侧栏过度拉宽"，与「3 秒落座、克制的场域感」背道而驰。
- **新增 §6.5 内容宽度分级**：统一由 AppLayout 依路由判定三档容器宽度——L1 默认收敛 1400（操作台/交互页）、L2 概览展宽 1680（策略学院概览视图）、L3 阅读作答收敛（模块内部 max-w-prose / max-w-3xl）。
- **策略学院响应式布局（§9 页面模式 7）**：概览视图走 L2 展宽，内部自适应分栏承接横向空间——Home 改 `lg:grid-cols-[minmax(0,1fr)_340px]`（主列阶梯自适应、侧栏固定 340px）；Tracks 改 `xl:grid-cols-2`；ConceptGraph 概念卡 `xl:grid-cols-4`；阅读/作答视图维持在 L3 收敛，不随概览展宽。
- **职责**：宽度档位归属 AppLayout（platform-dev），分栏归属各 feature 模块子代理（strategy-academy-dev），视觉一致性由 ui-ux-dev 复核。

---

## 13. 教育学习设计规范（v1.7.0）

> 本章为教育学习场景的视觉语言规范，与牌室品牌主题（§1-§12）无缝衔接。所有新增组件沿用 §2 色彩 token、§3 字体系统、§4 间距阴影圆角、§8 动效规范，不引入新的基础设计 token。

### 13.1 教育设计原则

五大原则指导教育场景的视觉设计决策：

| 原则 | 核心含义 | 视觉设计启示 |
|---|---|---|
| **学习目标可见性** | 首屏即可感知"今天学什么" | 今日推荐学习路径置顶，进度数据前移 |
| **进步可量化** | 正确率/ELO/段位应视觉化呈现 | 进度环、折线微图、里程碑标记作为一等视觉元素 |
| **反馈即教学** | 错误反馈不仅是"错了"，更要解释"为什么" | 决策分析区、对比视图、相关课程链接组成反馈闭环 |
| **渐进式披露** | 新手用户信息密度逐步释放 | 模块入口按训练次数逐步解锁，新手仪表盘收敛 |
| **扫读友好** | 课程内容排版支持快速扫读与深度阅读双模式 | 要点总结卡、公式展示块、节号前缀、阅读进度条 |

### 13.2 学习进度可视化

#### 13.2.1 `progress-ring` 进度环

进度环用 SVG `<circle>` 实现，以 `stroke-dasharray` 控制完成比例，用于概念节点/课程章节的完成度指示。

```
规格：
- 默认尺寸：40px × 40px（小节点）/ 56px × 56px（课程章节）
- 圆环 stroke-width：3px（小）/ 4px（大）
- 底色（未完成轨迹）：var(--poker-walnut-border)
- 底色透明度：0.3
- 背景圆：无填充，stroke 仅作底轨

三色状态：
- 未开始：stroke = var(--poker-walnut-border)，opacity 0.3
- 进行中：stroke = var(--poker-brass)
- 已完成：stroke = var(--poker-success)

实现参考：
<svg viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="17" fill="none"
          stroke="var(--poker-walnut-border)" stroke-width="3" opacity="0.3" />
  <circle cx="20" cy="20" r="17" fill="none"
          stroke="var(--poker-brass)" stroke-width="3"
          stroke-linecap="round"
          stroke-dasharray="106.8"
          stroke-dashoffset="26.7"
          transform="rotate(-90 20 20)" />
</svg>
```

#### 13.2.2 `sparkline` 微图

8px 高的迷你折线图，展示 7 日正确率趋势，用于 StreakRail 右侧。

```
规格：
- 尺寸：宽 56px × 高 8px（默认）/ 宽 72px × 高 8px（宽屏）
- 线条色：var(--poker-brass)
- 线条 stroke-width：1px
- 填充：var(--poker-brass) 的 8% 透明度渐变（线下方）
- 数据点：不显示圆点，仅连线
- 7 日数据点，x 轴均匀分布，y 轴为正确率 0-100%
- 无坐标轴、无网格线

实现：SVG <polyline> 或 <path>，points 根据 7 日正确率数组动态生成
```

#### 13.2.3 `milestone-marker` 里程碑标记

进度条上的小菱形标记点，标注"距离下一段位还需 X ELO"。

```
规格：
- 形状：菱形（正方形旋转 45°），6px × 6px
- 颜色：var(--poker-brass-bright)
- 位置：进度条上对应下一段位阈值的位置
- 标注文字：9px ivory-muted，位于标记点上方 4px
- 标注内容："距下一段位还需 {X} ELO"

CSS 参考：
.milestone-marker {
  width: 6px; height: 6px;
  background: var(--poker-brass-bright);
  transform: rotate(45deg);
  position: absolute;
  top: -3px;
}
```

#### 13.2.4 `daily-goal-card` 今日学习目标卡

象牙铭牌样式，显示今日学习目标与完成进度。

```
规格：
- 底色：var(--poker-walnut-raised)
- 边框：1px solid var(--poker-walnut-border)
- 顶边黄铜发线：linear-gradient(90deg, transparent, var(--poker-brass), transparent) 1px
- 圆角：var(--poker-radius-md)（8px）
- 内边距：16px 20px
- 铭牌顶部：eyebrow 标签"今日目标"（9px uppercase tracking 0.2em ivory-muted）

内容区域：
- 主文本："{已完成}/{总数} 项任务"（font-display 18px ivory）
- 副文本："今日已学习 {X} 分钟"（12px ivory-dim）
- 进度条：height 4px，底色 walnut-border，填充 brass，圆角 2px
- 进度条位于卡片底部，距上方内容 12px
```

### 13.3 课程内容排版增强

#### 13.3.1 `lesson-takeaway` 要点总结卡

用于章末要点回顾，视觉上突出但不过度抢眼。

```
规格：
- 底色：var(--poker-walnut-raised)
- 顶边：1px solid var(--poker-brass-deep)
- 左侧竖线：3px solid var(--poker-brass)，位于内容区左侧
- 内边距：16px 20px（含左侧竖线占位）
- 圆角：var(--poker-radius-md)（8px）
- 标题：「要点总结」（text-sm font-semibold ivory，带小图标）
- 列表项：text-sm ivory-dim，leading-[1.7]，每项前带 brass 小圆点（·）
- 适用场景：每个章末自动渲染，也可手动插入章节内

CSS 参考：
.lesson-takeaway {
  background: var(--poker-walnut-raised);
  border: 1px solid var(--poker-brass-deep);
  border-left: 3px solid var(--poker-brass);
  padding: 16px 20px;
  border-radius: var(--poker-radius-md);
}
```

#### 13.3.2 `formula-display` 公式展示块

用于 EV 计算、概率公式等数学内容展示。

```
规格：
- 底色：rgba(201, 162, 94, 0.06)（brass 6% 透明底）
- 边框：1px solid rgba(201, 162, 94, 0.2)（brass 20% 透明边）
- 字体：font-mono 14px
- 对齐：text-center
- 内边距：12px 16px
- 圆角：6px
- 公式变量：brass 高亮关键变量名（如 EV、P(win)），其余 ivory-dim
- 适用场景：正文中嵌入的数学公式，区别于代码块

CSS 参考：
.formula-display {
  background: rgba(201, 162, 94, 0.06);
  border: 1px solid rgba(201, 162, 94, 0.2);
  font-family: var(--font-mono);
  font-size: 14px;
  text-align: center;
  padding: 12px 16px;
  border-radius: 6px;
  color: var(--poker-ivory-dim);
}
```

#### 13.3.3 课程标题编号系统

采用 `§2.1 翻前开牌范围` 格式，eyebrow 样式标签作为节号前缀。

```
规格：
- 节号标签：9px uppercase tracking 0.2em，颜色 var(--poker-brass-muted)
- 节号标签与标题之间用空格分隔，无额外装饰
- 标题文字：font-display 20px ivory（继承 §3.3 Lesson Heading 规范）
- 编号层次：§{章}.{节}（如 §2.1、§3.4）
- 适用场景：所有课程内容标题自动生成编号

CSS 参考：
.section-number {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: var(--poker-brass-muted);
  display: block;
  margin-bottom: 4px;
}
```

#### 13.3.4 `reading-progress-bar` 阅读进度条

顶部固定细线，随滚动填充 brass 色，仅移动端（<768px）显示。

```
规格：
- 位置：fixed，top: 0（在 header 之上），z-50
- 高度：2px
- 宽度：0% → 100%（随滚动位置线性变化）
- 颜色：var(--poker-brass)
- 底色：transparent（未滚动部分不可见）
- 桌面端（≥768px）：display: none
- 实现：监听 scroll 事件，计算 `scrollTop / (scrollHeight - clientHeight)` 百分比

CSS 参考：
.reading-progress-bar {
  position: fixed;
  top: 0; left: 0;
  height: 2px;
  background: var(--poker-brass);
  z-index: 50;
  transition: width 100ms linear;
}
@media (min-width: 768px) {
  .reading-progress-bar { display: none; }
}
```

### 13.4 反馈教育脚手架

#### 13.4.1 决策分析区

在反馈卡片（§5.21 交互状态矩阵）中增加可折叠的"决策分析"区域。

```
规格：
- 触发：点击反馈卡片中的"查看分析"按钮（btn-ghost 样式 + ChevronDown 图标）
- 折叠态：显示评级标签（§5.12 五级反馈色）+ 简短评语
- 展开态：显示以下三个区域——
  1. GTO 推荐动作 vs 你的动作（comparison-view，见 §13.4.2）
  2. 差异原因（text-sm ivory-dim，1-2 句解释）
  3. 相关课程链接（related-lesson-chip，见 §13.4.4）
- 折叠/展开动画：300ms ease-out（max-height 过渡），复用 §8.2 scale-in 变体
- 适用场景：wrong / blunder 级别默认展开，其余级别默认折叠
```

#### 13.4.2 `comparison-view` 对比视图

左右分栏对比"你的决策 vs GTO 最优"，高亮差异点。

```
规格：
- 布局：flex row（≥480px）/ flex col（<480px）
- 左栏（你的决策）：
  - 标签："你的决策"（10px uppercase ivory-muted）
  - 动作文字：16px ivory-dim
  - 背景：var(--poker-danger-bg)（如果错误），否则 var(--poker-walnut-raised)
- 右栏（GTO 最优）：
  - 标签："GTO 最优"（10px uppercase ivory-muted）
  - 动作文字：16px var(--poker-brass)
  - 背景：var(--poker-brass-glow)（rgba(232,201,126,0.12)）
- 差异高亮：差异项（动作类型/下注尺寸）用 brass 色底部虚线边框标记
- 分隔线：中间 1px var(--poker-walnut-border)
- 内边距：12px 16px
- 圆角：6px
- 边框：1px solid var(--poker-walnut-border)
- 适用场景：仅 wrong / blunder 级别展示
```

#### 13.4.3 `try-again-btn` 再看一题按钮

btn-ghost 样式 + RefreshCw 图标，出现在 wrong/blunder 反馈卡片底部。

```
规格：
- 样式：btn-ghost（§5.5），透明底 + 1px walnut-border，hover 时 walnut-raised
- 图标：RefreshCw（Lucide），16px，位于文字左侧，间距 6px
- 文字："再做一题"（text-sm ivory-dim）
- 位置：反馈卡片底部，距上方内容 12px，右对齐
- 交互：点击触发同类型新题（不清除当前反馈），按钮短暂 scale 动画（150ms）
- 适用场景：wrong / blunder 反馈卡片底部
```

#### 13.4.4 `related-lesson-chip` 相关课程标签

Pill 样式标签，指向相关课程，带 ExternalLink 图标。

```
规格：
- 样式：pill（§5.5 pill 变体），底色 var(--poker-brass) 8% 透明度
- 边框：1px solid rgba(201, 162, 94, 0.15)
- 文字："{课程名称}"（11px ivory-dim）
- 图标：ExternalLink（Lucide），12px，brass-muted，位于文字右侧，间距 4px
- 最小宽度：fit-content
- 内边距：4px 10px
- 圆角：9999px（全圆角 pill）
- 交互：hover 时底色加深至 var(--poker-brass) 15% 透明度，cursor pointer
- 点击行为：跳转到对应课程页面（React Router navigate）
- 适用场景：反馈卡片底部的决策分析展开区，以及课程内容中跨章节引用

CSS 参考：
.related-lesson-chip {
  background: rgba(201, 162, 94, 0.08);
  border: 1px solid rgba(201, 162, 94, 0.15);
  color: var(--poker-ivory-dim);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}
.related-lesson-chip:hover {
  background: rgba(201, 162, 94, 0.15);
}
```

### 13.5 模块教育目的视觉区分

#### 13.5.1 模块图标方块微纹理

在现有 6 大模块图标方块（§5.18 `.module-card`）基础上，增加微纹理以体现教育目的差异。

```
纹理实现：CSS repeating-linear-gradient，不透明度 5-8%，叠加在图标方块上。

各模块纹理：
- 范围训练（range-trainer）：网格纹理
  background-image: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(201,162,94,0.06) 3px, rgba(201,162,94,0.06) 4px),
                    repeating-linear-gradient(90deg, transparent, transparent 3px, rgba(201,162,94,0.06) 3px, rgba(201,162,94,0.06) 4px);

- GTO 模拟器（gto-simulator）：节点连线纹理
  background-image: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(201,162,94,0.05) 4px, rgba(201,162,94,0.05) 5px),
                    repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(201,162,94,0.05) 4px, rgba(201,162,94,0.05) 5px);

- 赔率计算器（pot-odds）：百分号纹理
  background-image: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,162,94,0.05) 2px, rgba(201,162,94,0.05) 3px),
                    radial-gradient(circle, rgba(201,162,94,0.06) 1px, transparent 1px);
  background-size: 100% 6px, 8px 8px;

- 策略学院（strategy-academy）：书本纹理
  background-image: repeating-linear-gradient(90deg, transparent, transparent 6px, rgba(201,162,94,0.05) 6px, rgba(201,162,94,0.05) 7px);

- 谜题训练（puzzle-trainer）：拼图纹理
  background-image: repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(201,162,94,0.05) 5px, rgba(201,162,94,0.05) 6px),
                    repeating-linear-gradient(-45deg, transparent, transparent 5px, rgba(201,162,94,0.05) 5px, rgba(201,162,94,0.05) 6px),
                    repeating-linear-gradient(0deg, transparent, transparent 8px, rgba(201,162,94,0.04) 8px, rgba(201,162,94,0.04) 9px);

- 牌局复盘（hand-history）：放大镜纹理
  background-image: radial-gradient(circle at 30% 30%, rgba(201,162,94,0.07) 1px, transparent 1px),
                    radial-gradient(circle at 70% 70%, rgba(201,162,94,0.05) 1px, transparent 1px);
  background-size: 10px 10px, 10px 10px;

规则：
- 纹理叠加在图标方块底色之上，不覆盖图标本身
- 纹理不透明度始终 ≤ 8%，避免喧宾夺主
- 纹理在 hover 时微调不透明度（+2%），与卡片 hover 抬升（§5.18）联动
- 移动端（<768px）纹理不透明度降低至 4-6%，保持简洁
```

#### 13.5.2 `last-training-badge` 最近训练标记

模块卡右下角显示"X天前"或"今日已练"。

```
规格：
- 字体：9px ivory-muted
- 位置：模块卡右下角，距右/下边缘 8px
- 内容：
  - 今日已训练："今日已练"（颜色 var(--poker-success)）
  - 昨日训练："1天前"（颜色 ivory-muted）
  - 更早："{X}天前"（颜色 ivory-muted）
  - 从未训练：不显示
- 数据源：progress store 中各模块的 lastTrainingDate

CSS 参考：
.last-training-badge {
  font-size: 9px;
  color: var(--poker-ivory-muted);
  position: absolute;
  right: 8px;
  bottom: 8px;
}
.last-training-badge.today {
  color: var(--poker-success);
}
```

### 13.6 渐进式信息披露

#### 13.6.1 新手仪表盘收敛

当 `totalSessions < 5` 时，仪表盘隐藏训练场模块网格，仅展示"今日推荐学习路径"单一卡片。

```
规格：
- 触发条件：progress store 中 totalSessions < 5（新用户）
- 隐藏内容：训练场模块网格（§5.18 的 6 模块卡片区）
- 替代展示：单一"今日推荐学习路径"卡片——
  - 卡片样式：walnut-raised 底 + 1px walnut-border + 顶边黄铜发线
  - 内容：学习路径名称 + 简要描述 + "开始学习"按钮（黄铜渐变）
  - 位置：占据原模块网格位置（仪表盘中段）
- 过渡：当 totalSessions 达到 5 时，下次页面加载自动切换为完整模块网格
- 与训练场模块网格 session-count-filter（§13.6.3）协同：新手仪表盘收敛是 0-4 次阶段，session-count-filter 控制 1-5 次逐步解锁
```

#### 13.6.2 `learning-focus-mode` 学习焦点模式

用户可锁定模块，仪表盘自动聚焦该模块进度和推荐。

```
规格：
- 触发：模块卡右上角"聚焦"按钮（Pin 图标，初始 ivory-muted，锁定后 brass）
- 锁定态：仪表盘中段仅显示该模块的进度面板 + 今日推荐 + 快速入口
- 解锁：再次点击 Pin 图标或切换至其他模块
- 视觉反馈：锁定模块卡边框变为 brass（1.5px），其余模块卡 opacity 降至 0.4
- 存储：锁定状态保存在 progress store，跨会话持久化
- 适用场景：专注攻克某一模块（如考前冲刺 GTO）
```

#### 13.6.3 `session-count-filter` 入口逐步解锁

按训练次数逐步解锁模块入口。

```
解锁规则：
- 第 1 次（totalSessions = 0）：仅显示范围训练（range-trainer）
- 第 3 次（totalSessions = 2）：解锁赔率计算器（pot-odds）
- 第 5 次（totalSessions = 4）：解锁全部 6 模块

未解锁模块的视觉处理：
- 模块卡半透明（opacity 0.3）
- 显示锁定图标（Lock，Lucide，12px，ivory-muted）
- 显示灰色文字"完成 {X} 次训练后解锁"
- 不可点击（pointer-events: none）

已解锁模块：
- 正常显示（§5.18 规范）
- 首次解锁时播放 §13.8 知识节点解锁动画

与新手仪表盘收敛（§13.6.1）的协同：
- totalSessions 0-4：新手仪表盘收敛 + session-count-filter 逐步解锁联动
- totalSessions ≥ 5：完整模块网格 + 全部入口解锁
```

### 13.7 移动端教育体验

移动端（<768px）教育场景的额外视觉适配。

#### 13.7.1 阅读进度条

见 §13.3.4 `reading-progress-bar`，移动端专属组件。

#### 13.7.2 答题反馈底部 Sheet

移动端答题反馈使用底部 Sheet 替代 Modal。

```
规格：
- 样式：底部 Sheet（从屏幕底部滑入），max-height 70vh
- 背景：var(--poker-felt) + 顶部 8px 圆角
- 拖拽手柄：顶部中央 32px × 4px 横条，ivory-muted 40% 透明度
- 手势：下拉关闭（< 30% 高度自动关闭），支持 Rubber-band 回弹
- 内容区域：滚动（overflow-y: auto），与 §13.4 反馈教育脚手架一致
- 动画：slide-up 进场 300ms ease-out（§8.2），slide-down 退场 200ms ease-in
- 何时使用：移动端答题结果反馈（正确/错误/严重错误）
- 何时不用：桌面端仍使用 Modal / 内联反馈卡片
```

#### 13.7.3 概念图纵向列表

移动端概念图由横向节点图改为纵向列表。

```
规格：
- 桌面端（≥1024px）：横向节点图（ConceptGraph 现有布局）
- 移动端（<768px）：纵向列表，每个节点为独立卡片——
  - 卡片样式：walnut-raised 底 + 1px walnut-border
  - 节点标题：15px ivory，左侧带 progress-ring（§13.2.1）
  - 节点间连接：左侧 2px 竖线（walnut-border），连接相邻卡片
  - 连接线位置：卡片左侧，与 progress-ring 对齐
  - 内边距：12px 14px
  - 间距：8px（卡片间）
- 平板（768-1023px）：根据内容宽度自适应，优先横向节点图
```

#### 13.7.4 答题按钮触摸目标

移动端答题按钮 min-height 44px 触摸目标（重申 §6.3 已有规范，教育场景同样适用）。

```
规格：
- 所有答题按钮（fold/call/raise/all-in）min-height: 44px
- 按钮间距 ≥ 8px（防止误触）
- 按钮宽度 ≥ 44px（窄屏时最小宽度）
- 2×2 grid 布局（§6.3，gap 6px）
- 此规范与 §6.3 保持一致，教育场景无需额外调整
```

### 13.8 教育场景动效扩展

本节扩展 §8 动效规范，新增教育场景专属动效。所有动效沿用 §8.1 缓动/时长 token。

#### 13.8.1 正确率数字递增动画

```
规格：
- 触发：答题结果面板展示时（正确率/ELO 数值变化）
- 动画：数字从 0 递增至目标值，600ms ease-out
- 实现：framer-motion 的 animate 从 0 到目标值，使用 useSpring 或自定义计数器
- Token：duration = var(--poker-duration-standard)（300ms），可覆盖为 600ms
- 复用：§8.2 RESULT_NUMBER variant（已定义，此处落地教育场景）
- 适用场景：答题反馈的正确率展示、Dashboard 的今日正确率、进度统计
```

#### 13.8.2 知识节点解锁动画

```
规格：
- 触发：课程节点从未解锁变为已解锁状态
- 动画：
  1. POP 动画（§8.2）：scale 0.8 → 1.05 → 1，300ms spring
  2. brass 辉光渐显：box-shadow 0 0 12px rgba(232,201,126,0.3) 在 300ms 内从 0 到 1 透明度
- 辉光消退：动画完成后辉光保留 500ms，然后 500ms 渐隐
- 总时长：约 1.1s
- 适用场景：课程节点解锁、模块入口解锁（session-count-filter）、段位晋升
```

#### 13.8.3 段位晋升动画

```
规格：
- 触发：ELO 超过段位阈值
- 动画：
  1. 庄码 D（§5.3）360° 旋转（rotate，600ms ease-out）
  2. 庄码放大 scale 1.2×（同步 600ms）
  3. 庄码 brass-glow 扩散：box-shadow 从 0 0 0 扩散至 0 0 24px rgba(232,201,126,0.4)，500ms 后渐隐
  4. 新段位名称淡入（fade-in，300ms，延迟 600ms）
- 总时长：约 1.5s
- 适用场景：进度页面的 ELO 段位晋升弹窗/横幅
```

#### 13.8.4 课程完成动画

```
规格：
- 触发：课程/章节学习完成
- 动画：
  1. checkmark 描边动画：SVG checkmark 的 stroke-dasharray 从 0 到全长
  2. 动画时长：500ms ease-out
  3. 完成后 checkmark 短暂 brass 辉光（300ms），然后稳定为 success 色
- 实现：
  <svg> <path stroke="var(--poker-success)" stroke-dasharray="X" stroke-dashoffset="X" /> </svg>
  使用 CSS transition 或 framer-motion 驱动 stroke-dashoffset
- 适用场景：章末完成标记、课程完成弹窗、成就解锁标记
```

---

## 附录 J：v1.7.0 变更摘要（教育学习设计规范）

- **背景**：德州扑克训练平台（PokerLab）现有设计语言 v1.6.0 在棋牌风格一致性上已达专业水准，但教育学习场景（课程阅读、答题反馈、进度追踪、模块引导）缺乏统一的视觉语言规范。本次新增 §13 教育学习设计规范，在不引入新基础 token 的前提下，为教育场景建立完整的视觉语言体系。
- **新增 §13.1 教育设计原则**：五大原则——学习目标可见性、进步可量化、反馈即教学、渐进式披露、扫读友好。
- **新增 §13.2 学习进度可视化**：4 个新组件——`progress-ring`进度环（SVG circle stroke-dasharray，三色状态）、`sparkline`微图（8px 迷你折线图，7 日趋势）、`milestone-marker`里程碑标记（菱形标记点+ELO 标注）、`daily-goal-card`今日学习目标卡（象牙铭牌样式）。
- **新增 §13.3 课程内容排版增强**：4 个新组件——`lesson-takeaway`要点总结卡（walnut-raised 底+brass 竖线）、`formula-display`公式展示块（brass 6% 底+mono 字体）、课程标题编号系统（§2.1 格式+eyebrow 标签）、`reading-progress-bar`阅读进度条（顶部 fixed 2px brass 线，仅移动端）。
- **新增 §13.4 反馈教育脚手架**：4 个新组件——决策分析区（可折叠，展开显示 GTO 对比+原因+课程链接）、`comparison-view`对比视图（左右分栏，你的决策 vs GTO 最优）、`try-again-btn`再看一题按钮（btn-ghost+RefreshCw）、`related-lesson-chip`相关课程标签（pill 样式+ExternalLink）。
- **新增 §13.5 模块教育目的视觉区分**：6 模块图标方块增加微纹理（CSS repeating-linear-gradient，不透明度 5-8%，各模块纹理不同）+ `last-training-badge`最近训练标记（右下角"X天前"）。
- **新增 §13.6 渐进式信息披露**：3 个机制——新手仪表盘收敛（totalSessions<5 隐藏模块网格，单一学习路径卡）、`learning-focus-mode`学习焦点模式（Pin 锁定模块）、`session-count-filter`入口逐步解锁（第 1/3/5 次分阶段解锁模块）。
- **新增 §13.7 移动端教育体验**：4 项适配——reading-progress-bar（§13.3）、答题反馈底部 Sheet（替代 Modal）、概念图纵向列表（替代横向节点图）、答题按钮 44px 触摸目标（重申）。
- **新增 §13.8 教育场景动效扩展**：4 个新动效——正确率数字递增（600ms ease-out）、知识节点解锁（POP+brass 辉光 300ms）、段位晋升（庄码 D 360° 旋转+放大+辉光扩散）、课程完成（checkmark 描边动画 500ms）。所有动效沿用 §8 动效 token。
- **版本号**：v1.6.0 → v1.7.0。
- **兼容性**：所有新增组件沿用 §2 色彩 token、§3 字体、§4 间距/圆角/阴影、§8 动效 token，不引入新的基础设计 token，与牌室品牌主题无缝衔接。
