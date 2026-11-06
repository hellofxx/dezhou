# shared 层专项现状模型（2026-11-06）

> 状态：Snapshot · 证据基线 2026-11-06 · 工作树。
> 场景技能：`system-modeler`；图源格式：`graphviz`（architecture-visualization 插件）。

## 范围

- **系统**：PokerLab 德州扑克训练平台（`f:/code/dezhou`）。
- **层级**：L3 模块/包 + L4 文件级引用，重点回答**共享层 `src/shared` 的引用现状**。
- **不在范围**：运行时部署、性能、风险整改、目标架构。L1/L2 上下文沿用父目录 C4 快照，不在本目录重画。
- **基线说明**：模型反映**工作树**，不是某个干净提交；采集时仓库存在并发写入，随后由并发提交落库。src 侧引用计数在采集前后一致（1128 文件 / 88 shared 生产文件 / 650 条直接入边）。

## 阅读顺序

| 顺序 | 文件 | 回答的问题 |
|---|---|---|
| 1 | [`shared-layer.summary.md`](shared-layer.summary.md) | 结论先行：shared 是什么形状、谁在用、有哪些边界 |
| 2 | [`10-shared-consumers.dot`](10-shared-consumers.dot) | 10 个模块 + 外壳 → shared 四层，规模多大 |
| 3 | [`20-shared-internals.dot`](20-shared-internals.dot) | shared 内部谁依赖谁，底座与装配体 |
| 4 | [`30-shared-runtime-channels.dot`](30-shared-runtime-channels.dot) | 事件总线、依赖倒置注册表、调试开关 |
| 5 | [`shared-layer.evidence.md`](shared-layer.evidence.md) | 每个数字的出处、口径、假设与未知项 |
| 6 | [`shared-fanin-appendix.md`](shared-fanin-appendix.md) | 88 个生产文件的逐文件 fan-in |

## 核心数字（采集时点）

- 10 个 feature 模块、44 条懒加载路由、88 个 shared 生产文件（14 个子域）。
- **650 条直接 shared 入边** = feature 634 + shell 16。
- 四层：契约 208 / 逻辑 205 / 组件 206 / 运行时 31。
- shared 内部 104 条边；`shared → feature` **0** 条；feature 间 44 条边全部指向 progress。
- 39 个 shared 文件恰好 2 个传递消费者；2 个测试桩 0 生产消费者；1 个 ui 组件仅 shell 消费；admission baseline 为空。

> 数字是 2026-11-06 快照。长期事实以代码 + `pnpm test src/shared/admission-guard.test.ts` 为准。

## 口径

- 边 = `importer 文件 → 解析后的目标文件` 去重 import 对，不是语句数。
- 直接消费者 = 直接 import 该 shared 文件的模块/外壳；传递消费者 = 沿 shared 内部 import 反向闭包累计（准入守卫口径）。
- 测试文件不计入生产边；解析支持 `@/` 别名、相对路径、`index.ts` barrel、静态/动态 import。

## 与父目录的关系

- 父目录 [`../README.md`](../README.md) 是整体当前态模型（C4 / 模块依赖 / 训练数据流 / progress 中枢），证据基线为 2026-08-30，尚未包含本次刷新。
- 本目录只替换 **shared 引用的 L3/L4 事实**；跨模块边、路由、持久化等父模型数值仍以其自身基线为准。
- 若后续整体复核，优先按父目录 `00-evidence.md` §5 刷新，再把本目录的 shared 数字并入。

## 刷新方法

1. 按 [`shared-layer.evidence.md`](shared-layer.evidence.md) §9 重跑复核命令。
2. 若结构与数字变化，先改 `.dot` 文本，再同步 summary / evidence / appendix；不要手改导出图片。
3. 运行 `pnpm test src/shared/admission-guard.test.ts`，确认 shared 准入仍全绿。
4. 本目录新增/删除文件后，确认父 README 的链接仍有效（`pnpm docs:check`）。

## 已知限制

- import 图 ≠ 运行时调用图；不做 bundle/tree-shaking 归属分析。
- `components/academy/index.ts` 是唯一 barrel，模型粒度到 barrel，不展开单组件使用率。
- 运行时通道（事件总线/注册表/debugMode）是高置信调用点证据，但未做运行时埋点验证。
