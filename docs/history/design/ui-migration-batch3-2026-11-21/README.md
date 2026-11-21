# 迁移批次 3 · IA 收编（视觉与导航记录）

> 状态：Historical。一次性验收记录，不作为当前设计契约。
> 设计事实源：`DESIGN.md`（v1.11.0 §5.24）；原型基准：`prototype/reference/`。

## 范围

主路由收编为学习路径 `/`、课程 `/lesson/:id`、训练 `/drill`、速训 `/quick`、进度中心 `/progress`；设置以纸条浮层 `/settings` 打开。范围/赔率/谜题旧入口重定向到训练枢纽（保留 query）；GTO 选择、会话、复盘、理论章节、帮助保留为次要深链。侧栏 6 项、移动底栏 5 项（训练不再弹 Sheet）。

## 视觉对齐（v2，按 pc-home-r01 重排）

- 牌桌 hero：左右象牙铭牌（ELO / 连续训练）+ 路径标语 + 状态注；移除内部统计条与今日目标卡。
- 速训横幅压薄为单行，主 CTA「开始速训」，副信息改为三枚 pill。
- 学习旅程：9 个 Level 归并为四段（入门/基础/进阶/精通），桌面横向轨道、移动纵列，每段 2 个课时 chip。
- 首页面板（旅程/今日计划/间隔复习）统一胡桃木表面；周条改为小圆点 + 日期。
- 训练场始终展示六模块网格（首访横幅与单一学习路径卡退出首页）。

对照图：[`home-top-v2.jpg`](./home-top-v2.jpg)、[`home-mid-v2.jpg`](./home-mid-v2.jpg)、[`home-bottom-v2.jpg`](./home-bottom-v2.jpg)、[`mobile-home-v2.jpg`](./mobile-home-v2.jpg)。

## 视图

| 视图 | 文件 |
|---|---|
| 训练枢纽（桌面） | [`pc-drill.jpg`](./pc-drill.jpg) |
| 课程入口（桌面） | [`pc-lesson.jpg`](./pc-lesson.jpg) |
| 进度中心 · 概览 | [`pc-progress.jpg`](./pc-progress.jpg) |
| 进度中心 · 回放 | [`pc-progress-replay.jpg`](./pc-progress-replay.jpg) |
| 设置纸条 | [`pc-settings-slip.jpg`](./pc-settings-slip.jpg) |
| 速训 | [`pc-quick.jpg`](./pc-quick.jpg) |
| 训练枢纽（移动） | [`mobile-drill.jpg`](./mobile-drill.jpg) |
| 首页 · 5 项底栏（移动） | [`mobile-home-5nav.jpg`](./mobile-home-5nav.jpg) |

## 关键处置

- **L1 先修**：`/lesson` 与 `/lesson/:id` 在「基础入门」未完成时转到 `/academy/basics`，完成后进入 `l1-basics`，避免新用户直接落到锁定页（原 `/academy/basics` 重定向已撤销，作为正式先修页保留）。
- **课程入口**：`/lesson` 由学院数据源 `findNextLesson` 解析下一课；理论命名空间 `theory:` 转 `/theory/chapter/:id`。
- **设置**：`SettingsRoute` 复用既有设置分区，以 `ui/Dialog` 纸条宿主呈现，关闭回首页。
- **进度中心**：三分区 tab（概览 / 回放 / 排行），吸收每日挑战、多变体 ELO、成就、进步回放、情绪与最近训练；排行直接渲染本模块 Leaderboard；手牌复盘经链接进入 `/hand-history`（不跨模块嵌入）。
- **E2E**：新增 `e2e/ia-navigation.test.ts`；SPA 导航取消的 `net::ERR_ABORTED` 视为导航语义（4xx/5xx 仍严格失败）；训练夹具按当前 origin 深链，兼容离线升级的自定义端口站点。

## 门禁

`pnpm verify`、`pnpm build`、`pnpm size:check`、`pnpm test:e2e`（含离线、升级、持久化失败、移动导航与新 IA 用例）通过。
