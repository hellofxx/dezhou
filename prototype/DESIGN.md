# PokerLab · 牌室学院原型 · 设计规范（DESIGN.md）

> 提取自仓库根 `DESIGN.md` v1.10.0「Private Card Room 私人牌室」设计契约；本文件仅约束 `prototype/` 原型。
> 所有色值/规格为契约登记值；原型新增组件（旅程图、速训计时）标注「原型新增」。未经神火采用图对照，视觉以契约为准。

## 0. 采用图出处与优先级（2026-11-21 整组确认后登记）

- 采用基准：`reference/pc-home-r01.jpg`（var_6dae4c19effb，sha256 a8bb4690…ee721）与 `reference/mobile-home-r01.png`（var_19e89eff866f，sha256 2ad98864…7c604），神火「软件原型设计师」Pro · 1.5K；确认原话「认可，生成HTML 交互原型」，记录见 `../design-review/board.json` 与 `prototype.json`。
- 优先级：用户最新决定 → 采用图 → 本契约 → 通用 UX 补缺。
- 从采用图吸收的材质增强：胡桃木细纹理（侧栏/顶栏/面板）、绿呢桌缘顶部 Rim 光弧、旅程轨道段间黄铜节点点；均已落入 CSS 且仅用契约色族。
- 木纹实现（`assets/wood.js`）：启动时 canvas 程序化生成 512² 无缝胡桃木纹理（整数频率 value-noise fbm、逐轴周期回绕、各向异性频率 + 山纹微扭曲），注入 `--wood-h/--wood-v`；CSS 仅保留纯轴向细纹回退。禁止斜向条纹渐变冒充木纹。
- **不采纳的采用图偏差**（生成缺陷，非设计意图；内容正确性以契约与 requirements 为准）：PC 训练场 4 列含 2 空槽（契约 3×2，保持 3×2）；移动端旅程缺阶段/芯片乱码/周标签重复/今日计划缺失/训练场非 2 列 6 卡（HTML 按契约完整实现）。
- 其余 4 视图无采用图：视觉由基准契约延伸，已在 `prototype.json` 逐页登记。

## 1. 气质与材质

- 场域感优先：打开即「落座牌桌」。页面暗角晕影 + 黄铜灯晕模拟台灯只照亮牌桌。
- 材质契约：**Walnut 胡桃=房间**（侧栏/顶栏 L 形木框）、**Felt 绿呢=画布**（牌桌/场景卡）、**Ivory paper 象牙纸=纸条**（一切浮层）、**Brass 黄铜=镶嵌**（发线/主 CTA/焦点环，不做大面积表面）。
- 三不：无纯黑 `#000`、无纯白 `#fff`、除语义色外只有黄铜一种强调色。反霓虹（禁 `#4ade80/#f87171/#60a5fa/#fbbf24`）。
- 跨页签名：顶栏正下方 `.table-rail` 桌沿铜钉（14px，中央 8px 铆钉），绝不可删。

## 2. 色彩 Token（`:root`，前缀省略 `--poker-`）

| 家族 | Token | 值 | 角色 |
|---|---|---|---|
| Felt | felt-deep / felt / felt-raised / felt-light / felt-center | `#0e1a14` / `#15301f` / `#1d4029` / `#245035` / `#1f5233` | 页面底 / 面板 / 抬升 / 边框 / 桌心 |
| Walnut | walnut / walnut-raised / walnut-border / walnut-light | `#241a10` / `#3a2a18` / `#4a3825` / `#4d3a24` | 房间 / 抬升 / 1px 边 / 亮边 |
| Ivory | ivory / ivory-dim / ivory-muted | `#f3ebd9` / `#cabf9f` / `#b0a68c` | 主文字 / 次级 / 说明 |
| Brass | brass / brass-bright / brass-deep / brass-dark / brass-muted | `#c9a25e` / `#e8c97e` / `#a07d3d` / `#8a6b30` / `#b09050` | 强调 / 高亮 / 按压 / 深纹 / 中阶 |
| 语义 | success / danger / warning / info / freeze | `#7fb883` / `#c25a4c` / `#c9a25e` / `#8ba59b` / `#a8c4cf` | 苔藓绿 / 陶土红 / 黄铜同色 / 鼠尾草 / 霜钢蓝；各配 12% `-bg` |
| 文字阶 | brass-text / danger-text / sage-text / ivory-muted | `#c9a25e` / `#e3907b` / `#9fc0a9` / `#b0a68c` | 只作 color，不作填充 |
| 装饰 | gold / bronze / clay / indigo(-bright) / terra(-bright) / leather | `#d4a84b` / `#cd7f32` / `#a83838` / `#4a5a7a`(`#8ea4c4`) / `#965a3e`(`#c98a63`) / `#c08a5a` | 徽章 / 筹码 / 模块主题 |
| 花色 | heart·diamond / club·spade | `#d04545` / `#f3ebd9` | 酒红 / 象牙（暗底可见） |

