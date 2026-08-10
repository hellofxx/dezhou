# 移动端页面评审报告

> 范围：德州扑克训练平台（React 19 + Vite + Tailwind + Radix + framer-motion）的 PWA 移动端体验
> 评审维度：性能 / 视觉交互 / 适配兼容 / 可访问性 / 移动端特有交互
> 结论：**基础扎实**（代码分包、路由懒加载、designTokenGuard、focus-visible、prefers-reduced-motion、Radix Dialog 语义均已具备），下面只列**针对性优化点**与可直接落地的修复方案。

---

## 一、总体评分（估算）

| 维度 | 评级 | 主要缺口 |
|---|---|---|
| 页面加载性能 | B | 字体 `@import` 重复且阻塞渲染；3 个字体族全量加载 |
| 视觉与交互 | B+ | 关闭按钮命中区 <44px；`backdrop-blur` 移动端开销；缺少流式字号 |
| 适配与兼容 | C+ | `viewport-fit=cover` 缺失 → 安全区失效；`100vh` 视口坑；无 `color-scheme` |
| 可访问性 | B | 每页存在**两个 h1**（顶栏 + 页面内容）；对比度未做成对校验 |
| 移动端特有交互 | C | 软键盘 `interactive-widget` 未设；`touch-action`/`overscroll` 缺失；点按高亮未处理 |

---

## 二、页面加载性能

### 问题 1：字体 `@import` 重复且阻塞首屏 ⚠️ 高
`src/styles/globals.css:2` 的 `@import url('https://fonts.googleapis.com/...')` 是一行 **CSS `@import`**，它会阻塞后续样式解析；而 `index.html` 里已经有 `<link rel="preconnect">` + `<link rel="stylesheet">` 加载同一批字体——**双重加载、且 CSS @import 比 link 更晚生效**。

**修复**：删除 `globals.css` 第 2 行的 `@import`，只保留 `index.html` 的 link（已用 `display=swap`）。进一步用 `preload` 提前：

```html
<!-- index.html：替换普通 stylesheet link 为 preload+onload -->
<link rel="preload" as="style"
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter+Tight:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap"
      onload="this.onload=null;this.rel='stylesheet'">
<noscript>
  <link rel="stylesheet" href="https://fonts.googleapis.com/...&display=swap">
</noscript>
```

### 问题 2：字体族过多、权重全量 ⚠️ 中
移动端下载 3 个字体族（Fraunces 含可变轴、Inter Tight、JetBrains Mono）共全权重。建议：
- 自托管 `@fontsource/fraunces` 等，利用 Vite 产出 woff2 并走分包缓存，去除第三方 RTT；
- 仅保留用到的权重（标题 600/700、正文 400/500），删除 300/…冗余；
- 中文场景若无自定义中文字体则**不要**引入中文字体族（系统字体即可），当前未引入，保持。

### 问题 3：首屏资源未做关键预取 ⚠️ 低
`vite.config.ts` 的 `manualChunks` 已拆分 vendor，良好。补充：对首屏关键 chunk 加 `<link rel="modulepreload">`（Vite 构建后可在 `index.html` 注入），并对 `framer-motion` 等重依赖确认是否被首屏页面需要。

### 问题 4：图片懒加载（当前无 `<img>`，预防性） ℹ️
全项目无位图 `<img>`（纯 SVG/CSS），当前无风险。若未来加入图片/头像，统一：
```tsx
<img src={...} alt={...} loading="lazy" decoding="async" />
```

---

## 三、视觉与交互体验

### 问题 5：Dialog 关闭按钮命中区过小 ⚠️ 高
`src/shared/components/ui/dialog.tsx:45` 的 `DialogPrimitive.Close` 图标仅 `h-4 w-4`（16px），远低于 44px 触控建议，且绝对定位在右上角易误触。

