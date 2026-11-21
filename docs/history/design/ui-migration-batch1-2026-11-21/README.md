# 迁移批次 1 · 木纹壳层与密度（视觉对照记录）

> 状态：Historical。一次性视觉复核记录，不作为当前设计契约。
> 设计事实源：`DESIGN.md`；原型基准：`prototype/reference/`。

## 范围

168px 木纹侧栏、56px 木纹顶栏、12px 桌沿横梁、真椭圆牌桌（桌面 50%/50%，移动 50%/40%）、浅色牌室浅漆面、导航密度收紧。首页内容结构仍为旧仪表盘，旅程图与计划面板属批次 2，移动底栏 6→5 项属批次 3。

## 对照图

| 视图 | 文件 |
|---|---|
| 桌面深色 1440×900 | [`pc-home-dark.jpg`](./pc-home-dark.jpg) |
| 桌面浅色 1440×900 | [`pc-home-light.jpg`](./pc-home-light.jpg) |
| 移动深色 390×844 | [`mobile-home-dark.jpg`](./mobile-home-dark.jpg) |

基准：`prototype/reference/pc-home-r01.jpg`、`prototype/reference/mobile-home-r01.png`。

## 复核结论与处置

- 采纳：内圈改为顶部 Rim 光弧（贴合真椭圆）；移动端牌桌高度提升，避免统计条被桌沿裁切；统计条层级高于桌沿；侧栏行高 42→38px、组间距收紧；品牌名在 168px 下不再截断。
- 保留（与原型一致）：桌沿横梁位于顶栏正下方、单枚黄铜铆钉；浅色牌室为「浅木漆面、不叠深色导管噪波」。
- 延后：牌桌占宽由 96% 收到基准的 ~80%（随批次 2 首页重组）；移动端「今日目标」与周打卡条的层叠（批次 2 计划面板重排）；移动底栏 6→5 项（批次 3）。

## 门禁

`pnpm verify`、`pnpm build`、`pnpm size:check`、`pnpm test:e2e` 通过（e2e 升级夹具的 APP_VERSION 解析与两个重懒加载用例超时已按当前构建信息口径修正）。