纸张色板（仅 `.dealer-slip` 作用域重锚）：paper `#f4ecda` / paper-raised `#faf4e6` / paper-edge `#d6c8a8` / paper-ink `#241c10` / paper-ink-dim `#4f452f` / paper-ink-muted `#6f6449` / paper-brass `#8a641f` / paper-success `#2f6b3a` / paper-danger `#a63f30` / paper-info `#3f6b5c`。纸上文字 ≥4.5:1，主文字 ≥7:1。

浅色主题「白天牌室」：`html[data-theme=light]` 只翻原语——felt-deep `#e9e1cd`、felt/felt-raised `#f4eee0/#faf6ea`、walnut/raised `#efe8d6/#e4dac1`、ivory 系 `#2a2113/#4c4230/#665b43`、brass-text `#7d5c22`、语义文字深阶；**绿呢牌桌/场景卡/牌背保持深色物理物件**。

## 3. 字体与字阶

- Fraunces（opsz 144, SOFT 30, WONK 1）标题/铭牌/大数字；Inter Tight 正文/UI；JetBrains Mono 一切数值（tabular-nums）。中文回退 Source Han Serif SC / system-ui。禁中文斜体。
- Hero 48–60 / 壳层 h1 22 / 面板 h2 15–16 / 小节 13–14 / 正文 12–13 / 说明 10–11 / eyebrow 9–10 uppercase tracking .2em / 铭牌数值 28–36 / 课程正文 14 leading 1.7（65ch 阅读列）/ 课程标题 20。

## 4. 间距 · 圆角 · 阴影

4px 基准（4/8/12/16/20/24/32/40）；圆角 sm 4 / md 8 / lg 12 / xl 16；牌桌椭圆 `50%/32%`。阴影 sm `0 1px 3px rgba(0,0,0,.35)` / 默认 `0 4px 14px .45` / lg `0 12px 40px .55` / 黄铜 CTA `0 2px 6px rgba(0,0,0,.45),0 6px 18px rgba(201,162,94,.28),inset 0 1px 0 rgba(255,240,200,.55)`。雕刻发线 `linear-gradient(90deg,transparent,rgba(201,162,94,.5),transparent)`。

## 5. 组件规格