**修复**：扩大可点击区（用 `p-2` 撑到 ≥32px，外层再给 `min-h/min-w-[44px]` 包裹）：
```tsx
<DialogPrimitive.Close
  className="absolute right-3 top-3 grid place-items-center h-11 w-11 rounded-md opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
>
  <X className="h-5 w-5" aria-hidden="true" />
  <span className="sr-only">{t('common.close')}</span>
</DialogPrimitive.Close>
```

### 问题 6：`backdrop-blur` 移动端 GPU 开销 ⚠️ 中
`MobileNav`（`.walnut-panel`）、`AppLayout` 顶栏 `backdrop-blur-sm`、`.felt-ambient` 等多处使用毛玻璃。低端机滚动掉帧。

**修复**：在 `prefers-reduced-transparency` 或窄屏下降级为实色：
```css
@media (max-width: 768px) {
  .walnut-panel, header { backdrop-filter: none; background: var(--surface); }
}
@media (prefers-reduced-transparency: reduce) {
  * { backdrop-filter: none !important; }
}
```

### 问题 7：缺少流式字号（Fluid Type） ⚠️ 低
标题使用固定 `text-[28px]` 等，跨尺寸跳变。建议引入 `clamp()` 标尺（可在 `globals.css` 增加工具类）：
```css
.text-fluid-h1 { font-size: clamp(1.5rem, 1.1rem + 2vw, 2rem); }
.text-fluid-body { font-size: clamp(0.95rem, 0.9rem + 0.3vw, 1rem); }
```

### 问题 8：动画流畅度 ⚠️ 低
已全局处理 `prefers-reduced-motion`。补充：对频繁动画的元素加 `will-change: transform`（仅动画期间），并用 `transform/opacity`（而非 `top/left/width`）做动画——现状 `translate-x/-y` 已符合，保持。

---

## 四、适配与兼容性

### 问题 9：`viewport-fit=cover` 缺失 → 安全区形同虚设 ⚠️ 高
`index.html:5` 为 `width=device-width, initial-scale=1.0`，**没有 `viewport-fit=cover`**。iOS 上 `env(safe-area-inset-bottom)` 在没有该声明时会回退为 `0`，导致 `MobileNav.tsx:32` 的 `pb-[env(safe-area-inset-bottom,0px)]` 实际为 0——底部导航条会压在 Home Indicator 上。

**修复**：
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```
保留 `MobileNav` 与 `main` 的 `pb-20`/`pb-[env(...)]` 不变（已正确）。

### 问题 10：`100vh` 移动视口坑 ⚠️ 中
`globals.css` 与 `ErrorBoundary.tsx` 使用了 `100vh`。移动浏览器地址栏伸缩会让 `100vh` 大于可见区，导致内容被裁切/滚动异常。

**修复**：改用动态视口单位并向下兼容：
```css
/* globals.css & ErrorBoundary */
min-height: 100vh;
min-height: 100dvh;
```

### 问题 11：未声明 `color-scheme` ⚠️ 中
当前仅暗色主题，但原生滚动条、表单控件、`<select>` 弹层在浅色系统下可能以浅色渲染，造成割裂。

**修复**：在 `:root` 显式声明（同时给未来浅色主题留接口）：
```css
:root { color-scheme: dark; }
@media (prefers-color-scheme: light) {
  /* 若未来支持浅色：在此覆盖 --felt/--ivory 等 token */
}
```

### 问题 12：横屏（landscape）未优化 ⚠️ 中
手机横屏时，`MobileNav` 固定底部全宽会占据宝贵竖向空间，且 `TableRail`（桌面侧栏）在横屏可能挤占。

**修复**：横屏小高度下将底部导航改为更紧凑或侧边：
```css
@media (orientation: landscape) and (max-height: 500px) {
  nav[aria-label="主导航"] .label-text { display: none; } /* 仅图标 */
}
```
并确认 `TableRail` 在窄竖屏被隐藏（现状 `hidden md:flex`，符合）。

### 问题 13：系统暗黑模式兼容 ⚠️ 低
应用本身是暗色默认，系统暗黑模式下表现一致（✓）。若要做到"跟随系统可切换"，需补充浅色 token 集 + 主题切换；当前属产品设计取舍，记录即可。

---

## 五、可访问性（WCAG 2.1 AA）

### 问题 14：每页存在两个 `<h1>` ⚠️ 高（屏幕阅读器大纲破坏）
`AppLayout.tsx:282` 顶栏渲染 `<h1>{currentPageTitle}</h1>`，而每个页面内容（如 `PotOddsQuizPage.tsx:288`、`RangeTrainerHome.tsx:81` 等 20+ 处）又各自渲染一个 `<h1>`。结果**每页 ≥2 个 h1**，屏幕阅读器"标题导航"失效，且 `currentPageTitle` 与页面标题往往重复。

**修复**：顶栏标题降级为非标题元素（它本就是"当前位置指示"，不是文档主标题）：
```tsx
{/* AppLayout 顶栏：改为 p/span，不抢 h1 */}
<p className="font-display text-[17px] text-[var(--ivory)] flex-1 tracking-wide" aria-hidden="true">
  {currentPageTitle}
