# 迁移批次 2 · 学习路径首页（视觉对照记录）

> 状态：Historical。一次性视觉复核记录，不作为当前设计契约。
> 设计事实源：`DESIGN.md`；原型基准：`prototype/reference/`。

## 范围

`/` 由旧仪表盘替换为 JourneyHome：牌桌 → 连续天数 → 速训横幅 → 学习旅程 → 今日计划 + 间隔复习 → 训练场。学习旅程经 `AcademyDataSource.getLearningStagesSnapshot()` 读取当前变体的 Level 序列（9 段），按先修 Level 解锁；每段最多 3 个课时 chip，面板头提供「全部课程」入口。原型为 4 段 × 2 课，本应用课程为 9 个 Level × 9–12 课，属数据适配。

## 对照图

| 视图 | 文件 |
|---|---|
| 桌面首屏 | [`pc-home-top.jpg`](./pc-home-top.jpg) |
| 桌面旅程面板 | [`pc-journey.jpg`](./pc-journey.jpg) |
| 桌面整页 | [`pc-home-full.jpg`](./pc-home-full.jpg) |
| 移动首屏 | [`mobile-home-top.jpg`](./mobile-home-top.jpg) |
| 移动旅程面板 | [`mobile-journey.jpg`](./mobile-journey.jpg) |

## 复核结论与处置

- 采纳：旅程 9 段改 3×3 网格消除孤立行；阶段图标由数据 emoji 改为单色线稿（Sprout/TrendingUp/…）；速训横幅增加「开始速训」主 CTA；旅程头增加「全部课程」入口；移动端隐藏 hero 说明条与今日目标卡；统计卡等高且卡片不透明；周条 7 格等分并保留右侧内边距；移动端装饰牌堆上移缩放避免遮挡统计卡；速训模式 chip 命中区 ≥44px。
- 保留：原型的 8 段→本应用 9 段的适配、每段 3 chip 上限（完整课程经「全部课程」进入）。
- 延后：移动底栏 6→5 项、设置/训练的 5 视图收编属批次 3；历史回顾型大盘（每日挑战 / ELO / 成就 / 回放 / 情绪 / 最近训练）在批次 3 迁入 `/progress`。

## 门禁

`pnpm verify` 通过；`pnpm build` 后执行 `pnpm test:e2e`（批次 2 不涉及路由表与离线协议改动，浏览器发布门禁在批次 3 汇总复跑）。

## 数据契约

`AcademyDataSource.getLearningStagesSnapshot()` 由 strategy-academy bootstrap 注册，按 `activeVariant` 缓存稳定引用；progress 侧 `useAcademyLearningStages()` 消费，保持 `progressPublicApi` 守卫（不深引学院模块）。