| 组件 | 规格要点 |
|---|---|
| 侧栏 240px | 胡桃渐变 `#241a10→#1a1308`，右 1px 黄铜渐变分隔；分组 eyebrow 序号 01–04；active 黄铜字 + 左 8% 黄铜底 + 右 22px 庄码 D |
| 顶栏 h-16 | 胡桃梁，唯一 h1（序号眉标 + 发线 + 页名）；右 streak 徽章 / 主题 / 设置 |
| 按钮金属族 | 一级 `.btn-brass` 渐变 `#f0d48a→#c9a25e→#a07d3d` + 深墨字 `#1a1308`；二级深胡桃金属 `#4a3218→#2a1c0a` + 黄铜亮字；三级 quiet 透明。禁纯色平铺主按钮 |
| 平权答题选项 | fold 陶土 16% 透底 + 0.55 边 / call 胡桃实色 + 象牙字 / raise 黄铜渐变 + 深墨字；三者权重相当；答前不得出现 success/danger |
| 面板 `.panel` | 胡桃渐变 + 1px `#4a3825` + 8px 圆角 + 20px padding；活面板顶部黄铜发线 + live-dot 呼吸 |
| 铭牌 `.plaque` | 象牙渐变 `#f3ebd9→#e8dcc0` + 黄铜边 + 内描金双环；大数值 Fraunces / 标签 9px uppercase |
| 扑克牌 | 5:7.1（42×60 / 56×80 / 76×108），象牙渐变牌面 + 45° 暗纹，角标 rank+suit；牌背胡桃 + 45° 黄铜条纹 + 2px 黄铜边 |
| 筹码 | 正圆径向渐变（35% 35% 高光），brass/clay/frost 三色 |
| 场景卡 | 深绿渐变 + 黄铜 22% 边 + 3px inset 虚线黄铜圈（发牌员圈）+ 位置徽章 + 手牌 + font-numeric 底池 |
| 五级反馈 | `.grade-best/good/ok/wrong/blunder`：苔藓绿/黄铜/鼠尾草/陶土低透底 + 左 3px 色条；正确 pop、错误 shake |
| 对比视图 | 左「你的决策」danger-bg / 右「GTO 最优」brass-glow，差异虚线标记 |
| 纸条 `.dealer-slip` | paper 底 + edge 边 + 4px 圆角 + 顶部内缩发线 + 中央 10px 黄铜钉 + 暖投影 `0 18px 40px rgba(20,14,6,.45)`；入场 300ms translateY(8px)+fade |
| 进度环 | SVG circle stroke-dasharray；未开始 walnut-border 30% / 进行中 brass / 完成 success；40/56px |
| 旅程图（原型新增） | 横向黄铜轨道连接 4 阶段节点；节点=进度环+阶段铭牌+课程芯片（done 钢印/current 黄铜脉冲/locked 锁）；当前阶段灯晕；<1024px 纵向列表 |
| 周打卡条 | 骑 arena 下缘 -14px；brass-6%→walnut→moss-5% 渐变；火焰+天数 / 7 圆点 / 冻结卡 / 今日正确率 + sparkline |
| 训练场模块卡 | 胡桃渐变 + 黄铜 12% 边 + 40px 图标方块（各模块微纹理 ≤8%）+ hover translateY(-2px)；右下最近训练标记 |
| 钢印 `.stamp` | 深胡桃半透底 + 黄铜字 + 细边；「已完成」不用绿对勾 |

## 6. 布局与响应式

- 桌面 ≥1024：L 形木框（侧栏+顶栏）包绿呢画布；内容 L1 收敛 1400px；阅读页 xl 起「768 阅读列 + 264 学习导轨」。
- 平板 768–1023：grid 降单列，训练场 2 列。
- 移动 <768：侧栏隐藏→底部 mobile-nav（≥44px 触摸目标）；顶栏 50px；table-rail 10px；arena `50%/28%` 紧凑三分区；面板 padding 12px；答题按钮 2×2 grid min-height 44px；课程页顶部 2px 阅读进度条；禁横向滚动。
- Z 轴：背景 0 / 灯晕 1 / 壳 2 / rail 3 / 牌桌物件 5 / 顶栏侧栏 10–20 / 移动底栏·toast 50 / 纸条浮层 100。

## 7. 动效

缓动 standard `cubic-bezier(.4,0,.2,1)` / out `cubic-bezier(0,0,.2,1)` / spring `cubic-bezier(.34,1.56,.64,1)`；时长 fast 150–200 / standard 250–350 / slow 400–600 / loop 1.5–3s。入场 slide-up+fade stagger 60ms（整页 ≤600ms）；正确 pop 400ms spring / 错误 shake 200ms；数字 count-up 600ms ease-out；解锁 POP+黄铜辉光 1.1s；live-dot 1.8s 呼吸。只用 transform/opacity；`prefers-reduced-motion` 与设置内动效开关全局降级。

## 8. 图标

Lucide 风格内联 SVG（1.5px stroke，16/20/24px），禁 emoji 充当 UI 图标；语义图标跟随语义色；品牌 ♠ 黄铜。原型以 SVG path 内联实现，离线可用。