</p>
```
保留各页面自身的 `<h1>` 作为唯一文档标题。并检查页面内标题层级严格递增（h1→h2→h3，不跳级）。

### 问题 15：色彩对比度未做"成对"校验 ⚠️ 中
设计 token 整体偏暗底亮字，基础对比良好，但 `--ivory-muted`(#b9c2ba)、`--ivory-dim` 等次要文字叠加在 `--surface`/`--panel` 上时，对比度需实测确认 ≥4.5:1（小字）/3:1（大字）。项目已有 `designTokenGuard.test.ts` 守卫调色板，但未断言**前景/背景配对比值**。

**修复**：在测试内增加配对断言，或接入 `jest-axe`/`axe-core` 做运行时校验：
```ts
// 示例：对关键文本 token 断言
expect(contrast('--ivory', '--felt')).toBeGreaterThanOrEqual(4.5);
expect(contrast('--ivory-muted', '--surface')).toBeGreaterThanOrEqual(4.5);
```
并补充 CI 步骤：`npx @axe-core/cli` 对 `pnpm preview` 跑 `wcag2aa`。

### 问题 16：焦点环在部分控件被 `outline-none` 覆盖 ⚠️ 中
全局 `*:focus-visible{outline:2px solid brass}` ✓，但 Radix Dialog 关闭按钮、部分 `Button` 用 `focus:outline-none focus:ring-2 focus:ring-ring`。需确保 `--ring` 是高对比色且环宽 ≥2px（建议与 `focus-visible` 统一为 brass），避免"键盘可见 / 指针不可见"不一致。

**修复**：统一焦点Token：
```css
:where(a,button,input,select,textarea,[tabindex]):focus-visible{
  outline: 2px solid var(--brass-bright);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
```

### 问题 17：动态反馈需 `aria-live` ⚠️ 中
训练结果/Toast 类反馈应声明 `role="status" aria-live="polite"`，错误用 `role="alert"`。请核对 `ResultSummary` 及各类反馈卡片是否已挂载 live region（Radix `Toast` 默认带 `aria-live`，自研反馈需手动加）。

### 问题 18：色彩非唯一信息载体 ⚠️ 低
五级反馈 `best/correct/inaccuracy/wrong/blunder` 当前用色+文字，符合"颜色不单独传达信息"。保持；图标也建议带 `aria-label`。

### 问题 19：语义地标已具备 ✅
`<main>`、`<header>`、`<nav aria-label="主导航">` 齐全；`<html lang="zh-CN">` 正确。保持。

---

## 六、移动端特有交互

### 问题 20：`interactive-widget` 未设置 → 软键盘顶起布局 ⚠️ 高
未声明时浏览器默认 `resizes-visual`（可视视口缩放、布局不动），软键盘弹出会**遮挡输入框且页面不收缩**，表单页（pot-odds 等）体验差。

**修复**：
```html
<meta name="interactive-widget" content="resizes-content">
```
配合输入框聚焦时滚动入视野（见问题 21）。

### 问题 21：输入框被底部导航遮挡 ⚠️ 中
`AppLayout.tsx:321` 的 `main` 有 `pb-20`（80px）预留给 MobileNav，但软键盘弹出后聚焦的输入框若落在底部，仍可能被键盘盖住。

**修复**：为表单容器加滚动留白与聚焦滚动：
```css
form { scroll-margin-bottom: 96px; }
/* 聚焦时确保可视 */
input:focus, textarea:focus { scroll-margin-bottom: 120px; }
```

### 问题 22：缺少 `touch-action: manipulation` ⚠️ 中
未禁用双击缩放/300ms 延迟，触控点击有迟滞，且易误触发缩放。

**修复**：全局加（保留 `user-scalable` 可访问性，仅禁双击缩放延迟）：
```css
@media (pointer: coarse) {
  a, button, [role="button"], input, select, textarea {
    touch-action: manipulation;
  }
}
```

### 问题 23：iOS 点按高亮 & 文本选择 ⚠️ 低
**修复**：
```css
* { -webkit-tap-highlight-color: transparent; }       /* 用焦点环代替系统高亮 */
button, .no-select { -webkit-user-select: none; user-select: none; }
p, article { -webkit-user-select: text; user-select: text; } /* 内容可复制 */
```

### 问题 24：`overscroll-behavior` 未设 ⚠️ 低
滚动容器下拉会触发整页/浏览器级刷新。

**修复**：
```css
main, .scroll-y { overscroll-behavior-y: contain; }
```

### 问题 25：手势操作（可选增强） ℹ️
当前交互以"点按"为主，符合移动端。若希望在训练/复盘页加入左右滑动切换（上一题/下一题），可用 framer-motion 的 `drag` 或 Pointer 事件，并**必须提供等效按钮**（不可仅靠手势完成核心操作，否则违背可访问性）。

---

## 七、落地优先级建议

| 优先级 | 项 | 工作量 |
|---|---|---|
| P0（必改） | #9 viewport-fit=cover、#14 双 h1、#20 interactive-widget、#5 Dialog 关闭区 | 小 |
| P1 | #1 字体 @import、#10 100dvh、#11 color-scheme、#22 touch-action、#16 焦点统一 | 小 |
| P2 | #15 对比度成对校验、#17 aria-live、#6 backdrop-blur 降级、#21 键盘布局、#24 overscroll | 中 |
| P3 | #2 字体自托管、#3 modulepreload、#7 流式字号、#12 横屏、#23 点按高亮、#25 手势 | 中 |

> 所有 WCAG 相关修复后，建议把 `axe-core`/`jest-axe` 接入 `pnpm verify`（与现有 designTokenGuard 并列），形成回归门禁。

---

## 八、可复用的快速修复补丁（汇总）

1. `index.html`：`viewport` 加 `viewport-fit=cover`；加 `<meta name="interactive-widget" content="resizes-content">`；字体 link 改 preload。
2. `globals.css`：删除第 2 行 `@import`；增加 `:root{color-scheme:dark}`、`100dvh` 兼容、`touch-action`/`overscroll`/`tap-highlight` 媒体规则、`focus-visible` 统一环。
3. `AppLayout.tsx:282`：顶栏 `<h1>` → `<p aria-hidden>`。
4. `dialog.tsx:45`：关闭按钮扩到 44×44 命中区。
5. `ErrorBoundary.tsx` / `globals.css`：`100vh` → `100dvh`。
6. 测试：新增对比度配对断言 + `jest-axe` 冒烟测试，并入 CI。
